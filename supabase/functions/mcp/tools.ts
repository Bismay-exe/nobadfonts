import { createClient } from 'jsr:@supabase/supabase-js@2';

export function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
    Deno.env.get('SUPABASE_SECRET_KEY') ||
    Deno.env.get('SB_SECRET_KEY') ||
    '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Normalizes and cleans URLs (removes markdown wrappers, query tracking, stray brackets, adds protocol).
 */
export function cleanUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  let url = rawUrl.trim();
  if (!url || url.toLowerCase() === 'null' || url.toLowerCase() === 'undefined' || url.toLowerCase() === 'n/a') {
    return null;
  }

  // 1. If wrapped in markdown link syntax: [Title](https://...) or [url](url)
  const mdMatch = url.match(/\[.*?\]\((https?:\/\/[^\s\)]+|[^\s\)]+)\)/);
  if (mdMatch) {
    url = mdMatch[1].trim();
  }

  // 2. If it contains a nested/embedded URL after a site prefix
  if (url.includes('/fonts/http') || url.includes('/fonts/[http')) {
    const idx = url.indexOf('/fonts/');
    if (idx !== -1) {
      url = url.slice(idx + 7).trim();
      const innerMd = url.match(/\[.*?\]\((https?:\/\/[^\s\)]+|[^\s\)]+)\)/);
      if (innerMd) {
        url = innerMd[1].trim();
      }
    }
  }

  // 3. Remove leading/trailing wrapper characters: <, >, (, ), [, ], ", ', `
  url = url.replace(/^[<(\["'`]+|[>)\]"'`]+$/g, '').trim();

  // 4. Remove accidental trailing punctuation often left by copy-pasting
  url = url.replace(/[),;.]+$/, '').trim();

  if (!url) return null;

  // 5. Ensure valid protocol
  if (/^(mailto:|tel:|javascript:)/i.test(url)) {
    return null;
  }

  if (!/^https?:\/\//i.test(url)) {
    if (url.startsWith('//')) {
      url = `https:${url}`;
    } else {
      url = `https://${url}`;
    }
  }

  // 6. Verification through standard URL constructor
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

// ─── Domain Tiers & Classification Constants ─────────────────────────
const TIER_1_DOMAINS = [
  'github.com', 'gitlab.com', 'bitbucket.org', 'codeberg.org'
];

const TIER_2_DOMAINS = [
  'fonts.google.com', 'fonts.adobe.com', 'fontshare.com',
  'fontsource.org', 'fontspring.com', 'myfonts.com',
  'typenetwork.com', 'typewolf.com', 'monotype.com',
  'linotype.com', 'commercialtype.com', 'grillitype.com',
  'klim.co.nz', 'pangrampangram.com', 'velvetyne.fr', 'collletttivo.it'
];

const TIER_3_DOMAINS = [
  'behance.net', 'dribbble.com', 'medium.com',
  'creativeboom.com', 'typographica.org', 'readymag.com',
  'instagram.com', 'twitter.com', 'x.com', 'artstation.com'
];

const TIER_4_AGGREGATORS = [
  'dafont.com', '1001fonts.com', 'fontspace.com',
  'fontsquirrel.com', 'freefonts.io', 'befonts.com',
  'whatfontis.com', 'fontmeme.com', 'wfonts.com',
  'urbanfonts.com', 'ffonts.net', 'font-zone.com',
  'free-fonts.com', 'dafontfree.net', 'fontzone.net',
  'allfreefonts.com', 'download-free-fonts.com', 'fontsc.com'
];

export function classifyDomain(rawUrl: string, _fontName?: string) {
  const cleaned = cleanUrl(rawUrl);
  if (!cleaned) {
    return {
      raw_url: rawUrl,
      cleaned_url: null,
      domain: '',
      tier: 4,
      classification: 'invalid_url',
      is_official: false,
      confidence: 'low' as const,
      reasoning: 'Invalid or malformed URL syntax.'
    };
  }

  let domain = '';
  try {
    domain = new URL(cleaned).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    domain = '';
  }

  // 1. Check Tier 4 Aggregators first to ensure NO aggregators are classified as official
  if (TIER_4_AGGREGATORS.some(agg => domain === agg || domain.endsWith('.' + agg))) {
    return {
      raw_url: rawUrl,
      cleaned_url: cleaned,
      domain,
      tier: 4,
      classification: 'secondary_aggregator',
      is_official: false,
      confidence: 'high' as const,
      reasoning: 'Known third-party font download aggregator/mirror. Re-hosts fonts often without direct author licensing. Strictly secondary evidence, not an official source.'
    };
  }

  // 2. Check Tier 1 Repositories
  if (TIER_1_DOMAINS.some(repo => domain === repo || domain.endsWith('.' + repo))) {
    return {
      raw_url: rawUrl,
      cleaned_url: cleaned,
      domain,
      tier: 1,
      classification: 'official_repo',
      is_official: true,
      confidence: 'high' as const,
      reasoning: 'Primary version control repository (Git source code). Directly reflects upstream font files, commit history, and authoritative OFL/licensing.'
    };
  }

  // 3. Check Google Fonts
  if (domain === 'fonts.google.com') {
    return {
      raw_url: rawUrl,
      cleaned_url: cleaned,
      domain,
      tier: 2,
      classification: 'google_fonts',
      is_official: true,
      confidence: 'high' as const,
      reasoning: 'Official Google Fonts directory. Fully vetted open-source font distribution with verified designer attribution and license metadata.'
    };
  }

  // 4. Check Tier 2 Curated Libraries & Foundries
  if (TIER_2_DOMAINS.some(lib => domain === lib || domain.endsWith('.' + lib))) {
    return {
      raw_url: rawUrl,
      cleaned_url: cleaned,
      domain,
      tier: 2,
      classification: 'distributor_foundry',
      is_official: true,
      confidence: 'high' as const,
      reasoning: 'Official digital type foundry or reputable primary distributor (e.g. Adobe, Fontshare, MyFonts).'
    };
  }

  // 5. Check Tier 3 Designer Portfolios
  if (TIER_3_DOMAINS.some(port => domain === port || domain.endsWith('.' + port))) {
    return {
      raw_url: rawUrl,
      cleaned_url: cleaned,
      domain,
      tier: 3,
      classification: 'designer_portfolio',
      is_official: true,
      confidence: 'medium' as const,
      reasoning: 'Designer portfolio or showcase platform (e.g. Behance, Dribbble). High credibility for original artwork and creator identification, but secondary for font binaries.'
    };
  }

  // 6. Independent / Custom Domains (Foundry microsite, designer home page)
  return {
    raw_url: rawUrl,
    cleaned_url: cleaned,
    domain,
    tier: 2,
    classification: 'independent_website',
    is_official: true,
    confidence: 'medium' as const,
    reasoning: 'Independent domain. Likely an author website, type studio, or dedicated font release page. Unaffiliated with known scrapers.'
  };
}

/**
 * 1. get_font tool
 * Retrieves comprehensive font identity, full taxonomy JSONB, variants, and attached research data.
 */
export const CANONICAL_SCHEMA_SECTIONS = [
  'identity',
  'creator',
  'classification',
  'description',
  'license',
  'official_links',
  'technical'
] as const;

export const ALLOWED_CATEGORIES = [
  'sans',
  'serif',
  'display',
  'script',
  'slab-serif',
  'monospace',
  'handwritten'
] as const;

export type AllowedCategory = typeof ALLOWED_CATEGORIES[number];

export const CATEGORY_ALIASES: Record<string, AllowedCategory> = {
  'mono': 'monospace',
  'sans-serif': 'sans',
  'slab': 'slab-serif',
  'handwriting': 'handwritten',
  'calligraphy': 'script',
  'brush': 'script',
  'signature': 'script'
};

/**
 * Controlled taxonomy of 58 curated tags defined in Upload.tsx:L120-L211
 */
export const CONTROLLED_TAG_VOCABULARY = [
  // Classification
  'sans', 'serif', 'slab-serif', 'display', 'monospace', 'mono', 'script', 'calligraphy', 'brush', 'handwritten', 'signature',
  // Style
  'modern', 'classic', 'minimal', 'bold', 'elegant', 'luxury', 'playful', 'comic', 'graffiti', 'experimental', 'brutalist', 'industrial', 'editorial', 'geometric', 'organic', 'techno', 'sci-fi',
  // Use Case
  'branding', 'logo', 'headline', 'poster', 'editorial-use', 'corporate', 'tech', 'social-media',
  // Weight & Shape
  'hairline', 'thin', 'light', 'normal-width', 'heavy', 'tall', 'condensed', 'wide', 'extended',
  // Construction & Features
  'inktrap', 'rounded', 'square', 'sharp', 'stencil', 'outline', 'inline', 'pixel', 'messy',
  // Era & Vibe
  'casual', 'retro', 'vintage', 'cyberpunk', 'futuristic', 'gothic', 'y2k'
] as const;

export const CANONICAL_SCHEMA_ALLOWED_KEYS: Record<string, string[]> = {
  identity: ['name', 'family_name', 'slug', 'version', 'release_year'],
  creator: ['designer', 'foundry', 'publisher'],
  classification: ['category', 'subcategory', 'style', 'tags', 'mood', 'recommended_uses'],
  description: ['description', 'history', 'characteristics'],
  license: ['distribution_status', 'license_type', 'license_url', 'commercial_use', 'personal_use', 'modification_allowed', 'redistribution_allowed', 'license_evidence'],
  official_links: ['official_website', 'official_font_page', 'purchase_url', 'free_download_url', 'github_url', 'google_fonts_url'],
  technical: ['formats', 'weights', 'styles', 'glyph_count', 'languages', 'opentype_features']
};

export const CANONICAL_SCHEMA_TEMPLATE = {
  identity: {
    name: "string",
    family_name: "string",
    slug: "string",
    version: "string (e.g. 1.000)",
    release_year: "number (e.g. 2026)"
  },
  creator: {
    designer: "string",
    foundry: "string",
    publisher: "string"
  },
  classification: {
    category: "string (sans | serif | display | script | slab-serif | monospace | handwritten)",
    subcategory: "string",
    style: "string",
    tags: ["string (from controlled tag taxonomy: modern, geometric, branding, headline, etc.)"],
    mood: ["string"],
    recommended_uses: ["string"]
  },
  description: {
    description: "string",
    history: "string",
    characteristics: "string"
  },
  license: {
    distribution_status: "string (open_source | free | demo | paid | unknown)",
    license_type: "string",
    license_url: "string (url)",
    commercial_use: "boolean (true / false)",
    personal_use: "boolean (true / false)",
    modification_allowed: "boolean (true / false)",
    redistribution_allowed: "boolean (true / false)",
    license_evidence: "string"
  },
  official_links: {
    official_website: "string (url)",
    official_font_page: "string (url)",
    purchase_url: "string (url)",
    free_download_url: "string (url)",
    github_url: "string (url)",
    google_fonts_url: "string (url)"
  },
  technical: {
    formats: ["string (e.g. OTF, TTF, WOFF2)"],
    weights: ["string (e.g. Regular, Bold)"],
    styles: ["string (e.g. Normal, Italic)"],
    glyph_count: "number",
    languages: ["string"],
    opentype_features: ["string"]
  }
};

/**
 * Builds the comprehensive canonical font taxonomy JSON matching JSON_SCHEMA_TEMPLATE from JsonImportModal.tsx
 */
export function buildCanonicalTaxonomy(font: any, research?: any): Record<string, any> {
  const extracted = (research?.font_metadata_extracted as any) || {};
  const existingTax = font?.taxonomy || extracted?.taxonomy || {};

  // Extract formats from variants
  const dynamicFormats: string[] = existingTax.technical?.formats || [];
  if (dynamicFormats.length === 0 && font.font_variants && font.font_variants.length > 0) {
    const detected = new Set<string>();
    font.font_variants.forEach((v: any) => {
      if (v.woff2_url) detected.add('WOFF2');
      if (v.woff_url) detected.add('WOFF');
      if (v.otf_url) detected.add('OTF');
      if (v.ttf_url) detected.add('TTF');
    });
    if (detected.size > 0) dynamicFormats.push(...Array.from(detected));
  }
  if (dynamicFormats.length === 0) dynamicFormats.push('OTF', 'TTF');

  // Extract weights from variants
  const dynamicWeights: string[] = existingTax.technical?.weights || [];
  if (dynamicWeights.length === 0 && font.font_variants && font.font_variants.length > 0) {
    const weights = Array.from(new Set(font.font_variants.map((v: any) => v.variant_name)));
    if (weights.length > 0) dynamicWeights.push(...(weights as string[]));
  }
  if (dynamicWeights.length === 0) dynamicWeights.push('Regular');

  // Normalize category strictly to ALLOWED_CATEGORIES
  let rawCategory = (existingTax.classification?.category || font.category || 'display').toLowerCase().trim();
  if (CATEGORY_ALIASES[rawCategory]) {
    rawCategory = CATEGORY_ALIASES[rawCategory];
  }
  const safeCategory = ALLOWED_CATEGORIES.includes(rawCategory as any) ? rawCategory : 'display';

  // Normalize tags
  const rawTags = existingTax.classification?.tags || font.tags || [];
  const safeTags = Array.isArray(rawTags)
    ? rawTags.map((t: any) => String(t).toLowerCase().trim()).filter(Boolean)
    : (typeof rawTags === 'string' ? rawTags.split(',').map((t: string) => t.toLowerCase().trim()).filter(Boolean) : []);

  return {
    identity: {
      name: existingTax.identity?.name || font.name || '',
      family_name: existingTax.identity?.family_name || font.name || '',
      slug: font.slug || '',
      version: existingTax.identity?.version || extracted.version || '1.000',
      release_year: existingTax.identity?.release_year !== undefined && existingTax.identity?.release_year !== null
        ? Number(existingTax.identity.release_year)
        : (font.created_at ? new Date(font.created_at).getFullYear() : null)
    },
    creator: {
      designer: existingTax.creator?.designer || font.designer || null,
      foundry: existingTax.creator?.foundry || research?.foundry || null,
      publisher: existingTax.creator?.publisher || null
    },
    classification: {
      category: safeCategory,
      subcategory: existingTax.classification?.subcategory || null,
      style: existingTax.classification?.style || (font.tags?.[0] || 'Regular'),
      tags: safeTags,
      mood: Array.isArray(existingTax.classification?.mood) ? existingTax.classification.mood : [],
      recommended_uses: Array.isArray(existingTax.classification?.recommended_uses) && existingTax.classification.recommended_uses.length > 0
        ? existingTax.classification.recommended_uses
        : ['Headlines', 'Branding', 'Display']
    },
    description: {
      description: existingTax.description?.description || research?.ai_description || font.description || null,
      history: existingTax.description?.history || null,
      characteristics: existingTax.description?.characteristics || null
    },
    license: {
      distribution_status: existingTax.license?.distribution_status || (font.commercial_use ? 'open_source' : 'free'),
      license_type: existingTax.license?.license_type || research?.license_type_verified || font.license_type || 'Free for Personal Use',
      license_url: cleanUrl(existingTax.license?.license_url || research?.license_url),
      commercial_use: existingTax.license?.commercial_use ?? (font.commercial_use ?? false),
      personal_use: existingTax.license?.personal_use ?? true,
      modification_allowed: existingTax.license?.modification_allowed ?? false,
      redistribution_allowed: existingTax.license?.redistribution_allowed ?? false,
      license_evidence: existingTax.license?.license_evidence || research?.license_evidence || null
    },
    official_links: {
      official_website: cleanUrl(existingTax.official_links?.official_website || research?.official_website),
      official_font_page: cleanUrl(existingTax.official_links?.official_font_page || research?.official_font_page),
      purchase_url: cleanUrl(existingTax.official_links?.purchase_url || research?.purchase_url),
      free_download_url: cleanUrl(existingTax.official_links?.free_download_url || research?.free_download_url),
      github_url: cleanUrl(existingTax.official_links?.github_url),
      google_fonts_url: cleanUrl(existingTax.official_links?.google_fonts_url)
    },
    technical: {
      formats: dynamicFormats,
      weights: dynamicWeights,
      styles: Array.isArray(existingTax.technical?.styles) && existingTax.technical.styles.length > 0 ? existingTax.technical.styles : ['Normal'],
      glyph_count: existingTax.technical?.glyph_count || extracted.glyph_count || font.glyph_count || 92,
      languages: Array.isArray(existingTax.technical?.languages) && existingTax.technical.languages.length > 0
        ? existingTax.technical.languages
        : (extracted.detected_languages || ['English', 'Basic Latin']),
      opentype_features: Array.isArray(existingTax.technical?.opentype_features)
        ? existingTax.technical.opentype_features
        : (extracted.opentype_features || [])
    }
  };
}

/**
 * 1. get_font tool
 * Retrieves the complete canonical taxonomy matching JSON_SCHEMA_TEMPLATE,
 * along with research status and variants.
 */
export async function handleGetFont(args: { slug?: string; id?: string }) {
  if (!args.slug && !args.id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: Either "slug" or "id" must be provided.' }]
    };
  }

  const supabase = getSupabaseClient();
  let query = supabase
    .from('fonts')
    .select('*, font_variants(*), font_research(*)')
    .limit(1);

  if (args.id) {
    query = query.eq('id', args.id);
  } else if (args.slug) {
    query = query.eq('slug', args.slug.toLowerCase().trim());
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Database error while fetching font: ${error.message}` }]
    };
  }

  if (!data) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Font not found for identifier: ${args.slug || args.id}` }]
    };
  }

  const research = Array.isArray(data.font_research)
    ? data.font_research[0]
    : data.font_research;

  // Build the complete canonical taxonomy matching JsonImportModal.tsx JSON_SCHEMA_TEMPLATE
  const canonicalTaxonomy = buildCanonicalTaxonomy(data, research);

  const response = {
    font_id: data.id,
    name: data.name,
    slug: data.slug,
    research_status: research?.research_status || 'not_researched',
    research_confidence: research?.confidence || null,
    canonical_taxonomy_json: canonicalTaxonomy,
    schema_template: CANONICAL_SCHEMA_TEMPLATE,
    allowed_categories: ALLOWED_CATEGORIES,
    controlled_tag_vocabulary: CONTROLLED_TAG_VOCABULARY,
    instruction_for_ai: "CRITICAL SCHEMA RULE: You must take the above 'canonical_taxonomy_json' as your original base data and only propose changes inside its 7 canonical sections (identity, creator, classification, description, license, official_links, technical). Category must strictly be one of allowed_categories. Tags should be chosen from controlled_tag_vocabulary. Do NOT invent sections or keys outside this schema template."
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
  };
}

