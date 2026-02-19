import { useState } from 'react';
import { X } from 'lucide-react';
import { useFonts } from '../../hooks/useFonts';
import type { Font, FontFilterParams } from '../../types/font';
import FontCard from '../fonts/FontCard';
import EmptyState from '../shared/EmptyState';
import FontPairingFilters from '../fonts/FontPairingFilters';

interface FontPickerSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (font: Font) => void;
    activeSection: string | null;
}

export default function FontPickerSidebar({ isOpen, onClose, onSelect, activeSection }: FontPickerSidebarProps) {
    const [filters, setFilters] = useState<FontFilterParams>({
        query: '',
        categories: [],
        sortBy: 'trending',
    });
    const [viewMode, setViewMode] = useState<'font' | 'image'>('font');

    const { fonts, loading, error } = useFonts(filters);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div className="fixed inset-y-0 right-0 w-full md:w-125 lg:w-110 bg-zinc-950 border-l border-white/10 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out animation-slide-in-right">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-white">Select {activeSection} Font</h2>
                        <p className="text-sm font-medium text-zinc-400">Choose a font from the library</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-zinc-800 text-white border border-white/10 rounded-full hover:bg-white hover:text-black transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Container (Scrollable) */}
                <div className="grow overflow-y-auto bg-black/50">
                    <div>

                        {/* Filters Section */}
                        <div className="bg-zinc-900/30 p-6 border-b border-white/10 sticky top-0 z-10 backdrop-blur-md">
                            <FontPairingFilters
                                filters={filters}
                                onChange={setFilters}
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                            />
                        </div>

                        {/* Results Section */}
                        <div className="p-4">
                            {error && (
                                <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20">
                                    Error loading fonts: {error}
                                </div>
                            )}

                            {loading ? (
                                <div className="flex flex-col gap-4">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="bg-zinc-900/50 rounded-2xl h-32 animate-pulse border border-white/5" />
                                    ))}
                                </div>
                            ) : fonts.length > 0 ? (
                                <div className="flex flex-col gap-4">
                                    {fonts.map((font) => (
                                        <div key={font.id}>
                                            <FontCard
                                                font={font}
                                                viewMode={viewMode}
                                                disableLink={true}
                                                onClick={(f) => {
                                                    onSelect(f);
                                                    onClose();
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
