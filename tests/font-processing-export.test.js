import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { exportAmbiguousAssets } from '../scripts/font-processing/export-ambiguous-assets.js';

const hash = (char) => char.repeat(64);

function fixtureReport() {
  return {
    queue_items: [{
      slug: 'Fixture Sans / Ambiguous',
      assets: [
        { source_label: 'archive-a', relative_path: 'missing-family-a.woff2', extension: 'woff2', sha256: hash('a'), size_bytes: 120, metadata: { status: 'parsed', subfamily_name: 'Bold', weight_class: 700, is_italic: false } },
        { source_label: 'archive-b', relative_path: 'missing-family-b.woff2', extension: 'woff2', sha256: hash('b'), size_bytes: 121, metadata: { status: 'parsed', subfamily_name: 'Regular', weight_class: 400, is_italic: false } },
      ],
    }],
  };
}

test('ambiguous exporter creates bounded sanitized batches and a non-mutating manifest', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nobadfonts-export-test-'));
  const outputDir = path.join(directory, 'out');
  try {
    const result = exportAmbiguousAssets(fixtureReport(), outputDir, { batchSize: 1 });
    assert.equal(result.manifest.mode, 'local-gemini-review-input-export');
    assert.equal(result.manifest.api_calls_performed, false);
    assert.equal(result.manifest.database_writes_performed, false);
    assert.equal(result.manifest.uploads_performed, false);
    assert.equal(result.manifest.output_files, 2);
    assert.equal(result.manifest.queue_items[0].candidate_count, 2);
    assert.equal(result.manifest.queue_items[0].batch_files.length, 2);

    const batchNames = fs.readdirSync(outputDir).filter((name) => name.endsWith('.json') && name !== 'manifest.json');
    assert.deepEqual(batchNames, [
      'Fixture-Sans-Ambiguous-ambiguous-001.json',
      'Fixture-Sans-Ambiguous-ambiguous-002.json',
    ]);
    const candidate = JSON.parse(fs.readFileSync(path.join(outputDir, batchNames[0]), 'utf8'))[0];
    assert.match(candidate.asset_id, /^[a-f0-9]{64}$/);
    assert.equal('review_reason' in candidate, false);
    assert.equal(candidate.metadata.family_name, null);
    assert.equal(candidate.metadata.subfamily_name, 'Bold');
    assert.equal('binary' in candidate, false);
    assert.throws(() => exportAmbiguousAssets(fixtureReport(), outputDir, { batchSize: 1 }), /already exists|EEXIST/i);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('ambiguous exporter rejects oversized batches before writing candidate files', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nobadfonts-export-limit-'));
  try {
    assert.throws(() => exportAmbiguousAssets(fixtureReport(), path.join(directory, 'out'), { batchSize: 51 }), /between 1 and 50/);
    assert.equal(fs.existsSync(path.join(directory, 'out')), false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
