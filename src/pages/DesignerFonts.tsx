import { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useViewMode } from '../hooks/useViewMode';
import { supabase } from '../lib/supabase';
import FontCard from '../components/fonts/FontCard';
import EmptyState from '../components/shared/EmptyState';
import Filters from '../components/fonts/Filters';
import type { Font, FontFilterParams } from '../types/font';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/shared/SEO';

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
        <div className="w-full grid grid-cols-1 lg:grid-cols-4">
            <SEO
                title={`${decodeURIComponent(designerName || '')} Fonts`}
                description={`Browse all fonts designed by ${decodeURIComponent(designerName || '')}. High-quality typography for your next project.`}
                url={`/designers/${designerName}`}
            />
            <div className="col-span-1 lg:col-span-4 border-y border-black flex flex-col lg:flex-col">

                {/* Header (Designer Info) */}
                <div className="bg-[#EEEFEB] rounded-4xl border-y border-black px-6 py-12 md:px-12 md:py-20 flex flex-col items-center text-center relative">
                    <button
                        onClick={() => {
                            if (location.state?.from) {
                                navigate(-1);
                            } else {
                                navigate('/fonts');
                            }
                        }}
                        className="absolute top-6 left-6 md:top-10 md:left-12 flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-gray-600 transition-colors z-10"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>

                    <h1 className="text-4xl md:text-6xl font-black mb-4">
                        {decodeURIComponent(designerName || '')}
                    </h1>
                    <p className="text-sm md:text-xl text-gray-500 font-medium">
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
                        onToggleAll={() => {
                            setGlobalExpanded(!globalExpanded);
                            setExpandedFontId(null);
                        }}
                        customText={customText}
                        onCustomTextChange={setCustomText}
                    />
                </aside>

                {/* Content Grid */}
                <div className="grow border-t border-black">
                    {error && (
                        <div className="max-w-7xl mx-auto p-6">
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
                                Error loading fonts: {error}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="gap-0"
                            style={{
                                columnWidth: 'clamp(220px, 20vw, 320px)',
                            }}
                        >
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="bg-gray-100 h-96 animate-pulse border-b border-r border-[#1C1D1E]" />
                            ))}
                        </div>
                    ) : filteredFonts.length > 0 ? (
                        <div className="gap-0"
                            style={{
                                columnWidth: 'clamp(220px, 20vw, 320px)',
                            }}
                        >
                            {filteredFonts.map((font) => (
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
                        <div className="py-20">
                            <EmptyState
                                title={fonts.length > 0 ? "No matching fonts" : `No fonts found for ${decodeURIComponent(designerName || '')}`}
                                description={fonts.length > 0 ? "Try adjusting your filters or search terms." : "This designer hasn't uploaded any fonts yet."}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
