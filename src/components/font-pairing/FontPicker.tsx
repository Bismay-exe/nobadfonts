import { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { useViewMode } from '../../hooks/useViewMode';
import Filters from '../fonts/Filters';
import FontCard from '../fonts/FontCard';
import EmptyState from '../shared/EmptyState';
import { useFonts } from '../../hooks/useFonts';
import { useWindowSize } from '../../hooks/useWindowSize';
import type { Font, FontFilterParams } from '../../types/font';
import { motion, AnimatePresence } from 'framer-motion';
import { useMasonry, usePositioner, useResizeObserver } from "masonic";

const MasonryCard = ({ data }: { data: any }) => (
    <FontCard
        font={data.font}
        viewMode={data.viewMode}
        customText={data.customText}
        disableLink={true}
        hideLike={true}
        onClick={() => {
            data.onSelect(data.font);
            data.onClose();
        }}
    />
);

interface FontPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (font: Font) => void;
    activeSection: string | null;
}

export default function FontPicker({ isOpen, onClose, onSelect, activeSection }: FontPickerProps) {
    const [filters, setFilters] = useState<FontFilterParams>({
        query: '',
        categories: [],
        sortBy: 'trending',
    });

    const [viewMode, setViewMode] = useViewMode();
    const [customText, setCustomText] = useState('');

    const { fonts, loading, loadingMore, error, hasMore, loadMore } = useFonts(filters);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [gridContainerNode, setGridContainerNode] = useState<HTMLDivElement | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);

    const bottomRef = useCallback((node: HTMLDivElement | null) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        }, {
            root: document.getElementById('font-picker-scroll-container'),
            rootMargin: '200px' // Load more slightly before reaching the very bottom
        });

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore, loadMore]);

    const { width: windowWidth } = useWindowSize();
    const [gridWidth, setGridWidth] = useState(0);

    useEffect(() => {
        if (!isOpen || !gridContainerNode) return;

        const ro = new ResizeObserver(entries => {
            if (entries[0]) {
                setGridWidth(entries[0].contentRect.width);
            }
        });

        ro.observe(gridContainerNode);
        setGridWidth(gridContainerNode.getBoundingClientRect().width);

        return () => ro.disconnect();
    }, [isOpen, windowWidth, gridContainerNode]);

    const actualWidth = gridWidth || 0;

    const columns =
        actualWidth > 1280 ? 4 :
            actualWidth > 1024 ? 3 :
                actualWidth > 640 ? 2 :
                    1;

    // Recreate positioner and clear cache whenever the search results change
    const searchKey = fonts.map(f => f.id).join(',');
    const positioner = usePositioner({ width: actualWidth || 800, columnCount: columns, columnGutter: 24, rowGutter: 24 }, [columns, actualWidth, searchKey]);
    const resizeObserver = useResizeObserver(positioner);

    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    // Reset scroll when fonts change (due to filtering)
    useEffect(() => {
        setScrollTop(0);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [fonts.length]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            setContainerHeight(scrollContainerRef.current.offsetHeight);
        }
    }, [windowWidth, isOpen]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    const masonryGrid = useMasonry({
        positioner,
        resizeObserver,
        items: fonts.filter(f => f && f.id).map(f => ({
            font: f,
            viewMode,
            customText,
            onSelect,
            onClose
        })),
        height: containerHeight || 800, // fallback height
        scrollTop,
        isScrolling: false,
        render: MasonryCard
    });


    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 w-screen h-screen bg-white/0 backdrop-blur-md z-90"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="fixed top-8 md:top-24 left-1/2 -translate-x-1/2 md:w-[calc(100%-2rem)] w-full max-w-400 bottom-0 z-100 bg-black border border-white/15 rounded-t-3xl shadow-[0_0_80px_0_rgba(255,255,255,0.1)] flex flex-col overflow-hidden"
                    >

                        {/* Header */}
                        <div className="shrink-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center px-4 md:px-6">
                            <div>
                                <h2 className="text-2xl font-black text-white">Select {activeSection} Font</h2>
                                <p className="text-sm text-zinc-400">Choose a font from the catalog</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors flex items-center justify-center bg-white/5 cursor-pointer"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Scrollable Content Area */}
                        <div
                            id="font-picker-scroll-container"
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 w-full bg-black overflow-y-auto overflow-x-hidden relative pt-6 pb-32"
                        >

                            {/* Content */}
                            <div className="w-full h-full px-4 md:px-6">
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
                                        <div ref={setGridContainerNode} className="w-full">
                                            {gridWidth > 0 && masonryGrid}
                                        </div>
                                        <div ref={bottomRef} className="h-1 w-full" />
                                    </>
                                ) : (
                                    <EmptyState />
                                )}
                            </div>
                        </div>

                        {/* Filters Container at Bottom */}
                        <aside className="absolute bottom-0 left-0 right-0 w-full z-110 transition-all duration-300 ease-in-out">
                            <Filters
                                filters={filters}
                                onChange={setFilters}
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                                customText={customText}
                                onCustomTextChange={setCustomText}
                            />
                        </aside>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
