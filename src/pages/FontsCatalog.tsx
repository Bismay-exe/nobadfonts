import { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { scrollPositions } from '../components/layout/ScrollRestoration';
import { useViewMode } from '../hooks/useViewMode';
import { useWindowSize } from '../hooks/useWindowSize';
import { Filters } from '../components/fonts/Filters';
import FontCard from '../components/fonts/FontCard';
import EmptyState from '../components/shared/EmptyState';
import { useFonts } from '../hooks/useFonts';
import type { FontFilterParams } from '../types/font';
import SEO from '../components/shared/SEO';
import { Masonry } from "masonic";
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const MasonryCard = ({ data, width }: { data: any; width: number }) => (
    <FontCard
        font={data}
        viewMode={data.viewMode}
        customText={data.customText}
        isExpanded={data.isExpanded}
        onToggle={data.onToggle}
        isFavorited={data.isFavorited}
        onFavoriteChange={data.onFavoriteChange}
        cardWidth={width}
    />
);

export default function FontsCatalog() {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = useMemo<FontFilterParams>(() => {
        return {
            query: searchParams.get('query') || '',
            categories: searchParams.get('categories') ? searchParams.get('categories')!.split(',').filter(Boolean) : [],
            sortBy: (searchParams.get('sortBy') as any) || 'trending',
        };
    }, [searchParams]);

    const handleFiltersChange = useCallback((nextFilters: FontFilterParams) => {
        const params = new URLSearchParams();
        if (nextFilters.query) params.set('query', nextFilters.query);
        if (nextFilters.categories && nextFilters.categories.length > 0) {
            params.set('categories', nextFilters.categories.join(','));
        }
        if (nextFilters.sortBy && nextFilters.sortBy !== 'trending') {
            params.set('sortBy', nextFilters.sortBy);
        }
        setSearchParams(params, { replace: true });
    }, [setSearchParams]);

    const [viewMode, setViewMode] = useViewMode();
    const [expandedFontId, setExpandedFontId] = useState<string | null>(null);
    const [globalExpanded, setGlobalExpanded] = useState(true);
    const [bulkToggleVersion, setBulkToggleVersion] = useState(0);
    const [isBulkToggling, setIsBulkToggling] = useState(false);
    const bulkToggleTimeoutRef = useRef<any>(null);
    const [customText, setCustomText] = useState('');
    const { user } = useAuth();
    const [userFavoriteIds, setUserFavoriteIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!user) {
            setUserFavoriteIds(new Set());
            return;
        }

        let isMounted = true;
        supabase
            .from('favorites')
            .select('font_id')
            .eq('user_id', user.id)
            .then(({ data, error }) => {
                if (!isMounted || error || !data) return;
                setUserFavoriteIds(new Set(data.map((f: any) => f.font_id)));
            });

        return () => {
            isMounted = false;
        };
    }, [user]);

    const handleFavoriteToggle = useCallback((fontId: string, isFav: boolean) => {
        setUserFavoriteIds(prev => {
            const next = new Set(prev);
            if (isFav) {
                next.add(fontId);
            } else {
                next.delete(fontId);
            }
            return next;
        });
    }, []);

    const { fonts, loading, loadingMore, error, hasMore, loadMore } = useFonts(filters);

    const observer = useRef<IntersectionObserver | null>(null);
    const bottomRef = useCallback((node: HTMLDivElement | null) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        }, {
            rootMargin: '200px' // Load more slightly before reaching the very bottom
        });

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore, loadMore]);

    // Restore scroll position when fonts are loaded
    const restoredRef = useRef(false);

    useLayoutEffect(() => {
        if (!loading && fonts.length > 0 && !restoredRef.current) {
            const savedPosition = scrollPositions.get((location as any).key);
            if (savedPosition !== undefined) {
                // Small timeout to ensure DOM is fully painted
                setTimeout(() => {
                    window.scrollTo(0, savedPosition);
                }, 0);
            }
            restoredRef.current = true;
        }
    }, [loading, fonts.length, (location as any).key]);

    // Reset restoredRef on location change
    useEffect(() => {
        restoredRef.current = false;
    }, [(location as any).key]);

    // Derived State for FontCard
    const getCardProps = useCallback((fontId: string) => {
        if (globalExpanded) {
            // Global Expand ON: All expanded, no toggle
            return {
                isExpanded: expandedFontId === fontId,
                onToggle: () => setExpandedFontId(expandedFontId === fontId ? null : fontId)
            };
        } else {
            // Global Expand OFF: Accordion behavior (Mobile-like)
            return {
                isExpanded: true,
                onToggle: undefined
            };
        }
    }, [expandedFontId, globalExpanded]);

    const { width } = useWindowSize();

    const items = useMemo(() => {
        return fonts
            .filter(f => f && f.id)
            .map(f => {
                const cardProps = getCardProps(f.id);

                return {
                    ...f,
                    viewMode,
                    customText,
                    isExpanded: cardProps.isExpanded,
                    onToggle: cardProps.onToggle,
                    isFavorited: userFavoriteIds.has(f.id),
                    onFavoriteChange: handleFavoriteToggle,
                    bulkToggleVersion
                };
            });
    }, [fonts, viewMode, customText, getCardProps, userFavoriteIds, handleFavoriteToggle, bulkToggleVersion]);

    const columns =
        width > 3000 ? 7 :
            width > 2560 ? 6 : // 4k Tvs
                width > 1920 ? 5 : // Large TVs / Ultra-wide monitors
                    width > 1440 ? 4 : // Large Laptops / Standard Desktops
                        width > 1024 ? 3 : // Standard Laptops / Large Tablets
                            width > 768 ? 2 : // Medium Tablets (Portrait)
                                width > 480 ? 2 : // Large Phones (Landscape)
                                    1;  // Standard Mobile Phones


    const activeCategories = filters.categories && filters.categories.length > 0 ? filters.categories : [];
    const dynamicTitle = activeCategories.length > 0
        ? `${activeCategories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')} Fonts Archive`
        : filters.query
            ? `Fonts matching "${filters.query}"`
            : "Free Fonts Catalog — Curated Typography";

    const dynamicDescription = activeCategories.length > 0
        ? `Explore curated free ${activeCategories.join(', ')} fonts. Download open-source typefaces in WOFF2, TTF, and OTF formats on NoBadFonts.`
        : filters.query
            ? `Search results for "${filters.query}" on NoBadFonts. Free typography, instant testing, and zero-dependency ZIP packages.`
            : "Explore our curated collection of 100% free and open-source fonts for modern interfaces. Filter by style, classification, and vibe.";

    const catalogSchema = {
        '@type': 'CollectionPage',
        name: dynamicTitle,
        description: dynamicDescription,
        url: 'https://nobadfonts.in/fonts',
        isPartOf: {
            '@type': 'WebSite',
            name: 'NoBadFonts',
            url: 'https://nobadfonts.in'
        }
    };

    return (
        <div className="pt-24 min-h-screen w-full">
            <SEO
                title={dynamicTitle}
                description={dynamicDescription}
                url={location.pathname + location.search}
                keywords={['free fonts', 'font catalog', 'typography', ...activeCategories]}
                schema={catalogSchema}
            />
            <div className="relative px-1 sm:px-2 md:px-4 pt-0 md:pt-6 w-full">
                {/* Header */}
                <div className="mb-10 text-center px-4 sm:px-8 relative z-30">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground/85 mb-4">Catalog</h1>
                    <p className="text-muted max-w-xl mx-auto">
                        Discover the perfect typeface for your next project from our extensive collection of premium fonts.
                    </p>
                </div>

                {/* Sidebar */}
                <aside className="w-full shrink-0 transition-all duration-300 ease-in-out">
                    <Filters
                        filters={filters}
                        onChange={handleFiltersChange}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        showExpandToggle={true} // Enable on all screens
                        allExpanded={globalExpanded}
                        onToggleAll={() => {
                            setGlobalExpanded(!globalExpanded);
                            setBulkToggleVersion(v => v + 1);
                            setIsBulkToggling(true);
                            if (bulkToggleTimeoutRef.current) clearTimeout(bulkToggleTimeoutRef.current);
                            bulkToggleTimeoutRef.current = setTimeout(() => setIsBulkToggling(false), 450);
                            setExpandedFontId(null); // Clear individual selections when toggling all
                        }}
                        customText={customText}
                        onCustomTextChange={setCustomText}
                    />
                </aside>

                {/* Content */}
                <div className="w-full h-full">
                    {error && (
                        <div className="bg-warning/10 text-warning m-4 p-6 rounded-2xl text-center max-w-2xl mx-auto">
                            Error loading fonts: {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="gap-6"
                            style={{
                                columnWidth: 'clamp(320px, 20vw, 420px)',
                            }}
                        >
                            {[...Array(16)].map((_, i) => (
                                <div key={i} className="bg-card-background/60 mb-4 sm:mb-6 rounded-4xl zborder border-foreground/20 h-64 animate-pulse
                                flex justify-center items-center text-foreground" >
                                    <svg
                                        className='overflow-visible opacity-25'
                                        width="60"
                                        height="60"
                                        viewBox="0 0 680 678"
                                        fill="currentColor"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M27.7539 678C27.7539 678 4.99807 663 0.500015 598C-3.99804 533 22 418 72.5 353.5C123 289 226.5 226 226.5 226C226.5 226 319.5 0 452.5 0C585.5 0 680 213.239 680 415.5C680 617.761 639.5 678 639.5 678H403C403 678 366.5 625 345 537C323.5 449 384.5 291 384.5 218.5C384.5 146 226.5 226 226.5 226C226.5 226 191 320.5 191 452C191 583.5 250 678 250 678H27.7539Z" />

                                        <path
                                            className="origin-[113.5px_113px] animate-[spin_2s_linear_infinite]"
                                            d="M30.508 20.5896C21.5794 14.4189 11.648 7.55723 0.503116 0.0105563C8.0698 11.1837 14.9155 21.091 21.0703 29.9942C49.3078 70.8509 63.4278 91.2869 63.4272 113.006C63.4278 134.69 49.3555 155.092 21.2122 195.813L21.0862 195.999C14.915 204.928 8.05273 214.86 0.506647 226.005C11.6816 218.44 21.5883 211.595 30.4915 205.439C71.3464 177.201 91.7824 163.081 113.501 163.081C135.187 163.079 155.588 177.152 196.309 205.297L196.497 205.42C205.425 211.592 215.356 218.456 226.5 226.002C218.935 214.827 212.09 204.92 205.935 196.016C177.698 155.16 163.576 134.726 163.576 113.006C163.576 91.3234 177.648 70.9203 205.792 30.199L205.918 30.0119C212.09 21.0839 218.952 11.1508 226.497 0.00820215C215.323 7.57253 205.417 14.4171 196.512 20.5731C155.657 48.8118 135.222 62.9323 113.502 62.9317C91.8183 62.9317 71.417 48.8582 30.6945 20.7161L30.508 20.5896Z"
                                        />
                                    </svg>
                                </div>
                            ))}
                        </div>
                    ) : fonts.length > 0 ? (
                        <>
                            <div className={`masonic-grid select-none ${isBulkToggling ? 'is-bulk-toggling' : ''}`}>
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
                            {/* Invisible div that triggers intersection observer when user scrolls near the bottom */}
                            <div ref={bottomRef} className="h-1 w-full" />
                        </>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>
        </div>
    );
}
