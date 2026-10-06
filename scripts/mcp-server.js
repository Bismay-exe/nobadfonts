#!/usr/bin/env node

/**
 * NoBadFonts Local MCP Server (Stdio Transport)
 * Standard JSON-RPC 2.0 implementation over stdin/stdout.
 * Compatible with Claude Desktop, Claude Code CLI, Antigravity IDE, Cursor, Codex, Windsurf.
 * Zero external npm dependencies required — uses Node.js standard library and native fetch.
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ─── 1. Load Environment Variables ──────────────────────────────────────────

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const localEnv = {
  ...loadEnvFile(path.join(projectRoot, '.env')),
  ...loadEnvFile(path.join(projectRoot, '.env.local')),
  ...loadEnvFile(path.join(projectRoot, 'nobadfonts-cli', '.env')),
  ...process.env
};

const SUPABASE_URL = localEnv.SUPABASE_URL || localEnv.VITE_SUPABASE_URL || 'https://wcegdxhvgwbeskaidlxr.supabase.co';
const SUPABASE_KEY = localEnv.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SECRET_KEY || localEnv.SUPABASE_ANON_KEY || localEnv.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_KEY) {
  process.stderr.write('[nobadfonts-mcp] Warning: No SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY found in environment or .env.local.\n');
}

// ─── 2. Helpers & Normalization ─────────────────────────────────────────────

const ALLOWED_CATEGORIES = ['sans', 'serif', 'display', 'script', 'slab-serif', 'monospace', 'handwritten'];
const CATEGORY_ALIASES = {
  'mono': 'monospace',
  'sans-serif': 'sans',
  'slab': 'slab-serif',
  'handwriting': 'handwritten',
  'calligraphy': 'script',
  'brush': 'script',
  'signature': 'script'
};

const VALID_ROOT_SECTIONS = ['identity', 'creator', 'classification', 'description', 'license', 'official_links', 'technical'];

export function cleanUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let url = rawUrl.trim();
  if (!url || url.toLowerCase() === 'null' || url.toLowerCase() === 'undefined' || url.toLowerCase() === 'n/a') return null;

  const mdMatch = url.match(/\[.*?\]\((https?:\/\/[^\s\)]+|[^\s\)]+)\)/);
  if (mdMatch) url = mdMatch[1].trim();

  url = url.replace(/^[<(\["'`]+|[>)\]"'`]+$/g, '').trim();
  url = url.replace(/[),;.]+$/, '').trim();
  if (!url) return null;

  if (!/^https?:\/\//i.test(url)) {
    url = url.startsWith('//') ? `https:${url}` : `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function buildCanonicalTaxonomy(font, research) {
  const extracted = research?.font_metadata_extracted || {};
  const existingTax = font?.taxonomy || extracted?.taxonomy || {};

  const dynamicFormats = existingTax.technical?.formats || [];
  if (dynamicFormats.length === 0 && font.font_variants && font.font_variants.length > 0) {
    const detected = new Set();
    font.font_variants.forEach(v => {
      if (v.woff2_url) detected.add('WOFF2');
      if (v.woff_url) detected.add('WOFF');
      if (v.otf_url) detected.add('OTF');
      if (v.ttf_url) detected.add('TTF');
    });
    if (detected.size > 0) dynamicFormats.push(...Array.from(detected));
  }

  // Extract weights from variants if present
  const dynamicWeights = existingTax.technical?.weights || [];
  if (dynamicWeights.length === 0 && font.font_variants && font.font_variants.length > 0) {
    const weights = Array.from(new Set(font.font_variants.map(v => v.variant_name).filter(Boolean)));
    if (weights.length > 0) dynamicWeights.push(...weights);
  }

  // Do not fake formats or weights if none exist
  let rawCategory = (existingTax.classification?.category || font.category || 'display').toLowerCase().trim();
  if (CATEGORY_ALIASES[rawCategory]) rawCategory = CATEGORY_ALIASES[rawCategory];
  const safeCategory = ALLOWED_CATEGORIES.includes(rawCategory) ? rawCategory : 'display';

  const rawTags = existingTax.classification?.tags || font.tags || [];
  const safeTags = Array.isArray(rawTags)
    ? rawTags.map(t => String(t).toLowerCase().trim()).filter(Boolean)
    : [];

  return {
    identity: {
      name: existingTax.identity?.name || font.name || '',
      family_name: existingTax.identity?.family_name || font.name || '',
      slug: font.slug || '',
      version: existingTax.identity?.version || extracted.version || null,
      release_year: (existingTax.identity?.release_year !== undefined && existingTax.identity?.release_year !== null && existingTax.identity?.release_year !== '')
        ? Number(existingTax.identity.release_year)
        : null
    },
    creator: {
      designer: existingTax.creator?.designer || font.designer || null,
      foundry: existingTax.creator?.foundry || research?.foundry || null,
      publisher: existingTax.creator?.publisher || null
    },
    classification: {
      category: safeCategory,
      subcategory: existingTax.classification?.subcategory || null,
      style: existingTax.classification?.style || (safeTags[0] || null),
      tags: safeTags,
      mood: Array.isArray(existingTax.classification?.mood) ? existingTax.classification.mood : [],
      recommended_uses: Array.isArray(existingTax.classification?.recommended_uses)
        ? existingTax.classification.recommended_uses
        : []
    },
    description: {
      description: existingTax.description?.description || research?.ai_description || font.description || null,
      history: existingTax.description?.history || null,
      characteristics: existingTax.description?.characteristics || null
    },
    license: {
      distribution_status: existingTax.license?.distribution_status || (font.commercial_use ? 'open_source' : (font.commercial_use === false ? 'free' : 'unknown')),
      license_type: existingTax.license?.license_type || research?.license_type_verified || font.license_type || null,
      license_url: cleanUrl(existingTax.license?.license_url || research?.license_url),
      commercial_use: existingTax.license?.commercial_use ?? (font.commercial_use ?? null),
      personal_use: existingTax.license?.personal_use ?? true,
      modification_allowed: existingTax.license?.modification_allowed ?? null,
      redistribution_allowed: existingTax.license?.redistribution_allowed ?? null,
      license_evidence: existingTax.license?.license_evidence || research?.license_evidence || null
    },
    official_links: {
      official_website: cleanUrl(existingTax.official_links?.official_website || research?.official_website),
      official_font_page: cleanUrl(existingTax.official_links?.official_font_page || research?.official_font_page),
      purchase_url: cleanUrl(existingTax.official_links?.purchase_url || research?.purchase_url),
      free_download_url: cleanUrl(existingTax.official_links?.free_download_url || research?.free_download_url),
      github_url: cleanUrl(existingTax.official_links?.github_url || font.github_url),
      google_fonts_url: cleanUrl(existingTax.official_links?.google_fonts_url)
    },
    technical: {
      formats: dynamicFormats,
      weights: dynamicWeights,
      styles: Array.isArray(existingTax.technical?.styles) ? existingTax.technical.styles : [],
      glyph_count: (existingTax.technical?.glyph_count !== undefined && existingTax.technical?.glyph_count !== null && existingTax.technical?.glyph_count !== '')
        ? Number(existingTax.technical.glyph_count)
        : ((extracted.glyph_count !== undefined && extracted.glyph_count !== null)
          ? Number(extracted.glyph_count)
          : ((font.glyph_count !== undefined && font.glyph_count !== null)
            ? Number(font.glyph_count)
            : null)),
      languages: Array.isArray(existingTax.technical?.languages)
        ? existingTax.technical.languages
        : (extracted.detected_languages || []),
      opentype_features: Array.isArray(existingTax.technical?.opentype_features)
        ? existingTax.technical.opentype_features
        : (extracted.opentype_features || [])
    }
  };
}

// ─── 3. Supabase REST API Client ───────────────────────────────────────────

async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Supabase error [${res.status}]: ${errorText}`);
  }

  // Handle 204 No Content
  if (res.status === 204) return null;
  return await res.json();
}

// ─── 4. Tool Handlers ──────────────────────────────────────────────────────

async function handleGetAllFontsFields(args) {
  const limit = Math.min(Math.max(args.limit ?? 25, 1), 100);
  const offset = Math.max(args.offset ?? 0, 0);
  const format = args.format || 'nested';
  const filter = args.filter || 'all';

  let query = `fonts?select=*,font_variants(*),font_research(*)&order=name.asc&limit=${limit}&offset=${offset}`;
  if (args.category) {
    query += `&category=eq.${encodeURIComponent(args.category.toLowerCase().trim())}`;
  }

  const rawFonts = await supabaseFetch(query, {
    headers: { 'Prefer': 'count=exact' }
  });

  const results = [];

  for (const font of rawFonts || []) {
    const research = Array.isArray(font.font_research) ? font.font_research[0] : font.font_research;
    const taxonomy = buildCanonicalTaxonomy(font, research);

    if (filter === 'missing_metadata') {
      const isMissingCreator = !taxonomy.creator?.designer && !font.designer;
      const isMissingFoundry = !taxonomy.creator?.foundry && !research?.foundry;
      const isMissingLicense = !taxonomy.license?.license_type && !font.license_type;
      const isMissingWebsite = !taxonomy.official_links?.official_website && !research?.official_website;
      const isMissingGithub = !taxonomy.official_links?.github_url;
      const isMissingDescription = !taxonomy.description?.description && !font.description;

      if (!isMissingCreator && !isMissingFoundry && !isMissingLicense && !isMissingWebsite && !isMissingGithub && !isMissingDescription) {
        continue;
      }
    }

    const fontOutput = {
      id: font.id,
      name: font.name,
      slug: font.slug,
      category: font.category,
      updated_at: font.updated_at
    };

    if (format === 'flat') {
      const flatFields = {};
      const targetSections = args.sections && args.sections.length > 0 ? args.sections : Object.keys(taxonomy);

      for (const sec of targetSections) {
        const secObj = taxonomy[sec] || {};
        for (const [k, v] of Object.entries(secObj)) {
          const dotKey = `${sec}.${k}`;
          if (!args.fields || args.fields.includes(dotKey)) {
            flatFields[dotKey] = v;
          }
        }
      }
      fontOutput.fields = flatFields;
    } else {
      if (args.sections && args.sections.length > 0) {
        const filteredTax = {};
        for (const sec of args.sections) {
          filteredTax[sec] = taxonomy[sec] ?? null;
        }
        fontOutput.taxonomy = filteredTax;
      } else {
        fontOutput.taxonomy = taxonomy;
      }
    }

    results.push(fontOutput);
  }

  return {
    count: results.length,
    offset,
    limit,
    filter,
    format,
    fonts: results
  };
}

async function handleGetFontFields(args) {
  if (!args.slug && !args.id) {
    throw new Error('Either "slug" or "id" must be provided.');
  }

  let endpoint = 'fonts?select=*,font_variants(*),font_research(*)&limit=1';
  if (args.id) {
    endpoint += `&id=eq.${encodeURIComponent(args.id)}`;
  } else {
    endpoint += `&slug=eq.${encodeURIComponent(args.slug.toLowerCase().trim())}`;
  }

  const fonts = await supabaseFetch(endpoint);
  if (!fonts || fonts.length === 0) {
    throw new Error(`Font not found: ${args.slug || args.id}`);
  }

  const font = fonts[0];
  const research = Array.isArray(font.font_research) ? font.font_research[0] : font.font_research;
  const taxonomy = buildCanonicalTaxonomy(font, research);

  const fieldsCatalog = [];
  for (const [section, secObj] of Object.entries(taxonomy)) {
    if (secObj && typeof secObj === 'object') {
      for (const [key, val] of Object.entries(secObj)) {
        const isNullOrEmpty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0);
        fieldsCatalog.push({
          path: `${section}.${key}`,
          section,
          key,
          value: val,
          is_empty: isNullOrEmpty
        });
      }
    }
  }

  return {
    font_id: font.id,
    name: font.name,
    slug: font.slug,
    category: font.category,
    total_fields: fieldsCatalog.length,
    populated_count: fieldsCatalog.filter(f => !f.is_empty).length,
    empty_count: fieldsCatalog.filter(f => f.is_empty).length,
    fields: fieldsCatalog
  };
}

async function handleGetFont(args) {
  if (!args.slug && !args.id) {
    throw new Error('Either "slug" or "id" must be provided.');
  }

  let endpoint = 'fonts?select=*,font_variants(*),font_research(*)&limit=1';
  if (args.id) {
    endpoint += `&id=eq.${encodeURIComponent(args.id)}`;
  } else {
    endpoint += `&slug=eq.${encodeURIComponent(args.slug.toLowerCase().trim())}`;
  }

  const fonts = await supabaseFetch(endpoint);
  if (!fonts || fonts.length === 0) {
    throw new Error(`Font not found: ${args.slug || args.id}`);
  }

  const font = fonts[0];
  const research = Array.isArray(font.font_research) ? font.font_research[0] : font.font_research;
  const taxonomy = buildCanonicalTaxonomy(font, research);

  return {
    font_id: font.id,
    name: font.name,
    slug: font.slug,
    category: font.category,
    status: font.status,
    canonical_taxonomy_json: taxonomy,
    variants: (font.font_variants || []).map(v => ({
      variant_name: v.variant_name,
      woff2_url: v.woff2_url,
      otf_url: v.otf_url,
      ttf_url: v.ttf_url
    }))
  };
}

async function handleUpdateFontJson(args) {
  if (!args.slug && !args.id) {
    throw new Error('Either "slug" or "id" must be provided.');
  }
  if (!args.json || typeof args.json !== 'object' || Object.keys(args.json).length === 0) {
    throw new Error('"json" must be a non-empty canonical JSON object.');
  }

  let endpoint = 'fonts?select=*,font_variants(*),font_research(*)&limit=1';
  if (args.id) {
    endpoint += `&id=eq.${encodeURIComponent(args.id)}`;
  } else {
    endpoint += `&slug=eq.${encodeURIComponent(args.slug.toLowerCase().trim())}`;
  }

  const fonts = await supabaseFetch(endpoint);
  if (!fonts || fonts.length === 0) {
    return {
      isError: true,
      error_type: 'NOT_FOUND',
      message: `Font not found for identifier: "${args.slug || args.id}"`,
      suggested_retry: { action: 'use get_all_fonts_fields to verify the slug' }
    };
  }

  const font = fonts[0];
  const research = Array.isArray(font.font_research) ? font.font_research[0] : font.font_research;
  const currentTax = buildCanonicalTaxonomy(font, research);

  const incomingKeys = Object.keys(args.json);
  const invalidKeys = incomingKeys.filter(k => !VALID_ROOT_SECTIONS.includes(k));
  if (invalidKeys.length > 0) {
    return {
      isError: true,
      error_type: 'INVALID_SCHEMA_KEYS',
      message: `Unrecognized top-level sections: ${invalidKeys.join(', ')}. Use canonical sections: ${VALID_ROOT_SECTIONS.join(', ')}`,
      retry_payload: {
        slug: font.slug,
        json: Object.fromEntries(Object.entries(args.json).filter(([k]) => VALID_ROOT_SECTIONS.includes(k)))
      }
    };
  }

  const mergedTax = JSON.parse(JSON.stringify(currentTax));
  const strategy = args.merge_strategy || 'smart';
  const changedFields = [];

  for (const section of VALID_ROOT_SECTIONS) {
    if (!args.json[section] || typeof args.json[section] !== 'object') continue;
    const incomingSection = args.json[section];
    if (!mergedTax[section]) mergedTax[section] = {};

    for (const [field, rawVal] of Object.entries(incomingSection)) {
      let val = rawVal;

      if (
        (section === 'official_links' && ['official_website', 'official_font_page', 'purchase_url', 'free_download_url', 'github_url', 'google_fonts_url'].includes(field)) ||
        (section === 'license' && field === 'license_url')
      ) {
        if (typeof val === 'string' && val.trim().length > 0) val = cleanUrl(val);
      }

      if (section === 'classification' && field === 'category' && typeof val === 'string') {
        const normCat = val.toLowerCase().trim();
        const mappedCat = CATEGORY_ALIASES[normCat] || normCat;
        if (!ALLOWED_CATEGORIES.includes(mappedCat)) {
          return {
            isError: true,
            error_type: 'INVALID_CATEGORY',
            message: `Category "${val}" is not allowed. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
            retry_payload: {
              slug: font.slug,
              json: { ...args.json, classification: { ...args.json.classification, category: 'display' } }
            }
          };
        }
        val = mappedCat;
      }

      if (section === 'classification' && field === 'tags' && Array.isArray(val)) {
        val = val.map(t => String(t).toLowerCase().trim()).filter(Boolean);
      }

      if (section === 'identity' && field === 'release_year' && val !== null && val !== undefined) {
        const num = Number(val);
        val = isNaN(num) ? null : num;
      }

      const currentVal = mergedTax[section][field];
      const isCurrentEmpty = currentVal === null || currentVal === undefined || currentVal === '' || (Array.isArray(currentVal) && currentVal.length === 0);

      let shouldApply = false;
      if (strategy === 'force_overwrite') shouldApply = true;
      else if (strategy === 'fill_missing') shouldApply = isCurrentEmpty && (val !== null && val !== undefined && val !== '');
      else shouldApply = val !== undefined && JSON.stringify(val) !== JSON.stringify(currentVal);

      if (shouldApply) {
        mergedTax[section][field] = val;
        changedFields.push(`${section}.${field}`);
      }
    }
  }

  const fontUpdates = {
    taxonomy: mergedTax,
    updated_at: new Date().toISOString()
  };

  if (mergedTax.identity?.name) fontUpdates.name = mergedTax.identity.name;
  if (mergedTax.creator?.designer) fontUpdates.designer = mergedTax.creator.designer;
  if (mergedTax.classification?.category) fontUpdates.category = mergedTax.classification.category;
  if (mergedTax.classification?.tags) fontUpdates.tags = mergedTax.classification.tags;
  if (mergedTax.description?.description) fontUpdates.description = mergedTax.description.description;
  if (mergedTax.license?.license_type) fontUpdates.license_type = mergedTax.license.license_type;
  if (typeof mergedTax.license?.commercial_use === 'boolean') fontUpdates.commercial_use = mergedTax.license.commercial_use;
  if (mergedTax.technical?.glyph_count) fontUpdates.glyph_count = mergedTax.technical.glyph_count;

  await supabaseFetch(`fonts?id=eq.${font.id}`, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify(fontUpdates)
  });

  if (mergedTax.official_links || mergedTax.license) {
    const researchUpdates = {};
    if (mergedTax.official_links?.official_website) researchUpdates.official_website = mergedTax.official_links.official_website;
    if (mergedTax.official_links?.official_font_page) researchUpdates.official_font_page = mergedTax.official_links.official_font_page;
    if (mergedTax.official_links?.purchase_url) researchUpdates.purchase_url = mergedTax.official_links.purchase_url;
    if (mergedTax.official_links?.free_download_url) researchUpdates.free_download_url = mergedTax.official_links.free_download_url;
    if (mergedTax.official_links?.github_url) researchUpdates.github_url = mergedTax.official_links.github_url;
    if (mergedTax.license?.license_url) researchUpdates.license_url = mergedTax.license.license_url;
    if (mergedTax.license?.license_evidence) researchUpdates.license_evidence = mergedTax.license.license_evidence;

    if (Object.keys(researchUpdates).length > 0) {
      if (research?.id) {
        await supabaseFetch(`font_research?id=eq.${research.id}`, {
          method: 'PATCH',
          body: JSON.stringify(researchUpdates)
        }).catch(() => {});
      } else {
        await supabaseFetch('font_research', {
          method: 'POST',
          body: JSON.stringify({ font_id: font.id, ...researchUpdates })
        }).catch(() => {});
      }
    }
  }

  // Audit log (non-blocking)
  supabaseFetch('audit_logs', {
    method: 'POST',
    body: JSON.stringify({
      action: 'direct_font_json_update',
      font_id: font.id,
      changed_fields: changedFields,
      before_state: currentTax,
      after_state: mergedTax,
      reason: args.rationale || 'Direct JSON update via Local MCP',
      performed_by: 'mcp-local'
    })
  }).catch(() => {});

  // Immediate read-after-write verification
  const verified = await supabaseFetch(`fonts?id=eq.${font.id}&select=*,font_variants(*),font_research(*)&limit=1`);
  const verifiedFont = verified?.[0] || font;
  const verifiedResearch = Array.isArray(verifiedFont?.font_research) ? verifiedFont?.font_research[0] : verifiedFont?.font_research;
  const verifiedTax = buildCanonicalTaxonomy(verifiedFont, verifiedResearch);

  return {
    success: true,
    verified_in_db: true,
    font_id: font.id,
    slug: font.slug,
    name: fontUpdates.name || font.name,
    changed_fields: changedFields,
    persisted_taxonomy: verifiedTax,
    message: `✨ Successfully updated and verified "${font.name}" (${font.slug}). ${changedFields.length} fields modified.`
  };
}

async function handleUpdateMultipleFontsJson(args) {
  if (!args.fonts || !Array.isArray(args.fonts) || args.fonts.length === 0) {
    throw new Error('"fonts" array must contain at least 1 font payload.');
  }

  const results = [];
  let succeeded = 0;
  let failed = 0;

  for (const item of args.fonts) {
    try {
      const res = await handleUpdateFontJson({
        slug: item.slug,
        id: item.id,
        json: item.json,
        merge_strategy: args.merge_strategy,
        rationale: item.rationale
      });

      if (res.isError) {
        failed++;
        results.push({ identifier: item.slug || item.id, status: 'failed', error: res });
        if (args.stop_on_error) break;
      } else {
        succeeded++;
        results.push({ slug: res.slug, font_id: res.font_id, status: 'updated', changed_fields: res.changed_fields });
      }
    } catch (err) {
      failed++;
      results.push({ identifier: item.slug || item.id, status: 'failed', error: err.message });
      if (args.stop_on_error) break;
    }
  }

  return {
    total: args.fonts.length,
    succeeded,
    failed,
    results
  };
}

// ─── 5. Tool Definitions for MCP Registry ───────────────────────────────────

const TOOLS = [
  {
    name: 'get_all_fonts_fields',
    description: 'Browse and inspect all fonts in the database with their existing metadata fields exposed separately. Supports filtering by section, fields, category, or missing_metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        sections: { type: 'array', items: { type: 'string' }, description: 'Sections to include (identity, creator, classification, description, license, official_links, technical)' },
        fields: { type: 'array', items: { type: 'string' }, description: 'Dot-notation fields (e.g. license.license_type, official_links.github_url)' },
        filter: { type: 'string', enum: ['all', 'missing_metadata'], description: 'Filter: all or missing_metadata' },
        category: { type: 'string', description: 'Filter by category' },
        limit: { type: 'number', description: 'Limit (1-100, default 25)' },
        offset: { type: 'number', description: 'Offset for pagination' },
        format: { type: 'string', enum: ['nested', 'flat'], description: 'Format: nested or flat' }
      }
    }
  },
  {
    name: 'get_font_fields',
    description: 'Retrieve all individual fields of a specific font separately with value and empty/populated status.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'URL slug of the font' },
        id: { type: 'string', description: 'UUID of the font' }
      }
    }
  },
  {
    name: 'update_font_json',
    description: 'Directly write generated canonical font JSON to the Supabase database without requiring manual approval. Synchronizes taxonomy JSONB and core columns.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Font slug' },
        id: { type: 'string', description: 'Font UUID' },
        json: { type: 'object', description: 'Canonical font JSON within the 7 canonical sections' },
        merge_strategy: { type: 'string', enum: ['smart', 'fill_missing', 'force_overwrite'], description: 'Merge strategy (default: smart)' },
        rationale: { type: 'string', description: 'Audit rationale note' }
      },
      required: ['json']
    }
  },
  {
    name: 'get_font',
    description: 'Retrieve complete canonical taxonomy matching JSON schema, variants, and research status for a font.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'URL slug of the font' },
        id: { type: 'string', description: 'UUID of the font' }
      }
    }
  },
  {
    name: 'propose_font_update',
    description: 'Directly update a font in the database with verified canonical changes (direct-write mode: immediately applies and verifies without review delay).',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Font slug' },
        id: { type: 'string', description: 'Font UUID' },
        changes: { type: 'object', description: 'Canonical section modifications to apply directly' },
        rationale: { type: 'string', description: 'Rationale note' }
      },
      required: ['changes']
    }
  },
  {
    name: 'update_multiple_fonts_json',
    description: 'Batch update multiple font JSONs directly in the Supabase database in a single call (up to 50 fonts).',
    inputSchema: {
      type: 'object',
      properties: {
        fonts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slug: { type: 'string' },
              id: { type: 'string' },
              json: { type: 'object' },
              rationale: { type: 'string' }
            },
            required: ['json']
          },
          description: 'Array of font update objects'
        },
        merge_strategy: { type: 'string', enum: ['smart', 'fill_missing', 'force_overwrite'] },
        stop_on_error: { type: 'boolean' }
      },
      required: ['fonts']
    }
  }
];

// ─── 6. Stdio JSON-RPC 2.0 Dispatcher ───────────────────────────────────────

export function startMcpServer() {
  process.stderr.write('[nobadfonts-mcp] Server started (Stdio transport). Ready for requests.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  function sendResponse(id, result, error = null) {
    const res = { jsonrpc: '2.0', id };
    if (error) {
      res.error = error;
    } else {
      res.result = result;
    }
    process.stdout.write(JSON.stringify(res) + '\n');
  }

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let msg;
    try {
      msg = JSON.parse(trimmed);
    } catch (parseErr) {
      sendResponse(null, null, { code: -32700, message: 'Parse error: Invalid JSON' });
      return;
    }

    const { id, method, params } = msg;

    // Handle notifications (no id)
    if (id === undefined || id === null) {
      if (method === 'notifications/initialized') {
        process.stderr.write('[nobadfonts-mcp] Client initialized notification received.\n');
      }
      return;
    }

    try {
      if (method === 'initialize') {
        sendResponse(id, {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'nobadfonts-mcp',
            version: '2.0.0'
          }
        });
      } else if (method === 'ping') {
        sendResponse(id, {});
      } else if (method === 'tools/list') {
        sendResponse(id, { tools: TOOLS });
      } else if (method === 'tools/call') {
        const toolName = params?.name;
        const args = params?.arguments || {};

        let toolOutput;
        if (toolName === 'get_all_fonts_fields') {
          toolOutput = await handleGetAllFontsFields(args);
        } else if (toolName === 'get_font_fields') {
          toolOutput = await handleGetFontFields(args);
        } else if (toolName === 'get_font') {
          toolOutput = await handleGetFont(args);
        } else if (toolName === 'update_font_json') {
          toolOutput = await handleUpdateFontJson(args);
        } else if (toolName === 'propose_font_update') {
          toolOutput = await handleUpdateFontJson({
            slug: args.slug,
            id: args.id,
            json: args.changes || args.json,
            rationale: args.rationale
          });
        } else if (toolName === 'patch_font_fields') {
          // Convert flat dot-notation patches to section object
          const changes = {};
          for (const [dotKey, value] of Object.entries(args.patches || {})) {
            const [section, field] = dotKey.split('.');
            if (section && field) {
              if (!changes[section]) changes[section] = {};
              changes[section][field] = value;
            }
          }
          toolOutput = await handleUpdateFontJson({
            slug: args.slug,
            id: args.id,
            json: changes,
            rationale: args.rationale
          });
        } else if (toolName === 'update_multiple_fonts_json') {
          toolOutput = await handleUpdateMultipleFontsJson(args);
        } else {
          sendResponse(id, null, { code: -32601, message: `Tool not found: "${toolName}"` });
          return;
        }

        sendResponse(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(toolOutput, null, 2)
            }
          ]
        });
      } else {
        sendResponse(id, null, { code: -32601, message: `Method not supported: "${method}"` });
      }
    } catch (err) {
      process.stderr.write(`[nobadfonts-mcp] Error in ${method}: ${err.message}\n`);
      sendResponse(id, {
        isError: true,
        content: [{ type: 'text', text: `Error: ${err.message}` }]
      });
    }
  });

  rl.on('close', () => {
    process.stderr.write('[nobadfonts-mcp] Stdio closed, exiting.\n');
    process.exit(0);
  });
}

// Auto-start if invoked directly via node
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  startMcpServer();
}

export {
  handleGetFont,
  handleUpdateFontJson,
  handleGetAllFontsFields,
  handleGetFontFields,
  handleUpdateMultipleFontsJson
};
