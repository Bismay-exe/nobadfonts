import { useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, LayoutTemplate, Settings2, BoxSelect } from 'lucide-react';
import ContextPreview from './ContextPreview';
import type { Font } from '../../types/font';

interface FontTesterProps {
    font: Font;
}

const TEXT_PRESETS = {
    sentence: "The quick brown fox jumps over the lazy dog.",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz",
    numerals: "0123456789\n!@#$%^&*()_+-=[]{};':\",./<>?",
    paragraph: "Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed. The arrangement of type involves selecting typefaces, point sizes, line lengths, line-spacing, and letter-spacing, and adjusting the space between pairs of letters.",
    pangram1: "Sphinx of black quartz, judge my vow.",
    pangram2: "Pack my box with five dozen liquor jugs."
};

export default function FontTester({ font }: FontTesterProps) {
    const [text, setText] = useState(TEXT_PRESETS.sentence);

    // Typography Settings
    const [fontSize, setFontSize] = useState(48);
    const [lineHeight, setLineHeight] = useState(1.5);
    const [letterSpacing, setLetterSpacing] = useState(0);
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

    // Colors
    const [textColor, setTextColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#FFFFFF');

    // OpenType Features
    const [features, setFeatures] = useState({
        liga: true,  // Standard Ligatures
        dlig: false, // Discretionary Ligatures
        smcp: false, // Small Caps
        frac: false, // Fractions
        zero: false, // Slashed Zero
        tnum: false, // Tabular Figures
        salt: false  // Stylistic Alternates
    });

    const [activeTab, setActiveTab] = useState<'settings' | 'features'>('settings');


    const fontName = `custom-font-${font.slug}`;

    // Dynamically load the font
    useEffect(() => {
        if (!font) return;

        const getFontSource = () => {
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
        };

        const fontSource = getFontSource();
        if (!fontSource) return;

        const { url, format } = fontSource;
        const style = document.createElement('style');
        style.innerHTML = `
            @font-face {
                font-family: '${fontName}';
                src: url('${url}') format('${format}');
                font-display: swap;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, [font, fontName]);

    // Construct Font Feature Settings string
    const fontFeatureSettings = Object.entries(features)
        .map(([key, enabled]) => `"${key}" ${enabled ? 1 : 0}`)
        .join(', ');

    return (
        <div className="overflow-hidden flex flex-col h-full shadow-lg">


            {/* Controls Toolbar */}
            <div className="border-y border-black bg-[#EEEFEB] rounded-t-4xl p-2">
                <div className="flex gap-2 mb-2 p-2 bg-[#EEEFEB] rounded-xl overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors [#EEEFEB]space-nowrap
                                    ${activeTab === 'settings' ? 'bg-black text-[#EEEFEB]' : 'bg-[#EEEFEB] text-gray-600 hover:bg-gray-200'}
                                `}
                    >
                        <Settings2 size={14} /> Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('features')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors [#EEEFEB]space-nowrap
                                    ${activeTab === 'features' ? 'bg-black text-[#EEEFEB]' : 'bg-[#EEEFEB] text-gray-600 hover:bg-gray-200'}
                                `}
                    >
                        <BoxSelect size={14} /> OpenType Features
                    </button>

                    <div className="w-px h-6 bg-gray-300 mx-2 self-center"></div>

                    {/* Preset Buttons */}
                    <button onClick={() => setText(TEXT_PRESETS.sentence)} className="px-3 py-1.5 bg-[#EEEFEB] border border-gray-200 rounded-md text-xs font-medium hover:border-black transition-colors">Abc</button>
                    <button onClick={() => setText(TEXT_PRESETS.alphabet)} className="px-3 py-1.5 bg-[#EEEFEB] border border-gray-200 rounded-md text-xs font-medium hover:border-black transition-colors">A-Z</button>
                    <button onClick={() => setText(TEXT_PRESETS.numerals)} className="px-3 py-1.5 bg-[#EEEFEB] border border-gray-200 rounded-md text-xs font-medium hover:border-black transition-colors">123</button>
                    <button onClick={() => setText(TEXT_PRESETS.paragraph)} className="px-3 py-1.5 bg-[#EEEFEB] border border-gray-200 rounded-md text-xs font-medium hover:border-black transition-colors">¶</button>

                </div>

                {/* Controls Content */}
                <div className="px-2 pb-2">
                    {activeTab === 'settings' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                                    <span>Size</span>
                                    <span>{fontSize}px</span>
                                </div>
                                <input type="range" min="12" max="200" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-black h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                                    <span>Leading</span>
                                    <span>{lineHeight}</span>
                                </div>
                                <input type="range" min="0.8" max="3" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} className="w-full accent-black h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                                    <span>Tracking</span>
                                    <span>{letterSpacing}px</span>
                                </div>
                                <input type="range" min="-10" max="50" value={letterSpacing} onChange={(e) => setLetterSpacing(Number(e.target.value))} className="w-full accent-black h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                            </div>

                            <div className="flex items-end gap-2">
                                <div className="flex bg-gray-100 rounded-lg p-1 gap-1 flex-1">
                                    <button onClick={() => setTextAlign('left')} className={`flex-1 p-1 rounded ${textAlign === 'left' ? 'bg-[#EEEFEB] shadow-sm' : 'text-gray-400'}`}><AlignLeft size={16} className="mx-auto" /></button>
                                    <button onClick={() => setTextAlign('center')} className={`flex-1 p-1 rounded ${textAlign === 'center' ? 'bg-[#EEEFEB] shadow-sm' : 'text-gray-400'}`}><AlignCenter size={16} className="mx-auto" /></button>
                                    <button onClick={() => setTextAlign('right')} className={`flex-1 p-1 rounded ${textAlign === 'right' ? 'bg-[#EEEFEB] shadow-sm' : 'text-gray-400'}`}><AlignRight size={16} className="mx-auto" /></button>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative w-8 h-8 rounded-full border border-gray-200 overflow-hidden cursor-pointer shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: textColor }}>
                                        <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                                    </div>
                                    <div className="relative w-8 h-8 rounded-full border border-gray-200 overflow-hidden cursor-pointer shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: bgColor }}>
                                        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'features' && (
                        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <Toggle label="Ligatures" code="liga" checked={features.liga} onChange={() => setFeatures(p => ({ ...p, liga: !p.liga }))} />
                            <Toggle label="Discretionary" code="dlig" checked={features.dlig} onChange={() => setFeatures(p => ({ ...p, dlig: !p.dlig }))} />
                            <Toggle label="Small Caps" code="smcp" checked={features.smcp} onChange={() => setFeatures(p => ({ ...p, smcp: !p.smcp }))} />
                            <Toggle label="Fractions" code="frac" checked={features.frac} onChange={() => setFeatures(p => ({ ...p, frac: !p.frac }))} />
                            <Toggle label="Slashed Zero" code="zero" checked={features.zero} onChange={() => setFeatures(p => ({ ...p, zero: !p.zero }))} />
                            <Toggle label="Tabular #s" code="tnum" checked={features.tnum} onChange={() => setFeatures(p => ({ ...p, tnum: !p.tnum }))} />
                            <Toggle label="Alternates" code="salt" checked={features.salt} onChange={() => setFeatures(p => ({ ...p, salt: !p.salt }))} />
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Area */}
            <div
                className="flex-1 border-y border-black bg-[#EEEFEB] rounded-b-4xl relative overflow-auto transition-colors duration-300 min-h-125"
                style={{ backgroundColor: bgColor }}
            >
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-full bg-transparent resize-none outline-none border-none p-8 md:p-12 placeholder-gray-300 selection:bg-black/20"
                    style={{
                        fontFamily: `"${fontName}", sans-serif`,
                        fontSize: `${fontSize}px`,
                        lineHeight: lineHeight,
                        letterSpacing: `${letterSpacing}px`,
                        textAlign: textAlign,
                        color: textColor,
                        fontFeatureSettings: fontFeatureSettings
                    }}
                    spellCheck={false}
                />
            </div>

            <div className="bg-[#ffffff] rounded-4xl border-y border-black">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <LayoutTemplate size={20} />
                        Real-World Context
                    </h3>
                </div>
                <div className="">
                    <ContextPreview fontFamily={fontName} />
                </div>
            </div>
        </div >
    );
}

function Toggle({ label, code, checked, onChange }: { label: string, code: string, checked: boolean, onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={`px-3 py-1.5 rounded-md border flex items-center gap-2 transition-all text-xs font-bold
                ${checked
                    ? 'bg-black text-[#EEEFEB] border-black shadow-md transform scale-105'
                    : 'bg-[#EEEFEB] text-gray-500 border-gray-200 hover:border-black hover:text-black'}
            `}
        >
            <span>{label}</span>
            <span className="font-mono opacity-50 text-[10px]">{code}</span>
        </button>
    );
}