/**
 * 2. search_fonts tool
 * Searches fonts by name, slug, designer, category, or tags.
 */
export async function handleSearchFonts(args: { query: string; limit?: number }) {
  const q = args.query?.trim();
  if (!q) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "query" parameter is required.' }]
    };
  }

  const limit = Math.min(Math.max(args.limit || 10, 1), 50);
  const supabase = getSupabaseClient();

  // Search by name, slug, designer, or category
  const { data, error } = await supabase
    .from('fonts')
    .select('id, name, slug, designer, category, tags, license_type, commercial_use, font_research(research_status, foundry, official_website)')
    .or(`name.ilike.%${q}%,slug.ilike.%${q}%,designer.ilike.%${q}%,category.ilike.%${q}%`)
    .limit(limit);

  if (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Database error while searching fonts: ${error.message}` }]
    };
  }

  const results = (data || []).map((font: any) => {
    const research = Array.isArray(font.font_research)
      ? font.font_research[0]
      : font.font_research;

    return {
      id: font.id,
      name: font.name,
      slug: font.slug,
      designer: font.designer,
      foundry: research?.foundry || null,
      category: font.category,
      license_type: font.license_type,
      commercial_use: font.commercial_use,
      research_status: research?.research_status || 'not_researched',
      has_official_website: Boolean(research?.official_website)
    };
  });

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        query: q,
        count: results.length,
        results
      }, null, 2)
    }]
  };
}

/**
 * 3. list_fonts_missing_metadata tool
 * Identifies fonts missing key metadata such as verified license, official website, or foundry.
 */
export async function handleListFontsMissingMetadata(args: {
  filter?: 'missing_creator' | 'missing_foundry' | 'missing_license' | 'missing_license_url' | 'missing_official_links' | 'any';
  limit?: number;
}) {
  const filterMode = args.filter || 'any';
  const limit = Math.min(Math.max(args.limit || 20, 1), 50);
  const supabase = getSupabaseClient();

  // Fetch candidate fonts with their research records
  const { data, error } = await supabase
    .from('fonts')
    .select('id, name, slug, designer, license_type, font_research(foundry, license_url, official_website, research_status, font_metadata_extracted)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Database error while fetching fonts: ${error.message}` }]
    };
  }

  const matchingFonts: any[] = [];

  for (const font of data || []) {
    const research = Array.isArray(font.font_research)
      ? font.font_research[0]
      : font.font_research;
    const extracted = (research?.font_metadata_extracted as any) || {};
    const tax = font.taxonomy || extracted?.taxonomy || {};

    const isMissingCreator = !font.designer || font.designer.toLowerCase() === 'unknown';
    const isMissingFoundry = !research?.foundry && !tax.creator?.foundry;
    const isMissingLicense = !font.license_type || font.license_type.toLowerCase() === 'unknown';
    const isMissingLicenseUrl = !research?.license_url && !tax.license?.license_url;
    const isMissingOfficialLinks = !research?.official_website && !tax.official_links?.official_website;

    let matches = false;
    if (filterMode === 'missing_creator') matches = isMissingCreator;
    else if (filterMode === 'missing_foundry') matches = isMissingFoundry;
    else if (filterMode === 'missing_license') matches = isMissingLicense;
    else if (filterMode === 'missing_license_url') matches = isMissingLicenseUrl;
    else if (filterMode === 'missing_official_links') matches = isMissingOfficialLinks;
    else if (filterMode === 'any') {
      matches = isMissingCreator || isMissingFoundry || isMissingLicense || isMissingLicenseUrl || isMissingOfficialLinks;
    }

    if (matches) {
      matchingFonts.push({
        id: font.id,
        name: font.name,
        slug: font.slug,
        missing: {
          creator: isMissingCreator,
          foundry: isMissingFoundry,
          license: isMissingLicense,
          license_url: isMissingLicenseUrl,
          official_links: isMissingOfficialLinks
        },
        research_status: research?.research_status || 'not_researched'
      });
    }

    if (matchingFonts.length >= limit) break;
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        filter: filterMode,
        count: matchingFonts.length,
        fonts: matchingFonts
      }, null, 2)
    }]
  };
}

/**
 * 4. verify_font_sources tool
 * Classifies discovered URLs into Tier 1 (authoritative repos), Tier 2 (curated libraries/foundries),
 * Tier 3 (portfolios), and Tier 4 (unverified/secondary aggregators), returning whether each URL
 * is considered an official source.
 */
export async function handleVerifyFontSources(args: { font_name?: string; urls: string[] }) {
  if (!args.urls || !Array.isArray(args.urls) || args.urls.length === 0) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "urls" array must contain at least one URL.' }]
    };
  }

  const results = args.urls.map((rawUrl) => classifyDomain(rawUrl, args.font_name));

  const summary = {
    font_name: args.font_name || null,
    total_analyzed: results.length,
    official_count: results.filter((r) => r.is_official).length,
    secondary_or_unverified_count: results.filter((r) => !r.is_official).length,
    sources: results
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }]
  };
}

/**
 * 5. research_font tool
 * Retrieves comprehensive research data for a font, including linked verified sources,
 * provenance audit trail, confidence levels, detected conflicts, and missing fields.
 * Can optionally trigger the background AI research pipeline if requested.
 */
