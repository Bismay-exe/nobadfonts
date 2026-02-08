import { Search, Type, Image, SlidersHorizontal } from 'lucide-react';
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
        <>
            {/* View Toggle */}
            {onViewModeChange && (
                <div className="
                    fixed bottom-4 right-4 z-999
                    flex bg-[#EEEFEB]/50 backdrop-blur-xl h-11 p-1 w-auto rounded-full border border-[#1C1D1E] shadow-black shadow-[0px_10px_60px_0px_rgba(0,0,0,0.25)] transition-transform ">
                    <button
                        onClick={() => onViewModeChange('font')}
                        className={`p-2 aspect-square rounded-full transition-all cursor-pointer ${viewMode === 'font'
                            ? 'bg-black text-white shadow-sma border border-black'
                            : 'text-black hover:text-white'
                            }`}
                        title="Font View"
                    >
                        <Type size={16} />
                    </button>
                    <button
                        onClick={() => onViewModeChange('image')}
                        className={`p-2 aspect-square rounded-full transition-all cursor-pointer ${viewMode === 'image'
                            ? 'bg-black text-white shadow-sm border border-black'
                            : 'text-black hover:text-white'
                            }`}
                        title="Image View"
                    >
                        <Image size={16} />
                    </button>
                </div>
            )}


            <div className="fixed bottom-8 inset-auto md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col-reverse z-100">

                {/* Search and Categories button */}
                <div className='flex flex-row md:flex-row gap-2 p-1 rounded-2xl md:rounded-3xl bg-black/30 backdrop-blur-xl border-2 border-[#1C1D1E]/20'>
                    <div className='w-full flex gap-2'>
                        {/* Search */}
                        <div className="relative w-14 h-14 md:w-23 md:h-23 flex justify-center items-center bg-[#1C1D1E] p-2 md:p-8 rounded-2xl md:rounded-3xl">
                            <img src={White} alt="" className='w-1/2 h-1/2 absolute object-contain animate-spin-slow' />
                            <Search className="text-[#EEEFEB] opacity-0" size={28} />
                        </div>
                        <div className='w-30 h-14 md:w-full md:h-23 transition-all duration-300 ease-in-out'>
                            <input
                                type="text"
                                placeholder="Search fonts..."
                                value={filters.query || ''}
                                onChange={(e) => handleChange('query', e.target.value)}
                                className="w-full h-full pl-2 md:pl-5 border border-[#1C1D1E]/10 bg-[#EEEFEB] rounded-2xl md:rounded-3xl focus:outline-none focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <button
                                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                className={`w-14 h-14 md:w-23 md:h-23 flex justify-center items-center
                                    p-2 aspect-square rounded-2xl md:rounded-3xl transition-all border border-[#1C1D1E]/10 cursor-pointer
                                    ${isCategoriesOpen
                                        ? "bg-[#1C1D1E] text-[#EEEFEB]"
                                        : "bg-[#EEEFEB] text-[#1C1D1E] hover:bg-black/20"
                                    }
                                `}
                                title="Toggle Categories"
                            >
                                <SlidersHorizontal size={20} />
                            </button>
                        </div>

                    </div>


                    {/* Sort */}
                    <div className='flex flex-col justify-end items-end gap-2 relative w-auto md:w-auto z-50'>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="w-14 h-14 md:w-23 md:h-23 aspect-square px-4 py-2 flex justify-center gap-1 items-center border border-[#1C1D1E] bg-[#1C1D1E] text-[#EEEFEB] rounded-2xl md:rounded-3xl focus:outline-none transition-all font-bold cursor-pointer"
                            >
                                <span className="hidden md:block">SORT</span>
                                <span className="hidden">{currentSortLabel}</span>
                                <span className={`transform transition-transform ${isSortOpen ? 'rotate-180' : ''}`}>▼</span>
                            </button>
                        </div>
                    </div>
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
                                                    px-3 py-1.5 font-bold rounded-full border text-xs md:text-sm transition-all duration-200 text-left cursor-pointer
                                                    ${isSelected
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
        </>
    );
}
