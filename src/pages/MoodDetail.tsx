import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { MOOD_BY_SLUG, type MoodDefinition } from '../config/moods';
import { useFonts } from '../hooks/useFonts';
import FontCard from '../components/fonts/FontCard';
import WeddingFontCard from '../components/mood/WeddingFontCard';
import CyberpunkFontCard from '../components/mood/CyberpunkFontCard';
import Y2KFontCard from '../components/mood/Y2KFontCard';
import EditorialFontCard from '../components/mood/EditorialFontCard';
import RomanticFontCard from '../components/mood/RomanticFontCard';
import SciFiFontCard from '../components/mood/SciFiFontCard';
import RetroFontCard from '../components/mood/RetroFontCard';
import HorrorFontCard from '../components/mood/HorrorFontCard';
import MinimalFontCard from '../components/mood/MinimalFontCard';
import LuxuryFontCard from '../components/mood/LuxuryFontCard';
import KawaiiFontCard from '../components/mood/KawaiiFontCard';
import PixelFontCard from '../components/mood/PixelFontCard';
import { Masonry } from 'masonic';
import { useWindowSize } from '../hooks/useWindowSize';
import { useViewMode } from '../hooks/useViewMode';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import SEO from '../components/shared/SEO';
import { motion } from 'framer-motion';
import type { FontFilterParams } from '../types/font';

const MasonryCard = ({ data, width }: { data: any; width: number }) => {
    const props = {
        font: data,
        viewMode: data.viewMode,
        customText: data.customText,
        isExpanded: data.isExpanded,
        onToggle: data.onToggle,
        isFavorited: data.isFavorited,
        onFavoriteChange: data.onFavoriteChange,
        cardWidth: width,
        moodCardStyle: data.moodCardStyle,
        moodIndex: data.moodIndex,
    };

    switch (data.moodId) {
        case 'wedding': return <WeddingFontCard {...props} />;
        case 'cyberpunk': return <CyberpunkFontCard {...props} />;
        case 'y2k': return <Y2KFontCard {...props} />;
        case 'editorial': return <EditorialFontCard {...props} />;
        case 'romantic': return <RomanticFontCard {...props} />;
        case 'sci-fi': return <SciFiFontCard {...props} />;
        case 'retro': return <RetroFontCard {...props} />;
        case 'horror': return <HorrorFontCard {...props} />;
        case 'minimal': return <MinimalFontCard {...props} />;
        case 'luxury': return <LuxuryFontCard {...props} />;
        case 'kawaii': return <KawaiiFontCard {...props} />;
        case 'pixel': return <PixelFontCard {...props} />;
        default: return <FontCard {...props} />;
    }
};

