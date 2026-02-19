import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Font } from '../../types/font';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface FontCardProps {
    font: Font;
    viewMode?: 'font' | 'image';
    onClick?: (font: Font) => void;
    disableLink?: boolean;
    isExpanded?: boolean;
    onToggle?: () => void;
    customText?: string;
    index?: number;
}

export default function FontCard({ font, viewMode = 'font', onClick, disableLink = false, isExpanded: propIsExpanded, onToggle, customText, index = 0 }: FontCardProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isFontLoaded, setIsFontLoaded] = useState(false);
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
            if (font.font_variants && font.font_variants.length > 0) {
                const regular = font.font_variants.find(v => v.variant_name === 'Regular');
                if (regular) {
                    if (regular.woff2_url) return { url: regular.woff2_url, format: 'woff2' };
                    if (regular.woff_url) return { url: regular.woff_url, format: 'woff' };
                    if (regular.ttf_url) return { url: regular.ttf_url, format: 'truetype' };
                    if (regular.otf_url) return { url: regular.otf_url, format: 'opentype' };
                }
            }
            if (font.woff2_url) return { url: font.woff2_url, format: 'woff2' };
            if (font.woff_url) return { url: font.woff_url, format: 'woff' };
            if (font.ttf_url) return { url: font.ttf_url, format: 'truetype' };
            if (font.otf_url) return { url: font.otf_url, format: 'opentype' };

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
            setIsFontLoaded(true);
        }).catch((err) => {
            console.error(`Failed to load font ${font.name}:`, err);
        });
    }, [font]);

    if (!font) return null;

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
        setIsFavorited(newStatus);

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
            setIsFavorited(!newStatus);
            setFavoritesCount(prev => newStatus ? prev - 1 : prev + 1);
        }
    };

    const handleCardClick = () => {
        if (disableLink) {
            onClick?.(font);
            return;
        }
        if (onToggle) {
            onToggle();
        } else {
            setLocalIsExpanded(!localIsExpanded);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -5, transition: { duration: 0.2, delay: 0 } }}
            className={cn(
                "group relative mb-4 sm:mb-6 rounded-3xl border border-white/5 transition-colors duration-300 overflow-hidden flex flex-col bg-zinc-900/40 backdrop-blur-sm",
                isExpanded ? 'row-span-2 border-white/20 bg-zinc-900/60' : 'hover:border-white/20 hover:bg-zinc-900/60'
            )}
            onClick={handleCardClick}
        >
            <div className="flex flex-col h-full relative cursor-pointer">
                {/* Preview Section */}
                <div className="w-full relative flex items-center justify-center overflow-hidden grow">
                    {viewMode === 'image' && (font.preview_image_url || (font.gallery_images && font.gallery_images.length > 0)) ? (
                        <motion.div
                            layout
                            className={cn(
                                "w-full h-full flex items-center justify-center",
                                isExpanded ? 'p-4' : 'p-0'
                            )}
                        >
                            <img
                                src={font.preview_image_url || font.gallery_images?.[0]}
                                alt={font.name}
                                className={cn(
                                    "w-full h-full object-cover transition-transform duration-500",
                                    !isExpanded && "group-hover:scale-105",
                                    isExpanded ? "rounded-2xl shadow-2xl" : ""
                                )}
                            />
                        </motion.div>
                    ) : (
                        <p
                            className="p-6 text-6xl md:text-7xl text-white/90 text-center wrap-break-word w-full transition-transform duration-300 group-hover:scale-105"
                            style={{
                                fontFamily: isFontLoaded ? `'font-${font.id}'` : 'sans-serif',
                                opacity: isFontLoaded ? 1 : 0
                            }}
                        >
                            {customText || font.name}
                        </p>
                    )}
                </div>

                {/* Expanded Content Section */}
                <motion.div
                    layout
                    initial={false}
                    animate={{
                        height: isExpanded ? 'auto' : 0,
                        opacity: isExpanded ? 1 : 0,
                        paddingTop: isExpanded ? 20 : 0,
                        paddingBottom: isExpanded ? 20 : 0
                    }}
                    className="w-full px-5 bg-zinc-950/50 flex flex-col gap-3 overflow-hidden border-t border-white/5"
                >
                    {/* Top Row: Likes & View Button */}
                    <div className="flex items-center justify-between w-full">
                        {/* Likes */}
                        <button
                            onClick={toggleFavorite}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group/like"
                        >
                            <Heart
                                size={20}
                                className={cn(
                                    "transition-transform duration-300",
                                    isFavorited ? 'fill-pink-500 text-pink-500' : 'group-hover/like:scale-110'
                                )}
                            />
                            <span className="font-medium text-sm">{favoritesCount}</span>
                        </button>

                        {/* View Font Button */}
                        <Link
                            to={`/fonts/${font.slug || font.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white text-black text-xs px-4 py-2 rounded-full font-bold hover:bg-zinc-200 transition-colors"
                        >
                            View Details
                        </Link>
                    </div>

                    <div>
                        <p className="text-xl font-bold tracking-tight text-white mb-0.5">{font.name}</p>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">
                            by <Link
                                to={`/designers/${encodeURIComponent(font.designer || '')}`}
                                state={{ from: location }}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-white transition-colors"
                            >
                                {font.designer || 'Unknown'}
                            </Link>
                        </p>
                    </div>

                    {/* Bottom Row: Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        {displayTags.slice(0, 5).map((tag, i) => (
                            <div key={i} className="bg-white/5 border border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wide transition-colors">
                                {tag}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Hover overlay gradient for collapsed state */}
            {!isExpanded && (
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-end p-6">
                    <p className="text-white font-bold text-lg translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{font.name}</p>
                    <p className="text-zinc-400 text-xs translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">{font.designer}</p>
                </div>
            )}
        </motion.div>
    );
}
