import { createClient } from '@supabase/supabase-js';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { deduplicateAssets, planVariantGroups } from './core.js';
import { extractQueueItemAssets, cleanHttpUrl } from './extract-archive.js';
import { classifyAssets } from './gemini-classify.js';
import { publishStagedBatch } from './publishing-protocol.js';
import { createSupabasePublishingAdapter } from './supabase-publishing-adapter.js';
import { enrichFrom1001Fonts } from './enrich-from-1001fonts.js';

const normalizeKey = (value) =>
  String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');

function slugify(value, fallback = 'font') {
  const slug = String(value || '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return slug || fallback;
}

/** Stale processing timeout: 30 minutes */
export const STALE_PROCESSING_TIMEOUT_MS = Number(
  process.env.FONT_PROCESSING_STALE_TIMEOUT_MS || 30 * 60 * 1000
);

/**
 * Recover items stuck in 'processing' state older than timeout.
 * Reverts them to 'pending' so subsequent pipeline runs can process them.
 */
export async function recoverStaleProcessingItems(supabase, timeoutMs = STALE_PROCESSING_TIMEOUT_MS) {
  const staleCutoff = new Date(Date.now() - timeoutMs).toISOString();
  const { data: recovered, error } = await supabase
    .from('font_processing_queue')
    .update({ status: 'pending', error_message: 'Recovered from stale processing lock' })
    .eq('status', 'processing')
    .lt('updated_at', staleCutoff)
    .select('id, slug');

  if (error) {
    console.warn(`[queue] Stale processing recovery warning: ${error.message}`);
    return [];
  }
  return recovered || [];
}

/**
 * Atomically claim a queue item for processing.
 * Strictly prevents race conditions: only claims items that are currently 'pending' or 'error'.
 * Returns the claimed row, or null if another runner already claimed it.
 */
export async function claimQueueItem(supabase, itemId, eligibleStatuses = ['pending', 'error']) {
  const { data: claimed, error } = await supabase
    .from('font_processing_queue')
    .update({ status: 'processing', error_message: null })
    .eq('id', itemId)
    .in('status', eligibleStatuses)
    .select('id, font_id, slug, download_urls, source_1001fonts, status, created_at')
    .maybeSingle();

  if (error) {
    console.warn(`[queue] Failed to claim item ${itemId}: ${error.message}`);
    return null;
  }
  return claimed;
}

/**
 * Distinct sub-families present in the planned groups, each with its display name
 * and the parent family it nests under. Empty when the release is standalone.
 */
export function collectSubfamilies(groups) {
  const byKey = new Map();
  for (const group of groups) {
    if (!group.is_subfamily || !group.subfamily_name) continue;
    const key = normalizeKey(group.subfamily_name);
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        subfamily_name: group.subfamily_name,
        parent_family_name: group.parent_family_name || null,
      });
    }
  }
  return [...byKey.values()];
}

/**
 * Build the { assets, rows } inputs for publishStagedBatch from planned groups.
 * `bytesByHash` maps sha256 -> Buffer; `resolveFontId(group)` returns the fonts.id
 * the group publishes under. Pure: no network, no Supabase. One asset per sha256,
 * each referenced by exactly one publish row (deduped across formats upstream).
 */
export function buildPublishInputs(groups, bytesByHash, resolveFontId) {
  const assets = [];
  const rows = [];
  const seen = new Set();
  for (const group of groups) {
    if (group.conflicts?.length) {
      throw new Error(
        `Variant "${group.variant_name}" of "${group.family_name}" has ${group.conflicts.length} format conflict(s)`
      );
    }
    const fontId = resolveFontId(group);
    if (typeof fontId !== 'string' || !fontId.trim()) {
      throw new Error(`No font_id resolved for "${group.family_name}" / "${group.variant_name}"`);
    }
    for (const asset of group.assets) {
      const sha = String(asset.sha256).toLowerCase();
      const extension = String(asset.extension).replace(/^\./, '').toLowerCase();
      if (!seen.has(sha)) {
        const bytes = bytesByHash.get(sha);
        if (!bytes) throw new Error(`Missing bytes for asset ${sha}`);
        assets.push({
          assetId: sha,
          sha256: sha,
          fileName: `asset-${sha.slice(0, 32)}.${extension}`,
          bytes,
          sizeBytes: bytes.length,
        });
        seen.add(sha);
      }
      rows.push({
        assetId: sha,
        font_id: fontId,
        variant_name: group.variant_name,
        format: extension,
        size_bytes: asset.size_bytes ?? bytesByHash.get(sha)?.length ?? null,
      });
    }
  }
  return { assets, rows };
}

/**
 * Ensure parent/sub-family fonts rows exist for a nested release and return a
 * resolver from a planned group to its fonts.id. Standalone releases publish
 * directly under the uploaded parent font. Idempotent: existing sub-family rows
 * (matched by parent_font_id + lower(name)) are reused, so re-runs do not
 * duplicate records. Sub-family rows inherit curation fields from the parent.
 */