export default function MoodDetail() {
    const { slug } = useParams<{ slug: string }>();
    const mood = slug ? MOOD_BY_SLUG[slug] : null;

    const [searchParams] = useSearchParams();

    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFontId, setExpandedFontId] = useState<string | null>(null);
    const [viewMode] = useViewMode();
    const [userFavoriteIds, setUserFavoriteIds] = useState<Set<string>>(new Set());
    const { user } = useAuth();

    const filtersParams: FontFilterParams = useMemo(() => ({
        query: searchQuery,
        categories: activeCategory ? [activeCategory] : (mood?.preferredCategories || []),
        sortBy: (searchParams.get('sortBy') as any) || 'trending',
    }), [searchQuery, activeCategory, mood?.preferredCategories, searchParams]);

    const { fonts, loading, loadingMore, hasMore, loadMore } = useFonts(filtersParams);

    // Favorites
    useEffect(() => {
        if (!user) { setUserFavoriteIds(new Set()); return; }
        let mounted = true;
        supabase.from('favorites').select('font_id').eq('user_id', user.id).then(({ data, error }) => {
            if (!mounted || error || !data) return;
            setUserFavoriteIds(new Set(data.map((f: any) => f.font_id)));
        });
        return () => { mounted = false; };
    }, [user]);

    const handleFavoriteToggle = useCallback((fontId: string, isFav: boolean) => {
        setUserFavoriteIds(prev => {
            const next = new Set(prev);
            if (isFav) next.add(fontId);
            else next.delete(fontId);
            return next;
        });
    }, []);

    // Infinite scroll
    const observer = useRef<IntersectionObserver | null>(null);
    const infiniteRef = useCallback((node: HTMLDivElement | null) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) loadMore();
        }, { rootMargin: '200px' });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore, loadMore]);

    const { width } = useWindowSize();

    const items = useMemo(() =>
        fonts
            .filter(f => f && f.id)
            .map((f, index) => ({
                ...f,
                viewMode,
                onToggle: () => setExpandedFontId(prev => prev === f.id ? null : f.id),
                isFavorited: userFavoriteIds.has(f.id),
                onFavoriteChange: handleFavoriteToggle,
                moodCardStyle: mood?.cardStyle,
                moodIndex: index,
                moodId: mood?.id,
            })),
        [fonts, viewMode, expandedFontId, userFavoriteIds, handleFavoriteToggle, mood]
    );

    const columns = width > 1280 ? 4 : width > 1024 ? 3 : width > 640 ? 2 : 1;

    if (!mood) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))]">
                <p className="text-5xl mb-4">🌍</p>
                <h1 className="text-2xl font-black mb-2">Mood not found</h1>
                <p className="text-[rgb(var(--color-muted-foreground))] mb-6">This design world doesn't exist yet.</p>
                <Link to="/moods" className="text-[rgb(var(--color-foreground))] hover:underline font-medium">← Browse all moods</Link>
            </div>
        );
    }

    // Build CSS vars and map them to standard theme vars so child components adapt
    const moodCssStyle = useMemo(() => ({
        ...Object.fromEntries(Object.entries(mood.cssVars).map(([k, v]) => [k, v])),
        '--color-background': mood.cssVars['--mood-bg'],
        '--color-foreground': mood.cssVars['--mood-text'],
        '--color-card': mood.cssVars['--mood-card'],
        '--color-card-foreground': mood.cssVars['--mood-text'],
        '--color-border': mood.cssVars['--mood-muted'] || mood.cssVars['--mood-secondary'],
        '--color-muted': mood.cssVars['--mood-secondary'],
        '--color-muted-foreground': mood.cssVars['--mood-muted'],
        '--color-primary': mood.cssVars['--mood-primary'],
    }), [mood]);

    useEffect(() => {
        const root = document.documentElement;
        Object.entries(moodCssStyle).forEach(([key, value]) => {
            root.style.setProperty(key, value as string);
        });

        return () => {
            // Cleanup on unmount - removes inline styles so classes fallback to index.css
            Object.keys(moodCssStyle).forEach(key => {
                root.style.removeProperty(key);
            });
        };
    }, [moodCssStyle]);

    return (
        <div
            className="min-h-screen relative transition-colors bg-transparent duration-500 z-0"
        // style={{
        //     background: mood.pageBackground,
        // } as React.CSSProperties}
        >
            <SEO
                title={`${mood.name} Fonts — NoBadFonts`}
                description={mood.description}
            />

            {/* Texture overlay */}
            {/* {mood.textureClass && (
                <div className={`fixed inset-0 pointer-events-none z-0 opacity-[0.04] ${mood.textureClass}`} />
            )} */}

            {/* Hero */}
            <MoodHero mood={mood} />

            {/* Category chips */}
            {/* <div className="sticky top-16 z-30 px-4 md:px-8 py-3 backdrop-blur-xl" style={{ background: `${mood.pageBackground}cc` }}>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 max-w-7xl mx-auto">
                    <button
                        onClick={() => setActiveCategory(null)}
                        className="shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap"
                        style={!activeCategory ? {
                            background: mood.accentColor,
                            color: mood.accentFg,
                        } : {
                            background: `${mood.accentColor}18`,
                            color: `${mood.accentColor}`,
                            border: `1px solid ${mood.accentColor}30`,
                        }}
                    >
                        All
                    </button>
                    {mood.contextCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                            className="shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap"
                            style={activeCategory === cat ? {
                                background: mood.accentColor,
                                color: mood.accentFg,
                            } : {
                                background: `${mood.accentColor}12`,
                                color: `${mood.accentColor}`,
                                border: `1px solid ${mood.accentColor}25`,
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div> */}

            {/* Toolbar Filters */}
            {/* <aside className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none flex justify-center pb-safe">
                <div className="pointer-events-auto">
                    <Filters
                        filters={{...filtersParams, categories: []}}
                        onChange={(newFilters) => {
                            if (newFilters.query !== undefined) setSearchQuery(newFilters.query);
                        }}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        showExpandToggle={true}
                        allExpanded={globalExpanded}
                        onToggleAll={() => {
                            setGlobalExpanded(!globalExpanded);
                            setBulkToggleVersion(v => v + 1);
                            setExpandedFontId(null);
                        }}
                        customText={customText}
                        onCustomTextChange={setCustomText}
                    />
                </div>
            </aside> */}

            {/* Font grid */}
            <div className="px-1 sm:px-2 md:px-4 pt-4 pb-24 relative z-10">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 px-3">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="rounded-3xl animate-pulse h-56"
                                style={{ background: `${mood.accentColor}15` }}
                            />
                        ))}
                    </div>
                ) : fonts.length > 0 ? (
                    <>
                        <div className="masonic-grid">
                            <Masonry
                                items={items}
                                itemKey={(data) => data.id}
                                columnCount={columns}
                                columnGutter={16}
                                itemHeightEstimate={280}
                                overscanBy={1}
                                render={MasonryCard}
                            />
                        </div>
                        <div ref={infiniteRef} className="h-1 w-full" />
                    </>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-4xl mb-3">🔍</p>
                        <p className="font-semibold" style={{ color: `rgb(${mood.cssVars['--mood-text']})` }}>
                            No fonts found
                        </p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveCategory(null); }}
                            className="mt-3 text-sm underline cursor-pointer"
                            style={{ color: mood.accentColor }}
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* Back to moods */}
            <div className="fixed top-24 left-4 md:left-8 z-40">
                <Link
                    to="/moods"
                    className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold backdrop-blur-xl shadow-md transition-all duration-300 hover:scale-105"
                    style={{
                        background: `${mood.accentColor}20`,
                        border: `1px solid ${mood.accentColor}40`,
                        color: mood.accentColor,
                    }}
                >
                    <span>←</span> Moods
                </Link>
            </div>
        </div>
    );
}

