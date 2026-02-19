import { useState, useEffect, useLayoutEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { scrollPositions } from '../components/layout/ScrollRestoration';
import { useViewMode } from '../hooks/useViewMode';
import Filters from '../components/fonts/Filters';
import FontCard from '../components/fonts/FontCard';
import EmptyState from '../components/shared/EmptyState';
import { useFonts } from '../hooks/useFonts';
import type { FontFilterParams } from '../types/font';
import SEO from '../components/shared/SEO';

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

    const { fonts, loading, error } = useFonts(filters);

    useEffect(() => {
        const params: any = {};
        if (filters.query) params.query = filters.query;
        if (filters.categories && filters.categories.length > 0) {
            params.categories = filters.categories.join(',');
        }
        if (filters.sortBy && filters.sortBy !== 'trending') params.sortBy = filters.sortBy;
        setSearchParams(params, { replace: true });
    }, [filters, setSearchParams]);

    useLayoutEffect(() => {
        if (!loading && fonts.length > 0) {
            const savedPosition = scrollPositions.get((location as any).key);
            if (savedPosition !== undefined) {
                setTimeout(() => {
                    window.scrollTo(0, savedPosition);
                }, 0);
            }
        }
    }, [loading, fonts.length, (location as any).key]);

    const getCardProps = (fontId: string) => {
        if (globalExpanded) {
            return {
                isExpanded: true,
                onToggle: undefined
            };
        } else {
            return {
                isExpanded: expandedFontId === fontId,
                onToggle: () => setExpandedFontId(expandedFontId === fontId ? null : fontId)
            };
        }
    };

    return (
        <div className="min-h-screen bg-black w-full">
            <SEO
                title="Browse Fonts"
                description="Explore our curated collection of high-quality fonts for modern interfaces."
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

                {/* Filters Dock */}
                <Filters
                    filters={filters}
                    onChange={setFilters}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    showExpandToggle={true}
                    allExpanded={globalExpanded}
                    onToggleAll={() => {
                        setGlobalExpanded(!globalExpanded);
                        setExpandedFontId(null);
                    }}
                    customText={customText}
                    onCustomTextChange={setCustomText}
                />

                {/* Content Grid */}
                <div className="w-full">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl text-center max-w-2xl mx-auto">
                            Error loading fonts: {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="bg-zinc-900/20 rounded-3xl border border-white/5 h-75 animate-pulse" />
                            ))}
                        </div>
                    ) : fonts.length > 0 ? (
                        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
                            {fonts.filter(f => f && f.id).map((font, i) => (
                                <FontCard
                                    key={font.id}
                                    font={font}
                                    viewMode={viewMode}
                                    customText={customText}
                                    index={i}
                                    {...getCardProps(font.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>
        </div>
    );
}
