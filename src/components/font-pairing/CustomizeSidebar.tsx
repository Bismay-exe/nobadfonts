import { X, Type, Palette, Layers } from 'lucide-react';
import type { Font } from '../../types/font';
import { cn } from '../../lib/utils';

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
                className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-zinc-950 border-l border-white/10 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out animation-slide-in-right">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md">
                    <div>
                        <h2 className="text-xl font-black uppercase text-white">Customize {activeSection}</h2>
                        <p className="text-xs font-bold text-zinc-500">{font?.name || 'No Font Selected'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-zinc-800 text-white border border-white/10 rounded-full hover:bg-white hover:text-black transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8 overflow-y-auto grow bg-black/20">

                    {/* 1. Variant Selector */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider">
                            <Layers size={16} /> Font Variant
                        </div>
                        {variants.length > 0 ? (
                            <select
                                value={currentVariant || ''}
                                onChange={(e) => onVariantChange(e.target.value || null)}
                                className="w-full p-3 bg-zinc-900 text-white border border-white/10 rounded-xl font-bold focus:border-[#BDF522] focus:outline-none transition-colors appearance-none"
                            >
                                <option value="">Regular (Default)</option>
                                {variants.map(v => (
                                    <option key={v.id} value={v.variant_name}>{v.variant_name}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-500 italic">
                                No additional variants available for this font.
                            </div>
                        )}
                    </div>

                    <hr className="border-white/5" />

                    {/* 2. Typography Controls */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider">
                            <Type size={16} /> Typography
                        </div>

                        {/* Size */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-zinc-300">
                                <label>Size</label>
                                <span className="text-[#BDF522]">{currentStyle.size}px</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="200"
                                value={currentStyle.size}
                                onChange={(e) => handleStyleChange('size', Number(e.target.value))}
                                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#BDF522]"
                            />
                        </div>

                        {/* Leading (Line Height) */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-zinc-300">
                                <label>Line Height</label>
                                <span className="text-[#00C2FF]">{currentStyle.leading}</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.1"
                                value={currentStyle.leading}
                                onChange={(e) => handleStyleChange('leading', Number(e.target.value))}
                                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00C2FF]"
                            />
                        </div>

                        {/* Tracking (Letter Spacing) */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-zinc-300">
                                <label>Letter Spacing</label>
                                <span className="text-[#FF90E8]">{currentStyle.tracking}px</span>
                            </div>
                            <input
                                type="range"
                                min="-10"
                                max="30"
                                step="0.5"
                                value={currentStyle.tracking}
                                onChange={(e) => handleStyleChange('tracking', Number(e.target.value))}
                                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#FF90E8]"
                            />
                        </div>
                    </div>

                    <hr className="border-white/5" />

                    {/* 3. Color Picker */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-wider">
                            <Palette size={16} /> Text Color
                        </div>
                        <div className="flex items-center gap-4 bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/20">
                                <input
                                    type="color"
                                    value={currentStyle.color}
                                    onChange={(e) => handleStyleChange('color', e.target.value)}
                                    className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"
                                />
                            </div>
                            <div className="text-sm font-mono font-bold text-white uppercase">{currentStyle.color}</div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
