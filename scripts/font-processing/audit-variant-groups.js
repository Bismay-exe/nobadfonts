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

function inspectGroup(group) {
  const assets = group.assets || [];
  const familyNames = unique(assets.map((asset) => asset.metadata?.family_name));
  const subfamilies = unique(assets.map((asset) => asset.metadata?.subfamily_name));
  const weights = unique(assets.map((asset) => asset.metadata?.weight_class));
  const italicValues = unique(assets.map((asset) => asset.metadata?.is_italic));
  const variableValues = unique(assets.map((asset) => asset.metadata?.is_variable));
  const extensions = unique(assets.map((asset) => asset.extension));
  const flags = [];

  if (familyNames.length > 1) flags.push('raw_family_name_disagreement');
  if (subfamilies.length > 1) flags.push('raw_subfamily_disagreement');
  if (weights.length > 1) flags.push('weight_class_disagreement');
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
      family_names: familyNames,
      subfamilies,
      weight_classes: weights,
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

    return {
      slug: item.slug || null,
      input_asset_count: rawAssets.length,
      unique_binary_count: uniqueAssets.length,
      planned_group_count: groups.length,
      flagged_group_count: flaggedGroups.length,
      groups_without_automatic_flags: groups.length - flaggedGroups.length,
      review_asset_count: plan.review.length,
      format_conflict_count: groups.reduce((count, group) => count + group.conflicts.length, 0),
      review_reason_counts: plan.review.reduce((counts, entry) => {
        counts[entry.reason] = (counts[entry.reason] || 0) + 1;
        return counts;
      }, {}),
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
      format_conflict_count: queues.reduce((sum, queue) => sum + queue.format_conflict_count, 0),
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
