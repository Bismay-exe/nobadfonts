import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertStagingOnly, buildPublishPlan, resolvePublishingTarget } from '../scripts/font-processing/publish-plan.js';

const metadata = (family, subfamily, weight) => ({
  family_name: family,
  subfamily_name: subfamily,
  weight_class: weight,
  is_italic: false,
  is_variable: false,
  glyph_count: 200,
  status: 'parsed',
});

function fixture(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nbf-publish-plan-'));
  try { return run(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('builds a deterministic publish plan from embedded metadata and explicit font IDs', () => fixture((dir) => {
  fs.writeFileSync(path.join(dir, 'regular.woff2'), Buffer.from('regular-font-bytes'));
  fs.writeFileSync(path.join(dir, 'bold.woff2'), Buffer.from('bold-font-bytes'));
  const plan = buildPublishPlan({
    batch_id: 'test-batch-1',
    font_ids: { 'Mona Sans': '11111111-1111-4111-8111-111111111111' },
    assets: [
      { file_path: 'regular.woff2', metadata: metadata('Mona Sans', 'Regular', 400) },
      { file_path: 'bold.woff2', metadata: metadata('Mona Sans', 'Bold', 700) },
    ],
  }, { baseDir: dir });
  assert.equal(plan.summary.inputAssetCount, 2);
  assert.equal(plan.summary.uniqueAssetCount, 2);
  assert.equal(plan.summary.variantCount, 2);
  assert.equal(plan.rows.length, 2);
  assert.ok(plan.rows.every((row) => row.font_id === '11111111-1111-4111-8111-111111111111'));
  assert.deepEqual(plan.rows.map((row) => row.variant_name).sort(), ['Bold', 'Regular']);
  assert.ok(plan.assets.every((asset) => asset.fileName.startsWith('asset-')));
}));

test('blocks missing or ambiguous metadata rather than guessing family or variant', () => fixture((dir) => {
  fs.writeFileSync(path.join(dir, 'unknown.woff2'), Buffer.from('unknown-font-bytes'));
  assert.throws(() => buildPublishPlan({
    batch_id: 'test-batch-2',
    font_ids: {},
    assets: [{ file_path: 'unknown.woff2', metadata: { status: 'parsed' } }],
  }, { baseDir: dir }), /require metadata review/);
}));

test('blocks filename/hash/size mismatches and missing explicit font mapping', () => fixture((dir) => {
  fs.writeFileSync(path.join(dir, 'regular.woff2'), Buffer.from('actual-bytes'));
  assert.throws(() => buildPublishPlan({
    batch_id: 'test-batch-3', font_ids: { 'Mona Sans': 'id' },
    assets: [{ file_path: 'regular.woff2', sha256: '0'.repeat(64), metadata: metadata('Mona Sans', 'Regular', 400) }],
  }, { baseDir: dir }), /SHA-256 mismatch/);
  assert.throws(() => buildPublishPlan({
    batch_id: 'test-batch-4', font_ids: {},
    assets: [{ file_path: 'regular.woff2', metadata: metadata('Mona Sans', 'Regular', 400) }],
  }, { baseDir: dir }), /No explicit font_ids entry/);
}));

test('deduplicates byte-identical source assets but rejects distinct assets in same variant format', () => fixture((dir) => {
  fs.writeFileSync(path.join(dir, 'copy-a.woff2'), Buffer.from('same-bytes'));
  fs.writeFileSync(path.join(dir, 'copy-b.woff2'), Buffer.from('same-bytes'));
  const deduped = buildPublishPlan({
    batch_id: 'test-batch-5', font_ids: { 'Mona Sans': 'font-id' },
    assets: [
      { file_path: 'copy-a.woff2', metadata: metadata('Mona Sans', 'Regular', 400) },
      { file_path: 'copy-b.woff2', metadata: metadata('Mona Sans', 'Regular', 400) },
    ],
  }, { baseDir: dir });
  assert.equal(deduped.summary.uniqueAssetCount, 1);
  fs.writeFileSync(path.join(dir, 'copy-c.woff2'), Buffer.from('different-bytes'));
  assert.throws(() => buildPublishPlan({
    batch_id: 'test-batch-6', font_ids: { 'Mona Sans': 'font-id' },
    assets: [
      { file_path: 'copy-a.woff2', metadata: metadata('Mona Sans', 'Regular', 400) },
      { file_path: 'copy-c.woff2', metadata: metadata('Mona Sans', 'Regular', 400) },
    ],
  }, { baseDir: dir }), /variant\/format conflict/);
}));

test('refuses manifest asset paths that escape the manifest directory', () => fixture((dir) => {
  const outside = path.join(path.dirname(dir), 'outside-font.woff2');
  fs.writeFileSync(outside, Buffer.from('outside-font-bytes'));
  try {
    assert.throws(() => buildPublishPlan({
      batch_id: 'test-batch-path',
      font_ids: {},
      assets: [{ file_path: '../outside-font.woff2', metadata: metadata('Mona Sans', 'Regular', 400) }],
    }, { baseDir: dir }), /inside the manifest directory/);
  } finally {
    fs.rmSync(outside, { force: true });
  }
}));

test('apply-mode configuration accepts only explicit isolated staging credentials', () => {
  assert.throws(() => assertStagingOnly({
    VITE_SUPABASE_URL: 'https://production.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'production-key',
  }), /staging-only/);
  assert.throws(() => assertStagingOnly({
    FONT_PROCESSING_TARGET: 'staging',
    VITE_SUPABASE_URL: 'https://production.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'production-key',
  }), /isolated staging credentials/);
  assert.deepEqual(assertStagingOnly({
    FONT_PROCESSING_TARGET: 'staging',
    FONT_PROCESSING_STAGING_SUPABASE_URL: 'https://staging-project.supabase.co',
    FONT_PROCESSING_STAGING_SERVICE_ROLE_KEY: 'staging-key',
    VITE_SUPABASE_URL: 'https://production.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'production-key',
  }), { url: 'https://staging-project.supabase.co', serviceRoleKey: 'staging-key' });
});


test('main publishing requires a separate explicit opt-in and dedicated credentials', () => {
  assert.throws(() => resolvePublishingTarget({
    FONT_PROCESSING_TARGET: 'main',
    FONT_PROCESSING_MAIN_SUPABASE_URL: 'https://main-project.supabase.co',
    FONT_PROCESSING_MAIN_SERVICE_ROLE_KEY: 'main-key',
  }), /FONT_PROCESSING_ALLOW_MAIN_PUBLISHING=true/);
  assert.throws(() => resolvePublishingTarget({
    FONT_PROCESSING_TARGET: 'main',
    FONT_PROCESSING_ALLOW_MAIN_PUBLISHING: 'true',
    VITE_SUPABASE_URL: 'https://production.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'production-key',
  }), /Missing explicit main-project credentials/);
  assert.deepEqual(resolvePublishingTarget({
    FONT_PROCESSING_TARGET: 'main',
    FONT_PROCESSING_ALLOW_MAIN_PUBLISHING: 'true',
    FONT_PROCESSING_MAIN_SUPABASE_URL: 'https://main-project.supabase.co',
    FONT_PROCESSING_MAIN_SERVICE_ROLE_KEY: 'main-key',
    VITE_SUPABASE_URL: 'https://production.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'production-key',
  }), {
    target: 'main',
    url: 'https://main-project.supabase.co',
    serviceRoleKey: 'main-key',
  });
});

test('nests sub-families under a parent family via per-font classification override', () => fixture((dir) => {
  // A "Monaspace" family with sub-families Xenon and Radon, each regular + bold.
  // Embedded family names differ per sub-family; the override declares the parent.
  const files = {
    'xenon-regular.otf': ['Monaspace Xenon', 'Regular', 400, { family: 'Monaspace', sub_family: 'Xenon' }],
    'xenon-bold.otf': ['Monaspace Xenon', 'Bold', 700, { family: 'Monaspace', sub_family: 'Xenon' }],
    'radon-regular.otf': ['Monaspace Radon', 'Regular', 400, { family: 'Monaspace', sub_family: 'Radon' }],
    'radon-bold.otf': ['Monaspace Radon', 'Bold', 700, { family: 'Monaspace', sub_family: 'Radon' }],
  };
  const assets = Object.entries(files).map(([file, [family, sub, weight, classification]]) => {
    fs.writeFileSync(path.join(dir, file), Buffer.from(`bytes-${file}`));
    return { file_path: file, classification, metadata: metadata(family, sub, weight) };
  });
  const plan = buildPublishPlan({
    batch_id: 'monaspace-batch',
    font_ids: {
      Monaspace: {
        Xenon: '22222222-2222-4222-8222-222222222222',
        Radon: '33333333-3333-4333-8333-333333333333',
      },
    },
    assets,
  }, { baseDir: dir });

  // Four distinct variants: Xenon Regular/Bold, Radon Regular/Bold — none dropped.
  assert.equal(plan.summary.variantCount, 4);
  assert.equal(plan.rows.length, 4);
  const xenon = plan.rows.filter((r) => r.font_id === '22222222-2222-4222-8222-222222222222');
  const radon = plan.rows.filter((r) => r.font_id === '33333333-3333-4333-8333-333333333333');
  assert.deepEqual(xenon.map((r) => r.variant_name).sort(), ['Bold', 'Regular']);
  assert.deepEqual(radon.map((r) => r.variant_name).sort(), ['Bold', 'Regular']);
}));

test('a variant classification override wins over embedded metadata', () => fixture((dir) => {
  fs.writeFileSync(path.join(dir, 'duo.otf'), Buffer.from('duo-bytes'));
  const plan = buildPublishPlan({
    batch_id: 'override-variant-batch',
    font_ids: { 'Arial Mono': { Neon: '44444444-4444-4444-8444-444444444444' } },
    assets: [{
      file_path: 'duo.otf',
      classification: { family: 'Arial Mono', sub_family: 'Neon', variant: 'Terminal Duo' },
      metadata: metadata('Arial Mono Neon', 'Regular', 400),
    }],
  }, { baseDir: dir });
  assert.equal(plan.rows.length, 1);
  assert.equal(plan.rows[0].variant_name, 'Terminal Duo');
  assert.equal(plan.rows[0].font_id, '44444444-4444-4444-8444-444444444444');
}));