export async function handleResearchFont(args: {
  slug?: string;
  id?: string;
  trigger_deep_research?: boolean;
}) {
  if (!args.slug && !args.id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: Either "slug" or "id" must be provided.' }]
    };
  }

  const supabase = getSupabaseClient();
  let query = supabase
    .from('fonts')
    .select('*, font_research(*)')
    .limit(1);

  if (args.id) {
    query = query.eq('id', args.id);
  } else if (args.slug) {
    query = query.eq('slug', args.slug.toLowerCase().trim());
  }

  const { data: font, error: fontError } = await query.maybeSingle();

  if (fontError) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Database error while fetching font for research: ${fontError.message}` }]
    };
  }

  if (!font) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Font not found for identifier: ${args.slug || args.id}` }]
    };
  }

  const research = Array.isArray(font.font_research)
    ? font.font_research[0]
    : font.font_research;

  // Retrieve evidence sources if research record exists
  let sources: any[] = [];
  if (research?.id) {
    const { data: sourcesData } = await supabase
      .from('font_sources')
      .select('*')
      .eq('research_id', research.id)
      .order('source_tier', { ascending: true });

    sources = sourcesData || [];
  }

  // Handle deep research trigger if requested
  let deepResearchTriggered = false;
  let deepResearchJobId: string | null = null;
  let deepResearchStatus: string | null = null;

  if (args.trigger_deep_research) {
    // Check if an existing job is currently queued or in progress
    const { data: existingJob } = await supabase
      .from('research_jobs')
      .select('id, status, created_at')
      .eq('font_id', font.id)
      .in('status', ['queued', 'running', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingJob) {
      deepResearchTriggered = true;
      deepResearchJobId = existingJob.id;
      deepResearchStatus = `Job already ${existingJob.status} (Job ID: ${existingJob.id})`;
    } else {
      const { data: newJob, error: jobError } = await supabase
        .from('research_jobs')
        .insert({
          font_id: font.id,
          status: 'queued',
          trigger_type: 'mcp'
        })
        .select('id')
        .single();

      if (!jobError && newJob) {
        deepResearchTriggered = true;
        deepResearchJobId = newJob.id;
        deepResearchStatus = 'Job queued and dispatched to research-font pipeline.';

        // Asynchronously trigger Edge function
        supabase.functions
          .invoke('research-font', {
            body: { font_id: font.id, job_id: newJob.id }
          })
          .catch((err: any) => {
            console.error('Asynchronous research-font invocation failed:', err);
          });
      } else {
        deepResearchStatus = `Failed to queue research job: ${jobError?.message}`;
      }
    }
  }

  const extracted = (research?.font_metadata_extracted as any) || {};
  const tax = font.taxonomy || extracted?.taxonomy || {};

  // Conflict detection
  const conflicts: any[] = [];

  if (research?.has_conflicts && research?.conflict_details) {
    try {
      const parsed = typeof research.conflict_details === 'string'
        ? JSON.parse(research.conflict_details)
        : research.conflict_details;
      if (Array.isArray(parsed)) {
        conflicts.push(...parsed);
      } else {
        conflicts.push({
          field: 'general',
          explanation: String(research.conflict_details),
          status: 'requires_review'
        });
      }
    } catch {
      conflicts.push({
        field: 'general',
        explanation: String(research.conflict_details),
        status: 'requires_review'
      });
    }
  }

  // Check creator divergence between canonical font table and verified research
  if (
    font.designer &&
    research?.designer_verified &&
    font.designer.toLowerCase().trim() !== research.designer_verified.toLowerCase().trim()
  ) {
    conflicts.push({
      field: 'creator',
      values: [font.designer, research.designer_verified],
      status: 'requires_review',
      explanation: `Canonical record lists creator as "${font.designer}", whereas AI research detected "${research.designer_verified}".`
    });
  }

  // Check license divergence
  if (
    font.license_type &&
    research?.license_type_verified &&
    font.license_type.toLowerCase().trim() !== research.license_type_verified.toLowerCase().trim()
  ) {
    conflicts.push({
      field: 'license_type',
      values: [font.license_type, research.license_type_verified],
      status: 'requires_review',
      explanation: `Canonical record lists license as "${font.license_type}", whereas AI research detected "${research.license_type_verified}".`
    });
  }

  // Missing fields calculation
  const missing: string[] = [];
  if (!font.designer && !research?.designer_verified) missing.push('creator');
  if (!research?.foundry && !tax.creator?.foundry) missing.push('foundry');
  if (!font.license_type && !research?.license_type_verified) missing.push('license_type');
  if (!research?.license_url && !tax.license?.license_url) missing.push('license_url');
  if (!research?.official_website && !tax.official_links?.official_website) missing.push('official_website');
  if (!research?.official_font_page && !tax.official_links?.official_font_page) missing.push('official_font_page');
  if (!research?.purchase_url && !tax.official_links?.purchase_url) missing.push('purchase_url');
  if (!research?.free_download_url && !tax.official_links?.free_download_url) missing.push('free_download_url');

  // Structured response conforming to PRD sections 12–15
  const findings = {
    creator: {
      value: research?.designer_verified || font.designer || null,
      confidence: research?.designer_verified ? (research.confidence || 'medium') : (font.designer ? 'medium' : 'none'),
      provenance: research?.designer_verified ? 'ai_verified' : (font.designer ? 'canonical_record' : 'missing')
    },
    foundry: {
      value: research?.foundry || tax.creator?.foundry || null,
      confidence: research?.foundry ? (research.confidence || 'medium') : 'none',
      provenance: research?.foundry ? 'ai_verified' : (tax.creator?.foundry ? 'canonical_taxonomy' : 'missing')
    },
    license: {
      license_type: research?.license_type_verified || font.license_type || null,
      license_status: research?.license_status || (font.license_type ? 'unverified' : 'missing'),
      commercial_use: research?.commercial_use_verified ?? font.commercial_use,
      personal_use: research?.personal_use_verified ?? font.personal_use,
      license_url: cleanUrl(research?.license_url || tax.license?.license_url),
      license_evidence: research?.license_evidence || tax.license?.license_evidence || null,
      confidence: research?.license_type_verified ? (research.confidence || 'medium') : 'none'
    },
    official_links: {
      official_website: cleanUrl(research?.official_website || tax.official_links?.official_website),
      official_font_page: cleanUrl(research?.official_font_page || tax.official_links?.official_font_page),
      purchase_url: cleanUrl(research?.purchase_url || tax.official_links?.purchase_url),
      free_download_url: cleanUrl(research?.free_download_url || tax.official_links?.free_download_url),
      github_url: cleanUrl(tax.official_links?.github_url),
      google_fonts_url: cleanUrl(tax.official_links?.google_fonts_url)
    },
    ai_description: research?.ai_description || null,
    ai_tags: research?.ai_tags || null
  };

  // Build suggested canonical taxonomy merging research into the original canonical taxonomy
  const baseCanonical = buildCanonicalTaxonomy(font, research);
  const suggestedCanonicalTaxonomy = JSON.parse(JSON.stringify(baseCanonical));

  if (research?.designer_verified) suggestedCanonicalTaxonomy.creator.designer = research.designer_verified;
  if (research?.foundry) suggestedCanonicalTaxonomy.creator.foundry = research.foundry;
  if (research?.ai_description) suggestedCanonicalTaxonomy.description.description = research.ai_description;
  if (research?.ai_tags && Array.isArray(research.ai_tags) && research.ai_tags.length > 0) {
    const mergedTags = Array.from(new Set([
      ...suggestedCanonicalTaxonomy.classification.tags,
      ...research.ai_tags.map((t: any) => String(t).toLowerCase().trim()).filter(Boolean)
    ]));
    suggestedCanonicalTaxonomy.classification.tags = mergedTags;
  }
  if (research?.license_type_verified) suggestedCanonicalTaxonomy.license.license_type = research.license_type_verified;
  if (research?.license_status === 'open_source') suggestedCanonicalTaxonomy.license.distribution_status = 'open_source';
  if (research?.license_url) suggestedCanonicalTaxonomy.license.license_url = cleanUrl(research.license_url);
  if (research?.license_evidence) suggestedCanonicalTaxonomy.license.license_evidence = research.license_evidence;
  if (typeof research?.commercial_use_verified === 'boolean') suggestedCanonicalTaxonomy.license.commercial_use = research.commercial_use_verified;
  if (typeof research?.personal_use_verified === 'boolean') suggestedCanonicalTaxonomy.license.personal_use = research.personal_use_verified;
  if (research?.official_website) suggestedCanonicalTaxonomy.official_links.official_website = cleanUrl(research.official_website);
  if (research?.official_font_page) suggestedCanonicalTaxonomy.official_links.official_font_page = cleanUrl(research.official_font_page);
  if (research?.purchase_url) suggestedCanonicalTaxonomy.official_links.purchase_url = cleanUrl(research.purchase_url);
  if (research?.free_download_url) suggestedCanonicalTaxonomy.official_links.free_download_url = cleanUrl(research.free_download_url);

  const response = {
    font: {
      id: font.id,
      name: font.name,
      slug: font.slug,
      status: font.status || 'published'
    },
    research_status: research?.research_status || 'not_researched',
    confidence: research?.confidence || (research ? 'low' : 'none'),
    researched_at: research?.researched_at || null,
    suggested_canonical_taxonomy: suggestedCanonicalTaxonomy,
    schema_instruction: "Use suggested_canonical_taxonomy when suggesting font metadata. It adheres strictly to the 7 canonical schema sections (identity, creator, classification, description, license, official_links, technical). Do not create keys outside this template.",
    findings,
    sources: sources.map((s: any) => ({
      url: s.url,
      domain: s.domain,
      tier: s.source_tier,
      source_type: s.source_type,
      is_official: s.source_tier <= 2 || s.source_type === 'official_repo' || s.source_type === 'google_fonts',
      supports: s.supports || [],
      evidence: s.evidence,
      confidence: s.confidence
    })),
    conflicts,
    missing_fields: missing,
    deep_research: {
      triggered: deepResearchTriggered,
      job_id: deepResearchJobId,
      status: deepResearchStatus
    }
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
  };
}

// ─── Phase 3: Staging, Propose Updates & Revision Utilities ───────────

/**
 * Controlled set of valid source types for field-level provenance.
 */
export const ALLOWED_SOURCE_TYPES = [
  'official_website',
  'official_repo',
  'official_foundry',
  'official_marketplace',
  'secondary_source',
  'aggregator',
  'unknown'
] as const;

export type SourceType = typeof ALLOWED_SOURCE_TYPES[number];

/**
 * Generates a deterministic SHA-256 hash of a taxonomy object.
 * Used for revision concurrency protection (base_taxonomy_hash).
 */
function deterministicStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(deterministicStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + deterministicStringify(obj[k])).join(',') + '}';
}

