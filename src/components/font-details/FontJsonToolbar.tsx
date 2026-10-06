import { useState, useCallback, useMemo } from 'react';
import { FileJson, Download } from 'lucide-react';
import { Toast } from '@capacitor/toast';
import { supabase } from '../../lib/supabase';
import { JsonImportModal, type FontFormState } from '../fonts/JsonImportModal';
import { cleanUrl } from '../../utils/urlHelper';
import type { Font } from '../../types/font';
import type { Database } from '../../types/database.types';

type FontResearchRow = Database['public']['Tables']['font_research']['Row'];

interface FontJsonToolbarProps {
    font: Font;
    profile?: any;
    onFontUpdated: (updatedFields: Partial<Font>) => void;
}

/**
 * Builds the comprehensive canonical font taxonomy JSON from font row and research record
 */
export function buildCanonicalFontMetadata(font: Font, research?: FontResearchRow | null) {
    const tax = (font as any).taxonomy || {};

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
            version: tax.identity?.version ?? '1.000',
            release_year: tax.identity?.release_year
                ? Number(tax.identity.release_year)
                : (font.created_at ? new Date(font.created_at).getFullYear() : null),
        },
        creator: {
            designer: tax.creator?.designer || font.designer || null,
            foundry: tax.creator?.foundry ?? null,
            publisher: tax.creator?.publisher || null,
        },
        classification: {
            category: (tax.classification?.category || font.category || 'display').toLowerCase(),
            subcategory: tax.classification?.subcategory || null,
            style: tax.classification?.style || (font.tags?.[0] || 'Regular'),
            tags: tax.classification?.tags || font.tags || [],
            mood: tax.classification?.mood || [],
            recommended_uses: tax.classification?.recommended_uses || ['Headlines', 'Branding', 'Display'],
        },
        description: {
            description: tax.description?.description ?? font.description ?? null,
            history: tax.description?.history || null,
            characteristics: tax.description?.characteristics || null,
        },
        license: {
            distribution_status: tax.license?.distribution_status || (font.commercial_use ? 'open_source' : 'free'),
            license_type: tax.license?.license_type ?? font.license_type ?? null,
            license_url: cleanUrl(tax.license?.license_url || research?.license_url),
            commercial_use: tax.license?.commercial_use ?? (font.commercial_use ?? false),
            personal_use: tax.license?.personal_use ?? true,
            modification_allowed: tax.license?.modification_allowed ?? false,
            redistribution_allowed: tax.license?.redistribution_allowed ?? false,
            license_evidence: tax.license?.license_evidence || null,
        },
        official_links: {
            official_website: cleanUrl(tax.official_links?.official_website),
            official_font_page: cleanUrl(tax.official_links?.official_font_page),
            purchase_url: cleanUrl(tax.official_links?.purchase_url),
            free_download_url: cleanUrl(tax.official_links?.free_download_url),
            github_url: cleanUrl(tax.official_links?.github_url),
            google_fonts_url: cleanUrl(tax.official_links?.google_fonts_url),
        },
        technical: {
            formats: dynamicFormats,
            weights: dynamicWeights,
            styles: tax.technical?.styles ?? ['Normal'],
            glyph_count: tax.technical?.glyph_count ?? font.glyph_count ?? 92,
            languages: tax.technical?.languages ?? ['English', 'Basic Latin'],
            opentype_features: tax.technical?.opentype_features ?? [],
        }
    };
}

