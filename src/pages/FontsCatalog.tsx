import { useState, useEffect, useLayoutEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { scrollPositions } from '../components/layout/ScrollRestoration';
import { useViewMode } from '../hooks/useViewMode';
import Filters from '../components/fonts/Filters';
import FontCard from '../components/fonts/FontCard';
import EmptyState from '../components/shared/EmptyState';
import { useFonts } from '../hooks/useFonts';
import type { FontFilterParams } from '../types/font';

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

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-4">

            <div className="col-span-1 lg:col-span-4 border-b-2 border-black flex flex-col lg:flex-col">
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
                <div className="grow border-t border-black">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-4xl">
                            Error loading fonts: {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="gap-0"
                            style={{
                                columnWidth: 'clamp(220px, 20vw, 320px)',
                            }}
                        >
                            {[...Array(25)].map((_, i) => (
                                <div key={i} className="bg-gray-100 rounded-4xl border border-[#1C1D1E] h-64 animate-pulse" />
                            ))}
                        </div>
                    ) : fonts.length > 0 ? (
                        <div className="gap-0"
                            style={{
                                columnWidth: 'clamp(220px, 20vw, 320px)',
                            }}
                        >
                            {fonts.filter(f => f && f.id).map((font) => (
                                <FontCard
                                    key={font.id}
                                    font={font}
                                    viewMode={viewMode}
                                    customText={customText}
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