function MoodHero({ mood }: { mood: MoodDefinition }) {
    return (
        <>
            {(mood.desktopBanner || mood.mobileBanner) && (
                <picture className="fixed max-h-screen top-0 left-0 right-0 z-0">
                    {mood.desktopBanner && <source media="(min-width: 768px)" srcSet={mood.desktopBanner} />}
                    <img
                        src={mood.mobileBanner || mood.desktopBanner}
                        alt={`${mood.name} banner`}
                        className="w-full zh-full object-contain object-top"
                    />
                    <div className="absolute inset-0 z-0 bg-linear-to-b from-transparent via-transparent to-[#FFFFFF]"></div>
                </picture>
            )}

            <div
                className="relative pt-20 pb-0 zoverflow-hidden z-20 min-h-[60vh] flex flex-col items-center justify-center h-full w-full"
                // style={{ background: mood.heroBackground, minHeight: '340px' }}
            >
                {/* Image Banners */}
                {/* {(mood.desktopBanner || mood.mobileBanner) && (
                <picture className="absolutez inset-0 z-0">
                    {mood.desktopBanner && <source media="(min-width: 768px)" srcSet={mood.desktopBanner} />}
                    <img
                        src={mood.mobileBanner || mood.desktopBanner}
                        alt={`${mood.name} banner`}
                        className="w-full zh-full object-contain object-top"
                    />
                    <div className="absolute inset-0 z-0 bg-linear-to-b from-transparent via-transparent to-[#FEE3BA]"></div>
                </picture>
            )} */}

                {/* Decorative hero elements by mood */}
                <HeroDecor mood={mood} />

                {/* Content */}
                <div className="relative z-10 px-6 md:px-10 pt-8 pb-16 text-center max-w-3xl mx-auto">
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xs uppercase tracking-[0.4em] mb-4 font-medium opacity-60"
                        style={{ color: `rgb(${mood.cssVars['--mood-text']})` }}
                    >
                        — Mood —
                    </motion.p>

                    <motion.h1
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-4"
                        style={{ color: `rgb(${mood.cssVars['--mood-text']})` }}
                    >
                        {mood.name}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="text-xs uppercase tracking-[0.3em] mb-3 font-medium opacity-50"
                        style={{ color: `rgb(${mood.cssVars['--mood-text']})` }}
                    >
                        {mood.tagline.toUpperCase()}
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="text-sm md:text-base max-w-lg mx-auto opacity-60 leading-relaxed"
                        style={{ color: `rgb(${mood.cssVars['--mood-text']})` }}
                    >
                        {mood.description}
                    </motion.p>
                </div>

                {/* Bottom fade */}
                {/* <div
                    className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                    style={{ background: mood.heroOverlay }}
                /> */}
            </div>
        </>
    );
}

