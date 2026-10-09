import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deduplicateAssets, planVariantGroups } from './core.js';

function normalizeAsset(asset) {
  const extension = String(asset.extension || path.extname(asset.relative_path || asset.filename || '')).toLowerCase();
  return {
    asset_id: asset.sha256,
    sha256: asset.sha256,
    archive_label: asset.source_label || null,
    relative_path: asset.relative_path || asset.filename || null,
    extension,
    size_bytes: asset.size_bytes,
    metadata: { ...(asset.metadata || {}), extension },
  };
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined && value !== ''))].sort();
}

const NAMED_WEIGHT_CLASSES = [
  { pattern: /(?:^|\s)(?:extra\s*light|ultra\s*light|extralight|ultralight)(?:\s|$)/i, weight: 200 },
  { pattern: /(?:^|\s)(?:semi\s*bold|demi\s*bold|semibold|demibold)(?:\s|$)/i, weight: 600 },
  { pattern: /(?:^|\s)(?:extra\s*bold|ultra\s*bold|extrabold|ultrabold)(?:\s|$)/i, weight: 800 },
  { pattern: /(?:^|\s)(?:hairline|thin)(?:\s|$)/i, weight: 100 },
  { pattern: /(?:^|\s)light(?:\s|$)/i, weight: 300 },
  { pattern: /(?:^|\s)regular(?:\s|$)/i, weight: 400 },
  { pattern: /(?:^|\s)medium(?:\s|$)/i, weight: 500 },
  { pattern: /(?:^|\s)bold(?:\s|$)/i, weight: 700 },
  { pattern: /(?:^|\s)(?:black|heavy)(?:\s|$)/i, weight: 900 },
];

function getNamedWeightMismatch(metadata) {
  const subfamily = String(metadata?.subfamily_name || '').trim();
  const embeddedWeight = metadata?.weight_class;
  if (!subfamily || !Number.isInteger(embeddedWeight)) return null;
  const namedWeight = NAMED_WEIGHT_CLASSES.find((entry) => entry.pattern.test(subfamily));
  if (!namedWeight || namedWeight.weight === embeddedWeight) return null;
  return { subfamily_name: subfamily, named_weight_class: namedWeight.weight, embedded_weight_class: embeddedWeight };
}

function inspectGroup(group) {
  const assets = group.assets || [];
  const familyNames = unique(assets.map((asset) => asset.metadata?.family_name));
  const subfamilies = unique(assets.map((asset) => asset.metadata?.subfamily_name));
  const weights = unique(assets.map((asset) => asset.metadata?.weight_class));
  const italicValues = unique(assets.map((asset) => asset.metadata?.is_italic));
  const variableValues = unique(assets.map((asset) => asset.metadata?.is_variable));
  const extensions = unique(assets.map((asset) => asset.extension));
  const weightEvidenceByFormat = Object.fromEntries(
    extensions.map((extension) => [
      extension,
      {
        asset_count: assets.filter((asset) => asset.extension === extension).length,
        weight_classes: unique(assets
          .filter((asset) => asset.extension === extension)
          .map((asset) => asset.metadata?.weight_class)),
        source_paths: unique(assets
          .filter((asset) => asset.extension === extension)
          .flatMap((asset) => (asset.sources || []).map((source) => source.relative_path))),
      },
    ]),
  );
  const flags = [];
  const namedWeightMismatches = assets.flatMap((asset) => {
    const mismatch = getNamedWeightMismatch(asset.metadata);
    return mismatch ? [{
      asset_id: asset.asset_id || asset.sha256 || null,
      extension: asset.extension || null,
      source_paths: unique((asset.sources || []).map((source) => source.relative_path)),
      ...mismatch,
    }] : [];
  });

  if (familyNames.length > 1) flags.push('raw_family_name_disagreement');
  if (subfamilies.length > 1) flags.push('raw_subfamily_disagreement');
  if (weights.length > 1) flags.push('weight_class_disagreement');
  if (namedWeightMismatches.length > 0) flags.push('subfamily_weight_class_disagreement');
  if (italicValues.length > 1) flags.push('italic_flag_disagreement');
  if (variableValues.length > 1) flags.push('variable_flag_disagreement');
  if ((group.conflicts || []).length > 0) flags.push('same_format_binary_conflict');
  if (assets.some((asset) => !asset.metadata?.family_name || !asset.metadata?.subfamily_name)) {
    flags.push('incomplete_raw_name_metadata');
  }

  return {
    family_name: group.family_name,
    variant_name: group.variant_name,
    variant_key: group.variant_key,
    asset_count: assets.length,
    formats: extensions,
    source_paths: unique(assets.flatMap((asset) => (asset.sources || []).map((source) => source.relative_path))),
    assets: assets.map((asset) => ({
      asset_id: asset.asset_id || asset.sha256 || null,
      sha256: asset.sha256 || null,
      extension: asset.extension || null,
      size_bytes: asset.size_bytes ?? null,
      source_paths: unique((asset.sources || []).map((source) => source.relative_path)),
      metadata: {
        family_name: asset.metadata?.family_name ?? null,
        subfamily_name: asset.metadata?.subfamily_name ?? null,
        full_name: asset.metadata?.full_name ?? null,
        postscript_name: asset.metadata?.postscript_name ?? null,
        weight_class: asset.metadata?.weight_class ?? null,
        is_italic: asset.metadata?.is_italic ?? null,
        is_variable: asset.metadata?.is_variable ?? null,
        glyph_count: asset.metadata?.glyph_count ?? null,
        parser_status: asset.metadata?.parser_status ?? null,
      },
    })),
    evidence_variation: {
      named_weight_mismatches: namedWeightMismatches,
      family_names: familyNames,
      subfamilies,
      weight_classes: weights,
      weight_classes_by_format: weightEvidenceByFormat,
      italic_flags: italicValues,
      variable_flags: variableValues,
    },
    conflicts: group.conflicts || [],
    review_flags: flags,
    assessment: flags.length ? 'needs_human_review' : 'no_automatic_flags_not_semantically_verified',
  };
}

