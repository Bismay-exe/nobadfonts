import { createHash } from 'node:crypto';
import path from 'node:path';

export const SUPPORTED_FONT_EXTENSIONS = new Set(['.ttf', '.otf', '.woff', '.woff2']);

const WEIGHT_NAMES = new Map([
  [100, 'Thin'],
  [200, 'Extra Light'],
  [300, 'Light'],
  [400, 'Regular'],
  [500, 'Medium'],
  [600, 'Semi Bold'],
  [700, 'Bold'],
  [800, 'Extra Bold'],
  [900, 'Black'],
]);

const normalizeText = (value) => (
  typeof value === 'string' ? value.normalize('NFKC').trim().replace(/\s+/g, ' ') : ''
);

export function sha256Buffer(buffer) {
  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) {
    throw new TypeError('sha256Buffer expects a Buffer or Uint8Array');
  }
  return createHash('sha256').update(buffer).digest('hex');
}

export function getFontExtension(filePath) {
  const value = String(filePath || '').toLowerCase();
  const bareExtension = value.startsWith('.') ? value : `.${value}`;
  const extension = SUPPORTED_FONT_EXTENSIONS.has(value)
    ? value
    : SUPPORTED_FONT_EXTENSIONS.has(bareExtension)
      ? bareExtension
      : path.extname(value);
  return SUPPORTED_FONT_EXTENSIONS.has(extension) ? extension : null;
}

/**
 * Normalize binary metadata without treating filename guesses as authoritative.
 * Unknown values remain null/empty instead of being guessed.
 */
export function normalizeFontMetadata(metadata = {}) {
  const weightValue = Number(metadata.weight_class ?? metadata.weightClass);
  const weightClass = Number.isInteger(weightValue) && weightValue >= 1 && weightValue <= 1000
    ? weightValue
    : null;

  const familyName = normalizeText(metadata.family_name ?? metadata.familyName);
  const subfamilyName = normalizeText(metadata.subfamily_name ?? metadata.subfamilyName);
  const fullName = normalizeText(metadata.full_name ?? metadata.fullName);
  const postscriptName = normalizeText(metadata.postscript_name ?? metadata.postScriptName);
  const extension = getFontExtension(metadata.extension ?? metadata.file_path ?? metadata.filePath);

  return {
    family_name: familyName || null,
    subfamily_name: subfamilyName || null,
    full_name: fullName || null,
    postscript_name: postscriptName || null,
    weight_class: weightClass,
    is_italic: typeof metadata.is_italic === 'boolean'
      ? metadata.is_italic
      : typeof metadata.isItalic === 'boolean' ? metadata.isItalic : null,
    is_variable: typeof metadata.is_variable === 'boolean'
      ? metadata.is_variable
      : typeof metadata.isVariable === 'boolean' ? metadata.isVariable : null,
    glyph_count: Number.isInteger(metadata.glyph_count ?? metadata.glyphCount)
      && Number(metadata.glyph_count ?? metadata.glyphCount) >= 0
      ? Number(metadata.glyph_count ?? metadata.glyphCount)
      : null,
    extension,
    parser_status: normalizeText(metadata.status ?? metadata.parser_status) || 'unknown',
  };
}

export function canonicalFamilyKey(metadata = {}) {
  const family = normalizeText(metadata.family_name ?? metadata.familyName).toLocaleLowerCase('en-US');
  return family || null;
}

export function canonicalVariantKey(metadata = {}) {
  const subfamily = normalizeText(metadata.subfamily_name ?? metadata.subfamilyName).toLocaleLowerCase('en-US');
  const weight = metadata.weight_class ?? metadata.weightClass;
  const italic = metadata.is_italic ?? metadata.isItalic;

  // Binary subfamily metadata is the strongest label when present. Do not
  // merge files with different named subfamilies just because weights match.
  if (subfamily) return subfamily;
  if (Number.isInteger(weight) && typeof italic === 'boolean') {
    return `weight-${weight}-${italic ? 'italic' : 'upright'}`;
  }
  return null;
}

