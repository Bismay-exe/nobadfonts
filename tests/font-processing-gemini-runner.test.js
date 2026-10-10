import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runGeminiReview } from '../scripts/font-processing/run-gemini-review.js';

const candidates = [{
  asset_id: 'fixture-bold-woff2',
  relative_path: 'Fixture-Bold.woff2',
  metadata: {
    family_name: 'Fixture Sans',
    subfamily_name: 'Bold',
    full_name: 'Fixture Sans Bold',
    postscript_name: 'FixtureSans-Bold',
    weight_class: 700,
    is_italic: false,
    is_variable: false,
    status: 'parsed',
  },
}];

function temporaryCache() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nobadfonts-gemini-test-'));
  return {
    directory,
    cacheFile: path.join(directory, 'cache.json'),
    cleanup: () => fs.rmSync(directory, { recursive: true, force: true }),
  };
}

function successfulResponse() {
  return new Response(JSON.stringify({
    candidates: [{
      content: {
        parts: [{ text: JSON.stringify({ decisions: [{
          candidate_id: 'fixture-bold-woff2',
          decision: 'group',
          relation: 'same_family',
          confidence: 0.99,
          reason: 'Fixture metadata is consistent.',
        }] }) }],
      },
    }],
    usageMetadata: { candidatesTokenCount: 50 },
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

test('Gemini runner caches validated advisory output and does not call fetch on a cache hit', async () => {
  const temp = temporaryCache();
  const originalFetch = globalThis.fetch;
  let requests = 0;
  let requestedUrl = '';
  let requestedBody;
  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    requestedBody = JSON.parse(init.body);
    requests += 1;
    return successfulResponse();
  };

  try {
    const options = { cacheFile: temp.cacheFile, apiKey: 'test-key-not-used-on-network', maxRequests: 1, maxOutputTokens: 100, maxTotalOutputTokens: 100 };
    const first = await runGeminiReview(candidates, options);
    const second = await runGeminiReview(candidates, options);

    assert.equal(requests, 1);
    assert.match(requestedUrl, /\/v1beta\/models\/gemini-3\.8-flash:generateContent$/);
    assert.equal(first.model, 'gemini-3.8-flash');
    assert.equal(requestedBody.generationConfig.responseMimeType, 'application/json');
    assert.deepEqual(requestedBody.generationConfig.thinkingConfig, { thinkingLevel: 'LOW' });
    assert.equal('temperature' in requestedBody.generationConfig, false);
    assert.equal(requestedBody.generationConfig.responseSchema.type, 'OBJECT');
    assert.deepEqual(requestedBody.generationConfig.responseSchema.required, ['decisions']);
    assert.deepEqual(requestedBody.generationConfig.responseSchema.properties.decisions.items.required,
      ['candidate_id', 'decision', 'relation', 'confidence', 'reason']);
    assert.equal(first.cache.hit, false);
    assert.equal(second.cache.hit, true);
    assert.equal(second.publishable, false);
    assert.equal(second.database_writes_performed, false);
    assert.equal(second.uploads_performed, false);
    assert.equal(JSON.parse(fs.readFileSync(temp.cacheFile, 'utf8')).requests_used, 1);
  } finally {
    globalThis.fetch = originalFetch;
    temp.cleanup();
  }
});

test('Gemini runner enforces a persistent request budget before network access', async () => {
  const temp = temporaryCache();
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return successfulResponse();
  };

  try {
    const options = { cacheFile: temp.cacheFile, apiKey: 'test-key-not-used-on-network', maxRequests: 1, maxOutputTokens: 100, maxTotalOutputTokens: 200 };
    await runGeminiReview(candidates, options);
    await assert.rejects(
      runGeminiReview([{ ...candidates[0], asset_id: 'a-different-candidate' }], options),
      /request budget exhausted/,
    );
    assert.equal(requests, 1);
    assert.equal(JSON.parse(fs.readFileSync(temp.cacheFile, 'utf8')).requests_used, 1);
  } finally {
    globalThis.fetch = originalFetch;
    temp.cleanup();
  }
});

test('Gemini runner fails closed on a malformed persistent cache without network access', async () => {
  const temp = temporaryCache();
  const originalFetch = globalThis.fetch;
  let requests = 0;
  fs.writeFileSync(temp.cacheFile, '{not json');
  globalThis.fetch = async () => {
    requests += 1;
    return successfulResponse();
  };

  try {
    await assert.rejects(
      runGeminiReview(candidates, { cacheFile: temp.cacheFile, apiKey: 'test-key-not-used-on-network' }),
      /cache is malformed/,
    );
    assert.equal(requests, 0);
  } finally {
    globalThis.fetch = originalFetch;
    temp.cleanup();
  }
});

test('Gemini runner reports malformed model JSON with finish reason instead of a raw parser crash', async () => {
  const temp = temporaryCache();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    candidates: [{
      finishReason: 'STOP',
      content: { parts: [{ text: '{"decisions":[{"candidate_id":"fixture-bold-woff2","reason":"unfinished' }] },
    }],
  }), { status: 200, headers: { 'content-type': 'application/json' } });

  try {
    await assert.rejects(
      runGeminiReview(candidates, {
        cacheFile: temp.cacheFile,
        apiKey: 'test-key-not-used-on-network',
        maxRequests: 1,
        maxOutputTokens: 100,
        maxTotalOutputTokens: 100,
      }),
      /Gemini returned invalid JSON \(finishReason=STOP\): The response did not conform to the requested JSON structure/,
    );
  } finally {
    globalThis.fetch = originalFetch;
    temp.cleanup();
  }
});
