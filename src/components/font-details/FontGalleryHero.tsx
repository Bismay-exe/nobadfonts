import React from 'react';
import { PreviewAccordion } from '../fonts/PreviewAccordion';
import type { Font } from '../../types/font';

interface FontGalleryHeroProps {
    font: Font;
    isFontLoaded: boolean;
}

export default function FontGalleryHero({ font, isFontLoaded }: FontGalleryHeroProps) {
    const galleryImages = font.gallery_images && font.gallery_images.length > 0
        ? font.gallery_images
        : (font.preview_image_url ? [font.preview_image_url] : []);

    const imageCount = galleryImages.length > 0 ? galleryImages.length : 1;
    // Desktop (Row): Width_total = (11 + N) * unit, Height = 8 * unit (for 3:2 expanded) -> AR = (11+N)/8
    const desktopAr = (11 + imageCount) / 8;
    // Mobile (Col): Width = 18 * unit (for 3:2 expanded), Height_total = (11 + N) * unit -> AR = 18/(11+N)
    const mobileAr = 18 / (11 + imageCount);

    return (
        <div
            className="relative w-full overflow-hidden rounded-4xl group"
            style={{ '--mobile-ar': mobileAr, '--desktop-ar': desktopAr } as React.CSSProperties}
        >
            {galleryImages.length > 0 ? (
                <div className={galleryImages.length > 1 ? 'relative h-full w-full aspect-(--mobile-ar) md:aspect-21/7' : 'relative h-full w-full'}>
                    <PreviewAccordion images={galleryImages} />
                </div>
            ) : (
                <div className="relative w-full h-full min-h-[60vh] bg-[rgb(var(--color-card))] rounded-4xl flex items-center justify-center p-8">
                    <h2
                        style={{
                            fontFamily: isFontLoaded ? `font-${font.id}` : 'sans-serif',
                            opacity: isFontLoaded ? 1 : 0
                        }}
                        className="text-[15vw] leading-none text-[rgb(var(--color-foreground)/0.9)] text-center wrap-break-word transition-opacity duration-500 drop-shadow-[0_0_30px_rgba(var(--color-foreground),0.2)]"
                    >
                        {font.name}
                    </h2>
                </div>
            )}
        </div>
    );
}
