import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useFonts } from '../hooks/useFonts';
import { supabase } from '../lib/supabase';
import type { Font } from '../types/font';
import { Type, AlignLeft, MousePointerClick, Edit3 } from 'lucide-react';
import FontPickerSidebar from '../components/font-pairing/FontPickerSidebar';
import CustomizeSidebar from '../components/font-pairing/CustomizeSidebar';
import { Settings, Palette } from 'lucide-react';

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

    const [headerStyle, setHeaderStyle] = useState({ size: 72, leading: 1.1, tracking: 0, color: '#000000' });
    const [bodyStyle, setBodyStyle] = useState({ size: 18, leading: 1.6, tracking: 0, color: '#374151' });
    const [uiStyle, setUiStyle] = useState({ size: 16, leading: 1.4, tracking: 0, color: '#4B5563' });

    const [bgColor, setBgColor] = useState('#ffffff');

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
        console.log(`[FontPairing] Loading ${prefix} font: ${font.name}, variant: ${variant || 'default'} (ID: ${font.id})`);
        const src = getSource(font, variant);
        if (!src) {
            console.warn(`No source found for ${font.name} (${variant})`);
            return;
        }

        const family = `${prefix}-font-${font.id}-${variant || 'reg'}`;
        console.log(`[FontPairing] Family: ${family}, URL: ${src.url}`);
        // Check if already exists to avoid spamming
        // Note: document.fonts.check() needs the full font string e.g. "12px family"
        // simpler is just to create and add, duplicate adds are ignored usually, 
        // but we can try-catch.

        try {
            const fontFace = new FontFace(family, `url(${src.url}) format('${src.format}')`);
            const loadedFace = await fontFace.load();
            document.fonts.add(loadedFace);
            console.log(`[FontPairing] Successfully loaded: ${family}`);
            // Force layout/repaint? Usually React state update does it.
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

                // If user wants default variant to auto-apply, logic is:
                // If there's a "Regular" variant, maybe select it? 
                // Currently null means "Default Files (likely Regular)". 
                // If the user wants to see the name "Regular" in the dropdown, we need to handle that in Sidebar.
                // But functionally, null works if loadFont uses default files.
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
        <div className="min-h-screen text-black relative">

            {/* Sidebar: Picker */}
            <FontPickerSidebar
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
                <button className="bg-black text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform">
                    <Palette size={24} />
                </button>
                <div className="absolute left-0 bottom-full mb-2 bg-white p-3 rounded-xl border-2 border-black shadow-xl hidden group-hover:block w-48">
                    <p className="text-xs font-bold mb-2 uppercase text-gray-400">Background Color</p>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer"
                        />
                        <span className="text-xs font-mono">{bgColor}</span>
                    </div>
                </div>
            </div>

            {/* Hero / Instruction */}
            <div className="bg-[#BDF522] rounded-3xl border-b-2 border-black px-6 py-12">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">
                        FONT PAIRING PLAYGROUND
                    </h1>
                    <p className="text-xl font-bold max-w-2xl">
                        Mix, match, and experiment. Hover over text to change its font.
                        Click to edit content.
                    </p>
                </div>
            </div>

            <div className="mx-auto">

                {/* Unified Playground Container */}
                <div
                    className="rounded-3xl border-y-2 border-black p-6 md:p-12 min-h-150 h-full relative transition-all duration-300"
                    style={{ backgroundColor: bgColor }}
                >

                    <div className="mx-auto space-y-16">

                        {/* 1. Header Section */}
                        <div className="group relative">
                            <div className="absolute -left-9 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-1 text-gray-400 opacity-0 group-hover:opacity-100">
                                <Type size={20} />
                                <span className="text-xs font-bold uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>Header</span>
                            </div>

                            {/* Floating Action Button */}
                            <div className="absolute -top-12 -left-4 md:-right-12 scale-75 md:scale-100 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 flex gap-2">
                                <button
                                    onClick={() => handleOpenPicker('Header')}
                                    className="-rotate-12 bg-black text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-[#BDF522] hover:text-black border-2 border-transparent hover:border-black transition-all"
                                >
                                    <Edit3 size={16} /> Font
                                </button>
                                <button
                                    onClick={() => handleOpenCustomize('Header')}
                                    className="-rotate-12 bg-white text-black px-3 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-[#BDF522] border-2 border-black transition-all"
                                >
                                    <Settings size={16} />
                                </button>
                                <div className="mt-1 absolute left-12 top-10 -rotate-12">
                                    <span className="bg-gray-100 text-xs px-2 py-1 rounded border border-gray-300 font-mono shadow-sm inline-block">
                                        {headerFont?.name}
                                    </span>
                                </div>
                            </div>

                            <textarea
                                ref={headerRef}
                                value={headerText}
                                onChange={(e) => {
                                    setHeaderText(e.target.value);
                                }}
                                style={{
                                    fontFamily: headerFont?.name ? `header-font-${headerFont.id}-${headerVariant || 'reg'}, ${headerFont.name}` : undefined,
                                    fontSize: `${headerStyle.size}px`,
                                    lineHeight: headerStyle.leading,
                                    letterSpacing: `${headerStyle.tracking}px`,
                                    color: headerStyle.color
                                }}
                                className="w-full h-full font-black bg-transparent border-none outline-none resize-none text-wrap hover:bg-black/5 rounded-xl transition-colors -ml-2"
                                rows={3}
                                spellCheck={false}
                            />
                        </div>


                        {/* 2. Body Section */}
                        <div className="group relative">
                            <div className="absolute -left-12 top-0 hidden lg:flex flex-col items-center gap-1 text-gray-400">
                                <AlignLeft size={20} />
                                <span className="text-xs font-bold uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>Body</span>
                            </div>

                            {/* Floating Action Button */}
                            <div className="absolute -top-12 -left-4 md:-right-12 scale-75 md:scale-100 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 flex gap-2">
                                <button
                                    onClick={() => handleOpenPicker('Body')}
                                    className="-rotate-12 bg-black text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-[#BDF522] hover:text-black border-2 border-transparent hover:border-black transition-all"
                                >
                                    <Edit3 size={16} /> Font
                                </button>
                                <button
                                    onClick={() => handleOpenCustomize('Body')}
                                    className="-rotate-12 bg-white text-black px-3 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-[#BDF522] border-2 border-black transition-all"
                                >
                                    <Settings size={16} />
                                </button>
                                <div className="mt-1 absolute left-12 top-10 -rotate-12">
                                    <span className="bg-gray-100 text-xs px-2 py-1 rounded border border-gray-300 font-mono shadow-sm inline-block">
                                        {bodyFont?.name}
                                    </span>
                                </div>
                            </div>

                            <textarea
                                ref={bodyRef}
                                value={bodyText}
                                onChange={(e) => {
                                    setBodyText(e.target.value);
                                }}
                                style={{
                                    fontFamily: bodyFont?.name ? `body-font-${bodyFont.id}-${bodyVariant || 'reg'}, ${bodyFont.name}` : undefined,
                                    fontSize: `${bodyStyle.size}px`,
                                    lineHeight: bodyStyle.leading,
                                    letterSpacing: `${bodyStyle.tracking}px`,
                                    color: bodyStyle.color
                                }}
                                className="w-full h-full bg-transparent overflow-hidden border-none resize-y hover:bg-black/5 rounded-xl transition-colors p-2 -ml-2"
                                rows={1}
                                spellCheck={false}
                            />
                        </div>


                        {/* 3. UI Section */}
                        <div className="group relative border-t-2 border-gray-100">
                            <div className="absolute -left-12 top-12 hidden lg:flex flex-col items-center gap-1 text-gray-400">
                                <MousePointerClick size={20} />
                                <span className="text-xs font-bold uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>UI Elements</span>
                            </div>

                            {/* Floating Action Button */}
                            <div className="absolute -top-12 -left-4 md:-right-12 scale-75 md:scale-100 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 flex gap-2">
                                <button
                                    onClick={() => handleOpenPicker('UI')}
                                    className="-rotate-12 bg-black text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-[#BDF522] hover:text-black border-2 border-transparent hover:border-black transition-all"
                                >
                                    <Edit3 size={16} /> Font
                                </button>
                                <button
                                    onClick={() => handleOpenCustomize('UI')}
                                    className="-rotate-12 bg-white text-black px-3 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-[#BDF522] border-2 border-black transition-all"
                                >
                                    <Settings size={16} />
                                </button>
                                <div className="mt-1 absolute left-12 top-10 -rotate-12">
                                    <span className="bg-gray-100 text-xs px-2 py-1 rounded border border-gray-300 font-mono shadow-sm inline-block">
                                        {uiFont?.name}
                                    </span>
                                </div>
                            </div>

                            <div
                                className="flex flex-col-reverse items-start gap-8 p-4 hover:bg-black/5 rounded-xl transition-colors -ml-4"
                                style={{
                                    fontFamily: uiFont?.name ? `ui-font-${uiFont.id}-${uiVariant || 'reg'}, ${uiFont.name}` : undefined,
                                    fontSize: `${uiStyle.size}px`,
                                    lineHeight: uiStyle.leading,
                                    letterSpacing: `${uiStyle.tracking}px`,
                                    color: uiStyle.color
                                }}
                            >
                                {/* Nav Links */}
                                <div className="flex gap-6 text-sm font-medium text-gray-600">
                                    <input
                                        value={uiLink1}
                                        onChange={(e) => setUiLink1(e.target.value)}
                                        className="bg-transparent border-none outline-none w-12 hover:text-black cursor-pointer"
                                    />
                                    <input
                                        value={uiLink2}
                                        onChange={(e) => setUiLink2(e.target.value)}
                                        className="bg-transparent border-none outline-none w-12 hover:text-black cursor-pointer"
                                    />
                                    <input
                                        value={uiLink3}
                                        onChange={(e) => setUiLink3(e.target.value)}
                                        className="bg-transparent border-none outline-none w-16 hover:text-black cursor-pointer"
                                    />
                                </div>

                                {/* Button */}
                                <button className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
                                    <input
                                        value={uiButtonText}
                                        onChange={(e) => setUiButtonText(e.target.value)}
                                        className="bg-transparent border-none outline-none text-center min-w-25 cursor-pointer"
                                    />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
