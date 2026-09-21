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
    const [filters, setFilters] = useState<FontFilterParams>({
        query: searchParams.get('query') || '',
        categories: searchParams.get('categories') ? searchParams.get('categories')?.split(',') : [],
        sortBy: (searchParams.get('sortBy') as any) || 'trending',
    });

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

    // Update URL when filters change
    useEffect(() => {
        const params: any = {};
        if (filters.query) params.query = filters.query;
        if (filters.categories && filters.categories.length > 0) {
            params.categories = filters.categories.join(',');
        }
        if (filters.sortBy && filters.sortBy !== 'trending') params.sortBy = filters.sortBy;
        setSearchParams(params, { replace: true });
    }, [filters, setSearchParams]);

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
        width > 1280 ? 4 :
            width > 1024 ? 3 :
                width > 640 ? 2 :
                    1;

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
        <div className="min-h-screen w-full">
            <SEO
                title={dynamicTitle}
                description={dynamicDescription}
                url={location.pathname + location.search}
                keywords={['free fonts', 'font catalog', 'typography', ...activeCategories]}
                schema={catalogSchema}
            />

            <div className="relative px-1 sm:px-2 md:px-4 pt-0 md:pt-6 w-full">
                {/* Header */}
                <div className="mb-8 text-center px-8">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-[rgb(var(--color-foreground)/0.85)] mb-4">Catalog</h1>
                    <p className="text-[rgb(var(--color-muted-foreground))] max-w-xl mx-auto">
                        Discover the perfect typeface for your next project from our extensive collection of premium fonts.
                    </p>
                </div>

                {/* Sidebar */}
                <aside className="w-full shrink-0 transition-all duration-300 ease-in-out">
                    <Filters
                        filters={filters}
                        onChange={setFilters}
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
                        <div className="bg-[rgb(var(--color-destructive)/0.1)] border border-[rgb(var(--color-destructive)/0.2)] text-[rgb(var(--color-destructive))] p-6 rounded-2xl text-center max-w-2xl mx-auto">
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
                                <div key={i} className="bg-[rgb(var(--color-card)/0.6)] mb-4 sm:mb-6 rounded-4xl zborder border-[rgb(var(--color-foreground)/0.2)] h-64 animate-pulse" />
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
