import test from 'node:test';
import assert from 'node:assert/strict';
import { assertProductionWriteEnabled } from '../scripts/font-processing/write-gate.js';

test('production write gate rejects a normal invocation', () => {
  assert.throws(() => assertProductionWriteEnabled({
    argv: ['node', 'scripts/font-processing/publish-plan.js', 'manifest.json'],
    env: { FONT_PROCESSING_ALLOW_WRITES: 'true' },
  }), /disabled by default/);
});

test('production write gate requires both explicit opt-ins', () => {
  assert.throws(() => assertProductionWriteEnabled({
    argv: ['node', 'scripts/font-processing/publish-plan.js', 'manifest.json', '--apply'], env: {},
  }), /second explicit write gate/);
  assert.doesNotThrow(() => assertProductionWriteEnabled({
    argv: ['node', 'scripts/font-processing/publish-plan.js', 'manifest.json', '--apply'],
    env: { FONT_PROCESSING_ALLOW_WRITES: 'true' },
  }));
});
