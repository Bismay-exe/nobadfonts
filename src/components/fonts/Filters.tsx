import { Search, Type, Image, SlidersHorizontal, ArrowUpDown, Maximize2, Minimize2, Pencil, X } from 'lucide-react';
import type { FontFilterParams } from '../../types/font';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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
            { id: 'sans', label: 'Sans' },
            { id: 'serif', label: 'Serif' },
            { id: 'slab-serif', label: 'Slab Serif' },
            { id: 'display', label: 'Display' },
            { id: 'monospace', label: 'Monospace' },
            { id: 'script', label: 'Script' },
            { id: 'calligraphy', label: 'Calligraphy' },
            { id: 'brush', label: 'Brush' },
            { id: 'handwritten', label: 'Handwritten' },
            { id: 'signature', label: 'Signature' }
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
            { id: 'tech', label: 'Tech / UI' },
            { id: "social-media", label: "Social Media" }
        ],
    },

    {
        group: 'Weight & Shape',
        items: [
            { id: "hairline", label: "Hairline" },
            { id: 'light', label: 'Light' },
            { id: "normal-width", label: "Normal Width" },
            { id: 'heavy', label: 'Heavy' },
            { id: 'tall', label: 'Tall' },
            { id: 'condensed', label: 'Condensed' },
            { id: 'wide', label: 'Wide' },
            { id: "extended", label: "Extended" },
        ],
    },

    {
        group: "Construction & Features",
        items: [
            { id: "inktrap", label: "Ink Trap" },
            { id: "rounded", label: "Rounded" },
            { id: "square", label: "Square" },
            { id: "stencil", label: "Stencil" },
            { id: "outline", label: "Outline" },
            { id: "inline", label: "Inline" },
            { id: "pixel", label: "Pixel / Bitmap" },
            { id: "messy", label: "Messy" }
        ]
    },

    {
        group: 'Era & Vibe',
        items: [
            { id: 'casual', label: 'Casual' },
            { id: 'retro', label: 'Retro' },
            { id: 'vintage', label: 'Vintage' },
            { id: 'cyberpunk', label: 'Cyberpunk' },
            { id: 'futuristic', label: 'Futuristic' },
            { id: 'gothic', label: 'Gothic' },
            { id: 'y2k', label: 'Y2K' }
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
        <div className="fixed bottom-20 inset-x-4 md:bottom-6 lg:bottom-8 lg:inset-auto lg:left-1/2 lg:-translate-x-1/2 flex flex-col-reverse items-center z-50">

            {/* Main Filter Dock */}
            <div className="pointer-events-auto flex items-center gap-1 lg:gap-2 p-1 lg:p-2 bg-[rgb(var(--color-foreground)/0.8)]  backdrop-blur-xl border border-[rgb(var(--color-background)/0.3)] rounded-full shadow-2xl w-auto max-w-full transition-all duration-300 hover:shadow-[0_20px_40px_-5px_rgba(var(--color-background),0.1)]">

                {/* 1. Search Icon (Toggle on Mobile, Static on Desktop) */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                        if (window.innerWidth < 768) {
                            await Haptics.impact({ style: ImpactStyle.Light });
                            togglePanel(setIsSearchOpen, !isSearchOpen);
                        }
                    }}
                    className={`
                        w-12 h-12 flex items-center justify-center rounded-full shrink-0 transition-all duration-300
                        ${isSearchOpen && window.innerWidth < 768 ? 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))]' : 'bg-transparent text-[rgb(var(--color-background))]'}
                    `}
                >
                    <Search size={20} strokeWidth={2.5} />
                </motion.button>

                {/* 2. Search Input (Desktop Only) */}
                <input
                    type="text"
                    placeholder="Search fonts..."
                    value={filters.query || ''}
                    onChange={(e) => handleChange('query', e.target.value)}
                    className="hidden lg:block flex-1 w-0 min-w-40 lg:min-w-64 bg-transparent border-none outline-none text-[rgb(var(--color-background))] font-medium placeholder:text-[rgb(var(--color-background)/0.5)] px-2 lg:px-4 text-sm lg:text-base"
                />

                {/* Divider (Desktop Only) */}
                <div className="w-px h-6 bg-[rgb(var(--color-background)/0.1)] mx-1 hidden lg:block"></div>

                {/* 3. Custom Text Toggle (Moved Here) */}
                {onCustomTextChange && (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                            await Haptics.impact({ style: ImpactStyle.Light });
                            togglePanel(setIsCustomTextOpen, !isCustomTextOpen);
                        }}
                        className={`
                            group relative flex items-center gap-2 p-2 px-3 lg:px-4 h-10 lg:h-11 rounded-full transition-all duration-300 font-medium text-sm lg:text-base cursor-pointer
                            ${isCustomTextOpen || customText
                                ? "bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] shadow-md"
                                : "bg-transparent text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-background)/0.1)]"
                            }
                        `}
                        title="Custom Text"
                    >
                        <Pencil size={18} strokeWidth={2.5} />
                        <span className="hidden lg:inline whitespace-nowrap">Custom Text</span>
                    </motion.button>
                )}


                {/* 4. Categories Toggle */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                        await Haptics.impact({ style: ImpactStyle.Light });
                        togglePanel(setIsCategoriesOpen, !isCategoriesOpen);
                    }}
                    className={`
                        group relative flex items-center gap-2 p-2 px-3 lg:px-4 h-10 lg:h-11 rounded-full transition-all duration-300 font-medium text-sm lg:text-base cursor-pointer
                        ${isCategoriesOpen
                            ? "bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] shadow-md"
                            : "bg-transparent text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-background)/0.1)]"
                        }
                    `}
                >
                    <SlidersHorizontal size={18} strokeWidth={2.5} />
                    <span className="hidden lg:inline">Filters</span>
                </motion.button>

                {/* 5. Sort Toggle */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                        await Haptics.impact({ style: ImpactStyle.Light });
                        togglePanel(setIsSortOpen, !isSortOpen);
                    }}
                    className={`
                        group relative flex items-center gap-1 lg:gap-2 p-2 px-3 lg:px-4 h-10 lg:h-11 rounded-full transition-all duration-300 font-medium text-sm lg:text-base cursor-pointer
                        ${isSortOpen
                            ? "bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] shadow-md"
                            : "bg-transparent text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-background)/0.1)]"
                        }
                    `}
                >
                    <ArrowUpDown size={18} strokeWidth={2.5} className="lg:hidden" />
                    <span className="hidden lg:inline">{currentSortLabel}</span>
                    <span className={`transform transition-transform duration-300 hidden lg:block ${isSortOpen ? 'rotate-180' : ''}`}>▼</span>
                </motion.button>

                {/* 6. View Toggle Group */}
                {onViewModeChange && (
                    <>
                        <div className="w-px h-6 bg-[rgb(var(--color-background)/0.1)] mx-1 hidden lg:block"></div>
                        <div className="flex bg-[rgb(var(--color-background)/0.15)] h-11 p-1.5 rounded-full">
                            <button
                                onClick={() => {
                                    closeAllPanels();
                                    onViewModeChange('font');
                                }}
                                className={`p-2 rounded-full transition-all duration-300 ${viewMode === 'font'
                                    ? 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] shadow-sm'
                                    : 'text-[rgb(var(--color-background))] hover:text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-background)/0.1)]'
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
                                    ? 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] shadow-sm'
                                    : 'text-[rgb(var(--color-background))] hover:text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-background)/0.1)]'
                                    }`}
                                title="Image View"
                            >
                                <Image size={16} strokeWidth={2.5} />
                            </button>

                            {/* Separator & Expand Toggle */}
                            {showExpandToggle && onToggleAll && (
                                <>
                                    <div className="w-px h-6 bg-[rgb(var(--color-background)/0.1)] mx-1"></div>
                                    <button
                                        onClick={() => {
                                            closeAllPanels();
                                            onToggleAll();
                                        }}
                                        className="p-2 rounded-full text-[rgb(var(--color-background))] hover:text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-background)/0.1)] transition-all duration-300"
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
                <div className="pointer-events-auto flex flex-col gap-3 rounded-4xl bg-[rgb(var(--color-foreground)/0.8)] backdrop-blur-2xl p-4 mb-5 border border-[rgb(var(--color-background)/0.8)] w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-md font-black text-[rgb(var(--color-background))] uppercase px-1 cursor-default">
                        Search
                    </h3>
                    <div className="flex items-center gap-2 bg-[rgb(var(--color-background)/0.1)] rounded-full px-4 py-2">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search fonts..."
                            value={filters.query || ''}
                            onChange={(e) => handleChange('query', e.target.value)}
                            className="bg-transparent border-none outline-none text-[rgb(var(--color-background))] font-bold placeholder:text-[rgb(var(--color-background)/0.4)] w-full"
                        />
                        {filters.query && (
                            <button onClick={() => handleChange('query', '')} className="text-[rgb(var(--color-background)/0.6)]">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* 2. Custom Text Panel */}
            {isCustomTextOpen && onCustomTextChange && (
                <div className="pointer-events-auto flex flex-col gap-3 rounded-4xl bg-[rgb(var(--color-foreground)/0.8)] backdrop-blur-2xl p-4 mb-5 border border-[rgb(var(--color-background)/0.8)] w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-md font-black text-[rgb(var(--color-background))] uppercase px-1 cursor-default">
                        Custom Text
                    </h3>
                    <div className="flex items-center gap-2 bg-[rgb(var(--color-background)/0.1)] rounded-full px-4 py-2">
                        <input
                            ref={customTextInputRef}
                            type="text"
                            placeholder="Type something..."
                            value={customText || ''}
                            onChange={(e) => onCustomTextChange(e.target.value)}
                            className="bg-transparent border-none outline-none text-[rgb(var(--color-background))] font-bold placeholder:text-[rgb(var(--color-background)/0.4)] w-full"
                        />
                        {customText && (
                            <button
                                onClick={() => onCustomTextChange('')}
                                className="text-[rgb(var(--color-background)/0.6)] hover:text-[rgb(var(--color-background))]"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* 3. Categories Panel */}
            {isCategoriesOpen && (
                <div className="grid grid-cols-2 md:flex md:flex-row gap-6 max-h-[67vh] overflow-y-auto rounded-4xl bg-[rgb(var(--color-foreground)/0.8)] backdrop-blur-2xl p-4 lg:p-6 mb-5 border border-[rgb(var(--color-background)/0.8)]">
                    {CATEGORIES.map((group, groupIndex) => (
                        <div key={groupIndex} className="flex flex-col gap-2 md:gap-3">
                            <h3 className="text-xs md:text-md font-black text-[rgb(var(--color-background)/0.85)] uppercase px-1 cursor-default">
                                {group.group}
                            </h3>
                            <div className="flex gap-1 md:gap-2 flex-wrap">
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
                                                px-2 py-1 md:px-3 md:py-1.5 font-bold rounded-full border text-[11px] md:text-sm transition-all duration-200 text-left cursor-pointer ${isSelected
                                                    ? "bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] border-[rgb(var(--color-background)/0.1)]"
                                                    : "bg-transparent text-[rgb(var(--color-background))] border-[rgb(var(--color-background)/0.1)] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-foreground))]"
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
                <div className="flex flex-col gap-3 rounded-4xl bg-[rgb(var(--color-foreground)/0.8)] backdrop-blur-2xl p-4 lg:p-6 mb-5 ml-0 lg:ml-110 border border-[rgb(var(--color-background)/0.8)] w-full max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-md px-3 font-black text-[rgb(var(--color-background))] uppercase cursor-default">
                        Sort By
                    </h3>
                    <div className="flex flex-col gap-1">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => handleChange('sortBy', opt.id)}
                                className={`
                                    w-full px-4 py-3 rounded-xl text-left text-sm border transition-all duration-200
                                    ${(filters.sortBy || 'trending') === opt.id
                                        ? "bg-[rgb(var(--color-background)/0.9)] text-[rgb(var(--color-background))] border-[rgb(var(--color-background)/0.1)]"
                                        : "bg-transparent text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-background)/0.05)] hover:text-[rgb(var(--color-background))] border-transparent"
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
