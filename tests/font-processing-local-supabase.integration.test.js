import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createSupabasePublishingAdapter } from '../scripts/font-processing/supabase-publishing-adapter.js';
import { publishStagedBatch } from '../scripts/font-processing/publishing-protocol.js';

const url = process.env.LOCAL_SUPABASE_URL;
const key = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;
const fontId = process.env.LOCAL_SUPABASE_FONT_ID;
if (!url || !key || !fontId) throw new Error('Local Supabase integration requires LOCAL_SUPABASE_URL, LOCAL_SUPABASE_SERVICE_ROLE_KEY, and LOCAL_SUPABASE_FONT_ID');
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = 'fonts';
const bytes = Buffer.from('real-local-supabase-font-processing-integration-fixture');
const asset = { assetId: 'font-fixture', fileName: 'regular.woff2', bytes, sha256: createHash('sha256').update(bytes).digest('hex'), sizeBytes: bytes.length };
const rows = [{ assetId: asset.assetId, font_id: fontId, variant_name: 'Integration Regular', format: 'woff2', size_bytes: bytes.length }];
const batchId = 'local-e2e-' + createHash('sha256').update(String(Date.now())).digest('hex').slice(0, 12);
const adapter = createSupabasePublishingAdapter({ supabase, bucket });
const run = (id, rowSet = rows) => publishStagedBatch({ batchId: id, assets: [{ ...asset, assetId: 'font-fixture' }], rows: rowSet, adapter, sleep: async () => {} });

test('real local Supabase Storage upload/read-back and atomic publish are idempotent', async () => {
  const first = await run(batchId);
  assert.equal(first.status, 'committed');
  const second = await run(batchId);
  assert.equal(second.status, 'committed');

  const key = first.stagedKeys[0];
  const downloaded = await supabase.storage.from(bucket).download(key);
  assert.ifError(downloaded.error);
  assert.deepEqual(Buffer.from(await downloaded.data.arrayBuffer()), bytes);

  const { data: variant, error: variantError } = await supabase.from('font_variants').select('woff2_url,file_size_woff2').eq('font_id', fontId).eq('variant_name', 'Integration Regular').single();
  assert.ifError(variantError);
  assert.equal(variant.file_size_woff2, bytes.length);
  assert.ok(variant.woff2_url.includes(key));

  const { data: ledger, error: ledgerError } = await supabase.from('font_processing_publish_batches').select('status,row_count,staged_keys').eq('batch_id', batchId).single();
  assert.ifError(ledgerError);
  assert.equal(ledger.status, 'committed');
  assert.equal(ledger.row_count, 1);
  assert.ok(ledger.staged_keys.includes(key));
});

test('real RPC failure leaves staged object intact and records reconciliation', async () => {
  const failingBatch = batchId + '-failure';
  const badRows = [{ ...rows[0], font_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', variant_name: 'Should Roll Back' }];
  await assert.rejects(run(failingBatch, badRows), /Atomic font publish RPC failed/);
  const key = `staging/font-processing/${failingBatch}/font-fixture/regular.woff2`;
  const downloaded = await supabase.storage.from(bucket).download(key);
  assert.ifError(downloaded.error);
  assert.deepEqual(Buffer.from(await downloaded.data.arrayBuffer()), bytes);
  const { data: ledger, error } = await supabase.from('font_processing_publish_batches').select('status,phase').eq('batch_id', failingBatch).single();
  assert.ifError(error);
  assert.equal(ledger.status, 'reconciliation_required');
  assert.equal(ledger.phase, 'publish');
  const { data: absent } = await supabase.from('font_variants').select('id').eq('variant_name', 'Should Roll Back');
  assert.equal(absent.length, 0);
});
