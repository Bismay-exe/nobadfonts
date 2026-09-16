// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { Hono } from 'npm:hono@^4.9.7';
import { cors } from 'npm:hono/cors';
import { McpServer } from 'npm:@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'npm:zod';
import {
  handleGetFont,
  handleSearchFonts,
  handleListFontsMissingMetadata,
  handleVerifyFontSources,
  handleResearchFont,
  handleProposeFontUpdate,
  handleGetFontRevision,
  handleApproveFontRevision,
  handleRejectFontRevision,
  handlePublishFontRevision,
  handleRollbackFontRevision
} from './tools.ts';

const app = new Hono();

// ─── 1. CORS Configuration ────────────────────────────────────────────
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'MCP-Session-Id'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  exposeHeaders: ['MCP-Session-Id'],
}));

// ─── 2. Security & Auth Guard ─────────────────────────────────────────
app.use('*', async (c, next) => {
  // Allow CORS preflight requests without authentication
  if (c.req.method === 'OPTIONS') {
    return next();
  }

  // Validate Origin header if present (defends against DNS rebinding attacks)
  const origin = c.req.header('Origin');
  if (origin && origin !== 'null') {
    const isAllowed =
      /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
      /^https:\/\/([a-z0-9-]+\.)*(supabase\.co|claude\.ai|anthropic\.com|openai\.com|chatgpt\.com)$/.test(origin);

    if (!isAllowed) {
      return c.json({ error: 'Forbidden: Untrusted Origin' }, 403);
    }
  }

  // Check Bearer Token / API Key (supports headers AND query parameters for Claude Web connectors)
  const expectedKey = Deno.env.get('MCP_API_KEY');
  if (expectedKey) {
    const queryToken = c.req.query('key') || c.req.query('token') || c.req.query('api_key');
    const authHeader = c.req.header('Authorization') || c.req.header('x-api-key');
    const headerToken = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
    const token = headerToken || queryToken || '';

    if (!token || token !== expectedKey) {
      return c.json(
        { error: 'Unauthorized: Missing or invalid API key. Pass via Authorization header or ?key= query parameter.' },
        401
      );
    }
  }

  await next();
});

// ─── 3. Initialize MCP Server ─────────────────────────────────────────
const server = new McpServer({
  name: 'nobadfonts-mcp',
  version: '1.0.0',
});

