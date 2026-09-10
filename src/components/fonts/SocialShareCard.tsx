import { forwardRef, useEffect, useMemo } from 'react';
import type { Font } from '../../types/font';

interface SocialShareCardProps {
    font: Font;
}

const SocialShareCard = forwardRef<HTMLDivElement, SocialShareCardProps>(({ font }, ref) => {
    // Determine font source
    const fontSource = useMemo(() => {
        if (!font) return null;

        // 1. Try to find 'Regular' in variants
        if (font.font_variants && font.font_variants.length > 0) {
            const regular = font.font_variants.find(v => v.variant_name === 'Regular');
            if (regular) {
                if (regular.woff2_url) return { url: regular.woff2_url, format: 'woff2' };
                if (regular.woff_url) return { url: regular.woff_url, format: 'woff' };
                if (regular.ttf_url) return { url: regular.ttf_url, format: 'truetype' };
                if (regular.otf_url) return { url: regular.otf_url, format: 'opentype' };
            }
        }

        // 2. Fallback to Main Font Files
        if (font.woff2_url) return { url: font.woff2_url, format: 'woff2' };
        if (font.woff_url) return { url: font.woff_url, format: 'woff' };
        if (font.ttf_url) return { url: font.ttf_url, format: 'truetype' };
        if (font.otf_url) return { url: font.otf_url, format: 'opentype' };

        // 3. Fallback to ANY variant
        if (font.font_variants && font.font_variants.length > 0) {
            const anyVariant = font.font_variants[0];
            if (anyVariant.woff2_url) return { url: anyVariant.woff2_url, format: 'woff2' };
            if (anyVariant.woff_url) return { url: anyVariant.woff_url, format: 'woff' };
            if (anyVariant.ttf_url) return { url: anyVariant.ttf_url, format: 'truetype' };
            if (anyVariant.otf_url) return { url: anyVariant.otf_url, format: 'opentype' };
        }

        return null;
    }, [font]);

    const fontName = `custom-font-${font.slug}`;

    // Dynamically load font into document.fonts
    useEffect(() => {
        if (!fontSource) return;

        const fontFace = new FontFace(fontName, `url(${fontSource.url}) format('${fontSource.format}')`);
        fontFace.load().then((loaded) => {
            document.fonts.add(loaded);
        }).catch((err) => {
            console.error(`Failed to load font ${fontName}:`, err);
        });
    }, [fontName, fontSource]);

    return (
        <div
            ref={ref}
            className="w-300 text-[rgb(var(--color-foreground))] relative overflow-hidden flex flex-col justify-between p-16"
            style={{
                backgroundImage: 'url("/gradients/5.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {fontSource && (
                <style>
                    {`
                        @font-face {
                            font-family: '${fontName}';
                            src: url('${fontSource.url}') format('${fontSource.format}');
                            font-display: swap;
                        }
                    `}
                </style>
            )}

            {/* Background Texture/Elements */}
            {/* <div className="absolute top-0 right-0 w-150 h-150 bg-[rgb(var(--color-highlight))] rounded-full blur-[150px] opacity-20 -mr-32 -mt-32 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-150 h-150 bg-[rgb(var(--color-accent))] rounded-full blur-[120px] opacity-10 -ml-20 -mb-20 pointer-events-none"></div> */}

            {/* Header */}
            <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <p
                        className="text-5xl opacity-80 max-w-3xl leading-none"
                        style={{ fontFamily: `'${fontName}', 'font-${font.id}', sans-serif` }}
                    >
                        The quick brown fox jumps<br /> over the lazy dog. <br />1234567890
                    </p>

                </div>
                <div className="w-12 h-12 bg-[rgb(var(--color-muted))] rounded-xl overflow-hidden flex items-center justify-center">
                    <img src="/logo/logo.png" alt="NoBadFonts Logo" className='w-full h-full object-contain' />
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col justify-center">
                <h1
                    className="text-9xl text-center leading-none font-white mix-blend-screen"
                    style={{ fontFamily: `'${fontName}', 'font-${font.id}', sans-serif` }}
                >
                    {font.name}
                </h1>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex justify-between items-end"> 
                <div>
                    <p className="text-[rgb(var(--color-muted-foreground))] text-2xl font-inter-tight lowercase tracking-wider mb-2">Designed By</p>
                    <p className="opacity-80 text-5xl font-inter-tight">{font.designer || 'Unknown Designer'}</p>
                </div>

                <div className="flex">
                    <span className="opacity-80 text-5xl font-inter-tight text-right">
                        get it on <br />nobadfonts.in
                    </span>
                </div>
            </div>

            {/* Watermark/Grid overlay */}
            <div
                className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            ></div>
        </div>
    );
});

SocialShareCard.displayName = 'SocialShareCard';

export default SocialShareCard;
