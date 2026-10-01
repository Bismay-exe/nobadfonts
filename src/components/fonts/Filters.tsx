import {
    Search,
    Type,
    Image,
    SlidersHorizontal,
    ArrowUpDown,
    Maximize2,
    Minimize2,
    Pencil,
    X,
    ChevronDown,
} from "lucide-react";
import type { FontFilterParams } from "../../types/font";
import React, { useState, useRef, useEffect } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Squircle } from "react-ios-corners";

interface FiltersProps {
    filters: FontFilterParams;
    onChange: (filters: FontFilterParams) => void;
    viewMode?: "font" | "image";
    onViewModeChange?: (mode: "font" | "image") => void;
    showExpandToggle?: boolean;
    allExpanded?: boolean;
    onToggleAll?: () => void;
    customText?: string;
    onCustomTextChange?: (text: string) => void;
}

const CATEGORIES = [
    {
        group: "Classification",
        items: [
            { id: "sans", label: "Sans" },
            { id: "serif", label: "Serif" },
            { id: "slab-serif", label: "Slab Serif" },
            { id: "display", label: "Display" },
            { id: "monospace", label: "Mono" },
            { id: "script", label: "Script" },
            { id: "calligraphy", label: "Calligraphy" },
            { id: "brush", label: "Brush" },
            { id: "handwritten", label: "Handwritten" },
            { id: "signature", label: "Signature" },
        ],
    },
    {
        group: "Style",
        items: [
            { id: "modern", label: "Modern" },
            { id: "classic", label: "Classic" },
            { id: "minimal", label: "Minimal" },
            { id: "bold", label: "Bold" },
            { id: "elegant", label: "Elegant" },
            { id: "luxury", label: "Luxury" },
            { id: "playful", label: "Playful" },
            { id: "comic", label: "Comic" },
            { id: "graffiti", label: "Graffiti" },
            { id: "experimental", label: "Experimental" },
            { id: "brutalist", label: "Brutalist" },
            { id: "industrial", label: "Industrial" },
            { id: "editorial", label: "Editorial" },
            { id: "geometric", label: "Geometric" },
            { id: "organic", label: "Organic" },
            { id: "techno", label: "Techno" },
            { id: "sci-fi", label: "Sci-Fi" },
        ],
    },
    {
        group: "Use Case",
        items: [
            { id: "branding", label: "Branding" },
            { id: "logo", label: "Logo" },
            { id: "headline", label: "Headline" },
            { id: "poster", label: "Poster" },
            { id: "editorial-use", label: "Editorial" },
            { id: "corporate", label: "Corporate" },
            { id: "tech", label: "Tech / UI" },
            { id: "social-media", label: "Social Media" },
        ],
    },
    {
        group: "Weight & Shape",
        items: [
            { id: "hairline", label: "Hairline" },
            { id: "thin", label: "Thin" },
            { id: "light", label: "Light" },
            { id: "normal-width", label: "Normal Width" },
            { id: "heavy", label: "Heavy" },
            { id: "tall", label: "Tall" },
            { id: "condensed", label: "Condensed" },
            { id: "wide", label: "Wide" },
            { id: "extended", label: "Extended" },
        ],
    },
    {
        group: "Construction & Features",
        items: [
            { id: "inktrap", label: "Ink Trap" },
            { id: "rounded", label: "Rounded" },
            { id: "square", label: "Square" },
            { id: "sharp", label: "Sharp" },
            { id: "stencil", label: "Stencil" },
            { id: "outline", label: "Outline" },
            { id: "inline", label: "Inline" },
            { id: "pixel", label: "Pixel / Bitmap" },
            { id: "messy", label: "Messy" },
        ],
    },
    {
        group: "Era & Vibe",
        items: [
            { id: "casual", label: "Casual" },
            { id: "retro", label: "Retro" },
            { id: "vintage", label: "Vintage" },
            { id: "cyberpunk", label: "Cyberpunk" },
            { id: "futuristic", label: "Futuristic" },
            { id: "gothic", label: "Gothic" },
            { id: "y2k", label: "Y2K" },
        ],
    },
];

