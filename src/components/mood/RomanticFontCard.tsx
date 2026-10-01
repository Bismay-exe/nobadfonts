import { Link, useNavigate, useLocation } from "react-router-dom";
import { Heart } from "lucide-react";
import SaveToBoardModal from "../boards/SaveToBoardModal";
import type { Font } from "../../types/font";
import React, {
    useEffect,
    useState,
    useRef,
    useCallback,
    useMemo,
} from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
// import { motion } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Toast } from "@capacitor/toast";
// import { Squircle } from "react-ios-corners";
import { useBag } from "../../contexts/BagContext";

interface FontCardProps {
    font: Font;
    viewMode?: "font" | "image";
    onClick?: (font: Font) => void;
    disableLink?: boolean;
    isExpanded?: boolean;
    onToggle?: () => void;
    customText?: string;
    hideLike?: boolean;
    bulkToggleVersion?: number;
    cardWidth?: number;
    isFavorited?: boolean;
    onFavoriteChange?: (fontId: string, isFavorited: boolean) => void;
    moodCardStyle?: {
        borderRadius?: string;
        background?: string;
        border?: string;
        shadow?: string;
        overlayGradient?: string;
    };
    moodIndex?: number;
}

const measurementCanvas =
    typeof document !== "undefined" ? document.createElement("canvas") : null;
const fontSizeCache = new Map<string, number>();

const AutoSizingText = React.memo(
    ({
        text,
        fontId,
        isLoaded,
        cardWidth,
    }: {
        text: string;
        fontId: string;
        isLoaded: boolean;
        cardWidth?: number;
    }) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const textRef = useRef<HTMLDivElement>(null);

        const calculateFontSize = useCallback(() => {
            const textEl = textRef.current;

            if (!textEl || !measurementCanvas || !isLoaded) return;

            let width = 0;
            if (cardWidth && cardWidth > 40) {
                width = cardWidth - 40;
            } else if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                width = rect.width - 40;
            }

            if (width <= 0) return;

            const roundedWidth = Math.round(width);
            const cacheKey = `${fontId}:${text}:${roundedWidth}`;
            const cached = fontSizeCache.get(cacheKey);
            if (cached) {
                textEl.style.fontSize = `${cached}px`;
                return;
            }

            const ctx = measurementCanvas.getContext("2d");
            if (!ctx) return;

            const base = 100;

            ctx.font = `${base}px font-${fontId}, sans-serif`;

            const words = text.split(/\s+/);

            let longest = 0;

            for (const word of words) {
                const w = ctx.measureText(word).width;
                if (w > longest) longest = w;
            }

            if (!longest) return;

            const ratio = width / longest;

            const fontSize = Math.floor(base * ratio * 0.95);
            fontSizeCache.set(cacheKey, fontSize);

            textEl.style.fontSize = `${fontSize}px`;
        }, [text, fontId, isLoaded, cardWidth]);

        useEffect(() => {
            calculateFontSize();
        }, [calculateFontSize]);

        useEffect(() => {
            // If cardWidth is supplied externally (from Masonic), no per-card ResizeObserver is needed
            if (cardWidth) return;

            const resizeObserver = new ResizeObserver(() => {
                calculateFontSize();
            });
            if (containerRef.current) {
                resizeObserver.observe(containerRef.current);
            }
            return () => resizeObserver.disconnect();
        }, [calculateFontSize, cardWidth]);

        return (
            <div
                ref={containerRef}
                className="w-full relative flex items-center justify-center transition-all duration-300 px-5 pt-8 pb-6 min-h-50"
            >
                <div
                    ref={textRef}
                    className="max-w-full text-[rgb(var(--color-card-foreground)/0.8)] ztext-color-card-foreground/10 text-center leading-[1.2] transition-opacity duration-300 m-0 flex flex-col items-center justify-center py-2"
                    style={{
                        fontFamily: isLoaded ? `'font-${fontId}'` : "sans-serif",
                        opacity: isLoaded ? 1 : 0,
                    }}
                >
                    {text.split(/\s+/).map((word, i) => (
                        <span key={i} className="block whitespace-nowrap">
                            {word}
                        </span>
                    ))}
                </div>
            </div>
        );
    },
);

const loadedFontsCache = new Set<string>();

