import fs from 'node:fs';
import path from 'node:path';
import { deduplicateAssets, planVariantGroups } from './core.js';

function increment(counter, key) {
  counter[key || 'unknown'] = (counter[key || 'unknown'] || 0) + 1;
}

function normalizeDiscoveryAsset(asset) {
  const extension = String(asset.extension || path.extname(asset.relative_path || '')).toLowerCase();
  return {
    asset_id: asset.sha256,
    sha256: asset.sha256,
    archive_label: asset.source_label || null,
    relative_path: asset.relative_path || asset.filename || null,
    extension,
    size_bytes: asset.size_bytes,
    metadata: { ...(asset.metadata || {}), extension },
    variant_name_guess: asset.variant_name_guess || null,
    variant_guess_confidence: asset.variant_guess_confidence || null,
  };
}

export function validateDiscoveryReport(report) {
  if (!report || !Array.isArray(report.queue_items)) {
    throw new TypeError('Expected a discovery report with a queue_items array');
  }

  return {
    generated_at: report.generated_at || null,
    mode: report.mode || null,
    database_writes_performed: report.database_writes_performed ?? null,
    queue_items: report.queue_items.map((item) => {
      const rawAssets = Array.isArray(item.assets) ? item.assets : [];
      const assets = rawAssets.map(normalizeDiscoveryAsset);
      const uniqueAssets = deduplicateAssets(assets);
      const plan = planVariantGroups(uniqueAssets);
      const sourceCounts = {};
      const extensionCounts = {};
      const metadataStatusCounts = {};
      const guessDisagreements = [];
      const familyNames = new Set();

      for (const asset of rawAssets) {
        increment(sourceCounts, asset.source_label);
        increment(extensionCounts, asset.extension);
        increment(metadataStatusCounts, asset.metadata?.status);
        const metadata = asset.metadata || {};
        if (metadata.family_name) familyNames.add(metadata.family_name);
        if (
          asset.variant_name_guess &&
          metadata.subfamily_name &&
          metadata.subfamily_name.toLowerCase() === 'regular' &&
          Number.isFinite(metadata.weight_class) &&
          metadata.weight_class !== 400
        ) {
          guessDisagreements.push({
            path: asset.relative_path || asset.filename || null,
            filename_guess: asset.variant_name_guess,
            family_name: metadata.family_name || null,
            binary_subfamily: metadata.subfamily_name,
            binary_weight_class: metadata.weight_class,
          });
        }
      }

      const reviewReasonCounts = {};
      for (const item of plan.review) increment(reviewReasonCounts, item.reason);
      const conflictCount = plan.groups.reduce((count, group) => count + group.conflicts.length, 0);
      const duplicateSourceCopies = assets.length - uniqueAssets.length;

      return {
        slug: item.slug || null,
        source_file_counts: sourceCounts,
        asset_count: assets.length,
        unique_binary_count: uniqueAssets.length,
        duplicate_source_copies: duplicateSourceCopies,
        duplicate_hash_groups: assets.length - uniqueAssets.length,
        extension_counts: extensionCounts,
        metadata_status_counts: metadataStatusCounts,
        distinct_binary_family_names: familyNames.size,
        planned_variant_group_count: plan.groups.length,
        planned_asset_count: plan.groups.reduce((count, group) => count + group.assets.length, 0),
        review_count: plan.review.length,
        review_reason_counts: reviewReasonCounts,
        format_conflict_count: conflictCount,
        binary_weight_filename_disagreement_count: guessDisagreements.length,
        binary_weight_filename_disagreement_samples: guessDisagreements.slice(0, 20),
        review_samples: plan.review.slice(0, 30),
        format_conflict_samples: plan.groups.flatMap((group) => group.conflicts.map((conflict) => ({
          family_name: group.family_name,
          variant_name: group.variant_name,
          ...conflict,
        }))).slice(0, 20),
      };
    }),
  };
}

if (process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: node scripts/font-processing/validate-discovery-report.js <discovery-report.json> [output.json]');
    process.exitCode = 2;
  } else {
    try {
      const report = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
      const summary = validateDiscoveryReport(report);
      const output = JSON.stringify(summary, null, 2) + '\n';
      if (process.argv[3]) fs.writeFileSync(process.argv[3], output, { flag: 'wx' });
      else process.stdout.write(output);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
