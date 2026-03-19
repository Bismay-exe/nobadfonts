import { useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, LayoutTemplate, BoxSelect, ChevronDown } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
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

const FONT_WEIGHT_ORDER: Record<string, number> = {
    'thin': 100,
    'hairline': 100,
    'extralight': 200,
    'ultralight': 200,
    'light': 300,
    'regular': 400,
    'normal': 400,
    'book': 400,
    'medium': 500,
    'semibold': 600,
    'demibold': 600,
    'bold': 700,
    'extrabold': 800,
    'ultrabold': 800,
    'black': 900,
    'heavy': 900,
    'extrablack': 950,
    'ultrablack': 950
};

const getVariantWeightAndStyle = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName === 'regular') return { weight: 400, isItalic: false };

    let weight = 400; // default
    for (const [key, value] of Object.entries(FONT_WEIGHT_ORDER)) {
        if (lowercaseName.includes(key) || lowercaseName.replace(/\s+/g, '').includes(key)) {
            weight = value;
            break;
        }
    }
    const isItalic = lowercaseName.includes('italic') || lowercaseName.includes('oblique');
    return { weight, isItalic };
};

export default function FontTester({ font }: FontTesterProps) {
    const [text, setText] = useState(TEXT_PRESETS.sentence);

    const autoResize = (element: HTMLTextAreaElement | null) => {
        if (element) {
            element.style.height = 'auto';
            element.style.height = `${element.scrollHeight}px`;
        }
    };

    // Typography Settings
    const [fontSize, setFontSize] = useState(48);
    const [lineHeight, setLineHeight] = useState(1.5);
    const [letterSpacing, setLetterSpacing] = useState(0);
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

    // Colors
    const [textColor, setTextColor] = useState('#FFFFFF');
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

    const [showMobileFeatures, setShowMobileFeatures] = useState(false);


    const [selectedVariant, setSelectedVariant] = useState(
        font.font_variants?.find(v => v.variant_name === 'Regular') || font.font_variants?.[0] || null
    );
    const [variantDropdownOpen, setVariantDropdownOpen] = useState(false);

    const fontName = `custom-font-${font.slug}-${selectedVariant?.id || 'base'}`;

    // Dynamically load the font
    useEffect(() => {
        if (!font) return;

        const getFontSource = () => {
            if (selectedVariant) {
                if (selectedVariant.woff2_url) return { url: selectedVariant.woff2_url, format: 'woff2' };
                if (selectedVariant.woff_url) return { url: selectedVariant.woff_url, format: 'woff' };
                if (selectedVariant.ttf_url) return { url: selectedVariant.ttf_url, format: 'truetype' };
                if (selectedVariant.otf_url) return { url: selectedVariant.otf_url, format: 'opentype' };
            }

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
    }, [font, fontName, selectedVariant]);

    // Construct Font Feature Settings string
    const fontFeatureSettings = Object.entries(features)
        .map(([key, enabled]) => `"${key}" ${enabled ? 1 : 0}`)
        .join(', ');

    // Auto-resize on changes
    useEffect(() => {
        const timeout = setTimeout(() => {
            const textarea = document.getElementById(`font-tester-textarea-${font.slug}`) as HTMLTextAreaElement;
            if (textarea && textarea.value) {
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
            }
        }, 50);
        return () => clearTimeout(timeout);
    }, [text, fontSize, lineHeight, letterSpacing, features]);

    const sortedVariants = [...(font.font_variants || [])].sort((a, b) => {
        const aProps = getVariantWeightAndStyle(a.variant_name);
        const bProps = getVariantWeightAndStyle(b.variant_name);

        if (aProps.weight !== bProps.weight) {
            return aProps.weight - bProps.weight;
        }
        if (aProps.isItalic !== bProps.isItalic) {
            return aProps.isItalic ? 1 : -1;
        }
        return a.variant_name.localeCompare(b.variant_name);
    });

    return (
        <div className="overflow-hidden flex flex-col h-full shadow-lg">


            {/* Controls Toolbar */}
            <div className="p-2">
                {/* Controls Content */}
                <div className="pb-4">
                    {/* Settings - Always visible */}
                    <div className="flex flex-col xl:flex-row gap-4">

                        <div className='flex flex-wrap md:flex-nowrap gap-2 justify-between items-end'>
                            {font.font_variants && font.font_variants.length > 0 && (
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setVariantDropdownOpen(!variantDropdownOpen);
                                            Haptics.impact({ style: ImpactStyle.Light });
                                        }}
                                        className="h-8 px-3 py-1 bg-[rgb(var(--color-muted)/0.1)] hover:bg-[rgb(var(--color-foreground)/0.9)] hover:text-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-md text-xs font-medium whitespace-nowrap hover:border-[rgb(var(--color-foreground))] transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                        {selectedVariant?.variant_name || 'Select Variant'}
                                        <ChevronDown size={14} className={`transition-transform ${variantDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <div className={`absolute left-0 top-full mt-2 w-48 bg-[rgb(var(--color-card)/0.05)] backdrop-blur-2xl border border-[rgb(var(--color-border))] divide-y divide-[rgb(var(--color-border)/0.5)] rounded-xl overflow-y-auto max-h-64 custom-scrollbar transition-all shadow-xl z-20 flex flex-col origin-top-left transform ${variantDropdownOpen ? 'opacity-100 visible scale-100 pointer-events-auto' : 'opacity-0 invisible scale-95 pointer-events-none'}`}>
                                        {sortedVariants.map(variant => (
                                            <button
                                                key={variant.id}
                                                onClick={() => {
                                                    setSelectedVariant(variant);
                                                    setVariantDropdownOpen(false);
                                                    Haptics.impact({ style: ImpactStyle.Light });
                                                }}
                                                className="px-4 py-3 text-xs font-bold text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-muted)/0.1)] transition-colors text-left flex justify-between items-center cursor-pointer"
                                            >
                                                <span>{variant.variant_name}</span>
                                                {selectedVariant?.id === variant.id && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-foreground))]"></span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 items-end">
                                {/* Preset Buttons */}
                                <button onClick={() => { setText(TEXT_PRESETS.sentence); Haptics.impact({ style: ImpactStyle.Light }); }} className="h-8 px-3 py-1 bg-[rgb(var(--color-muted)/0.1)] hover:bg-[rgb(var(--color-foreground)/0.9)] hover:text-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-md text-xs font-medium hover:border-[rgb(var(--color-foreground))] transition-colors cursor-pointer">Abc</button>
                                <button onClick={() => { setText(TEXT_PRESETS.alphabet); Haptics.impact({ style: ImpactStyle.Light }); }} className="h-8 px-3 py-1 bg-[rgb(var(--color-muted)/0.1)] hover:bg-[rgb(var(--color-foreground)/0.9)] hover:text-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-md text-xs whitespace-nowrap font-medium hover:border-[rgb(var(--color-foreground))] transition-colors cursor-pointer">A-Z</button>
                                <button onClick={() => { setText(TEXT_PRESETS.numerals); Haptics.impact({ style: ImpactStyle.Light }); }} className="h-8 px-3 py-1 bg-[rgb(var(--color-muted)/0.1)] hover:bg-[rgb(var(--color-foreground)/0.9)] hover:text-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-md text-xs font-medium hover:border-[rgb(var(--color-foreground))] transition-colors cursor-pointer">123</button>
                                <button onClick={() => { setText(TEXT_PRESETS.paragraph); Haptics.impact({ style: ImpactStyle.Light }); }} className="h-8 px-3 py-1 bg-[rgb(var(--color-muted)/0.1)] hover:bg-[rgb(var(--color-foreground)/0.9)] hover:text-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-md text-xs font-medium hover:border-[rgb(var(--color-foreground))] transition-colors cursor-pointer">¶</button>
                            </div>
                        </div>
                        <div className="flex gap-3 md:gap-4 w-full">
                            <div className="w-full">
                                <div className="flex justify-between text-xs font-mono text-[rgb(var(--color-muted-foreground))] uppercase">
                                    <span>Size</span>
                                    <span>{fontSize}px</span>
                                </div>
                                <input type="range" min="12" max="200" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-[rgb(var(--color-foreground))] h-1 bg-[rgb(var(--color-muted)/0.1)] rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div className="w-full">
                                <div className="flex justify-between text-xs font-mono font-bold text-[rgb(var(--color-muted-foreground))] uppercase">
                                    <span>Leading</span>
                                    <span>{lineHeight}</span>
                                </div>
                                <input type="range" min="0.8" max="3" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} className="w-full accent-[rgb(var(--color-foreground))] h-1 bg-[rgb(var(--color-muted)/0.1)] rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div className="w-full">
                                <div className="flex justify-between text-xs font-mono font-bold text-[rgb(var(--color-muted-foreground))] uppercase">
                                    <span>Tracking</span>
                                    <span>{letterSpacing}px</span>
                                </div>
                                <input type="range" min="-10" max="50" value={letterSpacing} onChange={(e) => setLetterSpacing(Number(e.target.value))} className="w-full accent-[rgb(var(--color-foreground))] h-1 bg-[rgb(var(--color-muted)/0.1)] rounded-lg appearance-none cursor-pointer" />
                            </div>
                        </div>

                        <div className="flex items-end justify-between sm:justify-start gap-4">
                            <div className="flex gap-2">
                                {/* OpenType Features Toggle */}
                                <button
                                    onClick={() => {
                                        setShowMobileFeatures(!showMobileFeatures);
                                        Haptics.impact({ style: ImpactStyle.Light });
                                    }}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors space-nowrap border border-[rgb(var(--color-border))] cursor-pointer
                                        ${showMobileFeatures ? 'bg-[rgb(var(--color-foreground)/0.9)] text-[rgb(var(--color-background))]' : 'bg-[rgb(var(--color-muted)/0.1)] text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-foreground)/0.9)] hover:text-[rgb(var(--color-background))]'}
                                    `}
                                >
                                    <BoxSelect size={14} /> Features
                                </button>
                            </div>
                            <div className="flex bg-[rgb(var(--color-muted)/0.1)] rounded-lg border border-[rgb(var(--color-border))] p-1 gap-1 flex-1 sm:flex-none">
                                <button onClick={() => { setTextAlign('left'); Haptics.impact({ style: ImpactStyle.Light }); }} className={`flex-1 sm:flex-none p-1 rounded cursor-pointer ${textAlign === 'left' ? 'bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] shadow-sm' : 'text-[rgb(var(--color-muted-foreground))]'}`}><AlignLeft size={16} className="mx-auto" /></button>
                                <button onClick={() => { setTextAlign('center'); Haptics.impact({ style: ImpactStyle.Light }); }} className={`flex-1 sm:flex-none p-1 rounded cursor-pointer ${textAlign === 'center' ? 'bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] shadow-sm' : 'text-[rgb(var(--color-muted-foreground))]'}`}><AlignCenter size={16} className="mx-auto" /></button>
                                <button onClick={() => { setTextAlign('right'); Haptics.impact({ style: ImpactStyle.Light }); }} className={`flex-1 sm:flex-none p-1 rounded cursor-pointer ${textAlign === 'right' ? 'bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] shadow-sm' : 'text-[rgb(var(--color-muted-foreground))]'}`}><AlignRight size={16} className="mx-auto" /></button>
                            </div>

                            <div className="flex gap-2">
                                <div className="relative w-8 h-8 rounded-full border border-[rgb(var(--color-border))] overflow-hidden cursor-pointer shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: textColor }}>
                                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                                </div>
                                <div className="relative w-8 h-8 rounded-full border border-[rgb(var(--color-border))] overflow-hidden cursor-pointer shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: bgColor }}>
                                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features - Toggleable on all devices */}
                    <div className={`${showMobileFeatures ? 'flex' : 'hidden'} flex-wrap gap-2 mt-4 pt-4 border-t border-[rgb(var(--color-border))] animate-in fade-in slide-in-from-top-2 duration-200`}>
                        <Toggle label="Ligatures" code="liga" checked={features.liga} onChange={() => setFeatures(p => ({ ...p, liga: !p.liga }))} />
                        <Toggle label="Discretionary" code="dlig" checked={features.dlig} onChange={() => setFeatures(p => ({ ...p, dlig: !p.dlig }))} />
                        <Toggle label="Small Caps" code="smcp" checked={features.smcp} onChange={() => setFeatures(p => ({ ...p, smcp: !p.smcp }))} />
                        <Toggle label="Fractions" code="frac" checked={features.frac} onChange={() => setFeatures(p => ({ ...p, frac: !p.frac }))} />
                        <Toggle label="Slashed Zero" code="zero" checked={features.zero} onChange={() => setFeatures(p => ({ ...p, zero: !p.zero }))} />
                        <Toggle label="Tabular #s" code="tnum" checked={features.tnum} onChange={() => setFeatures(p => ({ ...p, tnum: !p.tnum }))} />
                        <Toggle label="Alternates" code="salt" checked={features.salt} onChange={() => setFeatures(p => ({ ...p, salt: !p.salt }))} />
                    </div>
                </div>
            </div>

            {/* Preview Area */}
            <div
                className="flex-1 border-2 border-[rgb(var(--color-border))] rounded-4xl relative transition-colors duration-300 min-h-40"
                style={{ backgroundColor: bgColor }}
            >
                <textarea
                    id={`font-tester-textarea-${font.slug}`}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        autoResize(e.target);
                    }}
                    onFocus={(e) => autoResize(e.target)}
                    className="w-full bg-transparent resize-none outline-none border-none p-8 md:p-12 overflow-hidden placeholder-[rgb(var(--color-muted-foreground)/0.5)] selection:bg-[rgb(var(--color-muted-foreground)/0.3)]"
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

            <div className="border-y border-[rgb(var(--color-border))]">
                <div className="p-4 border-b border-[rgb(var(--color-border))]">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-[rgb(var(--color-foreground))]">
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
            onClick={() => {
                onChange();
                Haptics.impact({ style: ImpactStyle.Light });
            }}
            className={`px-3 py-1.5 rounded-md border flex items-center gap-2 transition-all text-xs font-bold
                ${checked
                    ? 'bg-[rgb(var(--color-foreground)/0.9)] text-[rgb(var(--color-background))] border-[rgb(var(--color-foreground))] shadow-md'
                    : 'bg-[rgb(var(--color-muted)/0.1)] text-[rgb(var(--color-muted-foreground))] border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-foreground)/0.9)] hover:text-[rgb(var(--color-background))]'}
            `}
        >
            <span>{label}</span>
            <span className="font-mono opacity-50 text-[10px]">{code}</span>
        </button>
    );
}
