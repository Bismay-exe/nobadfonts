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
  assert.equal(result.review_reason_counts.family_name_weight_conflict || 0, 0);
  assert.equal(result.review_reason_counts.metadata_parse_failed, 1);
  assert.equal(result.planned_variant_group_count, 2);
  assert.equal(result.planned_asset_count, 2);
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

test('mergeWoff2ReplayIntoDiscoveryReport applies only hash-matched metadata and preserves all extracted names', () => {
  const baseline = {
    queue_items: [{
      slug: 'example',
      assets: [
        { source_label: 'webfont-static', relative_path: 'A.woff2', extension: 'woff2', sha256: hashA, metadata: { status: 'not_parsed', reason: 'old parser note' } },
        { source_label: 'static', relative_path: 'A.ttf', extension: 'ttf', metadata: { status: 'parsed', family_name: 'Keep Me' } },
      ],
    }],
  };
  const replay = {
    queue_items: [{
      slug: 'example',
      font_asset_count_in_baseline: 1,
      woff2_asset_count_in_baseline: 1,
      font_results: [{
        source_label: 'webfont-static', relative_path: 'A.woff2', hash_matches_baseline: true, metadata_status: 'parsed',
        family_name: 'Example', subfamily_name: 'Bold', full_name: 'Example Bold',
        postscript_name: 'Example-Bold', weight_class: 700, is_italic: false,
        is_variable: false, glyph_count: 500, variation_axes: [],
      }],
    }],
  };
  const result = mergeWoff2ReplayIntoDiscoveryReport(baseline, replay);
  const merged = result.report.queue_items[0].assets[0].metadata;
  assert.equal(merged.family_name, 'Example');
  assert.equal(merged.full_name, 'Example Bold');
  assert.equal(merged.postscript_name, 'Example-Bold');
  assert.equal(merged.reason, null);
  assert.equal(merged.status, 'parsed');
  assert.equal(result.report.queue_items[0].assets[1].metadata.family_name, 'Keep Me');
  assert.equal(baseline.queue_items[0].assets[0].metadata.status, 'not_parsed');
  assert.deepEqual(result.summary, [{
    slug: 'example', baseline_font_count: 1, updated_from_replay: 1, missing_replay_matches: 1,
    hash_mismatch_replay_matches: 0, baseline_woff2_count: 1, updated_woff2_from_replay: 1,
    missing_woff2_replay_matches: 0, hash_mismatch_woff2_replay_matches: 0,
  }]);
});

test('mergeWoff2ReplayIntoDiscoveryReport refuses metadata from changed binaries', () => {
  const baseline = {
    queue_items: [{
      slug: 'example',
      assets: [{
        source_label: 'webfont-static', relative_path: 'A.woff2', extension: 'woff2',
        sha256: hashA, metadata: { status: 'not_parsed', family_name: 'Baseline Family' },
      }],
    }],
  };
  const replay = {
    queue_items: [{
      slug: 'example',
      font_asset_count_in_baseline: 1,
      woff2_asset_count_in_baseline: 1,
      font_results: [{
        source_label: 'webfont-static', relative_path: 'A.woff2', hash_matches_baseline: false,
        metadata_status: 'parsed', family_name: 'Changed Binary Family', subfamily_name: 'Regular',
      }],
    }],
  };
  const result = mergeWoff2ReplayIntoDiscoveryReport(baseline, replay);
  assert.equal(result.report.queue_items[0].assets[0].metadata.family_name, 'Baseline Family');
  assert.equal(result.report.queue_items[0].assets[0].metadata.status, 'not_parsed');
  assert.equal(result.summary[0].updated_from_replay, 0);
  assert.equal(result.summary[0].missing_replay_matches, 1);
  assert.equal(result.summary[0].hash_mismatch_replay_matches, 1);
  assert.equal(result.summary[0].hash_mismatch_woff2_replay_matches, 1);
});

test('mergeWoff2ReplayIntoDiscoveryReport preserves known metadata when parsing fails', () => {
  const baseline = {
    queue_items: [{
      slug: 'example',
      assets: [{
        source_label: 'static', relative_path: 'A.ttf', extension: 'ttf',
        sha256: hashA, metadata: { status: 'parsed', family_name: 'Known Family', full_name: 'Known Family Regular', weight_class: 400 },
      }],
    }],
  };
  const replay = {
    queue_items: [{
      slug: 'example',
      font_asset_count_in_baseline: 1,
      font_results: [{
        source_label: 'static', relative_path: 'A.ttf', hash_matches_baseline: true,
        metadata_status: 'parse_failed', error: 'broken fixture', family_name: null, full_name: null, weight_class: null,
      }],
    }],
  };
  const result = mergeWoff2ReplayIntoDiscoveryReport(baseline, replay);
  const metadata = result.report.queue_items[0].assets[0].metadata;
  assert.equal(metadata.status, 'parse_failed');
  assert.equal(metadata.reason, 'broken fixture');
  assert.equal(metadata.family_name, 'Known Family');
  assert.equal(metadata.full_name, 'Known Family Regular');
  assert.equal(metadata.weight_class, 400);
});

