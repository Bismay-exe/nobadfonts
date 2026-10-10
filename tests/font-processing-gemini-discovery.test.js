import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { reviewDiscoveryReport } from '../scripts/font-processing/review-discovery-with-gemini.js';

const hash = 'a'.repeat(64);

function report() {
  return {
    generated_at: '2026-10-10T00:00:00.000Z',
    queue_items: [{
      slug: 'fixture-family',
      assets: [{
        sha256: hash,
        relative_path: 'Fixture-Bold.woff2',
        extension: '.woff2',
        size_bytes: 1200,
        metadata: {
          family_name: null,
          subfamily_name: 'Bold',
          weight_class: 700,
          is_italic: false,
          status: 'parsed',
        },
      }],
    }],
  };
}

test('discovery review defaults to deterministic read-only mode and makes no Gemini request', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('fetch must not be called in default mode');
  };
  try {
    const result = await reviewDiscoveryReport(report());
    assert.equal(fetchCalls, 0);
    assert.equal(result.mode, 'read-only-deterministic-review');
    assert.equal(result.publishable, false);
    assert.equal(result.database_writes_performed, false);
    assert.equal(result.uploads_performed, false);
    assert.equal(result.queue_items[0].gemini.mode, 'not_requested');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('live mode sends one bounded advisory request and preserves read-only guarantees', async () => {
  const originalFetch = globalThis.fetch;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nobadfonts-gemini-discovery-'));
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              decisions: [{
                candidate_id: hash,
                decision: 'group',
                relation: 'same_family',
                confidence: 0.98,
                reason: 'The available metadata supports this assignment.',
                proposed_family_name: 'Fixture Family',
                proposed_variant_name: 'Bold',
              }],
            }),
          }],
        },
      }],
      usageMetadata: { candidatesTokenCount: 64 },
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    const result = await reviewDiscoveryReport(report(), {
      live: true,
      slug: 'fixture-family',
      apiKey: 'test-only-key',
      cacheFile: path.join(directory, 'cache.json'),
      maxOutputTokens: 512,
      maxTotalOutputTokens: 512,
    });
    assert.equal(fetchCalls, 1);
    assert.equal(result.mode, 'read-only-gemini-advisory-review');
    assert.equal(result.publishable, false);
    assert.equal(result.database_writes_performed, false);
    assert.equal(result.uploads_performed, false);
    assert.equal(result.queue_items[0].merged.summary.proposed_decision_count, 1);
    assert.equal(result.queue_items[0].merged.proposed.groups[0].family_name, 'Fixture Family');
  } finally {
    globalThis.fetch = originalFetch;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('live mode requires a target slug and never sends a request without explicit API opt-in', async () => {
  await assert.rejects(
    () => reviewDiscoveryReport(report(), { live: true, apiKey: 'test-only-key' }),
    /requires --slug/,
  );
});

test('existing processor entry point runs report review without Supabase credentials or write flags', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nobadfonts-review-cli-'));
  const inputPath = path.join(directory, 'input.json');
  const outputPath = path.join(directory, 'output.json');
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const processorPath = path.join(repoRoot, 'scripts/process-ai-fonts.js');
  const env = { ...process.env };
  delete env.VITE_SUPABASE_URL;
  delete env.SUPABASE_SERVICE_ROLE_KEY;
  delete env.FONT_PROCESSING_ALLOW_WRITES;

  try {
    fs.writeFileSync(inputPath, JSON.stringify({ queue_items: [] }));
    execFileSync(process.execPath, [
      processorPath,
      '--review-report',
      inputPath,
      outputPath,
    ], { cwd: repoRoot, env, encoding: 'utf8' });
    const result = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    assert.equal(result.mode, 'read-only-deterministic-review');
    assert.equal(result.database_writes_performed, false);
    assert.equal(result.uploads_performed, false);
    assert.equal(result.publishable, false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