/**
 * Deduplicate byte-identical files by SHA-256 while retaining every source.
 * Different hashes are never collapsed because their names/extensions match.
 */
export function deduplicateAssets(assets) {
  const byHash = new Map();

  for (const asset of assets) {
    if (!asset || typeof asset.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(asset.sha256)) {
      throw new TypeError('Each asset must include a valid SHA-256 hex digest');
    }
    const hash = asset.sha256.toLowerCase();
    const existing = byHash.get(hash);
    const source = {
      archive_label: asset.archive_label ?? null,
      relative_path: asset.relative_path ?? asset.path ?? null,
      extension: getFontExtension(asset.extension ?? asset.relative_path ?? asset.path),
      size_bytes: Number.isSafeInteger(asset.size_bytes) && asset.size_bytes >= 0 ? asset.size_bytes : null,
    };

    if (existing) {
      existing.sources.push(source);
      continue;
    }

    byHash.set(hash, {
      asset_id: hash,
      sha256: hash,
      size_bytes: source.size_bytes,
      extension: source.extension,
      metadata: normalizeFontMetadata(asset.metadata || {}),
      sources: [source],
    });
  }

  return [...byHash.values()];
}

/**
 * Group only when local binary metadata provides a usable family and variant
 * key. Ambiguous assets are returned for review, never guessed into a group.
 */
export function planVariantGroups(assets) {
  const groups = new Map();
  const review = [];

  for (const asset of assets) {
    const metadata = normalizeFontMetadata(asset.metadata || {});
    const familyKey = canonicalFamilyKey(metadata);
    const variantKey = canonicalVariantKey(metadata);

    const familyWeightConflict = metadata.family_name
      && metadata.subfamily_name?.toLocaleLowerCase('en-US') === 'regular'
      && metadata.weight_class != null
      && metadata.weight_class !== 400
      && /(?:^|\\s)(?:thin|hairline|extra\\s*light|ultra\\s*light|light|medium|semi\\s*bold|demi\\s*bold|extra\\s*bold|ultra\\s*bold|bold|black|heavy)(?:\\s+italic)?$/i.test(metadata.family_name);

    if (!familyKey || !variantKey || !metadata.extension || familyWeightConflict) {
      review.push({
        asset_id: asset.asset_id ?? asset.sha256 ?? null,
        reason: familyWeightConflict
          ? 'family_name_weight_conflict'
          : !familyKey
            ? 'missing_family_metadata'
            : !variantKey
              ? 'missing_subfamily_or_weight_metadata'
              : 'unsupported_or_unknown_extension',
      });
      continue;
    }

    const key = JSON.stringify([familyKey, variantKey]);
    if (!groups.has(key)) {
      groups.set(key, {
        family_name: metadata.family_name,
        variant_name: metadata.subfamily_name || (
          metadata.weight_class != null
            ? `${WEIGHT_NAMES.get(metadata.weight_class) || `Weight ${metadata.weight_class}`}${metadata.is_italic ? ' Italic' : ''}`
            : null
        ),
        variant_key: variantKey,
        assets: [],
        conflicts: [],
      });
    }

    const group = groups.get(key);
    const duplicateFormat = group.assets.find(
      (candidate) => candidate.extension === metadata.extension && candidate.sha256 !== asset.sha256,
    );

    if (duplicateFormat) {
      group.conflicts.push({
        extension: metadata.extension,
        asset_ids: [duplicateFormat.asset_id ?? duplicateFormat.sha256, asset.asset_id ?? asset.sha256],
        reason: 'multiple_distinct_assets_for_same_variant_and_format',
      });
    }

    group.assets.push({
      asset_id: asset.asset_id ?? asset.sha256 ?? null,
      sha256: asset.sha256 ?? null,
      extension: metadata.extension,
      size_bytes: asset.size_bytes ?? null,
      metadata,
      sources: asset.sources || [],
    });
  }

  return {
    groups: [...groups.values()],
    review,
  };
}