test('mergeWoff2ReplayIntoDiscoveryReport reports missing replay matches without guessing', () => {
  const result = mergeWoff2ReplayIntoDiscoveryReport(
    { queue_items: [{ slug: 'example', assets: [{ source_label: 'x', relative_path: 'missing.woff2', extension: 'woff2', metadata: { status: 'not_parsed' } }] }] },
    { queue_items: [{ slug: 'example', woff2_asset_count_in_baseline: 1, woff2_results: [] }] },
  );
  assert.equal(result.report.queue_items[0].assets[0].metadata.status, 'not_parsed');
  assert.equal(result.summary[0].missing_replay_matches, 1);
  assert.equal(result.summary[0].hash_mismatch_replay_matches, 0);
});

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { exportAmbiguousAssets } from '../scripts/font-processing/export-ambiguous-assets.js';

test('ambiguous candidate exporter writes bounded local batches without API or database side effects', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nbf-gemini-export-test-'));
  try {
    const report = {
      queue_items: [{
        slug: 'fixture-font',
        assets: [
          { source_label: 'static', relative_path: 'A-Regular.ttf', extension: 'ttf', sha256: '1'.repeat(64), metadata: { status: 'parsed', family_name: 'Fixture Sans', subfamily_name: 'Regular', weight_class: 400, is_italic: false } },
          { source_label: 'static', relative_path: 'Unknown-1.woff2', extension: 'woff2', sha256: '2'.repeat(64), metadata: { status: 'parsed' } },
          { source_label: 'static', relative_path: 'Unknown-2.otf', extension: 'otf', sha256: '3'.repeat(64), metadata: { status: 'parsed' } },
          { source_label: 'static', relative_path: 'Unknown-3.woff', extension: 'woff', sha256: '4'.repeat(64), metadata: { status: 'parsed' } },
        ],
      }],
    };

    const result = exportAmbiguousAssets(report, outputDir, { batchSize: 2 });
    const [queue] = result.manifest.queue_items;
    assert.equal(queue.unique_asset_count, 4);
    assert.equal(queue.candidate_count, 3);
    assert.equal(queue.batch_files.length, 2);
    assert.deepEqual(queue.batch_files.map((item) => item.candidate_count), [2, 1]);
    assert.equal(result.manifest.api_calls_performed, false);
    assert.equal(result.manifest.database_writes_performed, false);
    assert.equal(result.manifest.uploads_performed, false);

    const batches = queue.batch_files.map((item) => JSON.parse(fs.readFileSync(path.join(outputDir, item.file), 'utf8')));
    assert.deepEqual(batches.map((batch) => batch.length), [2, 1]);
    assert.ok(batches.flat().every((candidate) => candidate.asset_id && candidate.metadata));
    assert.ok(batches.flat().every((candidate) => !('review_reason' in candidate)));
    assert.throws(() => exportAmbiguousAssets(report, outputDir, { batchSize: 51 }), /between 1 and 50/);
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});


test('ambiguous candidate exporter emits an empty manifest when deterministic metadata needs no review', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nbf-gemini-empty-export-test-'));
  try {
    const report = {
      queue_items: [{
        slug: 'fully-parsed-font',
        assets: [
          { source_label: 'static', relative_path: 'A-Regular.ttf', extension: 'ttf', sha256: 'a'.repeat(64), metadata: { status: 'parsed', family_name: 'Fixture Sans', subfamily_name: 'Regular', weight_class: 400, is_italic: false } },
          { source_label: 'webfont', relative_path: 'A-Regular.woff2', extension: 'woff2', sha256: 'b'.repeat(64), metadata: { status: 'parsed', family_name: 'Fixture Sans', subfamily_name: 'Regular', weight_class: 400, is_italic: false } },
        ],
      }],
    };

    const result = exportAmbiguousAssets(report, outputDir);
    const [queue] = result.manifest.queue_items;
    assert.equal(queue.unique_asset_count, 2);
    assert.equal(queue.candidate_count, 0);
    assert.deepEqual(queue.reason_counts, {});
    assert.deepEqual(queue.batch_files, []);
    assert.equal(result.manifest.output_files, 0);
    assert.equal(result.manifest.api_calls_performed, false);
    assert.equal(result.manifest.database_writes_performed, false);
    assert.equal(result.manifest.uploads_performed, false);
    assert.deepEqual(fs.readdirSync(outputDir), ['manifest.json']);
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});


