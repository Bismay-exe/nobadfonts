import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useFonts } from '../hooks/useFonts';
import { supabase } from '../lib/supabase';
import type { Font } from '../types/font';
import { Type, AlignLeft, MousePointerClick, Edit3, Settings, Palette } from 'lucide-react';
import FontPicker from '../components/font-pairing/FontPicker';
import CustomizeSidebar from '../components/font-pairing/CustomizeSidebar';
import SEO from '../components/shared/SEO';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export default function FontPairing() {
    const { fonts, loading } = useFonts({ sortBy: 'popular' });
    const headerRef = useRef<HTMLTextAreaElement | null>(null);
    const bodyRef = useRef<HTMLTextAreaElement | null>(null);

    const autoResize = (element: HTMLTextAreaElement | null) => {
        if (element) {
            element.style.height = 'auto';
            element.style.height = `${element.scrollHeight}px`;
        }
    };

    // Font State
    const [headerFont, setHeaderFont] = useState<Font | null>(null);
    const [bodyFont, setBodyFont] = useState<Font | null>(null);
    const [uiFont, setUiFont] = useState<Font | null>(null);

    // Sidebar State
    const [sidebarMode, setSidebarMode] = useState<'picker' | 'customize' | null>(null);
    const [activeSection, setActiveSection] = useState<'Header' | 'Body' | 'UI' | null>(null);

    // Customization State
    const [headerVariant, setHeaderVariant] = useState<string | null>(null);
    const [bodyVariant, setBodyVariant] = useState<string | null>(null);
    const [uiVariant, setUiVariant] = useState<string | null>(null);

    const [headerStyle, setHeaderStyle] = useState({ size: 72, leading: 1.1, tracking: 0, color: '#FFFFFF' });
    const [bodyStyle, setBodyStyle] = useState({ size: 18, leading: 1.6, tracking: 0, color: '#A1A1AA' });
    const [uiStyle, setUiStyle] = useState({ size: 16, leading: 1.4, tracking: 0, color: '#D4D4D8' });

    const [bgColor, setBgColor] = useState('#09090b'); // zinc-950

    // Editable text state
    const [headerText, setHeaderText] = useState("The fool doth think he is wise, but the wise man knows himself to be a fool. Love is blind, and lovers cannot see, The pretty follies that themselves commit.");
    const [bodyText, setBodyText] = useState("Once upon a time, there was a young girl named Lily who lived in a small village. She had always been fascinated by the strange and vivid dreams she would have every night, filled with fantastical creatures and mysterious lands. Despite her parents' skepticism, Lily was certain that there was some kind of deeper meaning to these dreams, and was determined to uncover it. One day, Lily discovered a book in the local library about the interpretation of dreams, and became engrossed in its pages. She learned about the different symbols and themes that could appear in a dream, and was amazed at the insights she gained about her own subconscious mind. However, the book also warned of the dangers of becoming too obsessed with one's dreams, as it could lead to a loss of touch with reality. Undeterred, Lily began to actively seek out her dreams, using various methods to induce sleep and remember her nightly adventures. She soon found herself spending more and more time in the dream world, and less time in the waking world. Her friends and family began to worry about her as she became increasingly distant and aloof, lost in her own thoughts and visions. Despite the warning signs, Lily could not be swayed from her quest. She continued to delve deeper into her dreams, until one night she found herself in a strange and unfamiliar place. She was surrounded by dark and twisted creatures, who threatened to consume her soul. In that moment, Lily realized the truth of what she had been seeking - the depths of the human mind can be both beautiful and terrifying.");
    const [uiLink1, setUiLink1] = useState("Home");
    const [uiLink2, setUiLink2] = useState("About");
    const [uiLink3, setUiLink3] = useState("Services");
    const [uiButtonText, setUiButtonText] = useState("Read More");

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
        } catch (err) {
            console.error(`Failed to load ${family}`, err);
        }
    };

    // 1. Header Effect
    useEffect(() => {
        loadFontToDoc(headerFont, headerVariant, 'header');
    }, [headerFont, headerVariant]);

    // 2. Body Effect
    useEffect(() => {
        loadFontToDoc(bodyFont, bodyVariant, 'body');
    }, [bodyFont, bodyVariant]);

    // 3. UI Effect
    useEffect(() => {
        loadFontToDoc(uiFont, uiVariant, 'ui');
    }, [uiFont, uiVariant]);


    // Setup initial fonts once loaded
    useEffect(() => {
        if (!loading && fonts.length > 0 && !headerFont) {
            const fetchDefaults = async () => {
                // Just meaningful defaults if available, otherwise first ones
                const serifs = fonts.filter(f => f.category === 'Serif');
                const sans = fonts.filter(f => f.category === 'Sans Serif');

                let hFont = serifs.length > 0 ? serifs[0] : fonts[0];
                let bFont = sans.length > 0 ? sans[0] : (fonts[1] || fonts[0]);
                let uFont = sans.length > 0 ? sans[0] : (fonts[1] || fonts[0]);

                // Fetch full details for these
                const ids = [...new Set([hFont.id, bFont.id, uFont.id])];
                const { data } = await supabase
                    .from('fonts')
                    .select('*, font_variants(*)')
                    .in('id', ids);

                if (data) {
                    const fullH = data.find(f => f.id === hFont.id) || hFont;
                    const fullB = data.find(f => f.id === bFont.id) || bFont;
                    const fullU = data.find(f => f.id === uFont.id) || uFont;

                    setHeaderFont(fullH);
                    setBodyFont(fullB);
                    setUiFont(fullU);
                } else {
                    setHeaderFont(hFont);
                    setBodyFont(bFont);
                    setUiFont(uFont);
                }
            };
            fetchDefaults();
        }
    }, [loading, fonts]);

    const handleOpenPicker = (section: 'Header' | 'Body' | 'UI') => {
        setActiveSection(section);
        setSidebarMode('picker');
    };

    const handleOpenCustomize = (section: 'Header' | 'Body' | 'UI') => {
        setActiveSection(section);
        setSidebarMode('customize');
    };

    const handleFontSelect = async (partialFont: Font) => {
        // Determine which set functions to use based on section
        let setFont: (f: Font | null) => void;
        let setVariant: (v: string | null) => void;

        if (activeSection === 'Header') {
            setFont = setHeaderFont;
            setVariant = setHeaderVariant;
        } else if (activeSection === 'Body') {
            setFont = setBodyFont;
            setVariant = setBodyVariant;
        } else if (activeSection === 'UI') {
            setFont = setUiFont;
            setVariant = setUiVariant;
        } else {
            return;
        }

        // Optimistic update with what we have
        setFont(partialFont);
        setVariant(null); // Reset variant to default

        // Fetch full details (variants)
        try {
            const { data, error } = await supabase
                .from('fonts')
                .select('*, font_variants(*)')
                .eq('id', partialFont.id)
                .single();

            if (error) throw error;
            if (data) {
                setFont(data);
            }
        } catch (err) {
            console.error("Failed to fetch font details", err);
        }
    };

    // Auto-resize logic
    useLayoutEffect(() => {
        autoResize(headerRef.current);
    }, [headerText, headerFont, headerStyle, headerVariant]);

    useLayoutEffect(() => {
        autoResize(bodyRef.current);
    }, [bodyText, bodyFont, bodyStyle, bodyVariant]);


    return (
        <div className="min-h-screen bg-black text-white relative">
            <SEO title="Font Pairing Playground" />

            {/* Fullpage Modal: Picker */}
            <FontPicker
                isOpen={sidebarMode === 'picker'}
                onClose={() => setSidebarMode(null)}
                activeSection={activeSection}
                onSelect={handleFontSelect}
            />

            {/* Sidebar: Customize */}
            <CustomizeSidebar
                isOpen={sidebarMode === 'customize'}
                onClose={() => setSidebarMode(null)}
                activeSection={activeSection}
                font={activeSection === 'Header' ? headerFont : activeSection === 'Body' ? bodyFont : uiFont}
                currentVariant={activeSection === 'Header' ? headerVariant : activeSection === 'Body' ? bodyVariant : uiVariant}
                currentStyle={activeSection === 'Header' ? headerStyle : activeSection === 'Body' ? bodyStyle : uiStyle}
                onVariantChange={(v) => {
                    if (activeSection === 'Header') setHeaderVariant(v);
                    else if (activeSection === 'Body') setBodyVariant(v);
                    else if (activeSection === 'UI') setUiVariant(v);
                }}
                onStyleChange={(s) => {
                    if (activeSection === 'Header') setHeaderStyle(s);
                    else if (activeSection === 'Body') setBodyStyle(s);
                    else if (activeSection === 'UI') setUiStyle(s);
                }}
            />

            {/* Global Background Color Control */}
            <div className="fixed bottom-6 left-6 z-30 group">
                <button className="bg-zinc-800 text-white p-4 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10 hover:scale-110 transition-transform">
                    <Palette size={24} />
                </button>
                <div className="absolute left-0 bottom-full mb-4 bg-zinc-900 p-4 rounded-2xl border border-white/10 shadow-xl hidden group-hover:block w-56 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-xs font-bold mb-3 uppercase text-zinc-500">Background Color</p>
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
                                    "w-8 h-8 rounded-full border border-white/10 transition-transform hover:scale-110",
                                    bgColor === color && "ring-2 ring-white ring-offset-2 ring-offset-black"
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
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-4">
                            Type Pairing.
                        </h1>
                        <p className="text-zinc-500 max-w-xl mx-auto">
                            Mix, match, and experiment with real-time editing.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Playground */}
            <div className="px-4 pb-20">
                <motion.div
                    layout
                    className="max-w-480 mx-auto rounded-[3rem] p-6 md:p-16 min-h-[80vh] relative transition-colors duration-500 shadow-2xl border border-white/5"
                    style={{ backgroundColor: bgColor }}
                >
                    <div className="space-y-16 lg:space-y-24">

                        {/* 1. Header Section */}
                        <div className="group relative">
                            <div className="absolute -left-12 top-0 hidden xl:flex flex-col items-center gap-2 opacity-20">
                                <Type size={24} />
                            </div>

                            {/* Floating Controls */}
                            <div className="absolute -top-12 left-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 flex items-center gap-2">
                                <div className="bg-black/80 backdrop-blur-md rounded-full border border-white/10 p-1 flex items-center gap-1">
                                    <button
                                        onClick={() => handleOpenPicker('Header')}
                                        className="px-4 py-2 rounded-full font-bold text-xs bg-white text-black hover:bg-zinc-200 transition-colors flex items-center gap-2"
                                    >
                                        <Edit3 size={12} />
                                        <span>{headerFont?.name || 'Select Font'}</span>
                                    </button>
                                    <button
                                        onClick={() => handleOpenCustomize('Header')}
                                        className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <Settings size={16} />
                                    </button>
                                </div>
                            </div>

                            <textarea
                                ref={headerRef}
                                value={headerText}
                                onChange={(e) => setHeaderText(e.target.value)}
                                style={{
                                    fontFamily: headerFont?.name ? `header-font-${headerFont.id}-${headerVariant || 'reg'}, ${headerFont.name}` : undefined,
                                    fontSize: `${headerStyle.size}px`,
                                    lineHeight: headerStyle.leading,
                                    letterSpacing: `${headerStyle.tracking}px`,
                                    color: headerStyle.color
                                }}
                                className="w-full bg-transparent border-none outline-none resize-none overflow-hidden placeholder:text-zinc-700 hover:bg-white/5 rounded-2xl transition-colors p-2 -ml-2 select-text"
                                spellCheck={false}
                            />
                        </div>


                        {/* 2. Body Section */}
                        <div className="group relative">
                            <div className="absolute -left-12 top-0 hidden xl:flex flex-col items-center gap-2 opacity-20">
                                <AlignLeft size={24} />
                            </div>

                            {/* Floating Controls */}
                            <div className="absolute -top-12 left-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 flex items-center gap-2">
                                <div className="bg-black/80 backdrop-blur-md rounded-full border border-white/10 p-1 flex items-center gap-1">
                                    <button
                                        onClick={() => handleOpenPicker('Body')}
                                        className="px-4 py-2 rounded-full font-bold text-xs bg-white text-black hover:bg-zinc-200 transition-colors flex items-center gap-2"
                                    >
                                        <Edit3 size={12} />
                                        <span>{bodyFont?.name || 'Select Font'}</span>
                                    </button>
                                    <button
                                        onClick={() => handleOpenCustomize('Body')}
                                        className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <Settings size={16} />
                                    </button>
                                </div>
                            </div>

                            <textarea
                                ref={bodyRef}
                                value={bodyText}
                                onChange={(e) => setBodyText(e.target.value)}
                                style={{
                                    fontFamily: bodyFont?.name ? `body-font-${bodyFont.id}-${bodyVariant || 'reg'}, ${bodyFont.name}` : undefined,
                                    fontSize: `${bodyStyle.size}px`,
                                    lineHeight: bodyStyle.leading,
                                    letterSpacing: `${bodyStyle.tracking}px`,
                                    color: bodyStyle.color
                                }}
                                className="w-full bg-transparent border-none outline-none resize-none overflow-hidden hover:bg-white/5 rounded-2xl transition-colors p-2 -ml-2"
                                rows={1}
                                spellCheck={false}
                            />
                        </div>


                        {/* 3. UI Section */}
                        <div className="group relative pt-12 border-t border-white/5">
                            <div className="absolute -left-12 top-16 hidden xl:flex flex-col items-center gap-2 opacity-20">
                                <MousePointerClick size={24} />
                            </div>

                            {/* Floating Controls */}
                            <div className="absolute top-0 left-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 flex items-center gap-2">
                                <div className="bg-black/80 backdrop-blur-md rounded-full border border-white/10 p-1 flex items-center gap-1">
                                    <button
                                        onClick={() => handleOpenPicker('UI')}
                                        className="px-4 py-2 rounded-full font-bold text-xs bg-white text-black hover:bg-zinc-200 transition-colors flex items-center gap-2"
                                    >
                                        <Edit3 size={12} />
                                        <span>{uiFont?.name || 'Select Font'}</span>
                                    </button>
                                    <button
                                        onClick={() => handleOpenCustomize('UI')}
                                        className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <Settings size={16} />
                                    </button>
                                </div>
                            </div>

                            <div
                                className="flex flex-col md:flex-row items-center gap-8 md:gap-16 hover:bg-white/5 rounded-2xl transition-colors p-6 -ml-6"
                                style={{
                                    fontFamily: uiFont?.name ? `ui-font-${uiFont.id}-${uiVariant || 'reg'}, ${uiFont.name}` : undefined,
                                    fontSize: `${uiStyle.size}px`,
                                    lineHeight: uiStyle.leading,
                                    letterSpacing: `${uiStyle.tracking}px`,
                                    color: uiStyle.color
                                }}
                            >
                                {/* Nav Links */}
                                <div className="flex gap-8 font-medium">
                                    <input
                                        value={uiLink1}
                                        onChange={(e) => setUiLink1(e.target.value)}
                                        className="bg-transparent border-none outline-none w-20 text-center hover:text-[#BDF522] cursor-pointer transition-colors"
                                    />
                                    <input
                                        value={uiLink2}
                                        onChange={(e) => setUiLink2(e.target.value)}
                                        className="bg-transparent border-none outline-none w-20 text-center hover:text-[#BDF522] cursor-pointer transition-colors"
                                    />
                                    <input
                                        value={uiLink3}
                                        onChange={(e) => setUiLink3(e.target.value)}
                                        className="bg-transparent border-none outline-none w-24 text-center hover:text-[#BDF522] cursor-pointer transition-colors"
                                    />
                                </div>

                                {/* Button */}
                                <button className="px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-[#BDF522] transition-colors shadow-lg hover:shadow-[0_0_20px_rgba(189,245,34,0.4)]">
                                    <input
                                        value={uiButtonText}
                                        onChange={(e) => setUiButtonText(e.target.value)}
                                        className="bg-transparent border-none outline-none text-center min-w-30 cursor-pointer font-inherit text-inherit uppercase tracking-wider"
                                    />
                                </button>
                            </div>
                        </div>

                    </div>
                </motion.div>
            </div>
        </div>
    );
}