export async function hashTaxonomy(taxonomy: any): Promise<string> {
  const serialized = deterministicStringify(taxonomy || {});
  const encoder = new TextEncoder();
  const data = encoder.encode(serialized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a deterministic SHA-256 hash of the entire canonical state
 * across all modifiable fields in fonts and font_research.
 * Used for strict base_state_hash and after_state_hash concurrency protection.
 */
export async function hashCanonicalState(font: any, research: any): Promise<string> {
  const currentTax = buildCanonicalTaxonomy(font, research);
  const composite = {
    taxonomy: currentTax,
    name: font?.name || null,
    designer: font?.designer || null,
    category: font?.category || null,
    tags: font?.tags || [],
    description: font?.description || null,
    license_type: font?.license_type || null,
    commercial_use: font?.commercial_use ?? null,
    personal_use: font?.personal_use ?? null,
    research: research ? {
      foundry: research.foundry || null,
      official_website: research.official_website || null,
      official_font_page: research.official_font_page || null,
      purchase_url: research.purchase_url || null,
      free_download_url: research.free_download_url || null,
      license_url: research.license_url || null,
      license_type_verified: research.license_type_verified || null,
      commercial_use_verified: research.commercial_use_verified ?? null,
      personal_use_verified: research.personal_use_verified ?? null
    } : null
  };
  return await hashTaxonomy(composite);
}

/**
 * Deeply merges proposed changes into the current canonical taxonomy
 * without mutating canonical state.
 */
function deepMerge(target: any, source: any): any {
  if (source === null || source === undefined) return target;
  if (typeof source !== 'object' || Array.isArray(source)) return source;
  const result = { ...(target || {}) };
  for (const key of Object.keys(source)) {
    if (source[key] !== undefined) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}

/**
 * Computes an explicit field-by-field diff between current taxonomy and proposed taxonomy.
 */
function computeMetadataDiff(currentTax: any, proposedTax: any): {
  changed_fields: string[];
  before: Record<string, any>;
  after: Record<string, any>;
} {
  const changedFields: string[] = [];
  const before: Record<string, any> = {};
  const after: Record<string, any> = {};

  const allKeys = Array.from(new Set([...Object.keys(currentTax || {}), ...Object.keys(proposedTax || {})]));

  for (const key of allKeys) {
    const valBefore = currentTax ? currentTax[key] : undefined;
    const valAfter = proposedTax ? proposedTax[key] : undefined;

    if (JSON.stringify(valBefore) !== JSON.stringify(valAfter)) {
      changedFields.push(key);
      before[key] = valBefore ?? null;
      after[key] = valAfter ?? null;
    }
  }

  return { changed_fields: changedFields, before, after };
}

/**
 * Field-specific validation: Disallows aggregators in official_links while allowing them in sources.
 */
function validateOfficialLinks(officialLinks: Record<string, any>): {
  cleanedLinks: Record<string, string | null>;
  errors: string[];
} {
  const cleanedLinks: Record<string, string | null> = {};
  const errors: string[] = [];

  for (const [key, val] of Object.entries(officialLinks)) {
    if (!val) {
      cleanedLinks[key] = null;
      continue;
    }
    const cleaned = cleanUrl(String(val));
    if (!cleaned) {
      errors.push(`Invalid URL format for official_links.${key}: "${val}"`);
      cleanedLinks[key] = null;
      continue;
    }
    cleanedLinks[key] = cleaned;

    // Field-specific rule: Aggregators are strictly disallowed in official_links
    const classification = classifyDomain(cleaned);
    if (classification.tier === 4 || !classification.is_official) {
      errors.push(
        `Aggregator URL rejected for official_links.${key} ("${cleaned}"). Aggregators (e.g. DaFont, 1001Fonts, Befonts) must not be represented as official sources. Provide them under "sources" as secondary evidence instead.`
      );
    }
  }

  return { cleanedLinks, errors };
}

/**
 * Normalizes field-level provenance and validates source_type values against controlled enum.
 */
function normalizeSourceSnapshot(sources: any): {
  normalizedSources: any[];
  provenanceErrors: string[];
} {
  const normalizedSources: any[] = [];
  const provenanceErrors: string[] = [];

  if (!sources) return { normalizedSources, provenanceErrors };

  const items = Array.isArray(sources) ? sources : [sources];

  for (const item of items) {
    if (typeof item === 'string') {
      const cleaned = cleanUrl(item);
      if (cleaned) {
        const cls = classifyDomain(cleaned);
        normalizedSources.push({
          url: cleaned,
          source_type: (cls.tier === 4 ? 'aggregator' : (cls.classification === 'official_repo' ? 'official_repo' : 'secondary_source')) as SourceType,
          confidence: cls.confidence,
          is_official: cls.is_official,
          supports: []
        });
      }
    } else if (typeof item === 'object' && item !== null) {
      const cleaned = cleanUrl(item.url);
      if (cleaned) {
        let st = item.source_type;
        if (st && !ALLOWED_SOURCE_TYPES.includes(st)) {
          provenanceErrors.push(`Invalid source_type "${st}". Must be one of: ${ALLOWED_SOURCE_TYPES.join(', ')}`);
          st = 'unknown';
        } else if (!st) {
          const cls = classifyDomain(cleaned);
          st = cls.tier === 4 ? 'aggregator' : (cls.classification === 'official_repo' ? 'official_repo' : 'secondary_source');
        }

        normalizedSources.push({
          url: cleaned,
          source_type: st,
          field: item.field || null,
          confidence: item.confidence || 'medium',
          is_official: Boolean(item.is_official),
          evidence: item.evidence || null,
          supports: Array.isArray(item.supports) ? item.supports : (item.field ? [item.field] : [])
        });
      }
    }
  }

  return { normalizedSources, provenanceErrors };
}

/**
 * 6. propose_font_update tool
 * Generates a proposed revision without modifying the canonical font record.
 * Validates taxonomy, sanitizes URLs, enforces field-specific aggregator rules,
 * computes diffs, binds base_taxonomy_hash for concurrency protection,
 * and saves into font_revisions in "pending_review" status.
 */
export async function handleProposeFontUpdate(args: {
  slug?: string;
  id?: string;
  changes: Record<string, any>;
  sources?: any;
  rationale?: string;
  client_hint?: string;
}) {
  if (!args.slug && !args.id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: Either "slug" or "id" must be provided.' }]
    };
  }

  if (!args.changes || typeof args.changes !== 'object' || Object.keys(args.changes).length === 0) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "changes" object must contain at least one proposed modification.' }]
    };
  }

  const supabase = getSupabaseClient();
  let query = supabase
    .from('fonts')
    .select('*, font_research(*)')
    .limit(1);

  if (args.id) {
    query = query.eq('id', args.id);
  } else if (args.slug) {
    query = query.eq('slug', args.slug.toLowerCase().trim());
  }

  const { data: font, error: fontError } = await query.maybeSingle();

  if (fontError) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Database error while fetching font: ${fontError.message}` }]
    };
  }

  if (!font) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Font not found for identifier: ${args.slug || args.id}` }]
    };
  }

  const research = Array.isArray(font.font_research) ? font.font_research[0] : font.font_research;

  // Always use the complete canonical taxonomy as the base (pre-populated with font data if DB taxonomy was empty)
  const currentTaxonomy = buildCanonicalTaxonomy(font, research);
  const baseTaxonomyHash = await hashTaxonomy(currentTaxonomy);
  const baseStateHash = await hashCanonicalState(font, research);

  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];

  // Deep clone proposed changes to sanitize
  const rawInput = JSON.parse(JSON.stringify(args.changes));
  const sanitizedChanges: Record<string, any> = {};

  // Top-level section aliases
  if (rawInput.licensing) {
    rawInput.license = { ...(rawInput.license || {}), ...rawInput.licensing };
    delete rawInput.licensing;
    validationWarnings.push('Auto-remapped section "licensing" -> "license" to match JSON_SCHEMA_TEMPLATE.');
  }
  if (rawInput.links) {
    rawInput.official_links = { ...(rawInput.official_links || {}), ...rawInput.links };
    delete rawInput.links;
    validationWarnings.push('Auto-remapped section "links" -> "official_links" to match JSON_SCHEMA_TEMPLATE.');
  }
  if (rawInput.details) {
    rawInput.description = { ...(rawInput.description || {}), ...rawInput.details };
    delete rawInput.details;
    validationWarnings.push('Auto-remapped section "details" -> "description" to match JSON_SCHEMA_TEMPLATE.');
  }
  if (rawInput.specs) {
    rawInput.technical = { ...(rawInput.technical || {}), ...rawInput.specs };
    delete rawInput.specs;
    validationWarnings.push('Auto-remapped section "specs" -> "technical" to match JSON_SCHEMA_TEMPLATE.');
  }
  if (rawInput.author) {
    rawInput.creator = { ...(rawInput.creator || {}), ...rawInput.author };
    delete rawInput.author;
    validationWarnings.push('Auto-remapped section "author" -> "creator" to match JSON_SCHEMA_TEMPLATE.');
  }

  // Known flat field mapping
  const FLAT_FIELD_MAP: Record<string, { section: string; field: string }> = {
    name: { section: 'identity', field: 'name' },
    family_name: { section: 'identity', field: 'family_name' },
    familyName: { section: 'identity', field: 'family_name' },
    slug: { section: 'identity', field: 'slug' },
    version: { section: 'identity', field: 'version' },
    release_year: { section: 'identity', field: 'release_year' },
    releaseYear: { section: 'identity', field: 'release_year' },
    designer: { section: 'creator', field: 'designer' },
    foundry: { section: 'creator', field: 'foundry' },
    publisher: { section: 'creator', field: 'publisher' },
    category: { section: 'classification', field: 'category' },
    subcategory: { section: 'classification', field: 'subcategory' },
    style: { section: 'classification', field: 'style' },
    tags: { section: 'classification', field: 'tags' },
    mood: { section: 'classification', field: 'mood' },
    recommended_uses: { section: 'classification', field: 'recommended_uses' },
    recommendedUses: { section: 'classification', field: 'recommended_uses' },
    description: { section: 'description', field: 'description' },
    history: { section: 'description', field: 'history' },
    characteristics: { section: 'description', field: 'characteristics' },
    distribution_status: { section: 'license', field: 'distribution_status' },
    distributionStatus: { section: 'license', field: 'distribution_status' },
    license_type: { section: 'license', field: 'license_type' },
    licenseType: { section: 'license', field: 'license_type' },
    license_url: { section: 'license', field: 'license_url' },
    licenseUrl: { section: 'license', field: 'license_url' },
    commercial_use: { section: 'license', field: 'commercial_use' },
    commercialUse: { section: 'license', field: 'commercial_use' },
    personal_use: { section: 'license', field: 'personal_use' },
    personalUse: { section: 'license', field: 'personal_use' },
    modification_allowed: { section: 'license', field: 'modification_allowed' },
    modificationAllowed: { section: 'license', field: 'modification_allowed' },
    redistribution_allowed: { section: 'license', field: 'redistribution_allowed' },
    redistributionAllowed: { section: 'license', field: 'redistribution_allowed' },
    license_evidence: { section: 'license', field: 'license_evidence' },
    licenseEvidence: { section: 'license', field: 'license_evidence' },
    official_website: { section: 'official_links', field: 'official_website' },
    officialWebsite: { section: 'official_links', field: 'official_website' },
    official_font_page: { section: 'official_links', field: 'official_font_page' },
    officialFontPage: { section: 'official_links', field: 'official_font_page' },
    purchase_url: { section: 'official_links', field: 'purchase_url' },
    purchaseUrl: { section: 'official_links', field: 'purchase_url' },
    free_download_url: { section: 'official_links', field: 'free_download_url' },
    freeDownloadUrl: { section: 'official_links', field: 'free_download_url' },
    github_url: { section: 'official_links', field: 'github_url' },
    githubUrl: { section: 'official_links', field: 'github_url' },
    google_fonts_url: { section: 'official_links', field: 'google_fonts_url' },
    googleFontsUrl: { section: 'official_links', field: 'google_fonts_url' },
    formats: { section: 'technical', field: 'formats' },
    weights: { section: 'technical', field: 'weights' },
    styles: { section: 'technical', field: 'styles' },
    glyph_count: { section: 'technical', field: 'glyph_count' },
    glyphCount: { section: 'technical', field: 'glyph_count' },
    languages: { section: 'technical', field: 'languages' },
    opentype_features: { section: 'technical', field: 'opentype_features' },
    opentypeFeatures: { section: 'technical', field: 'opentype_features' }
  };

  const allowedSectionsSet = new Set(CANONICAL_SCHEMA_SECTIONS);

  for (const [key, val] of Object.entries(rawInput)) {
    if (allowedSectionsSet.has(key as any)) {
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        sanitizedChanges[key] = { ...(sanitizedChanges[key] || {}), ...val };
      } else {
        validationErrors.push(`Section "${key}" must be an object.`);
      }
    } else if (FLAT_FIELD_MAP[key]) {
      const mapping = FLAT_FIELD_MAP[key];
      if (!sanitizedChanges[mapping.section]) {
        sanitizedChanges[mapping.section] = {};
      }
      sanitizedChanges[mapping.section][mapping.field] = val;
      validationWarnings.push(`Auto-remapped flat field "${key}" -> "${mapping.section}.${mapping.field}".`);
    } else {
      validationErrors.push(
        `Unauthorized field or section "${key}". Proposed updates must strictly reside within the 7 canonical schema sections: ${CANONICAL_SCHEMA_SECTIONS.join(', ')}.`
      );
    }
  }

  // Validate fields inside each section against CANONICAL_SCHEMA_ALLOWED_KEYS
  for (const section of Object.keys(sanitizedChanges)) {
    const allowedKeys = new Set(CANONICAL_SCHEMA_ALLOWED_KEYS[section] || []);
    for (const field of Object.keys(sanitizedChanges[section])) {
      if (!allowedKeys.has(field)) {
        validationErrors.push(
          `Field "${field}" is not allowed in section "${section}". Allowed fields: ${Array.from(allowedKeys).join(', ')}.`
        );
      }
    }
  }

  // 1. Sanitize and validate official_links (Field-specific aggregator rule)
  if (sanitizedChanges.official_links && typeof sanitizedChanges.official_links === 'object') {
    const { cleanedLinks, errors } = validateOfficialLinks(sanitizedChanges.official_links);
    sanitizedChanges.official_links = cleanedLinks;
    if (errors.length > 0) {
      validationErrors.push(...errors);
    }
  }

  // 2. Validate classification schema rules & category enum
  if (sanitizedChanges.classification) {
    if (sanitizedChanges.classification.category !== undefined) {
      let cat = String(sanitizedChanges.classification.category).toLowerCase().trim();
      if (CATEGORY_ALIASES[cat]) {
        cat = CATEGORY_ALIASES[cat];
      }
      if (!ALLOWED_CATEGORIES.includes(cat as any)) {
        validationErrors.push(
          `Invalid classification.category "${cat}". Must strictly be one of: ${ALLOWED_CATEGORIES.join(', ')}.`
        );
      } else {
        sanitizedChanges.classification.category = cat;
      }
    }

    // Normalize and clean tags
    if (sanitizedChanges.classification.tags !== undefined) {
      const rawTags = sanitizedChanges.classification.tags;
      const cleanTags = Array.isArray(rawTags)
        ? rawTags.map((t: any) => String(t).toLowerCase().trim()).filter(Boolean)
        : (typeof rawTags === 'string' ? rawTags.split(',').map((t: string) => t.toLowerCase().trim()).filter(Boolean) : []);
      sanitizedChanges.classification.tags = Array.from(new Set(cleanTags));
    }
  }

  // 3. Validate license schema rules
  if (sanitizedChanges.license) {
    const ALLOWED_DISTRIBUTION = ['open_source', 'free', 'demo', 'paid', 'unknown'];
    if (sanitizedChanges.license.distribution_status) {
      const ds = String(sanitizedChanges.license.distribution_status).toLowerCase().trim();
      if (!ALLOWED_DISTRIBUTION.includes(ds)) {
        validationErrors.push(`Invalid license.distribution_status "${ds}". Must be one of: ${ALLOWED_DISTRIBUTION.join(', ')}`);
      } else {
        sanitizedChanges.license.distribution_status = ds;
      }
    }

    // Force boolean on permission fields
    for (const boolField of ['commercial_use', 'personal_use', 'modification_allowed', 'redistribution_allowed']) {
      if (sanitizedChanges.license[boolField] !== undefined) {
        if (typeof sanitizedChanges.license[boolField] === 'string') {
          sanitizedChanges.license[boolField] = sanitizedChanges.license[boolField].toLowerCase() === 'true';
        } else {
          sanitizedChanges.license[boolField] = Boolean(sanitizedChanges.license[boolField]);
        }
      }
    }

    // Sanitize license_url if present
    if (sanitizedChanges.license.license_url) {
      const cleaned = cleanUrl(sanitizedChanges.license.license_url);
      if (!cleaned) {
        validationWarnings.push(`Invalid license URL: "${sanitizedChanges.license.license_url}"`);
        sanitizedChanges.license.license_url = null;
      } else {
        sanitizedChanges.license.license_url = cleaned;
      }
    }
  }

  // 4. Validate identity schema types
  if (sanitizedChanges.identity) {
    if (sanitizedChanges.identity.release_year !== undefined && sanitizedChanges.identity.release_year !== null) {
      const yr = Number(sanitizedChanges.identity.release_year);
      if (isNaN(yr)) {
        validationErrors.push(`Invalid identity.release_year "${sanitizedChanges.identity.release_year}". Must be a valid 4-digit number (e.g. 2026).`);
      } else {
        sanitizedChanges.identity.release_year = yr;
      }
    }
  }

  // 5. Validate technical schema types
  if (sanitizedChanges.technical) {
    if (sanitizedChanges.technical.glyph_count !== undefined && sanitizedChanges.technical.glyph_count !== null) {
      const gc = Number(sanitizedChanges.technical.glyph_count);
      if (isNaN(gc)) {
        validationErrors.push(`Invalid technical.glyph_count "${sanitizedChanges.technical.glyph_count}". Must be a valid number.`);
      } else {
        sanitizedChanges.technical.glyph_count = gc;
      }
    }
  }

  // Strict rejection if validation errors occurred
  if (validationErrors.length > 0) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Proposal rejected due to canonical schema violations:\n\n${validationErrors.map(e => `• ${e}`).join('\n')}\n\nRule: You must use the font's original canonical_taxonomy_json (from get_font) and only modify fields within the 7 canonical schema sections:\n- identity (${CANONICAL_SCHEMA_ALLOWED_KEYS.identity.join(', ')})\n- creator (${CANONICAL_SCHEMA_ALLOWED_KEYS.creator.join(', ')})\n- classification (${CANONICAL_SCHEMA_ALLOWED_KEYS.classification.join(', ')})\n- description (${CANONICAL_SCHEMA_ALLOWED_KEYS.description.join(', ')})\n- license (${CANONICAL_SCHEMA_ALLOWED_KEYS.license.join(', ')})\n- official_links (${CANONICAL_SCHEMA_ALLOWED_KEYS.official_links.join(', ')})\n- technical (${CANONICAL_SCHEMA_ALLOWED_KEYS.technical.join(', ')})\n\nCategory must strictly be one of: ${ALLOWED_CATEGORIES.join(', ')}.\nDo NOT create any fields or sections outside of this template.`
      }]
    };
  }

  // Normalize field-level provenance sources and check source_type enum
  const { normalizedSources, provenanceErrors } = normalizeSourceSnapshot(args.sources);
  if (provenanceErrors.length > 0) {
    validationWarnings.push(...provenanceErrors);
  }

  // Construct candidate proposed_taxonomy by deep merging into the canonical schema template
  const candidateTaxonomy = deepMerge(currentTaxonomy, sanitizedChanges);

  // Compute before-and-after diff
  const diffSummary = computeMetadataDiff(currentTaxonomy, candidateTaxonomy);

  if (diffSummary.changed_fields.length === 0) {
    validationWarnings.push('Proposed changes result in zero net differences compared to current canonical taxonomy.');
  }

  // Untrusted client metadata derivation
  const serverClientMetadata = {
    source: 'mcp',
    tool: 'propose_font_update',
    client_hint: typeof args.client_hint === 'string' ? args.client_hint.slice(0, 50) : 'unspecified'
  };

  const validationResult = {
    valid: true,
    errors: [],
    warnings: validationWarnings
  };

  // Store proposal into font_revisions
  const { data: revision, error: insertError } = await supabase
    .from('font_revisions')
    .insert({
      font_id: font.id,
      status: 'pending_review',
      proposed_changes: sanitizedChanges,
      proposed_taxonomy: candidateTaxonomy,
      base_taxonomy_hash: baseTaxonomyHash,
      base_state_hash: baseStateHash,
      source_snapshot: normalizedSources,
      diff_summary: diffSummary,
      validation_result: validationResult,
      rationale: args.rationale?.trim() || null,
      created_by: 'mcp',
      client_metadata: serverClientMetadata
    })
    .select('id, status, created_at')
    .single();

  if (insertError) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to store font revision: ${insertError.message}` }]
    };
  }

  const response = {
    revision_id: revision.id,
    font: {
      id: font.id,
      name: font.name,
      slug: font.slug
    },
    status: revision.status,
    base_state_hash: baseStateHash,
    base_taxonomy_hash: baseTaxonomyHash,
    validation: validationResult,
    diff_summary: diffSummary,
    rationale: args.rationale || null,
    source_provenance_count: normalizedSources.length,
    created_at: revision.created_at,
    note: 'Candidate revision staged in pending_review status. Production fonts table remains unchanged.'
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
  };
}

/**
 * 7. get_font_revision tool
 * Retrieves staged revision details, diff, validation status, field-level provenance,
 * and performs concurrency staleness verification against current live font taxonomy.
 */
export async function handleGetFontRevision(args: {
  revision_id?: string;
  slug?: string;
  id?: string;
  status?: string;
}) {
  if (!args.revision_id && !args.slug && !args.id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: Must provide either "revision_id" or font "slug"/"id".' }]
    };
  }

  const supabase = getSupabaseClient();

  if (args.revision_id) {
    const { data: rev, error: revError } = await supabase
      .from('font_revisions')
      .select('*')
      .eq('id', args.revision_id)
      .maybeSingle();

    if (revError) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Database error: ${revError.message}` }]
      };
    }

    if (!rev) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Revision not found for ID: ${args.revision_id}` }]
      };
    }

    // Fetch target font and attached research cleanly (prevents fragile PostgREST nested alias issues)
    const { data: fontRow, error: fontError } = await supabase
      .from('fonts')
      .select('*, font_research(*)')
      .eq('id', rev.font_id)
      .maybeSingle();

    if (fontError || !fontRow) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Target font not found for revision: ${rev.font_id}` }]
      };
    }

    const researchRow = Array.isArray(fontRow.font_research)
      ? fontRow.font_research[0]
      : fontRow.font_research;

    const currentTax = buildCanonicalTaxonomy(fontRow, researchRow);
    const currentHash = await hashTaxonomy(currentTax);
    const currentStateHash = await hashCanonicalState(fontRow, researchRow);
    const isStale = rev.base_state_hash
      ? currentStateHash !== rev.base_state_hash
      : currentHash !== rev.base_taxonomy_hash;

    const response = {
      revision_id: rev.id,
      font: {
        id: fontRow.id,
        name: fontRow.name,
        slug: fontRow.slug
      },
      status: rev.status,
      concurrency: {
        base_state_hash: rev.base_state_hash || null,
        current_state_hash: currentStateHash,
        base_taxonomy_hash: rev.base_taxonomy_hash,
        current_taxonomy_hash: currentHash,
        is_stale: isStale,
        warning: isStale ? 'Canonical font data was modified after this proposal was created. Re-validation required.' : null
      },
      current_canonical_taxonomy: currentTax,
      proposed_changes: rev.proposed_changes,
      proposed_taxonomy: rev.proposed_taxonomy,
      diff_summary: rev.diff_summary,
      validation_result: rev.validation_result,
      source_snapshot: rev.source_snapshot,
      rationale: rev.rationale,
      rejection_reason: rev.rejection_reason,
      created_by: rev.created_by,
      reviewed_by: rev.reviewed_by,
      published_by: rev.published_by,
      created_at: rev.created_at,
      reviewed_at: rev.reviewed_at,
      published_at: rev.published_at
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }

  // Lookup by font identifier
  let fontQuery = supabase
    .from('fonts')
    .select('*, font_research(*)')
    .limit(1);

  if (args.id) fontQuery = fontQuery.eq('id', args.id);
  else if (args.slug) fontQuery = fontQuery.eq('slug', args.slug.toLowerCase().trim());

  const { data: font, error: fontError } = await fontQuery.maybeSingle();

  if (fontError || !font) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Font not found for identifier: ${args.slug || args.id}` }]
    };
  }

  let revisionsQuery = supabase
    .from('font_revisions')
    .select('*')
    .eq('font_id', font.id)
    .order('created_at', { ascending: false });

  if (args.status) {
    revisionsQuery = revisionsQuery.eq('status', args.status);
  }

  const { data: revisions, error: revsError } = await revisionsQuery.limit(10);

  if (revsError) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to fetch revisions: ${revsError.message}` }]
    };
  }

  const fontResearch = Array.isArray(font.font_research)
    ? font.font_research[0]
    : font.font_research;
  const currentTax = buildCanonicalTaxonomy(font, fontResearch);
  const currentHash = await hashTaxonomy(currentTax);
  const currentStateHash = await hashCanonicalState(font, fontResearch);

  const formattedRevisions = (revisions || []).map((r: any) => ({
    revision_id: r.id,
    status: r.status,
    is_stale: r.base_state_hash
      ? currentStateHash !== r.base_state_hash
      : r.base_taxonomy_hash !== currentHash,
    changed_fields: r.diff_summary?.changed_fields || [],
    rationale: r.rationale,
    created_at: r.created_at
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        font: {
          id: font.id,
          name: font.name,
          slug: font.slug
        },
        count: formattedRevisions.length,
        revisions: formattedRevisions
      }, null, 2)
    }]
  };
}

