import { forwardRef, useEffect, useMemo, useState } from 'react';
import type { Font } from '../../types/font';

export interface SocialShareCardProps {
    font: Font;
    aspectRatio?: 'og' | 'share';
    selectedVariantId?: string | null;
    fontFamilyOverride?: string;
    activeVariantName?: string;
    variantCount?: number;
    customTitleFontSize?: number;
}

const SocialShareCard = forwardRef<HTMLDivElement, SocialShareCardProps>(({
    font,
    aspectRatio = 'share',
    selectedVariantId,
    fontFamilyOverride,
    // activeVariantName,
    // variantCount
    customTitleFontSize,
}, ref) => {
    const [, setFontLoaded] = useState(false);
    const isOg = aspectRatio === 'og';

    // 1. Resolve active variant (respects explicitly passed selectedVariantId, then the font's chosen og_image_variant_id, then 'Regular', then first)
    const activeVariant = useMemo(() => {
        if (!font.font_variants || font.font_variants.length === 0) return null;
        const targetId = selectedVariantId || font.og_image_variant_id;
        if (targetId) {
            const match = font.font_variants.find(v => v.id === targetId);
            if (match) return match;
        }
        // Fallback: look for 'Regular', else first
        return font.font_variants.find(v => v.variant_name.toLowerCase() === 'regular') || font.font_variants[0];
    }, [font, selectedVariantId]);

    // 2. Determine font source URL
    const fontSource = useMemo(() => {
        if (activeVariant) {
            if (activeVariant.woff2_url) return { url: activeVariant.woff2_url, format: 'woff2' };
            if (activeVariant.woff_url) return { url: activeVariant.woff_url, format: 'woff' };
            if (activeVariant.ttf_url) return { url: activeVariant.ttf_url, format: 'truetype' };
            if (activeVariant.otf_url) return { url: activeVariant.otf_url, format: 'opentype' };
        }

        // Fallback to top-level font URLs
        if (font.woff2_url) return { url: font.woff2_url, format: 'woff2' };
        if (font.woff_url) return { url: font.woff_url, format: 'woff' };
        if (font.ttf_url) return { url: font.ttf_url, format: 'truetype' };
        if (font.otf_url) return { url: font.otf_url, format: 'opentype' };

        return null;
    }, [font, activeVariant]);

    // Collision-safe family name (matches FontDetails and AdminOgImageManager registrations)
    const effectiveFamily = useMemo(() => {
        if (fontFamilyOverride) return fontFamilyOverride;
        if (activeVariant?.variant_name) return `font-${font.id}-${activeVariant.variant_name}`;
        return `font-${font.id}`;
    }, [fontFamilyOverride, activeVariant, font.id]);

    // Comprehensive fallback font stack
    const fontStack = useMemo(() => {
        const stack: string[] = [];
        if (fontFamilyOverride) stack.push(`"${fontFamilyOverride}"`);
        if (effectiveFamily) stack.push(`"${effectiveFamily}"`);
        if (activeVariant?.variant_name) stack.push(`"font-${font.id}-${activeVariant.variant_name}"`);
        stack.push(`"font-${font.id}"`);
        if (font.slug) stack.push(`"custom-font-${font.slug}"`);
        if (font.name) stack.push(`"${font.name}"`);
        stack.push('sans-serif');
        return Array.from(new Set(stack)).join(', ');
    }, [fontFamilyOverride, effectiveFamily, activeVariant, font.id, font.slug, font.name]);

    // Dynamically scale title font size based on aspect ratio and font name length
    const titleFontSizeClass = useMemo(() => {
        const len = font.name ? font.name.length : 0;
        if (isOg) {
            // 1200 x 630 canvas (height is 630px - more compressed vertically)
            if (len <= 6) return 'text-9xl';
            if (len <= 11) return 'text-8xl';
            if (len <= 16) return 'text-8xl';
            return 'text-8xl';
        } else {
            // 1200 x 800 canvas (height is 800px - tall canvas with breathing room)
            if (len <= 6) return 'text-9xl';
            if (len <= 11) return 'text-9xl';
            if (len <= 16) return 'text-9xl';
            return 'text-9xl';
        }
    }, [font.name, isOg]);

    // Dynamically register font if no override was provided
    useEffect(() => {
        if (!fontSource) return;

        let isMounted = true;
        const fontFace = new FontFace(effectiveFamily, `url(${fontSource.url}) format('${fontSource.format}')`);
        fontFace.load().then((loaded) => {
            if (!isMounted) return;
            document.fonts.add(loaded);
            setFontLoaded(true);
        }).catch((err) => {
            console.error(`Failed to load font ${effectiveFamily}:`, err);
        });

        return () => {
            isMounted = false;
        };
    }, [effectiveFamily, fontSource]);

    // 3. Strict Real Metadata (No fabricated values)
    // const totalStyles = variantCount ?? (font.font_variants && font.font_variants.length > 0 ? font.font_variants.length : 1);
    // const stylesLabel = `${totalStyles} ${totalStyles === 1 ? 'Style' : 'Styles'}`;

    // const licenseLabel = font.commercial_use === true
    //     ? 'DEMO'
    //     : font.license_type
    //         ? font.license_type.toUpperCase()
    //         : null;

    // const categoryLabel = font.category
    //     ? font.category.toUpperCase()
    //     : (font.tags && font.tags.length > 0)
    //         ? font.tags[0].toUpperCase()
    //         : null;

    // const variantLabel = activeVariantName || activeVariant?.variant_name?.toUpperCase() || null;

    return (
        <div
            ref={ref}
            className={`${isOg ? 'w-300 h-158.5 p-10' : 'w-300 h-200 p-14'} text-white relative overflow-hidden flex flex-col justify-end box-border select-none bg-linear-to-b from-white to-[#0A81FC]`}
            style={{
                backgroundImage: `url(${isOg ? '/gradients/blue-og.png' : '/gradients/blue.png'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* <div className="absolute inset-0 h-full w-full flex justify-center items-center">
                <img src="/gradients/dark2.png" alt="" className='h-full w-full object-contain object-center' />
            </div> */}

            {/* In-DOM @font-face style tag so html-to-image and SVG foreignObject can parse and embed the font */}
            {fontSource && (
                <style>
                    {`@font-face {
                            font-family: '${effectiveFamily}';
                            src: url('${fontSource.url}') format('${fontSource.format}');
                            font-display: block;
                        }`}
                </style>
            )}

            {/* HEADER */}
            {/* <div className="relative z-10 flex justify-between items-start gap-8">
                <div className={`flex ${isOg ? 'flex-row items-center gap-2.5 flex-wrap justify-end' : 'flex-col items-end gap-3'}`}>
                    <div className={`${isOg ? 'w-16 h-16' : 'w-20 h-20'} flex items-center justify-center`}>
                        <img src="/logo/transparent-logo-white.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                </div>
            </div> */}

            {/* MAIN CONTENT: CENTERED FONT TITLE */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <h1
                    className={`${customTitleFontSize ? '' : titleFontSizeClass} w-full px-6 font-normal text-center leading-none text-white mix-blend-screen`}
                    style={{
                        fontFamily: fontStack,
                        ...(customTitleFontSize ? { fontSize: `${customTitleFontSize}px` } : {}),
                    }}
                >
                    {font.name}
                </h1>
            </div>

            {/* FOOTER: REAL METADATA CHIPS & ATTRIBUTION */}
            <div className="relative z-10 flex justify-between items-end gap-6">
                <div>
                    <p className={`opacity-80 ${isOg ? 'text-3xl' : 'text-3xl'} font-inter-tight lowercase tracking-wider mb-2`}>Designed By</p>
                    <p className={`opacity-80z ${isOg ? 'text-4xl' : 'text-4xl'} font-inter-tight`}>
                        {/* {font.designer || 'Unknown Designer'} */}
                        {(font as any).taxonomy?.creator?.foundry || (font as any).taxonomy?.creator?.publisher || font.designer || 'Unknown'}
                    </p>
                </div>

                {/* Right: Platform Callout */}
                <div>
                    <p className={`opacity-80 ${isOg ? 'text-3xl' : 'text-3xl'} font-inter-tight text-right lowercase tracking-wider mb-2`}>
                        get it on
                    </p>
                    <p className={`opacity-80z ${isOg ? 'text-4xl' : 'text-4xl'} font-inter-tight text-right`}>
                        nobadfonts.in
                    </p>
                </div>
            </div>
        </div>
    );
});

SocialShareCard.displayName = 'SocialShareCard';

export default SocialShareCard;
