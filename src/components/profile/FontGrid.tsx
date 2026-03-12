import { useMemo, useState, useRef } from 'react';
import { Masonry } from 'masonic';
import FontCard from '../fonts/FontCard';
import Filters from '../fonts/Filters';
import type { Font, FontFilterParams } from '../../types/font';
import { useWindowSize } from '../../hooks/useWindowSize';

interface FontGridProps {
    fonts: Font[];
    emptyMessage?: string;
    loading?: boolean;
}

const MasonryCard = ({ data }: { data: any }) => (
    <FontCard
        font={data}
        viewMode={data.viewMode}
        customText={data.customText}
        isExpanded={data.isExpanded}
        onToggle={data.onToggle}
    />
);

export default function FontGrid({ fonts, emptyMessage = "No fonts found.", loading = false }: FontGridProps) {
    const { width } = useWindowSize();
    const [viewMode, setViewMode] = useState<'font' | 'image'>('font');
    const [expandedFontId, setExpandedFontId] = useState<string | null>(null);
    const [filters, setFilters] = useState<FontFilterParams>({ query: '', categories: [], sortBy: 'newest' });
    const [customText, setCustomText] = useState('');
    const [globalExpanded, setGlobalExpanded] = useState(false);
    const [bulkToggleVersion, setBulkToggleVersion] = useState(0);
    const [isBulkToggling, setIsBulkToggling] = useState(false);
    const bulkToggleTimeoutRef = useRef<any>(null);

    const columns =
        width > 1280 ? 4 :
            width > 1024 ? 3 :
                width > 640 ? 2 :
                    1;

    const filteredFonts = useMemo(() => {
        let result = [...fonts];
        if (filters.query) {
            const q = filters.query.toLowerCase();
            result = result.filter(f =>
                f.name.toLowerCase().includes(q) ||
                (f.tags && f.tags.some((t: string) => t.toLowerCase().includes(q)))
            );
        }
        if (filters.categories && filters.categories.length > 0) {
            result = result.filter(f =>
                f.tags && filters.categories!.some(cat => f.tags?.includes(cat))
            );
        }
        result.sort((a, b) => {
            switch (filters.sortBy) {
                case 'popular': return (b.favorites_count || 0) - (a.favorites_count || 0);
                case 'newest': return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                case 'alpha': return a.name.localeCompare(b.name);
                default: return 0;
            }
        });
        return result;
    }, [fonts, filters]);

    const masonryItems = useMemo(() =>
        filteredFonts
            .filter(f => f && f.id)
            .map(f => {
                const cardProps = globalExpanded
                    ? { isExpanded: true, onToggle: undefined }
                    : { isExpanded: expandedFontId === f.id, onToggle: () => setExpandedFontId(expandedFontId === f.id ? null : f.id) };
                return { ...f, viewMode, customText, ...cardProps, bulkToggleVersion };
            })
    , [filteredFonts, viewMode, customText, expandedFontId, globalExpanded, bulkToggleVersion]);

    if (loading) {
        return (
            <div className="masonic-grid">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-zinc-900/60 rounded-4xl border border-white/20 h-64 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <aside className="w-full shrink-0 transition-all duration-300 ease-in-out">
                <Filters
                    filters={filters}
                    onChange={setFilters}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    showExpandToggle={true}
                    allExpanded={globalExpanded}
                    onToggleAll={() => {
                        setGlobalExpanded(!globalExpanded);
                        setBulkToggleVersion(v => v + 1);
                        setIsBulkToggling(true);
                        if (bulkToggleTimeoutRef.current) clearTimeout(bulkToggleTimeoutRef.current);
                        bulkToggleTimeoutRef.current = setTimeout(() => setIsBulkToggling(false), 450);
                        setExpandedFontId(null);
                    }}
                    customText={customText}
                    onCustomTextChange={setCustomText}
                />
            </aside>

            {fonts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-4xl border border-dashed border-gray-200">
                    <p className="text-gray-500">{emptyMessage}</p>
                </div>
            ) : (
                <div className={`masonic-grid ${isBulkToggling ? 'is-bulk-toggling' : ''}`}>
                    <Masonry
                        items={masonryItems}
                        columnCount={columns}
                        columnGutter={24}
                        render={MasonryCard}
                    />
                </div>
            )}
        </>
    );
}
