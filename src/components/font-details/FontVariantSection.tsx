import { useState } from 'react';
import VariantList from '../fonts/VariantList';
import type { Font } from '../../types/font';

interface FontVariantSectionProps {
    font: Font;
    profile: any;
    downloadFont: (url: string, filename: string) => Promise<void>;
}

export default function FontVariantSection({
    font,
    profile,
    downloadFont,
}: FontVariantSectionProps) {
    const [variantPreviewText, setVariantPreviewText] = useState('');
    const [variantPreviewSize, setVariantPreviewSize] = useState(84);
    const [variantLineHeight, setVariantLineHeight] = useState(1.4);
    const [variantLetterSpacing, setVariantLetterSpacing] = useState(0);

    return (
        <div id="preview-section" className="space-y-0 mt-20">
            <div className="flex justify-center items-center gap-4">
                <h2 className="text-4xl sm:text-6xl md:text-8xl font-inter-tight font-medium zuppercase ztracking-widest text-[rgb(var(--color-foreground))]">
                    Specimens
                </h2>
            </div>

            <div className='relative w-full h-px bg-[rgb(var(--color-background))] translate-y-px z-12'></div>
            <div className='sticky top-[111.5px] md:top-[63.5px] w-full h-px bg-linear-to-r from-transparent via-[rgb(var(--color-foreground)/0.1)] to-transparent z-11'></div>

            {/* Interactive Preview Controls */}
            <div className="sticky h-full top-[111.5px] md:top-[63.5px] z-10 mt-10 sm:mt-20 py-2 bg-[rgb(var(--color-background))] border-b border-[rgb(var(--color-foreground)/0)]">
                <div className="absolute top-0 h-px w-full bg-linear-to-r from-transparent via-[rgb(var(--color-foreground)/0)] to-transparent"></div>
                <div className="absolute bottom-0 h-px w-full bg-[rgb(var(--color-foreground)/0.1)] sm:bg-transparent bg-linear-to-r from-transparent via-[rgb(var(--color-foreground)/0)] to-transparent"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-center">
                    {/* Your text */}
                    <div className="order-last sm:order-first flex flex-col gap-2.5 font-inter-tight font-light">
                        {/* <div className="flex items-center justify-between text-xs md:text-sm text-[rgb(var(--color-muted-foreground))]">
                            <span className="font-normal">Your text</span>
                            {variantPreviewText && (
                                <button
                                    onClick={() => setVariantPreviewText('')}
                                    className="text-[11px] font-mono hover:text-[rgb(var(--color-foreground))] cursor-pointer transition-colors"
                                >
                                    Reset
                                </button>
                            )}
                        </div> */}
                        <input
                            type="text"
                            value={variantPreviewText}
                            onChange={(e) => setVariantPreviewText(e.target.value)}
                            placeholder="Your text"
                            aria-label="Type specimen preview text"
                            className="w-full bg-transparent text-2xl text-[rgb(var(--color-foreground))] placeholder:text-[rgb(var(--color-muted-foreground)/0.4)] pb-1 transition-colors
                            outline-none! focus:outline-none! focus-visible:outline-none! ring-0! focus:ring-0! focus-visible:ring-0! shadow-none! focus:shadow-none!"
                        />
                    </div>

                    {/* Size */}
                    <div className="flex zflex-col items-center gap-2.5">
                        <div className="flex items-center justify-between text-xs md:text-sm text-[rgb(var(--color-muted-foreground))]">
                            <span className="font-normal whitespace-nowrap">Size</span>
                            <span className="hidden font-mono text-[rgb(var(--color-foreground)/0.8)]">{variantPreviewSize}</span>
                        </div>
                        <input
                            type="range"
                            min="16"
                            max="160"
                            value={variantPreviewSize}
                            onChange={(e) => setVariantPreviewSize(Number(e.target.value))}
                            aria-label="Adjust font preview size"
                            className="w-full h-0.5 bg-[rgb(var(--color-foreground)/0.2)] appearance-none cursor-pointer accent-[#0070f3] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0070f3] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#0070f3] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                        />
                    </div>

                    {/* Line Height */}
                    <div className="flex zflex-col items-center gap-2.5">
                        <div className="flex items-center justify-between text-xs md:text-sm text-[rgb(var(--color-muted-foreground))]">
                            <span className="font-normal whitespace-nowrap">Line Height</span>
                            <span className="hidden font-mono text-[rgb(var(--color-foreground)/0.8)]">{variantLineHeight}</span>
                        </div>
                        <input
                            type="range"
                            min="0.8"
                            max="2.5"
                            step="0.1"
                            value={variantLineHeight}
                            onChange={(e) => setVariantLineHeight(Number(e.target.value))}
                            aria-label="Adjust font preview line height"
                            className="w-full h-0.5 bg-[rgb(var(--color-foreground)/0.2)] appearance-none cursor-pointer accent-[#0070f3] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0070f3] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#0070f3] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                        />
                    </div>

                    {/* Letter Spacing */}
                    <div className="flex zflex-col items-center gap-2.5">
                        <div className="flex items-center justify-between text-xs md:text-sm text-[rgb(var(--color-muted-foreground))]">
                            <span className="font-normal whitespace-nowrap">Letter Spacing</span>
                            <span className="hidden font-mono text-[rgb(var(--color-foreground)/0.8)]">{variantLetterSpacing}</span>
                        </div>
                        <input
                            type="range"
                            min="-4"
                            max="20"
                            step="0.5"
                            value={variantLetterSpacing}
                            onChange={(e) => setVariantLetterSpacing(Number(e.target.value))}
                            aria-label="Adjust font preview letter spacing"
                            className="w-full h-0.5 bg-[rgb(var(--color-foreground)/0.2)] appearance-none cursor-pointer accent-[#0070f3] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0070f3] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#0070f3] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <div className="hidden sm:block sticky top-71 md:top-[116.2px] h-px w-full bg-linear-to-r from-transparent via-[rgb(var(--color-foreground)/0.1)] to-transparent z-20 md:mt-15"></div>

            {/* List of Font Variants */}
            <VariantList
                font={font}
                profile={profile}
                variantPreviewText={variantPreviewText}
                variantPreviewSize={variantPreviewSize}
                variantLineHeight={variantLineHeight}
                variantLetterSpacing={variantLetterSpacing}
                downloadFont={downloadFont}
            />
        </div>
    );
}
