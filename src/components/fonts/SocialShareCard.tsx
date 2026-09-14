import { forwardRef, useEffect, useMemo, useState } from 'react';
import type { Font } from '../../types/font';

interface SocialShareCardProps {
    font: Font;
    aspectRatio?: 'og' | 'share';
    selectedVariantId?: string | null;
    fontFamilyOverride?: string;
    activeVariantName?: string;
    variantCount?: number;
}

const SocialShareCard = forwardRef<HTMLDivElement, SocialShareCardProps>(({
    font,
    aspectRatio = 'share',
    selectedVariantId,
    fontFamilyOverride,
    // activeVariantName,
    // variantCount
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
            className={`${isOg ? 'w-300 h-158.5 p-10' : 'w-300 h-200 p-14'} text-white relative overflow-hidden flex flex-col justify-between box-border select-none`}
            style={{
                backgroundImage: 'url("/gradients/5.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* In-DOM @font-face style tag so html-to-image and SVG foreignObject can parse and embed the font */}
            {fontSource && (
                <style>
                    {`
                        @font-face {
                            font-family: '${effectiveFamily}';
                            src: url('${fontSource.url}') format('${fontSource.format}');
                            font-display: block;
                        }
                    `}
                </style>
            )}

            {/* HEADER */}
            <div className="relative z-10 flex justify-between items-start gap-8">
                <div className="flex-1">
                    <p
                        className={`${isOg ? 'text-4xl' : 'text-5xl'} leading-tight text-white/90 drop-shadow-sm font-normal`}
                        style={{ fontFamily: fontStack }}
                    >
                        The quick brown fox jumps <br />over the lazy dog. <br />1234567890
                    </p>
                    <div className='flex gap-2'>
                        {/* {variantLabel && (
                            <div className={`mt-2.5 items-center gap-1.5 ${isOg ? 'zpx-3.5 py-1.5 text-lg hidden' : 'px-4 py-2 text-xl'} rounded-full zbg-[#492FA7] font-inter font-medium tracking-wider text-white z-10`}>
                                SPECIMEN ● {variantLabel}
                            </div>
                        )} */}
                        {/* <span className={`mt-2.5 items-center gap-1.5 ${isOg ? 'zpx-3.5 py-1.5 text-lg hidden' : 'px-4 py-2 text-xl'} rounded-full zbg-[#492FA7] font-inter font-medium tracking-wider text-white capitalize`}>
                            ● {stylesLabel}
                        </span> */}
                    </div>
                </div>

                {/* Logo & Brand Tag */}
                <div className={`flex ${isOg ? 'flex-row items-center gap-2.5 flex-wrap justify-end' : 'flex-col items-end gap-3'} bg-black/40 backdrop-blur-md rounded-2xl`}>
                    <div className={`${isOg ? 'w-16 h-16' : 'w-18 h-18'} rounded-lg overflow-hidden flex items-center justify-center`}>
                        <img src="/logo/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT: GIANT FONT TITLE */}
            <div className="relative h-full w-full z-10 flex flex-col justify-center items-center">
                <span
                    className="relative w-fit zh-full flex justify-center items-center"
                    style={{ fontFamily: fontStack }}
                >
                    <h1
                        className={`${titleFontSizeClass} font-normal text-center text-align-middle leading-none text-white mix-blend-screen px-4`}
                        style={{ fontFamily: fontStack }}
                    >
                        
                        {font.name}
                        {/* {licenseLabel && (
                            <span className={`${isOg ? 'px-3.5 py-1.5 text-lg' : 'px-4 py-2 text-xl'} absolute -ml-4 rotate-18 rounded-full bg-[#492FA7] font-inter font-medium tracking-wider text-white`}>
                                {licenseLabel}
                            </span>
                        )} */}
                        {/* <br /> <span className={`${isOg ? 'px-3.5 py-1.5 text-lg' : 'zpx-4 zpy-2 text-xl'} leading-none mr-8 rounded-full zbg-[#492FA7] font-inter font-medium tracking-wider text-white`}>
                            ● {stylesLabel}
                        </span>  */}
                    </h1>
                    {/* <span className={`${isOg ? 'px-3.5 py-1.5 text-lg' : 'px-4 py-2 text-xl'} absolute -bottom-10 left-0 rounded-full bg-[#492FA7] font-inter font-medium tracking-wider text-white`}>
                        {stylesLabel}
                    </span> */}
                </span>
            </div>

            {/* FOOTER: REAL METADATA CHIPS & ATTRIBUTION */}
            <div className="relative z-10 flex justify-between items-end gap-6">
                <div>
                    <p className={`text-[rgb(var(--color-muted-foreground))] ${isOg ? 'text-xl' : 'text-2xl'} font-inter-tight lowercase tracking-wider mb-2`}>Designed By</p>
                    <p className={`opacity-80 ${isOg ? 'text-3xl' : 'text-4xl'} font-inter-tight`}>{font.designer || 'Unknown Designer'}</p>
                </div>

                {/* Right: Platform Callout */}
                <div className="flex">
                    <span className={`opacity-80 ${isOg ? 'text-3xl' : 'text-4xl'} font-inter-tight text-right`}>
                        get it on <br />nobadfonts.in
                    </span>
                </div>
            </div>
        </div>
    );
});

SocialShareCard.displayName = 'SocialShareCard';

export default SocialShareCard;