// ─── 3a. Research Instructions Resource ───────────────────────────────
// Embeds the full NoBadFonts font research philosophy (equivalent to the Gemini gem instructions).
// Any AI using this MCP MUST read this resource before generating or proposing font JSON.
const NOBADFONTS_RESEARCH_INSTRUCTIONS = `
==========================================================
NOBADFONTS MCP — AI RESEARCH INSTRUCTIONS
==========================================================

You are a professional typeface researcher and font provenance specialist for NoBadFonts.

Your task when generating or proposing a canonical font JSON is to produce ONE accurate,
evidence-backed JSON object that strictly matches the 7-section canonical schema.

Your PRIMARY OBJECTIVE is ACCURACY, not completeness.

NEVER invent, guess, assume, or fabricate font information.
If a field cannot be reliably verified, return null or [] as appropriate.

==========================================================
SECTION 1 — IDENTIFY THE EXACT TYPEFACE FIRST
==========================================================

Before collecting any metadata, determine exactly which font is being researched.

Use all available clues:
- Font filename
- Embedded OpenType metadata (family name, full name, subfamily, PostScript name, version,
  designer, manufacturer, copyright, license metadata)
- User-provided designer/foundry hints
- Search results from official sources
- Official font pages and repositories

If multiple fonts have similar names, do NOT guess.
Resolve the ambiguity using additional evidence.
If the exact font cannot be confidently identified, say so and do not fabricate the JSON.

==========================================================
SECTION 2 — CRITICAL: OFFICIAL SOURCE VERIFICATION
==========================================================

Official URLs are one of the HIGHEST-PRIORITY fields in this task.

NEVER assume that the first search result is the official website.
NEVER use a font aggregation, font download, font catalog, scraping, mirror,
or third-party listing website as an official URL.

Sites that MUST NOT be used as official_links sources:
- Befonts, DaFont, FontSpace, 1001 Fonts, Fontesk, Free Fonts, FontsHub,
  FontMeme, FontGet, Fontsup, Abstract Fonts, UrbanFonts, Fonts101,
  and any similar font download/aggregation website.

These sites MAY be used as DISCOVERY SOURCES ONLY — to identify the font name,
designer, foundry, or clues toward the real official source.
Their URLs MUST NOT appear in official_website, official_font_page, purchase_url,
free_download_url, github_url, or google_fonts_url unless the site is demonstrably
operated by the font's designer, foundry, publisher, or authorized owner.

A URL is considered OFFICIAL only when there is verified evidence connecting it to:
1. The designer
2. The foundry
3. The publisher
4. The font owner
5. An official project repository

Strong evidence includes:
- The designer's verified website links to the font page.
- The foundry's official website lists the font.
- The publisher's official website lists the font.
- An official GitHub repository identifies the designer/foundry.
- The official font page links to the download or purchase page.
- License/copyright information identifies the same owner.
- Multiple independent authoritative sources point to the same domain.

Do NOT classify a URL as official merely because:
- it appears first in search results
- it has the font name in the URL
- it offers the font for download
- it claims to be the font's creator
- other websites link to it

When no official URL can be verified, return null for that field.
A null value is ALWAYS preferable to an incorrect official URL.

==========================================================
SECTION 3 — SOURCE PRIORITY TIERS
==========================================================

TIER 0 — ACTUAL FONT FILE (highest priority)
When font files are provided, inspect actual embedded metadata first:
family name, full name, subfamily, PostScript name, version, designer,
manufacturer, designer URL, manufacturer URL, copyright, license text,
glyph count, weight, style, OpenType features, Unicode coverage.
IMPORTANT: Embedded font metadata is DETECTED data, not automatic proof of
ownership, foundry, publisher, or release year. Verify against authoritative sources.

TIER 1 — OFFICIAL OWNER / CREATOR (highest web priority)
Official designer website, foundry website, publisher website, official font page,
official designer/foundry storefront, official repositories, official license docs.

TIER 2 — AUTHORIZED DISTRIBUTORS
Fontshare, Google Fonts, Adobe Fonts, MyFonts, other clearly authorized distributors.
A distributor page may serve as official_font_page if it is the authorized distribution point,
but official_website should still point to the actual owner/foundry/designer site.

TIER 3 — REPUTABLE SECONDARY SOURCES
Established typography databases, typography publications, design publications,
reputable articles. Use to cross-check, not to override official sources.

TIER 4 — DISCOVERY SOURCES ONLY (no official URL usage)
Font aggregation, catalog, scraper, mirror, and download websites (see list above).
Use only to discover clues. NEVER use their URLs in official_links.

==========================================================
SECTION 4 — URL FIELD RULES
==========================================================

official_website:
  Must be the primary website of the designer, foundry, publisher, or verified font owner.

official_font_page:
  Must be the specific official page for THIS exact typeface.

purchase_url:
  Must be the legitimate purchase/licensing page operated by the font owner,
  foundry, publisher, or an authorized official retailer.

free_download_url:
  Must be a legitimate page where the font can legally be downloaded for free.
  Does not need to be the same as official_font_page.

github_url:
  Only use when the repository is clearly associated with the actual designer,
  foundry, publisher, or official project.

google_fonts_url:
  Only use if the exact font is actually hosted on Google Fonts.

Do NOT fabricate URLs. Do NOT transform one URL into another because the pattern
looks predictable. URL format: https://domain.com

==========================================================
SECTION 5 — CROSS-CHECKING CRITICAL CLAIMS
==========================================================

The following MUST be independently verified whenever possible:
- Designer, Foundry, Publisher, Original owner
- Release year, License, Commercial-use permission
- Modification permission, Redistribution permission
- Official website, Official font page, Purchase URL, Free download URL

Do not rely on a single low-quality source for these claims.
If sources disagree, investigate the conflict. Prefer the official source.

==========================================================
SECTION 6 — FIELD CONFUSION RULES
==========================================================

manufacturer != foundry
manufacturer != publisher
designer URL != official font page
manufacturer URL != official font page
font creation timestamp != release year
copyright year != necessarily release year
download website != official website
a website selling a font != necessarily the original owner

==========================================================
SECTION 7 — RELEASE YEAR
==========================================================

Only provide release_year when reliable evidence supports it.
Do NOT infer the original release year from:
- OpenType creation timestamp
- File modification date
- Upload date
- Repository commit date

If release year cannot be verified: "release_year": null

==========================================================
SECTION 8 — LICENSE RESEARCH
==========================================================

License information is EXTREMELY IMPORTANT.
distribution_status and license_type are the most critical license fields.

Determine:
- distribution_status: "open_source" | "free" | "demo" | "paid" | "unknown"
- license_type (exact license name, e.g. "SIL Open Font License 1.1")
- license_url (verified official license page URL)
- commercial_use: true | false | null
- personal_use: true | false | null
- modification_allowed: true | false | null
- redistribution_allowed: true | false | null
- license_evidence (brief explanation of what evidence supports the license claim)

Do NOT assume "free download" = "commercially free".
Do NOT assume "open source" = unrestricted use.
Do NOT assume commercial permission unless the actual license explicitly permits it.
If permission cannot be established, return null for that boolean field.

==========================================================
SECTION 9 — DESCRIPTION FIELDS
==========================================================

description:
  A long, expansive, detailed paragraph providing a comprehensive factual overview
  of the typeface's visual style, design characteristics, and notable properties.
  Write from verified information. Do not copy marketing text verbatim.

history:
  Only include historically supported information. Return null if unverifiable.

characteristics:
  Describe actual visual/typographic characteristics supported by reliable sources
  or font inspection. Avoid exaggerated marketing language.

==========================================================
SECTION 10 — CLASSIFICATION
==========================================================

category MUST strictly be one of (NoBadFonts canonical values):
  "sans" | "serif" | "display" | "script" | "slab-serif" | "monospace" | "handwritten"

subcategory provides a more specific classification when supported by evidence.
  Examples: "grotesque", "neo_grotesque", "geometric", "humanist", "transitional",
  "old_style", "didone", "brush", "calligraphic"
  Do not invent a highly specific subcategory without evidence.

style: A short descriptive style label (e.g. "Regular", "Display", "Geometric Sans").

==========================================================
SECTION 11 — TAGS / MOOD / RECOMMENDED USES
==========================================================

Tags MUST be chosen exclusively from this controlled taxonomy:

Classification: sans, serif, slab-serif, display, monospace, script, calligraphy,
  brush, handwritten, signature
Style: modern, classic, minimal, bold, elegant, luxury, playful, comic, graffiti,
  experimental, brutalist, industrial, editorial, geometric, organic, techno, sci-fi
Use Case: branding, logo, headline, poster, editorial-use, corporate, tech, social-media
Weight & Shape: hairline, thin, light, normal-width, heavy, tall, condensed, wide, extended
Construction & Features: inktrap, rounded, square, sharp, stencil, outline, inline, pixel, messy
Era & Vibe: casual, retro, vintage, cyberpunk, futuristic, gothic, y2k

Rules:
- Only include tags that GENUINELY describe this specific typeface.
- Keep selections relevant and restrained — quality over quantity.
- Do NOT include a tag merely because it sounds related.

mood: Array of mood/feeling descriptors (free-form strings, e.g. ["authoritative", "clean"]).
recommended_uses: Array of use case strings (e.g. ["Headlines", "Branding", "Display"]).

==========================================================
SECTION 12 — TECHNICAL DATA
==========================================================

formats: Array of format strings actually present (e.g. ["OTF", "TTF", "WOFF2"]).
weights: Array of weight names from actual variants (e.g. ["Regular", "Bold", "Light"]).
styles: Array of style names from actual variants (e.g. ["Normal", "Italic"]).
glyph_count: Use the actual parsed font glyph count when available. Otherwise null.
languages: Determine supported scripts/languages from actual Unicode coverage.
  Do NOT automatically claim "Latin" simply because the font looks Latin.
opentype_features: Use actual detected OpenType layout features.
  Do NOT invent features merely because they are common.

==========================================================
SECTION 13 — NULL IS BETTER THAN A GUESS (MOST IMPORTANT)
==========================================================

If information cannot be verified: return null.

NEVER:
- guess
- hallucinate
- infer an official URL
- invent a license
- invent an owner
- invent a release year
- invent a purchase page
- invent a GitHub repository

Accuracy is MORE IMPORTANT than filling every field.

==========================================================
SECTION 14 — OUTPUT FORMAT
==========================================================

When generating a proposed canonical JSON:
- Return ONLY valid JSON. No Markdown code fences. No comments. No trailing commas.
- Use double quotes for all keys and string values.
- Use null for unknown scalar values.
- Use [] for unknown arrays.

==========================================================
CANONICAL JSON SCHEMA (7 sections — do not add or remove keys)
==========================================================

{
  "identity": {
    "name": "string",
    "family_name": "string",
    "slug": "string",
    "version": "string (e.g. 1.000)",
    "release_year": "number (e.g. 2024) or null"
  },
  "creator": {
    "designer": "string or null",
    "foundry": "string or null",
    "publisher": "string or null"
  },
  "classification": {
    "category": "sans | serif | display | script | slab-serif | monospace | handwritten",
    "subcategory": "string or null",
    "style": "string or null",
    "tags": ["string from controlled tag taxonomy only"],
    "mood": ["string"],
    "recommended_uses": ["string"]
  },
  "description": {
    "description": "string or null",
    "history": "string or null",
    "characteristics": "string or null"
  },
  "license": {
    "distribution_status": "open_source | free | demo | paid | unknown",
    "license_type": "string or null",
    "license_url": "string (url) or null",
    "commercial_use": "boolean or null",
    "personal_use": "boolean or null",
    "modification_allowed": "boolean or null",
    "redistribution_allowed": "boolean or null",
    "license_evidence": "string or null"
  },
  "official_links": {
    "official_website": "string (url) or null",
    "official_font_page": "string (url) or null",
    "purchase_url": "string (url) or null",
    "free_download_url": "string (url) or null",
    "github_url": "string (url) or null",
    "google_fonts_url": "string (url) or null"
  },
  "technical": {
    "formats": ["OTF", "TTF", "WOFF2"],
    "weights": ["Regular", "Bold"],
    "styles": ["Normal", "Italic"],
    "glyph_count": "number or null",
    "languages": ["string"],
    "opentype_features": ["string"]
  }
}

==========================================================
FINAL VALIDATION CHECKLIST (run mentally before proposing)
==========================================================

1. Is this definitely the correct font?
2. Is the designer supported by evidence?
3. Is the foundry supported by evidence?
4. Is the publisher supported by evidence?
5. Is the release year actually supported (not from file timestamp)?
6. Is the license actually supported by the official source?
7. Are commercial permissions supported by the actual license text?
8. Are all URLs genuine, verified, and relevant?
9. Did I confuse manufacturer with foundry?
10. Did I infer release year from file metadata?
11. Did I invent any missing information?
12. Does the output exactly match the 7-section canonical schema?
13. Did every official URL come from a verified owner, foundry, publisher, or authorized source?
14. Did I accidentally use a font aggregator or download website as an official URL?
15. If I could not verify the official source, did I return null instead of a third-party URL?
16. Does official_font_page belong to THIS exact font (not just a page mentioning it)?
17. Does free_download_url represent a legitimate authorized download (not an unofficial mirror)?
18. Are all tags from the controlled tag taxonomy only?
19. Does category strictly match one of the 7 allowed NoBadFonts categories?
`;

