import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  claimQueueItem,
  recoverStaleProcessingItems,
  processQueueItem,
  drainQueue,
} from '../scripts/font-processing/process-queue.js';

test('claimQueueItem atomically claims pending/error rows and prevents double-claiming', async () => {
  const store = new Map([
    ['item-pending', { id: 'item-pending', status: 'pending', updated_at: new Date().toISOString() }],
    ['item-error', { id: 'item-error', status: 'error', updated_at: new Date().toISOString() }],
    ['item-processing', { id: 'item-processing', status: 'processing', updated_at: new Date().toISOString() }],
  ]);

  const mockSupabase = {
    from(table) {
      assert.equal(table, 'font_processing_queue');
      return {
        update(payload) {
          return {
            eq(col1, id) {
              return {
                in(col2, statuses) {
                  return {
                    select() {
                      return {
                        maybeSingle: async () => {
                          const row = store.get(id);
                          if (!row || !statuses.includes(row.status)) {
                            return { data: null, error: null };
                          }
                          row.status = payload.status;
                          return { data: { ...row }, error: null };
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  // 1. Claiming a pending item succeeds
  const claimedPending = await claimQueueItem(mockSupabase, 'item-pending');
  assert.ok(claimedPending);
  assert.equal(claimedPending.id, 'item-pending');
  assert.equal(claimedPending.status, 'processing');

  // 2. Concurrency test: Claiming the SAME item again fails (already in processing!)
  const doubleClaim = await claimQueueItem(mockSupabase, 'item-pending');
  assert.equal(doubleClaim, null, 'Second worker must not be able to claim a row currently in processing');

  // 3. Claiming an error item succeeds
  const claimedError = await claimQueueItem(mockSupabase, 'item-error');
  assert.ok(claimedError);
  assert.equal(claimedError.id, 'item-error');

  // 4. Claiming an already processing item fails
  const claimedProcessing = await claimQueueItem(mockSupabase, 'item-processing');
  assert.equal(claimedProcessing, null);
});

test('recoverStaleProcessingItems resets stale processing rows older than threshold to pending', async () => {
  const now = Date.now();
  const thresholdMs = 30 * 60 * 1000;
  const staleTime = new Date(now - thresholdMs - 5000).toISOString();
  const freshTime = new Date(now - 1000).toISOString();

  const rows = [
    { id: 'stale-1', slug: 'stale-font-1', status: 'processing', updated_at: staleTime },
    { id: 'fresh-1', slug: 'fresh-font-1', status: 'processing', updated_at: freshTime },
  ];

  const updatedRows = [];

  const mockSupabase = {
    from(table) {
      assert.equal(table, 'font_processing_queue');
      return {
        update(payload) {
          return {
            eq(col1, statusVal) {
              return {
                lt(col2, cutoffTime) {
                  return {
                    select() {
                      const matched = rows.filter(
                        (r) => r.status === statusVal && r.updated_at < cutoffTime
                      );
                      for (const m of matched) {
                        m.status = payload.status;
                        m.error_message = payload.error_message;
                        updatedRows.push({ ...m });
                      }
                      return Promise.resolve({ data: updatedRows, error: null });
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  const recovered = await recoverStaleProcessingItems(mockSupabase, thresholdMs);

  assert.equal(recovered.length, 1);
  assert.equal(recovered[0].id, 'stale-1');
  assert.equal(rows.find((r) => r.id === 'stale-1').status, 'pending');
  assert.equal(rows.find((r) => r.id === 'fresh-1').status, 'processing');
});

test('processQueueItem throws if no release ZIP URLs are provided', async () => {
  const itemWithoutZips = {
    id: 'queue-empty-zip',
    font_id: 'font-uuid-1',
    slug: 'empty-font',
    download_urls: [],
  };

  await assert.rejects(
    () => processQueueItem({}, itemWithoutZips),
    /No valid release ZIP URLs available/
  );
});

test('drainQueue handles status update errors and sets failure status in summary', async () => {
  const mockQueueItem = {
    id: 'item-1',
    font_id: 'font-1',
    slug: 'test-font',
    download_urls: [{ url: 'https://example.com/font.zip', label: 'zip' }],
    status: 'pending',
  };

  let completeUpdateFailed = false;

  const mockSupabase = {
    from(table) {
      if (table === 'fonts') {
        return {
          select() {
            return {
              eq() {
                return {
                  single: async () => ({
                    data: {
                      id: 'font-1',
                      name: 'Test Font',
                      slug: 'test-font',
                      family_role: 'standalone',
                      designer: 'Designer',
                      category: 'sans',
                      license_type: 'OFL',
                      commercial_use: true,
                      tags: [],
                      user_id: 'u1',
                      uploaded_by: 'u1',
                    },
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }
      return {
        update(payload) {
          return {
            eq(col, id) {
              if (payload.status === 'processing') {
                return {
                  in() {
                    return {
                      select() {
                        return {
                          maybeSingle: async () => ({
                            data: { ...mockQueueItem, status: 'processing' },
                            error: null,
                          }),
                        };
                      },
                    };
                  },
                };
              }
              if (payload.status === 'completed') {
                completeUpdateFailed = true;
                return Promise.resolve({ error: new Error('Simulated DB connection error on complete') });
              }
              return {
                lt() {
                  return {
                    select: async () => ({ data: [], error: null }),
                  };
                },
                then: (resolve) => resolve({ error: null }),
              };
            },
          };
        },
        select() {
          return {
            order() {
              return {
                in() {
                  return {
                    limit: async () => ({ data: [mockQueueItem], error: null }),
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  // Run drain with extractImpl and mock
  const fontBytes = Buffer.from('mock-font-bytes');
  const fontSha = crypto.createHash('sha256').update(fontBytes).digest('hex');

  const outcome = await drainQueue(mockSupabase, {
    extractImpl: async () => ({
      assets: [
        {
          sha256: fontSha,
          bytes: fontBytes,
          extension: 'ttf',
          size_bytes: fontBytes.length,
          relative_path: 'test.ttf',
          source_label: 'zip',
          metadata: {
            family_name: 'Test Font',
            subfamily_name: 'Regular',
            weight_class: 400,
            is_italic: false,
            status: 'parsed',
          },
        },
      ],
      warnings: [],
    }),
    adapter: {
      stageAsset: async () => ({ sha256: fontSha, sizeBytes: fontBytes.length }),
      publishRows: async () => ({ committed: true }),
      deleteStaged: async () => {},
      recordBatch: async () => {},
    },
    scrapeImpl: () => ({ images: [] }),
  });

  // Because the complete update threw or failed, the item is recorded as failed
  assert.equal(completeUpdateFailed, true);
  assert.equal(outcome.failed, 1);
  assert.ok(outcome.errors[0].error.includes('Simulated DB connection error on complete'));
});
