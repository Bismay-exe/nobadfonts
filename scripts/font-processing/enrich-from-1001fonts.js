/**
 * enrich-from-1001fonts.js
 *
 * Called by the font-processing-pipeline when a queue item was created from
 * a 1001fonts import (queue row has a source_1001fonts value).
 *
 * It:
 *   1. Runs scrape-1001fonts.py to fetch name, designer/author, author_url, full-size gallery images, and zip URL.
 *   2. Validates the CDN host, MIME type, and size of each gallery image.
 *   3. Uploads valid images to Supabase Storage at deterministic canonical paths:
 *      {uploaded_by}/{slug}/gallery/gallery-{index}-{urlHash}.{ext}
 *      Never silently falls back to external CDN URLs on upload failure.
 *   4. Merges newly uploaded URLs with any existing/manually uploaded gallery images without duplicating.
 *   5. Updates the fonts row: gallery_images (Supabase URLs), preview_image_url, gallery_image_sizes,
 *      and designer (only if currently null, empty, or 'Unknown' to preserve curated metadata).
 *   6. Patches the queue item's download_urls to include the 1001fonts zip URL if not already present.
 *   7. Checks every Storage and Database result for errors.
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRAPER = path.join(__dirname, '..', 'scrape-1001fonts.py');

/** Supabase Storage bucket for fonts. */
const STORAGE_BUCKET = 'fonts';

const ALLOWED_MIME_TYPES = new Set([
  'image/avif',
  'image/webp',
  'image/jpeg',
  'image/png',
  'image/gif',
]);

const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB

export function getPythonCommand() {
  return process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
}

/**
 * Validates that an image URL originates from an allowed 1001fonts CDN host.
 * @param {string} urlString
 * @returns {boolean}
 */
export function isAllowedCdnHost(urlString) {
  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();
    return (
      hostname === '1001fonts.com' ||
      hostname.endsWith('.1001fonts.com') ||
      hostname === '1001fonts.net' ||
      hostname.endsWith('.1001fonts.net')
    );
  } catch {
    return false;
  }
}

/**
 * Derive a deterministic file name for a gallery image from its sequence index, URL, and extension.
 * Format: gallery-01-a1b2c3d4e5f6.avif
 * @param {number} index
 * @param {string} url
 * @param {string} ext
 * @returns {string}
 */
export function generateStableGalleryFileName(index, url, ext) {
  const hash = crypto.createHash('sha256').update(String(url || '')).digest('hex').slice(0, 12);
  const seq = String(index + 1).padStart(2, '0');
  const safeExt = String(ext || 'avif').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'avif';
  return `gallery-${seq}-${hash}.${safeExt}`;
}

/**
 * Derive a file extension from a URL or content-type.
 * @param {string} url
 * @param {string} contentType
 * @returns {string}
 */
export function guessExtension(url, contentType = '') {
  const urlExt = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (urlExt && ['avif', 'webp', 'jpg', 'jpeg', 'png', 'gif'].includes(urlExt)) return urlExt;
  const ctMap = {
    'image/avif': 'avif',
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
  };
  return ctMap[contentType.split(';')[0].trim()] || 'avif';
}

/**
 * Run the Python scraper and return parsed JSON.
 * @param {string} fontPageUrl
 * @returns {{ name: string, designer?: string, author: string|null, author_url: string|null, images: string[], download_zip: string|null, url: string }}
 */
export function scrape1001Fonts(fontPageUrl) {
  const pyCmd = getPythonCommand();
  const output = execFileSync(pyCmd, [SCRAPER, fontPageUrl], {
    timeout: 45_000,
    encoding: 'utf8',
  });
  return JSON.parse(output);
}

/**
 * Download a single image URL and return its bytes + detected content-type.
 * Validates CDN host, response status, MIME type, and byte length.
 * @param {string} url
 * @returns {Promise<{ bytes: Buffer, contentType: string, byteLength: number }>}
 */
