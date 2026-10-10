import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deduplicateAssets, planVariantGroups } from './core.js';
import { auditVariantGroups } from './audit-variant-groups.js';
import { runGeminiReview } from './run-gemini-review.js';
import { mergeGeminiReview } from './merge-gemini-review.js';

const MAX_LIVE_CANDIDATES = 50;

function normalizeAsset(asset) {
  const relativePath = asset.relative_path || asset.filename || asset.path || null;
  const extension = String(asset.extension || path.extname(relativePath || '')).toLowerCase();
  return {
    asset_id: asset.sha256,
    sha256: asset.sha256,
    archive_label: asset.source_label || asset.archive_label || null,
    relative_path: relativePath,
    extension,
    size_bytes: asset.size_bytes,
    metadata: { ...(asset.metadata || {}), extension },
  };
}

function collectReviewCandidateIds(plan, audit) {
  const ids = new Set(plan.review.map((item) => item.asset_id).filter(Boolean));
  for (const group of audit.flagged_groups || []) {
    for (const asset of group.assets || []) {
      if (asset.asset_id || asset.sha256) ids.add(asset.asset_id || asset.sha256);
    }
  }
  return [...ids];
}

function candidateForGemini(asset) {
  const firstSource = asset.sources?.[0] || {};
  return {
    asset_id: asset.asset_id || asset.sha256,
    sha256: asset.sha256,
    relative_path: asset.sources?.map((source) => source.relative_path).filter(Boolean).join(' | ')
      || firstSource.relative_path || asset.relative_path || '',
    extension: asset.extension || asset.metadata?.extension || '',
    metadata: asset.metadata || {},
  };
}

/**
 * Read-only discovery report review. Gemini calls are disabled unless --live
 * is explicitly supplied. Even with --live, the script performs no uploads,
 * queue updates, Supabase queries, or database writes.
 */
export async function reviewDiscoveryReport(report, options = {}) {
  if (!report || !Array.isArray(report.queue_items)) {
    throw new TypeError('Expected a discovery report with a queue_items array');
  }
  const live = options.live === true;
  const targetSlug = options.slug || null;
  if (live && !targetSlug) {
    throw new Error('Live Gemini review requires --slug so one queue item is reviewed per run.');
  }
  if (live && !process.env.GEMINI_API_KEY && !options.apiKey) {
    throw new Error('Missing GEMINI_API_KEY; no request was sent.');
  }

  let targetFound = !targetSlug;
  const queueItems = [];

  for (const item of report.queue_items) {
    const slug = String(item.slug || '');
    const selected = !targetSlug || slug === targetSlug;
    if (selected && targetSlug) targetFound = true;
    const rawAssets = Array.isArray(item.assets) ? item.assets : [];
    const uniqueAssets = deduplicateAssets(rawAssets.map(normalizeAsset));
    const plan = planVariantGroups(uniqueAssets);
    const audit = auditVariantGroups({ queue_items: [{ ...item, assets: rawAssets }] }).queues[0];
    const candidateIds = collectReviewCandidateIds(plan, audit);

    let gemini = {
      mode: 'not_requested',
      publishable: false,
      database_writes_performed: false,
      uploads_performed: false,
      decisions: [],
      candidates_not_sent: candidateIds.length,
    };
    let merged = null;

    if (live && selected && candidateIds.length > 0) {
      const selectedIds = new Set(candidateIds.slice(0, MAX_LIVE_CANDIDATES));
      const candidates = uniqueAssets
        .filter((asset) => selectedIds.has(asset.asset_id))
        .map(candidateForGemini);
      const cacheFile = options.cacheFile
        || process.env.GEMINI_REVIEW_CACHE_FILE
        || path.resolve('.cache/font-processing/gemini-review-cache.json');
      gemini = await runGeminiReview(candidates, {
        apiKey: options.apiKey,
        cacheFile,
        maxRequests: 1,
        maxOutputTokens: options.maxOutputTokens || 2048,
        maxTotalOutputTokens: options.maxTotalOutputTokens || 2048,
        minimumConfidence: options.minimumConfidence ?? 0.85,
      });
      gemini.candidates_not_sent = Math.max(0, candidateIds.length - candidates.length);
      // Only mark candidates actually sent to Gemini as reviewed. Candidates
      // beyond the per-request cap must remain explicitly not_reviewed, not be
      // mislabeled as missing model decisions that require human review.
      merged = mergeGeminiReview({
        assets: uniqueAssets,
        review: gemini,
        candidateIds: [...selectedIds],
        minimumConfidence: options.minimumConfidence ?? 0.85,
      });
    } else if (live && selected) {
      gemini = {
        mode: 'no_ambiguous_candidates',
        publishable: false,
        database_writes_performed: false,
        uploads_performed: false,
        decisions: [],
        candidates_not_sent: 0,
      };
    }

    queueItems.push({
      slug: item.slug || null,
      asset_count: rawAssets.length,
      unique_binary_count: uniqueAssets.length,
      deterministic: {
        groups: plan.groups,
        review: plan.review,
        audit,
      },
      gemini,
      merged,
    });
  }

  if (!targetFound) throw new Error(`Queue item slug not found in report: ${targetSlug}`);
  return {
    generated_at: new Date().toISOString(),
    mode: live ? 'read-only-gemini-advisory-review' : 'read-only-deterministic-review',
    source_generated_at: report.generated_at || null,
    publishable: false,
    database_writes_performed: false,
    uploads_performed: false,
    queue_items: queueItems,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const positional = args.filter((arg) => !arg.startsWith('--'));
  const live = args.includes('--live');
  const slugArg = args.find((arg) => arg.startsWith('--slug='));
  const slug = slugArg ? slugArg.slice('--slug='.length) : null;
  const inputPath = positional[0];
  const outputPath = positional[1];

  if (!inputPath || !outputPath || inputPath === outputPath) {
    console.error('Usage: node scripts/font-processing/review-discovery-with-gemini.js <input.json> <output.json> [--slug=<queue-slug>] [--live]');
    process.exitCode = 2;
  } else {
    try {
      const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
      const result = await reviewDiscoveryReport(input, { live, slug });
      fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
      console.log(JSON.stringify({
        mode: result.mode,
        queue_items: result.queue_items.length,
        publishable: result.publishable,
        database_writes_performed: result.database_writes_performed,
        uploads_performed: result.uploads_performed,
      }, null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
