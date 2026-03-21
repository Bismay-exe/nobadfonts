import { useNavigate, useParams, Link } from 'react-router-dom';
import { Download, Heart, Share2, Image as ImageIcon, Edit2, Loader2, Layout, Type, Trash2, FileType } from 'lucide-react';




import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import SocialShareCard from '../components/fonts/SocialShareCard';
import ShareModal from '../components/fonts/ShareModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useFont } from '../hooks/useFont';
import FontTester from '../components/fonts/FontTester';
import { PreviewAccordion } from '../components/fonts/PreviewAccordion';
import FontCard from '../components/fonts/FontCard';
import type { Font } from '../types/font';
import GlyphMap from '../components/fonts/GlyphMap';
import { generateDescription, generateHeaderTagline, generateFooterTagline } from '../utils/fontDescriptionGenerator';
import SEO from '../components/shared/SEO';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Toast } from '@capacitor/toast';
import GalleryEditor from '../components/fonts/GalleryEditor';
import FileManager from '../components/fonts/FileManager';
import VariantList from '../components/fonts/VariantList';

export default function FontDetails() {

    const { id } = useParams();
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const { font, loading, error, isFavorited, setIsFavorited } = useFont(id);
    const [isFontLoaded, setIsFontLoaded] = useState(false);

    // Social Share State
    const [shareLoading, setShareLoading] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareImageSrc, setShareImageSrc] = useState<string | null>(null);
    const shareRef = useRef<HTMLDivElement>(null);

    const [variantPreviewText, setVariantPreviewText] = useState('');
    const [variantPreviewSize, setVariantPreviewSize] = useState(48);

    // Admin Gallery/File Edit State
    const [isEditingGallery, setIsEditingGallery] = useState(false);
    const [isEditingFiles, setIsEditingFiles] = useState(false);



    // View Mode State
    const [viewMode, setViewMode] = useState<'font' | 'image'>('font');

    // Similar Fonts State
    const [similarFonts, setSimilarFonts] = useState<Font[]>([]);



    useEffect(() => {
        if (!font || !font.category) return;

        // Increment Views
        const incrementViews = async () => {
            // Basic check to avoid counting own views or hot-reload double counts
            // In production, we'd use session storage or similar to debounce, 
            // but for now a simple on-mount call is fine.
            const viewedKey = `viewed_${font.id}`;
            if (sessionStorage.getItem(viewedKey)) return;

            await supabase.rpc('increment_font_views', { font_id: font.id });
            sessionStorage.setItem(viewedKey, 'true');
        };
        incrementViews();

        const fetchSimilar = async () => {
            const { data } = await supabase.rpc('search_fonts', {
                sort_by: 'trending',
                filter_category: font.category
            });

            if (data) {
                // client-side filter to exclude current font and take top 4
                const similar = (data as any[])
                    .filter(f => f.id !== font.id)
                    .slice(0, 4);
                setSimilarFonts(similar as Font[]);
            }
        };
        fetchSimilar();
    }, [font]);

    // Removed redundant state and handlers - now in components/fonts/GalleryEditor.tsx and FileManager.tsx




    useEffect(() => {
        if (!font) return;

        // Helper to load font with format hint
        const loadFont = async (family: string, url: string, format?: string) => {
            try {
                const source = `url(${url})` + (format ? ` format('${format}')` : '');
                const fontFace = new FontFace(family, source);
                const loadedFace = await fontFace.load();
                document.fonts.add(loadedFace);
                return true;
            } catch (err) {
                console.error(`Failed to load font ${family}:`, err);
                return false;
            }
        };

        // Load main font
        const getFontSource = (f: typeof font) => {
            // 1. Try to find 'Regular' in variants
            if (f.font_variants && f.font_variants.length > 0) {
                const regular = f.font_variants.find(v => v.variant_name === 'Regular');
                if (regular) {
                    if (regular.woff2_url) return { url: regular.woff2_url, format: 'woff2' };
                    if (regular.woff_url) return { url: regular.woff_url, format: 'woff' };
                    if (regular.ttf_url) return { url: regular.ttf_url, format: 'truetype' };
                    if (regular.otf_url) return { url: regular.otf_url, format: 'opentype' };
                }
            }

            // 2. Legacy Main File Fallback
            if (f.woff2_url) return { url: f.woff2_url, format: 'woff2' };
            if (f.woff_url) return { url: f.woff_url, format: 'woff' };
            if (f.ttf_url) return { url: f.ttf_url, format: 'truetype' };
            if (f.otf_url) return { url: f.otf_url, format: 'opentype' };

            // 3. Fallback to ANY variant
            if (f.font_variants && f.font_variants.length > 0) {
                const anyVariant = f.font_variants[0];
                if (anyVariant.woff2_url) return { url: anyVariant.woff2_url, format: 'woff2' };
                if (anyVariant.woff_url) return { url: anyVariant.woff_url, format: 'woff' };
                if (anyVariant.ttf_url) return { url: anyVariant.ttf_url, format: 'truetype' };
                if (anyVariant.otf_url) return { url: anyVariant.otf_url, format: 'opentype' };
            }

            return null;
        };

        const mainSource = getFontSource(font);
        if (mainSource) {
            loadFont(`font-${font.id}`, mainSource.url, mainSource.format).then(success => {
                if (success) setIsFontLoaded(true);
            });
        }

        // Load variant fonts
        font.font_variants?.forEach(variant => {
            // Variants use the same structure, so we can reuse logic if types match, 
            // but variant type might be slightly different. Manual check is safe.
            let variantSource = null;
            if (variant.woff2_url) variantSource = { url: variant.woff2_url, format: 'woff2' };
            else if (variant.woff_url) variantSource = { url: variant.woff_url, format: 'woff' };
            else if (variant.ttf_url) variantSource = { url: variant.ttf_url, format: 'truetype' };
            else if (variant.otf_url) variantSource = { url: variant.otf_url, format: 'opentype' };

            if (variantSource) {
                const variantFamily = `font-${font.id}-${variant.variant_name}`;
                loadFont(variantFamily, variantSource.url, variantSource.format);
            }
        });
    }, [font]);

    const handleFavorite = async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
        if (!user) {
            navigate('/auth');
            return;
        }
        if (!font) return;

        // Optimistic update
        const newStatus = !isFavorited;
        setIsFavorited(newStatus);

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
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error updating favorite:', error);
            setIsFavorited(!newStatus); // Revert on error
            await Toast.show({ text: 'Failed to update favorites', duration: 'short' });
        }
    };

    const handleDeleteFont = async () => {
        if (!font) return;
        if (!confirm('Are you sure you want to delete this font? This cannot be undone.')) return;

        try {
            // 1. Collect all file paths
            const filePaths: string[] = [];

            // Helper to extract path from URL
            // URL format: https://[project].supabase.co/storage/v1/object/public/fonts/[user_id]/[slug]/[filename]
            // Storage path: [user_id]/[slug]/[filename]
            const getPathFromUrl = (url: string) => {
                try {
                    const urlObj = new URL(url);
                    const pathParts = urlObj.pathname.split('/public/fonts/');
                    if (pathParts.length > 1) {
                        return decodeURIComponent(pathParts[1]);
                    }
                    return null;
                } catch (e) {
                    console.error("Invalid URL:", url);
                    return null;
                }
            };

            // Main font files
            (['woff2_url', 'woff_url', 'ttf_url', 'otf_url', 'zip_url'] as const).forEach(key => {
                const url = font[key as keyof typeof font] as string | null;
                if (url) {
                    const path = getPathFromUrl(url);
                    if (path) filePaths.push(path);
                }
            });

            // Images
            if (font.preview_image_url) {
                const path = getPathFromUrl(font.preview_image_url);
                if (path) filePaths.push(path);
            }
            if (font.gallery_images && Array.isArray(font.gallery_images)) {
                font.gallery_images.forEach(url => {
                    const path = getPathFromUrl(url);
                    if (path) filePaths.push(path);
                });
            }

            // Variant files
            if (font.font_variants && Array.isArray(font.font_variants)) {
                font.font_variants.forEach(variant => {
                    (['woff2_url', 'woff_url', 'ttf_url', 'otf_url'] as const).forEach(key => {
                        const url = variant[key as keyof typeof variant] as string | null;
                        if (url) {
                            const path = getPathFromUrl(url);
                            if (path) filePaths.push(path);
                        }
                    });
                });
            }

            console.log("Deleting files:", filePaths);

            // 2. Delete files from storage
            if (filePaths.length > 0) {
                const { error: storageError } = await supabase.storage
                    .from('fonts')
                    .remove(filePaths);

                if (storageError) {
                    console.error("Storage delete error:", storageError);
                }
            }

            // 3. Delete database record
            const { error } = await supabase.from('fonts').delete().eq('id', font.id);
            if (error) throw error;

            await Toast.show({ text: 'Font and all associated files deleted successfully.', duration: 'short' });
            navigate('/');

        } catch (err: any) {
            console.error('Delete failed:', err);
            await Toast.show({ text: 'Error deleting font: ' + err.message, duration: 'long' });
        }
    };

    const handleShare = async () => {
        if (!shareRef.current || !font) return;
        setShareLoading(true);

        try {
            // Wait a moment for fonts/styles to be ready in the hidden element
            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await toPng(shareRef.current, {
                quality: 1.0,
                pixelRatio: 2,
                width: 1200,
                height: 630,
            });

            setShareImageSrc(dataUrl);
            setShowShareModal(true);
        } catch (err) {
            console.error('Failed to generate image', err);
            await Toast.show({ text: 'Failed to generate share card.', duration: 'short' });
        } finally {
            setShareLoading(false);
        }
    };

    const downloadFont = async (url: string, filename: string) => {
        await Haptics.impact({ style: ImpactStyle.Medium });
        if (!font || !url) return;

        try {
            // Record download if user is logged in
            if (user) {
                await supabase.from('downloads').insert({
                    font_id: font.id,
                    user_id: user.id
                }).then(({ error }) => {
                    if (error) console.error("Failed to track download", error);
                });
            }

            // Trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Download check failed:', error);
            await Toast.show({ text: 'Failed to download font.', duration: 'short' });
        }
    };

    // Scroll Detection
    const [isScrolled, setIsScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 500);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);




    if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;
    if (error || !font) return <div className="container mx-auto px-4 py-8">Font not found</div>;

    const galleryImages = font.gallery_images && font.gallery_images.length > 0
        ? font.gallery_images
        : (font.preview_image_url ? [font.preview_image_url] : []);


    const imageCount = galleryImages.length > 0 ? galleryImages.length : 1;
    // Desktop (Row): Width_total = (11 + N) * unit, Height = 8 * unit (for 3:2 expanded) -> AR = (11+N)/8
    const desktopAr = (11 + imageCount) / 8;
    // Mobile (Col): Width = 18 * unit (for 3:2 expanded), Height_total = (11 + N) * unit -> AR = 18/(11+N)
    const mobileAr = 18 / (11 + imageCount);

    return (
        <div className="min-h-screen bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] relative selection:bg-[rgb(var(--color-highlight))] selection:text-[rgb(var(--color-background))]">
            <SEO
                title={`${font.name} by ${font.designer}`}
                description={`Download ${font.name}, a ${font.tags ? font.tags.join(', ') : 'unique'} font${font.designer ? ` by ${font.designer}` : ''}. Available now on NoBadFonts.`}
                image={font.preview_image_url || undefined}
                url={`/fonts/${id}`}
                keywords={font.tags || []}
            />

            {/* Sticky Header */}
            <motion.div
                initial={{ y: -100 }}
                animate={{ y: isScrolled ? 0 : -200 }}
                className="fixed top-[calc(3.55rem+env(safe-area-inset-top))] md:top-[calc(4.5rem+env(safe-area-inset-top))] left-0 right-0 w-full bg-[rgb(var(--color-background)/0.5)] backdrop-blur-3xl z-30 border-b border-[rgb(var(--color-foreground)/0.1)] flex items-center justify-center py-2 px-6 md:px-10"
            >
                <div className="max-w-480 w-full mx-auto flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-0">
                        <h2 className="text-xl font-bold text-[rgb(var(--color-foreground))] pr-2 leading-none">{font.name}</h2>
                        <span className="text-[rgb(var(--color-muted-foreground))]">by {font.designer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            disabled={shareLoading}
                            className="p-2.5 rounded-full bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] hover:opacity-80 transition-all active:scale-95"
                        >
                            {shareLoading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                        </button>
                        <a
                            href={font.woff2_url || "#"}
                            onClick={() => downloadFont(font.woff2_url || "", `${font.name}.woff2`)}
                            className="px-4 md:px-6 py-2.5 md:py-2.5 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-full font-bold hover:opacity-80 transition-colors flex items-center gap-2"
                        >
                            <Download size={18} />
                            <span className="hidden md:inline">Download</span>
                        </a>
                    </div>
                </div>
            </motion.div>

            <div className="max-w-480 mx-auto pt-0 sm:pt-8 space-y-6 md:space-y-12">

                {/* Font Info Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-4">
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h1 className="text-5xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-[rgb(var(--color-foreground))] mb-2 leading-[1.1]">
                                {font.name}
                            </h1>
                            <div className="flex items-center gap-2 text-[rgb(var(--color-muted-foreground))] text-lg md:text-xl">
                                <span>by</span>
                                <Link to={`/designers/${encodeURIComponent(font.designer || '')}`} className="text-[rgb(var(--color-foreground))] hover:underline decoration-1 underline-offset-4 font-medium">
                                    {font.designer || 'Unknown'}
                                </Link>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {/* Favorite Button */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={handleFavorite}
                                className={cn(
                                    "flex items-center gap-2 px-4 md:px-6 py-3 rounded-full border transition-all duration-300",
                                    isFavorited
                                        ? "bg-[rgb(var(--color-accent)/0.1)] border-[rgb(var(--color-accent))] text-[rgb(var(--color-accent))]"
                                        : "bg-[rgb(var(--color-foreground)/0.05)] border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] hover:opacity-80"
                                )}
                            >
                                <Heart size={20} className={isFavorited ? "fill-[rgb(var(--color-accent))]" : ""} />
                                <span className="font-bold">{font.favorites_count || 0}</span>
                            </motion.button>

                            {/* Share Button */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={handleShare}
                                disabled={shareLoading}
                                className="flex items-center gap-2 px-4 md:px-6 py-3 rounded-full border bg-[rgb(var(--color-foreground)/0.05)] border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] hover:opacity-80 transition-all duration-300"
                            >
                                {shareLoading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                                <span className="font-bold hidden md:inline">Share</span>
                            </motion.button>

                            {/* Download Button */}
                            <motion.a
                                whileTap={{ scale: 0.9 }}
                                href={font.woff2_url || "#"}
                                onClick={() => downloadFont(font.woff2_url || "", `${font.name}.woff2`)}
                                className="flex items-center gap-2 px-4 md:px-8 py-3 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-full font-bold hover:opacity-80 transition-colors shadow-[0_0_20px_rgba(var(--color-foreground),0.2)]"
                            >
                                <Download size={20} />
                                <span className="font-bold  md:inline">Download Font</span>
                            </motion.a>
                        </div>
                    </div>
                </div>

                {/* Gallery / Hero Display */}
                <div className="relative w-full overflow-hidden border border-none rounded-4xl shadow-2xl group" style={{ '--mobile-ar': mobileAr, '--desktop-ar': desktopAr } as React.CSSProperties}>
                    {galleryImages.length > 0 ? (
                        <div className={galleryImages.length > 1 ? `relative w-full aspect-(--mobile-ar) md:aspect-21/7` : `relative w-full`}>
                            <PreviewAccordion images={galleryImages} />
                        </div>
                    ) : (
                        <div className="relative w-full h-full min-h-[60vh] bg-[rgb(var(--color-card))] rounded-4xl flex items-center justify-center p-8">
                            <h2
                                style={{
                                    fontFamily: isFontLoaded ? `font-${font.id}` : 'sans-serif',
                                    opacity: isFontLoaded ? 1 : 0
                                }}
                                className="text-[15vw] leading-none text-[rgb(var(--color-foreground)/0.9)] text-center wrap-break-word transition-opacity duration-500 drop-shadow-[0_0_30px_rgba(var(--color-foreground),0.2)]"
                            >
                                {font.name}
                            </h2>
                        </div>
                    )}
                </div>

                {/* Tags & Metadata */}
                <div className="flex flex-wrap gap-2 md:gap-4 justify-center">
                    {font.tags?.map(tag => (
                        <Link key={tag} to={`/fonts?categories=${tag}`} className="px-4 py-1.5 rounded-full border border-[rgb(var(--color-foreground)/0.1)] text-sm text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-foreground)/0.9)] transition-colors uppercase tracking-wider">
                            {tag}
                        </Link>
                    ))}
                </div>

                {/* Rest of the content will go here */}

                {/* Admin Gallery Editor */}
                {profile?.role === 'admin' && (
                    <div className="bg-[rgb(var(--color-muted))] rounded-3xl mb-8 border border-[rgb(var(--color-foreground)/0.1)] overflow-hidden mt-8">
                        {!isEditingGallery ? (
                            <div className='p-4 w-full flex justify-between items-center bg-[rgb(var(--color-card)/0.5)]'>
                                <span className="text-[rgb(var(--color-muted-foreground))] font-mono text-xs uppercase tracking-widest pl-2">Admin Controls</span>
                                <div className="flex gap-2 md:gap-4">
                                    <button
                                        onClick={handleDeleteFont}
                                        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[rgb(var(--color-destructive)/0.1)] text-[rgb(var(--color-destructive))] border border-[rgb(var(--color-destructive)/0.2)] rounded-full font-bold text-sm hover:opacity-80 transition-colors"
                                    >
                                        <Trash2 size={16} /> <span className="hidden md:inline">Delete Font</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            const section = document.getElementById('download-section');
                                            if (section) section.scrollIntoView({ behavior: 'smooth' });
                                            setIsEditingFiles(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--color-muted))] text-[rgb(var(--color-foreground))] border border-[rgb(var(--color-foreground)/0.1)] rounded-full font-bold text-sm hover:opacity-80 transition-colors"
                                    >
                                        <FileType size={16} /> Edit Files
                                    </button>
                                    <button
                                        onClick={() => setIsEditingGallery(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-full font-bold text-sm hover:opacity-80 transition-colors"
                                    >
                                        <Edit2 size={16} /> Edit Gallery
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <GalleryEditor
                                font={font}
                                user={user}
                                initialImages={font.gallery_images || []}
                                initialSizes={font.gallery_image_sizes || []}
                                onClose={() => setIsEditingGallery(false)}
                                onSaveSuccess={() => {
                                    setIsEditingGallery(false);
                                    window.location.reload();
                                }}
                            />

                        )}
                    </div>
                )}


                {/* Hidden Share Card for Generation */}
                <div className="absolute -left-2499.75 -top-2499.75">
                    <SocialShareCard ref={shareRef} font={font} />
                </div>

                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    imageSrc={shareImageSrc}
                    fontName={font.name}
                />


                {/* 2. VARIANT PREVIEWS */}
                <div id="preview-section" className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-[rgb(var(--color-muted-foreground))]">Variant Previews</h2>
                        <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-4xl border border-[rgb(var(--color-foreground)/0.1)] bg-[rgb(var(--color-foreground)/0.05)]" >
                        <input
                            type="text"
                            value={variantPreviewText}
                            onChange={(e) => setVariantPreviewText(e.target.value)}
                            placeholder="Type something to preview..."
                            className="w-full md:w-1/2 text-xl bg-transparent border-b border-[rgb(var(--color-foreground)/0.2)] focus:border-[rgb(var(--color-foreground)/0.4)] outline-none px-2 py-2 transition-colors placeholder:text-[rgb(var(--color-muted-foreground))] text-[rgb(var(--color-foreground)/0.85)]"
                        />
                        <div className="flex items-center gap-4 w-full md:w-auto bg-[rgb(var(--color-background)/0.5)] px-6 py-3 rounded-full border border-[rgb(var(--color-foreground)/0.1)] shadow-inner">
                            <span className="text-xs font-bold uppercase text-[rgb(var(--color-foreground)/0.8)] tracking-wider">Size</span>
                            <input
                                type="range"
                                min="16"
                                max="150"
                                value={variantPreviewSize}
                                onChange={(e) => setVariantPreviewSize(Number(e.target.value))}
                                className="w-full md:w-48 accent-[rgb(var(--color-foreground))] cursor-pointer"
                            />
                            <span className="font-mono font-bold text-sm w-12 text-right text-[rgb(var(--color-foreground)/0.8)]">{variantPreviewSize}px</span>
                        </div>
                    </div>
                    <VariantList 
                        font={font} 
                        profile={profile} 
                        variantPreviewText={variantPreviewText} 
                        variantPreviewSize={variantPreviewSize} 
                        downloadFont={downloadFont}
                    />
                </div>

                {/* 3. DESCRIPTION & FEATURES */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-[rgb(var(--color-muted-foreground))]">About this Font</h2>
                        <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <section className="md:border-r border-[rgb(var(--color-foreground)/0.1)] p-2 md:p-4 h-full">

                                {/* Header Tagline */}
                                <h3 className="text-2xl font-bold mb-6 leading-tight text-[rgb(var(--color-foreground))]">
                                    {generateHeaderTagline(font)}
                                </h3>

                                <div className="prose prose-lg prose-invert max-w-none text-[rgb(var(--color-foreground)/0.7)]">
                                    <p className="whitespace-pre-line leading-relaxed text-lg">
                                        {generateDescription(font)}
                                    </p>

                                    {/* Footer Tagline */}
                                    <p className="mt-8 font-serif italic text-2xl text-[rgb(var(--color-foreground))] border-l-4 border-[rgb(var(--color-highlight))] pl-6 py-2 bg-[rgb(var(--color-foreground)/0.05)] rounded-r-2xl">
                                        "{generateFooterTagline(font)}"
                                    </p>

                                    <p className="mt-8 text-[rgb(var(--color-muted-foreground))] italic text-sm">
                                        Having a great day,<br />
                                        <span className="font-bold not-italic text-[rgb(var(--color-foreground))] text-base">{font.designer || 'The Designer'}</span>
                                    </p>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* 4. INTERACTIVE TESTER */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-[rgb(var(--color-muted-foreground))]">Type Tester</h2>
                        <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
                    </div>

                    <FontTester font={font} />
                </div>

                {/* 5. EMBED & STATS */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-[rgb(var(--color-muted-foreground))]">Integration</h2>
                        <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <section id="embed-section" className="bg-[rgb(var(--color-card,var(--color-muted)))] border border-[rgb(var(--color-foreground)/0.05)] rounded-[2.5rem] overflow-hidden scroll-mt-24 h-full">
                            <div className="p-8 space-y-8">

                                {/* Option 1: Head Link */}
                                <div>
                                    <h3 className="font-bold text-lg mb-3 text-[rgb(var(--color-foreground))]">1. Add to the head section of web page</h3>
                                    <div className="bg-[rgb(var(--color-background)/0.5)] rounded-2xl border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground)/0.7)] text-sm font-mono p-5 overflow-x-auto whitespace-pre shadow-inner">
                                        {`<link href="${window.location.origin}/css/${font.slug}" rel="stylesheet">`}
                                    </div>
                                </div>

                                {/* Option 2: Import */}
                                <div>
                                    <h3 className="font-bold text-lg mb-3 text-[rgb(var(--color-foreground))]">OR Using @import CSS directive</h3>
                                    <div className="bg-[rgb(var(--color-background)/0.5)] rounded-2xl border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground)/0.7)] text-sm font-mono p-5 overflow-x-auto whitespace-pre shadow-inner">
                                        {`@import url(${window.location.origin}/css/${font.slug});`}
                                    </div>
                                </div>

                                {/* Option 3: Font Face */}
                                <div>
                                    <h3 className="font-bold text-lg mb-3 text-[rgb(var(--color-foreground))]">OR Use font-face declaration</h3>
                                    <div className="bg-[rgb(var(--color-background)/0.5)] rounded-2xl border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-highlight))] text-sm font-mono p-5 overflow-x-auto whitespace-pre shadow-inner">
                                        {(() => {
                                            const generateFontFace = (name: string, weight: number, style: string, urls: any) => {
                                                const sources = [];
                                                if (urls.eot) sources.push(`url("${urls.eot}") format("embedded-opentype")`);
                                                if (urls.woff2) sources.push(`url("${urls.woff2}") format("woff2")`);
                                                if (urls.woff) sources.push(`url("${urls.woff}") format("woff")`);
                                                if (urls.ttf) sources.push(`url("${urls.ttf}") format("truetype")`);
                                                if (urls.otf) sources.push(`url("${urls.otf}") format("opentype")`);
                                                if (urls.svg) sources.push(`url("${urls.svg}") format("svg")`);

                                                if (sources.length === 0) return '';

                                                return `@font-face {
font-family: "${name}";
src: ${sources.join(',\n         ')};
font-weight: ${weight};
font-style: ${style};
}`;
                                            };

                                            const variants = font.font_variants || [];
                                            // Include main font if no variants or separately?
                                            // If variants exist, they usually cover the main font.
                                            // Let's iterate all variants.

                                            const blocks = variants.map(v => {
                                                const name = font.name;
                                                // Infer weight/style
                                                const lower = v.variant_name.toLowerCase();
                                                let weight = 400;
                                                if (lower.includes('thin')) weight = 100;
                                                else if (lower.includes('extra light')) weight = 200;
                                                else if (lower.includes('light')) weight = 300;
                                                else if (lower.includes('regular')) weight = 400;
                                                else if (lower.includes('medium')) weight = 500;
                                                else if (lower.includes('semi bold')) weight = 600;
                                                else if (lower.includes('bold')) weight = 700;
                                                else if (lower.includes('extra bold')) weight = 800;
                                                else if (lower.includes('black') || lower.includes('heavy')) weight = 900;

                                                const style = lower.includes('italic') ? 'italic' : 'normal';

                                                const urls = {
                                                    woff2: v.woff2_url,
                                                    woff: v.woff_url,
                                                    ttf: v.ttf_url,
                                                    otf: v.otf_url
                                                };

                                                return generateFontFace(name, weight, style, urls);
                                            }).filter(Boolean);

                                            // Fallback if no variants but main files exist
                                            if (blocks.length === 0 && (font.woff2_url || font.ttf_url)) {
                                                blocks.push(generateFontFace(font.name, 400, 'normal', {
                                                    woff2: font.woff2_url,
                                                    woff: font.woff_url,
                                                    ttf: font.ttf_url,
                                                    otf: font.otf_url
                                                }));
                                            }

                                            return blocks.join('\n\n');
                                        })()}
                                    </div>
                                </div>

                                {/* Section 2: CSS Rules */}
                                <div>
                                    <h3 className="font-bold text-lg mb-3 text-[rgb(var(--color-foreground))]">2. CSS rules to specify fonts</h3>
                                    <div className="bg-[rgb(var(--color-background)/0.5)] rounded-2xl border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-highlight))] text-sm font-mono p-5 overflow-x-auto whitespace-pre shadow-inner">
                                        {`font-family: "${font.name}", sans-serif;`}
                                    </div>
                                </div>

                            </div>
                        </section>

                        <div className="space-y-6">
                            <div className="bg-[rgb(var(--color-card,var(--color-muted)))] border border-[rgb(var(--color-foreground)/0.05)] rounded-[2.5rem] p-8 h-full">
                                <h3 className="font-bold text-2xl mb-6 text-[rgb(var(--color-foreground))] uppercase tracking-wider">Font Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-[rgb(var(--color-foreground)/0.05)] p-4 rounded-xl">
                                        <span className="text-[rgb(var(--color-muted-foreground))] font-medium">Downloads</span>
                                        <span className="font-bold text-[rgb(var(--color-foreground))] text-xl">{font.downloads?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-[rgb(var(--color-foreground)/0.05)] p-4 rounded-xl">
                                        <span className="text-[rgb(var(--color-muted-foreground))] font-medium">Favorites</span>
                                        <span className="font-bold text-[rgb(var(--color-foreground))] text-xl capitalize">{font.favorites_count?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. GLYPH MAP */}
                <div className="space-y-8 pt-12 border-t border-[rgb(var(--color-foreground)/0.1)] mt-12">
                    <div className="flex justify-between items-center bg-[rgb(var(--color-muted)/0.05)] p-4 rounded-2xl border border-[rgb(var(--color-border))]">
                        <h2 className="text-2xl font-bold text-[rgb(var(--color-foreground))] tracking-tight flex items-center gap-3 px-4">
                            <Layout className="text-[rgb(var(--color-accent))]" />
                            Glyph Map
                        </h2>
                        <span className="text-xs font-bold text-[rgb(var(--color-muted-foreground))] bg-[rgb(var(--color-background))] px-3 py-1 rounded-full border border-[rgb(var(--color-border))] uppercase tracking-widest">
                            256 Characters
                        </span>
                    </div>

                    {(() => {
                        let mainFontUrl = font.otf_url || font.ttf_url || font.woff_url || font.woff2_url || '';
                        if (!mainFontUrl && font.font_variants && font.font_variants.length > 0) {
                            const v = font.font_variants[0];
                            mainFontUrl = v.otf_url || v.ttf_url || v.woff_url || v.woff2_url || '';
                        }
                        return (
                            <GlyphMap
                                fontFamily={isFontLoaded ? `font-${font.id}` : 'sans-serif'}
                                fontUrl={mainFontUrl}
                                variants={font.font_variants?.map(v => ({
                                    name: v.variant_name,
                                    url: v.otf_url || v.ttf_url || v.woff_url || v.woff2_url || ''
                                })).filter(v => v.url !== '')}
                            />
                        );
                    })()}
                </div>



                {/* 7. SIMILAR FONTS */}
                {
                    similarFonts.length > 0 && (
                        <div className="space-y-8 pt-12 border-t border-[rgb(var(--color-foreground)/0.1)] mt-12">
                            <div className="flex justify-between items-center gap-2">
                                <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--color-foreground))] tracking-tight">You might also like</h2>

                                <div className="flex items-center">
                                    <div className="flex bg-[rgb(var(--color-foreground)/0.05)] backdrop-blur-md h-10 p-1 w-auto rounded-full border border-[rgb(var(--color-foreground)/0.1)]">
                                        <button
                                            onClick={() => setViewMode('font')}
                                            className={`p-1.5 aspect-square rounded-full transition-all ${viewMode === 'font'
                                                ? 'bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))] shadow-[0_0_15px_rgba(var(--color-highlight),0.3)]'
                                                : 'text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]'
                                                }`}
                                            title="Font View"
                                        >
                                            <Type size={16} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('image')}
                                            className={`p-1.5 aspect-square rounded-full transition-all ${viewMode === 'image'
                                                ? 'bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))] shadow-[0_0_15px_rgba(var(--color-highlight),0.3)]'
                                                : 'text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]'
                                                }`}
                                            title="Image View"
                                        >
                                            <ImageIcon size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {similarFonts.map(f => (
                                    <FontCard key={f.id} font={f} viewMode={viewMode} />
                                ))}
                            </div>
                        </div>
                    )
                }
            </div >

            {/* --- ADMIN OVERLAYS --- */}

            {/* File / Variant Editor Overlay */}
            {profile?.role === 'admin' && isEditingFiles && (
                <FileManager
                    font={font}
                    user={user}
                    onClose={() => setIsEditingFiles(false)}
                    onSaveSuccess={() => {
                        setIsEditingFiles(false);
                        window.location.reload();
                    }}
                />
            )}
        </div >
    );
}


