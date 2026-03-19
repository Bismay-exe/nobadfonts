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
                className="fixed inset-0 bg-[rgb(var(--color-foreground)/0.5)] z-40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-125 lg:w-110 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-tl-4xl shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out animation-slide-in-right ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="p-6 border-y-2 border-[rgb(var(--color-border))] flex justify-between items-center bg-[rgb(var(--color-card))] rounded-4xl shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-[rgb(var(--color-foreground))]">Select {activeSection} Font</h2>
                        <p className="text-sm font-bold text-[rgb(var(--color-muted-foreground))]">Choose a font from the library</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-full hover:bg-[rgb(var(--color-foreground))] hover:text-[rgb(var(--color-background))] transition-colors text-[rgb(var(--color-foreground))]"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Container (Scrollable) */}
                <div className="grow overflow-y-auto">
                    <div>

                        {/* Filters Section */}
                        <div className="bg-[rgb(var(--color-background))] p-6 rounded-4xl border-y-2 border-[rgb(var(--color-border))]">
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
                                <div className="bg-[rgb(var(--color-destructive)/0.1)] text-[rgb(var(--color-destructive))] p-4 rounded-4xl border-y-2 border-[rgb(var(--color-destructive)/0.2)]">
                                    Error loading fonts: {error}
                                </div>
                            )}

                            {loading ? (
                                <div className="columns-1 gap-0">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="bg-[rgb(var(--color-card))] rounded-4xl h-48 animate-pulse border-2 border-[rgb(var(--color-border)/0.2)]" />
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