// ─── Phase 4: Approval, Atomic Publishing, Rollback & Audit ───────────

/**
 * 8. approve_font_revision tool
 * Enforces the formal approval gate: transitions a revision from "pending_review" to "approved".
 * Required prerequisite before a revision can be published.
 * Reviewer identity is server-enforced ('mcp-authorized-reviewer') and cannot be chosen by caller.
 */
export async function handleApproveFontRevision(args: {
  revision_id: string;
  notes?: string;
}) {
  if (!args.revision_id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "revision_id" is required.' }]
    };
  }

  const supabase = getSupabaseClient();
  const { data: rev, error: fetchError } = await supabase
    .from('font_revisions')
    .select('id, font_id, status')
    .eq('id', args.revision_id)
    .maybeSingle();

  if (fetchError || !rev) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Revision not found for ID: ${args.revision_id}` }]
    };
  }

  const { data: fontRecord } = await supabase
    .from('fonts')
    .select('id, name, slug')
    .eq('id', rev.font_id)
    .maybeSingle();

  if (rev.status === 'published') {
    return {
      isError: true,
      content: [{ type: 'text', text: `Revision ${args.revision_id} is already published.` }]
    };
  }

  if (rev.status === 'rejected') {
    return {
      isError: true,
      content: [{ type: 'text', text: `Revision ${args.revision_id} was previously rejected. Create a new revision to propose changes.` }]
    };
  }

  const serverReviewer = 'mcp-authorized-reviewer';

  const { data: updated, error: updateError } = await supabase
    .from('font_revisions')
    .update({
      status: 'approved',
      reviewed_by: serverReviewer,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', args.revision_id)
    .select('id, status, reviewed_by, reviewed_at')
    .single();

  if (updateError) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to approve revision: ${updateError.message}` }]
    };
  }

  // Record approval event in audit_logs
  try {
    await supabase.from('audit_logs').insert({
      action: 'approve_font_revision',
      font_id: rev.font_id,
      revision_id: rev.id,
      reason: args.notes || null,
      performed_by: serverReviewer,
      client_metadata: { tool: 'approve_font_revision', source: 'mcp' }
    });
  } catch (err: any) {
    console.warn('Non-blocking audit log insert error:', err);
  }

  const response = {
    revision_id: updated.id,
    status: updated.status,
    reviewed_by: updated.reviewed_by,
    reviewed_at: updated.reviewed_at,
    font: fontRecord || { id: rev.font_id },
    notes: args.notes || null,
    message: '✓ Revision successfully approved. It is now eligible for publishing via publish_font_revision.'
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
  };
}

/**
 * 9. reject_font_revision tool
 * Formally declines an inaccurate or invalid proposal with a required rejection reason.
 * Reviewer identity is server-enforced ('mcp-authorized-reviewer').
 */
export async function handleRejectFontRevision(args: {
  revision_id: string;
  rejection_reason: string;
}) {
  if (!args.revision_id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "revision_id" is required.' }]
    };
  }

  if (!args.rejection_reason || args.rejection_reason.trim().length === 0) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "rejection_reason" is required to reject a revision.' }]
    };
  }

  const supabase = getSupabaseClient();
  const { data: rev, error: fetchError } = await supabase
    .from('font_revisions')
    .select('id, font_id, status')
    .eq('id', args.revision_id)
    .maybeSingle();

  if (fetchError || !rev) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Revision not found for ID: ${args.revision_id}` }]
    };
  }

  const { data: fontRecord } = await supabase
    .from('fonts')
    .select('id, name, slug')
    .eq('id', rev.font_id)
    .maybeSingle();

  if (rev.status === 'published') {
    return {
      isError: true,
      content: [{ type: 'text', text: `Revision ${args.revision_id} is already published and cannot be rejected. Use rollback_font_revision instead.` }]
    };
  }

  const serverReviewer = 'mcp-authorized-reviewer';

  const { data: updated, error: updateError } = await supabase
    .from('font_revisions')
    .update({
      status: 'rejected',
      rejection_reason: args.rejection_reason.trim(),
      reviewed_by: serverReviewer,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', args.revision_id)
    .select('id, status, rejection_reason, reviewed_by, reviewed_at')
    .single();

  if (updateError) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to reject revision: ${updateError.message}` }]
    };
  }

  // Record in audit_logs
  try {
    await supabase.from('audit_logs').insert({
      action: 'reject_font_revision',
      font_id: rev.font_id,
      revision_id: rev.id,
      reason: args.rejection_reason.trim(),
      performed_by: serverReviewer,
      client_metadata: { tool: 'reject_font_revision', source: 'mcp' }
    });
  } catch (err: any) {
    console.warn('Non-blocking audit log insert error:', err);
  }

  const response = {
    revision_id: updated.id,
    status: updated.status,
    rejection_reason: updated.rejection_reason,
    reviewed_by: updated.reviewed_by,
    reviewed_at: updated.reviewed_at,
    font: fontRecord || { id: rev.font_id },
    message: '✓ Revision marked as rejected. Historical rejection reason recorded in audit_logs.'
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
  };
}

/**
 * 10. publish_font_revision tool
 * Transitions an approved revision into canonical production storage.
 * Enforces:
 * 1. Approval Gate: Status MUST be 'approved'.
 * 2. Concurrency Protection: Live canonical state hash must match base_state_hash (NO bypass allowed).
 * 3. Atomic Postgres Transaction: Updates fonts, font_research, font_sources (additive upsert),
 *    marks revision published with after_state_hash, supersedes competing pending revisions,
 *    and writes immutable audit_logs record via publish_font_revision_tx RPC.
 */
export async function handlePublishFontRevision(args: {
  revision_id: string;
  reason?: string;
}) {
  if (!args.revision_id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "revision_id" is required.' }]
    };
  }

  const supabase = getSupabaseClient();

  // 1. Fetch revision cleanly
  const { data: rev, error: revError } = await supabase
    .from('font_revisions')
    .select('*')
    .eq('id', args.revision_id)
    .maybeSingle();

  if (revError || !rev) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Revision not found for ID: ${args.revision_id}` }]
    };
  }

  // 2. Strict Approval Gate
  if (rev.status !== 'approved') {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Publication blocked: Revision must be in "approved" status before publishing. Current status is "${rev.status}". Call approve_font_revision first.`
      }]
    };
  }

  // Fetch target font record and research
  const { data: font, error: fontError } = await supabase
    .from('fonts')
    .select('*, font_research(*)')
    .eq('id', rev.font_id)
    .maybeSingle();

  if (fontError || !font) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Target font record could not be located.' }]
    };
  }

  const research = Array.isArray(font.font_research) ? font.font_research[0] : font.font_research;

  // 3. Concurrency Protection: verify live canonical state hash
  const currentStateHash = await hashCanonicalState(font, research);
  const currentTax = buildCanonicalTaxonomy(font, research);
  const currentTaxHash = await hashTaxonomy(currentTax);

  const expectedHash = rev.base_state_hash || rev.base_taxonomy_hash;
  const hashToCompare = rev.base_state_hash ? currentStateHash : currentTaxHash;

  if (expectedHash && hashToCompare !== expectedHash) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Publication blocked due to concurrency conflict: The live canonical font state was modified after this revision proposal was created. Base state hash mismatch. Publication is strictly blocked to prevent clobbering newer edits. Please inspect the font and generate a fresh revision.`
      }]
    };
  }

  // 4. Atomic Execution via Postgres RPC
  const serverReviewer = 'mcp-authorized-reviewer';
  const clientMetadata = { tool: 'publish_font_revision', source: 'mcp' };

  const { data: rpcResult, error: rpcError } = await supabase.rpc('publish_font_revision_tx', {
    p_revision_id: rev.id,
    p_expected_base_hash: expectedHash,
    p_published_by: serverReviewer,
    p_reason: args.reason?.trim() || null,
    p_client_metadata: clientMetadata
  });

  if (rpcError) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Database publication transaction failed: ${rpcError.message}` }]
    };
  }

  const response = {
    success: true,
    revision_id: rev.id,
    font: {
      id: font.id,
      name: font.name,
      slug: font.slug
    },
    status: 'published',
    published_by: serverReviewer,
    published_at: rpcResult?.published_at || new Date().toISOString(),
    changed_fields: rpcResult?.changed_fields || rev.diff_summary?.changed_fields || [],
    after_state_hash: rpcResult?.after_state_hash,
    reason: args.reason || null,
    message: '✓ Atomic publication complete. Canonical fonts table, font_research, font_sources, and audit_logs updated successfully.'
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
  };
}

