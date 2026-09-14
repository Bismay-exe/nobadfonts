// fontMetadataExtractor.ts
// Robust, strictly scoped OpenType parser for typography provenance, technical metrics, and layout features.
// Adheres strictly to typographic standards:
// 1. Derives language/script coverage directly from cmap character mappings (never defaults to Latin).
// 2. Supports TTF, OTF, WOFF, and WOFF2 (via WASM decompression).
// 3. Strict, regex-bounded license heuristics (never defaults to personal_use = true).
// 4. Extracts subfamily, full_name, width_hint, and is_variable (fvar table).
// 5. Inspects both GSUB and GPOS feature tables and detects kerning (kern table or GPOS kern feature).
// 6. Tooling/manufacturer metadata is strictly labeled as detected hints, never as verified foundry/publisher.
// 7. Head table created timestamp is exposed as font_file_created_at, never as release_year.

import { runWoff2Decompress } from './woff2';

export interface ExtractedFontMetadata {
    // Identity
    name?: string;
    full_name?: string;
    family_name?: string;
    subfamily_name?: string;
    version?: string;
    postscript_name?: string;
    font_file_created_at?: string; // File compile timestamp only, NEVER assumed to be original release year

    // Creator & Tooling Hints (Note: manufacturer is tooling/vendor metadata, NOT verified foundry/publisher)
    designer?: string;
    detected_manufacturer?: string;
    detected_designer_url?: string;
    detected_manufacturer_url?: string;
    detected_copyright?: string;

    // Description
    description?: string;

    // License Hints (heuristic only, never defaults to permissions without proof)
    detected_license_text?: string;
    detected_license_url?: string;
    suggested_distribution_status?: 'open_source' | 'free' | 'demo' | 'paid' | 'unknown';
    suggested_license_type?: string;
    suggested_commercial_use?: boolean;
    suggested_personal_use?: boolean;

    // Technical Metrics (Exact Binary Analysis)
    glyph_count?: number;
    opentype_features?: string[];
    has_kerning?: boolean;
    is_variable?: boolean;
    weight_hint?: number;
    width_hint?: number;
    width_label?: string;
    is_italic_hint?: boolean;
    detected_languages?: string[]; // Derived from cmap code points

    // Provenance Audit Map
    metadata_sources?: Record<string, 'opentype' | 'heuristic' | 'manual'>;
}

const WIDTH_LABELS: Record<number, string> = {
    1: 'Ultra-condensed',
    2: 'Extra-condensed',
    3: 'Condensed',
    4: 'Semi-condensed',
    5: 'Normal',
    6: 'Semi-expanded',
    7: 'Expanded',
    8: 'Extra-expanded',
    9: 'Ultra-expanded',
};

/**
 * Derives accurate language & script coverage by analyzing Unicode code points
 * present in the font's character map (cmap table).
 */
function detectScriptsFromCmap(glyphIndexMap: Record<number, number>): string[] {
    const scripts: string[] = [];
    if (!glyphIndexMap) return scripts;

    const codePoints = Object.keys(glyphIndexMap).map(Number);
    if (codePoints.length === 0) return scripts;

    let latinCount = 0;
    let latinExtCount = 0;
    let cyrillicCount = 0;
    let greekCount = 0;
    let arabicCount = 0;
    let hebrewCount = 0;
    let devanagariCount = 0;
    let cjkCount = 0;
    let hangulCount = 0;
    let thaiCount = 0;

    for (const cp of codePoints) {
        // Basic Latin (A-Z, a-z)
        if ((cp >= 0x0041 && cp <= 0x005A) || (cp >= 0x0061 && cp <= 0x007A)) {
            latinCount++;
        }
        // Latin-1 Supplement & Extended (Accented letters)
        else if ((cp >= 0x00C0 && cp <= 0x024F)) {
            latinExtCount++;
        }
        // Cyrillic
        else if (cp >= 0x0400 && cp <= 0x052F) {
            cyrillicCount++;
        }
        // Greek
        else if (cp >= 0x0370 && cp <= 0x03FF) {
            greekCount++;
        }
        // Arabic
        else if (cp >= 0x0600 && cp <= 0x06FF) {
            arabicCount++;
        }
        // Hebrew
        else if (cp >= 0x0590 && cp <= 0x05FF) {
            hebrewCount++;
        }
        // Devanagari
        else if (cp >= 0x0900 && cp <= 0x097F) {
            devanagariCount++;
        }
        // CJK / Japanese / Chinese
        else if ((cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0x3040 && cp <= 0x30FF)) {
            cjkCount++;
        }
        // Hangul
        else if (cp >= 0xAC00 && cp <= 0xD7AF) {
            hangulCount++;
        }
        // Thai
        else if (cp >= 0x0E00 && cp <= 0x0E7F) {
            thaiCount++;
        }
    }

    // Only assert a script if a meaningful alphabet threshold is reached
    if (latinCount >= 20) scripts.push('Latin');
    if (latinExtCount >= 15) scripts.push('Latin Extended');
    if (cyrillicCount >= 15) scripts.push('Cyrillic');
    if (greekCount >= 15) scripts.push('Greek');
    if (arabicCount >= 15) scripts.push('Arabic');
    if (hebrewCount >= 15) scripts.push('Hebrew');
    if (devanagariCount >= 15) scripts.push('Devanagari');
    if (cjkCount >= 20) scripts.push('CJK (Chinese/Japanese)');
    if (hangulCount >= 20) scripts.push('Hangul (Korean)');
    if (thaiCount >= 15) scripts.push('Thai');

    return scripts;
}