server.resource(
  'nobadfonts-research-instructions',
  'nobadfonts://research-instructions',
  {
    description: 'Full NoBadFonts AI research instructions for generating accurate canonical font JSON. MUST be read and followed by any AI using propose_font_update or generating font metadata. Covers: source verification, official URL rules, source tiers, classification, license research, tags taxonomy, null-over-guess policy, and the canonical 7-section JSON schema.',
    mimeType: 'text/plain'
  },
  async () => ({
    contents: [{
      uri: 'nobadfonts://research-instructions',
      mimeType: 'text/plain',
      text: NOBADFONTS_RESEARCH_INSTRUCTIONS
    }]
  })
);

// ─── 3b. Tool Registrations ────────────────────────────────────────────

// Register Tool 1: get_font
server.tool(
  'get_font',
  `Retrieve the complete canonical font data from the NoBadFonts database.

Returns:
- font_id, name, slug
- canonical_taxonomy_json: the current 7-section canonical JSON (identity, creator, classification, description, license, official_links, technical) — this is the BASE you must use for any proposed updates
- schema_template: the exact JSON schema structure
- allowed_categories: the 7 permitted category values (sans, serif, display, script, slab-serif, monospace, handwritten)
- controlled_tag_vocabulary: all valid tags for the classification section
- research_status and confidence level

IMPORTANT: Always call get_font FIRST before propose_font_update. You must base your proposed changes on the returned canonical_taxonomy_json. Do not add any fields or sections outside the 7 canonical sections. Category must be one of the allowed_categories. Tags must come from controlled_tag_vocabulary only.`,
  {
    slug: z.string().optional().describe('URL slug of the font (e.g. "oreon" or "bring-tha-noize")'),
    id: z.string().optional().describe('UUID of the font in the database')
  },
  async (args) => handleGetFont(args)
);