export async function ensureHierarchy(supabase, parentFont, groups) {
  const subfamilies = collectSubfamilies(groups);
  if (!subfamilies.length) {
    return { resolveFontId: () => parentFont.id, createdSubfamilies: [] };
  }

  if (parentFont.family_role !== 'parent') {
    const { error } = await supabase.from('fonts').update({ family_role: 'parent' }).eq('id', parentFont.id);
    if (error) throw new Error(`Failed to promote "${parentFont.slug}" to parent family: ${error.message}`);
  }

  const { data: existing, error: existingError } = await supabase
    .from('fonts')
    .select('id, name')
    .eq('parent_font_id', parentFont.id);
  if (existingError) throw new Error(`Failed to read existing sub-families: ${existingError.message}`);

  const parentKey = normalizeKey(parentFont.name);
  const subKey = (name) => {
    let key = normalizeKey(name);
    if (parentKey && key.startsWith(`${parentKey} `)) key = key.slice(parentKey.length + 1);
    return key;
  };
  const idByKey = new Map((existing || []).map((row) => [subKey(row.name), row.id]));

  const createdSubfamilies = [];
  for (const sub of subfamilies) {
    if (idByKey.has(sub.key)) continue;
    const subName =
      parentFont.name && !normalizeKey(sub.subfamily_name).startsWith(normalizeKey(parentFont.name))
        ? `${parentFont.name} ${sub.subfamily_name}`
        : sub.subfamily_name;
    const subSlug = `${parentFont.slug}-${slugify(sub.subfamily_name)}`;
    const row = {
      name: subName,
      slug: subSlug,
      family_role: 'subfamily',
      parent_font_id: parentFont.id,
      is_published: true,
      designer: parentFont.designer ?? 'Unknown',
      category: parentFont.category ?? 'sans',
      license_type: parentFont.license_type ?? parentFont.licenseType ?? null,
      commercial_use: parentFont.commercial_use ?? parentFont.commercialUse ?? null,
      tags: parentFont.tags ?? [],
      user_id: parentFont.user_id ?? null,
      uploaded_by: parentFont.uploaded_by ?? parentFont.user_id ?? null,
    };
    const { data: inserted, error } = await supabase.from('fonts').insert([row]).select('id, name').single();
    if (error) throw new Error(`Failed to create sub-family "${subName}": ${error.message}`);
    idByKey.set(sub.key, inserted.id);
    createdSubfamilies.push({ id: inserted.id, name: subName, slug: subSlug });
  }

  const resolveFontId = (group) => {
    if (group.is_subfamily && group.subfamily_name) {
      return idByKey.get(normalizeKey(group.subfamily_name)) || null;
    }
    return parentFont.id;
  };
  return { resolveFontId, createdSubfamilies };
}

/**
 * Process one claimed queue item end-to-end: extract, Gemini-classify, group,
 * create hierarchy, and publish via the atomic RPC. Returns a summary. Throws on
 * failure so the caller can mark the queue row as 'error'.
 */
export async function processQueueItem(supabase, item, options = {}) {
  // ── 1001fonts enrichment ──────────────────────────────────────────────────
  // When the queue entry carries a source_1001fonts URL we scrape the page
  // first so gallery images are saved and the zip URL is injected into
  // download_urls before the main extraction loop runs.
  const source1001Fonts =
    item.source_1001fonts ||
    (item.download_urls && typeof item.download_urls === 'object' && !Array.isArray(item.download_urls)
      ? item.download_urls.source_1001fonts
      : null);

  if (source1001Fonts) {
    try {
      await enrichFrom1001Fonts(supabase, item, source1001Fonts, {
        fetchImpl: options.fetchImpl,
        scrapeImpl: options.scrapeImpl,
      });
    } catch (enrichErr) {
      console.warn(`[1001fonts] Enrichment failed (continuing): ${enrichErr.message}`);
    }
  }

  // Ensure valid ZIP URLs exist before extraction
  const validZipUrls = Array.isArray(item.download_urls)
    ? item.download_urls.filter((u) => u && cleanHttpUrl(u.url))
    : [];
  if (!validZipUrls.length) {
    throw new Error(`No valid release ZIP URLs available for font "${item.slug || item.id}"`);
  }

  const extractFn = options.extractImpl || extractQueueItemAssets;
  const { assets: extracted, warnings } = await extractFn(item, { readBytes: true });
  if (!extracted || !extracted.length) {
    throw new Error(
      `No font files found in release archives${warnings?.length ? `: ${warnings.join('; ')}` : ''}`
    );
  }

  const overrides = await classifyAssets(extracted, {
    apiKey: options.geminiApiKey,
    fetchImpl: options.fetchImpl,
    onError: (error) => console.warn(`Gemini classification unavailable, using embedded metadata: ${error.message}`),
  });

  const bytesByHash = new Map();
  for (const asset of extracted) {
    const sha = String(asset.sha256).toLowerCase();
    bytesByHash.set(sha, asset.bytes);
    const override = overrides.get(sha);
    if (override) asset.metadata = { ...(asset.metadata || {}), overrides: override };
  }

  const unique = deduplicateAssets(
    extracted.map((asset) => ({
      sha256: asset.sha256,
      size_bytes: asset.size_bytes,
      extension: asset.extension,
      relative_path: asset.relative_path,
      archive_label: asset.source_label,
      metadata: { ...(asset.metadata || {}), extension: asset.extension },
    }))
  );
  const { groups, review } = planVariantGroups(unique);
  if (review.length) {
    const reasons = [...new Set(review.map((entry) => entry.reason))].join(', ');
    throw new Error(`${review.length} asset(s) need metadata review (${reasons}); no partial publish`);
  }
  if (!groups.length) throw new Error('No publishable variant groups were resolved');

  const { data: parentFont, error: fontError } = await supabase
    .from('fonts')
    .select('id, name, slug, family_role, designer, category, license_type, commercial_use, tags, user_id, uploaded_by')
    .eq('id', item.font_id)
    .single();
  if (fontError || !parentFont) {
    throw new Error(`Uploaded font ${item.font_id} not found: ${fontError?.message || 'missing'}`);
  }

  const { resolveFontId, createdSubfamilies } = await ensureHierarchy(supabase, parentFont, groups);
  const { assets, rows } = buildPublishInputs(groups, bytesByHash, resolveFontId);

  const batchId = `queue-${item.id}`;
  const adapter = options.adapter || createSupabasePublishingAdapter({ supabase });
  const result = await publishStagedBatch({ batchId, assets, rows, adapter });

  return {
    queue_id: item.id,
    font_id: item.font_id,
    batch_id: batchId,
    unique_assets: unique.length,
    variant_count: groups.length,
    rows: rows.length,
    subfamilies_created: createdSubfamilies.length,
    gemini_overrides_applied: overrides.size,
    publish_status: result.status,
  };
}

