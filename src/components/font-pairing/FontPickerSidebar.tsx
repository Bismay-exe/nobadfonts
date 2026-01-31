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
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div className="fixed inset-y-0 right-0 w-full md:w-125 lg:w-110 bg-black border-2 border-black rounded-tl-4xl shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out animation-slide-in-right">

                {/* Header */}
                <div className="p-6 border-y border-black flex justify-between items-center bg-[#FFF8DA] rounded-4xl shrink-0">
                    <div>
                        <h2 className="text-2xl font-black">Select {activeSection} Font</h2>
                        <p className="text-sm font-bold text-gray-500">Choose a font from the library</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white border-2 border-black rounded-full hover:bg-black hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Container (Scrollable) */}
                <div className="grow overflow-y-auto">
                    <div>

                        {/* Filters Section */}
                        <div className="bg-white p-6 rounded-3xl border-y border-black">
                            <FontPairingFilters
                                filters={filters}
                                onChange={setFilters}
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                            />
                        </div>

                        {/* Results Section */}
                        <div>
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-3xl border-y border-red-200">
                                    Error loading fonts: {error}
                                </div>
                            )}

                            {loading ? (
                                <div className="columns-1 gap-0">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="bg-white rounded-3xl h-48 animate-pulse border-2 border-gray-200" />
                                    ))}
                                </div>
                            ) : fonts.length > 0 ? (
                                <div className="columns-1 gap-0">
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
