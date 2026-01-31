import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Filters from '../components/fonts/Filters';
import FontCard from '../components/fonts/FontCard';
import EmptyState from '../components/shared/EmptyState';
import { useFonts } from '../hooks/useFonts';
import type { FontFilterParams } from '../types/font';

export default function FontsCatalog() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState<FontFilterParams>({
        query: searchParams.get('query') || '',
        categories: searchParams.get('categories') ? searchParams.get('categories')?.split(',') : [],
        sortBy: (searchParams.get('sortBy') as any) || 'trending',
    });

    const [viewMode, setViewMode] = useState<'font' | 'image'>('font');

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

    return (
        <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-4">

            <div className="col-span-1 lg:col-span-4 border-b-2 border-black flex flex-col lg:flex-col">
                {/* Sidebar */}
                <aside className="w-full shrink-0 bg-[#FFF] rounded-3xl p-4">
                    <Filters
                        filters={filters}
                        onChange={setFilters}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                    />
                </aside>

                {/* Content */}
                <div className="grow border-y-2 border-black">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-3xl">
                            Error loading fonts: {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="gap-1"
                            style={{
                                columnWidth: 'clamp(220px, 20vw, 320px)',
                            }}
                        >
                            {[...Array(15)].map((_, i) => (
                                <div key={i} className="bg-gray-100 rounded-3xl h-64 animate-pulse" />
                            ))}
                        </div>
                    ) : fonts.length > 0 ? (
                        <div className="gap-0"
                            style={{
                                columnWidth: 'clamp(220px, 20vw, 320px)',
                            }}
                        >
                            {fonts.filter(f => f && f.id).map((font) => (
                                <FontCard key={font.id} font={font} viewMode={viewMode} />
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
