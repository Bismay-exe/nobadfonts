import test from 'node:test';
import assert from 'node:assert/strict';
import { deduplicateAssets, planVariantGroups } from '../scripts/font-processing/core.js';
import { parseGeminiJson, overridesFromResponse, classifyAssets } from '../scripts/font-processing/gemini-classify.js';
import { collectSubfamilies, buildPublishInputs, ensureHierarchy } from '../scripts/font-processing/process-queue.js';

const hash = (char) => char.repeat(64);

function assetFromMetadata(sha, metadata, extension = 'ttf', size = 100) {
  return { sha256: sha, size_bytes: size, extension, relative_path: `${sha.slice(0, 4)}.${extension}`, metadata: { ...metadata, extension } };
}

test('parseGeminiJson extracts an object from fenced or noisy text', () => {
  assert.deepEqual(parseGeminiJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseGeminiJson('here you go: {"parent_family":null,"fonts":[]} done'), { parent_family: null, fonts: [] });
  assert.equal(parseGeminiJson('not json at all'), null);
  assert.equal(parseGeminiJson(''), null);
});

test('overridesFromResponse keeps known hashes, drops unknown, backfills parent family', () => {
  const parsed = {
    parent_family: 'Monaspace',
    fonts: [
      { sha256: hash('a'), family: 'Monaspace', sub_family: 'Xenon', variant: 'Bold' },
      { sha256: hash('b'), sub_family: 'Radon', variant: 'Regular' }, // family backfilled from parent_family
      { sha256: hash('f'), family: 'Ghost', sub_family: null, variant: 'Regular' }, // unknown hash -> dropped
    ],
  };
  const overrides = overridesFromResponse(parsed, new Set([hash('a'), hash('b')]));
  assert.equal(overrides.size, 2);
  assert.deepEqual(overrides.get(hash('a')), { family: 'Monaspace', sub_family: 'Xenon', variant: 'Bold' });
  assert.deepEqual(overrides.get(hash('b')), { family: 'Monaspace', sub_family: 'Radon', variant: 'Regular' });
  assert.equal(overrides.has(hash('f')), false);
});

test('classifyAssets returns an empty map without an API key (metadata fallback)', async () => {
  const result = await classifyAssets([assetFromMetadata(hash('a'), { family_name: 'X' })], { apiKey: null });
  assert.equal(result.size, 0);
});

test('classifyAssets swallows network failures and falls back', async () => {
  const result = await classifyAssets([assetFromMetadata(hash('a'), { family_name: 'X' })], {
    apiKey: 'test-key',
    fetchImpl: async () => { throw new Error('boom'); },
  });
  assert.equal(result.size, 0);
});

test('classifyAssets maps a valid Gemini response into overrides', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({
      parent_family: 'Arial Mono',
      fonts: [{ sha256: hash('a'), family: 'Arial Mono', sub_family: 'Neon', variant: 'Terminal' }],
    }) }] } }] }),
  });
  const result = await classifyAssets([assetFromMetadata(hash('a'), { family_name: 'Arial Mono Neon' })], {
    apiKey: 'test-key', fetchImpl,
  });
  assert.deepEqual(result.get(hash('a')), { family: 'Arial Mono', sub_family: 'Neon', variant: 'Terminal' });
});

test('Gemini overrides drive core.js into a nested family -> sub-family -> variant plan', () => {
  const overrides = overridesFromResponse({
    parent_family: 'Monaspace',
    fonts: [
      { sha256: hash('a'), family: 'Monaspace', sub_family: 'Xenon', variant: 'Regular' },
      { sha256: hash('b'), family: 'Monaspace', sub_family: 'Xenon', variant: 'Bold' },
      { sha256: hash('c'), family: 'Monaspace', sub_family: 'Radon', variant: 'Regular' },
    ],
  }, new Set([hash('a'), hash('b'), hash('c')]));

  const unique = deduplicateAssets([hash('a'), hash('b'), hash('c')].map((sha) =>
    assetFromMetadata(sha, { family_name: 'Monaspace', status: 'parsed', overrides: overrides.get(sha) })));
  const { groups, review } = planVariantGroups(unique);
  assert.equal(review.length, 0);
  assert.equal(groups.length, 3);
  const xenon = groups.filter((group) => group.subfamily_name === 'Xenon');
  assert.equal(xenon.length, 2);
  assert.ok(groups.every((group) => group.parent_family_name === 'Monaspace' && group.is_subfamily));
  assert.deepEqual(collectSubfamilies(groups).map((sub) => sub.subfamily_name).sort(), ['Radon', 'Xenon']);
});