export async function downloadImage(url, fetchImpl = fetch) {
  if (!isAllowedCdnHost(url)) {
    throw new Error(`Untrusted CDN host for image URL: ${url}`);
  }

  const res = await fetchImpl(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }

  const rawContentType = res.headers.get('content-type') || '';
  const contentType = rawContentType.split(';')[0].trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    throw new Error(`Disallowed image MIME type "${contentType}" for ${url}`);
  }

  const arrayBuf = await res.arrayBuffer();
  const byteLength = arrayBuf.byteLength;
  if (byteLength === 0) {
    throw new Error(`Received empty image (0 bytes) from ${url}`);
  }
  if (byteLength > MAX_IMAGE_BYTES) {
    throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} byte limit (${byteLength} bytes) from ${url}`);
  }

  return {
    bytes: Buffer.from(arrayBuf),
    contentType,
    byteLength,
  };
}

/**
 * Merge existing gallery images and sizes with new ones, preserving order and avoiding duplicates.
 * @param {string[]} existingUrls
 * @param {Array<number|string>} existingSizes
 * @param {string[]} newUrls
 * @param {number[]} newSizes
 * @returns {{ mergedUrls: string[], mergedSizes: number[] }}
 */
export function mergeGalleryImages(existingUrls = [], existingSizes = [], newUrls = [], newSizes = []) {
  const mergedUrls = Array.isArray(existingUrls) ? [...existingUrls] : [];
  const mergedSizes = Array.isArray(existingSizes)
    ? existingSizes.map((s) => Number(s) || 0)
    : [];

  while (mergedSizes.length < mergedUrls.length) {
    mergedSizes.push(0);
  }

  const seen = new Set(mergedUrls);
  for (let i = 0; i < newUrls.length; i++) {
    const url = newUrls[i];
    if (!seen.has(url)) {
      seen.add(url);
      mergedUrls.push(url);
      mergedSizes.push(newSizes[i] ?? 0);
    }
  }

  return { mergedUrls, mergedSizes };
}

/**
 * Upload gallery images scraped from 1001fonts to Supabase Storage,
 * then update the fonts row and queue item accordingly.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ id: string; font_id: string; slug: string; download_urls: any }} item  queue row
 * @param {string} fontPageUrl  the 1001fonts page URL
 * @param {object} [options]
 * @param {typeof fetch} [options.fetchImpl]
 * @param {(url: string) => object} [options.scrapeImpl]
 * @returns {Promise<{ scraped: object; galleryUpdated: boolean; zipAdded: boolean; uploadedCount: number }>}
 */
export async function enrichFrom1001Fonts(supabase, item, fontPageUrl, options = {}) {
  console.log(`  [1001fonts] Scraping ${fontPageUrl}…`);
  const scrapeFn = options.scrapeImpl || scrape1001Fonts;
  const scraped = scrapeFn(fontPageUrl);
  console.log(
    `  [1001fonts] Got name="${scraped.name}", ${scraped.images?.length ?? 0} images, zip=${scraped.download_zip ?? 'none'}`
  );

  // ── 1. Fetch font row with curated metadata ───────────────────────────
  const { data: fontRow, error: fontFetchErr } = await supabase
    .from('fonts')
    .select('id, name, slug, designer, gallery_images, preview_image_url, gallery_image_sizes, uploaded_by, user_id')
    .eq('id', item.font_id)
    .single();

  if (fontFetchErr || !fontRow) {
    throw new Error(`[1001fonts] Cannot fetch font row for ${item.font_id}: ${fontFetchErr?.message || 'missing'}`);
  }

  const slug = fontRow.slug || item.slug;
  const ownerId = fontRow.uploaded_by || fontRow.user_id || 'pipeline';
  const galleryFolder = `${ownerId}/${slug}/gallery`;

  // ── 2. Download and upload images deterministically to Supabase Storage ─
  let galleryUpdated = false;
  let uploadedCount = 0;
  const newlyUploadedUrls = [];
  const newlyUploadedSizes = [];
  const fetchImpl = options.fetchImpl || fetch;

  if (Array.isArray(scraped.images) && scraped.images.length > 0) {
    for (let i = 0; i < scraped.images.length; i++) {
      const imgUrl = scraped.images[i];
      try {
        const { bytes, contentType, byteLength } = await downloadImage(imgUrl, fetchImpl);
        const ext = guessExtension(imgUrl, contentType);

        // Deterministic filename: gallery-01-a1b2c3d4e5f6.ext
        const fileName = generateStableGalleryFileName(i, imgUrl, ext);
        const storagePath = `${galleryFolder}/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, bytes, {
            contentType,
            upsert: true, // Idempotent across re-runs
            cacheControl: '31536000',
          });

        if (uploadErr) {
          console.warn(`  [1001fonts] ✗ Failed to upload image ${i + 1} (${storagePath}): ${uploadErr.message}`);
          // NEVER silently push external CDN URL after a failed upload!
          continue;
        }

        const { data: pubData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(storagePath);

        if (!pubData?.publicUrl) {
          console.warn(`  [1001fonts] ✗ Failed to resolve public URL for ${storagePath}`);
          continue;
        }

        newlyUploadedUrls.push(pubData.publicUrl);
        newlyUploadedSizes.push(byteLength);
        uploadedCount++;
        console.log(`  [1001fonts]   ✓ Image ${i + 1}/${scraped.images.length} → ${storagePath}`);
      } catch (imgErr) {
        console.warn(`  [1001fonts]   ✗ Image ${i + 1} rejected/failed: ${imgErr.message}`);
        // Never use external CDN URL as fallback
      }
    }

    // ── 3. Merge with existing gallery images and update fonts row ──────
    const { mergedUrls, mergedSizes } = mergeGalleryImages(
      fontRow.gallery_images,
      fontRow.gallery_image_sizes,
      newlyUploadedUrls,
      newlyUploadedSizes
    );

    const updates = {};
    if (mergedUrls.length > 0) {
      updates.gallery_images = mergedUrls;
      updates.gallery_image_sizes = mergedSizes;
      // Preserve existing preview_image_url if set, otherwise default to first gallery image
      updates.preview_image_url =
        (fontRow.preview_image_url && String(fontRow.preview_image_url).trim()) ||
        mergedUrls[0] ||
        null;
    }

    // Preserve curated designer: only update if currently empty or 'Unknown'
    const currentDesigner = String(fontRow.designer || '').trim();
    const isPlaceholderDesigner = !currentDesigner || currentDesigner.toLowerCase() === 'unknown';
    const scrapedAuthor = scraped.designer || scraped.author;
    if (isPlaceholderDesigner && scrapedAuthor) {
      updates.designer = scrapedAuthor;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabase
        .from('fonts')
        .update(updates)
        .eq('id', item.font_id);

      if (updateErr) {
        throw new Error(`[1001fonts] Failed to update fonts row for ${item.font_id}: ${updateErr.message}`);
      }
      galleryUpdated = true;
      console.log(
        `  [1001fonts] ✓ fonts row updated: ${mergedUrls.length} total gallery images (${uploadedCount} uploaded)`
      );
    }
  }

  // ── 4. Patch download_urls with confirmed 1001fonts zip URL ───────────
  let zipAdded = false;
  if (scraped.download_zip) {
    const existing = Array.isArray(item.download_urls) ? item.download_urls : [];
    const alreadyPresent = existing.some(
      (z) => typeof z === 'object' && z?.url === scraped.download_zip
    );

    if (!alreadyPresent) {
      const updated = [{ url: scraped.download_zip, label: '1001fonts' }, ...existing];
      const { error: patchErr } = await supabase
        .from('font_processing_queue')
        .update({ download_urls: updated })
        .eq('id', item.id);

      if (patchErr) {
        throw new Error(`[1001fonts] Failed to patch queue download_urls: ${patchErr.message}`);
      }
      item.download_urls = updated;
      zipAdded = true;
      console.log(`  [1001fonts] ✓ download_urls patched with 1001fonts zip`);
    } else {
      console.log(`  [1001fonts] zip already present in download_urls`);
    }
  }

  return { scraped, galleryUpdated, zipAdded, uploadedCount };
}
