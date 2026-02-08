import { Search, Type, Image, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import type { FontFilterParams } from '../../types/font';
import { useState } from 'react';
import White from '/logo/logo-white.png';

interface FiltersProps {
    filters: FontFilterParams;
    onChange: (filters: FontFilterParams) => void;
    viewMode?: 'font' | 'image';
    onViewModeChange?: (mode: 'font' | 'image') => void;
}

const CATEGORIES = [
    {
        group: 'Classification',
        items: [
            { id: 'sans-serif', label: 'Sans Serif' },
            { id: 'serif', label: 'Serif' },
            { id: 'slab-serif', label: 'Slab Serif' },
            { id: 'script', label: 'Script' },
            { id: 'monospace', label: 'Monospace' },
            { id: 'display', label: 'Display' },
        ],
    },

    {
        group: 'Style',
        items: [
            { id: 'modern', label: 'Modern' },
            { id: 'classic', label: 'Classic' },
            { id: 'minimal', label: 'Minimal' },
            { id: 'bold', label: 'Bold' },
            { id: 'elegant', label: 'Elegant' },
            { id: 'playful', label: 'Playful' },
            { id: 'experimental', label: 'Experimental' },
            { id: 'brutalist', label: 'Brutalist' },
            { id: 'geometric', label: 'Geometric' },
            { id: 'organic', label: 'Organic' },
        ],
    },

    {
        group: 'Use Case',
        items: [
            { id: 'branding', label: 'Branding' },
            { id: 'logo', label: 'Logo' },
            { id: 'headline', label: 'Headline' },
            { id: 'poster', label: 'Poster' },
            { id: 'corporate', label: 'Corporate' },
            { id: 'tech', label: 'Tech' },
        ],
    },

    {
        group: 'Weight & Shape',
        items: [
            { id: 'light', label: 'Light' },
            { id: 'regular', label: 'Regular' },
            { id: 'heavy', label: 'Heavy' },
            { id: 'condensed', label: 'Condensed' },
            { id: 'wide', label: 'Wide' },
            { id: 'tall', label: 'Tall' },      // NEW
            { id: 'rounded', label: 'Rounded' },
        ],
    },

    {
        group: 'Era & Vibe',
        items: [
            { id: 'retro', label: 'Retro' },
            { id: 'vintage', label: 'Vintage' },
            { id: 'futuristic', label: 'Futuristic' }, // CONFIRMED
            { id: 'gothic', label: 'Gothic' },
        ],
    },
];


const SORT_OPTIONS = [
    { id: 'trending', label: 'Trending' },
    { id: 'popular', label: 'Most Popular' },
    { id: 'editor-picks', label: 'Editor’s picks' },
    { id: 'featured', label: 'Featured' },
    { id: 'newest', label: 'Newest' },
    { id: 'alpha', label: 'A-Z' },
];

export default function Filters({ filters, onChange, viewMode, onViewModeChange }: FiltersProps) {
    const handleChange = (key: keyof FontFilterParams, value: any) => {
        onChange({ ...filters, [key]: value });
    };

    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

    // Find current label
    const currentSortLabel = SORT_OPTIONS.find(opt => opt.id === (filters.sortBy || 'trending'))?.label || 'Trending';

    return (
        <div className="fixed bottom-8 inset-x-4 md:bottom-18 md:inset-auto md:left-1/2 md:-translate-x-1/2 flex flex-col-reverse items-center z-50 pointer-events-none">

            {/* Main Filter Dock */}
            <div className="pointer-events-auto flex items-center gap-2 p-2 bg-[#EEEFEB]/80 backdrop-blur-xl border border-[#1C1D1E]/10 rounded-full shadow-2xl w-full md:w-auto max-w-2xl transition-all duration-300 hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] hover:border-[#1C1D1E]/20">

                {/* Search Icon */}
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[#1C1D1E] text-[#EEEFEB] rounded-full shrink-0 shadow-lg">
                    <Search size={20} strokeWidth={2.5} />
                </div>

                {/* Search Input */}
                <input
                    type="text"
                    placeholder="Search fonts..."
                    value={filters.query || ''}
                    onChange={(e) => handleChange('query', e.target.value)}
                    className="flex-1 w-0 min-w-10 md:min-w-50 bg-transparent border-none outline-none text-[#1C1D1E] font-bold placeholder:text-[#1C1D1E]/40 px-2 md:px-4 text-sm md:text-base"
                />

                {/* Vertical Divider */}
                <div className="w-px h-6 bg-[#1C1D1E]/10 mx-1 hidden md:block"></div>

                {/* Categories Toggle */}
                <button
                    onClick={() => {
                        if (window.innerWidth < 768 && !isCategoriesOpen) setIsSortOpen(false);
                        setIsCategoriesOpen(!isCategoriesOpen);
                    }}
                    className={`
                        group relative flex items-center gap-2 p-2 px-3 md:px-4 h-10 md:h-12 rounded-full transition-all duration-300 font-bold text-sm md:text-base cursor-pointer hover:-translate-y-0.5
                        ${isCategoriesOpen
                            ? "bg-[#1C1D1E] text-[#EEEFEB] shadow-md"
                            : "bg-transparent text-[#1C1D1E] hover:bg-[#1C1D1E]/5"
                        }
                    `}
                >
                    <SlidersHorizontal size={18} strokeWidth={2.5} />
                    <span className="hidden md:inline">Filters</span>
                </button>

                {/* Sort Toggle */}
                <button
                    onClick={() => {
                        if (window.innerWidth < 768 && !isSortOpen) setIsCategoriesOpen(false);
                        setIsSortOpen(!isSortOpen);
                    }}
                    className={`
                        group relative flex items-center gap-1 md:gap-2 p-2 px-3 md:px-4 h-10 md:h-12 rounded-full transition-all duration-300 font-bold text-sm md:text-base cursor-pointer hover:-translate-y-0.5
                        ${isSortOpen
                            ? "bg-[#1C1D1E] text-[#EEEFEB] shadow-md"
                            : "bg-transparent text-[#1C1D1E] hover:bg-[#1C1D1E]/5"
                        }
                    `}
                >
                    <ArrowUpDown size={18} strokeWidth={2.5} className="md:hidden" />
                    <span className="hidden md:inline">{currentSortLabel}</span>
                    <span className={`transform transition-transform duration-300 hidden md:block ${isSortOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {/* View Toggle */}
                {onViewModeChange && (
                    <>
                        <div className="w-px h-6 bg-[#1C1D1E]/10 mx-1 hidden md:block"></div>
                        <div className="flex bg-[#1C1D1E]/5 p-2 rounded-full">
                            <button
                                onClick={() => onViewModeChange('font')}
                                className={`p-2 rounded-full transition-all duration-300 ${viewMode === 'font'
                                    ? 'bg-[#1C1D1E] text-[#EEEFEB] shadow-sm'
                                    : 'text-[#1C1D1E]/60 hover:text-[#1C1D1E] hover:bg-[#1C1D1E]/10'
                                    }`}
                                title="Font View"
                            >
                                <Type size={16} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={() => onViewModeChange('image')}
                                className={`p-2 rounded-full transition-all duration-300 ${viewMode === 'image'
                                    ? 'bg-[#1C1D1E] text-[#EEEFEB] shadow-sm'
                                    : 'text-[#1C1D1E]/60 hover:text-[#1C1D1E] hover:bg-[#1C1D1E]/10'
                                    }`}
                                title="Image View"
                            >
                                <Image size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    </>
                )}

            </div>

            {/* Categories */}
            {isCategoriesOpen && (
                <div className="flex flex-col md:flex-row gap-6 max-h-full overflow-y-auto rounded-4xl bg-[#EEEFEB]/50 backdrop-blur-2xl p-4 md:p-6 mb-5 border border-[#1C1D1E]/30">
                    {CATEGORIES.map((group, groupIndex) => (
                        <div key={groupIndex} className="flex flex-col gap-3">
                            <h3 className="text-md font-black text-[#1C1D1E] uppercase px-1 cursor-default">
                                {group.group}
                            </h3>
                            <div className="flex gap-2 flex-wrap">
                                {group.items.map(cat => {
                                    const isSelected = filters.categories?.includes(cat.id);
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => {
                                                const current = filters.categories || [];
                                                const newCategories = current.includes(cat.id)
                                                    ? current.filter(c => c !== cat.id)
                                                    : [...current, cat.id];
                                                handleChange('categories', newCategories);
                                            }}
                                            className={`
                                                px-3 py-1.5 font-bold rounded-full border text-xs md:text-sm transition-all duration-200 text-left cursor-pointer ${isSelected
                                                    ? "bg-[#1C1D1E] text-[#EEEFEB] border-[#1C1D1E]"
                                                    : "bg-transparent text-[#1C1D1E] border-[#1C1D1E] hover:bg-[#1C1D1E] hover:text-[#EEEFEB] hover:-translate-y-0.5"
                                                }
                                            `}
                                        >
                                            {cat.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Sort Panel */}
            {isSortOpen && (
                <div className="flex flex-col gap-3 rounded-4xl bg-[#EEEFEB]/50 backdrop-blur-2xl p-4 md:p-6 mb-5 border border-[#1C1D1E]/30">
                    <h3 className="text-md font-black text-[#1C1D1E] uppercase px-1 cursor-default">
                        Sort By
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => handleChange('sortBy', opt.id)}
                                className={`
                                    px-3 py-1.5 font-bold rounded-full border text-xs md:text-sm transition-all duration-200 text-left cursor-pointer
                                    ${(filters.sortBy || 'trending') === opt.id
                                        ? "bg-[#1C1D1E] text-[#EEEFEB] border-[#1C1D1E]"
                                        : "bg-transparent text-[#1C1D1E] border-[#1C1D1E] hover:bg-[#1C1D1E] hover:text-[#EEEFEB] hover:-translate-y-0.5"
                                    }
                                `}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
