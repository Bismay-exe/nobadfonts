import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { scrollPositions } from '../components/layout/ScrollRestoration';
import { useViewMode } from '../hooks/useViewMode';
import { useWindowSize } from '../hooks/useWindowSize';
import Filters from '../components/fonts/Filters';
import FontCard from '../components/fonts/FontCard';
import EmptyState from '../components/shared/EmptyState';
import { useFonts } from '../hooks/useFonts';
import type { FontFilterParams } from '../types/font';
import SEO from '../components/shared/SEO';
import { Masonry } from "masonic";

const MasonryCard = ({ data }: { data: any }) => (
    <FontCard
        font={data}
        viewMode={data.viewMode}
        customText={data.customText}
        isExpanded={data.isExpanded}
        onToggle={data.onToggle}
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
    const [customText, setCustomText] = useState('');

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
    useLayoutEffect(() => {
        if (!loading && fonts.length > 0) {
            const savedPosition = scrollPositions.get((location as any).key);
            if (savedPosition !== undefined) {
                // Small timeout to ensure DOM is fully painted
                setTimeout(() => {
                    window.scrollTo(0, savedPosition);
                }, 0);
            }
        }
    }, [loading, fonts.length, (location as any).key]);

    // Derived State for FontCard
    const getCardProps = (fontId: string) => {
        if (globalExpanded) {
            // Global Expand ON: All expanded, no toggle
            return {
                isExpanded: true,
                onToggle: undefined
            };
        } else {
            // Global Expand OFF: Accordion behavior (Mobile-like)
            return {
                isExpanded: expandedFontId === fontId,
                onToggle: () => setExpandedFontId(expandedFontId === fontId ? null : fontId)
            };
        }
    };

    const { width } = useWindowSize();

    const columns =
        width > 1280 ? 4 :
            width > 1024 ? 3 :
                width > 640 ? 2 :
                    1;

    return (
        <div className="min-h-screen w-full">
            <SEO
                title="Browse Fonts"
                description="Explore our curated collection of high-quality fonts for modern interfaces. Filter by style, category, and more."
                url="/fonts"
            />

            <div className="relative pt-6 pb-32 w-full">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-4">Catalog</h1>
                    <p className="text-zinc-500 max-w-xl mx-auto">
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
                            setExpandedFontId(null); // Clear individual selections when toggling all
                        }}
                        customText={customText}
                        onCustomTextChange={setCustomText}
                    />
                </aside>

                {/* Content */}
                <div className="w-full h-full">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl text-center max-w-2xl mx-auto">
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
                                <div key={i} className="bg-zinc-900/60 mb-4 sm:mb-6 rounded-4xl border border-white/20 h-64 animate-pulse" />
                            ))}
                        </div>
                    ) : fonts.length > 0 ? (
                        <>
                            <Masonry
                                items={fonts.filter(f => f && f.id).map(f => {
                                    const cardProps = getCardProps(f.id);
                                    return {
                                        ...f,
                                        viewMode,
                                        customText,
                                        isExpanded: cardProps.isExpanded,
                                        onToggle: cardProps.onToggle
                                    };
                                })}
                                columnCount={columns}
                                columnGutter={24}
                                render={MasonryCard}
                            />
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
