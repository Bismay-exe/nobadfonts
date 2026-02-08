import { Search, Type, Image, SlidersHorizontal, ArrowUpDown, Maximize2, Minimize2, Pencil, X } from 'lucide-react';
import type { FontFilterParams } from '../../types/font';
import { useState, useRef, useEffect } from 'react';

interface FiltersProps {
    filters: FontFilterParams;
    onChange: (filters: FontFilterParams) => void;
    viewMode?: 'font' | 'image';
    onViewModeChange?: (mode: 'font' | 'image') => void;
    showExpandToggle?: boolean;
    allExpanded?: boolean;
    onToggleAll?: () => void;
    customText?: string;
    onCustomTextChange?: (text: string) => void;
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

export default function Filters({ filters, onChange, viewMode, onViewModeChange, showExpandToggle, allExpanded, onToggleAll, customText, onCustomTextChange }: FiltersProps) {
    const handleChange = (key: keyof FontFilterParams, value: any) => {
        onChange({ ...filters, [key]: value });
    };

    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [isCustomTextOpen, setIsCustomTextOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const customTextInputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when opened
    useEffect(() => {
        if (isCustomTextOpen && customTextInputRef.current) {
            customTextInputRef.current.focus();
        }
    }, [isCustomTextOpen]);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    const closeAllPanels = () => {
        setIsSortOpen(false);
        setIsCategoriesOpen(false);
        setIsCustomTextOpen(false);
        setIsSearchOpen(false);
    };

    const togglePanel = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
        closeAllPanels();
        setter(value);
    };

    // Find current label
    const currentSortLabel = SORT_OPTIONS.find(opt => opt.id === (filters.sortBy || 'trending'))?.label || 'Trending';

    return (
        <div className="fixed bottom-8 inset-x-4 lg:bottom-18 lg:inset-auto lg:left-1/2 lg:-translate-x-1/2 flex flex-col-reverse items-center z-50">

            {/* Main Filter Dock */}
            <div className="pointer-events-auto flex items-center gap-1 lg:gap-2 p-1 lg:p-2 bg-[#EEEFEB]/80 backdrop-blur-xl border border-[#1C1D1E]/10 rounded-full shadow-2xl w-auto max-w-full transition-all duration-300 hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] hover:border-[#1C1D1E]/20">

                {/* 1. Search Icon (Toggle on Mobile, Static on Desktop) */}
                <button
                    onClick={() => {
                        if (window.innerWidth < 768) togglePanel(setIsSearchOpen, !isSearchOpen);
                    }}
                    className={`
                        w-12 h-12 flex items-center justify-center rounded-full shrink-0 shadow-lg transition-all duration-300
                        ${isSearchOpen && window.innerWidth < 768 ? 'bg-[#1C1D1E] text-[#EEEFEB]' : 'bg-[#1C1D1E] text-[#EEEFEB]'}
                    `}
                >
                    <Search size={20} strokeWidth={2.5} />
                </button>

                {/* 2. Search Input (Desktop Only) */}
                <input
                    type="text"
                    placeholder="Search fonts..."
                    value={filters.query || ''}
                    onChange={(e) => handleChange('query', e.target.value)}
                    className="hidden lg:block flex-1 w-0 min-w-40 lg:min-w-64 bg-transparent border-none outline-none text-[#1C1D1E] font-bold placeholder:text-[#1C1D1E]/40 px-2 lg:px-4 text-sm lg:text-base"
                />

                {/* Divider (Desktop Only) */}
                <div className="w-px h-6 bg-[#1C1D1E]/10 mx-1 hidden lg:block"></div>

                {/* 3. Custom Text Toggle (Moved Here) */}
                {onCustomTextChange && (
                    <button
                        onClick={() => togglePanel(setIsCustomTextOpen, !isCustomTextOpen)}
                        className={`
                            group relative flex items-center gap-2 p-2 px-3 lg:px-4 h-10 lg:h-12 rounded-full transition-all duration-300 font-bold text-sm lg:text-base cursor-pointer
                            ${isCustomTextOpen || customText
                                ? "bg-[#1C1D1E] text-[#EEEFEB] shadow-md"
                                : "bg-[#1C1D1E]/5 text-[#1C1D1E] hover:bg-[#1C1D1E]/10"
                            }
                        `}
                        title="Custom Text"
                    >
                        <Pencil size={18} strokeWidth={2.5} />
                        <span className="hidden lg:inline whitespace-nowrap">Custom Text</span>
                    </button>
                )}


                {/* 4. Categories Toggle */}
                <button
                    onClick={() => togglePanel(setIsCategoriesOpen, !isCategoriesOpen)}
                    className={`
                        group relative flex items-center gap-2 p-2 px-3 lg:px-4 h-10 lg:h-12 rounded-full transition-all duration-300 font-bold text-sm lg:text-base cursor-pointer
                        ${isCategoriesOpen
                            ? "bg-[#1C1D1E] text-[#EEEFEB] shadow-md"
                            : "bg-[#1C1D1E]/5 text-[#1C1D1E] hover:bg-[#1C1D1E]/10"
                        }
                    `}
                >
                    <SlidersHorizontal size={18} strokeWidth={2.5} />
                    <span className="hidden lg:inline">Filters</span>
                </button>

                {/* 5. Sort Toggle */}
                <button
                    onClick={() => togglePanel(setIsSortOpen, !isSortOpen)}
                    className={`
                        group relative flex items-center gap-1 lg:gap-2 p-2 px-3 lg:px-4 h-10 lg:h-12 rounded-full transition-all duration-300 font-bold text-sm lg:text-base cursor-pointer
                        ${isSortOpen
                            ? "bg-[#1C1D1E] text-[#EEEFEB] shadow-md"
                            : "bg-[#1C1D1E]/5 text-[#1C1D1E] hover:bg-[#1C1D1E]/10"
                        }
                    `}
                >
                    <ArrowUpDown size={18} strokeWidth={2.5} className="lg:hidden" />
                    <span className="hidden lg:inline">{currentSortLabel}</span>
                    <span className={`transform transition-transform duration-300 hidden lg:block ${isSortOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {/* 6. View Toggle Group */}
                {onViewModeChange && (
                    <>
                        <div className="w-px h-6 bg-[#1C1D1E]/10 mx-1 hidden lg:block"></div>
                        <div className="flex bg-[#1C1D1E]/5 p-2 rounded-full">
                            <button
                                onClick={() => {
                                    closeAllPanels();
                                    onViewModeChange('font');
                                }}
                                className={`p-2 rounded-full transition-all duration-300 ${viewMode === 'font'
                                    ? 'bg-[#1C1D1E] text-[#EEEFEB] shadow-sm'
                                    : 'text-[#1C1D1E]/60 hover:text-[#1C1D1E] hover:bg-[#1C1D1E]/10'
                                    }`}
                                title="Font View"
                            >
                                <Type size={16} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={() => {
                                    closeAllPanels();
                                    onViewModeChange('image');
                                }}
                                className={`p-2 rounded-full transition-all duration-300 ${viewMode === 'image'
                                    ? 'bg-[#1C1D1E] text-[#EEEFEB] shadow-sm'
                                    : 'text-[#1C1D1E]/60 hover:text-[#1C1D1E] hover:bg-[#1C1D1E]/10'
                                    }`}
                                title="Image View"
                            >
                                <Image size={16} strokeWidth={2.5} />
                            </button>

                            {/* Separator & Expand Toggle */}
                            {showExpandToggle && onToggleAll && (
                                <>
                                    <div className="w-px h-6 bg-[#1C1D1E]/10 mx-1"></div>
                                    <button
                                        onClick={() => {
                                            closeAllPanels();
                                            onToggleAll();
                                        }}
                                        className="p-2 rounded-full text-[#1C1D1E]/60 hover:text-[#1C1D1E] hover:bg-[#1C1D1E]/10 transition-all duration-300"
                                        title={allExpanded ? "Collapse All" : "Expand All"}
                                    >
                                        {allExpanded ? (
                                            <Minimize2 size={16} strokeWidth={2.5} />
                                        ) : (
                                            <Maximize2 size={16} strokeWidth={2.5} />
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* PANELS AREA (Visually Above Dock because of flex-col-reverse) */}

            {/* 1. Search Panel (Mobile Only) */}
            {isSearchOpen && (
                <div className="pointer-events-auto flex flex-col gap-3 rounded-4xl bg-[#EEEFEB]/50 backdrop-blur-2xl p-4 mb-5 border border-[#1C1D1E]/10 w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-md font-black text-[#1C1D1E] uppercase px-1 cursor-default">
                        Search
                    </h3>
                    <div className="flex items-center gap-2 bg-[#1C1D1E]/10 rounded-full px-4 py-2">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search fonts..."
                            value={filters.query || ''}
                            onChange={(e) => handleChange('query', e.target.value)}
                            className="bg-transparent border-none outline-none text-[#1C1D1E] font-bold placeholder:text-[#1C1D1E]/40 w-full"
                        />
                        {filters.query && (
                            <button onClick={() => handleChange('query', '')} className="text-[#1C1D1E]/60">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* 2. Custom Text Panel */}
            {isCustomTextOpen && onCustomTextChange && (
                <div className="pointer-events-auto flex flex-col gap-3 rounded-4xl bg-[#EEEFEB]/50 backdrop-blur-2xl p-4 mb-5 border border-[#1C1D1E]/30 w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-md font-black text-[#1C1D1E] uppercase px-1 cursor-default">
                        Custom Text
                    </h3>
                    <div className="flex items-center gap-2 bg-[#1C1D1E]/10 rounded-full px-4 py-2">
                        <input
                            ref={customTextInputRef}
                            type="text"
                            placeholder="Type something..."
                            value={customText || ''}
                            onChange={(e) => onCustomTextChange(e.target.value)}
                            className="bg-transparent border-none outline-none text-[#1C1D1E] font-bold placeholder:text-[#1C1D1E]/40 w-full"
                        />
                        {customText && (
                            <button
                                onClick={() => onCustomTextChange('')}
                                className="text-[#1C1D1E]/60 hover:text-[#1C1D1E]"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* 3. Categories Panel */}
            {isCategoriesOpen && (
                <div className="flex flex-col lg:flex-row gap-6 max-h-full overflow-y-auto rounded-4xl bg-[#EEEFEB]/50 backdrop-blur-2xl p-4 lg:p-6 mb-5 border border-[#1C1D1E]/30">
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
                                                px-3 py-1.5 font-bold rounded-full border text-xs lg:text-sm transition-all duration-200 text-left cursor-pointer ${isSelected
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

            {/* 4. Sort Panel */}
            {isSortOpen && (
                <div className="flex flex-col gap-3 rounded-4xl bg-[#EEEFEB]/50 backdrop-blur-2xl p-4 lg:p-6 mb-5 border border-[#1C1D1E]/30">
                    <h3 className="text-md font-black text-[#1C1D1E] uppercase px-1 cursor-default">
                        Sort By
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => handleChange('sortBy', opt.id)}
                                className={`
                                    px-3 py-1.5 font-bold rounded-full border text-xs lg:text-sm transition-all duration-200 text-left cursor-pointer
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
