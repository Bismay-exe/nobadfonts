import { createClient } from '@supabase/supabase-js';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { deduplicateAssets, planVariantGroups } from './core.js';
import { extractQueueItemAssets } from './extract-archive.js';
import { classifyAssets } from './gemini-classify.js';
import { publishStagedBatch } from './publishing-protocol.js';
import { createSupabasePublishingAdapter } from './supabase-publishing-adapter.js';

const normalizeKey = (value) => String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');

function slugify(value, fallback = 'font') {
  const slug = String(value || '').normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return slug || fallback;
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
      throw new Error(`Variant "${group.variant_name}" of "${group.family_name}" has ${group.conflicts.length} format conflict(s)`);
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
    .from('fonts').select('id, name').eq('parent_font_id', parentFont.id);
  if (existingError) throw new Error(`Failed to read existing sub-families: ${existingError.message}`);
  // Match existing rows by their bare sub-family label (parent prefix stripped),
  // so "Monaspace Xenon" is reused for the "Xenon" sub-family rather than duplicated.
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
    const subName = parentFont.name && !normalizeKey(sub.subfamily_name).startsWith(normalizeKey(parentFont.name))
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
  const { assets: extracted, warnings } = await extractQueueItemAssets(item, { readBytes: true });
  if (!extracted.length) {
    throw new Error(`No font files found in release archives${warnings.length ? `: ${warnings.join('; ')}` : ''}`);
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

  const unique = deduplicateAssets(extracted.map((asset) => ({
    sha256: asset.sha256,
    size_bytes: asset.size_bytes,
    extension: asset.extension,
    relative_path: asset.relative_path,
    archive_label: asset.source_label,
    // The Python parser does not emit the file extension; inject it so the
    // deterministic core can resolve the variant/format.
    metadata: { ...(asset.metadata || {}), extension: asset.extension },
  })));
  const { groups, review } = planVariantGroups(unique);
  if (review.length) {
    const reasons = [...new Set(review.map((entry) => entry.reason))].join(', ');
    throw new Error(`${review.length} asset(s) need metadata review (${reasons}); no partial publish`);
  }
  if (!groups.length) throw new Error('No publishable variant groups were resolved');

  const { data: parentFont, error: fontError } = await supabase
    .from('fonts')
    .select('id, name, slug, family_role, designer, category, license_type, commercial_use, tags, user_id, uploaded_by')
    .eq('id', item.font_id).single();
  if (fontError || !parentFont) throw new Error(`Uploaded font ${item.font_id} not found: ${fontError?.message || 'missing'}`);

  const { resolveFontId, createdSubfamilies } = await ensureHierarchy(supabase, parentFont, groups);
  const { assets, rows } = buildPublishInputs(groups, bytesByHash, resolveFontId);

  const batchId = `queue-${item.id}`;
  const adapter = createSupabasePublishingAdapter({ supabase });
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

  let query = supabase
    .from('font_processing_queue')
    .select('id, font_id, slug, download_urls, status, created_at')
    .order('created_at', { ascending: true });
  query = requestedQueueId ? query.eq('id', requestedQueueId) : query.in('status', ['pending', 'error']).limit(maxItems);

  const { data: items, error } = await query;
  if (error) throw new Error(`Queue read failed: ${error.message}`);
  if (!items?.length) {
    console.log(requestedQueueId ? `No queue row found for id ${requestedQueueId}` : 'No pending queue items.');
    return;
  }

  const results = [];
  for (const item of items) {
    // Claim the row so overlapping scheduled runs do not double-process it.
    const { data: claimed, error: claimError } = await supabase
      .from('font_processing_queue')
      .update({ status: 'processing', error_message: null })
      .eq('id', item.id)
      .in('status', ['pending', 'error', 'processing'])
      .select('id').single();
    if (claimError || !claimed) {
      console.warn(`Skipping ${item.id}: could not claim (${claimError?.message || 'already claimed'})`);
      continue;
    }
    try {
      const summary = await processQueueItem(supabase, item, { geminiApiKey });
      await supabase.from('font_processing_queue')
        .update({ status: 'completed', error_message: null }).eq('id', item.id);
      results.push(summary);
      console.log(`✓ ${item.slug || item.id}: ${summary.variant_count} variant(s), ${summary.subfamilies_created} sub-famil(ies) created`);
    } catch (itemError) {
      const message = itemError instanceof Error ? itemError.message : String(itemError);
      await supabase.from('font_processing_queue')
        .update({ status: 'error', error_message: message.slice(0, 2000) }).eq('id', item.id);
      console.error(`✗ ${item.slug || item.id}: ${message}`);
    }
  }
  console.log(JSON.stringify({ processed: results.length, items: results }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error('Font processing pipeline failed:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
