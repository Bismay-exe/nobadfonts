import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { reviewDiscoveryReport } from '../scripts/font-processing/review-discovery-with-gemini.js';

const hash = (char) => char.repeat(64);

function makeReport() {
  return {
    generated_at: '2026-10-10T00:00:00.000Z',
    mode: 'read-only-discovery',
    database_writes_performed: false,
    queue_items: [{
      slug: 'fixture-font',
      assets: [{
        source_label: 'fixture-archive',
        relative_path: 'Fixture-Regular.woff2',
        extension: '.woff2',
        sha256: hash('a'),
        size_bytes: 1200,
        metadata: {
          status: 'parsed',
          family_name: null,
          subfamily_name: 'Regular',
          full_name: 'Fixture Sans Regular',
          postscript_name: 'FixtureSans-Regular',
          weight_class: 400,
          is_italic: false,
          is_variable: false,
        },
      }],
    }],
  };
}

function successfulResponse(candidateId) {
  return new Response(JSON.stringify({
    candidates: [{
      content: {
        parts: [{
          text: JSON.stringify({
            decisions: [{
              candidate_id: candidateId,
              decision: 'group',
              relation: 'same_family',
              confidence: 0.99,
              reason: 'The embedded full name and regular subfamily support this proposal.',
              proposed_family_name: 'Fixture Sans',
              proposed_variant_name: 'Regular',
            }],
          }),
        }],
      },
    }],
    usageMetadata: { candidatesTokenCount: 80 },
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

test('report review defaults to deterministic read-only mode and never calls Gemini', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    throw new Error('fetch must not be called in deterministic mode');
  };

  try {
    const source = makeReport();
    const before = structuredClone(source);
    const result = await reviewDiscoveryReport(source);

    assert.equal(requests, 0);
    assert.equal(result.mode, 'read-only-deterministic-review');
    assert.equal(result.publishable, false);
    assert.equal(result.database_writes_performed, false);
    assert.equal(result.uploads_performed, false);
    assert.deepEqual(source, before);
    assert.equal(result.queue_items[0].deterministic.review.length, 1);
    assert.equal(result.queue_items[0].gemini.mode, 'not_requested');
    assert.equal(result.queue_items[0].merged, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('explicit live report review applies a validated Gemini proposal only to the advisory report', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nobadfonts-gemini-review-test-'));
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.GEMINI_API_KEY;
  const candidateId = hash('a');
  let requests = 0;
  delete process.env.GEMINI_API_KEY;
  globalThis.fetch = async () => {
    requests += 1;
    return successfulResponse(candidateId);
  };

  try {
    const source = makeReport();
    const before = structuredClone(source);
    const result = await reviewDiscoveryReport(source, {
      live: true,
      slug: 'fixture-font',
      apiKey: 'test-key',
      cacheFile: path.join(tempDir, 'cache.json'),
      maxOutputTokens: 512,
      maxTotalOutputTokens: 512,
    });
    const queue = result.queue_items[0];

    assert.equal(requests, 1);
    assert.equal(result.mode, 'read-only-gemini-advisory-review');
    assert.equal(result.publishable, false);
    assert.equal(result.database_writes_performed, false);
    assert.equal(result.uploads_performed, false);
    assert.deepEqual(source, before);
    assert.equal(queue.gemini.decisions[0].candidate_id, candidateId);
    assert.equal(queue.merged.summary.proposed_decision_count, 1);
    assert.equal(queue.merged.summary.deterministic_review_count, 1);
    assert.equal(queue.merged.summary.proposed_group_count, 1);
    assert.equal(queue.merged.proposed.groups[0].family_name, 'Fixture Sans');
    assert.equal(queue.merged.proposed.groups[0].variant_name, 'Regular');
    assert.equal(queue.merged.publishable, false);
    assert.equal(queue.merged.database_writes_performed, false);
    assert.equal(queue.merged.uploads_performed, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('live report review requires an explicit slug and API key before any request', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.GEMINI_API_KEY;
  let requests = 0;
  delete process.env.GEMINI_API_KEY;
  globalThis.fetch = async () => {
    requests += 1;
    throw new Error('no request should be sent');
  };

  try {
    await assert.rejects(
      reviewDiscoveryReport(makeReport(), { live: true, apiKey: 'test-key' }),
      /requires --slug/,
    );
    await assert.rejects(
      reviewDiscoveryReport(makeReport(), { live: true, slug: 'fixture-font' }),
      /Missing GEMINI_API_KEY/,
    );
    assert.equal(requests, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
  }
});