/**
 * Extracts technical and descriptive OpenType records from TTF, OTF, WOFF, or WOFF2.
 */
export async function extractRichFontMetadata(file: File): Promise<ExtractedFontMetadata> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const supportedExtensions = ['ttf', 'otf', 'woff', 'woff2'];

    if (!extension || !supportedExtensions.includes(extension)) {
        return {};
    }

    try {
        let rawBuffer = await file.arrayBuffer();

        // If WOFF2, decompress to standard TTF/OTF bytes first
        if (extension === 'woff2') {
            try {
                const decompressed = await runWoff2Decompress(new Uint8Array(rawBuffer));
                rawBuffer = decompressed.buffer as ArrayBuffer;
            } catch (woff2Err) {
                console.warn('Could not decompress WOFF2 file for OpenType extraction:', woff2Err);
                return {};
            }
        }

        const opentype = await import('opentype.js');
        const parsedFont = opentype.parse(rawBuffer);

        if (!parsedFont) {
            return {};
        }

        const names = parsedFont.names || {};
        const sources: Record<string, 'opentype' | 'heuristic' | 'manual'> = {};

        // Helper to extract localized english or first string
        const getLocalized = (field: any): string => {
            if (!field) return '';
            if (typeof field === 'string') return field.trim();
            if (typeof field === 'object') {
                const val = field.en || Object.values(field)[0];
                return typeof val === 'string' ? val.trim() : '';
            }
            return '';
        };

        const full_name = getLocalized(names.fullName);
        const family_name = getLocalized(names.fontFamily);
        const subfamily_name = getLocalized(names.fontSubfamily);
        const name = full_name || family_name;
        const version = getLocalized(names.version);
        const postscript_name = getLocalized(names.postScriptName);
        const designer = getLocalized(names.designer);
        const detected_manufacturer = getLocalized(names.manufacturer);
        const detected_designer_url = getLocalized(names.designerURL);
        const detected_manufacturer_url = getLocalized(names.manufacturerURL);
        const detected_copyright = getLocalized(names.copyright);
        const description = getLocalized(names.description);
        const detected_license_text = getLocalized(names.license);
        const detected_license_url = getLocalized(names.licenseURL);

        if (name) sources.name = 'opentype';
        if (family_name) sources.family_name = 'opentype';
        if (designer) sources.designer = 'opentype';
        if (detected_manufacturer) sources.detected_manufacturer = 'opentype';

        // Technical metrics (exact)
        const glyph_count = parsedFont.numGlyphs || (parsedFont.glyphs ? parsedFont.glyphs.length : undefined);
        if (glyph_count !== undefined) sources.glyph_count = 'opentype';

        // Inspect both GSUB (Substitution) and GPOS (Positioning) layout feature tables
        const featuresSet = new Set<string>();
        if (parsedFont.tables?.gsub?.features) {
            for (const feat of parsedFont.tables.gsub.features) {
                if (feat.tag && typeof feat.tag === 'string') featuresSet.add(feat.tag.trim());
            }
        }
        if (parsedFont.tables?.gpos?.features) {
            for (const feat of parsedFont.tables.gpos.features) {
                if (feat.tag && typeof feat.tag === 'string') featuresSet.add(feat.tag.trim());
            }
        }
        const opentype_features = Array.from(featuresSet);

        // Kerning detection (either in GPOS features or legacy kern table)
        const has_kerning = featuresSet.has('kern') || Boolean(parsedFont.tables?.kern);

        // Variable Font detection (fvar table)
        const is_variable = Boolean(parsedFont.tables?.fvar);

        // OS/2 table metrics (Weights & Widths)
        const os2 = parsedFont.tables?.os2;
        const weight_hint = os2?.usWeightClass || undefined;
        const width_hint = os2?.usWidthClass || undefined;
        const width_label = width_hint ? WIDTH_LABELS[width_hint] : undefined;

        const is_italic_hint = Boolean(
            (os2?.fsSelection && (os2.fsSelection & 1)) ||
            (parsedFont.tables?.head?.macStyle && (parsedFont.tables.head.macStyle & 2)) ||
            /italic|oblique/i.test(subfamily_name || name || '')
        );

        // File compile date (from head table, NEVER release_year)
        let font_file_created_at: string | undefined = undefined;
        if (parsedFont.tables?.head?.created) {
            try {
                // OpenType timestamps are seconds since January 1, 1904 UTC
                const opentypeEpochOffset = 2082844800000;
                const date = new Date((parsedFont.tables.head.created * 1000) - opentypeEpochOffset);
                if (!isNaN(date.getTime()) && date.getFullYear() > 1980 && date.getFullYear() < 2035) {
                    font_file_created_at = date.toISOString();
                }
            } catch {
                // Ignore timestamp parse errors
            }
        }

        // Language & Script derivation from cmap (character mapping table)
        const cmap = parsedFont.tables?.cmap?.glyphIndexMap || {};
        const detected_languages = detectScriptsFromCmap(cmap);

        // Strict License Heuristics (Regex bounded, NO false defaults)
        let suggested_distribution_status: ExtractedFontMetadata['suggested_distribution_status'] = undefined;
        let suggested_license_type: string | undefined = undefined;
        let suggested_commercial_use: boolean | undefined = undefined;
        let suggested_personal_use: boolean | undefined = undefined; // NEVER default to true without proof!

        const licenseCombined = `${detected_license_text} ${detected_license_url}`.trim();

        if (licenseCombined) {
            // SIL OFL
            if (/\b(?:ofl|open\s+font\s+license)\b/i.test(licenseCombined)) {
                suggested_distribution_status = 'open_source';
                suggested_license_type = 'SIL Open Font License (OFL 1.1)';
                suggested_commercial_use = true;
                suggested_personal_use = true;
                sources.license = 'heuristic';
            }
            // Apache
            else if (/\bapache\s*(?:license|2\.0)?\b/i.test(licenseCombined)) {
                suggested_distribution_status = 'open_source';
                suggested_license_type = 'Apache 2.0';
                suggested_commercial_use = true;
                suggested_personal_use = true;
                sources.license = 'heuristic';
            }
            // MIT
            else if (/\bmit\s+license\b/i.test(licenseCombined)) {
                suggested_distribution_status = 'open_source';
                suggested_license_type = 'MIT License';
                suggested_commercial_use = true;
                suggested_personal_use = true;
                sources.license = 'heuristic';
            }
            // CC0 / Public Domain
            else if (/\b(?:cc0|public\s+domain)\b/i.test(licenseCombined)) {
                suggested_distribution_status = 'open_source';
                suggested_license_type = '100% Free / Public Domain (CC0)';
                suggested_commercial_use = true;
                suggested_personal_use = true;
                sources.license = 'heuristic';
            }
            // Free for Personal Use Only
            else if (/\b(?:personal\s+use(?:\s+only)?|non-?commercial)\b/i.test(licenseCombined)) {
                suggested_distribution_status = 'free';
                suggested_license_type = 'Free for Personal Use Only';
                suggested_commercial_use = false;
                suggested_personal_use = true;
                sources.license = 'heuristic';
            }
            // Demo / Trial / Donationware
            else if (/\b(?:demo|trial|evaluation|donationware)\b/i.test(licenseCombined)) {
                suggested_distribution_status = 'demo';
                suggested_license_type = 'Freeware / Demo / Donationware';
                suggested_commercial_use = false;
                suggested_personal_use = true;
                sources.license = 'heuristic';
            }
        }

        return {
            name: name || undefined,
            full_name: full_name || undefined,
            family_name: family_name || undefined,
            subfamily_name: subfamily_name || undefined,
            version: version || undefined,
            postscript_name: postscript_name || undefined,
            font_file_created_at,
            designer: designer || undefined,
            detected_manufacturer: detected_manufacturer || undefined,
            detected_designer_url: detected_designer_url || undefined,
            detected_manufacturer_url: detected_manufacturer_url || undefined,
            detected_copyright: detected_copyright || undefined,
            description: description || undefined,
            detected_license_text: detected_license_text || undefined,
            detected_license_url: detected_license_url || undefined,
            suggested_distribution_status,
            suggested_license_type,
            suggested_commercial_use,
            suggested_personal_use,
            glyph_count,
            opentype_features: opentype_features.length > 0 ? opentype_features : undefined,
            has_kerning,
            is_variable,
            weight_hint,
            width_hint,
            width_label,
            is_italic_hint,
            detected_languages: detected_languages.length > 0 ? detected_languages : undefined,
            metadata_sources: sources,
        };
    } catch (err) {
        console.warn('Failed to extract OpenType metadata:', err);
        return {};
    }
}
