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
            <div className="hidden col-span-1 lg:col-span-4 border-b-2 border-black bg-white rounded-3xl p-4">
                <h1 className="text-4xl font-bold mb-2">Font Catalog</h1>
                <p className="text-gray-600">Explore our curated collection of high-quality fonts.</p>
            </div>

            <div className="col-span-1 lg:col-span-4 border-b-2 border-black flex flex-col lg:flex-col">
                {/* Sidebar */}
                <aside className="w-full shrink-0 bg-white rounded-3xl p-4">
                    <Filters filters={filters} onChange={setFilters} />
                </aside>

                {/* Content */}
                <div className="grow border-y-2 border-black">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-3xl">
                            Error loading fonts: {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="columns-1 md:columns-3 lg:columns-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-gray-100 rounded-3xl h-64 animate-pulse" />
                            ))}
                        </div>
                    ) : fonts.length > 0 ? (
                        <div className="columns-1 md:columns-3 lg:columns-6 gap-0">
                            {fonts.filter(f => f && f.id).map((font) => (
                                <FontCard key={font.id} font={font} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState />
                    )}

                    {!loading && fonts.length > 0 && (
                        <div className="mt-12 text-center">
                            <p className="text-gray-500 mb-4">Showing {fonts.length} results</p>
                            {/* Pagination load more would go here */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
