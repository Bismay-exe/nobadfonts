/**
 * create-from-1001fonts.js
 *
 * Called by the "Import Font from 1001fonts" GitHub Actions workflow.
 *
 * Reads /tmp/scraped.json (produced by scrape-1001fonts.py), then:
 *   1. Downloads every gallery image from the 1001fonts CDN.
 *   2. Uploads them to Supabase Storage at the canonical path:
 *      {UPLOADER_USER_ID}/{slug}/gallery/{timestamp}-{index}.{ext}
 *      — identical to the Upload form's gallery handling.
 *   3. Inserts a fonts row with gallery_images = Supabase-hosted URLs.
 *   4. Enqueues in font_processing_queue with the 1001fonts zip URL
 *      and source_1001fonts marker so the pipeline has full context.
 *
 * Environment variables (injected by the workflow):
 *   VITE_SUPABASE_URL          Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY  Supabase service-role key
 *   SCRAPE_RESULT_PATH         Path to the JSON file produced by the scraper
 *   FONT_PAGE_URL              The original 1001fonts page URL
 *   UPLOADER_USER_ID           Supabase user UUID to attribute the upload to
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const STORAGE_BUCKET = 'fonts';

function slugify(value, fallback = 'font') {
  const slug = String(value || '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return slug || fallback;
}

/** Guess file extension from URL or content-type header. */
function guessExtension(url, contentType = '') {
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
 * Download a URL to a Buffer.
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
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const contentType = res.headers.get('content-type') || 'image/avif';
  const buf = Buffer.from(await res.arrayBuffer());
  return { bytes: buf, contentType: contentType.split(';')[0].trim(), byteLength: buf.length };
}

/**
 * Upload all scraped gallery images to Supabase Storage.
 * Returns arrays of [publicUrls] and [byteLengths].
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string[]} imageUrls    CDN URLs from the scraper
 * @param {string}   galleryFolder  storage folder: `{ownerId}/{slug}/gallery`
 * @returns {Promise<{ storedUrls: string[], storedSizes: number[], uploadedCount: number }>}
 */
