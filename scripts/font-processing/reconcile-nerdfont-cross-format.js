import path from 'node:path';

const WEIGHT_BY_SUFFIX = [
  [/\b(?:extra\s*light|ultra\s*light|extralight|ultralight)\b/i, 200],
  [/\b(?:semi\s*bold|demi\s*bold|semibold|demibold)\b/i, 600],
  [/\b(?:extra\s*bold|ultra\s*bold|extrabold|ultrabold)\b/i, 800],
  [/\b(?:hairline|thin)\b/i, 100],
  [/\blight\b/i, 300],
  [/\bmedium\b/i, 500],
  [/\bbold\b/i, 700],
  [/\b(?:black|heavy)\b/i, 900],
  [/\bregular\b/i, 400],
];

const normalize = (value) => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');

function namedWeight(subfamily) {
  const value = normalize(subfamily).replace(/\s+(italic|oblique)$/, '');
  return WEIGHT_BY_SUFFIX.find(([pattern]) => pattern.test(value))?.[1] ?? null;
}

function comparableStem(asset) {
  const label = asset?.source_label;
  const relativePath = String(asset?.relative_path || asset?.filename || '').replace(/\\/g, '/');
  let prefix;
  if (label === 'nerdfonts' && relativePath.startsWith('NerdFonts/')) prefix = 'NerdFonts/';
  else if (label === 'webfont-nerdfonts' && relativePath.startsWith('NerdFonts Web Fonts/')) prefix = 'NerdFonts Web Fonts/';
  else return null;

  const relative = relativePath.slice(prefix.length);
  const extension = path.posix.extname(relative).toLowerCase();
  if (!['.otf', '.woff', '.woff2'].includes(extension)) return null;
  return { stem: relative.slice(0, -extension.length), extension };
}

/**
 * Reconcile only a WOFF/WOFF2 weight metadata error when an exact same-cut
 * Nerd Fonts OTF sibling independently agrees on family, subfamily, italic
 * state, and the weight encoded by the subfamily. This never infers weight
 * from a filename alone and leaves unresolved cases untouched.
 */
export function reconcileNerdFontCrossFormatWeights(report) {
  if (!report || !Array.isArray(report.queue_items)) {
    throw new TypeError('Expected a discovery report with queue_items array');
  }

  const result = structuredClone(report);
  const summary = [];

  for (const queue of result.queue_items) {
    const assets = Array.isArray(queue.assets) ? queue.assets : [];
    const otfByKey = new Map();

    for (const asset of assets) {
      const location = comparableStem(asset);
      const metadata = asset.metadata || {};
      if (!location || location.extension !== '.otf' || metadata.status !== 'parsed') continue;
      if (!metadata.family_name || !metadata.subfamily_name || !Number.isInteger(metadata.weight_class)
        || typeof metadata.is_italic !== 'boolean') continue;
      const key = [location.stem, normalize(metadata.family_name), normalize(metadata.subfamily_name), metadata.is_italic].join('|');
      const matches = otfByKey.get(key) || [];
      matches.push({ asset, metadata, location });
      otfByKey.set(key, matches);
    }

    const decisions = [];
    for (const asset of assets) {
      const location = comparableStem(asset);
      const metadata = asset.metadata || {};
      if (!location || !['.woff', '.woff2'].includes(location.extension) || metadata.status !== 'parsed') continue;
      if (!metadata.family_name || !metadata.subfamily_name || !Number.isInteger(metadata.weight_class)
        || typeof metadata.is_italic !== 'boolean') continue;

      const key = [location.stem, normalize(metadata.family_name), normalize(metadata.subfamily_name), metadata.is_italic].join('|');
      const matches = otfByKey.get(key) || [];
      const distinctWeights = [...new Set(matches.map((match) => match.metadata.weight_class))];
      if (matches.length !== 1 || distinctWeights.length !== 1) continue;

      const sibling = matches[0];
      const expectedWeight = namedWeight(metadata.subfamily_name);
      if (expectedWeight == null || expectedWeight !== sibling.metadata.weight_class
        || metadata.weight_class === sibling.metadata.weight_class) continue;

      const originalWeight = metadata.weight_class;
      asset.metadata = {
        ...metadata,
        weight_class: sibling.metadata.weight_class,
        weight_class_reconciliation: {
          method: 'exact_cross_format_sibling',
          source_label: sibling.asset.source_label,
          source_path: sibling.asset.relative_path,
          source_sha256: sibling.asset.sha256 || null,
          previous_weight_class: originalWeight,
          reconciled_weight_class: sibling.metadata.weight_class,
          reason: 'Same relative cut, embedded family/subfamily and italic state match; OTF weight agrees with named subfamily.',
          unresolved_name_table_mismatch: Boolean(
            (metadata.full_name && sibling.metadata.full_name && normalize(metadata.full_name) !== normalize(sibling.metadata.full_name))
            || (metadata.postscript_name && sibling.metadata.postscript_name && normalize(metadata.postscript_name) !== normalize(sibling.metadata.postscript_name))
          ),
        },
      };
      decisions.push({
        asset_id: asset.sha256 || null,
        source_path: asset.relative_path || null,
        source_format: location.extension,
        source_weight_class: originalWeight,
        reconciled_weight_class: sibling.metadata.weight_class,
        reference_path: sibling.asset.relative_path || null,
        unresolved_name_table_mismatch: asset.metadata.weight_class_reconciliation.unresolved_name_table_mismatch,
      });
    }

    if (decisions.length) {
      queue.metadata_reconciliation = [
        ...(Array.isArray(queue.metadata_reconciliation) ? queue.metadata_reconciliation : []),
        ...decisions,
      ];
    }
    summary.push({ slug: queue.slug || null, reconciled_asset_count: decisions.length, decisions });
  }

  result.metadata_reconciliation_summary = summary.map(({ slug, reconciled_asset_count }) => ({ slug, reconciled_asset_count }));
  return { report: result, summary };
}