/**
 * Audits deterministic groups using only the saved report and embedded metadata.
 * It does not publish, mutate queues, call APIs, or write to external services.
 */
export function auditVariantGroups(report) {
  if (!report || !Array.isArray(report.queue_items)) {
    throw new TypeError('Expected a discovery report with a queue_items array');
  }

  const queues = report.queue_items.map((item) => {
    const rawAssets = Array.isArray(item.assets) ? item.assets : [];
    const assets = rawAssets.map(normalizeAsset);
    const uniqueAssets = deduplicateAssets(assets);
    const plan = planVariantGroups(uniqueAssets);
    const groups = plan.groups.map(inspectGroup);
    const flaggedGroups = groups.filter((group) => group.review_flags.length > 0);
    const flaggedGroupAssetIds = new Set(flaggedGroups.flatMap((group) =>
      group.assets.map((asset) => asset.asset_id || asset.sha256).filter(Boolean)
    ));
    const unassignedReviewReasonCounts = plan.review.reduce((counts, entry) => {
      counts[entry.reason] = (counts[entry.reason] || 0) + 1;
      return counts;
    }, {});
    const reviewFlagCounts = flaggedGroups.reduce((counts, group) => {
      for (const flag of group.review_flags) counts[flag] = (counts[flag] || 0) + 1;
      return counts;
    }, {});
    const weightDisagreementGroups = groups
      .filter((group) => group.review_flags.includes('weight_class_disagreement'))
      .map((group) => ({
        family_name: group.family_name,
        variant_name: group.variant_name,
        variant_key: group.variant_key,
        weight_classes_by_format: group.evidence_variation.weight_classes_by_format,
        source_paths: group.source_paths,
      }));

    return {
      slug: item.slug || null,
      input_asset_count: rawAssets.length,
      unique_binary_count: uniqueAssets.length,
      planned_group_count: groups.length,
      flagged_group_count: flaggedGroups.length,
      review_flag_counts: reviewFlagCounts,
      weight_disagreement_group_count: weightDisagreementGroups.length,
      weight_disagreement_groups: weightDisagreementGroups,
      groups_without_automatic_flags: groups.length - flaggedGroups.length,
      // Grouped assets can still be unsafe. Count every asset in a flagged group
      // as requiring review instead of reporting zero review assets.
      review_asset_count: plan.review.length + flaggedGroupAssetIds.size,
      unassigned_review_asset_count: plan.review.length,
      flagged_group_asset_count: flaggedGroupAssetIds.size,
      format_conflict_count: groups.reduce((count, group) => count + group.conflicts.length, 0),
      review_reason_counts: unassignedReviewReasonCounts,
      flagged_group_review_reason_counts: reviewFlagCounts,
      flagged_groups: flaggedGroups,
      groups,
    };
  });

  return {
    generated_at: new Date().toISOString(),
    mode: 'offline-read-only-variant-group-audit',
    publishable: false,
    database_writes_performed: false,
    api_calls_performed: false,
    uploads_performed: false,
    semantic_correctness_claimed: false,
    summary: {
      queue_count: queues.length,
      input_asset_count: queues.reduce((sum, queue) => sum + queue.input_asset_count, 0),
      unique_binary_count: queues.reduce((sum, queue) => sum + queue.unique_binary_count, 0),
      planned_group_count: queues.reduce((sum, queue) => sum + queue.planned_group_count, 0),
      flagged_group_count: queues.reduce((sum, queue) => sum + queue.flagged_group_count, 0),
      review_asset_count: queues.reduce((sum, queue) => sum + queue.review_asset_count, 0),
      unassigned_review_asset_count: queues.reduce((sum, queue) => sum + queue.unassigned_review_asset_count, 0),
      flagged_group_asset_count: queues.reduce((sum, queue) => sum + queue.flagged_group_asset_count, 0),
      format_conflict_count: queues.reduce((sum, queue) => sum + queue.format_conflict_count, 0),
      weight_disagreement_group_count: queues.reduce((sum, queue) => sum + queue.weight_disagreement_group_count, 0),
      review_flag_counts: queues.reduce((counts, queue) => {
        for (const [flag, count] of Object.entries(queue.review_flag_counts)) {
          counts[flag] = (counts[flag] || 0) + count;
        }
        return counts;
      }, {}),
    },
    queues,
    limitations: [
      'Matching embedded metadata does not prove that assets belong to the same intended font family.',
      'A group with no automatic flags has not been semantically verified.',
      'This output is a review artifact only and is not a publishing or database-write plan.',
    ],
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath) {
    console.error('Usage: node scripts/font-processing/audit-variant-groups.js <discovery-report.json> [output.json]');
    process.exitCode = 2;
  } else {
    try {
      const report = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
      const result = auditVariantGroups(report);
      const output = JSON.stringify(result, null, 2) + '\n';
      if (outputPath) fs.writeFileSync(outputPath, output, { flag: 'wx' });
      else process.stdout.write(output);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