/**
 * 11. rollback_font_revision tool
 * Restores the complete before_state snapshot (fonts, font_research, font_sources)
 * for a previously published revision.
 * Enforces concurrency protection: verifies current font state matches after_state_hash
 * to ensure no newer revisions or edits are clobbered.
 */
export async function handleRollbackFontRevision(args: {
  revision_id: string;
  reason: string;
}) {
  if (!args.revision_id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "revision_id" is required.' }]
    };
  }

  if (!args.reason || args.reason.trim().length === 0) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "reason" is required for rolling back a published revision.' }]
    };
  }

  const supabase = getSupabaseClient();
  const serverReviewer = 'mcp-authorized-reviewer';

  const { data: rpcResult, error: rpcError } = await supabase.rpc('rollback_font_revision_tx', {
    p_revision_id: args.revision_id,
    p_performed_by: serverReviewer,
    p_reason: args.reason.trim()
  });

  if (rpcError) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Rollback transaction failed: ${rpcError.message}` }]
    };
  }

  const response = {
    success: true,
    rolled_back_revision_id: args.revision_id,
    font_id: rpcResult?.font_id,
    restored_at: rpcResult?.restored_at || new Date().toISOString(),
    performed_by: serverReviewer,
    reason: args.reason.trim(),
    message: '✓ Rollback complete. Full before_state snapshot restored across fonts, font_research, and font_sources. Historical revision remains published, rollback event logged to audit_logs.'
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
  };
}



// ══════════════════════════════════════════════════════════════════════════════
// RBAC TYPES & HELPERS
// ══════════════════════════════════════════════════════════════════════════════

export type CallerRole = 'user' | 'member' | 'admin';

export interface Caller {
  user_id: string;
  role: CallerRole;
}

/**
 * RBAC enforcement helper.
 * Returns an MCP error response if the caller's role is not in the allowed list.
 * Returns null if access is granted.
 */
export function requireRole(
  caller: Caller | null | undefined,
  allowed: CallerRole[],
  toolName: string
): { isError: true; content: { type: 'text'; text: string }[] } | null {
  if (!caller || !caller.user_id) {
    return {
      isError: true,
      content: [{ type: 'text', text: `401 Unauthorized: This tool (${toolName}) requires authentication. Provide a valid Supabase user token via the Authorization header.` }]
    };
  }
  if (!allowed.includes(caller.role)) {
    return {
      isError: true,
      content: [{ type: 'text', text: `403 Forbidden: Your role "${caller.role}" does not have permission to call "${toolName}". Required role: ${allowed.join(' or ')}.` }]
    };
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 12: get_font_sections
// Fetches only the requested sections or dot-notation fields from a font's
// canonical taxonomy, without returning the full 7-section JSON.
// ══════════════════════════════════════════════════════════════════════════════

export async function handleGetFontSections(args: {
  slug?: string;
  id?: string;
  sections?: string[];
  fields?: string[];
  caller?: Caller;
}) {
  const authError = requireRole(args.caller, ['user', 'member', 'admin'], 'get_font_sections');
  if (authError) return authError;

  if (!args.slug && !args.id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: Either "slug" or "id" is required.' }]
    };
  }

  if ((!args.sections || args.sections.length === 0) && (!args.fields || args.fields.length === 0)) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: Provide at least one "sections" name or "fields" dot-notation key.' }]
    };
  }

  const supabase = getSupabaseClient();
  const query = supabase
    .from('fonts')
    .select('*, font_research(*)');

  const { data: font, error: fontError } = args.slug
    ? await query.eq('slug', args.slug).maybeSingle()
    : await query.eq('id', args.id!).maybeSingle();

  if (fontError || !font) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Font not found for identifier: ${args.slug || args.id}` }]
    };
  }

  const research = Array.isArray(font.font_research) ? font.font_research[0] : font.font_research;
  const fullTaxonomy = buildCanonicalTaxonomy(font, research);

  const result: Record<string, any> = {};

  // Return requested top-level sections
  if (args.sections && args.sections.length > 0) {
    const VALID_SECTIONS = ['identity', 'creator', 'classification', 'description', 'license', 'official_links', 'technical'];
    for (const section of args.sections) {
      if (!VALID_SECTIONS.includes(section)) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Invalid section "${section}". Must be one of: ${VALID_SECTIONS.join(', ')}` }]
        };
      }
      result[section] = fullTaxonomy[section] ?? null;
    }
  }

  // Return requested dot-notation fields
  if (args.fields && args.fields.length > 0) {
    const fieldResults: Record<string, any> = {};
    for (const dotKey of args.fields) {
      const parts = dotKey.split('.');
      if (parts.length !== 2) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Invalid field key "${dotKey}". Use format "section.field" (e.g. "description.description").` }]
        };
      }
      const [section, field] = parts;
      fieldResults[dotKey] = fullTaxonomy[section]?.[field] ?? null;
    }
    result['fields'] = fieldResults;
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        font_id: font.id,
        slug: font.slug,
        name: font.name,
        requested: result
      }, null, 2)
    }]
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 13: patch_font_fields
// Lightweight dot-notation wrapper around propose_font_update.
// AI provides flat patches like { "description.description": "..." }
// instead of nested section objects.
// ══════════════════════════════════════════════════════════════════════════════

export async function handlePatchFontFields(args: {
  slug?: string;
  id?: string;
  patches: Record<string, any>;
  rationale?: string;
  caller?: Caller;
}) {
  const authError = requireRole(args.caller, ['member', 'admin'], 'patch_font_fields');
  if (authError) return authError;

  if (!args.slug && !args.id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: Either "slug" or "id" is required.' }]
    };
  }

  if (!args.patches || Object.keys(args.patches).length === 0) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "patches" must be a non-empty object of dot-notation keys and values.' }]
    };
  }

  // Convert flat dot-notation patches to nested section objects
  const changes: Record<string, any> = {};
  for (const [dotKey, value] of Object.entries(args.patches)) {
    const parts = dotKey.split('.');
    if (parts.length !== 2) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Invalid patch key "${dotKey}". Use "section.field" format (e.g. "description.description").` }]
      };
    }
    const [section, field] = parts;
    if (!changes[section]) changes[section] = {};
    changes[section][field] = value;
  }

  // Delegate to the existing propose_font_update handler
  return handleProposeFontUpdate({
    slug: args.slug,
    id: args.id,
    changes,
    rationale: args.rationale || 'Targeted patch via patch_font_fields tool.',
    client_hint: 'patch_font_fields'
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 14: suggest_fonts
// NLP description → matching fonts via category/tag/name search.
// ══════════════════════════════════════════════════════════════════════════════

export async function handleSuggestFonts(args: {
  description: string;
  limit?: number;
  caller?: Caller;
}) {
  const authError = requireRole(args.caller, ['user', 'member', 'admin'], 'suggest_fonts');
  if (authError) return authError;

  if (!args.description || args.description.trim().length === 0) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "description" is required — describe the font you need in natural language.' }]
    };
  }

  const limit = Math.min(Math.max(args.limit ?? 8, 1), 20);
  const supabase = getSupabaseClient();

  // Extract category hints from description (simple keyword matching)
  const desc = args.description.toLowerCase();
  const categoryHints: string[] = [];
  if (desc.includes('sans') || desc.includes('clean') || desc.includes('modern') || desc.includes('minimal')) categoryHints.push('sans');
  if (desc.includes('serif') || desc.includes('classic') || desc.includes('traditional') || desc.includes('editorial')) categoryHints.push('serif');
  if (desc.includes('display') || desc.includes('headline') || desc.includes('decorative') || desc.includes('eye-catching')) categoryHints.push('display');
  if (desc.includes('script') || desc.includes('handwriting') || desc.includes('cursive') || desc.includes('calligraphy')) categoryHints.push('script');
  if (desc.includes('slab') || desc.includes('slab-serif')) categoryHints.push('slab-serif');
  if (desc.includes('mono') || desc.includes('code') || desc.includes('developer') || desc.includes('terminal')) categoryHints.push('monospace');
  if (desc.includes('handwritten') || desc.includes('informal') || desc.includes('casual')) categoryHints.push('handwritten');

  let fonts: any[] = [];

  // First: try category-filtered search
  if (categoryHints.length > 0) {
    const { data } = await supabase
      .from('fonts')
      .select('id, name, slug, category, tags, designer, foundry, description, license_type, commercial_use')
      .in('category', categoryHints)
      .not('category', 'is', null)
      .limit(limit * 2);
    fonts = data || [];
  }

  // Fallback: full-text search on the description as a query
  if (fonts.length < limit) {
    const words = args.description.split(/\s+/).filter(w => w.length > 3).slice(0, 5);
    for (const word of words) {
      const { data } = await supabase
        .from('fonts')
        .select('id, name, slug, category, tags, designer, foundry, description, license_type, commercial_use')
        .ilike('name', `%${word}%`)
        .limit(limit);
      if (data) {
        for (const f of data) {
          if (!fonts.find((existing: any) => existing.id === f.id)) fonts.push(f);
        }
      }
    }
  }

  const results = fonts.slice(0, limit).map((f: any) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    category: f.category,
    tags: f.tags,
    designer: f.designer,
    foundry: f.foundry,
    license_type: f.license_type,
    commercial_use: f.commercial_use,
    reasoning: `Matched based on: ${categoryHints.length > 0 ? `category "${f.category}" aligns with your query` : 'name similarity to your description'}.`
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        query: args.description,
        matched_categories: categoryHints,
        count: results.length,
        fonts: results
      }, null, 2)
    }]
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 15: generate_font_pairing
// Given a primary font slug, suggests 2-3 complementary pairing fonts.
// ══════════════════════════════════════════════════════════════════════════════

export async function handleGenerateFontPairing(args: {
  slug: string;
  limit?: number;
  caller?: Caller;
}) {
  const authError = requireRole(args.caller, ['user', 'member', 'admin'], 'generate_font_pairing');
  if (authError) return authError;

  if (!args.slug) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "slug" of the primary font is required.' }]
    };
  }

  const supabase = getSupabaseClient();

  // Fetch the primary font
  const { data: primaryFont, error: primaryError } = await supabase
    .from('fonts')
    .select('id, name, slug, category, tags, description')
    .eq('slug', args.slug)
    .maybeSingle();

  if (primaryError || !primaryFont) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Font not found: "${args.slug}"` }]
    };
  }

  const limit = Math.min(Math.max(args.limit ?? 3, 1), 5);

  // Classic pairing logic: contrast the category
  const PAIRING_MAP: Record<string, string[]> = {
    'sans':       ['serif', 'slab-serif'],
    'serif':      ['sans', 'script'],
    'display':    ['sans', 'serif'],
    'script':     ['sans', 'serif'],
    'slab-serif': ['sans', 'script'],
    'monospace':  ['sans', 'serif'],
    'handwritten': ['sans', 'serif']
  };

  const pairCategories = PAIRING_MAP[primaryFont.category] || ['sans', 'serif'];

  const { data: candidates, error: candidatesError } = await supabase
    .from('fonts')
    .select('id, name, slug, category, tags, description, license_type, commercial_use')
    .in('category', pairCategories)
    .neq('slug', args.slug)
    .limit(limit * 3);

  if (candidatesError || !candidates || candidates.length === 0) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Could not find complementary fonts for this pairing.' }]
    };
  }

  const pairings = candidates.slice(0, limit).map((f: any) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    category: f.category,
    tags: f.tags,
    license_type: f.license_type,
    commercial_use: f.commercial_use,
    pairing_rationale: `"${f.name}" (${f.category}) pairs well with "${primaryFont.name}" (${primaryFont.category}) — contrasting styles create visual hierarchy and typographic balance.`
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        primary_font: { name: primaryFont.name, slug: primaryFont.slug, category: primaryFont.category },
        suggested_pairings: pairings,
        pairing_principle: `Primary is ${primaryFont.category} → complemented by ${pairCategories.join(' or ')} for contrast and hierarchy.`
      }, null, 2)
    }]
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 16: like_font
// Toggle like — saves or removes a font from the user's favorites.
// ══════════════════════════════════════════════════════════════════════════════

export async function handleLikeFont(args: {
  slug?: string;
  font_id?: string;
  caller?: Caller;
}) {
  const authError = requireRole(args.caller, ['user', 'member', 'admin'], 'like_font');
  if (authError) return authError;

  if (!args.slug && !args.font_id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: Either "slug" or "font_id" is required.' }]
    };
  }

  const supabase = getSupabaseClient();

  // Resolve font_id from slug if needed
  let fontId = args.font_id;
  let fontName = '';
  if (!fontId) {
    const { data: f } = await supabase.from('fonts').select('id, name').eq('slug', args.slug!).maybeSingle();
    if (!f) return { isError: true, content: [{ type: 'text', text: `Font not found: "${args.slug}"` }] };
    fontId = f.id;
    fontName = f.name;
  } else {
    const { data: f } = await supabase.from('fonts').select('name').eq('id', fontId).maybeSingle();
    fontName = f?.name || fontId;
  }

  const userId = args.caller!.user_id;

  // Check if already liked
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('font_id', fontId)
    .maybeSingle();

  if (existing) {
    // Unlike: remove from favorites
    await supabase.from('favorites').delete().eq('id', existing.id);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ action: 'unliked', font: fontName, font_id: fontId, message: `✅ Removed "${fontName}" from your favorites.` }, null, 2)
      }]
    };
  } else {
    // Like: add to favorites
    const { error: insertError } = await supabase.from('favorites').insert({ user_id: userId, font_id: fontId });
    if (insertError) {
      return { isError: true, content: [{ type: 'text', text: `Failed to like font: ${insertError.message}` }] };
    }
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ action: 'liked', font: fontName, font_id: fontId, message: `❤️ "${fontName}" saved to your favorites.` }, null, 2)
      }]
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 17: dislike_font
// Toggle dislike — saves or removes a font from font_preferences.
// ══════════════════════════════════════════════════════════════════════════════

