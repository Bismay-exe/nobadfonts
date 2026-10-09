import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalFamilyKey,
  canonicalVariantKey,
  deduplicateAssets,
  getFontExtension,
  normalizeFontMetadata,
  planVariantGroups,
  sha256Buffer,
} from '../scripts/font-processing/core.js';

const hashA = 'a'.repeat(64);
const hashB = 'b'.repeat(64);
const hashC = 'c'.repeat(64);

test('sha256Buffer is deterministic and validates its input', () => {
  const first = sha256Buffer(Buffer.from('font bytes'));
  const second = sha256Buffer(Buffer.from('font bytes'));
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first, second);
  assert.throws(() => sha256Buffer('not bytes'), /Buffer or Uint8Array/);
});

test('getFontExtension normalizes supported extensions and rejects others', () => {
  assert.equal(getFontExtension('assets/Font.WOFF2'), '.woff2');
  assert.equal(getFontExtension('Font.svg'), null);
});

test('normalizeFontMetadata preserves unknowns instead of inventing values', () => {
  const normalized = normalizeFontMetadata({
    family_name: '  Mona   Sans ',
    subfamily_name: 'Bold Italic',
    weight_class: 700,
    is_italic: true,
    is_variable: false,
    glyph_count: 1200,
    file_path: 'MonaSans-BoldItalic.OTF',
    status: 'parsed',
  });

  assert.equal(normalized.family_name, 'Mona Sans');
  assert.equal(normalized.subfamily_name, 'Bold Italic');
  assert.equal(normalized.weight_class, 700);
  assert.equal(normalized.is_italic, true);
  assert.equal(normalized.extension, '.otf');
  assert.equal(normalizeFontMetadata({}).family_name, null);
  assert.equal(normalizeFontMetadata({}).weight_class, null);
});

test('canonical keys use extracted metadata and return null when ambiguous', () => {
  assert.equal(canonicalFamilyKey({ family_name: 'Mona Sans' }), 'mona sans');
  assert.equal(canonicalVariantKey({ subfamily_name: 'Semi Bold' }), 'semi bold');
  assert.equal(canonicalVariantKey({ weight_class: 600, is_italic: true }), 'weight-600-italic');
  assert.equal(canonicalFamilyKey({}), null);
  assert.equal(canonicalVariantKey({}), null);
});

test('deduplicateAssets collapses only identical hashes and retains provenance', () => {
  const deduped = deduplicateAssets([
    { sha256: hashA, path: 'static/MonaSans-Regular.ttf', size_bytes: 100 },
    { sha256: hashA, path: 'frozen/MonaSans-Regular.ttf', size_bytes: 100, archive_label: 'frozen' },
    { sha256: hashB, path: 'static/MonaSans-Regular.ttf', size_bytes: 101 },
  ]);

  assert.equal(deduped.length, 2);
  assert.equal(deduped[0].sources.length, 2);
  assert.equal(deduped[1].sources.length, 1);
});

test('deduplicateAssets rejects missing or malformed hashes', () => {
  assert.throws(() => deduplicateAssets([{ path: 'MonaSans.ttf' }]), /valid SHA-256/);
});

test('planVariantGroups groups binary metadata and flags format collisions', () => {
  const result = planVariantGroups([
    {
      asset_id: hashA,
      sha256: hashA,
      size_bytes: 100,
      metadata: { family_name: 'Mona Sans', subfamily_name: 'Regular', weight_class: 400, is_italic: false, extension: '.ttf', status: 'parsed' },
    },
    {
      asset_id: hashB,
      sha256: hashB,
      size_bytes: 101,
      metadata: { family_name: 'Mona Sans', subfamily_name: 'Regular', weight_class: 400, is_italic: false, extension: '.woff2', status: 'parsed' },
    },
    {
      asset_id: hashC,
      sha256: hashC,
      size_bytes: 102,
      metadata: { family_name: 'Mona Sans', subfamily_name: 'Regular', weight_class: 400, is_italic: false, extension: '.ttf', status: 'parsed' },
    },
    {
      asset_id: 'd'.repeat(64),
      sha256: 'd'.repeat(64),
      metadata: { extension: '.otf' },
    },
  ]);

  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].assets.length, 3);
  assert.equal(result.groups[0].conflicts.length, 1);
  assert.equal(result.review.length, 1);
  assert.equal(result.review[0].reason, 'missing_family_metadata');
});

test('planVariantGroups does not merge unrelated subfamilies', () => {
  const result = planVariantGroups([
    { sha256: hashA, metadata: { family_name: 'Fraunces', subfamily_name: 'Regular', extension: '.otf' } },
    { sha256: hashB, metadata: { family_name: 'Fraunces', subfamily_name: 'Black Italic', extension: '.otf' } },
  ]);

  assert.equal(result.groups.length, 2);
  assert.deepEqual(result.review, []);
});


test('planVariantGroups sends contradictory family-weight metadata to review', () => {
  const result = planVariantGroups([
    {
      sha256: 'e'.repeat(64),
      metadata: {
        family_name: 'Monaspace Argon Frozen ExtraBold',
        subfamily_name: 'Regular',
        weight_class: 800,
        is_italic: false,
        extension: '.ttf',
        status: 'parsed',
      },
    },
  ]);

  assert.equal(result.groups.length, 0);
  assert.equal(result.review.length, 1);
  assert.equal(result.review[0].reason, 'family_name_weight_conflict');
});