// Register Tool 2: search_fonts
server.tool(
  'search_fonts',
  `Search the NoBadFonts database by font name, slug, designer, or category.

Use this to find a font's slug or ID when you only know its name, or to discover fonts by a designer before researching them. Returns: id, name, slug, designer, foundry, category, license_type, commercial_use, research_status for each match.`,
  {
    query: z.string().describe('Search query matching font name, slug, designer, or category'),
    limit: z.number().optional().describe('Maximum results to return (1-50, default 10)')
  },
  async (args) => handleSearchFonts(args)
);

// Register Tool 3: list_fonts_missing_metadata
server.tool(
  'list_fonts_missing_metadata',
  `Identify fonts with missing or unverified metadata to prioritize research tasks.

Use this to find fonts that need: verified designer (missing_creator), foundry identification (missing_foundry), license type (missing_license), verified license URL (missing_license_url), official website (missing_official_links), or any of the above (any). Returns a list of fonts with their specific missing metadata flags and current research_status.`,
  {
    filter: z.enum([
      'missing_creator',
      'missing_foundry',
      'missing_license',
      'missing_license_url',
      'missing_official_links',
      'any'
    ]).optional().describe('Filter criterion for missing metadata fields (default: "any")'),
    limit: z.number().optional().describe('Maximum fonts to return (1-50, default 20)')
  },
  async (args) => handleListFontsMissingMetadata(args)
);

