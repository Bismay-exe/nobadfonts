import { createHash } from 'node:crypto';
const HASH = /^[a-f0-9]{64}$/i;
const SAFE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;
export function validatePublishBatch({ batchId, assets, rows }) {
  if (typeof batchId !== 'string' || !SAFE.test(batchId) || batchId.includes('..')) throw new Error('Invalid batchId');
  if (!Array.isArray(assets) || !assets.length) throw new Error('assets must be a non-empty array');
  if (!Array.isArray(rows) || !rows.length) throw new Error('rows must be a non-empty array');
  const ids = new Set(), names = new Set();
  for (const a of assets) {
    if (!a || typeof a.assetId !== 'string' || !a.assetId.trim() || ids.has(a.assetId)) throw new Error('Missing or duplicate assetId');
    ids.add(a.assetId);
    if (!HASH.test(a.sha256 || '')) throw new Error(`Asset ${a.assetId} has invalid SHA-256`);
    if (!(Buffer.isBuffer(a.bytes) || a.bytes instanceof Uint8Array) || !a.bytes.byteLength) throw new Error(`Asset ${a.assetId} requires non-empty bytes`);
    if (createHash('sha256').update(a.bytes).digest('hex') !== a.sha256.toLowerCase()) throw new Error(`Asset ${a.assetId} hash does not match bytes`);
    if (!Number.isSafeInteger(a.sizeBytes) || a.sizeBytes !== a.bytes.byteLength) throw new Error(`Asset ${a.assetId} sizeBytes does not match bytes`);
    if (typeof a.fileName !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,180}$/.test(a.fileName) || a.fileName.includes('..') || names.has(a.fileName)) throw new Error(`Asset ${a.assetId} has unsafe or duplicate fileName`);
    names.add(a.fileName);
  }
  const referenced = new Set();
  for (const row of rows) { if (!row || Array.isArray(row) || typeof row !== 'object' || typeof row.assetId !== 'string' || !ids.has(row.assetId)) throw new Error('Publish row references an unknown assetId'); referenced.add(row.assetId); }
  if (referenced.size !== ids.size) throw new Error('Every asset must be referenced by at least one publish row');
  return true;
}
export function retryDelayMs(attempt, { baseDelayMs = 250, maxDelayMs = 4000 } = {}) {
  if (!Number.isInteger(attempt) || attempt < 1) throw new Error('attempt must be a positive integer');
  if (![baseDelayMs, maxDelayMs].every((n) => Number.isFinite(n) && n >= 0)) throw new Error('retry delays must be non-negative finite numbers');
  return Math.min(maxDelayMs, baseDelayMs * (2 ** (attempt - 1)));
}
async function retry(fn, { maxAttempts, sleep, baseDelayMs, maxDelayMs }) { let last; for (let i = 1; i <= maxAttempts; i++) { try { return await fn(i); } catch (e) { last = e; if (i < maxAttempts) await sleep(retryDelayMs(i, { baseDelayMs, maxDelayMs })); } } throw last; }
/** Adapter-based isolated protocol; no Supabase client, credentials, or network access. */
export async function publishStagedBatch({ batchId, assets, rows, adapter, maxAttempts = 3, baseDelayMs = 250, maxDelayMs = 4000, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  validatePublishBatch({ batchId, assets, rows });
  for (const n of ['stageAsset', 'publishRows', 'deleteStaged', 'recordBatch']) if (typeof adapter?.[n] !== 'function') throw new Error(`Adapter must implement ${n}`);
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 5) throw new Error('maxAttempts must be an integer from 1 to 5');
  const prefix = `staging/font-processing/${batchId}/`, stagedKeys = [], opts = { maxAttempts, sleep, baseDelayMs, maxDelayMs };
  const audit = (status, extra = {}) => adapter.recordBatch({ batchId, status, stagedKeys: [...stagedKeys], assetCount: assets.length, rowCount: rows.length, ...extra });
  await audit('validating');
  try {
    for (const a of assets) { const key = `${prefix}${a.assetId}/${a.fileName}`; const v = await retry(() => adapter.stageAsset(a, key), opts); if (v?.sha256?.toLowerCase() !== a.sha256.toLowerCase() || v?.sizeBytes !== a.sizeBytes) throw new Error(`Staged object verification failed for ${a.assetId}`); stagedKeys.push(key); await audit('staging'); }
  } catch (e) { let cleanupError = null; try { if (stagedKeys.length) await adapter.deleteStaged(stagedKeys); } catch (c) { cleanupError = c; } await audit(cleanupError ? 'reconciliation_required' : 'failed', { phase: 'staging', error: String(e?.message || e), cleanupError: cleanupError ? String(cleanupError.message || cleanupError) : null }); throw e; }
  await audit('ready_to_publish');
  try {
    const publishRows = rows.map((r) => ({ ...r, staging_key: `${prefix}${r.assetId}/${assets.find((a) => a.assetId === r.assetId).fileName}` }));
    const result = await retry(() => adapter.publishRows(publishRows, { batchId, idempotencyKey: `font-processing:${batchId}` }), opts);
    if (result?.committed !== true) throw new Error('Publisher did not confirm an atomic commit');
    await audit('committed'); return { batchId, status: 'committed', stagedKeys: [...stagedKeys], rowCount: rows.length };
  } catch (e) { await audit('reconciliation_required', { phase: 'publish', error: String(e?.message || e), instruction: 'Reconcile idempotency key before retrying or deleting staging objects.' }); throw e; }
}