import { auditVariantGroups } from '../scripts/font-processing/audit-variant-groups.js';

test('auditVariantGroups reports evidence disagreements and explicitly does not claim semantic correctness', () => {
  const result = auditVariantGroups({
    queue_items: [{
      slug: 'audit-fixture',
      assets: [
        { source_label: 'static', relative_path: 'A-Regular.ttf', extension: 'ttf', sha256: 'a'.repeat(64), size_bytes: 100, metadata: { status: 'parsed', family_name: 'Fixture Sans', subfamily_name: 'Regular', weight_class: 400, is_italic: false, is_variable: false } },
        { source_label: 'webfont', relative_path: 'A-Regular.woff2', extension: 'woff2', sha256: 'b'.repeat(64), size_bytes: 110, metadata: { status: 'parsed', family_name: 'FIXTURE SANS', subfamily_name: 'Regular', weight_class: 400, is_italic: false, is_variable: false } },
        { source_label: 'static', relative_path: 'A-Bold.ttf', extension: 'ttf', sha256: 'c'.repeat(64), size_bytes: 120, metadata: { status: 'parsed', family_name: 'Fixture Sans', subfamily_name: 'Bold', weight_class: 700, is_italic: false, is_variable: false } },
      ],
    }],
  });

  assert.equal(result.mode, 'offline-read-only-variant-group-audit');
  assert.equal(result.publishable, false);
  assert.equal(result.database_writes_performed, false);
  assert.equal(result.api_calls_performed, false);
  assert.equal(result.uploads_performed, false);
  assert.equal(result.semantic_correctness_claimed, false);
  assert.equal(result.summary.planned_group_count, 2);
  assert.equal(result.summary.flagged_group_count, 1);
  assert.deepEqual(result.queues[0].flagged_groups[0].review_flags, ['raw_family_name_disagreement']);
  assert.equal(result.queues[0].groups.find((group) => group.variant_key === 'bold').assessment, 'no_automatic_flags_not_semantically_verified');
  assert.ok(result.limitations.some((item) => item.includes('does not prove')));
});

test('auditVariantGroups rejects malformed reports', () => {
  assert.throws(() => auditVariantGroups({}), /queue_items array/);
});


test('variant audit preserves weight-class evidence by format without inferring a correction', () => {
  const result = auditVariantGroups({
    queue_items: [{
      slug: 'format-weight-evidence',
      assets: [
        { source_label: 'static', relative_path: 'Mono-Bold.otf', extension: 'otf', sha256: 'e'.repeat(64), size_bytes: 100, metadata: { status: 'parsed', family_name: 'Mono', subfamily_name: 'Bold', weight_class: 700, is_italic: false, is_variable: false } },
        { source_label: 'webfont', relative_path: 'Mono-Bold.woff', extension: 'woff', sha256: 'f'.repeat(64), size_bytes: 90, metadata: { status: 'parsed', family_name: 'Mono', subfamily_name: 'Bold', weight_class: 400, is_italic: false, is_variable: false } },
        { source_label: 'webfont', relative_path: 'Mono-Bold.woff2', extension: 'woff2', sha256: '9'.repeat(64), size_bytes: 85, metadata: { status: 'parsed', family_name: 'Mono', subfamily_name: 'Bold', weight_class: 400, is_italic: false, is_variable: false } },
      ],
    }],
  });

  const [group] = result.queues[0].groups;
  assert.ok(group.review_flags.includes('weight_class_disagreement'));
  assert.ok(group.review_flags.includes('subfamily_weight_class_disagreement'));
  assert.deepEqual(group.evidence_variation.named_weight_mismatches, [
    { asset_id: 'f'.repeat(64), extension: '.woff', source_paths: ['Mono-Bold.woff'], subfamily_name: 'Bold', named_weight_class: 700, embedded_weight_class: 400 },
    { asset_id: '9'.repeat(64), extension: '.woff2', source_paths: ['Mono-Bold.woff2'], subfamily_name: 'Bold', named_weight_class: 700, embedded_weight_class: 400 },
  ]);
  assert.deepEqual(group.evidence_variation.weight_classes_by_format, {
    '.otf': { asset_count: 1, weight_classes: [700], source_paths: ['Mono-Bold.otf'] },
    '.woff': { asset_count: 1, weight_classes: [400], source_paths: ['Mono-Bold.woff'] },
    '.woff2': { asset_count: 1, weight_classes: [400], source_paths: ['Mono-Bold.woff2'] },
  });
  assert.equal(group.assets.find((asset) => asset.extension === '.woff2').metadata.weight_class, 400);
  assert.equal(result.publishable, false);
  assert.equal(result.summary.weight_disagreement_group_count, 1);
  assert.equal(result.summary.review_asset_count, 3);
  assert.equal(result.summary.unassigned_review_asset_count, 0);
  assert.equal(result.summary.flagged_group_asset_count, 3);
  assert.deepEqual(result.summary.review_flag_counts, { weight_class_disagreement: 1, subfamily_weight_class_disagreement: 1 });
  assert.equal(result.queues[0].weight_disagreement_groups.length, 1);
  assert.deepEqual(result.queues[0].weight_disagreement_groups[0].weight_classes_by_format, group.evidence_variation.weight_classes_by_format);
});