// Register Tool 4: verify_font_sources
server.tool(
  'verify_font_sources',
  `Classify discovered URLs into official source tiers before using them in propose_font_update.

Source Tiers:
- Tier 1 (official_repo): GitHub, GitLab, Bitbucket, Codeberg — is_official: true
- Tier 2 (google_fonts / distributor_foundry): fonts.google.com, fontshare.com, adobe fonts, myfonts, etc. — is_official: true
- Tier 3 (designer_portfolio): Behance, Dribbble, portfolio sites — is_official: true (secondary)
- Tier 4 (secondary_aggregator): DaFont, 1001Fonts, Befonts, FontSpace, etc. — is_official: false

CRITICAL: Only URLs with is_official: true may be placed in official_links fields (official_website, official_font_page, purchase_url, free_download_url, github_url, google_fonts_url). Tier 4 aggregator URLs MUST NEVER be used as official sources even if they rank first in search results. Use this tool to validate any URL before including it in a font proposal.`,
  {
    urls: z.array(z.string()).describe('List of website or repository URLs to verify and classify'),
    font_name: z.string().optional().describe('Optional font name for contextual classification')
  },
  async (args) => handleVerifyFontSources(args)
);

// Register Tool 5: research_font
server.tool(
  'research_font',
  `Retrieve all available research data for a font, including verified sources, provenance audit trail, confidence levels, detected conflicts, and the suggested_canonical_taxonomy (pre-merged with research findings, ready to use as a base for propose_font_update).

Returns: linked verified sources with tier classification, provenance audit trail, confidence levels per field, detected data conflicts, missing fields list, and suggested_canonical_taxonomy.

Optionally set trigger_deep_research: true to queue the background AI research pipeline if research is incomplete or stale.

RECOMMENDED WORKFLOW:
1. get_font → see current canonical state
2. research_font → retrieve evidence and suggested_canonical_taxonomy
3. verify_font_sources → validate all new URLs you discover
4. propose_font_update → submit only verified, evidence-backed changes`,
  {
    slug: z.string().optional().describe('URL slug of the font (e.g. "oreon" or "bring-tha-noize")'),
    id: z.string().optional().describe('UUID of the font in the database'),
    trigger_deep_research: z.boolean().optional().describe('If true and research is incomplete, queues and dispatches the background AI research pipeline')
  },
  async (args) => handleResearchFont(args)
);

