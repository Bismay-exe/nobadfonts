import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowUpRight, Heart, Bookmark } from 'lucide-react';
import SaveToBoardModal from '../boards/SaveToBoardModal';
import type { Font } from '../../types/font';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Toast } from '@capacitor/toast';
import { Squircle } from 'react-ios-corners';


interface FontCardProps {
    font: Font;
    viewMode?: 'font' | 'image';
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
}

const measurementCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
const fontSizeCache = new Map<string, number>();

const AutoSizingText = React.memo(({
    text,
    fontId,
    isLoaded,
    cardWidth,
}: {
    text: string
    fontId: string
    isLoaded: boolean
    cardWidth?: number
}) => {

    const containerRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLDivElement>(null)

    const calculateFontSize = useCallback(() => {
        const textEl = textRef.current

        if (!textEl || !measurementCanvas || !isLoaded) return

        let width = 0
        if (cardWidth && cardWidth > 40) {
            width = cardWidth - 40
        } else if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            width = rect.width - 40
        }

        if (width <= 0) return

        const roundedWidth = Math.round(width)
        const cacheKey = `${fontId}:${text}:${roundedWidth}`
        const cached = fontSizeCache.get(cacheKey)
        if (cached) {
            textEl.style.fontSize = `${cached}px`
            return
        }

        const ctx = measurementCanvas.getContext("2d")
        if (!ctx) return

        const base = 100

        ctx.font = `${base}px font-${fontId}, sans-serif`

        const words = text.split(/\s+/)

        let longest = 0

        for (const word of words) {
            const w = ctx.measureText(word).width
            if (w > longest) longest = w
        }

        if (!longest) return

        const ratio = width / longest

        const fontSize = Math.floor(base * ratio * 0.95)
        fontSizeCache.set(cacheKey, fontSize)

        textEl.style.fontSize = `${fontSize}px`

    }, [text, fontId, isLoaded, cardWidth])

    useEffect(() => {
        calculateFontSize()
    }, [calculateFontSize])

    useEffect(() => {
        // If cardWidth is supplied externally (from Masonic), no per-card ResizeObserver is needed
        if (cardWidth) return

        const resizeObserver = new ResizeObserver(() => {
            calculateFontSize()
        })
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }
        return () => resizeObserver.disconnect()
    }, [calculateFontSize, cardWidth])


    return (
        <div ref={containerRef} className="w-full relative flex items-center justify-center transition-all duration-300 px-5 pt-8 pb-6 min-h-50">
            <div
                ref={textRef}
                className="max-w-full text-[rgb(var(--color-card-foreground)/0.8)] ztext-color-card-foreground/10 text-center leading-[1.2] transition-opacity duration-300 m-0 flex flex-col items-center justify-center py-2"
                style={{
                    fontFamily: isLoaded ? `'font-${fontId}'` : 'sans-serif',
                    opacity: isLoaded ? 1 : 0
                }}
            >
                {text.split(/\s+/).map((word, i) => (
                    <span key={i} className="block whitespace-nowrap">{word}</span>
                ))}
            </div>
        </div>
    );
});

const loadedFontsCache = new Set<string>();

