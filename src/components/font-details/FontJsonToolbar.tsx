import { useState, useCallback, useMemo } from 'react';
import { FileJson, Download } from 'lucide-react';
import { Toast } from '@capacitor/toast';
import { supabase } from '../../lib/supabase';
import { JsonImportModal, type FontFormState } from '../fonts/JsonImportModal';
import type { Font } from '../../types/font';
import type { Database } from '../../types/database.types';

type FontResearchRow = Database['public']['Tables']['font_research']['Row'];

interface FontJsonToolbarProps {
    font: Font;
    research?: FontResearchRow | null;
    profile?: any;
    onFontUpdated: (updatedFields: Partial<Font>) => void;
    onResearchUpdated: (updatedResearch: FontResearchRow) => void;
}

/**
 * Builds the comprehensive canonical font taxonomy JSON from font row and research record
 */
export function buildCanonicalFontMetadata(font: Font, research?: FontResearchRow | null) {
    const extracted = (research?.font_metadata_extracted as any) || {};
    const tax = extracted?.taxonomy || {};

    // Extract formats from variants
    const dynamicFormats: string[] = tax.technical?.formats || [];
    if (dynamicFormats.length === 0 && font.font_variants && font.font_variants.length > 0) {
        const detected = new Set<string>();
        font.font_variants.forEach(v => {
            if (v.woff2_url) detected.add('WOFF2');
            if (v.woff_url) detected.add('WOFF');
            if (v.otf_url) detected.add('OTF');
            if (v.ttf_url) detected.add('TTF');
        });
        if (detected.size > 0) dynamicFormats.push(...Array.from(detected));
    }
    if (dynamicFormats.length === 0) dynamicFormats.push('OTF', 'TTF');

    // Extract weights from variants
    const dynamicWeights: string[] = tax.technical?.weights || [];
    if (dynamicWeights.length === 0 && font.font_variants && font.font_variants.length > 0) {
        const weights = Array.from(new Set(font.font_variants.map(v => v.variant_name)));
        if (weights.length > 0) dynamicWeights.push(...weights);
    }
    if (dynamicWeights.length === 0) dynamicWeights.push('Regular');

    return {
        identity: {
            name: tax.identity?.name || font.name,
            family_name: tax.identity?.family_name || font.name,
            slug: font.slug,
            version: tax.identity?.version || extracted.version || '1.000',
            release_year: tax.identity?.release_year 
                ? Number(tax.identity.release_year) 
                : (font.created_at ? new Date(font.created_at).getFullYear() : null),
        },
        creator: {
            designer: tax.creator?.designer || font.designer || null,
            foundry: tax.creator?.foundry || research?.foundry || null,
            publisher: tax.creator?.publisher || null,
        },
        classification: {
            category: tax.classification?.category || font.category || 'Display',
            subcategory: tax.classification?.subcategory || null,
            style: tax.classification?.style || (font.tags?.[0] || 'Regular'),
            tags: tax.classification?.tags || font.tags || [],
            mood: tax.classification?.mood || [],
            recommended_uses: tax.classification?.recommended_uses || ['Headlines', 'Branding', 'Display'],
        },
        description: {
            description: tax.description?.description || research?.ai_description || font.description || null,
            history: tax.description?.history || null,
            characteristics: tax.description?.characteristics || null,
        },
        license: {
            distribution_status: tax.license?.distribution_status || (font.commercial_use ? 'open_source' : 'free'),
            license_type: tax.license?.license_type || research?.license_type_verified || font.license_type || 'Personal Use Only',
            license_url: tax.license?.license_url || research?.license_url || null,
            commercial_use: tax.license?.commercial_use ?? (font.commercial_use ?? false),
            personal_use: tax.license?.personal_use ?? true,
            modification_allowed: tax.license?.modification_allowed ?? false,
            redistribution_allowed: tax.license?.redistribution_allowed ?? false,
            license_evidence: tax.license?.license_evidence || null,
        },
        official_links: {
            official_website: tax.official_links?.official_website || research?.official_website || null,
            official_font_page: tax.official_links?.official_font_page || research?.official_font_page || null,
            purchase_url: tax.official_links?.purchase_url || research?.purchase_url || null,
            free_download_url: tax.official_links?.free_download_url || research?.free_download_url || null,
            github_url: tax.official_links?.github_url || null,
            google_fonts_url: tax.official_links?.google_fonts_url || null,
        },
        technical: {
            formats: dynamicFormats,
            weights: dynamicWeights,
            styles: tax.technical?.styles || ['Normal'],
            glyph_count: tax.technical?.glyph_count || extracted.glyph_count || font.glyph_count || 92,
            languages: tax.technical?.languages || extracted.detected_languages || ['English', 'Basic Latin'],
            opentype_features: tax.technical?.opentype_features || extracted.opentype_features || [],
        }
    };
}