// Register Tool 6: propose_font_update
server.tool(
  'propose_font_update',
  `Propose structured, evidence-backed metadata updates for a font into the font_revisions staging pipeline (status: "pending_review").

====== CRITICAL REQUIREMENTS — READ BEFORE CALLING ======

ACCURACY FIRST: Your primary objective is ACCURACY, not completeness. NEVER invent, guess, or fabricate font information. If a field cannot be reliably verified: use null, never a guess.

SCHEMA COMPLIANCE (NON-NEGOTIABLE):
- Base your proposal on canonical_taxonomy_json from get_font.
- Modifications must be strictly within the 7 canonical sections: identity, creator, classification, description, license, official_links, technical.
- Do NOT add keys, fields, or sections outside this schema template.
- category must be one of: sans | serif | display | script | slab-serif | monospace | handwritten
- tags must come exclusively from the controlled tag taxonomy (see nobadfonts-research-instructions resource).

OFFICIAL URLs ONLY:
- All URLs in official_links must pass verify_font_sources with is_official: true.
- NEVER place aggregator/mirror URLs (DaFont, Befonts, 1001Fonts, FontSpace, etc.) in any official_links field.

LICENSE EVIDENCE:
- All license claims must be supported by the actual license text or official license page.
- Do not assume "free download" = commercial use allowed.
- If commercial_use/personal_use/modification_allowed/redistribution_allowed cannot be verified from the actual license, set to null.

RELEASE YEAR: Only provide when supported by official source evidence. Do NOT infer from file timestamps, upload dates, or commit dates.

DESCRIPTION: Write from verified information. A long, detailed, factual paragraph. Do not copy marketing text verbatim.

SOURCES (provenance): Provide field-level provenance in the sources array: { field, url, source_type, confidence, evidence }.

====== RECOMMENDED WORKFLOW ======
1. get_font → retrieve canonical base
2. research_font → get evidence and suggested_canonical_taxonomy
3. verify_font_sources → validate all URLs
4. propose_font_update → submit verified, evidence-backed changes only`,
  {
    slug: z.string().optional().describe('URL slug of the font to update (e.g. "oreon" or "bring-tha-noize")'),
    id: z.string().optional().describe('UUID of the font in the database'),
    changes: z.record(z.any()).describe('Proposed modifications strictly within the 7 canonical schema sections: identity, creator, classification, description, license, official_links, technical. Base on get_font canonical_taxonomy_json. Do not add keys outside the schema template.'),
    sources: z.any().optional().describe('Field-level provenance array ({ field, url, source_type, confidence, evidence }) — required for official_links and license fields'),
    rationale: z.string().optional().describe('Evidence-backed explanation of why these changes are proposed and what sources support them'),
    client_hint: z.string().optional().describe('Optional caller environment identifier (informational only)')
  },
  async (args) => handleProposeFontUpdate(args)
);

