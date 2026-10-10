import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SUPPORTED_FONT_EXTENSIONS = new Set(['ttf', 'otf', 'woff', 'woff2']);

export function mergeWoff2ReplayIntoDiscoveryReport(report, replay) {
  if (!report || !Array.isArray(report.queue_items)) throw new TypeError('Expected baseline report queue_items');
  if (!replay || !Array.isArray(replay.queue_items)) throw new TypeError('Expected replay result queue_items');
  const replayBySlug = new Map(replay.queue_items.map((item) => [item.slug, item]));
  const updatedReport = structuredClone(report);
  const summary = [];

  updatedReport.queue_items = updatedReport.queue_items.map((item) => {
    const replayItem = replayBySlug.get(item.slug);
    if (!replayItem) return item;
    const replayResults = replayItem.font_results || replayItem.woff2_results || [];
    const replayAssets = new Map(replayResults.map((asset) => [
      JSON.stringify([asset.source_label, asset.relative_path]),
      asset,
    ]));
    let updated = 0;
    let missing = 0;
    let updatedWoff2 = 0;
    let missingWoff2 = 0;
    let hashMismatch = 0;
    let hashMismatchWoff2 = 0;
    item.assets = (item.assets || []).map((asset) => {
      const ext = String(asset.extension || path.extname(asset.relative_path || '')).toLowerCase().replace(/^\./, '');
      if (!SUPPORTED_FONT_EXTENSIONS.has(ext)) return asset;
      const replayAsset = replayAssets.get(JSON.stringify([asset.source_label, asset.relative_path]));
      // Path equality is not enough: if the binary changed since the baseline was
      // captured, its fresh metadata must not be attached to the old asset record.
      if (!replayAsset || replayAsset.hash_matches_baseline !== true) {
        missing += 1;
        if (ext === 'woff2') missingWoff2 += 1;
        if (replayAsset?.hash_matches_baseline === false) {
          hashMismatch += 1;
          if (ext === 'woff2') hashMismatchWoff2 += 1;
        }
        return asset;
      }
      updated += 1;
      if (ext === 'woff2') updatedWoff2 += 1;
      const parsedSuccessfully = replayAsset.metadata_status === 'parsed';
      return {
        ...asset,
        metadata: {
          ...(asset.metadata || {}),
          status: replayAsset.metadata_status,
          // Clear stale discovery notes after a successful fresh parse. On parse
          // failure, retain existing metadata rather than replacing it with nulls.
          reason: parsedSuccessfully
            ? null
            : replayAsset.error || asset.metadata?.reason || null,
          ...(parsedSuccessfully ? {
            family_name: replayAsset.family_name ?? null,
            subfamily_name: replayAsset.subfamily_name ?? null,
            full_name: replayAsset.full_name ?? null,
            postscript_name: replayAsset.postscript_name ?? null,
            weight_class: replayAsset.weight_class ?? null,
            is_italic: replayAsset.is_italic ?? null,
            is_variable: replayAsset.is_variable ?? null,
            glyph_count: replayAsset.glyph_count ?? null,
            variation_axes: Array.isArray(replayAsset.variation_axes) ? replayAsset.variation_axes : [],
          } : {}),
        },
      };
    });
    summary.push({
      slug: item.slug,
      baseline_font_count: replayItem.font_asset_count_in_baseline ?? replayResults.length,
      updated_from_replay: updated,
      missing_replay_matches: missing,
      hash_mismatch_replay_matches: hashMismatch,
      baseline_woff2_count: replayItem.woff2_asset_count_in_baseline,
      updated_woff2_from_replay: updatedWoff2,
      missing_woff2_replay_matches: missingWoff2,
      hash_mismatch_woff2_replay_matches: hashMismatchWoff2,
    });
    return item;
  });
  return { report: updatedReport, summary };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [baselinePath, replayPath, outputPath, summaryPath] = process.argv.slice(2);
  if (!baselinePath || !replayPath || !outputPath) {
    console.error('Usage: node scripts/font-processing/merge-woff2-replay.js <baseline.json> <replay.json> <merged.json> [summary.json]');
    process.exitCode = 2;
  } else {
    try {
      const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      const replay = JSON.parse(fs.readFileSync(replayPath, 'utf8'));
      const result = mergeWoff2ReplayIntoDiscoveryReport(baseline, replay);
      fs.writeFileSync(outputPath, JSON.stringify(result.report, null, 2) + '\n', { flag: 'wx' });
      if (summaryPath) fs.writeFileSync(summaryPath, JSON.stringify({ database_writes_performed: false, summary: result.summary }, null, 2) + '\n', { flag: 'wx' });
      else process.stdout.write(JSON.stringify(result.summary, null, 2) + '\n');
    } catch (error) {
      console.error(error instanceof Error ? error.stack || error.message : String(error));
      process.exitCode = 1;
    }
  }
}
