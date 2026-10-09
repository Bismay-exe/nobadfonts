import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deduplicateAssets, planVariantGroups } from './core.js';
import { auditVariantGroups } from './audit-variant-groups.js';

const BATCH_SIZE = 50;

function safeLabel(value) {
  return String(value || 'font').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'font';
}

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

/**
 * Export only deterministic-core review cases to bounded Gemini input batches.
 * This is a local file operation: no API calls, database writes, or uploads.
 */
export function exportAmbiguousAssets(report, outputDir, options = {}) {
  if (!report || !Array.isArray(report.queue_items)) {
    throw new TypeError('Expected a discovery report with queue_items array');
  }
  const batchSize = options.batchSize ?? BATCH_SIZE;
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > BATCH_SIZE) {
    throw new RangeError(`Batch size must be between 1 and ${BATCH_SIZE}`);
  }

  const outputFiles = [];
  const queueSummaries = [];
  fs.mkdirSync(outputDir, { recursive: true });

  for (const item of report.queue_items) {
    const rawAssets = Array.isArray(item.assets) ? item.assets : [];
    const assets = rawAssets.map(normalizeAsset);
    const uniqueAssets = deduplicateAssets(assets);
    const plan = planVariantGroups(uniqueAssets);
    const audit = auditVariantGroups({ queue_items: [item] }).queues[0];
    const assetById = new Map(uniqueAssets.map((asset) => [asset.asset_id, asset]));
    const reviewByAssetId = new Map();
    const addReview = (assetId, reasons, groupEvidence = null) => {
      if (!assetId || !assetById.has(assetId)) return;
      const current = reviewByAssetId.get(assetId) || { reasons: new Set(), groupEvidence: [] };
      for (const reason of reasons || []) if (reason) current.reasons.add(reason);
      if (groupEvidence && !current.groupEvidence.some((entry) =>
        entry.family_name === groupEvidence.family_name && entry.variant_key === groupEvidence.variant_key
      )) current.groupEvidence.push(groupEvidence);
      reviewByAssetId.set(assetId, current);
    };
    for (const review of plan.review) addReview(review.asset_id, [review.reason]);
    // Grouped assets can still be unsafe; export every asset in a flagged group
    // with the group's cross-format evidence, not just unassigned assets.
    for (const group of audit.flagged_groups) {
      const groupEvidence = {
        family_name: group.family_name, variant_name: group.variant_name, variant_key: group.variant_key,
        review_flags: group.review_flags,
        weight_classes_by_format: group.evidence_variation.weight_classes_by_format,
        source_paths: group.source_paths,
      };
      for (const asset of group.assets) addReview(asset.asset_id, group.review_flags, groupEvidence);
    }
    const candidates = [...reviewByAssetId.entries()].map(([assetId, review]) => {
      const asset = assetById.get(assetId);
      if (!asset) throw new Error(`Review candidate missing from normalized assets: ${assetId}`);
      return {
        asset_id: asset.asset_id,
        relative_path: asset.sources[0]?.relative_path || null,
        source_label: asset.sources[0]?.archive_label || null,
        extension: asset.metadata.extension,
        review_reasons: [...review.reasons].sort(),
        group_evidence: review.groupEvidence,
        metadata: {
          family_name: asset.metadata.family_name, subfamily_name: asset.metadata.subfamily_name,
          full_name: asset.metadata.full_name, postscript_name: asset.metadata.postscript_name,
          weight_class: asset.metadata.weight_class, is_italic: asset.metadata.is_italic,
          is_variable: asset.metadata.is_variable, glyph_count: asset.metadata.glyph_count,
          extension: asset.metadata.extension, status: asset.metadata.parser_status,
        },
      };
    });
    const reasonCounts = {};
    for (const candidate of candidates) for (const reason of candidate.review_reasons) {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }

    const slug = safeLabel(item.slug);
    const batchFiles = [];
    for (let offset = 0; offset < candidates.length; offset += batchSize) {
      const batchNumber = Math.floor(offset / batchSize) + 1;
      const filename = `${slug}-ambiguous-${String(batchNumber).padStart(3, '0')}.json`;
      const filePath = path.join(outputDir, filename);
      const batch = candidates.slice(offset, offset + batchSize).map(({ review_reason, ...candidate }) => candidate);
      fs.writeFileSync(filePath, JSON.stringify(batch, null, 2) + '\n', { flag: 'wx' });
      outputFiles.push(filePath);
      batchFiles.push({ file: filename, candidate_count: batch.length });
    }
    queueSummaries.push({
      slug: item.slug || null,
      unique_asset_count: uniqueAssets.length,
      candidate_count: candidates.length,
      unassigned_review_asset_count: plan.review.length,
      flagged_group_count: audit.flagged_group_count,
      flagged_group_asset_count: audit.flagged_group_asset_count,
      reason_counts: reasonCounts,
      batch_files: batchFiles,
    });
  }

  const manifest = {
    generated_at: new Date().toISOString(),
    mode: 'local-gemini-review-input-export',
    api_calls_performed: false,
    database_writes_performed: false,
    uploads_performed: false,
    batch_size: batchSize,
    output_files: outputFiles.length,
    queue_items: queueSummaries,
  };
  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  return { manifest, manifestPath, outputFiles: [...outputFiles, manifestPath] };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [reportPath, outputDir] = process.argv.slice(2);
  if (!reportPath || !outputDir) {
    console.error('Usage: node scripts/font-processing/export-ambiguous-assets.js <discovery-report.json> <output-directory>');
    process.exitCode = 2;
  } else {
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      const result = exportAmbiguousAssets(report, outputDir);
      console.log(JSON.stringify(result.manifest, null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