// Register Tool 7: get_font_revision
server.tool(
  'get_font_revision',
  `Retrieve staged revision details, before-and-after diffs, validation status, field-level provenance, and concurrency staleness check against the current live font taxonomy.

Use this to inspect a pending revision before approving or rejecting it, check if a revision is stale (live state has changed since revision was created), or review exactly what fields were changed and why.`,
  {
    revision_id: z.string().optional().describe('UUID of the specific revision to inspect'),
    slug: z.string().optional().describe('Font slug to find recent revisions for'),
    id: z.string().optional().describe('Font UUID to find recent revisions for'),
    status: z.enum(['pending_review', 'draft', 'approved', 'published', 'rejected', 'superseded']).optional().describe('Optional status filter')
  },
  async (args) => handleGetFontRevision(args)
);

// Register Tool 8: approve_font_revision
server.tool(
  'approve_font_revision',
  `Enforce the formal approval gate: transition a revision from "pending_review" to "approved". Required prerequisite before publish_font_revision can be executed. Reviewer identity is server-enforced and recorded in audit logs.

Only approve revisions that:
- Are based on verified, evidence-backed sources (not aggregator sites)
- Comply with the 7-section canonical schema with no extra keys
- Have a category from the 7 allowed values
- Have tags exclusively from the controlled tag taxonomy
- Have accurate license information supported by the actual license
- Have official_links URLs verified as is_official: true`,
  {
    revision_id: z.string().describe('UUID of the revision in pending_review status to approve'),
    notes: z.string().optional().describe('Optional approval rationale or reviewer verification notes')
  },
  async (args) => handleApproveFontRevision(args)
);

// Register Tool 9: reject_font_revision
server.tool(
  'reject_font_revision',
  `Formally decline an inaccurate or invalid proposal with a required rejection reason. Transitions revision to "rejected" status and logs event to audit_logs.

Use this when the proposal contains invented/unverified information, uses aggregator URLs as official sources, has a category not in the allowed values, has tags outside the controlled taxonomy, claims license permissions not supported by the actual license, or violates the canonical 7-section schema.`,
  {
    revision_id: z.string().describe('UUID of the revision to reject'),
    rejection_reason: z.string().describe('Explicit, specific explanation of why this revision was rejected (reference which fields are wrong and why)')
  },
  async (args) => handleRejectFontRevision(args)
);

// Register Tool 10: publish_font_revision
server.tool(
  'publish_font_revision',
  `Transition an approved revision into production canonical storage in an atomic Postgres transaction.

Atomically: updates fonts table, updates font_research, upserts font_sources (additive), sets revision status to "published" with after_state_hash, supersedes competing pending revisions, and writes to audit_logs.

Strict enforcements:
1. Revision status MUST be "approved" (approve_font_revision must be called first).
2. Live canonical state hash MUST match base_state_hash — no force bypass. If the hash check fails, the live data has changed since the revision was created. You must get_font again, re-evaluate changes, and create a fresh revision.`,
  {
    revision_id: z.string().describe('UUID of the approved revision to publish to production'),
    reason: z.string().optional().describe('Publication reason or release notes for audit logging')
  },
  async (args) => handlePublishFontRevision(args)
);

// Register Tool 11: rollback_font_revision
server.tool(
  'rollback_font_revision',
  `Restore the complete before_state snapshot across all affected tables (fonts, font_research, font_sources) for a previously published revision.

Concurrency protection: verifies the current live state matches after_state_hash before allowing rollback, ensuring newer subsequent edits are NEVER clobbered. If the hash check fails, a more recent edit has occurred and rollback is blocked to protect data integrity.`,
  {
    revision_id: z.string().describe('UUID of the published revision to rollback'),
    reason: z.string().describe('Required explanation of why this published revision is being rolled back')
  },
  async (args) => handleRollbackFontRevision(args)
);

// ─── 4. Connect Transport & Serve ─────────────────────────────────────
// Stateless mode for Edge Functions
const transport = new WebStandardStreamableHTTPServerTransport({
  sessionIdGenerator: undefined
});

await server.connect(transport);

// Route all incoming requests to the transport handler
app.all('*', async (c) => {
  return await transport.handleRequest(c.req.raw);
});

Deno.serve(app.fetch);
