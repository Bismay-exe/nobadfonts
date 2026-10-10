import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createSupabasePublishingAdapter } from '../scripts/font-processing/supabase-publishing-adapter.js';
import { publishStagedBatch } from '../scripts/font-processing/publishing-protocol.js';

function makeFixture({ failPublish = false } = {}) {
  const objects = new Map();
  const calls = [];
  const batches = new Map();
  const auditStates = [];
  const supabase = {
    storage: {
      from(bucket) {
        return {
          async download(key) {
            const bytes = objects.get(key);
            return bytes
              ? { data: new Blob([bytes]), error: null }
              : { data: null, error: { message: 'Object not found' } };
          },
          async upload(key, bytes, options) {
            calls.push({ type: 'upload', bucket, key, options });
            if (objects.has(key)) return { error: { message: 'Object already exists' } };
            objects.set(key, Buffer.from(bytes));
            return { error: null };
          },
          async remove(keys) {
            calls.push({ type: 'remove', keys: [...keys] });
            for (const key of keys) objects.delete(key);
            return { error: null };
          },
          getPublicUrl(key) {
            return { data: { publicUrl: `https://fixture.supabase.co/storage/v1/object/public/${bucket}/${key}` } };
          },
        };
      },
    },
    async rpc(name, args) {
      calls.push({ type: 'rpc', name, args });
      if (name === 'record_font_processing_batch_state') {
        auditStates.push(args.p_status);
        const previous = batches.get(args.p_batch_id);
        if (previous?.status !== 'committed') {
          batches.set(args.p_batch_id, { ...previous, status: args.p_status, idempotencyKey: args.p_idempotency_key });
        }
        return { data: { batch_id: args.p_batch_id, status: batches.get(args.p_batch_id)?.status }, error: null };
      }
      if (name === 'publish_font_processing_batch') {
        if (failPublish) return { data: null, error: { message: 'Synthetic RPC failure for test' } };
        const previous = batches.get(args.p_batch_id);
        if (previous?.status === 'committed') {
          if (previous.idempotencyKey !== args.p_idempotency_key || previous.manifestSha256 !== args.p_manifest_sha256) {
            return { data: null, error: { message: 'Idempotency mismatch' } };
          }
          return { data: { committed: true, idempotent_replay: true }, error: null };
        }
        batches.set(args.p_batch_id, {
          status: 'committed',
          idempotencyKey: args.p_idempotency_key,
          manifestSha256: args.p_manifest_sha256,
          rows: args.p_rows,
        });
        return { data: { committed: true, idempotent_replay: false, row_count: args.p_rows.length }, error: null };
      }
      return { data: null, error: { message: `Unexpected RPC: ${name}` } };
    },
  };
  const bytes = Buffer.from('synthetic-font-file-bytes');
  const asset = {
    assetId: 'fixture-asset',
    fileName: 'regular.woff2',
    bytes,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    sizeBytes: bytes.length,
  };
  const rows = [{
    assetId: asset.assetId,
    font_id: '11111111-1111-4111-8111-111111111111',
    variant_name: 'Regular',
    format: 'woff2',
    size_bytes: bytes.length,
  }];
  return { adapter: createSupabasePublishingAdapter({ supabase }), assets: [asset], rows, objects, calls, auditStates, batches };
}

test('composes Storage staging, byte read-back, atomic RPC, audit, and idempotent replay', async () => {
  const f = makeFixture();
  const options = { batchId: 'composed-e2e-test', assets: f.assets, rows: f.rows, adapter: f.adapter, sleep: async () => {} };

  const first = await publishStagedBatch(options);
  assert.equal(first.status, 'committed');
  assert.equal(f.objects.size, 1);
  assert.equal(f.calls.filter((call) => call.type === 'upload').length, 1);
  assert.ok(f.auditStates.includes('ready_to_publish'));
  assert.equal(f.auditStates.at(-1), 'committed');

  const second = await publishStagedBatch(options);
  assert.equal(second.status, 'committed');
  assert.equal(f.objects.size, 1);
  assert.equal(f.calls.filter((call) => call.type === 'upload').length, 1);
  const publishCalls = f.calls.filter((call) => call.type === 'rpc' && call.name === 'publish_font_processing_batch');
  assert.equal(publishCalls.length, 2);
  assert.equal(f.batches.get('composed-e2e-test').rows.length, 1);
});

test('retains staged objects and records reconciliation when atomic RPC fails', async () => {
  const f = makeFixture({ failPublish: true });
  await assert.rejects(
    publishStagedBatch({
      batchId: 'composed-failure-test',
      assets: f.assets,
      rows: f.rows,
      adapter: f.adapter,
      sleep: async () => {},
    }),
    /Synthetic RPC failure for test/,
  );
  assert.equal(f.objects.size, 1);
  assert.equal(f.calls.some((call) => call.type === 'remove'), false);
  assert.equal(f.auditStates.at(-1), 'reconciliation_required');
});
