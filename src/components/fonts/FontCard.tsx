import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowUpRight, Heart } from 'lucide-react';
import type { Font } from '../../types/font';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Toast } from '@capacitor/toast';

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
}

const AutoSizingText = ({
    text,
    fontId,
    isLoaded,
}: {
    text: string
    fontId: string
    isLoaded: boolean
}) => {

    const containerRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    if (!canvasRef.current && typeof document !== "undefined") {
        canvasRef.current = document.createElement("canvas")
    }

    const calculateFontSize = useCallback(() => {

        const container = containerRef.current
        const textEl = textRef.current
        const canvas = canvasRef.current

        if (!container || !textEl || !canvas || !isLoaded) return

        const rect = container.getBoundingClientRect()

        const width = rect.width - 40
        const height = rect.height - 40

        if (width <= 0 || height <= 0) return

        const ctx = canvas.getContext("2d")
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

        textEl.style.fontSize = `${fontSize}px`

    }, [text, fontId, isLoaded])

    useEffect(() => {
        calculateFontSize()
    }, [calculateFontSize])


    return (
        <div ref={containerRef} className="w-full relative flex items-center justify-center transition-all duration-300 px-5 pt-8 pb-6 min-h-50">
            <div
                ref={textRef}
                className="max-w-full text-card-foreground/80 group-hover:text-card-foreground/90 text-center leading-[1.2] transition-opacity duration-300 m-0 flex flex-col items-center justify-center p-2"
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
};

const loadedFontsCache = new Set<string>();

function FontCard({ font, viewMode = 'font', onClick, disableLink = false, isExpanded: propIsExpanded, onToggle, customText, hideLike = false }: FontCardProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isFontLoaded, setIsFontLoaded] = useState(() => font ? loadedFontsCache.has(font.id) : false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [localIsExpanded, setLocalIsExpanded] = useState(false);
    const [favoritesCount, setFavoritesCount] = useState(font?.favorites_count || 0);

    const isExpanded = propIsExpanded ?? localIsExpanded;

    useEffect(() => {
        if (!user || !font) return;
        const checkFavorite = async () => {
            const { data } = await supabase
                .from('favorites')
                .select('id')
                .eq('font_id', font.id)
                .eq('user_id', user.id)
                .single();
            if (data) setIsFavorited(true);
        };
        checkFavorite();
    }, [user, font]);

    useEffect(() => {
        setFavoritesCount(font?.favorites_count || 0);
    }, [font?.favorites_count]);


    useEffect(() => {
        if (!font) return;

        const getFontSource = () => {
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

            // 2. Fallback to Main Font Files (Standard Behavior)
            if (font.woff2_url) return { url: font.woff2_url, format: 'woff2' };
            if (font.woff_url) return { url: font.woff_url, format: 'woff' };
            if (font.ttf_url) return { url: font.ttf_url, format: 'truetype' };
            if (font.otf_url) return { url: font.otf_url, format: 'opentype' };

            // 3. Fallback to ANY variant if main is missing (Last Resort)
            if (font.font_variants && font.font_variants.length > 0) {
                const anyVariant = font.font_variants[0];
                if (anyVariant.woff2_url) return { url: anyVariant.woff2_url, format: 'woff2' };
                if (anyVariant.woff_url) return { url: anyVariant.woff_url, format: 'woff' };
                if (anyVariant.ttf_url) return { url: anyVariant.ttf_url, format: 'truetype' };
                if (anyVariant.otf_url) return { url: anyVariant.otf_url, format: 'opentype' };
            }

            return null;
        };

        const fontSource = getFontSource();
        if (!fontSource) return;

        const { url, format } = fontSource;
        const fontFamily = `font-${font.id}`;
        const source = `url(${url}) format('${format}')`;
        const fontFace = new FontFace(fontFamily, source);

        fontFace.load().then((loadedFace) => {
            document.fonts.add(loadedFace);
            loadedFontsCache.add(font.id);
            setIsFontLoaded(true);
        }).catch((err) => {
            console.error(`Failed to load font ${font.name}:`, err);
        });
    }, [font]);

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
        setIsFavorited(newStatus); // Optimistic update
        
        await Haptics.impact({ style: ImpactStyle.Medium });
        // We might want to update local favorite count state here too for immediate feedback, 
        // but for now we rely on the prop or a re-fetch if needed. 
        // Since `font` prop isn't updated instantly, the count won't change immediately unless we track it locally.
        // For simplicity in this step, we'll just toggle the icon state.

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
            setIsFavorited(!newStatus); // Revert on error
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
        <motion.div
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="group relative -mb-2 sm:mb-0 bg-[rgb(var(--color-foreground)/0.05)] rounded-4xl border border-[rgb(var(--color-foreground)/0.15)] transition-colors overflow-hidden flex flex-col"
            onClick={handleCardClick}
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
                        <div className="w-full relative flex items-center justify-center overflow-hidden transition-all duration-300 min-h-50">
                            <div className={`w-full h-full flex items-center justify-center transition-all duration-300 ease-in-out
                            ${isExpanded ? 'p-3' : 'p-0'}`}>
                                <img
                                    src={font.preview_image_url || font.gallery_images?.[0]}
                                    alt={font.name}
                                    className="w-full h-full object-cover rounded-3xl shadow-[0_0_10px_0_rgba(0,0,0,0.3)]"
                                />
                            </div>
                        </div>
                    ) : (
                        <AutoSizingText text={customText || font.name} fontId={font.id} isLoaded={isFontLoaded} />
                    )}
                </>

                {/* Expanded Content Section */}
                <div
                    style={{
                        height: isExpanded ? "auto" : 0,
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
                            <div className="bg-linear-to-t from-[rgb(var(--color-background))] to-[rgb(var(--color-background)/0)] w-full">
                                <div className="px-4 pb-4 pt-2 flex flex-col gap-3">
                                    {/* Top Row: Likes & View Button */}
                                    <div className="flex items-center justify-between w-full">
                                        {/* Likes */}
                                        {!hideLike ? (
                                            <button
                                                onClick={toggleFavorite}
                                                className="flex items-center gap-2 text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors group/like"
                                            >
                                                <Heart
                                                    size={22}
                                                    className={`transition-transform duration-300 ${isFavorited ? 'fill-pink-500 text-pink-500' : 'group-hover/like:scale-105'}`}
                                                />
                                                <span className="font-bold text-[16px]">{favoritesCount}</span>
                                            </button>
                                        ) : <div></div>}

                                        {/* View Font Button */}
                                        <Link
                                            to={`/fonts/${font.slug || font.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] text-xs px-4 py-2 rounded-full font-bold font-bricolage-grotesque hover:opacity-80 transition-colors"
                                        >
                                            View Details
                                        </Link>
                                    </div>

                                    <div className="w-full h-full">
                                        <p className="text-2xl font-bold tracking-tight mb-0.5">{font.name}</p>
                                        <p className="text-sm text-[rgb(var(--color-muted-foreground))] tracking-wide">
                                            by <Link
                                                to={`/designers/${encodeURIComponent(font.designer || '')}`}
                                                state={{ from: location }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="hover:text-[rgb(var(--color-foreground))] hover:underline transition-colors"
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
                                                className="bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-foreground)/0.05)] text-[rgb(var(--color-foreground)/0.6)] hover:bg-[rgb(var(--color-foreground)/0.9)] hover:text-[rgb(var(--color-background))] text-[10px] md:text-[11px] px-2.5 py-1 rounded-full tracking-wider font-medium font-bricolage-grotesque uppercase">
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

            {/* Hover overlay gradient for collapsed state */}
            <div
                className={`absolute inset-0 bg-linear-to-t from-[rgb(var(--color-background)/0.8)] via-transparent to-transparent flex justify-between items-end p-6 z-10 transition-opacity duration-300 pointer-events-none ${isExpanded ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                    }`}
            >
                <div className="flex flex-col">
                    <p className={`text-[rgb(var(--color-foreground))] font-bold text-lg transition-transform duration-300 ${isExpanded ? 'translate-y-2' : 'translate-y-2 group-hover:translate-y-0'}`}>{font.name}</p>
                    <p className={`text-[rgb(var(--color-muted-foreground))] text-xs transition-transform duration-300 delay-75 ${isExpanded ? 'translate-y-2' : 'translate-y-2 group-hover:translate-y-0'}`}>{font.designer}</p>
                </div>
                <div className="flex items-center justify-end gap-2">
                    {/* Likes */}
                    {!hideLike && (
                        <button
                            onClick={toggleFavorite}
                            className={`flex items-center gap-1 text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors group/like ${isExpanded ? 'pointer-events-none' : 'pointer-events-auto'}`}
                        >
                            <Heart
                                size={22}
                                className={`transition-transform duration-300 ${isFavorited ? 'fill-pink-500 text-pink-500' : 'group-hover/like:scale-105'}`}
                            />
                            <span className="font-bold text-[16px]">{favoritesCount}</span>
                        </button>
                    )}

                    {/* View Font Button */}
                    <Link
                        to={`/fonts/${font.slug || font.id}`}
                        onClick={(e) => {
                            if (!isExpanded) {
                                e.stopPropagation();
                            } else {
                                e.preventDefault();
                            }
                        }}
                        className={`text-xs px-4 py-2 font-bold text-[rgb(var(--color-foreground))] hover:opacity-80 transition-colors ${isExpanded ? 'pointer-events-none' : 'pointer-events-auto'}`}
                    >
                        <ArrowUpRight size={22} />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

export default React.memo(FontCard)