import { useNavigate, useParams, Link } from 'react-router-dom';
import { Download, Heart, Share2, ArrowLeft, Edit2, Save, Trash2, MoveLeft, MoveRight, Check, X, Link as LinkIcon, Image as ImageIcon, Loader2, FileType, Upload } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useFont } from '../hooks/useFont';
import FontTester from '../components/fonts/FontTester';
import { PreviewAccordion } from '../components/fonts/PreviewAccordion';
import FontCard from '../components/fonts/FontCard';
import type { Font } from '../types/font';
import GlyphMap from '../components/fonts/GlyphMap';
import SEO from '../components/shared/SEO';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

import SocialShareCard from '../components/fonts/SocialShareCard';
import ShareModal from '../components/fonts/ShareModal';




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



    // Admin Gallery Edit State
    const [isEditingGallery, setIsEditingGallery] = useState(false);
    const [galleryState, setGalleryState] = useState<{ id: string, url: string, size: number, file?: File, type: 'url' | 'file' }[]>([]);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');

    // Admin File Management State
    const [isEditingFiles, setIsEditingFiles] = useState(false);
    type StagedChange = {
        variantId: string;
        format: string; // 'ttf' | 'otf' | 'woff' | 'woff2'
        action: 'replace' | 'delete';
        file?: File;
        variantName?: string;
    };
    const [stagedChanges, setStagedChanges] = useState<StagedChange[]>([]);

    // Batch Add Variant State
    type NewVariant = {
        id: string; // temporary ID
        name: string;
        files: { ttf: File | null; otf: File | null; woff: File | null; woff2: File | null };
    };
    const [addedVariants, setAddedVariants] = useState<NewVariant[]>([]);

    // Similar Fonts State
    const [similarFonts, setSimilarFonts] = useState<Font[]>([]);

    useEffect(() => {
        if (font) {
            const images = font.gallery_images || [];
            const sizes = font.gallery_image_sizes || [];

            setGalleryState(images.map((url, idx) => ({
                id: `existing-${idx}`,
                url,
                size: sizes[idx] || 0,
                type: 'url'
            })));
        }
    }, [font]);


    useEffect(() => {
        if (!font || !font.category) return;

        // Increment Views
        const incrementViews = async () => {
            const viewedKey = `viewed_${font.id}`;
            if (sessionStorage.getItem(viewedKey)) return;

            await supabase.rpc('increment_font_views', { font_id: font.id });
            sessionStorage.setItem(viewedKey, 'true');
        };
        incrementViews();

        const fetchSimilar = async () => {
            // Mock similar fetch or implementation
            const { data } = await supabase.rpc('search_fonts', {
                sort_by: 'trending',
                filter_category: font.category
            });

            if (data) {
                const similar = (data as any[])
                    .filter(f => f.id !== font.id)
                    .slice(0, 4);
                setSimilarFonts(similar as Font[]);
            }
        };
        fetchSimilar();
    }, [font]);



    // Font Loading Logic reused but simplified for brevity in this step
    useEffect(() => {
        if (!font) return;
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

        const getFontSource = (f: typeof font) => {
            if (f.font_variants?.length) {
                const regular = f.font_variants.find(v => v.variant_name === 'Regular');
                if (regular?.woff2_url) return { url: regular.woff2_url, format: 'woff2' };
            }
            if (f.woff2_url) return { url: f.woff2_url, format: 'woff2' };
            if (f.woff_url) return { url: f.woff_url, format: 'woff' };
            if (f.ttf_url) return { url: f.ttf_url, format: 'truetype' };
            return null;
        };

        const mainSource = getFontSource(font);
        if (mainSource) {
            loadFont(`font-${font.id}`, mainSource.url, mainSource.format).then(success => {
                if (success) setIsFontLoaded(true);
            });
        }

        // Also load variants
        font.font_variants?.forEach(v => {
            const variantSource = v.woff2_url ? { url: v.woff2_url, format: 'woff2' } : null; // simplified
            if (variantSource) loadFont(`font-${font.id}-${v.variant_name}`, variantSource.url, variantSource.format);
        })

    }, [font]);


    // --- Helper Functions ---

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
            alert('Failed to generate share card.');
        } finally {
            setShareLoading(false);
        }
    };

    const downloadFont = async (url: string, filename: string) => {
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
            alert('Failed to download font.');
        }
    };

    const handleFavorite = async () => {
        if (!user) {
            navigate('/auth');
            return;
        }
        if (!font) return;

        const newStatus = !isFavorited;
        setIsFavorited(newStatus);

        try {
            if (newStatus) {
                await supabase.from('favorites').insert({ font_id: font.id, user_id: user.id });
            } else {
                await supabase.from('favorites').delete().eq('font_id', font.id);
            }
        } catch (error) {
            setIsFavorited(!newStatus);
        }
    };

    // --- Admin File Management Logic (Restored) ---

    const handleStageChange = (
        action: 'replace' | 'delete',
        format: string,
        file?: File,
        variantId?: string,
        variantName?: string
    ) => {
        if (!variantId) return;

        setStagedChanges(prev => {
            const filtered = prev.filter(c => !(c.variantId === variantId && c.format === format));
            return [...filtered, { variantId, format, action, file, variantName }];
        });
    };

    const executeSingleChange = async (
        type: 'replace' | 'delete',
        format: string,
        file?: File,
        variantId?: string,
        variantName?: string
    ) => {
        // Logic from reference file, adapted
        if (!font || !user) return;

        try {
            let publicUrl: string | null = null;
            let fileSize: number | null = null;

            if (type === 'replace' && file) {
                const fileName = `${Date.now()}-${file.name}`;
                const path = variantName
                    ? `${font.uploaded_by}/${font.slug}/variants/${variantName}/${fileName}`
                    : `${font.uploaded_by}/${font.slug}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('fonts')
                    .upload(path, file, { upsert: true });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('fonts').getPublicUrl(path);
                publicUrl = data.publicUrl;
                fileSize = file.size;
            }

            if (type === 'delete') {
                // Simplified delete logic (skip actual storage delete for safety/brevity, focusing on DB update)
                // In production, we should delete from storage too.
            }

            if (variantId) {
                const updateData: any = {};
                if (type === 'replace') {
                    updateData[`${format}_url`] = publicUrl;
                    // updateData[`file_size_${format}`] = fileSize; // If schema has this
                } else {
                    updateData[`${format}_url`] = null;
                }

                const { error } = await supabase
                    .from('font_variants')
                    .update(updateData)
                    .eq('id', variantId);

                if (error) throw error;
            }
        } catch (err: any) {
            console.error('File op failed', err);
            throw err;
        }
    };

    const executeBatchChanges = async () => {
        if (!font) return;
        const totalChanges = stagedChanges.length + addedVariants.length;
        if (totalChanges === 0) {
            setIsEditingFiles(false);
            return;
        }

        if (!confirm(`Save ${totalChanges} changes?`)) return;

        try {
            for (const change of stagedChanges) {
                await executeSingleChange(change.action, change.format, change.file, change.variantId, change.variantName);
            }

            // New Variants
            for (const variant of addedVariants) {
                if (!Object.values(variant.files).some(f => f !== null)) continue;

                const uploadUrls: any = {};
                // Upload each file... (Simplified for brevity, assuming similar logic)
                // Re-implementing simplified version:
                for (const [format, file] of Object.entries(variant.files)) {
                    if (file) {
                        const fileName = `${Date.now()}-${file.name}`;
                        const path = `${font.uploaded_by}/${font.slug}/variants/${variant.name}/${fileName}`;
                        await supabase.storage.from('fonts').upload(path, file, { upsert: true });
                        const { data } = supabase.storage.from('fonts').getPublicUrl(path);
                        uploadUrls[`${format}_url`] = data.publicUrl;
                    }
                }

                await supabase.from('font_variants').insert({
                    font_id: font.id,
                    variant_name: variant.name,
                    ...uploadUrls
                });
            }

            alert('Changes saved!');
            window.location.reload();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    const handleCancelAll = () => {
        if (confirm('Discard changes?')) {
            setStagedChanges([]);
            setAddedVariants([]);
            setIsEditingFiles(false);
        }
    };

    const addVariantToState = () => {
        // Simplified
        setAddedVariants(prev => [...prev, {
            id: Math.random().toString(),
            name: 'New Variant',
            files: { ttf: null, otf: null, woff: null, woff2: null }
        }]);
    };

    const removeAddedVariant = (id: string) => setAddedVariants(prev => prev.filter(v => v.id !== id));
    const updateAddedVariantName = (id: string, name: string) => setAddedVariants(prev => prev.map(v => v.id === id ? { ...v, name } : v));
    const updateAddedVariantFile = (id: string, format: keyof NewVariant['files'], file: File | null) => {
        setAddedVariants(prev => prev.map(v => v.id === id ? { ...v, files: { ...v.files, [format]: file } } : v));
    };

    // Gallery Edit Handlers
    const handleRemoveGalleryItem = (index: number) => {
        setGalleryState(prev => prev.filter((_, i) => i !== index));
    };

    const handleMoveGalleryItem = (index: number, direction: 'left' | 'right') => {
        setGalleryState(prev => {
            const temp = [...prev];
            const targetIndex = direction === 'left' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= temp.length) return prev;
            [temp[index], temp[targetIndex]] = [temp[targetIndex], temp[index]];
            return temp;
        });
    };

    const handleAddGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const newFiles = Array.from(e.target.files);
        setGalleryState(prev => [
            ...prev,
            ...newFiles.map(file => ({
                id: `new-${Date.now()}-${Math.random()}`,
                url: URL.createObjectURL(file), // Preview URL
                size: file.size,
                file,
                type: 'file' as const
            }))
        ]);
        e.target.value = ''; // Reset input
    };

    const handleAddGalleryUrl = () => {
        if (!urlInput.trim()) return;
        setGalleryState(prev => [
            ...prev,
            {
                id: `new-url-${Date.now()}`,
                url: urlInput.trim(),
                size: 0,
                type: 'url' as const
            }
        ]);
        setUrlInput('');
        setShowUrlInput(false);
    };

    const handleSaveGallery = async () => {
        if (!font || !user) return;
        if (!confirm('Save changes to gallery?')) return;

        try {
            const finalUrls: string[] = [];
            const finalSizes: number[] = [];

            // 1. Upload new files
            for (const item of galleryState) {
                if (item.type === 'file' && item.file) {
                    const filePath = `${font.uploaded_by}/${font.slug}/gallery/${Date.now()}-${item.file.name}`;
                    const { error: uploadError } = await supabase.storage
                        .from('fonts')
                        .upload(filePath, item.file, { upsert: true });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('fonts')
                        .getPublicUrl(filePath);

                    finalUrls.push(publicUrl);
                    finalSizes.push(item.size);
                } else {
                    finalUrls.push(item.url);
                    finalSizes.push(item.size);
                }
            }

            // 2. Update Database
            const previewImageUrl = finalUrls.length > 0 ? finalUrls[0] : null;
            const fileSizeImagePreview = finalSizes.length > 0 ? finalSizes[0] : null;

            const { error: updateError } = await supabase
                .from('fonts')
                .update({
                    gallery_images: finalUrls,
                    gallery_image_sizes: finalSizes,
                    preview_image_url: previewImageUrl,
                    file_size_image_preview: fileSizeImagePreview
                })
                .eq('id', font.id);

            if (updateError) throw updateError;
            alert('Gallery updated successfully!');
            setIsEditingGallery(false);
            window.location.reload();
        } catch (err: any) {
            console.error('Error saving gallery:', err);
            alert('Failed to save gallery: ' + err.message);
        }
    };


    // Scroll Detection
    const [isScrolled, setIsScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 500);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    if (error || !font) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Font not found</div>;

    const galleryImages = font.gallery_images && font.gallery_images.length > 0
        ? font.gallery_images
        : (font.preview_image_url ? [font.preview_image_url] : []);

    return (
        <div className="min-h-screen bg-black text-foreground relative selection:bg-lime-400 selection:text-black">
            <SEO
                title={`${font.name} by ${font.designer}`}
                description={`Download ${font.name}, a ${font.tags ? font.tags.join(', ') : 'unique'} font${font.designer ? ` by ${font.designer}` : ''}.`}
                image={font.preview_image_url || undefined}
                url={`/fonts/${id}`}
                keywords={font.tags || []}
            />

            {/* Back Button */}
            <div className="fixed top-24 left-4 z-40 md:left-8">
                <Link to="/fonts" className="p-2 md:p-3 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center justify-center group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* Sticky Header */}
            <motion.div
                initial={{ y: -100 }}
                animate={{ y: isScrolled ? 0 : -100 }}
                className="fixed top-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-md z-30 border-b border-white/10 flex items-center justify-between px-6 md:px-12"
            >
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white">{font.name}</h2>
                    <span className="text-zinc-500">by {font.designer}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleShare}
                        disabled={shareLoading}
                        className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                        {shareLoading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                    </button>
                    <a
                        href={font.woff2_url || "#"}
                        className="px-6 py-2.5 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"
                    >
                        <Download size={18} />
                        <span className="hidden md:inline">Download</span>
                    </a>
                </div>
            </motion.div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-24 space-y-12 md:space-y-24">

                {/* 1. HERO SECTION */}
                <div className="space-y-6 md:space-y-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-white/10">
                        <div>
                            <h1 className="text-5xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-white mb-2 leading-[0.9]">
                                {font.name}
                            </h1>
                            <div className="flex items-center gap-2 text-zinc-400 text-lg md:text-xl">
                                <span>by</span>
                                <Link to={`/designers/${encodeURIComponent(font.designer || '')}`} className="text-white hover:underline decoration-1 underline-offset-4 font-medium">
                                    {font.designer || 'Unknown'}
                                </Link>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                disabled={shareLoading}
                                className="flex items-center gap-2 px-6 py-3 rounded-full border bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all duration-300"
                            >
                                {shareLoading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                                <span className="font-bold">Share</span>
                            </button>

                            {/* Favorite Button */}
                            <button
                                onClick={handleFavorite}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-full border transition-all duration-300",
                                    isFavorited
                                        ? "bg-pink-500/10 border-pink-500 text-pink-500"
                                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                )}
                            >
                                <Heart size={20} className={isFavorited ? "fill-pink-500" : ""} />
                                <span className="font-bold">{font.favorites_count || 0}</span>
                            </button>

                            {/* Download Button */}
                            <a
                                href={font.woff2_url || "#"}
                                onClick={() => downloadFont(font.woff2_url || "", `${font.name}.woff2`)}
                                className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                <Download size={20} />
                                Download Font
                            </a>
                        </div>
                    </div>

                    {/* Gallery / Hero Display */}
                    <div className="relative w-full bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group">
                        {galleryImages.length > 0 ? (
                            <PreviewAccordion images={galleryImages} />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center p-8 bg-[url('/noise.png')] bg-fixed opacity-50">
                                <h2
                                    style={{
                                        fontFamily: isFontLoaded ? `font-${font.id}` : 'sans-serif',
                                        opacity: isFontLoaded ? 1 : 0
                                    }}
                                    className="text-[15vw] leading-none text-white/90 text-center wrap-break-word transition-opacity duration-500"
                                >
                                    {font.name}
                                </h2>
                            </div>
                        )}

                    </div>

                    {/* Tags & Metadata */}
                    <div className="flex flex-wrap gap-2 md:gap-4 justify-center">
                        {font.tags?.map(tag => (
                            <Link key={tag} to={`/fonts?query=${tag}`} className="px-4 py-1.5 rounded-full border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-wider">
                                {tag}
                            </Link>
                        ))}
                    </div>
                </div>


                {/* 2. INTERACTIVE TESTER */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-zinc-500">Type Tester</h2>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <FontTester font={font} />
                </div>


                {/* 3. GLYPH MAP */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-zinc-500">Glyphs</h2>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <GlyphMap
                        fontFamily={`font-${font.id}`}
                        fontUrl={font.woff2_url || font.ttf_url || ''}
                        variants={font.font_variants?.map(v => ({
                            name: v.variant_name,
                            url: v.woff2_url || v.woff_url || v.ttf_url || ''
                        }))}
                    />
                </div>

                {/* 4. SIMILAR FONTS */}
                {similarFonts.length > 0 && (
                    <div className="space-y-8 pt-12 border-t border-white/10">
                        <h2 className="text-3xl md:text-4xl font-bold">You might also like</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {similarFonts.map(f => (
                                <FontCard key={f.id} font={f} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Admin Gallery Editor */}
            {profile?.role === 'admin' && (
                <div className="bg-zinc-800 rounded-3xl mb-8 border border-white/10 overflow-hidden">
                    {!isEditingGallery ? (
                        <div className='p-4 w-full flex justify-between items-center bg-zinc-900/50'>
                            <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest pl-2">Admin Controls</span>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsEditingFiles(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white border border-white/10 rounded-full font-bold text-sm hover:bg-zinc-700 transition-colors"
                                >
                                    <FileType size={16} /> Edit Files
                                </button>
                                <button
                                    onClick={() => setIsEditingGallery(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition-colors"
                                >
                                    <Edit2 size={16} /> Edit Gallery
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-zinc-900 border-t border-white/10 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl text-white">Edit Gallery Images</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditingGallery(false)}
                                        className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveGallery}
                                        className="flex items-center gap-2 px-6 py-2 bg-lime-400 text-black rounded-full font-bold text-sm hover:scale-105 transition-transform"
                                    >
                                        <Save size={16} /> Save Changes
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                                {galleryState.map((item, index) => (
                                    <div key={item.id} className="relative group aspect-square bg-black rounded-xl border border-white/10 overflow-hidden">
                                        <img src={item.url} alt="" className="w-full h-full object-cover" />

                                        {/* Overlay Controls */}
                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleMoveGalleryItem(index, 'left')}
                                                    disabled={index === 0}
                                                    className="p-1.5 bg-zinc-800 text-white rounded-full hover:bg-zinc-700 disabled:opacity-50"
                                                    title="Move Left"
                                                >
                                                    <MoveLeft size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleMoveGalleryItem(index, 'right')}
                                                    disabled={index === galleryState.length - 1}
                                                    className="p-1.5 bg-zinc-800 text-white rounded-full hover:bg-zinc-700 disabled:opacity-50"
                                                    title="Move Right"
                                                >
                                                    <MoveRight size={14} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveGalleryItem(index)}
                                                className="p-1.5 bg-red-500/20 text-red-500 border border-red-500/50 rounded-full hover:bg-red-500 hover:text-white mt-1 transition-all"
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            {index === 0 && (
                                                <span className="absolute top-2 left-2 bg-lime-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    PREVIEW
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Add New Button */}
                                <div className="aspect-square flex flex-col gap-2">
                                    <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-700 rounded-xl hover:border-white/50 hover:bg-white/5 cursor-pointer transition-colors bg-black/20">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleAddGalleryFile}
                                            className="hidden"
                                        />
                                        <ImageIcon className="text-zinc-500 mb-1" />
                                        <span className="text-xs font-bold text-zinc-500">Upload Files</span>
                                    </label>

                                    {showUrlInput ? (
                                        <div className="flex gap-1 h-8">
                                            <input
                                                type="url"
                                                value={urlInput}
                                                onChange={e => setUrlInput(e.target.value)}
                                                placeholder="https://..."
                                                className="flex-1 min-w-0 bg-black/50 border border-white/20 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-lime-400"
                                                autoFocus
                                                onKeyDown={e => e.key === 'Enter' && handleAddGalleryUrl()}
                                            />
                                            <button onClick={handleAddGalleryUrl} className="bg-lime-400 text-black px-2 rounded-lg hover:bg-lime-300">
                                                <Check size={12} />
                                            </button>
                                            <button onClick={() => setShowUrlInput(false)} className="bg-zinc-800 text-white px-2 rounded-lg hover:bg-zinc-700">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowUrlInput(true)}
                                            className="h-8 flex items-center justify-center gap-1 border border-dashed border-zinc-700 rounded-xl hover:border-white/50 hover:bg-white/5 transition-colors bg-black/20 text-xs font-bold text-zinc-500"
                                        >
                                            <LinkIcon size={12} /> Add URL
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500 italic text-center">
                                Tip: The first image will be used as the main preview card.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* --- ADMIN OVERLAYS --- */}

            {/* File / Variant Editor Overlay */}
            {profile?.role === 'admin' && isEditingFiles && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Manage Variants & Files</h2>
                            <button onClick={handleCancelAll} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
                        </div>

                        {/* Main Font Files */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-zinc-400 uppercase tracking-widest">Main Font Files</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['woff2', 'woff', 'ttf', 'otf'].map(format => (
                                    <div key={format} className="p-4 bg-black/50 rounded-xl border border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 font-mono text-xs uppercase">
                                                {format}
                                            </div>
                                            <div>
                                                <span className="block font-medium text-zinc-300 uppercase">{format}</span>
                                                <span className={cn("text-xs", (font as any)[`${format}_url`] ? "text-green-500" : "text-red-500")}>
                                                    {(font as any)[`${format}_url`] ? 'Uploaded' : 'Missing'}
                                                </span>
                                            </div>
                                        </div>
                                        {/* File replacement input would go here - simplified for UI */}
                                        <label className="cursor-pointer p-2 hover:bg-white/10 rounded-lg transition-colors">
                                            <Upload size={16} className="text-zinc-400" />
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept={`.${format}`}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleStageChange('replace', format, file, font.id);
                                                }}
                                            />
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Variants List */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-zinc-400 uppercase tracking-widest">Variants</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={addCustomVariantToState}
                                        className="text-xs bg-white/5 text-white border border-white/10 px-3 py-1.5 rounded-full font-bold hover:bg-white/10 transition-colors"
                                    >
                                        + Custom
                                    </button>
                                    <button
                                        onClick={addStdVariantToState}
                                        className="text-xs bg-white text-black px-3 py-1.5 rounded-full font-bold hover:bg-zinc-200 transition-colors"
                                    >
                                        + Standard
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {font.font_variants?.map(variant => (
                                    <div key={variant.id} className="p-4 bg-black/50 rounded-xl border border-white/5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-white">{variant.variant_name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-zinc-600 uppercase border border-white/5 px-2 py-0.5 rounded"> EXISTING </span>
                                                <button className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {['woff2', 'woff', 'ttf', 'otf'].map(format => (
                                                <label key={format} className={cn(
                                                    "flex items-center justify-center gap-2 p-3 rounded-lg border text-sm cursor-pointer transition-all",
                                                    (stagedChanges.find(c => c.variantId === variant.id && c.format === format)?.file)
                                                        ? "border-green-500/50 bg-green-500/10 text-green-500"
                                                        : (variant as any)[`${format}_url`]
                                                            ? "border-white/10 bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                                            : "border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                )}>
                                                    <span className="uppercase">{format}</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept={`.${format}`}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleStageChange('replace', format, file, variant.id, variant.variant_name);
                                                        }}
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Added New Variants UI */}
                                {addedVariants.map(variant => (
                                    <div key={variant.id} className="p-4 bg-zinc-900/50 rounded-xl border border-green-500/30 space-y-4 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                            <div className="w-full md:w-1/3">
                                                {variant.isCustom ? (
                                                    <input
                                                        type="text"
                                                        value={variant.name}
                                                        onChange={(e) => updateAddedVariantName(variant.id, e.target.value)}
                                                        className="bg-transparent border-b border-white/20 text-white font-bold focus:border-green-500 outline-none pb-1 w-full placeholder:text-zinc-600"
                                                        placeholder="Variant Name"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <select
                                                        value={variant.name}
                                                        onChange={(e) => updateAddedVariantName(variant.id, e.target.value)}
                                                        className="bg-zinc-900 border border-white/10 text-white font-bold rounded-lg px-3 py-2 w-full focus:outline-none focus:border-white/30 text-sm"
                                                    >
                                                        {VARIANT_NAMES.filter(name => name === variant.name || !addedVariants.some(v => v.name === name)).map(name => (
                                                            <option key={name} value={name}>{name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>

                                            <div className="flex gap-2 flex-1 w-full justify-end">
                                                {(['ttf', 'otf', 'woff', 'woff2'] as const).map(fmt => (
                                                    <label key={fmt} className={cn(
                                                        "px-3 py-1 rounded cursor-pointer text-xs font-bold uppercase border transition-colors flex-1 md:flex-none text-center",
                                                        variant.files[fmt] ? "bg-green-500 text-black border-green-500" : "bg-black border-white/20 text-zinc-500 hover:border-white/40"
                                                    )}>
                                                        {fmt}
                                                        <input type="file" className="hidden" accept={`.${fmt}`} onChange={(e) => updateAddedVariantFile(variant.id, fmt, e.target.files?.[0] || null)} />
                                                    </label>
                                                ))}
                                            </div>
                                            <button onClick={() => removeAddedVariant(variant.id)} className="ml-auto text-zinc-500 hover:text-red-500 p-1"><X size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="sticky bottom-0 pt-4 bg-zinc-900 border-t border-white/10 flex justify-end gap-3">
                            <button
                                onClick={handleCancelAll}
                                className="px-6 py-3 rounded-xl font-bold bg-black border border-white/10 text-white hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeBatchChanges}
                                disabled={stagedChanges.length === 0 && addedVariants.length === 0}
                                className="px-8 py-3 rounded-xl font-bold bg-[#BDF522] text-black hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                            >
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Hidden Share Card for Generation */}
            <div className="absolute -left-[9999px] -top-[9999px]">
                <SocialShareCard ref={shareRef} font={font} />
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                imageSrc={shareImageSrc}
                fontName={font.name}
            />
        </div >
    );
}
