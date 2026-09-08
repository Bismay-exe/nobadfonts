import { forwardRef } from 'react';
import type { Font } from '../../types/font';

interface SocialShareCardProps {
    font: Font;
}

const SocialShareCard = forwardRef<HTMLDivElement, SocialShareCardProps>(({ font }, ref) => {
    // Determine a nice background based on the font name or random, 
    // but for consistency let's stick to a vibrant Neo-Brutalist or bold style.
    // We can use the font's slug to pick a color deterministically if we wanted,
    // but a solid premium look is often black/white or high-viz.

    // Let's go with a "Dark Premium" look which makes white text pop.

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
            {/* Background Texture/Elements */}
            {/* <div className="absolute top-0 right-0 w-150 h-150 bg-[rgb(var(--color-highlight))] rounded-full blur-[150px] opacity-20 -mr-32 -mt-32 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-150 h-150 bg-[rgb(var(--color-accent))] rounded-full blur-[120px] opacity-10 -ml-20 -mb-20 pointer-events-none"></div> */}

            {/* Header */}
            <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <p
                        className="text-4xl opacity-80 max-w-3xl leading-tight"
                        style={{ fontFamily: `custom-font-${font.slug}` }}
                    >
                        The quick brown fox jumps<br /> over the lazy dog. <br />1234567890
                    </p>

                </div>
                <div className="w-12 h-12 bg-[rgb(var(--color-muted))] rounded-xl overflow-hidden flex items-center justify-center">
                    <img src="/logo/logo.png" alt="" className='w-full h-full object-contain' />
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col justify-center">
                <h1
                    className="text-9xl text-center leading-none font-white mix-blend-screen"
                    style={{ fontFamily: `custom-font-${font.slug}` }}
                >
                    {font.name}
                </h1>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex justify-between items-end"> 
                <div>
                    <p className="text-[rgb(var(--color-muted-foreground))] text-2xl lowercase tracking-wider mb-2">Designed By</p>
                    <p className="opacity-80 text-4xl">{font.designer || 'Unknown Designer'}</p>
                </div>

                <div className="flex">
                    <span className="opacity-80 text-4xl text-right">
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
