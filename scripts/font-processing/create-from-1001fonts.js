/**
 * create-from-1001fonts.js
 *
 * Called during the consolidated Font Processing Pipeline workflow when a
 * manual 1001fonts URL import is triggered.
 *
 * It:
 *   1. Scrapes the 1001fonts page (name, designer/author, zip URL).
 *   2. Creates a stub fonts row (or reuses existing font) with minimal curated metadata.
 *   3. Enqueues the font in font_processing_queue with source_1001fonts.
 *   Note: Gallery images are NOT uploaded here. They are downloaded, validated, and uploaded
 *   exactly once during the main enrichment phase (enrich-from-1001fonts.js).
 *
 * Environment variables:
 *   VITE_SUPABASE_URL          Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY  Supabase service-role key
 *   FONT_PAGE_URL              The 1001fonts page URL
 *   UPLOADER_USER_ID           Supabase user UUID to attribute the upload to
 *   SCRAPE_RESULT_PATH         (Optional) Path to pre-scraped JSON file
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import { scrape1001Fonts } from './enrich-from-1001fonts.js';

export function slugify(value, fallback = 'font') {
  const slug = String(value || '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return slug || fallback;
}

export const PATTERN_1001FONTS = /^https?:\/\/(?:www\.)?1001fonts\.com\/([a-zA-Z0-9_-]+-font\.html)(?:[?#].*)?$/i;

export function normalize1001FontsUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const match = rawUrl.trim().match(PATTERN_1001FONTS);
  if (!match) return null;
  return `https://www.1001fonts.com/${match[1].toLowerCase()}`;
}

export async function createFrom1001Fonts({
  supabase,
  fontPageUrl,
  uploaderUserId,
  scrapeResultPath,
  scrapeImpl,
}) {
  const normalizedUrl = normalize1001FontsUrl(fontPageUrl);
  if (!normalizedUrl && !scrapeResultPath) {
    throw new Error(`Invalid 1001fonts page URL: "${fontPageUrl}"`);
  }
  if (!uploaderUserId || typeof uploaderUserId !== 'string' || !uploaderUserId.trim()) {
    throw new Error('uploaderUserId is required');
  }

  // ── 1. Acquire scraped metadata ─────────────────────────────────────
  let scraped;
  if (scrapeResultPath && fs.existsSync(scrapeResultPath)) {
    scraped = JSON.parse(fs.readFileSync(scrapeResultPath, 'utf8'));
  } else {
    const scraper = scrapeImpl || scrape1001Fonts;
    scraped = scraper(normalizedUrl || fontPageUrl);
  }

  if (!scraped || scraped.error) {
    throw new Error(`Scraper failed: ${scraped?.error || 'unknown error'}`);
  }
  if (!scraped.name || typeof scraped.name !== 'string') {
    throw new Error('Scraper did not return a valid font name');
  }

  const slug = slugify(scraped.name);
  const author = scraped.designer || scraped.author || 'Unknown';
  const pageSourceUrl = normalizedUrl || scraped.url || fontPageUrl;
  const downloadUrls = scraped.download_zip
    ? [{ url: scraped.download_zip, label: '1001fonts' }]
    : [];

  // ── 2. Check for existing font by slug ────────────────────────────────
  const { data: existing, error: existingErr } = await supabase
    .from('fonts')
    .select('id, slug, family_role')
    .eq('slug', slug)
    .maybeSingle();

  if (existingErr) {
    throw new Error(`Failed to query existing font: ${existingErr.message}`);
  }

  let fontId;
  if (existing) {
    fontId = existing.id;
    console.log(`Font with slug "${slug}" already exists (id: ${fontId})`);
  } else {
    // ── 3. Insert stub font row without gallery images ──────────────────
    // Conservative license and unpublished state by default
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
        author_url: scraped.author_url || null,
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
        license_evidence: `Imported from 1001fonts.com — ${pageSourceUrl}`,
      },
      official_links: {
        official_website: null,
        official_font_page: pageSourceUrl,
        purchase_url: null,
        free_download_url: scraped.download_zip || null,
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

    const newFontRow = {
      name: scraped.name,
      slug,
      designer: author,
      category: 'display',
      tags: ['display'],
      description: null,
      license_type: 'Unknown',
      commercial_use: null,
      is_published: false, // Hidden until pipeline completes + admin review
      uploaded_by: uploaderUserId,
      user_id: uploaderUserId,
      preview_image_url: null,
      gallery_images: null,
      gallery_image_sizes: null,
      family_role: 'standalone',
      taxonomy,
    };

    const { data: insertedFont, error: fontErr } = await supabase
      .from('fonts')
      .insert([newFontRow])
      .select('id')
      .single();

    if (fontErr || !insertedFont) {
      throw new Error(`Failed to insert stub font row: ${fontErr?.message || 'missing'}`);
    }

    fontId = insertedFont.id;
    console.log(`✓ Stub font row created: "${scraped.name}" (${fontId})`);
  }

  // ── 4. Ensure queue item exists ──────────────────────────────────────
  const { data: queueRow, error: queueCheckErr } = await supabase
    .from('font_processing_queue')
    .select('id, status')
    .eq('font_id', fontId)
    .in('status', ['pending', 'processing'])
    .maybeSingle();

  if (queueCheckErr) {
    throw new Error(`Queue lookup failed: ${queueCheckErr.message}`);
  }

  let queueId = queueRow?.id;
  if (!queueRow) {
    const queuePayload = {
      font_id: fontId,
      slug,
      download_urls: downloadUrls,
      source_1001fonts: pageSourceUrl,
      status: 'pending',
    };

    const { data: insertedQueue, error: queueInsertErr } = await supabase
      .from('font_processing_queue')
      .insert([queuePayload])
      .select('id')
      .single();

    if (queueInsertErr || !insertedQueue) {
      throw new Error(`Failed to enqueue font: ${queueInsertErr?.message || 'missing'}`);
    }

    queueId = insertedQueue.id;
    console.log(`✓ Enqueued font for processing (queue id: ${queueId})`);
  } else {
    console.log(`Queue item already exists for font (queue id: ${queueId})`);
  }

  return { fontId, queueId, slug };
}

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const fontPageUrl = process.env.FONT_PAGE_URL;
  const uploaderUserId = process.env.UPLOADER_USER_ID;
  const scrapeResultPath = process.env.SCRAPE_RESULT_PATH;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  if (!uploaderUserId) {
    console.error('Missing UPLOADER_USER_ID');
    process.exit(1);
  }
  if (!fontPageUrl && !scrapeResultPath) {
    console.error('Missing FONT_PAGE_URL or SCRAPE_RESULT_PATH');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const result = await createFrom1001Fonts({
    supabase,
    fontPageUrl,
    uploaderUserId,
    scrapeResultPath,
  });

  // Export queue_id to GITHUB_OUTPUT if running inside GitHub Actions
  if (process.env.GITHUB_OUTPUT && result.queueId) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `queue_id=${result.queueId}\n`);
  }

  console.log(`Successfully completed 1001fonts import initialization: queue_id=${result.queueId}`);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main().catch((err) => {
    console.error('create-from-1001fonts failed:', err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  });
}