test('named-weight audit recognizes common weights without confusing Monaspace width labels', () => {
  const cases = [
    ['ExtraLight', 200], ['Light', 300], ['Medium', 500], ['SemiBold', 600], ['Bold Italic', 700], ['ExtraBold', 800],
  ];
  for (const [subfamily, expected] of cases) {
    const result = auditVariantGroups({ queue_items: [{ slug: 'named-weight', assets: [
      { relative_path: `Fixture-${subfamily}.woff2`, extension: 'woff2', sha256: (String(expected).padStart(64, '0')).slice(-64), metadata: { status: 'parsed', family_name: 'Fixture', subfamily_name: subfamily, weight_class: 400, is_italic: /italic/i.test(subfamily), is_variable: false } },
    ] }] });
    const [group] = result.queues[0].groups;
    assert.ok(group.review_flags.includes('subfamily_weight_class_disagreement'), subfamily);
    assert.equal(group.evidence_variation.named_weight_mismatches[0].named_weight_class, expected, subfamily);
  }
  const widthResult = auditVariantGroups({ queue_items: [{ slug: 'width-label', assets: [
    { relative_path: 'Fixture-SemiWide.woff2', extension: 'woff2', sha256: 'e'.repeat(64), metadata: { status: 'parsed', family_name: 'Fixture', subfamily_name: 'SemiWide', weight_class: 400, is_italic: false, is_variable: false } },
  ] }] });
  assert.equal(widthResult.queues[0].groups[0].evidence_variation.named_weight_mismatches.length, 0);
});


test('ambiguous exporter includes every asset in metadata-contradictory groups with cross-format evidence', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nbf-gemini-group-review-test-'));
  try {
    const report = { queue_items: [{ slug: 'format-weight-conflict', assets: [
      { source_label: 'otf', relative_path: 'Mono-Bold.otf', extension: 'otf', sha256: 'a'.repeat(64), metadata: { status: 'parsed', family_name: 'Mono', subfamily_name: 'Bold', weight_class: 700, is_italic: false } },
      { source_label: 'woff', relative_path: 'Mono-Bold.woff', extension: 'woff', sha256: 'b'.repeat(64), metadata: { status: 'parsed', family_name: 'Mono', subfamily_name: 'Bold', weight_class: 400, is_italic: false } },
      { source_label: 'woff2', relative_path: 'Mono-Bold.woff2', extension: 'woff2', sha256: 'c'.repeat(64), metadata: { status: 'parsed', family_name: 'Mono', subfamily_name: 'Bold', weight_class: 400, is_italic: false } },
    ] }] };
    const result = exportAmbiguousAssets(report, outputDir);
    const queue = result.manifest.queue_items[0];
    assert.equal(queue.flagged_group_count, 1);
    assert.equal(queue.flagged_group_asset_count, 3);
    assert.equal(queue.candidate_count, 3);
    assert.equal(queue.reason_counts.weight_class_disagreement, 3);
    const batch = JSON.parse(fs.readFileSync(path.join(outputDir, queue.batch_files[0].file), 'utf8'));
    assert.equal(batch.length, 3);
    assert.ok(batch.every((candidate) => candidate.review_reasons.includes('weight_class_disagreement')));
    assert.ok(batch.every((candidate) => candidate.group_evidence[0].weight_classes_by_format['.woff2'].weight_classes[0] === 400));
    assert.ok(batch.every((candidate) => !('review_reason' in candidate)));
    assert.equal(result.manifest.api_calls_performed, false);
    assert.equal(result.manifest.database_writes_performed, false);
    assert.equal(result.manifest.uploads_performed, false);
  } finally { fs.rmSync(outputDir, { recursive: true, force: true }); }
});
