import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { publishStagedBatch, retryDelayMs, validatePublishBatch } from '../scripts/font-processing/publishing-protocol.js';
function fixture() {
  const assets = ['font-A', 'font-B'].map((s, i) => { const bytes = Buffer.from(s); return { assetId: `asset-${i}`, fileName: `variant-${i}.woff2`, bytes, sha256: createHash('sha256').update(bytes).digest('hex'), sizeBytes: bytes.length }; });
  const rows = assets.map((a) => ({ assetId: a.assetId, variantName: a.assetId })), events = [], objects = new Map();
  const adapter = {
    async stageAsset(a, key) { events.push(['stage', key]); objects.set(key, { sha256: a.sha256, sizeBytes: a.sizeBytes }); return objects.get(key); },
    async publishRows(r, options) { events.push(['publish', r, options]); return { committed: true }; },
    async deleteStaged(keys) { events.push(['delete', keys]); keys.forEach((k) => objects.delete(k)); },
    async recordBatch(record) { events.push(['audit', record]); },
  };
  return { assets, rows, events, objects, adapter };
}
test('preflight rejects unsafe batches, changed bytes, and incomplete row references', () => {
  const f = fixture(); assert.equal(validatePublishBatch({ batchId: 'batch-1', assets: f.assets, rows: f.rows }), true);
  assert.throws(() => validatePublishBatch({ batchId: '../bad', assets: f.assets, rows: f.rows }), /Invalid batchId/);
  assert.throws(() => validatePublishBatch({ batchId: 'batch-1', assets: [{ ...f.assets[0], sha256: '0'.repeat(64) }], rows: [f.rows[0]] }), /hash does not match/);
  assert.throws(() => validatePublishBatch({ batchId: 'batch-1', assets: f.assets, rows: [f.rows[0]] }), /Every asset must be referenced/);
});
test('stages and verifies all assets before idempotent row publication', async () => {
  const f = fixture(), result = await publishStagedBatch({ batchId: 'batch-2', assets: f.assets, rows: f.rows, adapter: f.adapter, sleep: async () => {} });
  assert.equal(result.status, 'committed'); const pub = f.events.find(([t]) => t === 'publish');
  assert.equal(pub[2].idempotencyKey, 'font-processing:batch-2'); assert.ok(pub[1].every((r) => r.staging_key.startsWith('staging/font-processing/batch-2/')));
  assert.ok(f.events.findIndex(([t]) => t === 'publish') > f.events.map(([t]) => t).lastIndexOf('stage'));
  assert.ok(f.events.some(([t, r]) => t === 'audit' && r.status === 'committed'));
});
test('transient staging error retries with bounded exponential delay', async () => {
  const f = fixture(), delays = []; let n = 0, original = f.adapter.stageAsset;
  f.adapter.stageAsset = async (...args) => { n++; if (n === 1) throw Error('transient'); return original(...args); };
  await publishStagedBatch({ batchId: 'retry', assets: f.assets, rows: f.rows, adapter: f.adapter, sleep: async (ms) => delays.push(ms) });
  assert.equal(n, 3); assert.deepEqual(delays, [250]);
});
test('staging failure prevents publish and cleans up known staged objects', async () => {
  const f = fixture(); f.adapter.stageAsset = async (a, key) => { if (a.assetId === 'asset-1') throw Error('stage failure'); f.objects.set(key, { sha256: a.sha256, sizeBytes: a.sizeBytes }); return f.objects.get(key); };
  await assert.rejects(publishStagedBatch({ batchId: 'stage-fail', assets: f.assets, rows: f.rows, adapter: f.adapter, sleep: async () => {} }), /stage failure/);
  assert.equal(f.events.some(([t]) => t === 'publish'), false); assert.ok(f.events.some(([t]) => t === 'delete')); assert.ok(f.events.some(([t, r]) => t === 'audit' && r.status === 'failed'));
});
test('cleanup failure becomes reconciliation_required', async () => {
  const f = fixture(); f.adapter.stageAsset = async (a, key) => { if (a.assetId === 'asset-1') throw Error('stage failure'); f.objects.set(key, { sha256: a.sha256, sizeBytes: a.sizeBytes }); return f.objects.get(key); }; f.adapter.deleteStaged = async () => { throw Error('cleanup failure'); };
  await assert.rejects(publishStagedBatch({ batchId: 'cleanup-fail', assets: f.assets, rows: f.rows, adapter: f.adapter, sleep: async () => {} }), /stage failure/);
  assert.ok(f.events.some(([t, r]) => t === 'audit' && r.status === 'reconciliation_required'));
});
test('ambiguous DB failure preserves staging objects for reconciliation', async () => {
  const f = fixture(); f.adapter.publishRows = async () => { throw Error('timeout after commit'); };
  await assert.rejects(publishStagedBatch({ batchId: 'publish-fail', assets: f.assets, rows: f.rows, adapter: f.adapter, sleep: async () => {} }), /timeout after commit/);
  assert.equal(f.events.some(([t]) => t === 'delete'), false); assert.ok(f.events.some(([t, r]) => t === 'audit' && r.status === 'reconciliation_required' && r.phase === 'publish'));
});
test('publisher must confirm commit and retry delays are bounded', async () => {
  const f = fixture(); f.adapter.publishRows = async () => ({ committed: false });
  await assert.rejects(publishStagedBatch({ batchId: 'no-commit', assets: f.assets, rows: f.rows, adapter: f.adapter, sleep: async () => {} }), /did not confirm an atomic commit/);
  assert.equal(retryDelayMs(1), 250); assert.equal(retryDelayMs(10), 4000); assert.throws(() => retryDelayMs(0), /positive integer/);
});

test('uncertain staging object is retained for reconciliation while known batch objects are cleaned', async () => {
  const f = fixture();
  let firstKey;
  f.adapter.stageAsset = async (asset, key) => {
    if (asset.assetId === 'asset-1') {
      const error = new Error('read-back timed out after upload');
      error.stagedObjectMayExist = true;
      error.stagedKey = key;
      throw error;
    }
    firstKey = key;
    f.staged.set(key, { sha256: asset.sha256, sizeBytes: asset.sizeBytes });
    return f.staged.get(key);
  };
  await assert.rejects(publishStagedBatch({ batchId: 'uncertain-stage', assets: f.assets, rows: f.rows, adapter: f.adapter, sleep: async () => {} }), /read-back timed out/);
  const deletion = f.events.find(([type]) => type === 'delete');
  assert.deepEqual(deletion[1], [firstKey]);
  const audit = f.events.filter(([type, record]) => type === 'audit' && record.status === 'reconciliation_required').at(-1);
  assert.ok(audit[1].stagedKeys.some((key) => key.endsWith('/asset-1/variant-1.woff2')));
  assert.equal(audit[1].retained_uncertain_key?.endsWith('/asset-1/variant-1.woff2'), true);
});