export async function drainQueue(supabase, options = {}) {
  const requestedQueueId = options.requestedQueueId?.trim() || null;
  const maxItems = Number(options.maxItems || 10);
  const geminiApiKey = options.geminiApiKey || null;

  // 1. Recover stale processing locks
  await recoverStaleProcessingItems(supabase);

  // 2. Fetch pending candidates
  let query = supabase
    .from('font_processing_queue')
    .select('id, font_id, slug, download_urls, source_1001fonts, status, created_at, updated_at')
    .order('created_at', { ascending: true });

  query = requestedQueueId
    ? query.eq('id', requestedQueueId)
    : query.in('status', ['pending', 'error']).limit(maxItems);

  const { data: items, error } = await query;
  if (error) throw new Error(`Queue read failed: ${error.message}`);
  if (!items?.length) {
    console.log(requestedQueueId ? `No queue row found for id ${requestedQueueId}` : 'No pending queue items.');
    return { processed: 0, failed: 0, items: [] };
  }

  const results = [];
  const errors = [];

  for (const candidate of items) {
    // 3. Atomically claim candidate row to prevent concurrent processing
    const item = await claimQueueItem(supabase, candidate.id);
    if (!item) {
      console.warn(`Skipping ${candidate.slug || candidate.id}: already claimed by another runner`);
      continue;
    }

    try {
      const summary = await processQueueItem(supabase, item, {
        geminiApiKey,
        fetchImpl: options.fetchImpl,
        scrapeImpl: options.scrapeImpl,
        extractImpl: options.extractImpl,
        adapter: options.adapter,
      });

      // 4. Update status to completed and check DB result!
      const { error: completeErr } = await supabase
        .from('font_processing_queue')
        .update({ status: 'completed', error_message: null })
        .eq('id', item.id);

      if (completeErr) {
        throw new Error(`Failed to update status to completed: ${completeErr.message}`);
      }

      results.push(summary);
      console.log(
        `✓ ${item.slug || item.id}: ${summary.variant_count} variant(s), ${summary.subfamilies_created} sub-famil(ies) created`
      );
    } catch (itemError) {
      const message = itemError instanceof Error ? itemError.message : String(itemError);
      errors.push({ id: item.id, slug: item.slug, error: message });

      // Check error status update DB result
      const { error: errUpdateErr } = await supabase
        .from('font_processing_queue')
        .update({ status: 'error', error_message: message.slice(0, 2000) })
        .eq('id', item.id);

      if (errUpdateErr) {
        console.error(`✗ Failed to record error status for ${item.slug || item.id}: ${errUpdateErr.message}`);
      }
      console.error(`✗ ${item.slug || item.id}: ${message}`);
    }
  }

  return {
    processed: results.length,
    failed: errors.length,
    items: results,
    errors,
  };
}

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const requestedQueueId = process.env.FONT_PROCESSING_QUEUE_ID?.trim() || null;
  const maxItems = Number(process.env.FONT_PROCESSING_MAX_ITEMS || 10);
  const geminiApiKey = process.env.GEMINI_API_KEY || null;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const outcome = await drainQueue(supabase, {
    requestedQueueId,
    maxItems,
    geminiApiKey,
  });

  console.log(JSON.stringify(outcome, null, 2));

  // Exit with non-zero code if any item failed
  if (outcome.failed > 0) {
    console.error(`Font processing queue finished with ${outcome.failed} failed item(s).`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error('Font processing pipeline failed:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