export default function FontJsonToolbar({
    font,
    research,
    profile,
    onFontUpdated,
    onResearchUpdated,
}: FontJsonToolbarProps) {
    const [showJsonModal, setShowJsonModal] = useState(false);

    // Strictly limit this entire component to Admins
    if (profile?.role !== 'admin') {
        return null;
    }

    // Pre-populate the JSON modal with the font's current canonical configuration
    const currentJsonString = useMemo(() => {
        const canonical = buildCanonicalFontMetadata(font, research);
        return JSON.stringify(canonical, null, 2);
    }, [font, research]);

    // Export current font metadata: triggers file download (.json) AND copies to clipboard
    const handleExportJson = useCallback(async () => {
        const canonical = buildCanonicalFontMetadata(font, research);
        const jsonStr = JSON.stringify(canonical, null, 2);
        const filename = `${font.slug || 'font'}-metadata.json`;

        // 1. Download file via DOM anchor
        try {
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (downloadErr) {
            console.error('File download failed:', downloadErr);
        }

        // 2. Also copy to clipboard for convenience
        try {
            await navigator.clipboard.writeText(jsonStr);
            await Toast.show({ text: `Exported ${filename} downloaded & copied to clipboard!`, duration: 'short' });
        } catch {
            await Toast.show({ text: `Exported ${filename} downloaded!`, duration: 'short' });
        }
    }, [font, research]);

    // Apply JSON data imported from modal to update Supabase and reactive UI
    const handleApplyJsonData = useCallback(async (data: Partial<FontFormState>) => {
        if (!profile || profile.role !== 'admin') {
            await Toast.show({ text: 'Only Admins can update font metadata.', duration: 'short' });
            return;
        }

        try {
            // 1. Update fonts table in Supabase
            const fontUpdates: any = {
                updated_at: new Date().toISOString()
            };
            if (data.name !== undefined) fontUpdates.name = data.name;
            if (data.designer !== undefined) fontUpdates.designer = data.designer;
            if (data.category !== undefined) fontUpdates.category = data.category;
            if (data.tags !== undefined) fontUpdates.tags = data.tags;
            if (data.description !== undefined) fontUpdates.description = data.description;
            if (data.licenseType !== undefined) fontUpdates.license_type = data.licenseType;
            if (typeof data.commercialUse === 'boolean') fontUpdates.commercial_use = data.commercialUse;
            if (typeof data.glyphCount === 'number') fontUpdates.glyph_count = data.glyphCount;

            const { error: fontErr } = await supabase
                .from('fonts')
                .update(fontUpdates)
                .eq('id', font.id);
            if (fontErr) throw fontErr;

            // 2. Build full canonical taxonomy structure for font_research
            const existingExtracted = (research?.font_metadata_extracted as any) || {};
            const existingTax = existingExtracted.taxonomy || {};

            const canonicalTaxonomy = {
                identity: {
                    name: data.name ?? fontUpdates.name ?? existingTax.identity?.name ?? font.name,
                    family_name: data.familyName ?? existingTax.identity?.family_name ?? font.name,
                    slug: font.slug,
                    version: data.version ?? existingTax.identity?.version ?? '1.000',
                    release_year: data.releaseYear ? Number(data.releaseYear) : (existingTax.identity?.release_year ?? null),
                },
                creator: {
                    designer: data.designer ?? fontUpdates.designer ?? existingTax.creator?.designer ?? font.designer,
                    foundry: data.foundry ?? existingTax.creator?.foundry ?? research?.foundry ?? null,
                    publisher: data.publisher ?? existingTax.creator?.publisher ?? null,
                },
                classification: {
                    category: data.category ?? fontUpdates.category ?? existingTax.classification?.category ?? font.category,
                    subcategory: data.subcategory ?? existingTax.classification?.subcategory ?? null,
                    style: data.style ?? existingTax.classification?.style ?? null,
                    tags: data.tags ?? fontUpdates.tags ?? existingTax.classification?.tags ?? font.tags ?? [],
                    mood: data.mood ?? existingTax.classification?.mood ?? [],
                    recommended_uses: data.recommendedUses ?? existingTax.classification?.recommended_uses ?? [],
                },
                description: {
                    description: data.description ?? fontUpdates.description ?? existingTax.description?.description ?? font.description,
                    history: data.history ?? existingTax.description?.history ?? null,
                    characteristics: data.characteristics ?? existingTax.description?.characteristics ?? null,
                },
                license: {
                    distribution_status: data.distributionStatus ?? existingTax.license?.distribution_status ?? (font.commercial_use ? 'open_source' : 'free'),
                    license_type: data.licenseType ?? fontUpdates.license_type ?? existingTax.license?.license_type ?? font.license_type,
                    license_url: data.licenseUrl ?? existingTax.license?.license_url ?? research?.license_url ?? null,
                    commercial_use: data.commercialUse ?? (fontUpdates.commercial_use ?? (existingTax.license?.commercial_use ?? font.commercial_use)),
                    personal_use: data.personalUse ?? (existingTax.license?.personal_use ?? true),
                    modification_allowed: data.modificationAllowed ?? (existingTax.license?.modification_allowed ?? false),
                    redistribution_allowed: data.redistributionAllowed ?? (existingTax.license?.redistribution_allowed ?? false),
                    license_evidence: data.licenseEvidence ?? existingTax.license?.license_evidence ?? null,
                },
                official_links: {
                    official_website: data.officialWebsite ?? existingTax.official_links?.official_website ?? research?.official_website ?? null,
                    official_font_page: data.officialFontPage ?? existingTax.official_links?.official_font_page ?? research?.official_font_page ?? null,
                    purchase_url: data.purchaseUrl ?? existingTax.official_links?.purchase_url ?? research?.purchase_url ?? null,
                    free_download_url: data.freeDownloadUrl ?? existingTax.official_links?.free_download_url ?? research?.free_download_url ?? null,
                    github_url: data.githubUrl ?? existingTax.official_links?.github_url ?? null,
                    google_fonts_url: data.googleFontsUrl ?? existingTax.official_links?.google_fonts_url ?? null,
                },
                technical: {
                    formats: data.formats ?? existingTax.technical?.formats ?? ['OTF', 'TTF'],
                    weights: data.weights ?? existingTax.technical?.weights ?? ['Regular'],
                    styles: data.styles ?? existingTax.technical?.styles ?? ['Normal'],
                    glyph_count: data.glyphCount ?? existingTax.technical?.glyph_count ?? font.glyph_count,
                    languages: data.languages ?? existingTax.technical?.languages ?? ['English', 'Latin'],
                    opentype_features: data.opentypeFeatures ?? existingTax.technical?.opentype_features ?? [],
                }
            };

            // 3. Save into font_research
            const researchPayload: any = {
                font_id: font.id,
                foundry: data.foundry || research?.foundry || null,
                official_website: data.officialWebsite || research?.official_website || null,
                official_font_page: data.officialFontPage || research?.official_font_page || null,
                purchase_url: data.purchaseUrl || research?.purchase_url || null,
                free_download_url: data.freeDownloadUrl || research?.free_download_url || null,
                license_url: data.licenseUrl || research?.license_url || null,
                license_type_verified: data.licenseType || research?.license_type_verified || font.license_type,
                commercial_use_verified: data.commercialUse ?? (research?.commercial_use_verified ?? font.commercial_use),
                personal_use_verified: data.personalUse ?? (research?.personal_use_verified ?? true),
                ai_description: data.description || research?.ai_description || font.description,
                font_metadata_extracted: {
                    ...existingExtracted,
                    taxonomy: canonicalTaxonomy,
                },
                updated_at: new Date().toISOString(),
                research_status: research?.research_status || 'verified',
            };

            let savedResearch: FontResearchRow | null = null;

            // Check if a research row already exists for this font
            const { data: existingRow } = await supabase
                .from('font_research')
                .select('id')
                .eq('font_id', font.id)
                .maybeSingle();

            if (existingRow?.id) {
                const { data: updData, error: updErr } = await supabase
                    .from('font_research')
                    .update(researchPayload)
                    .eq('id', existingRow.id)
                    .select('*')
                    .maybeSingle();

                if (updErr) {
                    console.warn('font_research update warning (check RLS):', updErr);
                } else if (updData) {
                    savedResearch = updData;
                }
            } else {
                const { data: insData, error: insErr } = await supabase
                    .from('font_research')
                    .insert({ ...researchPayload, font_id: font.id })
                    .select('*')
                    .maybeSingle();

                if (insErr) {
                    console.warn('font_research insert warning (check RLS):', insErr);
                } else if (insData) {
                    savedResearch = insData;
                }
            }

            // 4. Update local state immediately with the new metadata
            onFontUpdated(fontUpdates);
            onResearchUpdated(savedResearch || ({ ...researchPayload, id: research?.id || 'temp-id' } as FontResearchRow));

            await Toast.show({ text: '✨ Font metadata successfully updated and saved!', duration: 'short' });
        } catch (err: any) {
            console.error('Failed to update font from JSON:', err);
            await Toast.show({ text: 'Error updating font: ' + (err.message || 'Unknown error'), duration: 'long' });
        }
    }, [font, research, profile, onFontUpdated, onResearchUpdated]);

    return (
        <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    type="button"
                    onClick={() => setShowJsonModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase bg-[rgb(var(--color-foreground)/0.06)] hover:bg-[rgb(var(--color-foreground)/0.12)] border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] transition-all cursor-pointer shadow-sm"
                    title="Import, edit, or auto-fill metadata from JSON"
                >
                    <FileJson size={14} className="text-[rgb(var(--color-highlight))]" />
                    Auto-fill from JSON
                </button>
                <button
                    type="button"
                    onClick={handleExportJson}
                    className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase bg-[rgb(var(--color-foreground)/0.06)] hover:bg-[rgb(var(--color-foreground)/0.12)] border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] transition-all cursor-pointer shadow-sm"
                    title="Export font metadata as canonical JSON file"
                >
                    <Download size={14} />
                    Export JSON
                </button>
            </div>

            {/* JSON Import Modal */}
            <JsonImportModal
                isOpen={showJsonModal}
                onClose={() => setShowJsonModal(false)}
                onApplyData={handleApplyJsonData}
                initialJson={currentJsonString}
                applyLabel="Save & Update Supabase"
            />
        </>
    );
}
