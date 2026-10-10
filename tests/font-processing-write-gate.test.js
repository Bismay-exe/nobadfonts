import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { assertProductionWriteEnabled } from '../scripts/font-processing/write-gate.js';

test('production write gate rejects a normal invocation', () => {
  assert.throws(() => assertProductionWriteEnabled({
    argv: ['node', 'scripts/process-ai-fonts.js'],
    env: { FONT_PROCESSING_ALLOW_WRITES: 'true' },
  }), /disabled by default/);
});

test('production write gate requires both explicit opt-ins', () => {
  assert.throws(() => assertProductionWriteEnabled({
    argv: ['node', 'scripts/process-ai-fonts.js', '--apply'], env: {},
  }), /second explicit write gate/);
  assert.doesNotThrow(() => assertProductionWriteEnabled({
    argv: ['node', 'scripts/process-ai-fonts.js', '--apply'],
    env: { FONT_PROCESSING_ALLOW_WRITES: 'true' },
  }));
});

test('processor entry point refuses writes before reading credentials or connecting to Supabase', () => {
  const result = spawnSync(process.execPath, ['scripts/process-ai-fonts.js'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, FONT_PROCESSING_ALLOW_WRITES: 'true' },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Production font processing is disabled by default/);
  assert.doesNotMatch(result.stderr, /Missing VITE_SUPABASE_URL/);
});
