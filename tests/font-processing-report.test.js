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
          relative_path: 'Font-ExtraBold.ttf',
          extension: 'ttf',
          sha256: hashC,
          size_bytes: 102,
          variant_name_guess: 'Extra Bold',
          metadata: { status: 'parsed', family_name: 'Fixture Sans ExtraBold', subfamily_name: 'Regular', weight_class: 800, is_italic: false },
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
  assert.equal(result.asset_count, 5);
  assert.equal(result.unique_binary_count, 4);
  assert.equal(result.duplicate_source_copies, 1);
  assert.equal(result.source_file_counts.static, 3);
  assert.equal(result.source_file_counts['static-copy'], 1);
  assert.equal(result.source_file_counts.web, 1);
  assert.equal(result.review_reason_counts.metadata_not_parsed, 1);
  assert.equal(result.review_reason_counts.family_name_weight_conflict, 1);
  assert.equal(result.review_reason_counts.metadata_parse_failed, 1);
  assert.equal(result.planned_variant_group_count, 1);
  assert.equal(result.planned_asset_count, 1);
});

test('validateDiscoveryReport rejects invalid input', () => {
  assert.throws(() => validateDiscoveryReport({}), /queue_items array/);
});

import { compareDiscoverySummaries } from '../scripts/font-processing/compare-discovery-summaries.js';

test('compareDiscoverySummaries reports WOFF2 metadata improvements and review deltas', () => {
  const baseline = {
    generated_at: '2026-10-09T09:00:00.000Z',
    queue_items: [{
      slug: 'monaspace',
      asset_count: 10,
      unique_binary_count: 10,
      extension_counts: { woff2: 4, ttf: 6 },
      metadata_status_counts: { parsed: 6, not_parsed: 4 },
      planned_variant_group_count: 3,
      review_count: 7,
      review_reason_counts: { metadata_not_parsed: 4, family_name_weight_conflict: 3 },
      format_conflict_count: 1,
      binary_weight_filename_disagreement_count: 0,
    }],
  };
  const fresh = {
    generated_at: '2026-10-09T10:00:00.000Z',
    queue_items: [{
      slug: 'monaspace',
      asset_count: 10,
      unique_binary_count: 10,
      extension_counts: { woff2: 4, ttf: 6 },
      metadata_status_counts: { parsed: 9, parse_failed: 1 },
      planned_variant_group_count: 4,
      review_count: 4,
      review_reason_counts: { metadata_parse_failed: 1, family_name_weight_conflict: 3 },
      format_conflict_count: 2,
      binary_weight_filename_disagreement_count: 1,
    }],
  };

  const [result] = compareDiscoverySummaries(baseline, fresh).comparisons;
  assert.equal(result.status, 'compared');
  assert.equal(result.asset_count.delta, 0);
  assert.equal(result.metadata_status_counts.parsed.delta, 3);
  assert.equal(result.metadata_status_counts.not_parsed.delta, -4);
  assert.equal(result.metadata_status_counts.parse_failed.delta, 1);
  assert.equal(result.review_count.delta, -3);
  assert.equal(result.review_reason_counts.metadata_not_parsed.delta, -4);
  assert.equal(result.format_conflict_count.delta, 1);
  assert.equal(result.binary_weight_filename_disagreement_count.delta, 1);
});

test('compareDiscoverySummaries flags missing baseline/fresh slugs', () => {
  const result = compareDiscoverySummaries(
    { queue_items: [{ slug: 'old-font', asset_count: 1 }] },
    { queue_items: [{ slug: 'new-font', asset_count: 2 }] },
  );
  assert.deepEqual(result.comparisons.map((item) => item.status), ['new_in_fresh', 'missing_from_fresh']);
});

import { validateWoff2FromDiscoveryReport } from '../scripts/font-processing/replay-woff2-discovery.js';

test('validateWoff2FromDiscoveryReport rejects malformed reports before network access', async () => {
  await assert.rejects(
    validateWoff2FromDiscoveryReport({ queue_items: null }),
    /queue_items array/,
  );
});

import { mergeWoff2ReplayIntoDiscoveryReport } from '../scripts/font-processing/merge-woff2-replay.js';

test('mergeWoff2ReplayIntoDiscoveryReport updates only matching WOFF2 metadata without mutating baseline', () => {
  const baseline = {
    queue_items: [{
      slug: 'example',
      assets: [
        { source_label: 'webfont-static', relative_path: 'A.woff2', extension: 'woff2', metadata: { status: 'not_parsed' } },
        { source_label: 'static', relative_path: 'A.ttf', extension: 'ttf', metadata: { status: 'parsed', family_name: 'Keep Me' } },
      ],
    }],
  };
  const replay = {
    queue_items: [{
      slug: 'example',
      woff2_asset_count_in_baseline: 1,
      woff2_results: [{
        source_label: 'webfont-static', relative_path: 'A.woff2', metadata_status: 'parsed',
        family_name: 'Example', subfamily_name: 'Bold', full_name: 'Example Bold',
        postscript_name: 'Example-Bold', weight_class: 700, is_italic: false,
        is_variable: false, glyph_count: 500, variation_axes: [],
      }],
    }],
  };
  const result = mergeWoff2ReplayIntoDiscoveryReport(baseline, replay);
  assert.equal(result.report.queue_items[0].assets[0].metadata.family_name, 'Example');
  assert.equal(result.report.queue_items[0].assets[0].metadata.status, 'parsed');
  assert.equal(result.report.queue_items[0].assets[1].metadata.family_name, 'Keep Me');
  assert.equal(baseline.queue_items[0].assets[0].metadata.status, 'not_parsed');
  assert.deepEqual(result.summary, [{ slug: 'example', baseline_woff2_count: 1, updated_from_replay: 1, missing_replay_matches: 0 }]);
});

test('mergeWoff2ReplayIntoDiscoveryReport reports missing replay matches without guessing', () => {
  const result = mergeWoff2ReplayIntoDiscoveryReport(
    { queue_items: [{ slug: 'example', assets: [{ source_label: 'x', relative_path: 'missing.woff2', extension: 'woff2', metadata: { status: 'not_parsed' } }] }] },
    { queue_items: [{ slug: 'example', woff2_asset_count_in_baseline: 1, woff2_results: [] }] },
  );
  assert.equal(result.report.queue_items[0].assets[0].metadata.status, 'not_parsed');
  assert.equal(result.summary[0].missing_replay_matches, 1);
});
