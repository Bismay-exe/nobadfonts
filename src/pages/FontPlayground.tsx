import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SEO from '../components/shared/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Share2, Plus, X, ChevronDown } from 'lucide-react';

interface PlaygroundFont {
    id: string;
    name: string;
    slug: string;
    woff2_url?: string;
    woff_url?: string;
    has_variable?: boolean;
    variable_axes?: { tag: string; name: string; min: number; max: number; default: number }[];
}

interface FontSlot {
    id: string;
    font: PlaygroundFont | null;
    text: string;
    fontSize: number;
    weight: number;
    lineHeight: number;
    letterSpacing: number;
    color: string;
    background: string;
    italic: boolean;
    // Variable axes values
    axes: Record<string, number>;
}

const FONT_LOAD_CACHE = new Map<string, boolean>();

function loadFontFace(font: PlaygroundFont): Promise<void> {
    if (FONT_LOAD_CACHE.get(font.id)) return Promise.resolve();
    const url = font.woff2_url || font.woff_url;
    if (!url) return Promise.resolve();
    const face = new FontFace(font.name, `url('${url}')`);
    return face.load().then(loaded => {
        document.fonts.add(loaded);
        FONT_LOAD_CACHE.set(font.id, true);
    }).catch(() => {});
}

function createDefaultSlot(id: string): FontSlot {
    return {
        id,
        font: null,
        text: 'The quick brown fox jumps over the lazy dog',
        fontSize: 48,
        weight: 400,
        lineHeight: 1.2,
        letterSpacing: 0,
        color: '#000000',
        background: '#ffffff',
        italic: false,
        axes: {},
    };
}

function encodeState(slots: FontSlot[]): string {
    const compact = slots.map(s => ({
        f: s.font?.id,
        t: s.text,
        fs: s.fontSize,
        w: s.weight,
        lh: s.lineHeight,
        ls: s.letterSpacing,
        c: s.color,
        bg: s.background,
        i: s.italic ? 1 : 0,
        ax: s.axes,
    }));
    return btoa(encodeURIComponent(JSON.stringify(compact)));
}

function decodeState(encoded: string): Partial<FontSlot>[] | null {
    try {
        const json = JSON.parse(decodeURIComponent(atob(encoded)));
        return json.map((s: any) => ({
            font: s.f ? { id: s.f } : null,
            text: s.t || '',
            fontSize: s.fs || 48,
            weight: s.w || 400,
            lineHeight: s.lh || 1.2,
            letterSpacing: s.ls || 0,
            color: s.c || '#000000',
            background: s.bg || '#ffffff',
            italic: !!s.i,
            axes: s.ax || {},
        }));
    } catch {
        return null;
    }
}

