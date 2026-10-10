import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeGeminiReview } from '../scripts/font-processing/merge-gemini-review.js';

const hash = (char) => char.repeat(64);
const assets = () => [
  {
    asset_id: hash('a'),
    sha256: hash('a'),
    extension: '.woff2',
    relative_path: 'MonaspaceKrypton-Bold.woff2',
    metadata: {
      family_name: 'Monaspace Krypton Var',
      subfamily_name: 'Regular',
      weight_class: 700,
      is_italic: false,
      extension: '.woff2',
      status: 'parsed',
    },
    sources: [{ relative_path: 'MonaspaceKrypton-Bold.woff2' }],
  },
  {
    asset_id: hash('b'),
    sha256: hash('b'),
    extension: '.otf',
    relative_path: 'MonaspaceKrypton-Bold.otf',
    metadata: {
      family_name: 'Monaspace Krypton',
      subfamily_name: 'Bold',
      weight_class: 700,
      is_italic: false,
      extension: '.otf',
      status: 'parsed',
    },
    sources: [{ relative_path: 'MonaspaceKrypton-Bold.otf' }],
  },
];

const review = (overrides = {}) => ({
  decisions: [{
    candidate_id: hash('a'),
    decision: 'group',
    relation: 'same_family',
    confidence: 0.97,
    reason: 'The embedded names and weight support this family and variant.',
    proposed_family_name: 'Monaspace Krypton',
    proposed_variant_name: 'Bold',
    ...overrides,
  }],
});

test('merges a valid Gemini proposal into a separate proposed report', () => {
  const input = assets();
  const before = structuredClone(input);
  const result = mergeGeminiReview({ assets: input, review: review() });

  assert.equal(result.publishable, false);
  assert.equal(result.database_writes_performed, false);
  assert.equal(result.uploads_performed, false);
  assert.deepEqual(input, before);
  assert.equal(result.summary.input_asset_count, 2);
  assert.equal(result.summary.proposed_decision_count, 1);
  assert.equal(result.summary.review_required_count, 1);
  assert.equal(result.proposed.groups.some((group) =>
    group.family_name === 'Monaspace Krypton' && group.variant_name === 'Bold' && group.assets.length === 2
  ), true);
  assert.equal(result.decisions[0].status, 'proposed');
});

test('does not apply low-confidence or incomplete Gemini proposals', () => {
  const lowConfidence = mergeGeminiReview({
    assets: assets(),
    review: review({ confidence: 0.6 }),
  });
  assert.equal(lowConfidence.summary.proposed_decision_count, 0);
  assert.equal(lowConfidence.decisions[0].status, 'needs_human_review');

  const incomplete = mergeGeminiReview({
    assets: assets(),
    review: review({ proposed_variant_name: undefined }),
  });
  assert.equal(incomplete.summary.proposed_decision_count, 0);
  assert.equal(incomplete.decisions[0].reason, 'gemini_proposal_missing_family_or_variant');
});

test('rejects unknown and duplicate Gemini candidate decisions', () => {
  assert.throws(() => mergeGeminiReview({
    assets: assets(),
    review: review({ candidate_id: 'unknown-candidate' }),
  }), /unknown asset/);

  const duplicate = review();
  duplicate.decisions.push({ ...duplicate.decisions[0] });
  assert.throws(() => mergeGeminiReview({
    assets: assets(),
    review: duplicate,
  }), /Duplicate Gemini decision/);
});

test('does not merge distinct named Monaspace subfamilies into one family', () => {
  const monaspaceAssets = [
    {
      asset_id: hash('c'), sha256: hash('c'), extension: '.woff2',
      metadata: { family_name: 'Monaspace Neon', subfamily_name: 'Regular', weight_class: 400, is_italic: false, extension: '.woff2', status: 'parsed' },
      sources: [],
    },
    {
      asset_id: hash('d'), sha256: hash('d'), extension: '.woff2',
      metadata: { family_name: 'Monaspace Xenon', subfamily_name: 'Regular', weight_class: 400, is_italic: false, extension: '.woff2', status: 'parsed' },
      sources: [],
    },
  ];
  const result = mergeGeminiReview({
    assets: monaspaceAssets,
    review: {
      decisions: [
        {
          candidate_id: hash('c'), decision: 'group', relation: 'same_family', confidence: 0.99,
          reason: 'Neon is a distinct named subfamily.', proposed_family_name: 'Monaspace Neon', proposed_variant_name: 'Regular',
        },
        {
          candidate_id: hash('d'), decision: 'group', relation: 'same_family', confidence: 0.99,
          reason: 'Xenon is a distinct named subfamily.', proposed_family_name: 'Monaspace Xenon', proposed_variant_name: 'Regular',
        },
      ],
    },
  });
  assert.equal(result.proposed.groups.length, 2);
  assert.deepEqual(result.proposed.groups.map((group) => group.family_name).sort(), ['Monaspace Neon', 'Monaspace Xenon']);
});