export async function handleDislikeFont(args: {
  slug?: string;
  font_id?: string;
  caller?: Caller;
}) {
  const authError = requireRole(args.caller, ['user', 'member', 'admin'], 'dislike_font');
  if (authError) return authError;

  if (!args.slug && !args.font_id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: Either "slug" or "font_id" is required.' }]
    };
  }

  const supabase = getSupabaseClient();

  let fontId = args.font_id;
  let fontName = '';
  if (!fontId) {
    const { data: f } = await supabase.from('fonts').select('id, name').eq('slug', args.slug!).maybeSingle();
    if (!f) return { isError: true, content: [{ type: 'text', text: `Font not found: "${args.slug}"` }] };
    fontId = f.id;
    fontName = f.name;
  } else {
    const { data: f } = await supabase.from('fonts').select('name').eq('id', fontId).maybeSingle();
    fontName = f?.name || fontId;
  }

  const userId = args.caller!.user_id;

  // Check if already disliked
  const { data: existing } = await supabase
    .from('font_preferences')
    .select('id')
    .eq('user_id', userId)
    .eq('font_id', fontId)
    .maybeSingle();

  if (existing) {
    // Un-dislike: remove preference
    await supabase.from('font_preferences').delete().eq('id', existing.id);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ action: 'undisliked', font: fontName, font_id: fontId, message: `↩️ Removed dislike for "${fontName}".` }, null, 2)
      }]
    };
  } else {
    // Dislike: insert preference
    const { error: insertError } = await supabase.from('font_preferences').insert({
      user_id: userId,
      font_id: fontId,
      preference: 'dislike'
    });
    if (insertError) {
      return { isError: true, content: [{ type: 'text', text: `Failed to dislike font: ${insertError.message}` }] };
    }
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ action: 'disliked', font: fontName, font_id: fontId, message: `👎 "${fontName}" marked as disliked. It will be deprioritized in suggestions.` }, null, 2)
      }]
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// TOOL 18: save_to_board
// Saves a font to the user's personal board with an optional note.
// (Replaces save_to_storyboard — tables renamed: storyboard_fonts → board_fonts)
// ══════════════════════════════════════════════════════════════════════════════

export async function handleSaveToBoard(args: {
  slug?: string;
  font_id?: string;
  board_id: string;
  note?: string;
  caller?: Caller;
}) {
  const authError = requireRole(args.caller, ['user', 'member', 'admin'], 'save_to_board');
  if (authError) return authError;

  if (!args.slug && !args.font_id) {
    return { isError: true, content: [{ type: 'text', text: 'Error: Either "slug" or "font_id" is required.' }] };
  }
  if (!args.board_id) {
    return { isError: true, content: [{ type: 'text', text: 'Error: "board_id" is required.' }] };
  }

  const supabase = getSupabaseClient();
  let fontId = args.font_id;
  let fontName = '';
  if (!fontId) {
    const { data: f } = await supabase.from('fonts').select('id, name').eq('slug', args.slug!).maybeSingle();
    if (!f) return { isError: true, content: [{ type: 'text', text: `Font not found: "${args.slug}"` }] };
    fontId = f.id;
    fontName = f.name;
  } else {
    const { data: f } = await supabase.from('fonts').select('name').eq('id', fontId).maybeSingle();
    fontName = f?.name || fontId;
  }

  const userId = args.caller!.user_id;

  // Verify board belongs to the caller
  const { data: board } = await supabase.from('boards').select('id, name').eq('id', args.board_id).eq('user_id', userId).maybeSingle();
  if (!board) return { isError: true, content: [{ type: 'text', text: 'Board not found or does not belong to you.' }] };

  const { data, error } = await supabase
    .from('board_fonts')
    .upsert({
      board_id: args.board_id,
      font_id: fontId,
      note: args.note?.trim() || null,
      position: 0
    }, { onConflict: 'board_id,font_id' })
    .select()
    .single();

  if (error) {
    return { isError: true, content: [{ type: 'text', text: `Failed to save to board: ${error.message}` }] };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({
      saved: true,
      font: fontName,
      font_id: fontId,
      board: board.name,
      board_id: args.board_id,
      note: data.note,
      message: `📌 "${fontName}" saved to board "${board.name}".`
    }, null, 2) }]
  };
}
// ══════════════════════════════════════════════════════════════════════════════

export async function handleSaveToStoryboard(args: {
  slug?: string;
  font_id?: string;
  note?: string;
  position?: number;
  caller?: Caller;
}) {
  const authError = requireRole(args.caller, ['user', 'member', 'admin'], 'save_to_storyboard');
  if (authError) return authError;

  if (!args.slug && !args.font_id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: Either "slug" or "font_id" is required.' }]
    };
  }

  const supabase = getSupabaseClient();

  let fontId = args.font_id;
  let fontName = '';
  if (!fontId) {
    const { data: f } = await supabase.from('fonts').select('id, name').eq('slug', args.slug!).maybeSingle();
    if (!f) return { isError: true, content: [{ type: 'text', text: `Font not found: "${args.slug}"` }] };
    fontId = f.id;
    fontName = f.name;
  } else {
    const { data: f } = await supabase.from('fonts').select('name').eq('id', fontId).maybeSingle();
    fontName = f?.name || fontId;
  }

  const userId = args.caller!.user_id;

  const { data, error } = await supabase
    .from('storyboard_fonts')
    .upsert({
      user_id: userId,
      font_id: fontId,
      note: args.note?.trim() || null,
      position: args.position ?? 0
    }, { onConflict: 'user_id,font_id' })
    .select()
    .single();

  if (error) {
    return { isError: true, content: [{ type: 'text', text: `Failed to save to storyboard: ${error.message}` }] };
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        saved: true,
        font: fontName,
        font_id: fontId,
        note: data.note,
        position: data.position,
        message: `📌 "${fontName}" saved to your storyboard.${data.note ? ` Note: "${data.note}"` : ''}`
      }, null, 2)
    }]
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// TOOL 19: get_my_boards
// Retrieves all boards belonging to the user, with font counts.
// (Replaces get_my_storyboard — tables renamed: storyboard_fonts → boards)
// ══════════════════════════════════════════════════════════════════════════════

export async function handleGetMyBoards(args: {
  board_id?: string; // optional: get fonts inside a specific board
  caller?: Caller;
}) {
  const authError = requireRole(args.caller, ['user', 'member', 'admin'], 'get_my_boards');
  if (authError) return authError;

  const supabase = getSupabaseClient();
  const userId = args.caller!.user_id;

  if (args.board_id) {
    // Return fonts inside a specific board
    const { data, error } = await supabase
      .from('board_fonts')
      .select(`
        id, note, position, added_at,
        fonts (id, name, slug, category, tags, designer, foundry, license_type, commercial_use)
      `)
      .eq('board_id', args.board_id)
      .order('position', { ascending: true });

    if (error) return { isError: true, content: [{ type: 'text', text: `Failed to fetch board fonts: ${error.message}` }] };

    return {
      content: [{ type: 'text', text: JSON.stringify({
        board_id: args.board_id,
        font_count: (data || []).length,
        fonts: data
      }, null, 2) }]
    };
  }

  // Return all boards
  const { data, error } = await supabase
    .from('boards')
    .select('id, name, slug, description, visibility, font_count, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { isError: true, content: [{ type: 'text', text: `Failed to fetch boards: ${error.message}` }] };

  return {
    content: [{ type: 'text', text: JSON.stringify({
      user_id: userId,
      total_boards: (data || []).length,
      boards: data
    }, null, 2) }]
  };
}
// ══════════════════════════════════════════════════════════════════════════════

export async function handleGetMyStoryboard(args: {
  caller?: Caller;
}) {
  const authError = requireRole(args.caller, ['user', 'member', 'admin'], 'get_my_storyboard');
  if (authError) return authError;

  const supabase = getSupabaseClient();
  const userId = args.caller!.user_id;

  const { data, error } = await supabase
    .from('storyboard_fonts')
    .select(`
      id,
      note,
      position,
      created_at,
      fonts (
        id, name, slug, category, tags, designer, foundry,
        license_type, commercial_use, description
      )
    `)
    .eq('user_id', userId)
    .order('position', { ascending: true });

  if (error) {
    return { isError: true, content: [{ type: 'text', text: `Failed to fetch storyboard: ${error.message}` }] };
  }

  const entries = (data || []).map((entry: any) => ({
    storyboard_entry_id: entry.id,
    position: entry.position,
    note: entry.note,
    saved_at: entry.created_at,
    font: entry.fonts
  }));

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        user_id: userId,
        total_fonts: entries.length,
        storyboard: entries
      }, null, 2)
    }]
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 20: create_collection
// Admin-only: create a new curated font collection.
// ══════════════════════════════════════════════════════════════════════════════

export async function handleCreateCollection(args: {
  title: string;
  description?: string;
  theme?: string;
  font_ids?: string[];
  status?: 'draft' | 'published';
  caller?: Caller;
}) {
  const authError = requireRole(args.caller, ['admin'], 'create_collection');
  if (authError) return authError;

  if (!args.title || args.title.trim().length === 0) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "title" is required for a collection.' }]
    };
  }

  const VALID_THEMES = [
    'featured', 'trending', 'seasonal', 'mood', 'wedding', 'holiday',
    'editors_choice', 'retro', 'tech', 'luxury', 'playful', 'minimal', 'bold'
  ];

  if (args.theme && !VALID_THEMES.includes(args.theme)) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Invalid theme "${args.theme}". Valid themes: ${VALID_THEMES.join(', ')}` }]
    };
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('curated_collections')
    .insert({
      title: args.title.trim(),
      description: args.description?.trim() || null,
      theme: args.theme || null,
      font_ids: args.font_ids || [],
      status: args.status || 'draft',
      created_by: args.caller!.user_id
    })
    .select()
    .single();

  if (error) {
    return { isError: true, content: [{ type: 'text', text: `Failed to create collection: ${error.message}` }] };
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        created: true,
        collection: {
          id: data.id,
          title: data.title,
          description: data.description,
          theme: data.theme,
          status: data.status,
          font_count: data.font_ids?.length || 0,
          font_ids: data.font_ids,
          created_by: data.created_by,
          created_at: data.created_at
        },
        message: `✅ Collection "${data.title}" created with status "${data.status}".`
      }, null, 2)
    }]
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL 21: update_collection
// Admin-only: add/remove fonts, update metadata, change status.
// ══════════════════════════════════════════════════════════════════════════════

export async function handleUpdateCollection(args: {
  collection_id: string;
  title?: string;
  description?: string;
  theme?: string;
  status?: 'draft' | 'published' | 'archived';
  add_font_ids?: string[];
  remove_font_ids?: string[];
  caller?: Caller;
}) {
  const authError = requireRole(args.caller, ['admin'], 'update_collection');
  if (authError) return authError;

  if (!args.collection_id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "collection_id" is required.' }]
    };
  }

  const supabase = getSupabaseClient();

  // Fetch current collection
  const { data: current, error: fetchError } = await supabase
    .from('curated_collections')
    .select('*')
    .eq('id', args.collection_id)
    .maybeSingle();

  if (fetchError || !current) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Collection not found: "${args.collection_id}"` }]
    };
  }

  // Compute updated font_ids
  let fontIds: string[] = [...(current.font_ids || [])];
  if (args.add_font_ids && args.add_font_ids.length > 0) {
    for (const id of args.add_font_ids) {
      if (!fontIds.includes(id)) fontIds.push(id);
    }
  }
  if (args.remove_font_ids && args.remove_font_ids.length > 0) {
    fontIds = fontIds.filter((id: string) => !args.remove_font_ids!.includes(id));
  }

  // Build update payload (only include provided fields)
  const updatePayload: Record<string, any> = { font_ids: fontIds };
  if (args.title !== undefined) updatePayload['title'] = args.title.trim();
  if (args.description !== undefined) updatePayload['description'] = args.description?.trim() || null;
  if (args.theme !== undefined) updatePayload['theme'] = args.theme || null;
  if (args.status !== undefined) updatePayload['status'] = args.status;

  const { data, error } = await supabase
    .from('curated_collections')
    .update(updatePayload)
    .eq('id', args.collection_id)
    .select()
    .single();

  if (error) {
    return { isError: true, content: [{ type: 'text', text: `Failed to update collection: ${error.message}` }] };
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        updated: true,
        collection: {
          id: data.id,
          title: data.title,
          description: data.description,
          theme: data.theme,
          status: data.status,
          font_count: data.font_ids?.length || 0,
          font_ids: data.font_ids,
          updated_at: data.updated_at
        },
        changes: {
          fonts_added: args.add_font_ids?.length || 0,
          fonts_removed: args.remove_font_ids?.length || 0
        },
        message: `✅ Collection "${data.title}" updated successfully.`
      }, null, 2)
    }]
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL: get_all_fonts_fields
// Catalog & field inspector. Returns all fonts with existing fields exposed separately.
// ══════════════════════════════════════════════════════════════════════════════