function FontCard({
    font,
    viewMode = 'font',
    onClick,
    disableLink = false,
    isExpanded: propIsExpanded,
    onToggle,
    customText,
    hideLike = false,
    cardWidth,
    isFavorited: propIsFavorited,
    onFavoriteChange,
}: FontCardProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isFontLoaded, setIsFontLoaded] = useState(() => font ? loadedFontsCache.has(font.id) : false);
    const [localIsFavorited, setLocalIsFavorited] = useState(() => propIsFavorited ?? false);
    const [localIsExpanded, setLocalIsExpanded] = useState(false);
    const [favoritesCount, setFavoritesCount] = useState(font?.favorites_count || 0);
    const [boardModalOpen, setBoardModalOpen] = useState(false);

    const isExpanded = propIsExpanded ?? localIsExpanded;
    const isFavorited = propIsFavorited !== undefined ? propIsFavorited : localIsFavorited;

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
                .from('favorites')
                .select('id')
                .eq('font_id', font.id)
                .eq('user_id', user.id)
                .single();
            if (data && isMounted) setLocalIsFavorited(true);
        };
        checkFavorite();
        return () => { isMounted = false; };
    }, [user, font, propIsFavorited]);

    useEffect(() => {
        setFavoritesCount(font?.favorites_count || 0);
    }, [font?.favorites_count]);


    const fontSource = useMemo(() => {
        if (!font) return null;
        // 1. Try to find 'Regular' in variants
        if (font.font_variants && font.font_variants.length > 0) {
            const regular = font.font_variants.find(v => v.variant_name === 'Regular');
            if (regular) {
                if (regular.woff2_url) return { url: regular.woff2_url, format: 'woff2' };
                if (regular.woff_url) return { url: regular.woff_url, format: 'woff' };
                if (regular.ttf_url) return { url: regular.ttf_url, format: 'truetype' };
                if (regular.otf_url) return { url: regular.otf_url, format: 'opentype' };
            }
        }
        // 2. Fallback to Main Font Files
        if (font.woff2_url) return { url: font.woff2_url, format: 'woff2' };
        if (font.woff_url) return { url: font.woff_url, format: 'woff' };
        if (font.ttf_url) return { url: font.ttf_url, format: 'truetype' };
        if (font.otf_url) return { url: font.otf_url, format: 'opentype' };
        // 3. Fallback to ANY variant
        if (font.font_variants && font.font_variants.length > 0) {
            const anyVariant = font.font_variants[0];
            if (anyVariant.woff2_url) return { url: anyVariant.woff2_url, format: 'woff2' };
            if (anyVariant.woff_url) return { url: anyVariant.woff_url, format: 'woff' };
            if (anyVariant.ttf_url) return { url: anyVariant.ttf_url, format: 'truetype' };
            if (anyVariant.otf_url) return { url: anyVariant.otf_url, format: 'opentype' };
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

        fontFace.load().then((loadedFace) => {
            if (!isMounted) return;
            document.fonts.add(loadedFace);
            loadedFontsCache.add(font.id);
            setIsFontLoaded(true);
        }).catch((err) => {
            if (!isMounted) return;
            console.error(`Failed to load font ${font.name}:`, err);
        });

        return () => { isMounted = false; };
    }, [font.id, fontSource, font.name]);

    if (!font) return null;

    // Safety check for tags/category
    const displayTags = (font.tags && Array.isArray(font.tags) && font.tags.length > 0)
        ? font.tags
        : (font.category ? [font.category] : []);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate('/auth');
            return;
        }

        const newStatus = !isFavorited;
        setLocalIsFavorited(newStatus); // Optimistic update
        onFavoriteChange?.(font.id, newStatus);

        await Haptics.impact({ style: ImpactStyle.Medium });

        if (newStatus) {
            setFavoritesCount(prev => prev + 1);
        } else {
            setFavoritesCount(prev => Math.max(0, prev - 1));
        }

        try {
            if (newStatus) {
                const { error } = await supabase
                    .from('favorites')
                    .insert({ font_id: font.id, user_id: user.id });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('font_id', font.id)
                    .eq('user_id', user.id);
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error updating favorite:', error);
            setLocalIsFavorited(!newStatus); // Revert on error
            onFavoriteChange?.(font.id, !newStatus);
            setFavoritesCount(prev => newStatus ? prev - 1 : prev + 1); // Revert count
            await Toast.show({ text: 'Failed to update favorites', duration: 'short' });
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
            >   <div
                className='w-full h-full bg-[rgb(var(--color-foreground)/0.05)] rounded-4xl'
            // radius={50}
            >
                    <div className="flex flex-col h-full relative cursor-pointer">
                        {/* Preview Section - Fixed Height or ratio? 
                    In original, it was h-full. Now we want it to be the main part.
                    We keeping h-64 as a base or letting it fill?
                    Masonry usually expects items to define height.
                    Let's use a min-height for the preview part.
                */}
                        <>
                            {viewMode === 'image' && (font.preview_image_url || (font.gallery_images && font.gallery_images.length > 0)) ? (

                                <div className={`w-full h-full flex items-center justify-center transition-all duration-300 ease-in-out min-h-50
                            ${isExpanded ? 'p-2' : 'p-0'}`}>
                                    <Squircle radius={50}>
                                        <img
                                            src={font.preview_image_url || font.gallery_images?.[0]}
                                            alt={`${font.name} font preview specimen`}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover"
                                        />
                                    </Squircle>
                                </div>
                            ) : (
                                <div className="py-4 sm:py-8 md:py-12 px-0 sm:px-2 md:px-4">
                                    <AutoSizingText
                                        text={customText || font.name}
                                        fontId={font.id}
                                        isLoaded={isFontLoaded}
                                        cardWidth={cardWidth}
                                    />
                                </div>
                            )}
                        </>

                        {/* Expanded Content Section */}
                        <div
                            // transition={{ duration: 0.25, ease: "easeInOut" }}
                            style={{
                                height: isExpanded ? "auto" : 0,
                                opacity: isExpanded ? 1 : 0,
                                overflow: "hidden"
                            }}
                        >
                            <motion.div
                                initial={false}
                                animate={{
                                    opacity: isExpanded ? 1 : 0,
                                    y: isExpanded ? 0 : -10
                                }}
                                transition={{ duration: 0.25 }}
                            >
                                <div className="overflow-hidden">
                                    <div className="w-full">
                                        <div className="px-4 pb-4 pt-2 flex flex-col gap-3">
                                            {/* Top Row: Likes & View Button */}
                                            {/* <div className="flex items-center justify-between w-full ">
                                            {!hideLike ? (
                                                <button
                                                    onClick={toggleFavorite}
                                                    aria-label={isFavorited ? `Remove ${font.name} from favorites` : `Add ${font.name} to favorites`}
                                                    className="flex items-center gap-2 text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out group/like"
                                                >
                                                    <Heart
                                                        size={22}
                                                        className={`transition-transform duration-300 ${isFavorited ? 'fill-pink-500 text-pink-500' : 'group-hover/like:scale-105'}`}
                                                    />
                                                    <span className="font-bold text-[16px]">{favoritesCount}</span>
                                                </button>
                                            ) : <div></div>}

                                            <Link
                                                to={`/fonts/${font.slug || font.id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                aria-label={`View ${font.name} font details and specimen`}
                                                className="bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] text-xs px-4 py-2 rounded-full font-bold font-bricolage-grotesque hover:opacity-80 transition-colors duration-300 ease-in-out"
                                            >
                                                View Details
                                            </Link>
                                        </div> */}

                                            <div className="w-full h-full">
                                                <div className='flex justify-between items-start gap-4'>
                                                    <Link to={`/fonts/${font.slug || font.id}`}
                                                        className="flex items-end text-2xl font-bold tracking-tight mb-0.5 group/title">
                                                        {font.name} <ArrowUpRight size={25} className='mb-0.5 opacity-0 group-hover/title:opacity-100 -translate-x-1 translate-y-1 group-hover/title:translate-x-0 group-hover/title:translate-y-0 transition-all duration-300 ease-in-out' />
                                                    </Link>
                                                    {!hideLike ? (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={toggleFavorite}
                                                                aria-label={isFavorited ? `Remove ${font.name} from favorites` : `Add ${font.name} to favorites`}
                                                                className="flex items-center gap-1.5 mt-1 text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out group/like"
                                                            >
                                                                <Heart
                                                                    size={22}
                                                                    className={`transition-transform duration-300 ${isFavorited ? 'fill-pink-500 text-pink-500' : 'group-hover/like:scale-105'}`}
                                                                />
                                                                <span className="font-bold text-[16px]">{favoritesCount}</span>
                                                            </button>
                                                            {user && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setBoardModalOpen(true); }}
                                                                    aria-label={`Save ${font.name} to a board`}
                                                                    className="flex items-center gap-1.5 mt-1 px-2 text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out group/save"
                                                                >
                                                                    <Bookmark
                                                                        size={22}
                                                                        className="transition-transform duration-300 group-hover/save:scale-105"
                                                                    />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : <div></div>}
                                                </div>
                                                <p className="text-sm text-[rgb(var(--color-muted-foreground))] tracking-wide">
                                                    by <Link
                                                        to={`/designers/${encodeURIComponent(font.designer || '')}`}
                                                        state={{ from: location }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="hover:text-[rgb(var(--color-foreground))] hover:underline transition-colors duration-300 ease-in-out"
                                                    >
                                                        {font.designer}
                                                    </Link>
                                                </p>
                                            </div>

                                            {/* Bottom Row: Tags */}
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {displayTags.map((tag, i) => (
                                                    <Link
                                                        key={i}
                                                        to={`/fonts?categories=${tag}`}
                                                        className="bg-[rgb(var(--color-foreground)/0.05)] text-[rgb(var(--color-foreground)/0.6)] hover:bg-[rgb(var(--color-foreground)/0.9)] hover:text-[rgb(var(--color-background))] text-[10px] md:text-[11px] px-2.5 py-1.5 rounded-full tracking-wider font-normal font-inter-tight zuppercase transition-colors duration-300 ease-in-out">
                                                        {tag}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
                {/* Hover overlay gradient for collapsed state */}
                <div
                    // radius={50}
                    className={`absolute inset-0 flex flex-col justify-between items-end w-full p-5 rounded-4xl bg-linear-to-t from-[rgb(var(--color-card)/0.8)] via-transparent to-transparent [rgb(var(--color-card)/0.8)] z-10 opacity-0 transition-opacity duration-300 ease-in-out pointer-events-none ${isExpanded ? '' : 'group-hover:opacity-100'
                        }`}
                >
                    <div className='flex justify-end items-start gap-5'>
                        {user && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setBoardModalOpen(true); }}
                                aria-label={`Save ${font.name} to a board`}
                                className="relative flex items-center zbg-[rgb(var(--color-background)/0.5)] backdrop-blur-sm text-[rgb(var(--color-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out group/save p-2 rounded-full pointer-events-auto cursor-pointer"
                            >
                                <Bookmark size={20} className='relative z-10' />
                                <div className='absolute inset-0 bg-[rgb(var(--color-card)/0.3)] rounded-full blur-md zgroup-hover/save:blur-sm'></div>
                            </button>
                        )}
                    </div>
                    <div className='flex justify-between items-end gap-5 w-full'>
                        <div className="flex flex-col font-inter-tight tracking-wider">
                            <p className={`text-[rgb(var(--color-foreground))] font-medium text-base transition-transform duration-300 ${isExpanded ? 'translate-y-2' : 'translate-y-2 group-hover:translate-y-0'}`}>{font.name}</p>
                            <p className={`text-[rgb(var(--color-muted-foreground))] text-sm transition-transform duration-300 delay-75 ${isExpanded ? 'translate-y-2' : 'translate-y-2 group-hover:translate-y-0'}`}>{font.designer}</p>
                            
                            {/* <p className={`text-[rgb(var(--color-foreground))] text-sm transition-transform duration-300 delay-75 ${isExpanded ? 'translate-y-2' : 'translate-y-2 group-hover:translate-y-0'}`}>{font.name}</p>
                            <p className={`text-[rgb(var(--color-muted-foreground))] text-xs transition-transform duration-300 delay-75 ${isExpanded ? 'translate-y-2' : 'translate-y-2 group-hover:translate-y-0'}`}>by {font.designer}</p> */}
                        </div>
                        <div className="flex items-center justify-end gap-2 font-inter-tight tracking-wider">
                            {/* Likes & Save to Board */}
                            {!hideLike && (
                                <div className={`flex items-center gap-1 ${isExpanded ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                                    <button
                                        onClick={toggleFavorite}
                                        aria-label={isFavorited ? `Remove ${font.name} from favorites` : `Add ${font.name} to favorites`}
                                        className="flex items-center gap-1 text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out group/like cursor-pointer"
                                    >
                                        <Heart
                                            size={22}
                                            className={`transition-transform duration-300 ${isFavorited ? 'fill-pink-500 text-pink-500' : 'group-hover/like:scale-105'}`}
                                        />
                                        <span className="font-medium text-[16px]">{favoritesCount}</span>
                                    </button>
                                    {/* {user && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setBoardModalOpen(true); }}
                                        aria-label={`Save ${font.name} to a board`}
                                        className="flex items-center text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out group/save px-1"
                                    >
                                        <Bookmark
                                            size={22}
                                            className="transition-transform duration-300 group-hover/save:scale-105"
                                        />
                                    </button>
                                )} */}
                                </div>
                            )}

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
                                className={`text-xs pl-4 py-2 font-bold text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out ${isExpanded ? 'pointer-events-none' : 'pointer-events-auto'}`}
                            >
                                <ArrowUpRight size={22} />
                            </Link>
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

export default React.memo(FontCard)