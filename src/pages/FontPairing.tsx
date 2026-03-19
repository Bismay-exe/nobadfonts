import { useState, useEffect } from 'react';
import { useFonts } from '../hooks/useFonts';
import { supabase } from '../lib/supabase';
import type { Font } from '../types/font';
import { Type, AlignLeft, Edit3, Palette, Trash2 } from 'lucide-react';
import FontPicker from '../components/font-pairing/FontPicker';
import SEO from '../components/shared/SEO';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface StyleState {
    size: number;
    leading: number;
    tracking: number;
    color: string;
}

const InlineCustomizeOptions = ({
    font,
    currentVariant,
    currentStyle,
    onVariantChange,
    onStyleChange
}: {
    font: Font | null;
    currentVariant: string | null;
    currentStyle: StyleState;
    onVariantChange: (v: string | null) => void;
    onStyleChange: (s: StyleState) => void;
}) => {
    const variants = font?.font_variants || [];
    const handleStyleChange = (key: keyof StyleState, value: string | number) => {
        onStyleChange({ ...currentStyle, [key]: value as never });
    };

    return (
        <div className="flex items-center gap-2 md:gap-3 px-3 py-1 border-l border-[rgb(var(--color-border))]">
            {variants.length > 0 && (
                <div className="flex items-center font-bold">
                    <select
                        value={currentVariant || ''}
                        onChange={(e) => onVariantChange(e.target.value || null)}
                        className="bg-transparent text-[rgb(var(--color-foreground))] text-xs focus:outline-none cursor-pointer appearance-none transition-colors border-none"
                        title="Font Variant"
                    >
                        <option value="" className="bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))]">Regular</option>
                        {variants.map(v => (
                            <option key={v.id} value={v.variant_name} className="bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))]">{v.variant_name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="flex items-center gap-2" title="Font Size (px)">
                <span className="text-[10px] uppercase font-bold text-[rgb(var(--color-muted-foreground))]">Sz</span>
                <input
                    type="range"
                    min="10"
                    max="200"
                    value={currentStyle.size}
                    onChange={(e) => handleStyleChange('size', Number(e.target.value))}
                    className="w-16 md:w-24 h-1 bg-[rgb(var(--color-muted)/0.2)] rounded-lg appearance-none cursor-e-resize accent-[rgb(var(--color-foreground))] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [\u0026::-webkit-slider-thumb]:bg-[rgb(var(--color-foreground))] [\u0026::-webkit-slider-thumb]:rounded-full"
                />
                <input
                    type="number"
                    value={currentStyle.size}
                    onChange={(e) => handleStyleChange('size', Number(e.target.value))}
                    className="w-10 bg-transparent text-xs font-bold text-[rgb(var(--color-foreground))] focus:outline-none focus:bg-[rgb(var(--color-muted)/0.1)] rounded px-1 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none text-right"
                />
            </div>

            <div className="flex items-center gap-2" title="Line Height">
                <span className="text-[10px] uppercase font-bold text-[rgb(var(--color-muted-foreground))]">Lh</span>
                <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={currentStyle.leading}
                    onChange={(e) => handleStyleChange('leading', Number(e.target.value))}
                    className="w-16 md:w-24 h-1 bg-[rgb(var(--color-muted)/0.2)] rounded-lg appearance-none cursor-e-resize accent-[rgb(var(--color-foreground))] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [\u0026::-webkit-slider-thumb]:bg-[rgb(var(--color-foreground))] [\u0026::-webkit-slider-thumb]:rounded-full"
                />
                <input
                    type="number"
                    step="0.1"
                    value={currentStyle.leading}
                    onChange={(e) => handleStyleChange('leading', Number(e.target.value))}
                    className="w-10 bg-transparent text-xs font-bold text-[rgb(var(--color-foreground))] focus:outline-none focus:bg-[rgb(var(--color-muted)/0.1)] rounded px-1 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none text-right"
                />
            </div>

            <div className="flex items-center gap-2" title="Letter Spacing (px)">
                <span className="text-[10px] uppercase font-bold text-[rgb(var(--color-muted-foreground))]">Ls</span>
                <input
                    type="range"
                    min="-10"
                    max="30"
                    step="0.5"
                    value={currentStyle.tracking}
                    onChange={(e) => handleStyleChange('tracking', Number(e.target.value))}
                    className="w-16 md:w-24 h-1 bg-[rgb(var(--color-muted)/0.2)] rounded-lg appearance-none cursor-e-resize accent-[rgb(var(--color-foreground))] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [\u0026::-webkit-slider-thumb]:bg-[rgb(var(--color-foreground))] [\u0026::-webkit-slider-thumb]:rounded-full"
                />
                <input
                    type="number"
                    step="0.5"
                    value={currentStyle.tracking}
                    onChange={(e) => handleStyleChange('tracking', Number(e.target.value))}
                    className="w-10 bg-transparent text-xs font-bold text-[rgb(var(--color-foreground))] focus:outline-none focus:bg-[rgb(var(--color-muted)/0.1)] rounded px-1 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none text-right"
                />
            </div>

            <div className="flex items-center pl-1 border-l border-[rgb(var(--color-border))]" title="Text Color">
                <input
                    type="color"
                    value={currentStyle.color}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="w-5 h-5 cursor-pointer appearance-none bg-transparent border-none p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full"
                />
            </div>
        </div>
    );
};

interface TextBlock {
    id: string;
    type: 'Header' | 'Body';
    text: string;
    font: Font | null;
    variant: string | null;
    style: StyleState;
}

export default function FontPairing() {
    const { fonts, loading } = useFonts({ sortBy: 'popular' });

    const autoResize = (element: HTMLTextAreaElement | null) => {
        if (element) {
            element.style.height = 'auto';
            element.style.height = `${element.scrollHeight}px`;
        }
    };

    // Global background color
    const [bgColor, setBgColor] = useState('rgb(var(--color-background))');

    // Sidebar State
    const [sidebarMode, setSidebarMode] = useState<'picker' | null>(null);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    // Active Section for Picker is now derived when opening
    const [activeSection, setActiveSection] = useState<'Header' | 'Body' | 'UI' | null>(null);

    // Default styles for block creation
    const defaultHeaderStyle: StyleState = { size: 72, leading: 1.1, tracking: 0, color: 'rgb(var(--color-foreground))' };
    const defaultBodyStyle: StyleState = { size: 18, leading: 1.6, tracking: 0, color: 'rgb(var(--color-muted-foreground))' };

    const defaultHeaderText = "The fool doth think he is wise, but the wise man knows himself to be a fool. Love is blind, and lovers cannot see, The pretty follies that themselves commit.";
    const defaultBodyText = "Once upon a time, there was a young girl named Lily who lived in a small village. She had always been fascinated by the strange and vivid dreams she would have every night, filled with fantastical creatures and mysterious lands. Despite her parents' skepticism, Lily was certain that there was some kind of deeper meaning to these dreams, and was determined to uncover it. One day, Lily discovered a book in the local library about the interpretation of dreams, and became engrossed in its pages. She learned about the different symbols and themes that could appear in a dream, and was amazed at the insights she gained about her own subconscious mind. However, the book also warned of the dangers of becoming too obsessed with one's dreams, as it could lead to a loss of touch with reality. Undeterred, Lily began to actively seek out her dreams, using various methods to induce sleep and remember her nightly adventures. She soon found herself spending more and more time in the dream world, and less time in the waking world. Her friends and family began to worry about her as she became increasingly distant and aloof, lost in her own thoughts and visions. Despite the warning signs, Lily could not be swayed from her quest. She continued to delve deeper into her dreams, until one night she found herself in a strange and unfamiliar place. She was surrounded by dark and twisted creatures, who threatened to consume her soul. In that moment, Lily realized the truth of what she had been seeking - the depths of the human mind can be both beautiful and terrifying.";

    // Dynamic blocks state
    const [blocks, setBlocks] = useState<TextBlock[]>([
        {
            id: 'block-1',
            type: 'Header',
            text: defaultHeaderText,
            font: null,
            variant: null,
            style: { ...defaultHeaderStyle }
        },
        {
            id: 'block-2',
            type: 'Body',
            text: defaultBodyText,
            font: null,
            variant: null,
            style: { ...defaultBodyStyle }
        }
    ]);

    // Track default fonts status to avoid infinite loading loops
    const [defaultsLoaded, setDefaultsLoaded] = useState(false);

    // Helper to resolve font source
    const getSource = (f: Font, vName: string | null) => {
        // 1. Try specific variant if requested
        if (vName && f.font_variants) {
            const variant = f.font_variants.find(v => v.variant_name === vName);
            if (variant) {
                if (variant.woff2_url) return { url: variant.woff2_url, format: 'woff2' };
                if (variant.woff_url) return { url: variant.woff_url, format: 'woff' };
                if (variant.ttf_url) return { url: variant.ttf_url, format: 'truetype' };
                if (variant.otf_url) return { url: variant.otf_url, format: 'opentype' };
            }
        }

        // 2. Try main font object
        if (isValidUrl(f.woff2_url)) return { url: f.woff2_url, format: 'woff2' };
        if (isValidUrl(f.woff_url)) return { url: f.woff_url, format: 'woff' };
        if (isValidUrl(f.ttf_url)) return { url: f.ttf_url, format: 'truetype' };
        if (isValidUrl(f.otf_url)) return { url: f.otf_url, format: 'opentype' };

        // 3. Fallback: Try looking for "Regular" in variants if main failed
        if (f.font_variants && f.font_variants.length > 0) {
            const regular = f.font_variants.find(v => v.variant_name === 'Regular') || f.font_variants[0];
            if (regular) {
                if (regular.woff2_url) return { url: regular.woff2_url, format: 'woff2' };
                if (regular.woff_url) return { url: regular.woff_url, format: 'woff' };
                if (regular.ttf_url) return { url: regular.ttf_url, format: 'truetype' };
                if (regular.otf_url) return { url: regular.otf_url, format: 'opentype' };
            }
        }
        return null;
    };

    const isValidUrl = (url?: string | null) => {
        return url && url.length > 5; // Basic check
    }

    const loadFontToDoc = async (font: Font | null, variant: string | null, prefix: string) => {
        if (!font) return;
        const src = getSource(font, variant);
        if (!src) return;

        const family = `${prefix}-font-${font.id}-${variant || 'reg'}`;

        try {
            const fontFace = new FontFace(family, `url(${src.url}) format('${src.format}')`);
            const loadedFace = await fontFace.load();
            document.fonts.add(loadedFace);

            // Trigger auto-resize after font finishes loading
            setTimeout(() => {
                document.querySelectorAll('textarea').forEach(t => autoResize(t as HTMLTextAreaElement));
            }, 50);
        } catch (err) {
            console.error(`Failed to load ${family}`, err);
        }
    };

    // Auto-resize on block changes (text, styles, added/removed blocks)
    useEffect(() => {
        const timeout = setTimeout(() => {
            document.querySelectorAll('textarea').forEach(t => {
                if (t.value) {
                    t.style.height = 'auto';
                    t.style.height = `${t.scrollHeight}px`;
                }
            });
        }, 50);
        return () => clearTimeout(timeout);
    }, [blocks]);

    // Individual Font Loading Effects per block
    useEffect(() => {
        blocks.forEach(block => {
            loadFontToDoc(block.font, block.variant, block.id);
        });
    }, [blocks.map(b => `${b.id}-${b.font?.id}-${b.variant}`).join(',')]);


    // Setup initial fonts once loaded
    useEffect(() => {
        if (!loading && fonts.length > 0 && !defaultsLoaded) {
            const fetchDefaults = async () => {
                // Try to find them in the initially loaded fonts
                let lactosFont = fonts.find(f => f.name.toLowerCase().includes('lactos'));
                let gasterFont = fonts.find(f => f.name.toLowerCase().includes('gaster'));

                // If not found in the first batch, fetch them explicitly from Supabase
                if (!lactosFont || !gasterFont) {
                    const { data: specificFonts } = await supabase
                        .from('fonts')
                        .select('*, font_variants(*)')
                        .or('name.ilike.%Lactos%,name.ilike.%Gaster%');

                    if (specificFonts && specificFonts.length > 0) {
                        lactosFont = lactosFont || specificFonts.find(f => f.name.toLowerCase().includes('lactos'));
                        gasterFont = gasterFont || specificFonts.find(f => f.name.toLowerCase().includes('gaster'));
                    }
                }

                // If they are local-only fonts not in Supabase, mock their Font objects
                if (!lactosFont) lactosFont = { id: 'local-lactos', name: 'Dx Lactos', font_variants: [] } as unknown as Font;
                if (!gasterFont) gasterFont = { id: 'local-gaster', name: 'Dx Gaster', font_variants: [] } as unknown as Font;

                let hFont = lactosFont || fonts[0];
                let bFont = gasterFont || (fonts.length > 1 ? fonts[1] : fonts[0]);

                // Fetch full details for these (skip mock objects)
                const ids = [...new Set([hFont.id, bFont.id])].filter(id => !String(id).startsWith('local-'));
                if (ids.length > 0) {
                    const { data } = await supabase
                        .from('fonts')
                        .select('*, font_variants(*)')
                        .in('id', ids);

                    if (data) {
                        if (!String(hFont.id).startsWith('local-')) hFont = data.find(f => f.id === hFont.id) || hFont;
                        if (!String(bFont.id).startsWith('local-')) bFont = data.find(f => f.id === bFont.id) || bFont;
                    }
                }

                // Apply defaults up to the initial blocks
                setBlocks(prev => {
                    const newBlocks = [...prev];
                    if (newBlocks[0] && newBlocks[0].type === 'Header') {
                        newBlocks[0].font = hFont;
                    }
                    if (newBlocks[1] && newBlocks[1].type === 'Body') {
                        newBlocks[1].font = bFont;
                    }
                    return newBlocks;
                });

                setDefaultsLoaded(true);
            };
            fetchDefaults();
        }
    }, [loading, fonts, defaultsLoaded]);

    const handleOpenPicker = (blockId: string) => {
        setActiveBlockId(blockId);
        setActiveSection(blocks.find(b => b.id === blockId)?.type || null);
        setSidebarMode('picker');
    };

    const handleFontSelect = async (partialFont: Font) => {
        if (!activeBlockId) return;

        // Optimistic update
        setBlocks(prev => prev.map(b =>
            b.id === activeBlockId
                ? { ...b, font: partialFont, variant: null }
                : b
        ));

        // Fetch full details (variants)
        try {
            const { data, error } = await supabase
                .from('fonts')
                .select('*, font_variants(*)')
                .eq('id', partialFont.id)
                .single();

            if (error) throw error;
            if (data) {
                setBlocks(prev => prev.map(b =>
                    b.id === activeBlockId
                        ? { ...b, font: data }
                        : b
                ));
            }
        } catch (err) {
            console.error("Failed to fetch font details", err);
        }
    };

    const updateBlock = (id: string, updates: Partial<TextBlock>) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const addBlock = (afterId: string, type: 'Header' | 'Body') => {
        const index = blocks.findIndex(b => b.id === afterId);
        if (index === -1) return;

        const sourceBlock = blocks[index];
        const newBlockId = `block-${Date.now()}`;

        const newBlock: TextBlock = {
            id: newBlockId,
            type: type,
            text: sourceBlock.text,
            font: sourceBlock.font,
            variant: sourceBlock.variant,
            style: { ...sourceBlock.style }
        };

        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);

        setBlocks(newBlocks);
    };


    const removeBlock = (id: string) => {
        if (blocks.length > 1) {
            setBlocks(prev => prev.filter(b => b.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] relative text-selection">
            <style>{`
                .text-selection ::selection {
                    background: rgb(var(--color-foreground));
                    color: rgb(var(--color-background));
                }
            `}</style>
            <SEO title="Font Pairing Playground" />

            {/* Fullpage Modal: Picker */}
            <FontPicker
                isOpen={sidebarMode === 'picker'}
                onClose={() => setSidebarMode(null)}
                activeSection={activeSection}
                onSelect={handleFontSelect}
            />



            {/* Global Background Color Control */}
            <div className="fixed bottom-6 left-6 z-30 group">
                <button className="bg-[rgb(var(--color-muted))] text-[rgb(var(--color-foreground))] p-4 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-[rgb(var(--color-border))] hover:scale-110 transition-transform">
                    <Palette size={24} />
                </button>
                <div className="absolute left-0 bottom-full mb-4 bg-[rgb(var(--color-card))] p-4 rounded-2xl border border-[rgb(var(--color-border))] shadow-xl hidden group-hover:block w-56 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-xs font-bold mb-3 uppercase text-[rgb(var(--color-muted-foreground))]">Background Color</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            '#000000', '#09090b', '#18181b', '#27272a', // Zincs
                            '#ffffff', '#f4f4f5', '#e4e4e7', // Whites
                            '#1a0b0b', '#0b1a0b', '#0b0b1a' // Tints
                        ].map(color => (
                            <button
                                key={color}
                                onClick={() => setBgColor(color)}
                                className={cn(
                                    "w-8 h-8 rounded-full border border-[rgb(var(--color-border))] transition-transform hover:scale-110",
                                    bgColor === color && "ring-2 ring-[rgb(var(--color-foreground))] ring-offset-2 ring-offset-[rgb(var(--color-background))]"
                                )}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="pt-8 pb-12 px-6">
                <div className="max-w-480 mx-auto flex flex-col md:flex-col items-center justify-center gap-6">
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-[rgb(var(--color-foreground))] mb-4">
                            Type Pairing.
                        </h1>
                        <p className="text-[rgb(var(--color-muted-foreground))] max-w-xl mx-auto">
                            Mix, match, and experiment with real-time editing.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Playground */}
            <div className="px-0 md:px-4 pb-20">
                <motion.div
                    layout
                    className="max-w-480 mx-auto rounded-[3rem] p-0 md:p-16 relative transition-colors duration-500 shadow-2xl border border-[rgb(var(--color-border)/0.5)]"
                    style={{ backgroundColor: bgColor }}
                >
                    <div className="space-y-6 lg:space-y-12">

                        {blocks.map((block) => (
                            <div key={block.id} className="group relative">
                                <div className="absolute -left-12 top-0 hidden xl:flex flex-col items-center gap-2 opacity-20 transition-opacity group-hover:opacity-100">
                                    {block.type === 'Header' ? <Type size={24} /> : <AlignLeft size={24} />}

                                    {/* Add Block Button (Sidebar) */}
                                    <button
                                        onClick={() => addBlock(block.id, block.type)}
                                        className="mt-2 p-2 rounded-full bg-[rgb(var(--color-muted))] border border-[rgb(var(--color-border))] text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground))] hover:text-[rgb(var(--color-background))] transition-colors"
                                        title={`Add ${block.type} Block Below`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                    </button>

                                    {/* Delete Block Button (Sidebar) */}
                                    {blocks.length > 1 && (
                                        <button
                                            onClick={() => removeBlock(block.id)}
                                            className="mt-2 p-2 rounded-full bg-[rgb(var(--color-muted))] border border-[rgb(var(--color-border))] text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-destructive))] hover:text-[rgb(var(--color-background))] transition-colors"
                                            title="Delete Block"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Floating Controls */}
                                <div className="absolute -top-12 left-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 flex items-center gap-2">
                                    <div className="bg-[rgb(var(--color-background)/0.8)] backdrop-blur-md rounded-full border border-[rgb(var(--color-border))] p-1 flex items-center gap-1 shadow-2xl overflow-hidden md:overflow-visible">
                                        <button
                                            onClick={() => handleOpenPicker(block.id)}
                                            className="px-4 py-2 rounded-full font-bold text-xs bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-muted-foreground))] transition-colors flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <Edit3 size={12} />
                                            <span>{block.font?.name || 'Select Font'}</span>
                                        </button>
                                        <InlineCustomizeOptions
                                            font={block.font}
                                            currentVariant={block.variant}
                                            currentStyle={block.style}
                                            onVariantChange={(v) => updateBlock(block.id, { variant: v })}
                                            onStyleChange={(s) => updateBlock(block.id, { style: s })}
                                        />
                                    </div>
                                </div>

                                <textarea
                                    value={block.text}
                                    onChange={(e) => {
                                        updateBlock(block.id, { text: e.target.value });
                                        autoResize(e.target);
                                    }}
                                    onFocus={(e) => autoResize(e.target)}
                                    style={{
                                        fontFamily: block.font?.name ? `${block.id}-font-${block.font.id}-${block.variant || 'reg'}, ${block.font.name}` : undefined,
                                        fontSize: `${block.style.size}px`,
                                        lineHeight: block.style.leading,
                                        letterSpacing: `${block.style.tracking}px`,
                                        color: block.style.color,
                                        minHeight: block.type === 'Header' ? '80px' : '40px'
                                    }}
                                    className="w-full bg-transparent border-none outline-none resize-none overflow-hidden placeholder-[rgb(var(--color-muted-foreground)/0.5)] hover:bg-[rgb(var(--color-foreground)/0.05)] rounded-2xl transition-colors p-2 -ml-2 select-text"
                                    rows={block.type === 'Header' ? undefined : 1}
                                    spellCheck={false}
                                />
                            </div>
                        ))}

                    </div>
                </motion.div>
            </div>
        </div>
    );
}
