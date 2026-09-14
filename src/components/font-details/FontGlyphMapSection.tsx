import { Layout } from 'lucide-react';
import GlyphMap from '../fonts/GlyphMap';
import type { Font } from '../../types/font';

interface FontGlyphMapSectionProps {
    font: Font;
    isFontLoaded: boolean;
}

export default function FontGlyphMapSection({ font, isFontLoaded }: FontGlyphMapSectionProps) {
    let mainFontUrl = font.otf_url || font.ttf_url || font.woff_url || font.woff2_url || '';
    if (!mainFontUrl && font.font_variants && font.font_variants.length > 0) {
        const v = font.font_variants[0];
        mainFontUrl = v.otf_url || v.ttf_url || v.woff_url || v.woff2_url || '';
    }

    const variants = font.font_variants?.map(v => ({
        name: v.variant_name,
        url: v.otf_url || v.ttf_url || v.woff_url || v.woff2_url || ''
    })).filter(v => v.url !== '') || [];

    return (
        <div className="space-y-8 pt-12 border-t border-[rgb(var(--color-foreground)/0.1)] mt-12">
            <div className="flex justify-between items-center bg-[rgb(var(--color-muted)/0.05)] p-4 rounded-2xl border border-[rgb(var(--color-border))]">
                <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))] tracking-tight flex items-center gap-3 px-4">
                    <Layout className="text-[rgb(var(--color-accent))]" />
                    Glyph Map
                </h2>
                <span className="text-xs font-bold text-[rgb(var(--color-muted-foreground))] bg-[rgb(var(--color-background))] px-3 py-1 rounded-full border border-[rgb(var(--color-border))] uppercase tracking-widest">
                    256 Characters
                </span>
            </div>

            <GlyphMap
                fontFamily={isFontLoaded ? `font-${font.id}` : 'sans-serif'}
                fontUrl={mainFontUrl}
                variants={variants}
            />
        </div>
    );
}
