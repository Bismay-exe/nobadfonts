import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDiscoveryReport } from '../scripts/font-processing/validate-discovery-report.js';

const hashA = 'a'.repeat(64);
const hashB = 'b'.repeat(64);
const hashC = 'c'.repeat(64);
const hashD = 'd'.repeat(64);

test('validateDiscoveryReport reports archive counts, duplicate hashes, and review cases', () => {
  const report = {
    generated_at: '2026-10-09T00:00:00.000Z',
    mode: 'read-only-discovery',
    database_writes_performed: false,
    queue_items: [{
      slug: 'fixture-font',
      assets: [
        {
          source_label: 'static',
          relative_path: 'Font-Regular.ttf',
          extension: 'ttf',
          sha256: hashA,
          size_bytes: 100,
          variant_name_guess: 'Regular',
          metadata: { status: 'parsed', family_name: 'Fixture Sans', subfamily_name: 'Regular', weight_class: 400, is_italic: false },
        },
        {
          source_label: 'static-copy',
          relative_path: 'duplicate/Font-Regular.ttf',
          extension: 'ttf',
          sha256: hashA,
          size_bytes: 100,
          variant_name_guess: 'Regular',
          metadata: { status: 'parsed', family_name: 'Fixture Sans', subfamily_name: 'Regular', weight_class: 400, is_italic: false },
        },
        {
          source_label: 'web',
          relative_path: 'Font-Regular.woff2',
          extension: 'woff2',
          sha256: hashB,
          size_bytes: 101,
          variant_name_guess: 'Regular',
          metadata: { status: 'not_parsed' },
        },
        {
          source_label: 'static',
          relative_path: 'Unknown.otf',
          extension: 'otf',
          sha256: hashD,
          size_bytes: 80,
          metadata: { status: 'parse_failed' },
        },
      ],
    }],
  };

  const [result] = validateDiscoveryReport(report).queue_items;
  assert.equal(result.asset_count, 4);
  assert.equal(result.unique_binary_count, 4);
  assert.equal(result.duplicate_source_copies, 1);
  assert.equal(result.source_file_counts.static, 2);
  assert.equal(result.source_file_counts['static-copy'], 1);
  assert.equal(result.source_file_counts.web, 1);
  assert.equal(result.review_reason_counts.metadata_not_parsed, 1);
  assert.equal(result.review_reason_counts.family_name_weight_conflict, 1);
  assert.equal(result.review_reason_counts.missing_family_metadata, 1);
  assert.equal(result.planned_variant_group_count, 1);
  assert.equal(result.planned_asset_count, 1);
  assert.equal(result.database_writes_performed, undefined);
});

test('validateDiscoveryReport rejects invalid input', () => {
  assert.throws(() => validateDiscoveryReport({}), /queue_items array/);
});
