import { planVariantGroups } from './core.js';

const normalizeText = (value) => (
  typeof value === 'string' ? value.normalize('NFKC').trim().replace(/\\s+/g, ' ') : ''
);

function assetId(asset) {
  return normalizeText(asset?.asset_id || asset?.sha256);
}

function validateProposedLabel(value, label) {
  const normalized = normalizeText(value);
  if (!normalized || normalized.length > 128 || /[\\r\\n\\0]/.test(normalized)) {
    throw new TypeError(`Invalid ${label} in Gemini proposal`);
  }
  return normalized;
}

/**
 * Apply validated Gemini suggestions to a separate, in-memory copy of the
 * candidate assets. The source objects and deterministic report are untouched.
 *
 * Only high-confidence "group" decisions with explicit proposed family and
 * variant names can affect the proposed grouping. All other decisions remain
 * review cases. This function never calls an API or writes to external systems.
 */
export function mergeGeminiReview({ assets, review, minimumConfidence = 0.85, candidateIds = null } = {}) {
  if (!Array.isArray(assets)) throw new TypeError('assets must be an array');
  if (!review || !Array.isArray(review.decisions)) {
    throw new TypeError('review must contain a decisions array');
  }
  if (!Number.isFinite(minimumConfidence) || minimumConfidence < 0 || minimumConfidence > 1) {
    throw new RangeError('minimumConfidence must be between 0 and 1');
  }

  const ids = assets.map(assetId);
  if (ids.some((id) => !id)) throw new TypeError('Every asset must have asset_id or sha256');
  if (new Set(ids).size !== ids.length) {
    throw new TypeError('assets must be deduplicated by SHA-256 before merging Gemini review');
  }

  const assetsById = new Map(assets.map((asset, index) => [ids[index], asset]));
  const candidates = candidateIds == null ? new Set(ids) : new Set(candidateIds.map(normalizeText));
  for (const id of candidates) {
    if (!assetsById.has(id)) throw new TypeError(`Unknown Gemini candidate ID: ${id || '(empty)'}`);
  }
  const seenDecisionIds = new Set();
  const decisionsById = new Map();

  for (const decision of review.decisions) {
    const id = normalizeText(decision?.candidate_id);
    if (!assetsById.has(id) || !candidates.has(id)) throw new TypeError(`Gemini decision references unknown or unselected asset: ${id || '(empty)'}`);
    if (seenDecisionIds.has(id)) throw new TypeError(`Duplicate Gemini decision for asset: ${id}`);
    seenDecisionIds.add(id);
    decisionsById.set(id, decision);
  }

  const withExtension = (asset) => ({
    ...asset,
    metadata: {
      ...(asset.metadata || {}),
      extension: asset.metadata?.extension || asset.extension || null,
    },
  });
  const deterministicAssets = assets.map(withExtension);
  const proposedAssets = assets.map(withExtension);
  const outcomes = [];

  for (let index = 0; index < assets.length; index += 1) {
    const id = ids[index];
    const decision = decisionsById.get(id);
    if (!candidates.has(id)) {
      outcomes.push({ asset_id: id, status: 'not_reviewed', reason: 'not_selected_for_gemini_review' });
      continue;
    }
    if (!decision) {
      outcomes.push({ asset_id: id, status: 'needs_human_review', reason: 'gemini_decision_missing' });
      continue;
    }

    const confidence = Number(decision.confidence);
    const familyName = normalizeText(decision.proposed_family_name);
    const variantName = normalizeText(decision.proposed_variant_name);
    const eligible = decision.decision === 'group'
      && ['same_family', 'subfamily'].includes(decision.relation)
      && Number.isFinite(confidence)
      && confidence >= minimumConfidence
      && familyName.length > 0
      && familyName.length <= 128
      && variantName.length > 0
      && variantName.length <= 128;

    if (!eligible) {
      outcomes.push({
        asset_id: id,
        status: 'needs_human_review',
        reason: !decision.proposed_family_name || !decision.proposed_variant_name
          ? 'gemini_proposal_missing_family_or_variant'
          : 'gemini_decision_not_safe_to_apply',
        confidence: Number.isFinite(confidence) ? confidence : 0,
      });
      continue;
    }

    // Never allow Gemini to turn a distinct asset into a duplicate. The names
    // are only advisory grouping labels; all source/hash/format evidence stays.
    proposedAssets[index].metadata = {
      ...proposedAssets[index].metadata,
      family_name: validateProposedLabel(familyName, 'family name'),
      subfamily_name: validateProposedLabel(variantName, 'variant name'),
      status: proposedAssets[index].metadata?.status || 'parsed',
      parser_status: proposedAssets[index].metadata?.parser_status || 'parsed',
    };
    outcomes.push({
      asset_id: id,
      status: 'proposed',
      proposed_family_name: familyName,
      proposed_variant_name: variantName,
      confidence,
      reason: normalizeText(decision.reason).slice(0, 300),
    });
  }

  const deterministic = planVariantGroups(deterministicAssets);
  const proposed = planVariantGroups(proposedAssets);

  return {
    mode: 'gemini_advisory_grouping',
    publishable: false,
    database_writes_performed: false,
    uploads_performed: false,
    deterministic,
    proposed,
    decisions: outcomes,
    summary: {
      input_asset_count: assets.length,
      proposed_decision_count: outcomes.filter((item) => item.status === 'proposed').length,
      review_required_count: outcomes.filter((item) => item.status === 'needs_human_review').length,
      not_reviewed_count: outcomes.filter((item) => item.status === 'not_reviewed').length,
      deterministic_group_count: deterministic.groups.length,
      proposed_group_count: proposed.groups.length,
      deterministic_review_count: deterministic.review.length,
      proposed_review_count: proposed.review.length,
    },
  };
}
