import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { deduplicateAssets, planVariantGroups } from './core.js';
import { assertProductionWriteEnabled } from './write-gate.js';
import { publishStagedBatch } from './publishing-protocol.js';
import { createSupabasePublishingAdapter } from './supabase-publishing-adapter.js';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const normalizeFamily = (value) => String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');

export function assertStagingOnly(env = process.env) {
  if (env.FONT_PROCESSING_TARGET !== 'staging') throw new Error('Publishing runner is staging-only; set FONT_PROCESSING_TARGET=staging explicitly');
  if (!env.FONT_PROCESSING_STAGING_SUPABASE_URL || !env.FONT_PROCESSING_STAGING_SERVICE_ROLE_KEY) {
    throw new Error('Missing isolated staging credentials: FONT_PROCESSING_STAGING_SUPABASE_URL and FONT_PROCESSING_STAGING_SERVICE_ROLE_KEY');
  }
  return { url: env.FONT_PROCESSING_STAGING_SUPABASE_URL, serviceRoleKey: env.FONT_PROCESSING_STAGING_SERVICE_ROLE_KEY };
}

export function buildPublishPlan(manifest, { baseDir = process.cwd() } = {}) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('Manifest must be a JSON object');
  if (typeof manifest.batch_id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(manifest.batch_id) || manifest.batch_id.includes('..')) throw new Error('Manifest requires a safe batch_id');
  if (!Array.isArray(manifest.assets) || !manifest.assets.length) throw new Error('Manifest assets must be a non-empty array');
  if (!manifest.font_ids || typeof manifest.font_ids !== 'object' || Array.isArray(manifest.font_ids)) throw new Error('Manifest requires an explicit font_ids mapping keyed by embedded family name');

  const assets = manifest.assets.map((item, index) => {
    if (!item || typeof item !== 'object' || typeof item.file_path !== 'string' || !item.file_path.trim()) throw new Error(`Asset ${index} requires file_path`);
    const resolvedBase = path.resolve(baseDir);
    const filePath = path.resolve(resolvedBase, item.file_path);
    const relativePath = path.relative(resolvedBase, filePath);
    if (!relativePath || relativePath === '.' || relativePath.startsWith(`..${path.sep}`) || relativePath === '..' || path.isAbsolute(relativePath)) {
      throw new Error(`Asset ${index} file_path must resolve to a file inside the manifest directory`);
    }
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) throw new Error(`Asset ${index} file_path must be a regular file`);
    const bytes = fs.readFileSync(filePath);
    const actualHash = sha256(bytes);
    if (item.sha256 && String(item.sha256).toLowerCase() !== actualHash) throw new Error(`SHA-256 mismatch for ${item.file_path}`);
    if (item.size_bytes != null && item.size_bytes !== bytes.length) throw new Error(`Size mismatch for ${item.file_path}`);
    return {
      assetId: actualHash,
      sha256: actualHash,
      sizeBytes: bytes.length,
      fileName: `asset-${actualHash.slice(0, 32)}.${path.extname(filePath).slice(1).toLowerCase()}`,
      bytes,
      extension: path.extname(filePath).toLowerCase(),
      path: item.file_path,
      archive_label: item.archive_label ?? null,
      relative_path: item.relative_path ?? item.file_path,
      metadata: { ...(item.metadata || {}), extension: path.extname(filePath) },
    };
  });

  const uniqueAssets = deduplicateAssets(assets.map((asset) => ({
    asset_id: asset.assetId,
    sha256: asset.sha256,
    size_bytes: asset.sizeBytes,
    extension: asset.extension,
    path: asset.path,
    archive_label: asset.archive_label,
    metadata: asset.metadata,
  })));
  const { groups, review } = planVariantGroups(uniqueAssets);
  if (review.length) throw new Error(`Publish plan blocked: ${review.length} asset(s) require metadata review; no writes attempted`);
  const conflicts = groups.flatMap((group) => group.conflicts.map((conflict) => ({ family_name: group.family_name, variant_name: group.variant_name, ...conflict })));
  if (conflicts.length) throw new Error(`Publish plan blocked: ${conflicts.length} variant/format conflict(s); no writes attempted`);

  const byHash = new Map(assets.map((asset) => [asset.sha256, asset]));
  const fontIds = new Map(Object.entries(manifest.font_ids).map(([family, id]) => [normalizeFamily(family), id]));
  const rows = [];
  const assigned = new Set();
  for (const group of groups) {
    const fontId = fontIds.get(normalizeFamily(group.family_name));
    if (typeof fontId !== 'string' || !fontId.trim()) throw new Error(`No explicit font_ids entry for embedded family "${group.family_name}"`);
    for (const asset of group.assets) {
      const bytesAsset = byHash.get(asset.sha256);
      if (!bytesAsset) throw new Error(`Missing bytes for planned asset ${asset.asset_id}`);
      assigned.add(asset.sha256);
      rows.push({
        assetId: asset.asset_id,
        font_id: fontId,
        variant_name: group.variant_name,
        format: asset.extension.slice(1),
        size_bytes: asset.size_bytes,
      });
    }
  }
  if (assigned.size !== uniqueAssets.length) throw new Error('Publish plan did not account for every unique asset; no writes attempted');
  return {
    batchId: manifest.batch_id,
    assets: uniqueAssets.map((asset) => {
      const local = byHash.get(asset.sha256);
      if (!local) throw new Error(`Missing source file for ${asset.sha256}`);
      return { assetId: asset.asset_id, fileName: local.fileName, bytes: local.bytes, sha256: local.sha256, sizeBytes: local.sizeBytes };
    }),
    rows,
    summary: {
      inputAssetCount: assets.length,
      uniqueAssetCount: uniqueAssets.length,
      groupedAssetCount: assigned.size,
      variantCount: groups.length,
      rowCount: rows.length,
      families: [...new Set(groups.map((group) => group.family_name))],
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const manifestArg = args.find((arg) => !arg.startsWith('--'));
  if (!manifestArg) throw new Error('Usage: node scripts/font-processing/publish-plan.js <manifest.json> [--apply]');
  const manifestPath = path.resolve(manifestArg);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const plan = buildPublishPlan(manifest, { baseDir: path.dirname(manifestPath) });
  console.log(JSON.stringify({ mode: apply ? 'APPLY' : 'DRY_RUN', batchId: plan.batchId, ...plan.summary }, null, 2));
  if (!apply) {
    console.log('Dry run only. No Supabase client was created and no Storage/database writes were attempted.');
    return;
  }

  assertProductionWriteEnabled();
  const staging = assertStagingOnly(process.env);
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(staging.url, staging.serviceRoleKey);
  const adapter = createSupabasePublishingAdapter({ supabase });
  const result = await publishStagedBatch({
    batchId: plan.batchId,
    assets: plan.assets,
    rows: plan.rows,
    adapter,
  });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