const SORT_OPTIONS = [
    { id: "trending", label: "Trending" },
    { id: "popular", label: "Most Popular" },
    { id: "editor-picks", label: "Editor’s picks" },
    { id: "featured", label: "Featured" },
    { id: "newest", label: "Newest" },
    { id: "alpha", label: "A-Z" },
];

export const Filters = React.memo(
    ({
        filters,
        onChange,
        viewMode,
        onViewModeChange,
        showExpandToggle,
        allExpanded,
        onToggleAll,
        customText,
        onCustomTextChange,
    }: FiltersProps) => {
        const [localQuery, setLocalQuery] = useState(filters.query || "");
        const [localCustomText, setLocalCustomText] = useState(customText || "");

        // Sync local state with props if they change externally (e.g. from URL or clear)
        useEffect(() => {
            setLocalQuery(filters.query || "");
        }, [filters.query]);

        useEffect(() => {
            setLocalCustomText(customText || "");
        }, [customText]);

        const debounceTimerRef = useRef<any>(null);

        const debouncedOnChange = (key: keyof FontFilterParams, value: any) => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                onChange({ ...filters, [key]: value });
            }, 300);
        };

        const handleQueryChange = (value: string) => {
            setLocalQuery(value);
            debouncedOnChange("query", value);
        };

        const handleCustomTextChange = (value: string) => {
            setLocalCustomText(value);
            if (onCustomTextChange) {
                if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = setTimeout(() => {
                    onCustomTextChange(value);
                }, 300);
            }
        };

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

        const togglePanel = (
            setter: React.Dispatch<React.SetStateAction<boolean>>,
            value: boolean,
        ) => {
            closeAllPanels();
            setter(value);
        };

        // Find current label
        const currentSortLabel =
            SORT_OPTIONS.find((opt) => opt.id === (filters.sortBy || "trending"))
                ?.label || "Trending";

        return (
            <div className="fixed bottom-20 inset-x-4 md:bottom-6 lg:bottom-8 lg:inset-auto lg:left-1/2 lg:-translate-x-1/2 flex flex-col-reverse items-center z-50 font-inter-tight">
                {/* Main Filter Dock */}
                {/* <Squircle className='w-full h-full bg-[rgb(var(--color-foreground)/0.05)]' radius={70}></Squircle> */}
                <Squircle
                    radius={40}
                    className="pointer-events-auto bg-[rgb(var(--color-foreground)/0.7)] backdrop-blur-3xl border border-[rgb(var(--color-background)/0.3)] transition-all duration-300"
                >
                    <div className="flex items-center gap-1 lg:gap-2 px-1 py-1 lg:px-2 lg:py-1.5">
                        {/* 1. Search Icon (Toggle on Mobile, Static on Desktop) */}
                        <Squircle
                            radius={40}
                            className={`transition-all duration-300 xl:hiddenz flex
                        ${isSearchOpen && window.innerWidth < 768 ? "bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))]" : "text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-background)/0.2)] bg-[rgb(var(--color-background)/0.1)]"}`}
                        >
                            <button
                                onClick={async () => {
                                    if (window.innerWidth < 768) {
                                        await Haptics.impact({ style: ImpactStyle.Light });
                                        togglePanel(setIsSearchOpen, !isSearchOpen);
                                    }
                                }}
                                className={`xl:hiddenz
                            p-2 px-3 lg:px-4 h-10 lg:h-11 flex items-center justify-center shrink-0
                            `}
                            >
                                <Search size={20} strokeWidth={2.5} />
                            </button>

                            {/* 2. Search Input (Desktop Only) */}
                            <div className="hidden lg:block h-full bg-[rgb(var(--color-background)/0)]">
                                <input
                                    type="text"
                                    placeholder="Search fonts..."
                                    value={localQuery}
                                    onChange={(e) => handleQueryChange(e.target.value)}
                                    className="flex-1 w-0 min-w-40 lg:min-w-64 border-none! outline-none! text-[rgb(var(--color-background))] text-lg font-inter-tight font-medium placeholder:text-[rgb(var(--color-background)/0.5)] px-2 lg:px-4 h-11 selection:text-[rgb(var(--color-accent))]"
                                />
                            </div>
                        </Squircle>

                        {/* Divider (Desktop Only) */}
                        {/* <div className="w-px h-6 bg-[rgb(var(--color-background)/0.1)] mx-1 hidden lg:block"></div> */}

                        {/* 3. Custom Text Toggle (Moved Here) */}
                        {onCustomTextChange && (
                            <Squircle
                                radius={40}
                                className={`transition-all duration-300 ease-in-out
                                    ${isCustomTextOpen || customText
                                        ? "bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))]"
                                        : "text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-background)/0.2)] bg-[rgb(var(--color-background)/0.1)]"
                                    }
                                `}
                            >
                                <button
                                    onClick={async () => {
                                        await Haptics.impact({ style: ImpactStyle.Light });
                                        togglePanel(setIsCustomTextOpen, !isCustomTextOpen);
                                    }}
                                    className={`
                                        group relative flex items-center gap-2 p-2 px-3 lg:px-4 h-10 lg:h-11 font-medium text-sm lg:text-base cursor-pointer
                                    `}
                                    title="Custom Text"
                                >
                                    <Pencil size={18} strokeWidth={2.5} className="lg:hidden" />
                                    <span className="hidden lg:inline whitespace-nowrap">
                                        Custom Text
                                    </span>
                                </button>
                            </Squircle>
                        )}

                        {/* 4. Categories Toggle */}
                        <Squircle
                            radius={40}
                            className={`group transition-all duration-300 cursor-pointer ease-in-out
                                ${isCategoriesOpen
                                    ? "bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))]"
                                    : "text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-background)/0.2)] bg-[rgb(var(--color-background)/0.1)]"
                                }
                            `}
                        >
                            <button
                                onClick={async () => {
                                    await Haptics.impact({ style: ImpactStyle.Light });
                                    togglePanel(setIsCategoriesOpen, !isCategoriesOpen);
                                }}
                                className={`group relative flex items-center gap-2 p-2 px-3 lg:px-4 h-10 lg:h-11 font-medium text-sm lg:text-base cursor-pointer`}
                            >
                                <SlidersHorizontal
                                    size={18}
                                    strokeWidth={2.5}
                                    className="lg:hidden"
                                />
                                <span className="hidden lg:inline">Filters</span>
                            </button>
                        </Squircle>

                        {/* 5. Sort Toggle */}
                        <Squircle
                            radius={40}
                            className={`group transition-all duration-300 cursor-pointer ease-in-out
                                ${isSortOpen
                                    ? "bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))]"
                                    : "text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-background)/0.2)] bg-[rgb(var(--color-background)/0.1)]"
                                }
                            `}
                        >
                            <button
                                onClick={async () => {
                                    await Haptics.impact({ style: ImpactStyle.Light });
                                    togglePanel(setIsSortOpen, !isSortOpen);
                                }}
                                className={`
                                    group relative flex justify-between items-center gap-1 lg:gap-2 p-2 px-3 lg:px-4 h-10 lg:h-11 lg:w-40 font-medium text-sm lg:text-base cursor-pointer
                                `}
                            >
                                <ArrowUpDown
                                    size={18}
                                    strokeWidth={2.5}
                                    className="lg:hidden"
                                />
                                <span className="hidden lg:inline">{currentSortLabel}</span>
                                <span
                                    className={`transform transition-transform duration-300 hidden lg:block ${isSortOpen ? "rotate-180" : ""}`}
                                >
                                    <ChevronDown size={18} strokeWidth={2.5} />
                                </span>
                            </button>
                        </Squircle>

                        {/* 6. View Toggle Group */}
                        {onViewModeChange && (
                            <>
                                {/* <div className="w-px h-6 bg-[rgb(var(--color-background)/0.1)] mx-1 hidden lg:block"></div> */}
                                <Squircle
                                    radius={40}
                                    className="bg-[rgb(var(--color-background)/0.15)]"
                                >
                                    <div className="flex justify-center items-center h-10 xl:h-11 py-1 px-1.5">
                                        <Squircle
                                            radius={40}
                                            onClick={() => {
                                                closeAllPanels();
                                                onViewModeChange("font");
                                            }}
                                            className={`p-2 transition-all duration-300 ${viewMode === "font"
                                                    ? "bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] shadow-sm"
                                                    : "text-[rgb(var(--color-background))] hover:text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-background)/0.1)]"
                                                }`}
                                            title="Font View"
                                        >
                                            <Type size={16} strokeWidth={2.5} />
                                        </Squircle>
                                        <Squircle
                                            radius={40}
                                            onClick={() => {
                                                closeAllPanels();
                                                onViewModeChange("image");
                                            }}
                                            className={`p-2 transition-all duration-300 ${viewMode === "image"
                                                    ? "bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] shadow-sm"
                                                    : "text-[rgb(var(--color-background))] hover:text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-background)/0.1)]"
                                                }`}
                                            title="Image View"
                                        >
                                            <Image size={16} strokeWidth={2.5} />
                                        </Squircle>

                                        {/* Separator & Expand Toggle */}
                                        {showExpandToggle && onToggleAll && (
                                            <>
                                                <div className="w-px h-6 bg-[rgb(var(--color-background)/0.1)] mx-1"></div>
                                                <Squircle
                                                    radius={40}
                                                    onClick={async () => {
                                                        closeAllPanels();
                                                        await Haptics.impact({ style: ImpactStyle.Medium });
                                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                                        onToggleAll();
                                                    }}
                                                    className="p-2 text-[rgb(var(--color-background))] hover:text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-background)/0.1)] transition-all duration-300"
                                                    title={allExpanded ? "Collapse All" : "Expand All"}
                                                >
                                                    {allExpanded ? (
                                                        <Minimize2 size={16} strokeWidth={2.5} />
                                                    ) : (
                                                        <Maximize2 size={16} strokeWidth={2.5} />
                                                    )}
                                                </Squircle>
                                            </>
                                        )}
                                    </div>
                                </Squircle>
                            </>
                        )}
                    </div>
                </Squircle>

                {/* PANELS AREA (Visually Above Dock because of flex-col-reverse) */}

                {/* 1. Search Panel (Mobile Only) */}
                {isSearchOpen && (
                    <Squircle
                        radius={40}
                        className="pointer-events-auto bg-[rgb(var(--color-foreground)/0.8)] backdrop-blur-2xl mb-2 w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                        <div className="flex flex-col gap-1 p-4 w-full max-w-sm">
                            <h3 className="text-xl sm:text-xl md:text-2xl font-medium tracking-wide text-[rgb(var(--color-background)/0.85)] px-3 py-2 cursor-default">
                                Search
                            </h3>
                            <Squircle
                                radius={40}
                                className="bg-[rgb(var(--color-background)/0.1)]"
                            >
                                <div className="flex items-center gap-2 px-4 py-2">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search fonts..."
                                        value={localQuery}
                                        onChange={(e) => handleQueryChange(e.target.value)}
                                        className="bg-transparent border-none! outline-none! text-[rgb(var(--color-background))] text-lg font-inter-tight font-medium placeholder:text-[rgb(var(--color-background)/0.4)] w-full"
                                    />
                                    {localQuery && (
                                        <button
                                            onClick={() => handleQueryChange("")}
                                            className="text-[rgb(var(--color-background)/0.6)]"
                                        >
                                            <X size={16} strokeWidth={3} />
                                        </button>
                                    )}
                                </div>
                            </Squircle>
                        </div>
                    </Squircle>
                )}

                {/* 2. Custom Text Panel */}
                {isCustomTextOpen && onCustomTextChange && (
                    <Squircle
                        radius={40}
                        className="pointer-events-auto bg-[rgb(var(--color-foreground)/0.8)] backdrop-blur-2xl mb-2 w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                        <div className="flex flex-col gap-1 p-4 w-full max-w-sm">
                            <h3 className="text-xl sm:text-xl md:text-2xl font-medium tracking-wide text-[rgb(var(--color-background)/0.85)] px-3 py-2 cursor-default">
                                Your text
                            </h3>
                            <Squircle
                                radius={40}
                                className="bg-[rgb(var(--color-background)/0.1)]"
                            >
                                <div className="flex items-center gap-2 px-4 py-2">
                                    <input
                                        ref={customTextInputRef}
                                        type="text"
                                        placeholder="Type something..."
                                        value={localCustomText}
                                        onChange={(e) => handleCustomTextChange(e.target.value)}
                                        className="bg-transparent border-none! outline-none! text-[rgb(var(--color-background))] text-lg font-inter-tight font-medium placeholder:text-[rgb(var(--color-background)/0.4)] w-full"
                                    />
                                    {localCustomText && (
                                        <button
                                            onClick={() => handleCustomTextChange("")}
                                            className="text-[rgb(var(--color-background)/0.6)] hover:text-[rgb(var(--color-background))]"
                                        >
                                            <X size={16} strokeWidth={3} />
                                        </button>
                                    )}
                                </div>
                            </Squircle>
                        </div>
                    </Squircle>
                )}

                {/* 3. Categories Panel */}
                {isCategoriesOpen && (
                    <Squircle
                        radius={80}
                        className="max-h-[67vh] overflow-y-auto bg-[rgb(var(--color-foreground)/0.8)] backdrop-blur-2xl mb-2"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-6 p-4 lg:p-6">
                            {CATEGORIES.map((group, groupIndex) => (
                                <div key={groupIndex} className="flex flex-col gap-0 md:gap-3">
                                    <h3 className="text-xl sm:text-xl md:text-2xl font-medium tracking-wide text-[rgb(var(--color-background)/0.85)] px-3 py-2 cursor-default">
                                        {group.group}
                                    </h3>
                                    <div className="flex gap-1.5 md:gap-2 flex-wrap">
                                        {group.items.map((cat) => {
                                            const isSelected = filters.categories?.includes(cat.id);
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = filters.categories || [];
                                                        const newCategories = current.includes(cat.id)
                                                            ? current.filter((c) => c !== cat.id)
                                                            : [...current, cat.id];
                                                        handleChange("categories", newCategories);
                                                    }}
                                                    className={`
                                                px-3 py-1.5 md:px-3 md:py-2 font-medium rounded-full zborder text-[14px] md:text-sm whitespace-nowrap transition-all duration-200 text-left cursor-pointer ${isSelected
                                                            ? "bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] border-[rgb(var(--color-background)/0.1)]"
                                                            : "bg-[rgb(var(--color-background)/0.05)] text-[rgb(var(--color-background)/0.8)] border-[rgb(var(--color-background)/0.1)] hover:bg-[rgb(var(--color-background)/0.1)] zhover:text-[rgb(var(--color-foreground))]"
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
                    </Squircle>
                )}

                {/* 4. Sort Panel */}
                {isSortOpen && (
                    <Squircle
                        radius={40}
                        className="w-45 mb-2 ml-0 lg:ml-102 bg-[rgb(var(--color-foreground)/0.8)] backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                        <div className="flex flex-col zitems-center gap-2 px-4 py-4 lg:px-4 lg:py-4">
                            <h3 className="w-full text-xl sm:text-xl md:text-2xl font-medium tracking-wide text-[rgb(var(--color-background)/0.85)] px-3 py-2 cursor-default">
                                Sort By
                            </h3>
                            <div className="flex flex-col gap-1">
                                {SORT_OPTIONS.map((opt) => (
                                    <Squircle radius={40} className="w-full">
                                        <button
                                            key={opt.id}
                                            onClick={() => handleChange("sortBy", opt.id)}
                                            className={`
                                    w-full px-4 py-3 text-left text-sm transition-all duration-300 tracking-wider
                                    ${(filters.sortBy || "trending") === opt.id
                                                    ? "bg-[rgb(var(--color-background)/0.9)] text-[rgb(var(--color-foreground))]"
                                                    : "bg-transparent text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-background)/0.05)] hover:text-[rgb(var(--color-background))]"
                                                }
                                `}
                                        >
                                            {opt.label}
                                        </button>
                                    </Squircle>
                                ))}
                            </div>
                        </div>
                    </Squircle>
                )}
            </div>
        );
    },
);

export default Filters;
