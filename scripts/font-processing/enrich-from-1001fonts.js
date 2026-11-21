/**
 * enrich-from-1001fonts.js
 *
 * Called by the font-processing-pipeline when a queue item was created from
 * a 1001fonts import (queue row has a source_1001fonts value).
 *
 * It:
 *   1. Runs scrape-1001fonts.py to fetch name, author, images[], and zip URL.
 *   2. Downloads every gallery image from the 1001fonts CDN.
 *   3. Uploads them to Supabase Storage at the canonical gallery path
 *      ({uploaded_by}/{slug}/gallery/{index}-{filename}) — identical to
 *      what the Upload form does for manually-added images.
 *   4. Updates the fonts row: gallery_images (Supabase URLs), preview_image_url,
 *      gallery_image_sizes, and designer (if currently blank).
 *   5. Patches the queue item's download_urls to include the 1001fonts zip as
 *      a release-zip entry so the main pipeline can process it normally.
 *
 * Usage (called internally by process-queue.js):
 *   const result = await enrichFrom1001Fonts(supabase, item, fontPageUrl);
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRAPER = path.join(__dirname, '..', 'scrape-1001fonts.py');

/** Supabase Storage bucket for fonts (same as Upload.tsx). */
const STORAGE_BUCKET = 'fonts';

/**
 * Run the Python scraper synchronously and return parsed JSON.
 * @param {string} fontPageUrl
 * @returns {{ name: string, author: string|null, author_url: string|null, images: string[], download_zip: string|null, url: string }}
 */
export function scrape1001Fonts(fontPageUrl) {
  const output = execFileSync('python3', [SCRAPER, fontPageUrl], {
    timeout: 45_000,
    encoding: 'utf8',
  });
  return JSON.parse(output);
}

/**
 * Download a single image URL and return its bytes + detected content-type.
 * @param {string} url
 * @returns {Promise<{ bytes: Buffer, contentType: string, byteLength: number }>}
 */
async function downloadImage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  const contentType = res.headers.get('content-type') || 'image/avif';
  const arrayBuf = await res.arrayBuffer();
  return {
    bytes: Buffer.from(arrayBuf),
    contentType: contentType.split(';')[0].trim(),
    byteLength: arrayBuf.byteLength,
  };
}

/**
 * Derive a file extension from a URL or content-type.
 * @param {string} url
 * @param {string} contentType
 * @returns {string}  e.g. "avif"
 */
function guessExtension(url, contentType) {
  const urlExt = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (urlExt && ['avif', 'webp', 'jpg', 'jpeg', 'png', 'gif'].includes(urlExt)) return urlExt;
  const ctMap = {
    'image/avif': 'avif',
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
  };
  return ctMap[contentType] || 'avif';
}

/**
 * Upload gallery images scraped from 1001fonts to Supabase Storage,
 * then update the fonts row and queue item accordingly.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ id: string; font_id: string; slug: string; download_urls: any }} item  queue row
 * @param {string} fontPageUrl  the 1001fonts page URL
 * @returns {Promise<{ scraped: object; galleryUpdated: boolean; zipAdded: boolean; uploadedCount: number }>}
 */
