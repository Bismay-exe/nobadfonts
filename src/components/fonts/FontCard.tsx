import { Link, useNavigate } from 'react-router-dom';
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
}

export default function FontCard({ font, viewMode = 'font', onClick, disableLink = false }: FontCardProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isFontLoaded, setIsFontLoaded] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);

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
            alert('Failed to update favorites');
        }
    };

    const CardContent = (
        <>
            {/* Content Area: Font Preview or Image */}
            {viewMode === 'image' && (font.preview_image_url || (font.gallery_images && font.gallery_images.length > 0)) ? (
                <div className="w-full h-full flex items-center justify-center bg-[#EEEFEB] border border-[#1C1D1E]">
                    <img
                        src={font.preview_image_url || font.gallery_images?.[0]}
                        alt={font.name}
                        className="w-full h-full object-cover opacity-100 transition-opacity duration-300"
                    />
                </div>
            ) : (
                // Fallback to text preview
                <p
                    className="p-6 text-8xl md:text-8xl text-[#1C1D1E] text-center wrap-break-word w-full transition-opacity duration-300"
                    style={{
                        fontFamily: isFontLoaded ? `'font-${font.id}'` : 'sans-serif',
                        opacity: isFontLoaded ? 1 : 0
                    }}
                >
                    {font.name}
                </p>
            )}

            <div className="absolute bottom-2 left-2 transition-opacity opacity-0 group-hover:opacity-100">
                <button
                    className={`p-4 rounded-full transition-colors pointer-events-auto ${isFavorited
                        ? 'text-red-500 hover:text-red-700'
                        : 'text-black hover:text-red-500'
                        }`}
                    onClick={toggleFavorite}
                >
                    <Heart size={24} fill={isFavorited ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Info Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/30 to-transparent p-4 grow flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <div>
                    <div className="hidden justify-between items-start mb-1 gap-2">
                        <div className="flex flex-wrap gap-1">
                            {displayTags.map((tag, i) => (
                                <div key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                                    {tag}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <div className="group relative rounded-4xl border border-black hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
            {disableLink ? (
                <div
                    onClick={() => onClick?.(font)}
                    className="h-full w-full bg-[#EEEFEB] flex items-center justify-center relative overflow-hidden group/preview cursor-pointer"
                >
                    {CardContent}
                </div>
            ) : (
                <Link to={`/fonts/${font.slug || font.id}`} className="h-full w-full bg-[#EEEFEB] flex items-center justify-center relative overflow-hidden group/preview">
                    {CardContent}
                </Link>
            )}
        </div>
    );
}
