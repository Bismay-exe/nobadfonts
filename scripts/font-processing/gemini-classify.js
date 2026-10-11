import { normalizeOverride } from './core.js';

const GEMINI_MODEL = process.env.GEMINI_FONT_MODEL || 'gemini-3.6-flash';
const GEMINI_ENDPOINT = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

const PROMPT_HEADER = `You are a typography classification assistant. You are given the font files found
inside one uploaded font release. Each file lists the names embedded in its OpenType
name table. Group them into the correct hierarchy:

- "parent_family": the overall family name when the release contains multiple named
  sub-families (e.g. "Monaspace" with sub-families "Xenon", "Radon", "Neon"). Use null
  when every file belongs to a single family with no sub-families.
- For every file return: its exact "sha256" (copied from the input), the "family"
  (the parent family name, or the standalone family when there are no sub-families),
  "sub_family" (the named sub-family, or null when standalone), and "variant" (the
  human style label such as "Regular", "Bold", "Bold Italic", "Light").

Rules:
- Only create sub-families when the release genuinely has them. Never invent sub-families.
- Preserve the designer's unusual sub-family and variant names exactly; do not rename
  "Terminal" to "Mono" or collapse distinct variants together.
- Return STRICT JSON only, no prose, matching:
  {"parent_family": string|null, "fonts": [{"sha256": string, "family": string,
  "sub_family": string|null, "variant": string}]}
`;

function buildPromptAssets(assets) {
  return assets.map((asset) => {
    const meta = asset.metadata || {};
    return {
      sha256: asset.sha256,
      filename: asset.filename ?? asset.relative_path ?? null,
      embedded_family: meta.family_name ?? meta.familyName ?? null,
      embedded_subfamily: meta.subfamily_name ?? meta.subfamilyName ?? null,
      embedded_full_name: meta.full_name ?? meta.fullName ?? null,
      weight_class: meta.weight_class ?? meta.weightClass ?? null,
      is_italic: meta.is_italic ?? meta.isItalic ?? null,
    };
  });
}

export function parseGeminiJson(text) {
  if (typeof text !== 'string') return null;
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Turn a validated Gemini response into a Map of sha256 -> normalized override
 * ({family, sub_family, variant}) that core.js resolveFamilyNames understands.
 * Any entry whose sha256 is not in `knownHashes`, or whose override is empty, is
 * dropped so the deterministic metadata path decides for that file instead.
 */
export function overridesFromResponse(parsed, knownHashes) {
  const overrides = new Map();
  if (!parsed || !Array.isArray(parsed.fonts)) return overrides;
  const known = knownHashes instanceof Set ? knownHashes : new Set(knownHashes || []);
  const parent = typeof parsed.parent_family === 'string' && parsed.parent_family.trim()
    ? parsed.parent_family.trim() : null;
  for (const entry of parsed.fonts) {
    const sha = typeof entry?.sha256 === 'string' ? entry.sha256.toLowerCase() : null;
    if (!sha || !known.has(sha)) continue;
    const subFamily = typeof entry.sub_family === 'string' ? entry.sub_family : null;
    // A sub-family needs a parent family to nest under; fall back to the
    // release-level parent_family when the row omits an explicit family.
    const family = (typeof entry.family === 'string' && entry.family.trim())
      ? entry.family : (subFamily ? parent : null);
    const override = normalizeOverride({ family, sub_family: subFamily, variant: entry.variant });
    if (override) overrides.set(sha, override);
  }
  return overrides;
}

async function callGemini(assets, { apiKey, model, fetchImpl }) {
  const body = {
    contents: [{
      role: 'user',
      parts: [{ text: `${PROMPT_HEADER}\nFILES:\n${JSON.stringify(buildPromptAssets(assets), null, 2)}` }],
    }],
    generationConfig: { temperature: 0, responseMimeType: 'application/json' },
  };
  const doFetch = fetchImpl || fetch;
  const response = await doFetch(GEMINI_ENDPOINT(model, apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Gemini HTTP ${response.status}: ${detail.slice(0, 300)}`);
  }
  const data = await response.json();
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => part?.text || '').join('');
  return text;
}

/**
 * Classify font assets into family / sub-family / variant using Gemini, returning
 * a Map of sha256 -> override. Never throws for operational reasons: a missing API
 * key, a failed call, or unparseable output all yield an empty Map so the caller
 * falls back to deterministic OpenType metadata. The classifier is advisory input
 * to core.js, never an authority that can block the pipeline.
 */
export async function classifyAssets(assets, options = {}) {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey || !Array.isArray(assets) || !assets.length) return new Map();
  const known = new Set(assets.map((asset) => String(asset.sha256).toLowerCase()));
  try {
    const text = await callGemini(assets, {
      apiKey,
      model: options.model || GEMINI_MODEL,
      fetchImpl: options.fetchImpl,
    });
    const parsed = parseGeminiJson(text);
    return overridesFromResponse(parsed, known);
  } catch (error) {
    if (options.onError) options.onError(error);
    return new Map();
  }
}
