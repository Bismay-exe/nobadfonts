import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useViewMode } from '../hooks/useViewMode';
import { useWindowSize } from '../hooks/useWindowSize';
import { supabase } from '../lib/supabase';
import FontCard from '../components/fonts/FontCard';
import EmptyState from '../components/shared/EmptyState';
import Filters from '../components/fonts/Filters';
import type { Font, FontFilterParams } from '../types/font';
import { ArrowLeft } from 'lucide-react';
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

export default function DesignerFonts() {
    const { designerName } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [fonts, setFonts] = useState<Font[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter & View State
    const [filters, setFilters] = useState<FontFilterParams>({
        query: '',
        categories: [],
        sortBy: 'newest',
    });
    const [viewMode, setViewMode] = useViewMode();
    const [customText, setCustomText] = useState('');
    const [expandedFontId, setExpandedFontId] = useState<string | null>(null);
    const [globalExpanded, setGlobalExpanded] = useState(true);
    const [bulkToggleVersion, setBulkToggleVersion] = useState(0);
    const [isBulkToggling, setIsBulkToggling] = useState(false);
    const bulkToggleTimeoutRef = useRef<any>(null);

    useEffect(() => {
        const fetchDesignerFonts = async () => {
            if (!designerName) return;

            setLoading(true);
            try {
                // Fetch ALL fonts by designer
                const { data, error } = await supabase
                    .from('fonts')
                    .select('*, font_variants(*)')
                    .eq('designer', decodeURIComponent(designerName))
                    .eq('is_published', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setFonts(data || []);
            } catch (err: any) {
                console.error('Error fetching designer fonts:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDesignerFonts();
    }, [designerName]);

    // Client-side Filtering & Sorting
    const filteredFonts = useMemo(() => {
        let result = [...fonts];

        // 1. Search Query
        if (filters.query) {
            const lowerQuery = filters.query.toLowerCase();
            result = result.filter(font =>
                font.name.toLowerCase().includes(lowerQuery) ||
                (font.tags && font.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
            );
        }

        // 2. Categories
        if (filters.categories && filters.categories.length > 0) {
            result = result.filter(font =>
                font.tags && filters.categories!.some(cat => font.tags?.includes(cat))
            );
        }

        // 3. Sorting
        result.sort((a, b) => {
            switch (filters.sortBy) {
                case 'trending': // Fallback to favorites for trending if no specific metric
                case 'popular':
                    return (b.favorites_count || 0) - (a.favorites_count || 0);
                case 'newest':
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                case 'alpha':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        return result;
    }, [fonts, filters]);

    // Derived State for FontCard
    const getCardProps = useCallback((fontId: string) => {
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
    }, [globalExpanded, expandedFontId]);

    const { width } = useWindowSize();

    const items = useMemo(() => {
        return filteredFonts
            .filter(f => f && f.id)
            .map(f => {
                const cardProps = getCardProps(f.id)

                return {
                    ...f,
                    viewMode,
                    customText,
                    isExpanded: cardProps.isExpanded,
                    onToggle: cardProps.onToggle,
                    bulkToggleVersion
                }
            })
    }, [filteredFonts, viewMode, customText, expandedFontId, globalExpanded, bulkToggleVersion]);

    const handleToggleAll = useCallback(() => {
        setGlobalExpanded(!globalExpanded);
        setBulkToggleVersion(v => v + 1);
        setIsBulkToggling(true);
        if (bulkToggleTimeoutRef.current) clearTimeout(bulkToggleTimeoutRef.current);
        bulkToggleTimeoutRef.current = setTimeout(() => setIsBulkToggling(false), 450);
        setExpandedFontId(null);
    }, [globalExpanded]);

    const columns =
        width > 1280 ? 4 :
            width > 1024 ? 3 :
                width > 640 ? 2 :
                    1;

    return (
        <div>
            <SEO
                title={`${decodeURIComponent(designerName || '')} Fonts`}
                description={`Browse all fonts designed by ${decodeURIComponent(designerName || '')}. High-quality typography for your next project.`}
                url={`/designers/${designerName}`}
            />

                {/* Header (Designer Info) */}
                <div className="py-12 md:py-20 flex flex-col items-center text-center relative">
                    <button
                        onClick={() => {
                            if (location.state?.from) {
                                navigate(-1);
                            } else {
                                navigate('/fonts');
                            }
                        }}
                        className="absolute top-6 left-2 md:top-10 md:left-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-[rgb(var(--color-muted-foreground))] transition-colors z-10"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>

                    <h1 className="text-4xl md:text-6xl font-black mb-4">
                        {decodeURIComponent(designerName || '')}
                    </h1>
                    <p className="text-sm md:text-xl text-[rgb(var(--color-muted-foreground))] font-medium">
                        {fonts.length} {fonts.length === 1 ? 'Font' : 'Fonts'} Collection
                    </p>
                </div>

                {/* Filters Sidebar/Dock */}
                <aside className="w-full shrink-0 transition-all duration-300 ease-in-out">
                    <Filters
                        filters={filters}
                        onChange={setFilters}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        showExpandToggle={true}
                        allExpanded={globalExpanded}
                        onToggleAll={handleToggleAll}
                        customText={customText}
                        onCustomTextChange={setCustomText}
                    />
                </aside>

                {/* Content Grid */}
                <div className="grow border-t border-[rgb(var(--color-border))]">
                    {error && (
                        <div className="max-w-7xl mx-auto p-6">
                            <div className="bg-[rgb(var(--color-destructive)/0.1)] text-[rgb(var(--color-destructive))] p-4 rounded-xl border border-[rgb(var(--color-destructive)/0.2)]">
                                Error loading fonts: {error}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="gap-6"
                            style={{
                                columnWidth: 'clamp(320px, 20vw, 420px)',
                            }}
                        >
                            {[...Array(16)].map((_, i) => (
                                <div key={i} className="bg-[rgb(var(--color-card)/0.6)] mb-4 sm:mb-6 rounded-4xl border border-[rgb(var(--color-border))] h-64 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredFonts.length > 0 ? (
                        <>
                            <div className={`masonic-grid ${isBulkToggling ? 'is-bulk-toggling' : ''}`}>
                                <Masonry
                                    items={items}
                                    columnCount={columns}
                                    columnGutter={24}
                                    render={MasonryCard}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="py-20">
                            <EmptyState
                                title={fonts.length > 0 ? "No matching fonts" : `No fonts found for ${decodeURIComponent(designerName || '')}`}
                                description={fonts.length > 0 ? "Try adjusting your filters or search terms." : "This designer hasn't uploaded any fonts yet."}
                            />
                        </div>
                    )}
                </div>
        </div>
    );
}