test('collectSubfamilies is empty for a standalone release', () => {
  const unique = deduplicateAssets([
    assetFromMetadata(hash('a'), { family_name: 'Inter', subfamily_name: 'Regular', weight_class: 400, is_italic: false, status: 'parsed' }),
  ]);
  const { groups } = planVariantGroups(unique);
  assert.equal(collectSubfamilies(groups).length, 0);
});

test('buildPublishInputs produces one asset per hash and one row per format, and rejects conflicts', () => {
  const groups = [{
    family_name: 'Inter', subfamily_name: null, is_subfamily: false, variant_name: 'Regular',
    conflicts: [],
    assets: [
      { sha256: hash('a'), extension: 'woff2', size_bytes: 10 },
      { sha256: hash('b'), extension: 'ttf', size_bytes: 20 },
    ],
  }];
  const bytes = new Map([[hash('a'), Buffer.alloc(10, 1)], [hash('b'), Buffer.alloc(20, 2)]]);
  const { assets, rows } = buildPublishInputs(groups, bytes, () => 'font-uuid-1');
  assert.equal(assets.length, 2);
  assert.equal(rows.length, 2);
  assert.ok(rows.every((row) => row.font_id === 'font-uuid-1'));
  assert.deepEqual(rows.map((row) => row.format).sort(), ['ttf', 'woff2']);

  assert.throws(() => buildPublishInputs([{ ...groups[0], conflicts: [{ reason: 'x' }] }], bytes, () => 'id'), /format conflict/);
  assert.throws(() => buildPublishInputs(groups, bytes, () => null), /No font_id resolved/);
});

function fakeSupabase({ parent, existingSubs = [] }) {
  const inserted = [];
  const updates = [];
  return {
    inserted, updates,
    from(table) {
      assert.equal(table, 'fonts');
      const builder = {
        _op: null, _payload: null,
        update(payload) { this._op = 'update'; this._payload = payload; return this; },
        insert(payload) { this._op = 'insert'; this._payload = payload; return this; },
        select() { return this; },
        eq(col, val) { this._eqCol = col; this._eqVal = val; return this; },
        async single() {
          if (this._op === 'insert') {
            const row = this._payload[0];
            const id = `sub-${inserted.length + 1}`;
            inserted.push(row);
            return { data: { id, name: row.name }, error: null };
          }
          return { data: { id: val(this) }, error: null };
        },
        then(resolve) {
          if (this._op === 'update') { updates.push(this._payload); }
          // emulate the .eq(...).select resolve for the existing-subs read
          return Promise.resolve({ data: existingSubs, error: null }).then(resolve);
        },
      };
      return builder;
    },
  };
  function val() { return parent.id; }
}

test('ensureHierarchy creates missing sub-family rows and reuses existing ones', async () => {
  const parent = {
    id: 'parent-1', name: 'Monaspace', slug: 'monaspace', family_role: 'standalone',
    designer: 'GitHub', category: 'mono', license_type: 'OFL', commercial_use: true, tags: ['mono'], user_id: 'u1', uploaded_by: 'u1',
  };
  const groups = [
    { is_subfamily: true, subfamily_name: 'Xenon', parent_family_name: 'Monaspace', family_name: 'Xenon', variant_name: 'Regular', assets: [], conflicts: [] },
    { is_subfamily: true, subfamily_name: 'Radon', parent_family_name: 'Monaspace', family_name: 'Radon', variant_name: 'Regular', assets: [], conflicts: [] },
  ];
  const supabase = fakeSupabase({ parent, existingSubs: [{ id: 'existing-xenon', name: 'Monaspace Xenon' }] });
  const { resolveFontId, createdSubfamilies } = await ensureHierarchy(supabase, parent, groups);

  // Xenon already exists -> reused; Radon created.
  assert.equal(createdSubfamilies.length, 1);
  assert.equal(createdSubfamilies[0].name, 'Monaspace Radon');
  assert.equal(resolveFontId(groups[0]), 'existing-xenon');
  assert.ok(resolveFontId(groups[1]).startsWith('sub-'));
  // Parent promoted to 'parent'.
  assert.ok(supabase.updates.some((payload) => payload.family_role === 'parent'));
  // Inherited curation fields on the created row.
  assert.equal(supabase.inserted[0].designer, 'GitHub');
  assert.equal(supabase.inserted[0].family_role, 'subfamily');
  assert.equal(supabase.inserted[0].parent_font_id, 'parent-1');
});