export async function enrichFrom1001Fonts(supabase, item, fontPageUrl) {
  console.log(`  [1001fonts] Scraping ${fontPageUrl}…`);
  const scraped = scrape1001Fonts(fontPageUrl);
  console.log(`  [1001fonts] Got name="${scraped.name}", ${scraped.images?.length ?? 0} images, zip=${scraped.download_zip ?? 'none'}`);

  // ── 1. Resolve the storage folder (mirrors Upload.tsx: {uploaded_by}/{slug}/gallery/) ──
  const { data: fontRow, error: fontFetchErr } = await supabase
    .from('fonts')
    .select('id, slug, uploaded_by, gallery_images')
    .eq('id', item.font_id)
    .single();

  if (fontFetchErr || !fontRow) {
    throw new Error(`[1001fonts] Cannot fetch font row for ${item.font_id}: ${fontFetchErr?.message}`);
  }

  const slug = fontRow.slug || item.slug;
  // uploaded_by is a UUID (the user who triggered the upload / the admin who ran the workflow)
  const ownerId = fontRow.uploaded_by || 'pipeline';
  const galleryFolder = `${ownerId}/${slug}/gallery`;

  // ── 2. Download each image and upload to Supabase Storage ─────────────
  let galleryUpdated = false;
  let uploadedCount = 0;
  const storedUrls = [];
  const storedSizes = [];

  if (scraped.images && scraped.images.length > 0) {
    const ts = Date.now();

    for (let i = 0; i < scraped.images.length; i++) {
      const imgUrl = scraped.images[i];
      try {
        const { bytes, contentType, byteLength } = await downloadImage(imgUrl);
        const ext = guessExtension(imgUrl, contentType);

        // Mirror the naming convention from Upload.tsx: {timestamp}-{index}.{ext}
        const fileName = `${ts}-${i + 1}.${ext}`;
        const storagePath = `${galleryFolder}/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, bytes, {
            contentType,
            upsert: true,         // idempotent — safe to re-run
            cacheControl: '31536000',
          });

        if (uploadErr) {
          console.warn(`  [1001fonts] ✗ Failed to upload image ${i + 1}: ${uploadErr.message}`);
          // Fall back to the external CDN URL so gallery isn't empty
          storedUrls.push(imgUrl);
          storedSizes.push(0);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(storagePath);

        storedUrls.push(publicUrl);
        storedSizes.push(byteLength);
        uploadedCount++;
        console.log(`  [1001fonts]   ✓ Image ${i + 1}/${scraped.images.length} → ${storagePath}`);
      } catch (imgErr) {
        console.warn(`  [1001fonts]   ✗ Image ${i + 1} download failed: ${imgErr.message} — using CDN URL`);
        storedUrls.push(imgUrl);
        storedSizes.push(0);
      }
    }

    // ── 3. Update the fonts row with Supabase-hosted gallery URLs ────────
    const { error: updateErr } = await supabase
      .from('fonts')
      .update({
        gallery_images: storedUrls,
        preview_image_url: storedUrls[0],
        gallery_image_sizes: storedSizes,
        // Set designer from scraped author only when the stored value is a placeholder
        ...(scraped.author ? { designer: scraped.author } : {}),
      })
      .eq('id', item.font_id)
      .or('designer.eq.Unknown,designer.is.null');

    if (updateErr) {
      console.warn(`  [1001fonts] gallery_images update failed: ${updateErr.message}`);
    } else {
      galleryUpdated = true;
    }

    // Always overwrite gallery_images + preview (regardless of designer condition above)
    await supabase
      .from('fonts')
      .update({
        gallery_images: storedUrls,
        preview_image_url: storedUrls[0],
        gallery_image_sizes: storedSizes,
      })
      .eq('id', item.font_id);

    console.log(`  [1001fonts] ✓ gallery_images saved — ${uploadedCount} hosted in Supabase, ${storedUrls.length - uploadedCount} CDN fallbacks`);
  }

  // ── 4. Patch download_urls with the 1001fonts zip ──────────────────────
  let zipAdded = false;
  if (scraped.download_zip) {
    const existing = Array.isArray(item.download_urls) ? item.download_urls : [];
    const alreadyPresent = existing.some(
      (z) => typeof z === 'object' && z.url === scraped.download_zip,
    );

    if (!alreadyPresent) {
      const updated = [{ url: scraped.download_zip, label: '1001fonts' }, ...existing];
      const { error } = await supabase
        .from('font_processing_queue')
        .update({ download_urls: updated })
        .eq('id', item.id);

      if (error) {
        console.warn(`  [1001fonts] download_urls patch failed: ${error.message}`);
      } else {
        item.download_urls = updated;   // reflect in-memory so caller sees it
        zipAdded = true;
        console.log(`  [1001fonts] ✓ download_urls patched with 1001fonts zip`);
      }
    } else {
      console.log(`  [1001fonts] zip already present in download_urls, skipping patch`);
    }
  }

  return { scraped, galleryUpdated, zipAdded, uploadedCount };
}
