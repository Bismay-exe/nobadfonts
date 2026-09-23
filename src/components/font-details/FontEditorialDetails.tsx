import { Check, X, ExternalLink, Globe, Handbag, Download, Cat } from 'lucide-react';
import type { Font } from '../../types/font';
import type { Database } from '../../types/database.types';
import { generateDescription } from '../../utils/fontDescriptionGenerator';
import { cleanUrl, formatUrlForDisplay } from '../../utils/urlHelper';

type FontResearchRow = Database['public']['Tables']['font_research']['Row'];

interface FontEditorialDetailsProps {
    font: Font;
    research?: FontResearchRow | null;
}

export default function FontEditorialDetails({ font, research }: FontEditorialDetailsProps) {
    // Extract structured taxonomy and detected metadata
    const extracted = (research?.font_metadata_extracted as any) || {};
    const taxonomy = extracted?.taxonomy || {};

    const fontName = taxonomy?.identity?.name || font.name || 'Untitled Typeface';
    const designer = taxonomy?.creator?.designer || font.designer || 'Unknown Designer';
    const foundry = taxonomy?.creator?.foundry || research?.foundry || null;
    const releaseYear = taxonomy?.identity?.release_year
        ? String(taxonomy.identity.release_year)
        : (font.created_at ? new Date(font.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null);
    const version = taxonomy?.identity?.version || extracted?.version || '1.000';

    // 1. Description
    const descriptionText = taxonomy?.description?.description
        || research?.ai_description
        || font.description
        || generateDescription(font);

    // 2. History & Background
    const defaultHistory = font.designer
        ? `Designed by ${font.designer}${foundry ? ` (${foundry})` : ''}${releaseYear ? ` and released in ${releaseYear}` : ''} as a high-character digital typeface asset.`
        : null;

    const historyText = taxonomy?.description?.history || defaultHistory;

    // 3. Design Characteristics
    const defaultCharacteristics = font.category
        ? `Features distinct ${font.category.toLowerCase()} construction, optical weight distribution, tactile stroke nuance, and balanced metrics across ${font.glyph_count || 'standard'} character glyphs.`
        : null;

    const characteristicsText = taxonomy?.description?.characteristics || defaultCharacteristics;

    // 4. Character Traits
    let traits: string[] = [];
    if (Array.isArray(taxonomy?.classification?.mood) && taxonomy.classification.mood.length > 0) {
        traits = taxonomy.classification.mood.map((t: string) => t.toUpperCase().trim());
    } else if (typeof taxonomy?.classification?.mood === 'string' && taxonomy.classification.mood.trim()) {
        traits = taxonomy.classification.mood.split(/[,·•|]/).map((s: string) => s.trim().toUpperCase()).filter(Boolean);
    } else if (font.tags && font.tags.length > 0) {
        traits = font.tags.slice(0, 8).map(t => t.toUpperCase());
    } else {
        traits = ['TACTILE', 'EXPRESSIVE', 'BALANCED', 'DISTINCT', 'MODERN', 'VERSATILE'];
    }

    // Pad traits nicely up to an even number if feasible
    if (traits.length % 2 !== 0 && traits.length < 8) {
        traits.push('EDITORIAL');
    }

    // 5. Technical Details
    const category = taxonomy?.classification?.category || font.category || 'Display';
    const style = taxonomy?.classification?.style
        || taxonomy?.classification?.subcategory
        || (font.tags?.[0] ? font.tags[0].charAt(0).toUpperCase() + font.tags[0].slice(1) : 'Regular');

    let formatsString = 'OTF · TTF';
    if (Array.isArray(taxonomy?.technical?.formats) && taxonomy.technical.formats.length > 0) {
        formatsString = taxonomy.technical.formats.map((f: string) => f.toUpperCase()).join(' · ');
    } else if (font.font_variants && font.font_variants.length > 0) {
        const detected = new Set<string>();
        font.font_variants.forEach(v => {
            if (v.woff2_url) detected.add('WOFF2');
            if (v.woff_url) detected.add('WOFF');
            if (v.otf_url) detected.add('OTF');
            if (v.ttf_url) detected.add('TTF');
        });
        if (detected.size > 0) formatsString = Array.from(detected).join(' · ');
    }

    let languageString = 'English · Basic Latin';
    if (Array.isArray(taxonomy?.technical?.languages) && taxonomy.technical.languages.length > 0) {
        languageString = taxonomy.technical.languages.join(' · ');
    } else if (Array.isArray(extracted?.detected_languages) && extracted.detected_languages.length > 0) {
        languageString = extracted.detected_languages.join(' · ');
    }

    const glyphCount = taxonomy?.technical?.glyph_count || extracted?.glyph_count || font.glyph_count || 92;

    // 6. Classification & Tags
    const subcategory = taxonomy?.classification?.subcategory || '';
    const classificationItems = [category, subcategory, style]
        .filter(Boolean)
        .filter((item, index, self) => self.indexOf(item) === index);

    const defaultTags = font.tags || [];
    const tagsList: string[] = Array.isArray(taxonomy?.classification?.tags) && taxonomy.classification.tags.length > 0
        ? taxonomy.classification.tags
        : defaultTags;

    const moodItems: string[] = Array.isArray(taxonomy?.classification?.mood) && taxonomy.classification.mood.length > 0
        ? taxonomy.classification.mood
        : (typeof taxonomy?.classification?.mood === 'string' && taxonomy.classification.mood.trim()
            ? taxonomy.classification.mood.split(/[,·•|]/).map((s: string) => s.trim()).filter(Boolean)
            : traits.map(t => t.charAt(0) + t.slice(1).toLowerCase()));

    // 7. Recommended Uses
    let usesList: string[] = [];
    if (Array.isArray(taxonomy?.classification?.recommended_uses) && taxonomy.classification.recommended_uses.length > 0) {
        usesList = taxonomy.classification.recommended_uses;
    } else if (typeof taxonomy?.classification?.recommended_uses === 'string' && taxonomy.classification.recommended_uses.trim()) {
        usesList = taxonomy.classification.recommended_uses.split(/[,·•|]/).map((s: string) => s.trim()).filter(Boolean);
    } else {
        usesList = ['Headlines', 'Editorial', 'Branding', 'Display', 'Posters'];
    }

    // 8. Licensing & Permissions Matrix
    const licenseType = taxonomy?.license?.license_type || research?.license_type_verified || font.license_type || 'Personal Use Only';
    const isCommercialAllowed = taxonomy?.license?.commercial_use ?? (font.commercial_use ?? false);
    const isPersonalAllowed = taxonomy?.license?.personal_use ?? true;
    const isModificationAllowed = taxonomy?.license?.modification_allowed ?? (
        licenseType.toLowerCase().includes('ofl') ||
        licenseType.toLowerCase().includes('cc0') ||
        licenseType.toLowerCase().includes('100% free')
    );
    const isRedistributionAllowed = taxonomy?.license?.redistribution_allowed ?? (
        licenseType.toLowerCase().includes('ofl') ||
        licenseType.toLowerCase().includes('cc0')
    );

    const distributionStatus = taxonomy?.license?.distribution_status
        ? taxonomy.license.distribution_status.replace(/_/g, ' ').toUpperCase()
        : (isCommercialAllowed ? 'FREE & OPEN SOURCE' : 'PERSONAL USE ONLY');

    const licenseEvidence = taxonomy?.license?.license_evidence || null;
    const licenseUrl = cleanUrl(taxonomy?.license?.license_url || research?.license_url);

    // 9. Official Links
    const rawLinks = [
        {
            label: 'Official Website',
            url: cleanUrl(taxonomy?.official_links?.official_website || research?.official_website),
            icon: Globe,
            desc: 'Creator or Foundry storefront'
        },
        {
            label: 'Official Font Page',
            url: cleanUrl(taxonomy?.official_links?.official_font_page || research?.official_font_page),
            icon: ExternalLink,
            desc: 'Official release specimen page'
        },
        {
            label: 'Purchase License',
            url: cleanUrl(taxonomy?.official_links?.purchase_url || research?.purchase_url),
            icon: Handbag,
            desc: 'Commercial licenses and upgrades'
        },
        {
            label: 'License Terms',
            url: cleanUrl(licenseUrl),
            icon: ExternalLink,
            desc: 'Official licensing terms and usage permissions'
        },
        {
            label: 'Free Download',
            url: cleanUrl(taxonomy?.official_links?.free_download_url || research?.free_download_url),
            icon: Download,
            desc: 'Authorized digital package'
        },
        {
            label: 'Source Repository',
            url: cleanUrl(taxonomy?.official_links?.github_url),
            icon: Cat,
            desc: 'Official code and build repository'
        },
        {
            label: 'Google Fonts Directory',
            url: cleanUrl(taxonomy?.official_links?.google_fonts_url),
            icon: ExternalLink,
            desc: 'Google Fonts distribution listing'
        }
    ];

    const officialLinks = rawLinks.filter(l => Boolean(l.url));

    return (
        <section className="w-full zmax-w-6xl mx-auto space-y-0 font-inter-tight text-[rgb(var(--color-foreground))]">
            <div className="flex justify-center items-center gap-4 py-10">
                <h2 className="text-4xl sm:text-6xl md:text-8xl font-inter-tight font-medium zuppercase ztracking-widest text-[rgb(var(--color-foreground))]">
                    Details
                </h2>
            </div>

            {/* Top Identity / Personality Intro */}
            <div className="md:border-b border-[rgb(var(--color-foreground)/0.08)] py-12 md:py-16">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-0">
                    <div className="w-full md:w-1/3 shrink-0 md:sticky md:top-28">
                        <span className="text-3xl md:text-4xl font-normal text-[rgb(var(--color-foreground))]">
                            Identity
                        </span>
                    </div>
                    <div className="w-full md:w-1/2 zmax-w-3xl space-y-2">
                        <h2 className="text-3xl md:text-5xl font-normal tracking-tight text-[rgb(var(--color-foreground))] leading-tight">
                            {fontName}
                        </h2>
                        <p className="text-[22px] md:text-2xl font-light text-[rgb(var(--color-muted-foreground))]">
                            Designed by <span className="text-[rgb(var(--color-foreground))] font-normal">{designer}</span>
                            {foundry && <span> · Published by <span className="text-[rgb(var(--color-foreground))] font-normal">{foundry}</span></span>}
                        </p>
                    </div>
                </div>
            </div>

            {/* DESCRIPTION */}
            <div className="md:border-b border-[rgb(var(--color-foreground)/0.08)] py-12 md:py-16">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-0">
                    <div className="w-full md:w-1/3 shrink-0 md:sticky md:top-28">
                        <h3 className="text-3xl md:text-4xl font-normal text-[rgb(var(--color-foreground))]">
                            Description
                        </h3>
                    </div>
                    <div className="w-full md:w-1/2 zmax-w-3xl space-y-6">
                        <p className="text-[22px] md:text-2xl font-light leading-relaxed text-[rgb(var(--color-muted-foreground)/0.9)] whitespace-pre-line">
                            {descriptionText}
                        </p>
                    </div>
                </div>
            </div>

            {/* HISTORY & BACKGROUND */}
            {historyText && (
                <div className="md:border-b border-[rgb(var(--color-foreground)/0.08)] py-12 md:py-16">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-0">
                        <div className="w-full md:w-1/3 shrink-0 md:sticky md:top-28">
                            <h3 className="text-3xl md:text-4xl font-normal text-[rgb(var(--color-foreground))]">
                                History &amp; Background
                            </h3>
                        </div>
                        <div className="w-full md:w-1/2 zmax-w-3xl">
                            <p className="text-[22px] md:text-2xl font-light leading-relaxed text-[rgb(var(--color-muted-foreground)/0.9)] whitespace-pre-line">
                                {historyText}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* DESIGN CHARACTERISTICS */}
            {characteristicsText && (
                <div className="md:border-b border-[rgb(var(--color-foreground)/0.08)] py-12 md:py-16">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-0">
                        <div className="w-full md:w-1/3 shrink-0 md:sticky md:top-28">
                            <h3 className="text-3xl md:text-4xl font-normal text-[rgb(var(--color-foreground))]">
                                Design Characteristics
                            </h3>
                        </div>
                        <div className="w-full md:w-1/2 zmax-w-3xl">
                            <p className="text-[22px] md:text-2xl font-light leading-relaxed text-[rgb(var(--color-muted-foreground)/0.9)] whitespace-pre-line">
                                {characteristicsText}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* CHARACTER TRAITS GRID */}
            <div className="md:border-b border-[rgb(var(--color-foreground)/0.08)] py-12 md:py-16">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-0">
                    <div className="w-full md:w-1/3 shrink-0 md:sticky md:top-28">
                        <h3 className="text-3xl md:text-4xl font-normal text-[rgb(var(--color-foreground))]">
                            Character Traits
                        </h3>
                    </div>
                    <div className="w-full md:w-1/2 zmax-w-3xl">
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            {traits.map((trait, idx) => (
                                <div
                                    key={idx}
                                    className="py-3 px-4 flex justify-center items-center border border-[rgb(var(--color-foreground)/0.1)] rounded-lg text-center md:text-left bg-[rgb(var(--color-foreground)/0.02)] transition-colors duration-300 ease-in-out text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]"
                                >
                                    <span className="text-sm md:text-lg font-light tracking-wide">
                                        {trait}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAILS (SPECS TABLE) */}
            <div className="md:border-b border-[rgb(var(--color-foreground)/0.08)] py-12 md:py-16">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-0">
                    <div className="w-full md:w-1/3 shrink-0 md:sticky md:top-28">
                        <h3 className="text-3xl md:text-4xl font-normal text-[rgb(var(--color-foreground))]">
                            DETAILS
                        </h3>
                    </div>
                    <div className="w-full md:w-1/2 zmax-w-3xl">
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12">
                            <div>
                                <span className="block font-mono text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-muted-foreground))] mb-1.5">
                                    CATEGORY
                                </span>
                                <span className="text-[22px] md:text-2xl font-light text-[rgb(var(--color-foreground))]">
                                    {category}
                                </span>
                            </div>

                            <div>
                                <span className="block font-mono text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-muted-foreground))] mb-1.5">
                                    STYLE
                                </span>
                                <span className="text-[22px] md:text-2xl font-light text-[rgb(var(--color-foreground))]">
                                    {style}
                                </span>
                            </div>

                            <div>
                                <span className="block font-mono text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-muted-foreground))] mb-1.5">
                                    VERSION
                                </span>
                                <span className="text-[22px] md:text-2xl font-light text-[rgb(var(--color-foreground))]">
                                    {version}
                                </span>
                            </div>

                            <div>
                                <span className="block font-mono text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-muted-foreground))] mb-1.5">
                                    RELEASED
                                </span>
                                <span className="text-[22px] md:text-2xl font-light text-[rgb(var(--color-foreground))]">
                                    {releaseYear || 'Recent'}
                                </span>
                            </div>

                            <div>
                                <span className="block font-mono text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-muted-foreground))] mb-1.5">
                                    FORMAT
                                </span>
                                <span className="text-[22px] md:text-2xl font-light text-[rgb(var(--color-foreground))]">
                                    {formatsString}
                                </span>
                            </div>

                            <div>
                                <span className="block font-mono text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-muted-foreground))] mb-1.5">
                                    GLYPHS
                                </span>
                                <span className="text-[22px] md:text-2xl font-light text-[rgb(var(--color-foreground))]">
                                    {glyphCount}
                                </span>
                            </div>

                            <div className="col-span-2 md:col-span-3">
                                <span className="block font-mono text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-muted-foreground))] mb-1.5">
                                    LANGUAGE COVERAGE
                                </span>
                                <span className="text-[22px] md:text-2xl font-light text-[rgb(var(--color-foreground))]">
                                    {languageString}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CLASSIFICATION */}
            <div className="md:border-b border-[rgb(var(--color-foreground)/0.08)] py-12 md:py-16">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-0">
                    <div className="w-full md:w-1/3 shrink-0 md:sticky md:top-28">
                        <h3 className="text-3xl md:text-4xl font-normal text-[rgb(var(--color-foreground))]">
                            Classification
                        </h3>
                    </div>
                    <div className="w-full md:w-1/2 zmax-w-3xl">
                        <p className="text-[22px] md:text-2xl font-light text-[rgb(var(--color-muted-foreground))]">
                            {classificationItems.join(' · ')}
                        </p>
                    </div>
                </div>
            </div>

            {/* TAGS */}
            {tagsList.length > 0 && (
                <div className="md:border-b border-[rgb(var(--color-foreground)/0.08)] py-12 md:py-16">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-0">
                        <div className="w-full md:w-1/3 shrink-0 md:sticky md:top-28">
                            <h3 className="text-3xl md:text-4xl font-normal text-[rgb(var(--color-foreground))]">
                                Tags
                            </h3>
                        </div>
                        <div className="w-full md:w-1/2 zmax-w-3xl">
                            <div className="flex flex-wrap gap-2 md:gap-3">
                                {tagsList.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center px-4 py-2 rounded-full border border-[rgb(var(--color-foreground)/0.10)] text-sm md:text-lg font-light tracking-wide text-[rgb(var(--color-muted-foreground))] bg-[rgb(var(--color-foreground)/0.03)] hover:bg-[rgb(var(--color-foreground)/0.07)] transition-colors duration-300 ease-in-out"
                                    >
                                        #{tag.replace(/^#/, '')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MOOD */}
            {moodItems.length > 0 && (
                <div className="md:border-b border-[rgb(var(--color-foreground)/0.08)] py-12 md:py-16">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-0">
                        <div className="w-full md:w-1/3 shrink-0 md:sticky md:top-28">
                            <h3 className="text-3xl md:text-4xl font-normal text-[rgb(var(--color-foreground))]">
                                Mood
                            </h3>
                        </div>
                        <div className="w-full md:w-1/2 zmax-w-3xl">
                            <p className="text-[22px] md:text-2xl font-light leading-relaxed text-[rgb(var(--color-muted-foreground))]">
                                {moodItems.join(' · ')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* RECOMMENDED USES */}
            {usesList.length > 0 && (
                <div className="md:border-b border-[rgb(var(--color-foreground)/0.08)] py-12 md:py-16">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-0">
                        <div className="w-full md:w-1/3 shrink-0 md:sticky md:top-28">
                            <h3 className="text-3xl md:text-4xl font-normal text-[rgb(var(--color-foreground))]">
                                Recommended Uses
                            </h3>
                        </div>
                        <div className="w-full md:w-1/2 zmax-w-3xl">
                            <p className="text-[22px] md:text-2xl font-light leading-relaxed text-[rgb(var(--color-muted-foreground))]">
                                {usesList.join(' · ')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* LICENSING & PERMISSIONS MATRIX */}
            <div className="md:border-b border-[rgb(var(--color-foreground)/0.08)] py-12 md:py-16">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-0">
                    <div className="w-full md:w-1/3 shrink-0 md:sticky md:top-28">
                        <h3 className="text-3xl md:text-4xl font-normal text-[rgb(var(--color-foreground))]">
                            Licensing
                        </h3>
                    </div>
                    <div className="w-full md:w-1/2 zmax-w-3xl space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <h4 className="text-2xl md:text-3xl font-light tracking-tight text-[rgb(var(--color-foreground))]">
                                {licenseType}
                            </h4>
                            <span className="font-mono text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-[rgb(var(--color-foreground)/0.15)] bg-[rgb(var(--color-foreground)/0.04)] text-[rgb(var(--color-muted-foreground))]">
                                {distributionStatus}
                            </span>
                        </div>

                        <p className="text-[22px] md:text-2xl font-light text-[rgb(var(--color-muted-foreground))]">
                            {isCommercialAllowed
                                ? 'Authorized for personal and commercial projects under license terms.'
                                : 'Personal use authorized. Commercial use requires a commercial tier or verified license.'}
                        </p>

                        {/* 4-point usage permissions matrix */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[rgb(var(--color-foreground)/0.08)] bg-[rgb(var(--color-foreground)/0.02)]">
                                <span className="font-normal text-sm text-[rgb(var(--color-foreground))]">Personal Use</span>
                                <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                                    {isPersonalAllowed ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
                                            <Check size={16} className="stroke-[2.5]" /> Granted
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-rose-500 font-semibold">
                                            <X size={16} className="stroke-[2.5]" /> Prohibited
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[rgb(var(--color-foreground)/0.08)] bg-[rgb(var(--color-foreground)/0.02)]">
                                <span className="font-normal text-sm text-[rgb(var(--color-foreground))]">Commercial Use</span>
                                <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                                    {isCommercialAllowed ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
                                            <Check size={16} className="stroke-[2.5]" /> Granted
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-rose-500 font-semibold">
                                            <X size={16} className="stroke-[2.5]" /> License Required
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[rgb(var(--color-foreground)/0.08)] bg-[rgb(var(--color-foreground)/0.02)]">
                                <span className="font-normal text-sm text-[rgb(var(--color-foreground))]">Modification &amp; Derivs</span>
                                <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                                    {isModificationAllowed ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
                                            <Check size={16} className="stroke-[2.5]" /> Permitted
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-rose-500 font-semibold">
                                            <X size={16} className="stroke-[2.5]" /> Restricted
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[rgb(var(--color-foreground)/0.08)] bg-[rgb(var(--color-foreground)/0.02)]">
                                <span className="font-normal text-sm text-[rgb(var(--color-foreground))]">Redistribution</span>
                                <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                                    {isRedistributionAllowed ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
                                            <Check size={16} className="stroke-[2.5]" /> Permitted
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-rose-500 font-semibold">
                                            <X size={16} className="stroke-[2.5]" /> Restricted
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {licenseEvidence && (
                            <p className="text-xs text-[rgb(var(--color-muted-foreground))] italic">
                                Evidence note: {licenseEvidence}
                            </p>
                        )}

                        {licenseUrl && (
                            <div className="pt-2">
                                <a
                                    href={licenseUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[rgb(var(--color-foreground))] hover:underline underline-offset-4"
                                >
                                    View Official License Terms <ExternalLink size={14} />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* OFFICIAL LINKS */}
            {officialLinks.length > 0 && (
                <div className="py-12 md:py-16">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 md:gap-0">
                        {/* Section title */}
                        <div className="w-full md:w-1/3 shrink-0 md:sticky md:top-28">
                            <h3 className="text-3xl md:text-4xl font-normal text-[rgb(var(--color-foreground))]">
                                Official Links
                            </h3>
                        </div>
                        {/* Links */}
                        <div className="w-full md:w-1/2 zmax-w-3xl">
                            <div className="space-y-1">
                                {officialLinks.map((link, idx) => {
                                    const cleanedUrl = cleanUrl(link.url) || link.url!;
                                    return (
                                        <a
                                            key={idx}
                                            href={cleanedUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group block py-5 md:py-6 border-t border-[rgb(var(--color-foreground)/0.1)] first:border-none"
                                        >
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="min-w-0">
                                                    {/* Label */}
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className="text-2xl md:text-3xl font-normal text-[rgb(var(--color-foreground))] transition-all duration-300 ease-in-out group-hover:text-[rgb(var(--color-foreground))] group-hover:translate-x-1">
                                                            {link.label}
                                                        </span>
                                                        <span className="hidden md:block mt-2 ml-0 group-hover:ml-3 text-xs md:text-sm font-mono text-[rgb(var(--color-muted-foreground)/0.8)] truncate
                                                        opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out
                                                        w-fit px-3.5 py-3.5 rounded-xl border border-[rgb(var(--color-foreground)/0.08)] bg-[rgb(var(--color-foreground)/0.02)]">
                                                            {formatUrlForDisplay(link.url!)}
                                                        </span>
                                                    </div>

                                                    {/* Description */}
                                                    {link.desc && (
                                                        <p className="mt-2 text-xl font-light leading-relaxed text-[rgb(var(--color-muted-foreground)/0.8)]">
                                                            {link.desc}
                                                        </p>
                                                    )}

                                                    {/* URL */}
                                                    {/* <span className="mt-2 text-xs md:text-sm font-mono text-[rgb(var(--color-muted-foreground))] truncate
                                                    w-fit inline-block px-3.5 py-3.5 rounded-xl border border-[rgb(var(--color-foreground)/0.08)] bg-[rgb(var(--color-foreground)/0.02)]">
                                                        {formatUrlForDisplay(link.url!)}
                                                    </span> */}
                                                </div>

                                                {/* Arrow */}
                                                <span className="shrink-0 mt-1 text-xl text-[rgb(var(--color-muted-foreground)/0.5)] transition-all duration-300 group-hover:text-[rgb(var(--color-foreground))] group-hover:translate-x-1 group-hover:-translate-y-1">
                                                    ↗
                                                </span>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </section>
    );
}
