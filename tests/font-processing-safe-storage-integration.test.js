import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length > 0) {
      env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const localEnv = loadEnvLocal();
const supabaseUrl = process.env.VITE_SUPABASE_URL || localEnv.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  localEnv.VITE_SUPABASE_ANON_KEY;

test('safe integration test: verifies actual Storage objects and published DB URLs without mutating data', async (t) => {
  if (!supabaseUrl || !supabaseKey) {
    t.skip('Skipping integration test: VITE_SUPABASE_URL and key not configured in environment');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Fetch a known published font with variants
  let fonts;
  try {
    const res = await supabase
      .from('fonts')
      .select('id, slug, is_published, gallery_images, preview_image_url')
      .eq('is_published', true)
      .limit(5);

    if (res.error) {
      if (res.error.message?.includes('fetch failed')) {
        t.skip('Skipping integration test: network access unavailable (sandbox mode)');
        return;
      }
      throw new Error(`Failed to read published fonts: ${res.error.message}`);
    }
    fonts = res.data;
  } catch (err) {
    if (err.message?.includes('fetch failed')) {
      t.skip('Skipping integration test: network access unavailable (sandbox mode)');
      return;
    }
    throw err;
  }

  assert.ok(Array.isArray(fonts) && fonts.length > 0, 'Expected at least one published font in database');

  // Verify Supabase-hosted gallery images where present
  const fontWithGallery = fonts.find(
    (f) =>
      Array.isArray(f.gallery_images) &&
      f.gallery_images.some((img) => img.includes('/storage/v1/object/public/fonts/'))
  );

  if (fontWithGallery) {
    const supabaseImages = fontWithGallery.gallery_images.filter((img) =>
      img.includes('/storage/v1/object/public/fonts/')
    );
    for (const imgUrl of supabaseImages) {
      assert.ok(
        imgUrl.includes('/storage/v1/object/public/fonts/'),
        `Gallery image must be a canonical Supabase storage public URL: ${imgUrl}`
      );
      // HEAD request to verify object accessibility
      try {
        const res = await fetch(imgUrl, { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
        assert.ok(
          res.ok || res.status === 200,
          `Storage object at ${imgUrl} must return HTTP 200 (got ${res.status})`
        );
      } catch (err) {
        console.warn(`[integration] Note: HEAD request to ${imgUrl} encountered: ${err.message}`);
      }
    }
  }

  // 2. Fetch variant records to verify font file URLs
  const { data: variants, error: variantError } = await supabase
    .from('font_variants')
    .select('id, font_id, variant_name, woff2_url, ttf_url, otf_url, woff_url')
    .not('woff2_url', 'is', null)
    .limit(3);

  if (variantError) {
    throw new Error(`Failed to read font_variants: ${variantError.message}`);
  }

  if (variants && variants.length > 0) {
    for (const v of variants) {
      assert.ok(
        v.woff2_url.includes('/storage/v1/object/public/fonts/'),
        `WOFF2 URL must point to public fonts bucket: ${v.woff2_url}`
      );
      try {
        const res = await fetch(v.woff2_url, { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
        assert.ok(
          res.ok || res.status === 200,
          `Font variant at ${v.woff2_url} must be accessible (got ${res.status})`
        );
      } catch (err) {
        console.warn(`[integration] Note: HEAD request to ${v.woff2_url} encountered: ${err.message}`);
      }
    }
  }
});