async function uploadGalleryImages(supabase, imageUrls, galleryFolder) {
  const storedUrls = [];
  const storedSizes = [];
  let uploadedCount = 0;
  const ts = Date.now();

  for (let i = 0; i < imageUrls.length; i++) {
    const imgUrl = imageUrls[i];
    try {
      const { bytes, contentType, byteLength } = await downloadImage(imgUrl);
      const ext = guessExtension(imgUrl, contentType);
      const fileName = `${ts}-${i + 1}.${ext}`;
      const storagePath = `${galleryFolder}/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, bytes, {
          contentType,
          upsert: true,
          cacheControl: '31536000',
        });

      if (uploadErr) {
        console.warn(`  ✗ Image ${i + 1} upload failed: ${uploadErr.message} — using CDN URL as fallback`);
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
      console.log(`  ✓ Image ${i + 1}/${imageUrls.length} uploaded → ${storagePath}`);
    } catch (imgErr) {
      console.warn(`  ✗ Image ${i + 1} download failed: ${imgErr.message} — using CDN URL as fallback`);
      storedUrls.push(imgUrl);
      storedSizes.push(0);
    }
  }

  return { storedUrls, storedSizes, uploadedCount };
}

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const scrapePath = process.env.SCRAPE_RESULT_PATH || '/tmp/scraped.json';
  const fontPageUrl = process.env.FONT_PAGE_URL;
  const uploaderUserId = process.env.UPLOADER_USER_ID;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  if (!uploaderUserId) {
    console.error('Missing UPLOADER_USER_ID');
    process.exit(1);
  }

  // ── Load scrape result ───────────────────────────────────────────────
  if (!fs.existsSync(scrapePath)) {
    console.error(`Scrape result not found at ${scrapePath}`);
    process.exit(1);
  }

  const scraped = JSON.parse(fs.readFileSync(scrapePath, 'utf8'));
  console.log('Scraped data:', JSON.stringify(scraped, null, 2));

  if (scraped.error) {
    console.error(`Scraper returned an error: ${scraped.error}`);
    process.exit(1);
  }
  if (!scraped.name) {
    console.error('Scraper did not return a font name. Page layout may have changed.');
    process.exit(1);
  }
  if (!scraped.download_zip) {
    console.error('Scraper did not find a download ZIP link.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const slug = slugify(scraped.name);
  const author = scraped.author || 'Unknown';

  // ── Check for duplicates ─────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('fonts')
    .select('id, slug, gallery_images')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    console.log(`Font with slug "${slug}" already exists (id: ${existing.id})`);

    // If gallery_images is empty/null, upload and patch them now
    if (scraped.images?.length > 0 && (!existing.gallery_images || existing.gallery_images.length === 0)) {
      console.log(`Uploading ${scraped.images.length} gallery images for existing font…`);
      const galleryFolder = `${uploaderUserId}/${slug}/gallery`;
      const { storedUrls, storedSizes, uploadedCount } = await uploadGalleryImages(
        supabase, scraped.images, galleryFolder,
      );

      await supabase.from('fonts').update({
        gallery_images: storedUrls,
        preview_image_url: storedUrls[0],
        gallery_image_sizes: storedSizes,
      }).eq('id', existing.id);

      console.log(`✓ Gallery patched: ${uploadedCount}/${scraped.images.length} images hosted in Supabase`);
    }

    // Check if there's already a pending queue entry
    const { data: queueRow } = await supabase
      .from('font_processing_queue')
      .select('id')
      .eq('font_id', existing.id)
      .in('status', ['pending', 'processing'])
      .maybeSingle();

    if (!queueRow) {
      const { error: queueErr } = await supabase.from('font_processing_queue').insert({
        font_id: existing.id,
        slug,
        download_urls: [{ url: scraped.download_zip, label: '1001fonts' }],
        source_1001fonts: fontPageUrl || scraped.url,
      });
      if (queueErr) {
        console.error(`Queue insert failed: ${queueErr.message}`);
        process.exit(1);
      }
      console.log(`✓ Enqueued existing font "${scraped.name}" (${existing.id}) for reprocessing`);
    } else {
      console.log(`Font already has a pending queue entry — nothing to do.`);
    }
    return;
  }

  // ── Upload gallery images to Supabase Storage ────────────────────────
  const galleryFolder = `${uploaderUserId}/${slug}/gallery`;
  let storedUrls = [];
  let storedSizes = [];
  let uploadedCount = 0;

  if (scraped.images && scraped.images.length > 0) {
    console.log(`\nUploading ${scraped.images.length} gallery images to Supabase Storage…`);
    ({ storedUrls, storedSizes, uploadedCount } = await uploadGalleryImages(
      supabase, scraped.images, galleryFolder,
    ));
    console.log(`Gallery upload complete: ${uploadedCount}/${scraped.images.length} hosted in Supabase`);
  }

  // ── Build taxonomy JSON ──────────────────────────────────────────────
  const taxonomy = {
    identity: {
      name: scraped.name,
      family_name: scraped.name,
      slug,
      version: null,
      release_year: null,
    },
    creator: {
      designer: author,
      foundry: null,
      publisher: author,
    },
    classification: {
      category: 'display',
      subcategory: null,
      style: null,
      tags: ['display'],
      mood: [],
      recommended_uses: [],
    },
    description: {
      description: null,
      history: null,
      characteristics: null,
    },
    license: {
      distribution_status: 'unknown',
      license_type: 'Unknown',
      license_url: null,
      commercial_use: null,
      personal_use: true,
      modification_allowed: null,
      redistribution_allowed: null,
      license_evidence: `Imported from 1001fonts.com — ${fontPageUrl || scraped.url}`,
    },
    official_links: {
      official_website: null,
      official_font_page: fontPageUrl || scraped.url,
      purchase_url: null,
      free_download_url: scraped.download_zip,
      github_url: null,
      google_fonts_url: null,
    },
    technical: {
      formats: [],
      weights: [],
      styles: [],
      glyph_count: null,
      languages: ['Latin'],
      opentype_features: [],
    },
  };

  // ── Insert fonts row with Supabase-hosted gallery images ─────────────
  const { error: fontErr } = await supabase.from('fonts').insert([
    {
      name: scraped.name,
      slug,
      designer: author,
      category: 'display',
      tags: ['display'],
      description: null,
      license_type: 'Unknown',
      commercial_use: null,
      is_published: false,       // Hidden until pipeline completes + admin review
      uploaded_by: uploaderUserId,
      user_id: uploaderUserId,
      preview_image_url: storedUrls[0] ?? null,
      gallery_images: storedUrls.length > 0 ? storedUrls : null,
      gallery_image_sizes: storedSizes.length > 0 ? storedSizes : null,
      taxonomy,
    },
  ]);

  if (fontErr) {
    console.error(`fonts insert failed: ${fontErr.message}`);
    process.exit(1);
  }

  // Retrieve new font ID
  const { data: newFont, error: fetchErr } = await supabase
    .from('fonts')
    .select('id')
    .eq('slug', slug)
    .single();

  if (fetchErr || !newFont) {
    console.error(`Failed to retrieve newly inserted font: ${fetchErr?.message}`);
    process.exit(1);
  }

  console.log(`\n✓ Font row created: "${scraped.name}"`);
  console.log(`  id:   ${newFont.id}`);
  console.log(`  slug: ${slug}`);
  console.log(`  gallery images: ${uploadedCount} in Supabase, ${storedUrls.length - uploadedCount} CDN fallbacks`);

  // ── Enqueue for the font processing pipeline ─────────────────────────
  const { error: queueErr } = await supabase.from('font_processing_queue').insert({
    font_id: newFont.id,
    slug,
    download_urls: [{ url: scraped.download_zip, label: '1001fonts' }],
    source_1001fonts: fontPageUrl || scraped.url,
  });

  if (queueErr) {
    console.error(`Queue insert failed: ${queueErr.message}`);
    process.exit(1);
  }

  console.log(`✓ Enqueued for font-processing-pipeline`);
  console.log(`  ZIP:    ${scraped.download_zip}`);
  console.log(`  Source: ${fontPageUrl || scraped.url}`);
  console.log(`\nFont will be automatically processed and published by the pipeline on its next run.`);
}

main().catch((err) => {
  console.error('create-from-1001fonts failed:', err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
