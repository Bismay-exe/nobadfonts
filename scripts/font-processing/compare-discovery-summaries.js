import fs from 'node:fs';

function readSummary(filePath) {
  const value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!value || !Array.isArray(value.queue_items)) {
    throw new TypeError(`Expected validated discovery summary with queue_items: ${filePath}`);
  }
  return value;
}

function sum(object = {}) {
  return Object.values(object).reduce((total, value) => total + (Number(value) || 0), 0);
}

function summarize(item) {
  return {
    slug: item.slug || null,
    asset_count: item.asset_count || 0,
    unique_binary_count: item.unique_binary_count || 0,
    duplicate_source_copies: item.duplicate_source_copies || 0,
    extension_counts: item.extension_counts || {},
    metadata_status_counts: item.metadata_status_counts || {},
    planned_variant_group_count: item.planned_variant_group_count || 0,
    review_count: item.review_count || 0,
    review_reason_counts: item.review_reason_counts || {},
    format_conflict_count: item.format_conflict_count || 0,
    binary_weight_filename_disagreement_count: item.binary_weight_filename_disagreement_count || 0,
  };
}

function deltaMap(before = {}, after = {}) {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  return Object.fromEntries(keys.map((key) => [key, {
    baseline: before[key] || 0,
    fresh: after[key] || 0,
    delta: (after[key] || 0) - (before[key] || 0),
  }]));
}

export function compareDiscoverySummaries(baseline, fresh) {
  const beforeItems = new Map(baseline.queue_items.map((item) => [item.slug || '', summarize(item)]));
  const afterItems = new Map(fresh.queue_items.map((item) => [item.slug || '', summarize(item)]));
  const slugs = [...new Set([...beforeItems.keys(), ...afterItems.keys()])].sort();

  return {
    generated_at: new Date().toISOString(),
    mode: 'read-only-discovery-comparison',
    database_writes_performed: false,
    baseline_generated_at: baseline.generated_at || null,
    fresh_generated_at: fresh.generated_at || null,
    comparisons: slugs.map((slug) => {
      const before = beforeItems.get(slug) || null;
      const after = afterItems.get(slug) || null;
      if (!before || !after) {
        return { slug: slug || null, status: before ? 'missing_from_fresh' : 'new_in_fresh', baseline: before, fresh: after };
      }
      return {
        slug: slug || null,
        status: 'compared',
        asset_count: { baseline: before.asset_count, fresh: after.asset_count, delta: after.asset_count - before.asset_count },
        unique_binary_count: { baseline: before.unique_binary_count, fresh: after.unique_binary_count, delta: after.unique_binary_count - before.unique_binary_count },
        extension_counts: deltaMap(before.extension_counts, after.extension_counts),
        metadata_status_counts: deltaMap(before.metadata_status_counts, after.metadata_status_counts),
        planned_variant_group_count: { baseline: before.planned_variant_group_count, fresh: after.planned_variant_group_count, delta: after.planned_variant_group_count - before.planned_variant_group_count },
        review_count: { baseline: before.review_count, fresh: after.review_count, delta: after.review_count - before.review_count },
        review_reason_counts: deltaMap(before.review_reason_counts, after.review_reason_counts),
        format_conflict_count: { baseline: before.format_conflict_count, fresh: after.format_conflict_count, delta: after.format_conflict_count - before.format_conflict_count },
        binary_weight_filename_disagreement_count: {
          baseline: before.binary_weight_filename_disagreement_count,
          fresh: after.binary_weight_filename_disagreement_count,
          delta: after.binary_weight_filename_disagreement_count - before.binary_weight_filename_disagreement_count,
        },
      };
    }),
  };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [baselinePath, freshPath, outputPath] = process.argv.slice(2);
  if (!baselinePath || !freshPath) {
    console.error('Usage: node scripts/font-processing/compare-discovery-summaries.js <baseline-summary.json> <fresh-summary.json> [output.json]');
    process.exitCode = 2;
  } else {
    try {
      const result = compareDiscoverySummaries(readSummary(baselinePath), readSummary(freshPath));
      const output = JSON.stringify(result, null, 2) + '\n';
      if (outputPath) fs.writeFileSync(outputPath, output, { flag: 'wx' });
      else process.stdout.write(output);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