export default function FontPlayground() {
    const [searchParams] = useSearchParams();
    const [fonts, setFonts] = useState<PlaygroundFont[]>([]);
    const [fontsLoading, setFontsLoading] = useState(true);
    const [slots, setSlots] = useState<FontSlot[]>([createDefaultSlot('slot-0')]);
    const [activeSlot, setActiveSlot] = useState<string>('slot-0');
    const [fontSearch, setFontSearch] = useState('');
    const [fontPickerOpen, setFontPickerOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [compareMode, setCompareMode] = useState(false);
    const fontPickerRef = useRef<HTMLDivElement>(null);

    // Load all fonts for selector
    useEffect(() => {
        supabase
            .from('fonts')
            .select('id, name, slug, font_variants(variant_name, woff2_url, woff_url)')
            .order('name')
            .limit(200)
            .then(({ data }) => {
                const list: PlaygroundFont[] = (data || []).map((f: any) => {
                    const variants = f.font_variants || [];
                    const regular = variants.find((v: any) => v.variant_name === 'Regular') || variants[0];
                    return {
                        id: f.id,
                        name: f.name,
                        slug: f.slug,
                        woff2_url: regular?.woff2_url,
                        woff_url: regular?.woff_url,
                    };
                });
                setFonts(list);
                setFontsLoading(false);
            });
    }, []);

    // Restore from URL
    useEffect(() => {
        const encoded = searchParams.get('state');
        if (!encoded) return;
        const decoded = decodeState(encoded);
        if (!decoded) return;
        setSlots(decoded.map((d, i) => ({ ...createDefaultSlot(`slot-${i}`), ...d })));
    }, []); // only on mount

    // Load fonts when assigned
    useEffect(() => {
        slots.forEach(slot => {
            if (slot.font) loadFontFace(slot.font as PlaygroundFont);
        });
    }, [slots]);

    // Close font picker on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (fontPickerRef.current && !fontPickerRef.current.contains(e.target as Node)) {
                setFontPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const updateSlot = useCallback((id: string, updates: Partial<FontSlot>) => {
        setSlots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }, []);

    const addSlot = useCallback(() => {
        const id = `slot-${Date.now()}`;
        setSlots(prev => [...prev, createDefaultSlot(id)]);
        setActiveSlot(id);
        setCompareMode(true);
    }, []);

    const removeSlot = useCallback((id: string) => {
        setSlots(prev => {
            const next = prev.filter(s => s.id !== id);
            return next.length > 0 ? next : [createDefaultSlot('slot-0')];
        });
        setActiveSlot(prev => prev === id ? 'slot-0' : prev);
        setCompareMode(prev => slots.length - 1 > 1 ? prev : false);
    }, [slots.length]);

    const shareUrl = useCallback(() => {
        const encoded = encodeState(slots);
        const url = new URL(window.location.href);
        url.searchParams.set('state', encoded);
        navigator.clipboard.writeText(url.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [slots]);

    const activeSlotData = slots.find(s => s.id === activeSlot) || slots[0];

    const filteredFonts = useMemo(() =>
        fonts.filter(f => f.name.toLowerCase().includes(fontSearch.toLowerCase())).slice(0, 50),
        [fonts, fontSearch]
    );

    return (
        <div className="min-h-screen bg-[rgb(var(--color-background))] pt-16">
            <SEO
                title="Font Playground — Live Typography Lab | NoBadFonts"
                description="Experiment with any font in real-time. Adjust size, weight, spacing and variable axes. Share your typography experiments with a unique URL."
            />

            <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
                {/* Sidebar */}
                <aside className="w-full lg:w-80 xl:w-96 shrink-0 border-r border-[rgb(var(--color-border)/0.5)] overflow-y-auto bg-[rgb(var(--color-card)/0.5)] backdrop-blur-sm">
                    <div className="p-5 border-b border-[rgb(var(--color-border)/0.3)]">
                        <h1 className="text-lg font-black text-[rgb(var(--color-foreground))]">Font Playground</h1>
                        <p className="text-xs text-[rgb(var(--color-muted-foreground))] mt-0.5">Live typography lab</p>
                    </div>

                    {/* Slot tabs */}
                    {compareMode && (
                        <div className="px-4 pt-4">
                            <div className="flex gap-2 flex-wrap">
                                {slots.map((slot, i) => (
                                    <div key={slot.id} className="flex items-center gap-1">
                                        <button
                                            onClick={() => setActiveSlot(slot.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                activeSlot === slot.id
                                                    ? 'bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))]'
                                                    : 'bg-[rgb(var(--color-foreground)/0.07)] text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-foreground)/0.12)]'
                                            }`}
                                        >
                                            Slot {i + 1}: {slot.font?.name || 'No font'}
                                        </button>
                                        {slots.length > 1 && (
                                            <button onClick={() => removeSlot(slot.id)} className="w-5 h-5 rounded-full flex items-center justify-center text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-destructive)/0.1)] hover:text-[rgb(var(--color-destructive))] transition-colors">
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {slots.length < 4 && (
                                    <button
                                        onClick={addSlot}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgb(var(--color-foreground)/0.05)] text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-foreground)/0.1)] transition-colors flex items-center gap-1"
                                    >
                                        <Plus size={12} /> Add
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="p-4 space-y-5">
                        {/* Font picker */}
                        <div>
                            <label className="block text-xs font-semibold text-[rgb(var(--color-muted-foreground))] uppercase tracking-wider mb-2">
                                Font
                            </label>
                            <div ref={fontPickerRef} className="relative">
                                <button
                                    onClick={() => setFontPickerOpen(v => !v)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[rgb(var(--color-foreground)/0.05)] hover:bg-[rgb(var(--color-foreground)/0.08)] border border-[rgb(var(--color-border)/0.5)] transition-colors text-sm"
                                >
                                    <span className="truncate" style={activeSlotData.font ? { fontFamily: `'${activeSlotData.font.name}', sans-serif` } : {}}>
                                        {activeSlotData.font?.name || 'Choose a font...'}
                                    </span>
                                    <ChevronDown size={14} className={`shrink-0 transition-transform ${fontPickerOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {fontPickerOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute left-0 right-0 top-full mt-1 z-50 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border)/0.5)] rounded-2xl shadow-2xl overflow-hidden"
                                            style={{ maxHeight: '300px' }}
                                        >
                                            <div className="p-2 border-b border-[rgb(var(--color-border)/0.3)]">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Search fonts..."
                                                    value={fontSearch}
                                                    onChange={e => setFontSearch(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--color-foreground)/0.05)] text-sm outline-none"
                                                />
                                            </div>
                                            <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
                                                {fontsLoading ? (
                                                    <div className="flex justify-center py-6">
                                                        <div className="w-5 h-5 rounded-full border-2 border-[rgb(var(--color-foreground)/0.1)] border-t-[rgb(var(--color-foreground))] animate-spin" />
                                                    </div>
                                                ) : filteredFonts.map(font => (
                                                    <button
                                                        key={font.id}
                                                        onClick={() => {
                                                            loadFontFace(font);
                                                            updateSlot(activeSlot, { font });
                                                            setFontPickerOpen(false);
                                                            setFontSearch('');
                                                        }}
                                                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-[rgb(var(--color-foreground)/0.05)] transition-colors flex items-center gap-3"
                                                    >
                                                        <span
                                                            className="text-lg"
                                                            style={{ fontFamily: `'${font.name}', sans-serif` }}
                                                        >
                                                            Aa
                                                        </span>
                                                        <span>{font.name}</span>
                                                        {activeSlotData.font?.id === font.id && (
                                                            <Check size={14} className="ml-auto text-[rgb(var(--color-highlight))]" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Text */}
                        <div>
                            <label className="block text-xs font-semibold text-[rgb(var(--color-muted-foreground))] uppercase tracking-wider mb-2">
                                Sample Text
                            </label>
                            <textarea
                                value={activeSlotData.text}
                                onChange={e => updateSlot(activeSlot, { text: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-border)/0.4)] text-sm outline-none resize-none transition-colors focus:border-[rgb(var(--color-foreground)/0.2)]"
                            />
                        </div>

                        {/* Controls */}
                        <SliderControl
                            label="Font Size"
                            value={activeSlotData.fontSize}
                            min={8} max={200} step={1}
                            display={`${activeSlotData.fontSize}px`}
                            onChange={v => updateSlot(activeSlot, { fontSize: v })}
                        />
                        <SliderControl
                            label="Font Weight"
                            value={activeSlotData.weight}
                            min={100} max={900} step={100}
                            display={`${activeSlotData.weight}`}
                            onChange={v => updateSlot(activeSlot, { weight: v })}
                        />
                        <SliderControl
                            label="Line Height"
                            value={activeSlotData.lineHeight}
                            min={0.8} max={3} step={0.05}
                            display={activeSlotData.lineHeight.toFixed(2)}
                            onChange={v => updateSlot(activeSlot, { lineHeight: v })}
                        />
                        <SliderControl
                            label="Letter Spacing"
                            value={activeSlotData.letterSpacing}
                            min={-5} max={20} step={0.1}
                            display={`${activeSlotData.letterSpacing.toFixed(1)}px`}
                            onChange={v => updateSlot(activeSlot, { letterSpacing: v })}
                        />

                        {/* Colors */}
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-[rgb(var(--color-muted-foreground))] uppercase tracking-wider mb-2">Text</label>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-border)/0.4)]">
                                    <input type="color" value={activeSlotData.color} onChange={e => updateSlot(activeSlot, { color: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                                    <span className="text-xs font-mono text-[rgb(var(--color-muted-foreground))]">{activeSlotData.color}</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-[rgb(var(--color-muted-foreground))] uppercase tracking-wider mb-2">BG</label>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-border)/0.4)]">
                                    <input type="color" value={activeSlotData.background} onChange={e => updateSlot(activeSlot, { background: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                                    <span className="text-xs font-mono text-[rgb(var(--color-muted-foreground))]">{activeSlotData.background}</span>
                                </div>
                            </div>
                        </div>

                        {/* Italic toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[rgb(var(--color-muted-foreground))] uppercase tracking-wider">Italic</span>
                            <button
                                onClick={() => updateSlot(activeSlot, { italic: !activeSlotData.italic })}
                                className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${activeSlotData.italic ? 'bg-[rgb(var(--color-foreground))]' : 'bg-[rgb(var(--color-foreground)/0.15)]'}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${activeSlotData.italic ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-[rgb(var(--color-border)/0.3)] space-y-2">
                        <button
                            onClick={shareUrl}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                            {copied ? <><Check size={16} /> Copied!</> : <><Share2 size={16} /> Share Experiment</>}
                        </button>
                        <button
                            onClick={() => { addSlot(); setCompareMode(true); }}
                            disabled={slots.length >= 4}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[rgb(var(--color-border)/0.5)] text-sm font-medium text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.04)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus size={16} /> Compare Another Font
                        </button>
                    </div>
                </aside>

                {/* Preview area */}
                <main className="flex-1 overflow-auto">
                    {compareMode && slots.length > 1 ? (
                        <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${slots.length}, 1fr)` }}>
                            {slots.map(slot => (
                                <PlaygroundCanvas key={slot.id} slot={slot} />
                            ))}
                        </div>
                    ) : (
                        <PlaygroundCanvas slot={activeSlotData} />
                    )}
                </main>
            </div>
        </div>
    );
}

function PlaygroundCanvas({ slot }: { slot: FontSlot }) {
    const fontFamily = slot.font ? `'${slot.font.name}', serif` : 'serif';

    return (
        <div
            className="w-full h-full min-h-[60vh] flex items-center justify-center p-8 md:p-16 transition-colors duration-300"
            style={{ background: slot.background }}
        >
            {slot.font ? (
                <p
                    className="w-full text-center select-text break-words"
                    style={{
                        fontFamily,
                        fontSize: `${slot.fontSize}px`,
                        fontWeight: slot.weight,
                        lineHeight: slot.lineHeight,
                        letterSpacing: `${slot.letterSpacing}px`,
                        color: slot.color,
                        fontStyle: slot.italic ? 'italic' : 'normal',
                    }}
                >
                    {slot.text || 'Type something…'}
                </p>
            ) : (
                <div className="text-center opacity-30">
                    <p className="text-6xl mb-4">Aa</p>
                    <p className="text-sm font-medium">Choose a font from the sidebar</p>
                </div>
            )}
        </div>
    );
}

function SliderControl({ label, value, min, max, step, display, onChange }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    display: string;
    onChange: (v: number) => void;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[rgb(var(--color-muted-foreground))] uppercase tracking-wider">{label}</label>
                <span className="text-xs font-mono text-[rgb(var(--color-foreground)/0.6)]">{display}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="w-full accent-[rgb(var(--color-foreground))] cursor-pointer"
            />
        </div>
    );
}
