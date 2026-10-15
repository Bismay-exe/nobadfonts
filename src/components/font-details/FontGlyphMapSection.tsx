import GlyphMap from '../fonts/GlyphMap';
import type { Font } from '../../types/font';
import { useRef, useState, useEffect } from 'react';

interface FontGlyphMapSectionProps {
    font: Font;
    isFontLoaded: boolean;
}

export default function FontGlyphMapSection({ font, isFontLoaded }: FontGlyphMapSectionProps) {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '300px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

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
        <div className="space-y-8 pt-12 mt-12" ref={sentinelRef}>
            <div className="flex justify-center items-center gap-4 py-10">
                <h2 className="text-4xl sm:text-6xl md:text-8xl font-inter-tight font-medium zuppercase ztracking-widest text-foreground">
                    256 Glyphs
                </h2>
            </div>

            {isVisible && (
                <GlyphMap
                    fontFamily={isFontLoaded ? `font-${font.id}` : 'sans-serif'}
                    fontUrl={mainFontUrl}
                    variants={variants}
                />
            )}
        </div>
    );
}