function HeroDecor({ mood }: { mood: MoodDefinition }) {
    const style = mood.decorationStyle;
    const textColor = `rgb(${mood.cssVars['--mood-text']})`;

    if (style === 'cyberpunk') {
        return (
            <>
                <div className="absolute top-8 left-6 opacity-20 text-xs font-mono" style={{ color: mood.accentColor }}>
                    {['SYSTEM ONLINE', '// LOADING FONTS', '> INIT CATALOG', '░░░░░░░░░░░░'].map((line, i) => (
                        <div key={i} className="mb-1">{line}</div>
                    ))}
                </div>
                <div className="absolute top-8 right-6 opacity-20 text-xs font-mono text-right" style={{ color: mood.accentColor }}>
                    {['TYPE SYSTEM', 'NEURAL LINK', 'STATUS: ACTIVE', '2087 ∞'].map((line, i) => (
                        <div key={i} className="mb-1">{line}</div>
                    ))}
                </div>
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `repeating-linear-gradient(0deg, ${mood.accentColor} 0px, transparent 1px, transparent 20px)`,
                }} />
            </>
        );
    }

    if (style === 'editorial') {
        return (
            <>
                <div className="absolute top-24 left-8 opacity-10 text-[80px] font-black leading-none" style={{ color: textColor }}>
                    N
                </div>
                <div className="absolute top-12 left-6 flex flex-col gap-1 text-[8px] uppercase tracking-[0.2em] opacity-30" style={{ color: textColor }}>
                    {['Culture', 'Fashion', 'Branding', 'Editorial', 'Art Direction', 'Typefaces', 'Worldwide'].map(t => (
                        <span key={t}>{t}</span>
                    ))}
                </div>
                <div className="absolute top-12 right-8 opacity-15 text-xs uppercase tracking-widest text-right" style={{ color: textColor }}>
                    <div className="text-3xl font-black">01 / 10</div>
                </div>
            </>
        );
    }

    if (style === 'y2k') {
        return (
            <>
                <div className="absolute top-6 left-4 opacity-50 text-4xl">💿</div>
                <div className="absolute top-6 right-4 opacity-40 text-3xl">✦</div>
                <div className="absolute bottom-12 left-8 opacity-30 text-2xl">★</div>
                <div className="absolute top-8 left-16 opacity-20 text-lg font-mono" style={{ color: mood.accentColor }}>
                    // 2000 →∞
                </div>
            </>
        );
    }

    if (style === 'horror') {
        return (
            <>
                <div className="absolute top-8 left-6 opacity-20 text-xs uppercase tracking-widest leading-loose" style={{ color: 'rgb(200,30,30)' }}>
                    {['Type', 'Terror', 'People', 'Ideas'].map(w => <div key={w}>{w}</div>)}
                </div>
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'radial-gradient(circle, #cc000030 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }} />
            </>
        );
    }

    if (style === 'scifi') {
        return (
            <>
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full border pointer-events-none"
                        style={{
                            width: `${140 + i * 70}px`,
                            height: `${140 + i * 70}px`,
                            borderColor: mood.accentColor,
                            opacity: 0.07 - i * 0.01,
                            top: '50%',
                            right: '5%',
                            transform: 'translateY(-50%)',
                        }}
                    />
                ))}
                <div className="absolute top-10 right-6 text-xs font-mono opacity-20" style={{ color: mood.accentColor }}>
                    {['COORDINATES: 7F.3C', 'SECTOR: ALPHA-9', 'WARP: ENABLED'].map(t => <div key={t} className="mb-1">{t}</div>)}
                </div>
            </>
        );
    }

    if (style === 'luxury') {
        return (
            <>
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #c8a550 0px, transparent 1px, transparent 40px)',
                }} />
                <div className="absolute top-12 right-8 opacity-10">
                    <svg width="80" height="80" viewBox="0 0 80 80">
                        <polygon points="40,2 48,28 76,28 54,44 62,72 40,56 18,72 26,44 4,28 32,28" fill="none" stroke={mood.accentColor} strokeWidth="1" />
                    </svg>
                </div>
            </>
        );
    }

    if (style === 'kawaii') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {['🌸', '☁️', '🐱', '⭐', '🌈', '💖'].map((em, i) => (
                    <span
                        key={i}
                        className="absolute text-2xl opacity-20"
                        style={{
                            top: `${10 + (i * 17) % 70}%`,
                            left: `${5 + (i * 23) % 90}%`,
                            transform: `rotate(${i * 30 - 60}deg)`,
                        }}
                    >
                        {em}
                    </span>
                ))}
            </div>
        );
    }

    if (style === 'pixel') {
        return (
            <div
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                    backgroundImage: `repeating-linear-gradient(0deg, ${mood.accentColor} 0px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, ${mood.accentColor} 0px, transparent 1px, transparent 8px)`,
                }}
            />
        );
    }

    if (style === 'retro') {
        return (
            <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
                <div className="w-full h-full rounded-full border-4" style={{ borderColor: mood.accentColor }} />
                <div className="absolute inset-4 rounded-full border-2" style={{ borderColor: mood.accentColor }} />
            </div>
        );
    }

    return null;
}