export default function FontJsonToolbar({
    font,
    profile,
    onFontUpdated,
}: FontJsonToolbarProps) {
    const [showJsonModal, setShowJsonModal] = useState(false);

    // Strictly limit this entire component to Admins
    if (profile?.role !== 'admin') {
        return null;
    }

    // Pre-populate the JSON modal with the font's current canonical configuration
    const currentJsonString = useMemo(() => {
        const canonical = buildCanonicalFontMetadata(font);
        return JSON.stringify(canonical, null, 2);
    }, [font]);

    // Export current font metadata: triggers file download (.json) AND copies to clipboard
    const handleExportJson = useCallback(async () => {
        const canonical = buildCanonicalFontMetadata(font);
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
    }, [font]);

    // Apply JSON data imported from modal to update Supabase and reactive UI
    const handleApplyJsonData = useCallback(async (data: Partial<FontFormState>) => {
        if (!profile || profile.role !== 'admin') {
            await Toast.show({ text: 'Only Admins can update font metadata.', duration: 'short' });
            return;
        }

        try {
            // Build the complete canonical JSON from the imported data
            const canonicalTaxonomy = {
                identity: {
                    name: data.name ?? font.name,
                    family_name: data.familyName ?? font.name,
                    slug: font.slug,
                    version: data.version ?? '1.000',
                    release_year: data.releaseYear
                        ? Number(data.releaseYear)
                        : null,
                },

                creator: {
                    designer: data.designer ?? font.designer ?? null,
                    foundry: data.foundry ?? null,
                    publisher: data.publisher ?? null,
                },

                classification: {
                    category: data.category ?? font.category ?? null,
                    subcategory: data.subcategory ?? null,
                    style: data.style ?? null,
                    tags: data.tags ?? font.tags ?? [],
                    mood: data.mood ?? [],
                    recommended_uses: data.recommendedUses ?? [],
                },

                description: {
                    description: data.description ?? font.description ?? null,
                    history: data.history ?? null,
                    characteristics: data.characteristics ?? null,
                },

                license: {
                    distribution_status: data.distributionStatus ?? 'unknown',
                    license_type: data.licenseType ?? font.license_type ?? null,
                    license_url: cleanUrl(data.licenseUrl),
                    commercial_use: data.commercialUse ?? false,
                    personal_use: data.personalUse ?? true,
                    modification_allowed: data.modificationAllowed ?? false,
                    redistribution_allowed: data.redistributionAllowed ?? false,
                    license_evidence: data.licenseEvidence ?? null,
                },

                official_links: {
                    official_website: cleanUrl(data.officialWebsite),
                    official_font_page: cleanUrl(data.officialFontPage),
                    purchase_url: cleanUrl(data.purchaseUrl),
                    free_download_url: cleanUrl(data.freeDownloadUrl),
                    github_url: cleanUrl(data.githubUrl),
                    google_fonts_url: cleanUrl(data.googleFontsUrl),
                },

                technical: {
                    formats: data.formats ?? [],
                    weights: data.weights ?? [],
                    styles: data.styles ?? [],
                    glyph_count: data.glyphCount ?? null,
                    languages: data.languages ?? [],
                    opentype_features: data.opentypeFeatures ?? [],
                },
            };

            // Save core fields + the complete JSON into fonts
            const fontUpdates: any = {
                name: data.name ?? font.name,
                designer: data.designer ?? font.designer,
                category: data.category ?? font.category,
                tags: data.tags ?? font.tags,
                description: data.description ?? font.description,
                license_type: data.licenseType ?? font.license_type,
                commercial_use: data.commercialUse ?? font.commercial_use,
                glyph_count: data.glyphCount ?? font.glyph_count,

                // IMPORTANT: save the complete JSON here
                taxonomy: canonicalTaxonomy,

                updated_at: new Date().toISOString(),
            };

            const { error: fontErr } = await supabase
                .from('fonts')
                .update(fontUpdates)
                .eq('id', font.id);

            if (fontErr) throw fontErr;

            // Update the UI immediately
            onFontUpdated(fontUpdates);

            await Toast.show({
                text: '✨ Font metadata successfully updated and saved!',
                duration: 'short'
            });

            await Toast.show({ text: '✨ Font metadata successfully updated and saved!', duration: 'short' });
        } catch (err: any) {
            console.error('Failed to update font from JSON:', err);
            await Toast.show({ text: 'Error updating font: ' + (err.message || 'Unknown error'), duration: 'long' });
        }
    }, [font, profile, onFontUpdated]);

    return (
        <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    type="button"
                    onClick={() => setShowJsonModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase bg-foreground/6 hover:bg-foreground/12 border border-foreground/10 text-foreground transition-all cursor-pointer shadow-sm"
                    title="Import, edit, or auto-fill metadata from JSON"
                >
                    <FileJson size={14} className="text-accent" />
                    Auto-fill from JSON
                </button>
                <button
                    type="button"
                    onClick={handleExportJson}
                    className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase bg-foreground/6 hover:bg-foreground/12 border border-foreground/10 text-foreground transition-all cursor-pointer shadow-sm"
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
