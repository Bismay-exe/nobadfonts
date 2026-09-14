import { useState } from 'react';
import AdminOgImageManager from '../fonts/AdminOgImageManager';
import VariantList from '../fonts/VariantList';
import type { Font } from '../../types/font';

interface FontVariantSectionProps {
    font: Font;
    profile: any;
    downloadFont: (url: string, filename: string) => Promise<void>;
    onFontUpdated: (updatedFields: Partial<Font>) => void;
    onVariantOgChange?: (variantId: string | null) => void;
}

export default function FontVariantSection({
    font,
    profile,
    downloadFont,
    onFontUpdated,
    onVariantOgChange,
}: FontVariantSectionProps) {
    const [variantPreviewText, setVariantPreviewText] = useState('');
    const [variantPreviewSize, setVariantPreviewSize] = useState(48);

    return (
        <div id="preview-section" className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
                <h2 className="text-2xl font-bold uppercase tracking-widest text-[rgb(var(--color-muted-foreground))]">
                    Variant Previews
                </h2>
                <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
            </div>

            {/* Admin OG Social Card Manager (Exclusively for Admins) */}
            {profile?.role === 'admin' && (
                <AdminOgImageManager
                    font={font}
                    onVariantChange={(variantId) => {
                        onVariantOgChange?.(variantId);
                    }}
                    onFontUpdated={onFontUpdated}
                />
            )}

            {/* Interactive Preview Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-4xl border border-[rgb(var(--color-foreground)/0.1)] bg-[rgb(var(--color-foreground)/0.05)]">
                <input
                    type="text"
                    value={variantPreviewText}
                    onChange={(e) => setVariantPreviewText(e.target.value)}
                    placeholder="Type something to preview..."
                    aria-label="Type specimen preview text"
                    className="w-full md:w-1/2 text-xl bg-transparent border-b border-[rgb(var(--color-foreground)/0.2)] focus:border-[rgb(var(--color-foreground)/0.4)] outline-none px-2 py-2 transition-colors placeholder:text-[rgb(var(--color-muted-foreground))] text-[rgb(var(--color-foreground)/0.85)]"
                />
                <div className="flex items-center gap-4 w-full md:w-auto bg-[rgb(var(--color-background)/0.5)] px-6 py-3 rounded-full border border-[rgb(var(--color-foreground)/0.1)] shadow-inner">
                    <span className="text-xs font-bold uppercase text-[rgb(var(--color-foreground)/0.8)] tracking-wider">
                        Size
                    </span>
                    <input
                        type="range"
                        min="16"
                        max="150"
                        value={variantPreviewSize}
                        onChange={(e) => setVariantPreviewSize(Number(e.target.value))}
                        aria-label="Adjust font preview size in pixels"
                        className="w-full md:w-48 accent-[rgb(var(--color-foreground))] cursor-pointer"
                    />
                    <span className="font-mono font-bold text-sm w-12 text-right text-[rgb(var(--color-foreground)/0.8)]">
                        {variantPreviewSize}px
                    </span>
                </div>
            </div>

            {/* List of Font Variants */}
            <VariantList
                font={font}
                profile={profile}
                variantPreviewText={variantPreviewText}
                variantPreviewSize={variantPreviewSize}
                downloadFont={downloadFont}
            />
        </div>
    );
}
