import { useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, LayoutTemplate, Settings2, BoxSelect, Check } from 'lucide-react';
import ContextPreview from './ContextPreview';
import type { Font } from '../../types/font';
import { cn } from '../../lib/utils';

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
    const [fontSize, setFontSize] = useState(64);
    const [lineHeight, setLineHeight] = useState(1.2);
    const [letterSpacing, setLetterSpacing] = useState(0);
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

    // Colors
    const [textColor, setTextColor] = useState('#ffffff');
    const [bgColor, setBgColor] = useState('#000000');

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
            if (font.font_variants?.length) {
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
            if (font.font_variants?.length) {
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
        <div className="flex flex-col gap-6 w-full">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Main Preview Area */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    {/* Preview Container */}
                    <div
                        className="relative w-full rounded-2xl overflow-hidden transition-all duration-300 min-h-100 flex flex-col items-center justify-center border border-white/10 shadow-2xl"
                        style={{ backgroundColor: bgColor }}
                    >
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none border-none p-8 md:p-12 placeholder-white/20 selection:bg-white/20"
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

                        {/* Quick Actions overlay */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2 py-1.5 bg-zinc-900/80 backdrop-blur-md rounded-full border border-white/10 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button onClick={() => setTextAlign('left')} className={cn("p-1.5 rounded-full hover:bg-white/10 transition-colors", textAlign === 'left' && "text-white bg-white/10")}><AlignLeft size={14} /></button>
                            <button onClick={() => setTextAlign('center')} className={cn("p-1.5 rounded-full hover:bg-white/10 transition-colors", textAlign === 'center' && "text-white bg-white/10")}><AlignCenter size={14} /></button>
                            <button onClick={() => setTextAlign('right')} className={cn("p-1.5 rounded-full hover:bg-white/10 transition-colors", textAlign === 'right' && "text-white bg-white/10")}><AlignRight size={14} /></button>
                            <div className="w-px h-3 bg-white/10 mx-1"></div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full border border-white/20 overflow-hidden cursor-pointer relative" style={{ background: textColor }}>
                                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="opacity-0 w-full h-full absolute inset-0 cursor-pointer" />
                                </div>
                                <div className="w-5 h-5 rounded-full border border-white/20 overflow-hidden cursor-pointer relative" style={{ background: bgColor }}>
                                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="opacity-0 w-full h-full absolute inset-0 cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex flex-col gap-6">
                        {/* Tabs */}
                        <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all",
                                    activeTab === 'settings' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                <Settings2 size={14} /> Typography
                            </button>
                            <button
                                onClick={() => setActiveTab('features')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all",
                                    activeTab === 'features' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                <BoxSelect size={14} /> Features
                            </button>
                        </div>

                        <div className="min-h-50">
                            {activeTab === 'settings' && (
                                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <ControlSlider label="Size" value={fontSize} min={12} max={200} onChange={setFontSize} suffix="px" />
                                    <ControlSlider label="Leading" value={lineHeight} min={0.8} max={3} step={0.1} onChange={setLineHeight} />
                                    <ControlSlider label="Tracking" value={letterSpacing} min={-10} max={50} onChange={setLetterSpacing} suffix="px" />

                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-xs font-bold text-zinc-500 uppercase mb-3">Presets</p>
                                        <div className="flex flex-wrap gap-2">
                                            <PresetBtn onClick={() => setText(TEXT_PRESETS.sentence)} label="Abc" />
                                            <PresetBtn onClick={() => setText(TEXT_PRESETS.alphabet)} label="A-Z" />
                                            <PresetBtn onClick={() => setText(TEXT_PRESETS.numerals)} label="123" />
                                            <PresetBtn onClick={() => setText(TEXT_PRESETS.paragraph)} label="¶" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'features' && (
                                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
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
                </div>
            </div>

            {/* Context/Real-world Preview Section */}
            <div className="w-full">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                        <LayoutTemplate size={18} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">In Context</h3>
                        <p className="text-xs text-zinc-500">See how it looks in real-world scenarios</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-white/5 overflow-hidden bg-black/20">
                    <ContextPreview fontFamily={fontName} />
                </div>
            </div>
        </div >
    );
}

function ControlSlider({ label, value, min, max, step = 1, onChange, suffix = '' }: any) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-zinc-400">{label}</span>
                <span className="font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded">{value}{suffix}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-white hover:accent-zinc-300 transition-all"
            />
        </div>
    );
}

function PresetBtn({ onClick, label }: any) {
    return (
        <button
            onClick={onClick}
            className="px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 hover:border-white/10 transition-all"
        >
            {label}
        </button>
    )
}

function Toggle({ label, code, checked, onChange }: { label: string, code: string, checked: boolean, onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={cn(
                "flex items-center justify-between w-full p-3 rounded-xl border transition-all duration-200 group text-sm",
                checked
                    ? "bg-white text-black border-white shadow-lg shadow-white/5"
                    : "bg-black/20 text-zinc-500 border-white/5 hover:border-white/10 hover:bg-white/5"
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                    checked ? "border-black bg-black text-white" : "border-zinc-700"
                )}>
                    {checked && <Check size={10} />}
                </div>
                <span className="font-medium">{label}</span>
            </div>
            <span className="font-mono text-[10px] opacity-40 uppercase tracking-wider">{code}</span>
        </button>
    );
}