function RomanticFontCard({
    font,
    viewMode = "font",
    onClick,
    disableLink = false,
    isExpanded: propIsExpanded,
    onToggle,
    customText,
    hideLike = false,
    cardWidth,
    isFavorited: propIsFavorited,
    onFavoriteChange,
    moodCardStyle,
    // moodIndex,
}: FontCardProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToBag, isInBag } = useBag();
    const [isFontLoaded, setIsFontLoaded] = useState(() =>
        font ? loadedFontsCache.has(font.id) : false,
    );
    const [localIsFavorited, setLocalIsFavorited] = useState(
        () => propIsFavorited ?? false,
    );
    const [localIsExpanded, setLocalIsExpanded] = useState(false);
    const [favoritesCount, setFavoritesCount] = useState(
        font?.favorites_count || 0,
    );
    const [boardModalOpen, setBoardModalOpen] = useState(false);
    const fontIsInBag = isInBag(font?.id);

    const isExpanded = propIsExpanded ?? localIsExpanded;
    const isFavorited =
        propIsFavorited !== undefined ? propIsFavorited : localIsFavorited;

    useEffect(() => {
        if (propIsFavorited !== undefined) {
            setLocalIsFavorited(propIsFavorited);
        }
    }, [propIsFavorited]);

    // Only make single fetch if propIsFavorited was NOT provided by parent
    useEffect(() => {
        if (propIsFavorited !== undefined || !user || !font) return;
        let isMounted = true;
        const checkFavorite = async () => {
            const { data } = await supabase
                .from("favorites")
                .select("id")
                .eq("font_id", font.id)
                .eq("user_id", user.id)
                .single();
            if (data && isMounted) setLocalIsFavorited(true);
        };
        checkFavorite();
        return () => {
            isMounted = false;
        };
    }, [user, font, propIsFavorited]);

    useEffect(() => {
        setFavoritesCount(font?.favorites_count || 0);
    }, [font?.favorites_count]);

    const fontSource = useMemo(() => {
        if (!font) return null;
        // 1. Try to use og_image_variant_id first
        if (
            font.og_image_variant_id &&
            font.font_variants &&
            font.font_variants.length > 0
        ) {
            const selectedVariant = font.font_variants.find(
                (v) => v.id === font.og_image_variant_id,
            );
            if (selectedVariant) {
                if (selectedVariant.woff2_url)
                    return { url: selectedVariant.woff2_url, format: "woff2" };
                if (selectedVariant.woff_url)
                    return { url: selectedVariant.woff_url, format: "woff" };
                if (selectedVariant.ttf_url)
                    return { url: selectedVariant.ttf_url, format: "truetype" };
                if (selectedVariant.otf_url)
                    return { url: selectedVariant.otf_url, format: "opentype" };
            }
        }
        // 2. Try to find 'Regular' in variants
        if (font.font_variants && font.font_variants.length > 0) {
            const regular = font.font_variants.find(
                (v) => v.variant_name === "Regular",
            );
            if (regular) {
                if (regular.woff2_url)
                    return { url: regular.woff2_url, format: "woff2" };
                if (regular.woff_url) return { url: regular.woff_url, format: "woff" };
                if (regular.ttf_url)
                    return { url: regular.ttf_url, format: "truetype" };
                if (regular.otf_url)
                    return { url: regular.otf_url, format: "opentype" };
            }
        }
        // 3. Fallback to Main Font Files
        if (font.woff2_url) return { url: font.woff2_url, format: "woff2" };
        if (font.woff_url) return { url: font.woff_url, format: "woff" };
        if (font.ttf_url) return { url: font.ttf_url, format: "truetype" };
        if (font.otf_url) return { url: font.otf_url, format: "opentype" };
        // 3. Fallback to ANY variant
        if (font.font_variants && font.font_variants.length > 0) {
            const anyVariant = font.font_variants[0];
            if (anyVariant.woff2_url)
                return { url: anyVariant.woff2_url, format: "woff2" };
            if (anyVariant.woff_url)
                return { url: anyVariant.woff_url, format: "woff" };
            if (anyVariant.ttf_url)
                return { url: anyVariant.ttf_url, format: "truetype" };
            if (anyVariant.otf_url)
                return { url: anyVariant.otf_url, format: "opentype" };
        }
        return null;
    }, [font]);

    useEffect(() => {
        if (!fontSource) return;

        let isMounted = true;
        const { url, format } = fontSource;
        const fontFamily = `font-${font.id}`;
        const source = `url(${url}) format('${format}')`;
        const fontFace = new FontFace(fontFamily, source);

        fontFace
            .load()
            .then((loadedFace) => {
                if (!isMounted) return;
                document.fonts.add(loadedFace);
                loadedFontsCache.add(font.id);
                setIsFontLoaded(true);
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error(`Failed to load font ${font.name}:`, err);
            });

        return () => {
            isMounted = false;
        };
    }, [font.id, fontSource, font.name]);

    if (!font) return null;

    // Safety check for tags/category
    const displayTags =
        font.tags && Array.isArray(font.tags) && font.tags.length > 0
            ? font.tags
            : font.category
                ? [font.category]
                : [];

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate("/auth");
            return;
        }

        const newStatus = !isFavorited;
        setLocalIsFavorited(newStatus); // Optimistic update
        onFavoriteChange?.(font.id, newStatus);

        await Haptics.impact({ style: ImpactStyle.Medium });

        if (newStatus) {
            setFavoritesCount((prev) => prev + 1);
        } else {
            setFavoritesCount((prev) => Math.max(0, prev - 1));
        }

        try {
            if (newStatus) {
                const { error } = await supabase
                    .from("favorites")
                    .insert({ font_id: font.id, user_id: user.id });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("favorites")
                    .delete()
                    .eq("font_id", font.id)
                    .eq("user_id", user.id);
                if (error) throw error;
            }
        } catch (error) {
            console.error("Error updating favorite:", error);
            setLocalIsFavorited(!newStatus); // Revert on error
            onFavoriteChange?.(font.id, !newStatus);
            setFavoritesCount((prev) => (newStatus ? prev - 1 : prev + 1)); // Revert count
            await Toast.show({
                text: "Failed to update favorites",
                duration: "short",
            });
        }
    };

    const handleCardClick = () => {
        if (disableLink) {
            onClick?.(font);
            return;
        }

        // Prevent expanding if clicking specific controls if we had any bubbling issues,
        // but current structure separates them well.
        if (onToggle) {
            onToggle();
        } else {
            setLocalIsExpanded(!localIsExpanded);
        }
        Haptics.impact({ style: ImpactStyle.Light });
    };

    return (
        <>
            <div
                className="group relative -mb-2 sm:mb-0 overflow-hidden flex flex-col"
                onClick={handleCardClick}
            >
                <div
                    className={`w-full h-full transition-all duration-300 ${!moodCardStyle ? "" : ""}`}
                // style={
                //     moodCardStyle
                //         ? {
                //             borderRadius: moodCardStyle.borderRadius || "32px",
                //             background: moodCardStyle.background,
                //             border: moodCardStyle.border,
                //             boxShadow: moodCardStyle.shadow,
                //         }
                //         : {}
                // }
                >
                    {moodCardStyle?.overlayGradient && (
                        <div
                            className="absolute inset-0 z-0 pointer-events-none rounded-[inherit]"
                            style={{ background: moodCardStyle.overlayGradient }}
                        />
                    )}
                    <div className="flex flex-col h-full relative z-10 cursor-pointer">
                        {/* Top Expanded Content Section */}
                        {/* <motion.div
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            style={{
                                height: isExpanded ? "auto" : 0,
                                opacity: isExpanded ? 1 : 0,
                                overflow: "hidden",
                            }}
                        >
                            <motion.div
                                initial={false}
                                animate={{
                                    opacity: isExpanded ? 1 : 0,
                                    y: isExpanded ? 0 : -100,
                                }}
                                transition={{ duration: 0.25 }}
                            >
                                <div className="w-full px-2 pb-4 pt-2 flex flex-col-reverse gap-3 overflow-hidden">
                                    <div className="w-full h-full">
                                        <div className="flex justify-start items-start gap-3">
                                            <div className="w-12 h-12 rounded-4xl bg-white ring-2 ring-[rgb(var(--color-foreground)/0.05)] zp-px mt-1">
                                                <img src="/public/logo/logo-white.png" alt="logo" className="w-full h-full rounded-full p-2 bg-white" />
                                            </div>

                                            <div className="flex flex-col">
                                                <h1 className="text-2xl font-bold tracking-tight mb-0.5 group/title">
                                                    {font.name}
                                                </h1>
                                                <p className="text-sm text-[rgb(var(--color-muted-foreground))] tracking-wide">
                                                    by{" "}
                                                    <Link
                                                        to={`/designers/${encodeURIComponent(font.designer || "")}`}
                                                        state={{ from: location }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="hover:text-[rgb(var(--color-foreground))] hover:underline transition-colors duration-300 ease-in-out"
                                                    >
                                                        {font.designer}
                                                    </Link>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div> */}

                        <div className="relative z-10">
                            {viewMode === "image" &&
                                (font.preview_image_url ||
                                    (font.gallery_images && font.gallery_images.length > 0)) ? (
                                <div
                                    className={`w-full h-full flex items-center justify-center transition-all duration-300 ease-in-out min-h-50
                                    ${isExpanded ? "p-0" : "p-0"}`}
                                >
                                    <div className="border border-[rgba(var(--color-foreground)/0.1)] rounded-4xl overflow-hidden">
                                        <img
                                            src={font.preview_image_url || font.gallery_images?.[0]}
                                            alt={`${font.name} font preview specimen`}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="py-4 sm:py-8 md:py-12 px-0 sm:px-2 md:px-4 relative z-10 bg-[rgb(var(--color-foreground)/0.05)] backdrop-blur-3xlz rounded-4xl"
                                    style={
                                        moodCardStyle
                                            ? {
                                                borderRadius: moodCardStyle.borderRadius || "32px",
                                                background: moodCardStyle.background,
                                                border: moodCardStyle.border,
                                                boxShadow: moodCardStyle.shadow,
                                            }
                                            : {}
                                    }>
                                    {/* {moodIndex !== undefined && (
                                        <div className="absolute top-4 left-5 text-[10px] font-mono tracking-widest opacity-40">
                                            // {String(moodIndex + 1).padStart(3, "0")}
                                        </div>
                                    )} */}
                                    <AutoSizingText
                                        text={customText || font.name}
                                        fontId={font.id}
                                        isLoaded={isFontLoaded}
                                        cardWidth={cardWidth}
                                    />
                                </div>
                            )}

                            {/* Hover overlay gradient for collapsed state */}
                            <div
                                className={`absolute inset-0 flex flex-col justify-between items-end w-full p-5 rounded-4xl z-10 transition-all duration-300 ease-in-out pointer-events-none ${isExpanded ? "opacity-100" : "bg-linear-to-t opacity-0 group-hover:opacity-100"} ${viewMode === 'image' ? 'text-white from-black/50 via-transparent via-100% to-transparent' : 'text-[rgb(var(--color-foreground))]'}`}
                            >
                                <div className="w-full flex justify-between items-start gap-3">
                                    <div className="flex items-center justify-end gap-2 font-inter-tight tracking-wider">
                                        {/* Likes */}
                                        {!hideLike && (
                                            <div
                                                className={`flex items-center gap-1 ${isExpanded ? "pointer-events-none" : "pointer-events-auto"}`}
                                            >
                                                <button
                                                    onClick={toggleFavorite}
                                                    aria-label={
                                                        isFavorited
                                                            ? `Remove ${font.name} from favorites`
                                                            : `Add ${font.name} to favorites`
                                                    }
                                                    className={`flex justify-center items-center gap-1 ${isExpanded ? "backdrop-blur-sm" : ""} transition-all duration-300 ease-in-out h-11 px-3 rounded-full pointer-events-auto cursor-pointer
                                                    ${viewMode === 'image' ? 'bg-black/30' : ''}`}
                                                >
                                                    <Heart
                                                        size={20}
                                                        className={`transition-transform duration-300 ${isFavorited ? "fill-pink-500 text-pink-500" : "group-hover/like:scale-105"}`}
                                                    />
                                                    <span className="font-medium text-[16px]">
                                                        {favoritesCount}
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                        {/* Save to Board */}
                                        {user && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setBoardModalOpen(true);
                                                }}
                                                aria-label={`Save ${font.name} to a board`}
                                                className={`
                                                    group/save flex items-center justify-center
                                                    h-11 px-3 rounded-full
                                                    overflow-hidden
                                                    pointer-events-auto cursor-pointer
                                                    transition-all duration-300 ease-out
                                                    max-w-11 hover:max-w-100
                                                    ${isExpanded ? "backdrop-blur-sm" : ""}
                                                    ${viewMode === "image" ? "bg-black/30" : ""}
                                                `}
                                            >
                                                <svg
                                                    className="flex h-11 w-5 shrink-0 items-center justify-center"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <g
                                                        fill="none"
                                                        stroke="currentColor"
                                                        stroke-linecap="round"
                                                        stroke-width="2"
                                                    >
                                                        <path d="M21 16.0909V11.0975C21 6.80891 21 4.6646 19.682 3.3323C18.364 2 16.2426 2 12 2C7.75736 2 5.63604 2 4.31802 3.3323C3 4.6646 3 6.80891 3 11.0975V16.0909C3 19.1875 3 20.7358 3.73411 21.4123C4.08421 21.735 4.52615 21.9377 4.99692 21.9915C5.98402 22.1045 7.13673 21.0849 9.44216 19.0458C10.4612 18.1445 10.9708 17.6938 11.5603 17.5751C11.8506 17.5166 12.1494 17.5166 12.4397 17.5751C13.0292 17.6938 13.5388 18.1445 14.5578 19.0458C16.8633 21.0849 18.016 22.1045 19.0031 21.9915C19.4739 21.9377 19.9158 21.735 20.2659 21.4123C21 20.7358 21 19.1875 21 16.0909Z" />
                                                    </g>
                                                </svg>
                                                <span
                                                    className="
                                                        max-w-0 overflow-hidden whitespace-nowrap
                                                        opacity-0
                                                        ml-0
                                                        group-hover/save:max-w-27.5
                                                        group-hover/save:opacity-100
                                                        group-hover/save:ml-2
                                                        transition-all duration-300 ease-out
                                                    "
                                                >
                                                    Save to board
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                    {/* Add to Bag — hover overlay */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (fontIsInBag) {
                                                navigate("/bag");
                                            } else {
                                                addToBag(font);
                                                // navigate('/bag');
                                            }
                                        }}
                                        aria-label={
                                            fontIsInBag
                                                ? `${font.name} is in your bag — view bag`
                                                : `Add ${font.name} to bag`
                                        }
                                        title={fontIsInBag ? "View in bag" : "Add to bag"}
                                        className={`flex justify-center items-center ${isExpanded ? "backdrop-blur-sm" : ""} group/bag h-11 px-3 rounded-full overflow-hidden pointer-events-auto cursor-pointer transition-all duration-600 ease-out max-w-11 hover:max-w-100
                                            ${viewMode === 'image' ? 'bg-black/30' : ''}`}
                                    >
                                        <svg
                                            className="flex h-11 w-5 shrink-0 items-center justify-center"
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                        >
                                            <g
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                            >
                                                <path
                                                    d="M3.977 9.84A2 2 0 0 1 5.971 8h12.058a2 2 0 0 1 1.994 1.84l.803 10A2 2 0 0 1 18.833 22H5.167a2 2 0 0 1-1.993-2.16z"
                                                    className={`${fontIsInBag ? "fill-current" : "fill-transparent"} transition-all duration-300 ease-in-out`}
                                                />
                                                <path d="M16 11V6a4 4 0 0 0-4-4v0a4 4 0 0 0-4 4v5" />
                                            </g>
                                        </svg>
                                        <span className=" max-w-0 overflow-hidden whitespace-nowrap opacity-0 ml-0 group-hover/bag:max-w-27.5 group-hover/bag:opacity-100 group-hover/bag:ml-2 transition-all duration-600 ease-out">
                                            {fontIsInBag ? "View in bag" : "Add to bag"}</span>
                                    </button>
                                </div>
                                <div
                                    className={`${isExpanded ? "hidden" : "flex"} justify-between items-end gap-5 w-full`}
                                >
                                    {/* Font name and designer name */}
                                    <div className="flex flex-col justify-center items-start transition-colors duration-300 ease-in-out pointer-events-auto">
                                        <p className={`font-medium text-base transition-transform duration-300 ${isExpanded ? "translate-y-2" : "translate-y-2 group-hover:translate-y-0"}`}
                                        >
                                            {font.name}
                                        </p>
                                        <p className={`text-sm transition-transform duration-300 delay-75 ${isExpanded ? "translate-y-2" : "translate-y-2 group-hover:translate-y-0"}
                                        ${viewMode === 'image' ? 'text-white/60' : 'text-[rgb(var(--color-muted-foreground))]'}`}
                                        >
                                            {font.designer}
                                        </p>
                                    </div>

                                    {/* View Font Button */}
                                    <Link
                                        to={`/fonts/${font.slug || font.id}`}
                                        aria-label={`View ${font.name} font details and specimen`}
                                        onClick={(e) => {
                                            if (!isExpanded) {
                                                e.stopPropagation();
                                            } else {
                                                e.preventDefault();
                                            }
                                        }}
                                        className={`flex justify-center items-center gap-1 ${viewMode === 'image' ? 'zbg-black/30 zbackdrop-blur-sm' : ''} transition-colors duration-300 ease-in-out h-11 px-3 rounded-full pointer-events-auto cursor-pointer`}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                        >
                                            <g
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                            >
                                                <path d="M4 20 20 4" />
                                                <path d="M10 4h10v10" />
                                            </g>
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Content Section */}
                        <div className={`${isExpanded ? 'translate-y-0' : '-ztranslate-y-full h-0'} transition-all duration-300 ease-in-out relative z-0`}
                        // initial={false}
                        // style={{
                        // height: isExpanded ? "auto" : 0,
                        // opacity: isExpanded ? 1 : 0,
                        // overflow: "hidden",
                        // y: isExpanded ? 0 : -10,
                        // }}
                        // transition={{ duration: 0.25 }}
                        >
                            <div className="w-full px-2 pb-4 pt-2 flex flex-col gap-3 overflow-hidden">
                                <div className="w-full h-full">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex flex-col">
                                            <h1 className="text-2xl font-bold tracking-tight mb-0.5 group/title">
                                                {font.name}
                                            </h1>
                                            <p className="text-sm text-[rgb(var(--color-muted-foreground))] tracking-wide">
                                                by{" "}
                                                <Link
                                                    to={`/designers/${encodeURIComponent(font.designer || "")}`}
                                                    state={{ from: location }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="hover:text-[rgb(var(--color-foreground))] hover:underline transition-colors duration-300 ease-in-out"
                                                >
                                                    {font.designer}
                                                </Link>
                                            </p>
                                        </div>

                                        {/* View Font Button */}
                                        <Link
                                            to={`/fonts/${font.slug || font.id}`}
                                            aria-label={`View ${font.name} font details and specimen`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                            className={`flex justify-center items-center gap-1 text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out py-2 px-3 rounded-full pointer-events-auto cursor-pointer`}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                            >
                                                <g
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                >
                                                    <path d="M4 20 20 4" />
                                                    <path d="M10 4h10v10" />
                                                </g>
                                            </svg>
                                        </Link>
                                    </div>
                                </div>

                                {/* Bottom Row: Tags */}
                                <div className={`${moodCardStyle ? 'hidden' : 'flex'} flex-wrap gap-1.5 mt-1`}>
                                    {displayTags.map((tag, i) => (
                                        <Link
                                            key={i}
                                            to={`?categories=${tag}`}
                                            className="bg-[rgb(var(--color-foreground)/0.05)] text-[rgb(var(--color-foreground)/0.5)] hover:bg-[rgb(var(--color-foreground)/0.9)] backdrop-blur-md hover:text-[rgb(var(--color-background))] text-[10px] md:text-[11px] px-2.5 py-1.5 rounded-full tracking-wider font-normal font-inter-tight zuppercase transition-colors duration-300 ease-in-out"
                                        >
                                            {tag}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            {user && (
                <SaveToBoardModal
                    fontId={font.id}
                    fontName={font.name}
                    isOpen={boardModalOpen}
                    onClose={() => setBoardModalOpen(false)}
                />
            )}
        </>
    );
}

export default React.memo(RomanticFontCard);