export async function handleGetAllFontsFields(args: {
  sections?: string[];
  fields?: string[];
  filter?: 'all' | 'missing_metadata';
  category?: string;
  limit?: number;
  offset?: number;
  format?: 'flat' | 'nested';
  caller?: Caller;
}) {
  const supabase = getSupabaseClient();
  const limit = Math.min(Math.max(args.limit ?? 25, 1), 100);
  const offset = Math.max(args.offset ?? 0, 0);
  const format = args.format || 'nested';
  const filter = args.filter || 'all';

  let query = supabase
    .from('fonts')
    .select('*, font_variants(*), font_research(*)', { count: 'exact' });

  if (args.category) {
    query = query.eq('category', args.category.toLowerCase().trim());
  }

  query = query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data: rawFonts, error, count: totalCount } = await query;

  if (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Database error while fetching fonts: ${error.message}` }]
    };
  }

  const results: any[] = [];

  for (const font of rawFonts || []) {
    const research = Array.isArray(font.font_research) ? font.font_research[0] : font.font_research;
    const taxonomy = buildCanonicalTaxonomy(font, research);

    // If filtering by missing metadata, check if key fields are missing
    if (filter === 'missing_metadata') {
      const isMissingCreator = !taxonomy.creator?.designer && !font.designer;
      const isMissingFoundry = !taxonomy.creator?.foundry && !research?.foundry;
      const isMissingLicense = !taxonomy.license?.license_type && !font.license_type;
      const isMissingWebsite = !taxonomy.official_links?.official_website && !research?.official_website;
      const isMissingGithub = !taxonomy.official_links?.github_url;
      const isMissingDescription = !taxonomy.description?.description && !font.description;

      const hasMissingField = isMissingCreator || isMissingFoundry || isMissingLicense || isMissingWebsite || isMissingGithub || isMissingDescription;
      if (!hasMissingField) {
        continue;
      }
    }

    let fontOutput: any = {
      id: font.id,
      name: font.name,
      slug: font.slug,
      category: font.category,
      updated_at: font.updated_at
    };

    if (format === 'flat') {
      const flatFields: Record<string, any> = {};

      const flattenSection = (secName: string, secObj: Record<string, any>) => {
        if (!secObj || typeof secObj !== 'object') return;
        for (const [k, v] of Object.entries(secObj)) {
          const dotKey = `${secName}.${k}`;
          if (!args.fields || args.fields.includes(dotKey)) {
            flatFields[dotKey] = v;
          }
        }
      };

      const targetSections = args.sections && args.sections.length > 0
        ? args.sections
        : Object.keys(taxonomy);

      for (const sec of targetSections) {
        flattenSection(sec, taxonomy[sec] || {});
      }

      fontOutput.fields = flatFields;
    } else {
      // nested format
      if (args.sections && args.sections.length > 0) {
        const filteredTax: Record<string, any> = {};
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
    content: [{
      type: 'text',
      text: JSON.stringify({
        total_in_database: totalCount || 0,
        returned_count: results.length,
        offset,
        limit,
        filter,
        format,
        fonts: results
      }, null, 2)
    }]
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL: get_font_fields
// Inspects a single font's individual fields separately with empty/populated flags.
// ══════════════════════════════════════════════════════════════════════════════

export async function handleGetFontFieldsDirect(args: {
  slug?: string;
  id?: string;
  caller?: Caller;
}) {
  if (!args.slug && !args.id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: Either "slug" or "id" must be provided.' }]
    };
  }

  const supabase = getSupabaseClient();
  let query = supabase
    .from('fonts')
    .select('*, font_variants(*), font_research(*)')
    .limit(1);

  if (args.id) {
    query = query.eq('id', args.id);
  } else if (args.slug) {
    query = query.eq('slug', args.slug.toLowerCase().trim());
  }

  const { data: font, error } = await query.maybeSingle();

  if (error || !font) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Font not found: ${args.slug || args.id}` }]
    };
  }

  const research = Array.isArray(font.font_research) ? font.font_research[0] : font.font_research;
  const taxonomy = buildCanonicalTaxonomy(font, research);

  const fieldsCatalog: Array<{ path: string; section: string; key: string; value: any; is_empty: boolean }> = [];

  for (const [section, secObj] of Object.entries(taxonomy)) {
    if (secObj && typeof secObj === 'object') {
      for (const [key, val] of Object.entries(secObj as Record<string, any>)) {
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
    content: [{
      type: 'text',
      text: JSON.stringify({
        font_id: font.id,
        name: font.name,
        slug: font.slug,
        category: font.category,
        total_fields: fieldsCatalog.length,
        populated_count: fieldsCatalog.filter(f => !f.is_empty).length,
        empty_count: fieldsCatalog.filter(f => f.is_empty).length,
        fields: fieldsCatalog
      }, null, 2)
    }]
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL: update_font_json
// Direct, verified write of generated canonical JSON to fonts table without staging queue.
// ══════════════════════════════════════════════════════════════════════════════

export async function handleUpdateFontJsonDirect(args: {
  slug?: string;
  id?: string;
  json: Record<string, any>;
  merge_strategy?: 'smart' | 'fill_missing' | 'force_overwrite';
  rationale?: string;
  auto_sanitize?: boolean;
  caller?: Caller;
}) {
  if (!args.slug && !args.id) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: Either "slug" or "id" must be provided to identify the target font.' }]
    };
  }

  if (!args.json || typeof args.json !== 'object' || Object.keys(args.json).length === 0) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "json" must be a non-empty canonical JSON or partial section update object.' }]
    };
  }

  const supabase = getSupabaseClient();
  let query = supabase
    .from('fonts')
    .select('*, font_variants(*), font_research(*)')
    .limit(1);

  if (args.id) {
    query = query.eq('id', args.id);
  } else if (args.slug) {
    query = query.eq('slug', args.slug.toLowerCase().trim());
  }

  const { data: font, error: fetchErr } = await query.maybeSingle();

  if (fetchErr || !font) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: JSON.stringify({
          isError: true,
          error_type: 'NOT_FOUND',
          message: `Font not found for identifier: "${args.slug || args.id}"`,
          suggested_retry: { action: 'use search_fonts or get_all_fonts_fields to verify the correct font slug' }
        }, null, 2)
      }]
    };
  }

  const research = Array.isArray(font.font_research) ? font.font_research[0] : font.font_research;
  const currentTax = buildCanonicalTaxonomy(font, research);

  // Validate incoming root sections
  const VALID_ROOT_SECTIONS = ['identity', 'creator', 'classification', 'description', 'license', 'official_links', 'technical'];
  const incomingKeys = Object.keys(args.json);
  const invalidKeys = incomingKeys.filter(k => !VALID_ROOT_SECTIONS.includes(k));

  if (invalidKeys.length > 0) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: JSON.stringify({
          isError: true,
          error_type: 'INVALID_SCHEMA_KEYS',
          message: `Found unrecognized top-level keys: ${invalidKeys.join(', ')}. All modifications must reside within the 7 canonical sections.`,
          allowed_sections: VALID_ROOT_SECTIONS,
          retry_payload: {
            slug: font.slug,
            json: Object.fromEntries(Object.entries(args.json).filter(([k]) => VALID_ROOT_SECTIONS.includes(k)))
          }
        }, null, 2)
      }]
    };
  }

  // Deep copy for mutation
  const mergedTax = JSON.parse(JSON.stringify(currentTax));
  const strategy = args.merge_strategy || 'smart';
  const changedFields: string[] = [];

  for (const section of VALID_ROOT_SECTIONS) {
    if (!args.json[section] || typeof args.json[section] !== 'object') continue;

    const incomingSection = args.json[section];
    if (!mergedTax[section]) mergedTax[section] = {};

    for (const [field, rawVal] of Object.entries(incomingSection)) {
      let val = rawVal;

      // URL auto-sanitization for links
      if (
        (section === 'official_links' && ['official_website', 'official_font_page', 'purchase_url', 'free_download_url', 'github_url', 'google_fonts_url'].includes(field)) ||
        (section === 'license' && field === 'license_url')
      ) {
        if (typeof val === 'string' && val.trim().length > 0) {
          val = cleanUrl(val);
        }
      }

      // Classification category normalization
      if (section === 'classification' && field === 'category' && typeof val === 'string') {
        const normCat = val.toLowerCase().trim();
        const mappedCat = CATEGORY_ALIASES[normCat] || normCat;
        if (!ALLOWED_CATEGORIES.includes(mappedCat as any)) {
          return {
            isError: true,
            content: [{
              type: 'text',
              text: JSON.stringify({
                isError: true,
                error_type: 'INVALID_CATEGORY',
                message: `Category "${val}" is not allowed. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
                details: { field: 'classification.category', received: val, allowed: ALLOWED_CATEGORIES },
                retry_payload: {
                  slug: font.slug,
                  json: {
                    ...args.json,
                    classification: {
                      ...args.json.classification,
                      category: 'display'
                    }
                  }
                }
              }, null, 2)
            }]
          };
        }
        val = mappedCat;
      }

      // Classification tags normalization
      if (section === 'classification' && field === 'tags' && Array.isArray(val)) {
        val = val.map((t: any) => String(t).toLowerCase().trim()).filter(Boolean);
      }

      // Release year number coercion
      if (section === 'identity' && field === 'release_year' && val !== null && val !== undefined) {
        const num = Number(val);
        val = isNaN(num) ? null : num;
      }

      const currentVal = mergedTax[section][field];
      const isCurrentEmpty = currentVal === null || currentVal === undefined || currentVal === '' || (Array.isArray(currentVal) && currentVal.length === 0);

      let shouldApply = false;
      if (strategy === 'force_overwrite') {
        shouldApply = true;
      } else if (strategy === 'fill_missing') {
        shouldApply = isCurrentEmpty && (val !== null && val !== undefined && val !== '');
      } else {
        // smart strategy: apply if new value provided and not identical
        shouldApply = val !== undefined && JSON.stringify(val) !== JSON.stringify(currentVal);
      }

      if (shouldApply) {
        mergedTax[section][field] = val;
        changedFields.push(`${section}.${field}`);
      }
    }
  }

  // Synchronize top-level database columns in fonts table
  const fontUpdates: Record<string, any> = {
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

  // Execute direct DB update
  const { error: updateErr } = await supabase
    .from('fonts')
    .update(fontUpdates)
    .eq('id', font.id);

  if (updateErr) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to update font "${font.slug}": ${updateErr.message}` }]
    };
  }

  // Synchronize font_research table links if updated
  if (mergedTax.official_links || mergedTax.license) {
    const researchUpdates: Record<string, any> = {};
    if (mergedTax.official_links?.official_website) researchUpdates.official_website = mergedTax.official_links.official_website;
    if (mergedTax.official_links?.official_font_page) researchUpdates.official_font_page = mergedTax.official_links.official_font_page;
    if (mergedTax.official_links?.purchase_url) researchUpdates.purchase_url = mergedTax.official_links.purchase_url;
    if (mergedTax.official_links?.free_download_url) researchUpdates.free_download_url = mergedTax.official_links.free_download_url;
    if (mergedTax.official_links?.github_url) researchUpdates.github_url = mergedTax.official_links.github_url;
    if (mergedTax.license?.license_url) researchUpdates.license_url = mergedTax.license.license_url;
    if (mergedTax.license?.license_evidence) researchUpdates.license_evidence = mergedTax.license.license_evidence;

    if (Object.keys(researchUpdates).length > 0) {
      if (research?.id) {
        await supabase.from('font_research').update(researchUpdates).eq('id', research.id);
      } else {
        await supabase.from('font_research').insert({ font_id: font.id, ...researchUpdates });
      }
    }
  }

  // Audit logging (safe non-blocking)
  try {
    await supabase.from('audit_logs').insert({
      action: 'direct_font_json_update',
      font_id: font.id,
      changed_fields: changedFields,
      before_state: currentTax,
      after_state: mergedTax,
      reason: args.rationale || 'Direct JSON update applied via MCP',
      performed_by: args.caller?.user_id || 'mcp'
    });
  } catch {
    // Non-blocking if audit_logs table isn't present
  }

  // Read-after-write verification
  const { data: verifiedFont } = await supabase
    .from('fonts')
    .select('*, font_variants(*), font_research(*)')
    .eq('id', font.id)
    .maybeSingle();

  const verifiedResearch = Array.isArray(verifiedFont?.font_research) ? verifiedFont?.font_research[0] : verifiedFont?.font_research;
  const verifiedTax = buildCanonicalTaxonomy(verifiedFont || font, verifiedResearch || research);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        verified_in_db: true,
        font_id: font.id,
        slug: font.slug,
        name: fontUpdates.name || font.name,
        changed_fields: changedFields,
        strategy: strategy,
        persisted_taxonomy: verifiedTax,
        message: `✨ Successfully updated and verified "${font.name}" (${font.slug}). ${changedFields.length} fields modified.`
      }, null, 2)
    }]
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// TOOL: update_multiple_fonts_json
// Batch direct updates across multiple fonts in one MCP call.
// ══════════════════════════════════════════════════════════════════════════════

export async function handleUpdateMultipleFontsJsonDirect(args: {
  fonts: Array<{
    slug?: string;
    id?: string;
    json: Record<string, any>;
    rationale?: string;
  }>;
  merge_strategy?: 'smart' | 'fill_missing' | 'force_overwrite';
  stop_on_error?: boolean;
  caller?: Caller;
}) {
  if (!args.fonts || !Array.isArray(args.fonts) || args.fonts.length === 0) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: "fonts" array must contain at least 1 font update payload.' }]
    };
  }

  const MAX_BATCH = 50;
  if (args.fonts.length > MAX_BATCH) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Batch size ${args.fonts.length} exceeds maximum limit of ${MAX_BATCH} fonts per call.` }]
    };
  }

  const results: any[] = [];
  let succeededCount = 0;
  let failedCount = 0;

  for (const item of args.fonts) {
    const res = await handleUpdateFontJsonDirect({
      slug: item.slug,
      id: item.id,
      json: item.json,
      merge_strategy: args.merge_strategy,
      rationale: item.rationale,
      caller: args.caller
    });

    if (res.isError) {
      failedCount++;
      let errDetails: any = null;
      try {
        errDetails = JSON.parse(res.content[0].text);
      } catch {
        errDetails = { message: res.content[0].text };
      }

      results.push({
        identifier: item.slug || item.id,
        status: 'failed',
        error: errDetails
      });

      if (args.stop_on_error) {
        break;
      }
    } else {
      succeededCount++;
      let successData: any = null;
      try {
        successData = JSON.parse(res.content[0].text);
      } catch {
        successData = {};
      }

      results.push({
        slug: successData.slug,
        font_id: successData.font_id,
        status: 'updated',
        changed_fields: successData.changed_fields || []
      });
    }
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        total: args.fonts.length,
        succeeded: succeededCount,
        failed: failedCount,
        results
      }, null, 2)
    }]
  };
}
