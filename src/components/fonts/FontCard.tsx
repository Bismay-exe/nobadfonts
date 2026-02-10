import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Font } from '../../types/font';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface FontCardProps {
    font: Font;
    viewMode?: 'font' | 'image';
    onClick?: (font: Font) => void;
    disableLink?: boolean;
    isExpanded?: boolean;
    onToggle?: () => void;
    customText?: string;
}

export default function FontCard({ font, viewMode = 'font', onClick, disableLink = false, isExpanded: propIsExpanded, onToggle, customText }: FontCardProps) {
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
            alert('Failed to update favorites');
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
    };

    return (
        <div
            className={`group relative rounded-4xl border border-black hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col bg-[#EEEFEB] ${isExpanded ? 'row-span-2' : ''}`}
            onClick={handleCardClick}
        >
            <div className="flex flex-col h-full relative cursor-pointer">
                {/* Preview Section - Fixed Height or ratio? 
                    In original, it was h-full. Now we want it to be the main part.
                    We keeping h-64 as a base or letting it fill?
                    Masonry usually expects items to define height.
                    Let's use a min-height for the preview part.
                */}
                <div className={`w-full relative flex items-center justify-center overflow-hidden transition-all duration-300`}>
                    {viewMode === 'image' && (font.preview_image_url || (font.gallery_images && font.gallery_images.length > 0)) ? (
                        <div className={`w-full h-full flex items-center justify-center transition-all duration-300 ease-in-out
                        ${isExpanded ? 'p-2' : 'p-0'}`}>
                            <img
                                src={font.preview_image_url || font.gallery_images?.[0]}
                                alt={font.name}
                                className="w-full h-full object-cover rounded-3xl shadow-[0_0_10px_0_rgba(0,0,0,0.3)]"
                            />
                        </div>
                    ) : (
                        <p
                            className="p-6 text-8xl md:text-8xl text-[#1C1D1E] text-center wrap-break-word w-full"
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
                <div className={`
                    w-full px-4 bg-[#EEEFEB] flex flex-col gap-3 transition-all duration-500 ease-in-out overflow-hidden
                    ${isExpanded ? 'max-h-96 opacity-100 py-4' : 'max-h-0 opacity-0 py-0'}
                `}>
                    {/* Top Row: Likes & View Button */}
                    <div className="flex items-center justify-between w-full -my-2">
                        {/* Likes */}
                        <button
                            onClick={toggleFavorite}
                            className="flex items-center gap-1 text-[#1C1D1E] transition-colors group/like"
                        >
                            <Heart
                                size={22}
                                className={`transition-transform duration-300 ${isFavorited ? 'fill-[#ff0000] text-[#ff0000]' : 'group-hover/like:scale-105'}`}
                            />
                            <span className="font-bold text-[16px]">{favoritesCount}</span>

                        </button>

                        {/* View Font Button */}
                        <Link
                            to={`/fonts/${font.slug || font.id}`}
                            onClick={(e) => e.stopPropagation()} // Prevent card toggle when clicking link
                            className="bg-[#1C1D1E] text-[#EEEFEB] text-xs px-4 py-2 rounded-full font-medium hover:bg-[#3b3b3b] transition-colors"
                        >
                            View Font
                        </Link>
                    </div>

                    <div className="w-full h-full">
                        <p className="text-2xl font-bold tracking-tight mb-1">{font.name}</p>
                        <p className="text-sm text-neutral-500 tracking-wide">
                            by <Link
                                to={`/designers/${encodeURIComponent(font.designer || '')}`}
                                state={{ from: location }}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-[#1C1D1E] hover:underline transition-colors"
                            >
                                {font.designer}
                            </Link>
                        </p>
                    </div>

                    {/* Bottom Row: Tags */}
                    <div className="flex flex-wrap gap-1 mt-1">
                        {displayTags.slice().map((tag, i) => (
                            <div key={i} className="bg-neutral-300 border border-black/0 text-neutral-600 hover:bg-[#1C1D1E] hover:text-[#EEEFEB] font-bold text-[11px] px-2 py-1 rounded-full capitalize">
                                {tag}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
