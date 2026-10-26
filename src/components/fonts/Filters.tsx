import {
    Search,
    SlidersHorizontal,
    ArrowUpDown,
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
            <div className="fixed bottom-8 inset-x-4 md:bottom-8 lg:bottom-8 lg:inset-auto lg:left-1/2 lg:-translate-x-1/2 flex flex-col-reverse items-center z-50 font-inter-tight">
                {/* Main Filter Dock */}
                {/* <Squircle className='w-full h-full bg-foreground/5' radius={70}></Squircle> */}
                <Squircle
                    radius={40}
                    className="pointer-events-auto bg-foreground zrounded-[20px] transition-all duration-300"
                >
                    <div className="flex items-center gap-1 lg:gap-2 px-1 py-1 lg:px-2 lg:py-1.5">
                        {/* 1. Search Icon (Toggle on Mobile, Static on Desktop) */}
                        <Squircle
                            onClick={async () => {
                                if (window.innerWidth < 768) {
                                    await Haptics.impact({ style: ImpactStyle.Light });
                                    togglePanel(setIsSearchOpen, !isSearchOpen);
                                }
                            }}
                            radius={40}
                            className={`transition-all duration-300 xl:hiddenz flex active:scale-80 md:active:scale-none select-none
                            ${isSearchOpen && window.innerWidth < 768 ? "bg-background text-foreground" : "text-background bg-card-foreground md:bg-transparent"}`}
                        >
                            <div
                                className={`zxl:hidden p-2 px-3 lg:px-0 lg:pl-4 h-10 lg:h-11 flex items-center justify-center shrink-0`}
                            >
                                <Search size={20} strokeWidth={2.5} />
                            </div>

                            {/* 2. Search Input (Desktop Only) */}
                            <div className="hidden lg:block h-full bg-background/0">
                                <input
                                    type="text"
                                    placeholder="Search fonts..."
                                    value={localQuery}
                                    onChange={(e) => handleQueryChange(e.target.value)}
                                    className="flex-1 w-0 min-w-40 lg:min-w-64 border-none! outline-none! text-background text-lg font-inter-tight font-medium placeholder:text-background/50 px-2 lg:px-4 h-11 selection:text-accent"
                                />
                            </div>
                        </Squircle>

                        {/* Divider (Desktop Only) */}
                        {/* <div className="w-px h-6 bg-card-foreground mx-1 hidden lg:block"></div> */}

                        {/* 3. Custom Text Toggle (Moved Here) */}
                        {onCustomTextChange && (
                            <Squircle
                                onClick={async () => {
                                    await Haptics.impact({ style: ImpactStyle.Light });
                                    togglePanel(setIsCustomTextOpen, !isCustomTextOpen);
                                }}
                                radius={40}
                                className={`transition-all duration-300 ease-in-out active:scale-80 select-none
                                    ${isCustomTextOpen || customText
                                        ? "bg-background text-foreground"
                                        : "text-background hover:bg-background/20 bg-card-foreground"
                                    }
                                `}
                            >
                                <div
                                    className={`
                                        group relative flex items-center gap-2 p-2 px-3 lg:px-4 h-10 lg:h-11 font-medium text-sm lg:text-base cursor-pointer
                                    `}
                                    title="Custom Text"
                                >
                                    <Pencil size={18} strokeWidth={2.5} className="lg:hidden" />
                                    <span className="hidden lg:inline whitespace-nowrap">
                                        Custom Text
                                    </span>
                                </div>
                            </Squircle>
                        )}

                        {/* 4. Categories Toggle */}
                        <Squircle
                            onClick={async () => {
                                await Haptics.impact({ style: ImpactStyle.Light });
                                togglePanel(setIsCategoriesOpen, !isCategoriesOpen);
                            }}
                            radius={40}
                            className={`group transition-all duration-300 cursor-pointer ease-in-out active:scale-80 select-none
                                ${isCategoriesOpen
                                    ? "bg-background text-foreground"
                                    : "text-background hover:bg-background/20 bg-card-foreground"
                                }
                            `}
                        >
                            <div
                                className={`group relative flex items-center gap-2 p-2 px-3 lg:px-4 h-10 lg:h-11 font-medium text-sm lg:text-base cursor-pointer`}
                            >
                                <SlidersHorizontal
                                    size={18}
                                    strokeWidth={2.5}
                                    className="lg:hidden"
                                />
                                <span className="hidden lg:inline">Filters</span>
                            </div>
                        </Squircle>

                        {/* 5. Sort Toggle */}
                        <Squircle
                            onClick={async () => {
                                await Haptics.impact({ style: ImpactStyle.Light });
                                togglePanel(setIsSortOpen, !isSortOpen);
                            }}
                            radius={40}
                            className={`group transition-all duration-300 cursor-pointer ease-in-out active:scale-80 select-none
                                ${isSortOpen
                                    ? "bg-background text-foreground"
                                    : "text-background hover:bg-background/20 bg-card-foreground"
                                }
                            `}
                        >
                            <div
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
                            </div>
                        </Squircle>

                        {/* 6. View Toggle Group */}
                        {onViewModeChange && (
                            <>
                                {/* <div className="w-px h-6 bg-card-foreground mx-1 hidden lg:block"></div> */}
                                <Squircle
                                    radius={40}
                                    className="bg-background/15"
                                >
                                    <div className="flex justify-center items-center h-10 xl:h-11 py-1 px-1">
                                        <Squircle
                                            radius={40}
                                            onClick={() => {
                                                closeAllPanels();
                                                onViewModeChange("font");
                                            }}
                                            className={`h-9 w-9 flex justify-center items-center transition-all duration-300 select-none ${viewMode === "font"
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-background hover:text-background hover:bg-card-foreground"
                                                }`}
                                            title="Font View"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12.53 20L7.764 4L3 20m1.596-5.03h6.337m4.244-3.03C16.765 10.933 21 9.925 21 13.451V20m0-5.541c-1.588.504-6.353.504-6.353 3.526c0 3.023 4.765 2.015 6.353-.504" />
                                            </svg>
                                        </Squircle>
                                        <Squircle
                                            radius={40}
                                            onClick={() => {
                                                closeAllPanels();
                                                onViewModeChange("image");
                                            }}
                                            className={`h-9 w-9 flex justify-center items-center transition-all duration-300 select-none ${viewMode === "image"
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-background hover:text-background hover:bg-card-foreground"
                                                }`}
                                            title="Image View"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                                <g fill="currentColor">
                                                    <path d="M18 8C18 9.10457 17.1046 10 16 10C14.8954 10 14 9.10457 14 8C14 6.89543 14.8954 6 16 6C17.1046 6 18 6.89543 18 8Z" />
                                                    <path fill-rule="evenodd" d="M12.0574 1.25H11.9426C9.63424 1.24999 7.82519 1.24998 6.41371 1.43975C4.96897 1.63399 3.82895 2.03933 2.93414 2.93414C2.03933 3.82895 1.63399 4.96897 1.43975 6.41371C1.24998 7.82519 1.24999 9.63422 1.25 11.9426V12.0574C1.24999 14.3658 1.24998 16.1748 1.43975 17.5863C1.63399 19.031 2.03933 20.1711 2.93414 21.0659C3.82895 21.9607 4.96897 22.366 6.41371 22.5603C7.82519 22.75 9.63423 22.75 11.9426 22.75H12.0574C14.3658 22.75 16.1748 22.75 17.5863 22.5603C19.031 22.366 20.1711 21.9607 21.0659 21.0659C21.9607 20.1711 22.366 19.031 22.5603 17.5863C22.75 16.1748 22.75 14.3658 22.75 12.0574V11.9426C22.75 9.63423 22.75 7.82519 22.5603 6.41371C22.366 4.96897 21.9607 3.82895 21.0659 2.93414C20.1711 2.03933 19.031 1.63399 17.5863 1.43975C16.1748 1.24998 14.3658 1.24999 12.0574 1.25ZM3.9948 3.9948C4.56445 3.42514 5.33517 3.09825 6.61358 2.92637C7.91356 2.75159 9.62178 2.75 12 2.75C14.3782 2.75 16.0864 2.75159 17.3864 2.92637C18.6648 3.09825 19.4355 3.42514 20.0052 3.9948C20.5749 4.56445 20.9018 5.33517 21.0736 6.61358C21.2484 7.91356 21.25 9.62178 21.25 12C21.25 12.4502 21.2499 12.8764 21.2487 13.2804L21.0266 13.2497C18.1828 12.8559 15.5805 14.3343 14.2554 16.5626C12.5459 12.2376 8.02844 9.28807 2.98073 10.0129L2.75497 10.0454C2.76633 8.63992 2.80368 7.52616 2.92637 6.61358C3.09825 5.33517 3.42514 4.56445 3.9948 3.9948Z" clip-rule="evenodd" />
                                                </g>
                                            </svg>
                                        </Squircle>

                                        {/* Separator & Expand Toggle */}
                                        {showExpandToggle && onToggleAll && (
                                            <>
                                                <div className="w-px h-6 bg-card-foreground mx-1"></div>
                                                <Squircle
                                                    radius={40}
                                                    onClick={async () => {
                                                        closeAllPanels();
                                                        await Haptics.impact({ style: ImpactStyle.Medium });
                                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                                        onToggleAll();
                                                    }}
                                                    className="h-9 w-9 flex justify-center items-center text-background hover:text-background hover:bg-card-foreground transition-all duration-300 active:scale-80 select-none"
                                                    title={allExpanded ? "Collapse All" : "Expand All"}
                                                >
                                                    {allExpanded ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
                                                            <path fill="currentColor" d="M6.668 8.583a1 1 0 0 1 .13.012l.017.003l.031.01c.036.009.073.017.108.032a.7.7 0 0 1 .243.163a.7.7 0 0 1 .126.176l.036.067a.8.8 0 0 1 .058.287l-.001 4a.75.75 0 0 1-1.5 0v-2.188L2.53 14.53a.749.749 0 1 1-1.06-1.06l3.387-3.387H2.666a.75.75 0 0 1 0-1.5zM13.47 1.47a.749.749 0 1 1 1.06 1.06l-3.385 3.386h2.188a.75.75 0 0 1 0 1.5l-4 .001a.7.7 0 0 1-.231-.041l-.056-.017l-.067-.036a.71.71 0 0 1-.384-.525a1 1 0 0 1-.012-.132v-4a.75.75 0 0 1 1.5 0v2.191z" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
                                                            <path fill="currentColor" d="M6.137 8.803a.749.749 0 1 1 1.06 1.06L3.811 13.25H6a.75.75 0 0 1 0 1.5H2a.75.75 0 0 1-.75-.75v-4a.75.75 0 0 1 1.5 0v2.19zM14.75 6a.75.75 0 0 1-1.5 0V3.811L9.863 7.197a.749.749 0 1 1-1.06-1.06L12.19 2.75H10a.75.75 0 0 1 0-1.5h4a.75.75 0 0 1 .75.75z" />
                                                        </svg>
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
                        className="pointer-events-auto bg-foreground mb-2 w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                        <div className="flex flex-col gap-1 p-4 w-full max-w-sm">
                            <h3 className="text-xl sm:text-xl md:text-2xl font-medium tracking-wide text-background select-none px-3 py-2 cursor-default">
                                Search
                            </h3>
                            <Squircle
                                radius={40}
                                className="bg-card-foreground"
                            >
                                <div className="flex items-center gap-2 px-4 py-2">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search fonts..."
                                        value={localQuery}
                                        onChange={(e) => handleQueryChange(e.target.value)}
                                        className="bg-transparent border-none! outline-none! text-background text-lg font-inter-tight font-medium placeholder:text-background/40 w-full"
                                    />
                                    {localQuery && (
                                        <button
                                            onClick={() => handleQueryChange("")}
                                            className="text-background/60"
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
                        className="pointer-events-auto bg-foreground mb-2 w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                        <div className="flex flex-col gap-1 p-4 w-full max-w-sm">
                            <h3 className="text-xl sm:text-xl md:text-2xl font-medium tracking-wide text-background select-none px-3 py-2 cursor-default">
                                Your text
                            </h3>
                            <Squircle
                                radius={40}
                                className="bg-card-foreground"
                            >
                                <div className="flex items-center gap-2 px-4 py-2">
                                    <input
                                        ref={customTextInputRef}
                                        type="text"
                                        placeholder="Type something..."
                                        value={localCustomText}
                                        onChange={(e) => handleCustomTextChange(e.target.value)}
                                        className="bg-transparent border-none! outline-none! text-background text-lg font-inter-tight font-medium placeholder:text-background/40 w-full"
                                    />
                                    {localCustomText && (
                                        <button
                                            onClick={() => handleCustomTextChange("")}
                                            className="text-background/60 hover:text-background"
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
                        className="max-h-[67vh] overflow-y-auto bg-foreground mb-2"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-6 p-4 lg:p-6">
                            {CATEGORIES.map((group, groupIndex) => (
                                <div key={groupIndex} className="flex flex-col gap-0 md:gap-3">
                                    <h3 className="text-xl sm:text-xl md:text-2xl font-medium tracking-wide text-background select-none px-2 py-2 cursor-default">
                                        {group.group}
                                    </h3>
                                    <div className="flex gap-1.5 md:gap-2 flex-wrap">
                                        {group.items.map((cat) => {
                                            const isSelected = Boolean(
                                                filters.categories?.some(
                                                    (c) =>
                                                        c.toLowerCase() === cat.id.toLowerCase() ||
                                                        (cat.id === "monospace" && c.toLowerCase() === "mono") ||
                                                        (cat.id === "mono" && c.toLowerCase() === "monospace")
                                                )
                                            );
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = filters.categories || [];
                                                        const newCategories = isSelected
                                                            ? current.filter(
                                                                (c) =>
                                                                    c.toLowerCase() !== cat.id.toLowerCase() &&
                                                                    !(cat.id === "monospace" && c.toLowerCase() === "mono") &&
                                                                    !(cat.id === "mono" && c.toLowerCase() === "monospace")
                                                            )
                                                            : [
                                                                ...current.filter(
                                                                    (c) =>
                                                                        c.toLowerCase() !== cat.id.toLowerCase() &&
                                                                        !(cat.id === "monospace" && c.toLowerCase() === "mono") &&
                                                                        !(cat.id === "mono" && c.toLowerCase() === "monospace")
                                                                ),
                                                                cat.id,
                                                            ];
                                                        handleChange("categories", newCategories);
                                                    }}
                                                    className={`
                                                        px-3 py-1.5 md:px-3 md:py-2 font-inter font-medium rounded-full text-[14px] md:text-sm whitespace-nowrap transition-all duration-200 text-left cursor-pointer ${isSelected
                                                            ? "bg-background text-card-foreground"
                                                            : "bg-card-foreground/50 text-background/50 hover:bg-card-foreground"
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
                        radius={30}
                        className="w-45 mb-2 ml-0 lg:ml-102 bg-foreground animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                        <div className="flex flex-col zitems-center gap-2 p-4 lg:p-2">
                            {/* <h3 className="w-full text-xl sm:text-xl md:text-2xl font-medium tracking-wide text-background px-3 py-2 cursor-default">
                                Sort By
                            </h3> */}
                            <div className="flex flex-col gap-1">
                                {SORT_OPTIONS.map((opt) => (
                                    <Squircle radius={40} className="w-full">
                                        <button
                                            key={opt.id}
                                            onClick={() => handleChange("sortBy", opt.id)}
                                            className={`
                                                w-full px-4 py-3 text-left text-sm font-medium font-inter transition-all duration-300
                                                ${(filters.sortBy || "trending") === opt.id
                                                    ? "bg-background text-card-foreground"
                                                    : "bg-transparent text-background hover:bg-background/5 hover:text-background"
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
