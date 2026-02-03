import { Search, Type, Image, SlidersHorizontal } from 'lucide-react';
import type { FontFilterParams } from '../../types/font';
import { useState } from 'react';

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
        <div className="flex flex-col">

            {/* View Toggle */}
            {onViewModeChange && (
                <div className="
                    fixed bottom-4 right-4 z-999
                    flex bg-white h-11 p-1 w-auto rounded-full border border-gray-700 shadow-black shadow-[0px_10px_60px_0px_rgba(0,0,0,0.25)]">
                    <button
                        onClick={() => onViewModeChange('font')}
                        className={`p-2 aspect-square rounded-full transition-all cursor-pointer ${viewMode === 'font'
                            ? 'bg-[#BDF522] text-black shadow-sma border border-gray-400'
                            : 'text-gray-500 hover:text-[#94ca00]'
                            }`}
                        title="Font View"
                    >
                        <Type size={16} />
                    </button>
                    <button
                        onClick={() => onViewModeChange('image')}
                        className={`p-2 aspect-square rounded-full transition-all cursor-pointer ${viewMode === 'image'
                            ? 'bg-[#FF90E8] text-black shadow-sm border border-gray-400'
                            : 'text-gray-500 hover:text-[#ff00cc]'
                            }`}
                        title="Image View"
                    >
                        <Image size={16} />
                    </button>
                </div>
            )}

            {/* Search and Categories button */}
            <div className='flex flex-col md:flex-row gap-2 rounded-3xl bg-[#ffffff] p-4 md:p-6 border-b md:border-b-0 md:border-t-2 border-black'>
                <div className='w-full flex gap-2'>
                    {/* Search */}
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Search fonts..."
                            value={filters.query || ''}
                            onChange={(e) => handleChange('query', e.target.value)}
                            className="w-full md:w-100 lg:w-180 pl-10 pr-4 py-2 border border-gray-400 bg-white/90 rounded-full focus:outline-none focus:ring-2 focus:ring-[#87DB21] focus:border-transparent transition-all"
                        />
                        <Search className="absolute left-3 top-3 text-gray-900" size={18} />
                    </div>
                    <div>
                        <button
                            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                            className={`
                                p-2 aspect-square rounded-full transition-all border border-gray-700 cursor-pointer
                                ${isCategoriesOpen
                                    ? "bg-black text-white"
                                    : "bg-white/90 text-gray-900 hover:bg-black/20"
                                }
                            `}
                            title="Toggle Categories"
                        >
                            <SlidersHorizontal size={20} />
                        </button>
                    </div>

                </div>


                {/* Sort */}
                <div className='flex flex-col justify-end md:items-end gap-2 relative z-50'>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="w-full md:w-52 px-4 py-2 flex justify-between items-center border border-gray-700 bg-white/90 rounded-full focus:outline-none focus:ring-2 focus:ring-[#87DB21] transition-all font-bold cursor-pointer"
                        >
                            <span>{currentSortLabel}</span>
                            <span className={`transform transition-transform ${isSortOpen ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                    </div>

                    {/* Dropdown Menu */}
                    <div
                        className={`
                            w-full md:w-52
                            overflow-hidden
                            transition-all
                            duration-400
                            ease-linear
                            ${isSortOpen ? 'max-h-100 opacity-100 mb-0' : 'max-h-0 -mb-2 opacity-100 scale-0 pointer-events-none'}
                        `}
                    >
                        <div className="overflow-hidden flex flex-col gap-1">
                            {SORT_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        handleChange('sortBy', opt.id);
                                        setIsSortOpen(false);
                                    }}
                                    className={`
                                        text-left px-4 py-2 rounded-full border border-black font-bold transition-colors cursor-pointer
                                        ${filters.sortBy === opt.id
                                            ? 'bg-black text-white'
                                            : 'hover:bg-gray-100 text-gray-700'
                                        }
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Categories */}
            {isCategoriesOpen && (
                <div className="flex flex-col md:flex-row gap-6 max-h-full overflow-y-auto rounded-3xl bg-[#ffffff] p-4 md:p-6 border-t md:border-b border-black">
                    {CATEGORIES.map((group, groupIndex) => (
                        <div key={groupIndex} className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1 cursor-default">
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
                                                px-3 py-1.5 font-bold rounded-full border-2 text-xs md:text-sm transition-all duration-200 text-left cursor-pointer
                                                ${isSelected
                                                    ? "bg-[#87DB21] text-black border-black shadow-md"
                                                    : "bg-white/30 text-black/80 border-black hover:border-black hover:text-black hover:-translate-y-0.5"
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
        </div>
    );
}
