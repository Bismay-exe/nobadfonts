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
                className="fixed inset-0 bg-black/20 z-40 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-white border-l-2 border-black shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out animation-slide-in-right">

                {/* Header */}
                <div className="p-6 border-b-2 border-black flex justify-between items-center bg-[#F3F4F6]">
                    <div>
                        <h2 className="text-xl font-black uppercase">Customize {activeSection}</h2>
                        <p className="text-xs font-bold text-gray-500">{font?.name || 'No Font Selected'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white border-2 border-black rounded-full hover:bg-black hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8 overflow-y-auto grow">

                    {/* 1. Variant Selector */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                            <Layers size={16} /> Font Variant
                        </div>
                        {variants.length > 0 ? (
                            <select
                                value={currentVariant || ''}
                                onChange={(e) => onVariantChange(e.target.value || null)}
                                className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl font-bold focus:border-black focus:outline-none transition-colors appearance-none"
                            >
                                <option value="">Regular (Default)</option>
                                {variants.map(v => (
                                    <option key={v.id} value={v.variant_name}>{v.variant_name}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 italic">
                                No additional variants available for this font.
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-200" />

                    {/* 2. Typography Controls */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                            <Type size={16} /> Typography
                        </div>

                        {/* Size */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold">
                                <label>Size</label>
                                <span>{currentStyle.size}px</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="200"
                                value={currentStyle.size}
                                onChange={(e) => handleStyleChange('size', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                            />
                        </div>

                        {/* Leading (Line Height) */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold">
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
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                            />
                        </div>

                        {/* Tracking (Letter Spacing) */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold">
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
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                            />
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* 3. Color Picker */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                            <Palette size={16} /> Text Color
                        </div>
                        <div className="flex items-center gap-4">
                            <input
                                type="color"
                                value={currentStyle.color}
                                onChange={(e) => handleStyleChange('color', e.target.value)}
                                className="w-12 h-12 rounded-full border-2 border-gray-200 cursor-pointer p-0.5"
                            />
                            <div className="text-sm font-mono font-bold">{currentStyle.color}</div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
