import { X, Type, Palette, Layers } from 'lucide-react';
import type { Font } from '../../types/font';

interface StyleState {
    size: number;
    leading: number;
    tracking: number;
    color: string;
}

interface CustomizeSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activeSection: 'Header' | 'Body' | 'UI' | null;
    font: Font | null;
    currentVariant: string | null;
    currentStyle: StyleState;
    onVariantChange: (variant: string | null) => void;
    onStyleChange: (style: StyleState) => void;
}

export default function CustomizeSidebar({
    isOpen,
    onClose,
    activeSection,
    font,
    currentVariant,
    currentStyle,
    onVariantChange,
    onStyleChange
}: CustomizeSidebarProps) {
    if (!isOpen) return null;

    const variants = font?.font_variants || [];

    const handleStyleChange = (key: keyof StyleState, value: number | string) => {
        onStyleChange({ ...currentStyle, [key]: value });
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-[rgb(var(--color-foreground)/0.2)] z-40 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div className={`fixed inset-y-0 right-0 w-80 md:w-96 bg-[rgb(var(--color-background))] border-l-2 border-[rgb(var(--color-border))] shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out animation-slide-in-right ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="p-6 border-b-2 border-[rgb(var(--color-border))] flex justify-between items-center bg-[rgb(var(--color-card))]">
                    <div>
                        <h2 className="text-xl font-black uppercase text-[rgb(var(--color-foreground))]">Customize {activeSection}</h2>
                        <p className="text-xs font-bold text-[rgb(var(--color-muted-foreground))]">{font?.name || 'No Font Selected'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-full hover:bg-[rgb(var(--color-foreground))] hover:text-[rgb(var(--color-background))] transition-colors text-[rgb(var(--color-foreground))]"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8 overflow-y-auto grow">

                    {/* 1. Variant Selector */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-[rgb(var(--color-muted-foreground))] uppercase tracking-wider">
                            <Layers size={16} /> Font Variant
                        </div>
                        {variants.length > 0 ? (
                            <select
                                value={currentVariant || ''}
                                onChange={(e) => onVariantChange(e.target.value || null)}
                                className="w-full p-3 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border)/0.2)] rounded-xl font-bold focus:border-[rgb(var(--color-foreground))] focus:outline-none transition-colors appearance-none text-[rgb(var(--color-foreground))]"
                            >
                                <option value="">Regular (Default)</option>
                                {variants.map(v => (
                                    <option key={v.id} value={v.variant_name}>{v.variant_name}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="p-3 bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border)/0.2)] rounded-xl text-sm text-[rgb(var(--color-muted-foreground))] italic">
                                No additional variants available for this font.
                            </div>
                        )}
                    </div>

                    <hr className="border-[rgb(var(--color-border)/0.2)]" />

                    {/* 2. Typography Controls */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-[rgb(var(--color-muted-foreground))] uppercase tracking-wider">
                            <Type size={16} /> Typography
                        </div>

                        {/* Size */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-[rgb(var(--color-foreground))]">
                                <label>Size</label>
                                <span>{currentStyle.size}px</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="200"
                                value={currentStyle.size}
                                onChange={(e) => handleStyleChange('size', Number(e.target.value))}
                                className="w-full h-2 bg-[rgb(var(--color-foreground)/0.1)] rounded-lg appearance-none cursor-pointer accent-[rgb(var(--color-foreground))]"
                            />
                        </div>

                        {/* Leading (Line Height) */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-[rgb(var(--color-foreground))]">
                                <label>Line Height</label>
                                <span>{currentStyle.leading}</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.1"
                                value={currentStyle.leading}
                                onChange={(e) => handleStyleChange('leading', Number(e.target.value))}
                                className="w-full h-2 bg-[rgb(var(--color-foreground)/0.1)] rounded-lg appearance-none cursor-pointer accent-[rgb(var(--color-foreground))]"
                            />
                        </div>

                        {/* Tracking (Letter Spacing) */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-[rgb(var(--color-foreground))]">
                                <label>Letter Spacing</label>
                                <span>{currentStyle.tracking}px</span>
                            </div>
                            <input
                                type="range"
                                min="-10"
                                max="30"
                                step="0.5"
                                value={currentStyle.tracking}
                                onChange={(e) => handleStyleChange('tracking', Number(e.target.value))}
                                className="w-full h-2 bg-[rgb(var(--color-foreground)/0.1)] rounded-lg appearance-none cursor-pointer accent-[rgb(var(--color-foreground))]"
                            />
                        </div>
                    </div>

                    <hr className="border-[rgb(var(--color-border)/0.2)]" />

                    {/* 3. Color Picker */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-[rgb(var(--color-muted-foreground))] uppercase tracking-wider">
                            <Palette size={16} /> Text Color
                        </div>
                        <div className="flex items-center gap-4">
                            <input
                                type="color"
                                value={currentStyle.color}
                                onChange={(e) => handleStyleChange('color', e.target.value)}
                                className="w-12 h-12 rounded-full border-2 border-[rgb(var(--color-border)/0.2)] cursor-pointer p-0.5 bg-[rgb(var(--color-card))]"
                            />
                            <div className="text-sm font-mono font-bold text-[rgb(var(--color-foreground))]">{currentStyle.color}</div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
