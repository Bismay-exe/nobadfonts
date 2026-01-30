import { useNavigate, useParams } from 'react-router-dom';
import { Download, Heart, Share2, ArrowLeft, Check, X, Link as LinkIcon, Image as ImageIcon, MoveLeft, MoveRight, Save, Trash2, Edit2, Upload, Plus, Type } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useFont } from '../hooks/useFont';
import FontTester from '../components/fonts/FontTester';
import { PreviewAccordion } from '../components/fonts/PreviewAccordion';
import FontCard from '../components/fonts/FontCard';
import type { Font } from '../types/font';

export default function FontDetails() {
    const { id } = useParams();
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const { font, loading, error, isFavorited, setIsFavorited } = useFont(id);
    const [copied, setCopied] = useState(false);
    const [isFontLoaded, setIsFontLoaded] = useState(false);

    const [variantPreviewText, setVariantPreviewText] = useState('');
    const [variantPreviewSize, setVariantPreviewSize] = useState(48);

    // Admin Gallery Edit State
    const [isEditingGallery, setIsEditingGallery] = useState(false);
    const [galleryState, setGalleryState] = useState<{ id: string, url: string, size: number, file?: File, type: 'url' | 'file' }[]>([]);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');

    // View Mode State
    const [viewMode, setViewMode] = useState<'font' | 'image'>('font');

    // Similar Fonts State
    const [similarFonts, setSimilarFonts] = useState<Font[]>([]);

    useEffect(() => {
        if (!font || !font.category) return;

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

    useEffect(() => {
        if (font) {
            // Initialize gallery state from font data
            const images = font.gallery_images || [];
            const sizes = font.gallery_image_sizes || [];

            setGalleryState(images.map((url, idx) => ({
                id: `existing-${idx}`,
                url,
                size: sizes[idx] || 0,
                type: 'url' // Existing are treated as URLs effectively unless replaced
            })));
        }
    }, [font]);

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

            // 3. Cleanup removed files (Optional but good practice)
            // Ideally we compare 'font.gallery_images' with 'finalUrls' and delete missing ones FROM STORAGE.
            // For now, let's just save the state. Storage cleanup is tricky if we don't want to accidentally delete shared files (though specific enough path).
            // Let's implement storage cleanup later or as a separate 'maintenance' task to avoid complex logic here for now.
            // Actually, the user asked for "delete which images to keep and which to delete".
            // So I should try to delete removed items from storage if they are not in the new list.

            const originalImages = font.gallery_images || [];
            const deletedImages = originalImages.filter(url => !finalUrls.includes(url));

            if (deletedImages.length > 0) {
                const getPathFromUrl = (url: string) => {
                    try {
                        const urlObj = new URL(url);
                        const pathParts = urlObj.pathname.split('/public/fonts/');
                        if (pathParts.length > 1) return decodeURIComponent(pathParts[1]);
                        return null;
                    } catch { return null; }
                };

                const pathsToDelete = deletedImages.map(getPathFromUrl).filter(p => p !== null) as string[];
                if (pathsToDelete.length > 0) {
                    await supabase.storage.from('fonts').remove(pathsToDelete);
                }
            }

            alert('Gallery updated successfully!');
            setIsEditingGallery(false);
            window.location.reload(); // Simple reload to refresh data

        } catch (err: any) {
            console.error('Error saving gallery:', err);
            alert('Failed to save gallery: ' + err.message);
        }
    };

    // Admin File Management State
    const [isEditingFiles, setIsEditingFiles] = useState(false);

    const handleFileOp = async (
        type: 'replace' | 'delete',
        format: string,
        file?: File,
        variantId?: string,
        variantName?: string
    ) => {
        if (!font || !user) return;
        if (type === 'delete' && !confirm(`Are you sure you want to delete this ${format.toUpperCase()} file?`)) return;

        try {
            let path = '';
            let publicUrl: string | null = null;
            let fileSize: number | null = null;

            if (type === 'replace' && file) {
                // Upload logic
                const fileName = `${Date.now()}-${file.name}`;
                if (variantName) {
                    path = `${font.uploaded_by}/${font.slug}/variants/${variantName}/${fileName}`;
                } else {
                    path = `${font.uploaded_by}/${font.slug}/${fileName}`;
                }

                const { error: uploadError } = await supabase.storage
                    .from('fonts')
                    .upload(path, file, { upsert: true });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('fonts').getPublicUrl(path);
                publicUrl = data.publicUrl;
                fileSize = file.size;
            }

            if (type === 'delete') {
                // Get URL to delete from storage
                let urlToDelete: string | null = null;
                if (variantId) {
                    // Find variant
                    const variant = font.font_variants?.find(v => v.id === variantId);
                    if (variant) urlToDelete = variant[`${format}_url` as keyof typeof variant] as string;
                } else {
                    urlToDelete = font[`${format}_url` as keyof typeof font] as string;
                }

                if (urlToDelete) {
                    try {
                        const urlObj = new URL(urlToDelete);
                        const pathParts = urlObj.pathname.split('/public/fonts/');
                        if (pathParts.length > 1) {
                            const params = decodeURIComponent(pathParts[1]);
                            await supabase.storage.from('fonts').remove([params]);
                        }
                    } catch (e) {
                        console.error("Error parsing URL for deletion:", e);
                    }
                }
            }

            // DB Update Logic
            if (variantId) {
                // Update Variant
                const updateData: any = {};
                updateData[`${format}_url`] = publicUrl;

                const { error } = await supabase
                    .from('font_variants')
                    .update(updateData)
                    .eq('id', variantId);

                if (error) throw error;
            } else {
                // Update Main Font
                const updateData: any = {};
                updateData[`${format}_url`] = publicUrl;
                updateData[`file_size_${format}`] = fileSize;

                const { error } = await supabase
                    .from('fonts')
                    .update(updateData)
                    .eq('id', font.id);

                if (error) throw error;
            }

            alert(`File ${type === 'replace' ? 'uploaded' : 'deleted'} successfully!`);
            window.location.reload();

        } catch (err: any) {
            console.error('File operation failed:', err);
            alert('Operation failed: ' + err.message);
        }
    };

    // Add Variant State
    const [isAddingVariant, setIsAddingVariant] = useState(false);
    const [newVariantName, setNewVariantName] = useState('');
    const [newVariantFile, setNewVariantFile] = useState<File | null>(null);
    const [newVariantFormat, setNewVariantFormat] = useState<'woff2' | 'woff' | 'ttf' | 'otf'>('woff2');

    const handleAddVariant = async () => {
        if (!font || !user || !newVariantName || !newVariantFile) return;

        try {
            const fileName = `${Date.now()}-${newVariantFile.name}`;
            const path = `${font.uploaded_by}/${font.slug}/variants/${newVariantName}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('fonts')
                .upload(path, newVariantFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('fonts').getPublicUrl(path);
            const publicUrl = data.publicUrl;

            const insertData: any = {
                font_id: font.id,
                variant_name: newVariantName,
            };
            insertData[`${newVariantFormat}_url`] = publicUrl;

            const { error: insertError } = await supabase
                .from('font_variants')
                .insert(insertData);

            if (insertError) throw insertError;

            alert('Variant added successfully!');
            window.location.reload();
        } catch (err: any) {
            console.error('Add variant failed:', err);
            alert('Failed to add variant: ' + err.message);
        }
    };

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
            if (f.woff2_url) return { url: f.woff2_url, format: 'woff2' };
            if (f.woff_url) return { url: f.woff_url, format: 'woff' };
            if (f.ttf_url) return { url: f.ttf_url, format: 'truetype' };
            if (f.otf_url) return { url: f.otf_url, format: 'opentype' };
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
                    .eq('user_id', user.id);
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error updating favorite:', error);
            setIsFavorited(!newStatus); // Revert on error
            alert('Failed to update favorites');
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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

    if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;
    if (error || !font) return <div className="container mx-auto px-4 py-8">Font not found</div>;

    // Determine available formats with smart deduplication
    const rawFormats = [
        { key: 'ttf_url', label: 'TTF', type: 'ttf' as const },
        { key: 'otf_url', label: 'OTF', type: 'otf' as const },
        { key: 'woff_url', label: 'WOFF', type: 'woff' as const },
        { key: 'woff2_url', label: 'WOFF2', type: 'woff2' as const },
    ];

    const availableFormats = rawFormats.filter(f => {
        const url = font[f.key as keyof typeof font];
        if (!url || typeof url !== 'string') return false;

        const lowerUrl = url.toLowerCase();

        // Check if this URL is duplicated in other fields
        // This handles the case where legacy data might have the same URL in multiple columns
        const isDuplicated = rawFormats.some(other =>
            other.key !== f.key && font[other.key as keyof typeof font] === url
        );

        if (isDuplicated) {
            // If duplicated, ONLY show if the extension matches this format
            // e.g. if ttf_url == woff2_url == ".../file.ttf", only show for TTF
            if (lowerUrl.includes(`.${f.type}`)) return true;

            // If strictly matches another format's extension, hide this one
            // e.g. we are checking WOFF2 button, but URL has .ttf, hide it
            const matchesOther = rawFormats.some(other =>
                other.key !== f.key && lowerUrl.includes(`.${other.type}`)
            );
            if (matchesOther) return false;

            // If no extension match found at all (ambiguous), show it to be safe
            return true;
        }

        // Determine available formats with smart deduplication
        // ... (logic above) ...
        return true;
    });

    const displayTags = (font.tags && Array.isArray(font.tags) && font.tags.length > 0)
        ? font.tags
        : (font.category ? [font.category] : []);

    const galleryImages = font.gallery_images && font.gallery_images.length > 0
        ? font.gallery_images
        : (font.preview_image_url ? [font.preview_image_url] : []);


    const imageCount = galleryImages.length > 0 ? galleryImages.length : 1;
    // Desktop (Row): Width_total = (11 + N) * unit, Height = 8 * unit (for 3:2 expanded) -> AR = (11+N)/8
    const desktopAr = (11 + imageCount) / 8;
    // Mobile (Col): Width = 18 * unit (for 3:2 expanded), Height_total = (11 + N) * unit -> AR = 18/(11+N)
    const mobileAr = 18 / (11 + imageCount);

    return (
        <div className="mx-auto">
            <div
                style={{
                    '--mobile-ar': mobileAr,
                    '--desktop-ar': desktopAr,
                } as React.CSSProperties}
                className={`relative w-full bg-white rounded-3xl border-2 border-black flex justify-center items-center overflow-hidden group ${galleryImages.length > 0 ? 'aspect-(--mobile-ar) md:aspect-(--desktop-ar)' : 'h-[66vw] md:h-100'}`}
            >
                {galleryImages.length > 0 && (
                    <div className="absolute inset-0 z-20">
                        <PreviewAccordion images={galleryImages} />
                    </div>
                )}

                {/* Fallback height container if no images, or overlay content */}
                <div className={`relative z-10 w-full h-full flex justify-center items-center ${galleryImages.length > 0 ? 'pointer-events-none' : ''}`}>
                    <h1
                        style={{
                            fontFamily: isFontLoaded ? `font-${font.id}` : 'sans-serif',
                            opacity: isFontLoaded ? 1 : 0
                        }}
                        className={`text-6xl md:text-9xl text-center transition-all duration-300 drop-shadow-lg ${galleryImages.length > 0 ? 'text-white' : 'text-gray-900'}`}
                    >
                        {font.name}
                    </h1>
                </div>
            </div>

            {/* Admin Gallery Editor */}
            {profile?.role === 'admin' && (
                <div className="mt-4 mb-8">
                    {!isEditingGallery ? (
                        <button
                            onClick={() => setIsEditingGallery(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-colors"
                        >
                            <Edit2 size={16} /> Edit Gallery
                        </button>
                    ) : (
                        <div className="bg-gray-50 border-2 border-black rounded-3xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">Edit Gallery Images</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditingGallery(false)}
                                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-black"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveGallery}
                                        className="flex items-center gap-2 px-6 py-2 bg-[#BDF522] text-black border-2 border-black rounded-full font-bold text-sm hover:scale-105 transition-transform"
                                    >
                                        <Save size={16} /> Save Changes
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                                {galleryState.map((item, index) => (
                                    <div key={item.id} className="relative group aspect-square bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                                        <img src={item.url} alt="" className="w-full h-full object-cover" />

                                        {/* Overlay Controls */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleMoveGalleryItem(index, 'left')}
                                                    disabled={index === 0}
                                                    className="p-1.5 bg-white rounded-full hover:bg-gray-100 disabled:opacity-50"
                                                    title="Move Left"
                                                >
                                                    <MoveLeft size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleMoveGalleryItem(index, 'right')}
                                                    disabled={index === galleryState.length - 1}
                                                    className="p-1.5 bg-white rounded-full hover:bg-gray-100 disabled:opacity-50"
                                                    title="Move Right"
                                                >
                                                    <MoveRight size={14} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveGalleryItem(index)}
                                                className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 mt-1"
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            {index === 0 && (
                                                <span className="absolute top-2 left-2 bg-[#BDF522] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    PREVIEW
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Add New Button */}
                                <div className="aspect-square flex flex-col gap-2">
                                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl hover:border-black hover:bg-white cursor-pointer transition-colors bg-white">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleAddGalleryFile}
                                            className="hidden"
                                        />
                                        <ImageIcon className="text-gray-400 mb-1" />
                                        <span className="text-xs font-bold text-gray-500">Upload Files</span>
                                    </label>

                                    {showUrlInput ? (
                                        <div className="flex gap-1 h-8">
                                            <input
                                                type="url"
                                                value={urlInput}
                                                onChange={e => setUrlInput(e.target.value)}
                                                placeholder="https://..."
                                                className="flex-1 min-w-0 border-2 border-black rounded-lg px-2 text-xs focus:outline-none"
                                                autoFocus
                                                onKeyDown={e => e.key === 'Enter' && handleAddGalleryUrl()}
                                            />
                                            <button onClick={handleAddGalleryUrl} className="bg-black text-white px-2 rounded-lg">
                                                <Check size={12} />
                                            </button>
                                            <button onClick={() => setShowUrlInput(false)} className="bg-gray-200 px-2 rounded-lg">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowUrlInput(true)}
                                            className="h-8 flex items-center justify-center gap-1 border-2 border-dashed border-gray-300 rounded-xl hover:border-black hover:bg-white transition-colors bg-white text-xs font-bold text-gray-500"
                                        >
                                            <LinkIcon size={12} /> Add URL
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 italic text-center">
                                Tip: The first image will be used as the main preview card.
                            </p>
                        </div>
                    )}
                </div>
            )}


            {/* Header */}
            <div className="relative justify-between items-start md:items-center">
                <div className='flex flex-col items-start justify-end w-full md:w-auto bg-[#BDF522] rounded-3xl border-2 border-black p-4'>
                    {/* Back Button */}
                    {/* Back Button */}
                    <button
                        onClick={() => {
                            if (window.history.length > 1) {
                                navigate(-1);
                            } else {
                                navigate('/fonts');
                            }
                        }}
                        className="absolute top-3 left-3 inline-flex items-center bg-black px-3 py-2 rounded-full font-semibold text-gray-50 hover:text-gray-900 mb-8 transition-colors"
                    >
                        <ArrowLeft size={18} className="mr-2" />
                        Back to Catalog
                    </button>
                    <h1
                        className="text-5xl text-gray-900 pt-15 transition-opacity duration-300"
                        style={{
                            fontFamily: isFontLoaded ? `font-${font.id}` : 'sans-serif',
                            opacity: isFontLoaded ? 1 : 0
                        }}
                    >
                        {font.name}
                    </h1>
                    <p className="text-xl font-mono text-gray-500">by {font.designer}</p>
                    
                    {/* Admin Actions */}
                    {profile?.role === 'admin' && (
                        <div className="mb-4 space-y-2 w-full p-2 bg-red-50 border border-red-200 rounded-2xl">
                            <p className="text-xs font-bold text-red-500 uppercase text-center mb-1">Admin Controls</p>
                            <button
                                onClick={async () => {
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
                                                // We continue to delete the DB record even if storage fails partial, 
                                                // or should we stop? Usually stopping is safer, but orphaned files are better than broken app state.
                                                // Let's warn but proceed, or maybe ask? For now, proceed.
                                            }
                                        }

                                        // 3. Delete database record
                                        const { error } = await supabase.from('fonts').delete().eq('id', font.id);
                                        if (error) throw error;

                                        alert('Font and all associated files deleted successfully.');
                                        navigate('/');

                                    } catch (err: any) {
                                        console.error('Delete failed:', err);
                                        alert('Error deleting font: ' + err.message);
                                    }
                                }}
                                className="inline-flex items-center bg-red-500 px-3 py-2 rounded-full font-semibold text-gray-50 hover:text-gray-900 mb-8 transition-colors"
                            >
                                Delete Font
                            </button>
                        </div>
                    )}

                    {/* Format Badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {font.font_variants?.map(variant => (
                            <span key={variant.id} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-black border text-white">
                                {variant.variant_name}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-start justify-end h-full w-auto bg-white rounded-3xl border-2 border-black p-4">
                    <div className="flex flex-wrap gap-1">
                        {displayTags.map((tag, i) => (
                            <div key={i} className="bg-gray-900 text-gray-300 text-xs px-3 py-2 rounded-full font-medium">
                                {tag}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex md:flex-col justify-between">
                    {/* Admin Actions */}
                    {profile?.role === 'admin' && (
                        <div className="mb-4 space-y-2 w-full p-2 bg-red-50 border border-red-200 rounded-2xl">
                            <p className="text-xs font-bold text-red-500 uppercase text-center mb-1">Admin Controls</p>
                            <button
                                onClick={async () => {
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
                                                // We continue to delete the DB record even if storage fails partial, 
                                                // or should we stop? Usually stopping is safer, but orphaned files are better than broken app state.
                                                // Let's warn but proceed, or maybe ask? For now, proceed.
                                            }
                                        }

                                        // 3. Delete database record
                                        const { error } = await supabase.from('fonts').delete().eq('id', font.id);
                                        if (error) throw error;

                                        alert('Font and all associated files deleted successfully.');
                                        navigate('/');

                                    } catch (err: any) {
                                        console.error('Delete failed:', err);
                                        alert('Error deleting font: ' + err.message);
                                    }
                                }}
                                className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-bold text-sm"
                            >
                                Delete Font
                            </button>
                            <button
                                onClick={() => alert('Edit functionality coming soon')}
                                className="w-full flex items-center justify-center px-4 py-2 bg-white border border-black text-black rounded-xl hover:bg-gray-100 transition-colors font-bold text-sm"
                            >
                                Edit Font
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleFavorite}
                        className={`flex items-center w-full px-4 py-2 gap-2 border border-black rounded-3xl transition-colors ${isFavorited
                            ? 'bg-red-500 text-pink-200'
                            : 'bg-white hover:bg-black text-gray-600 hover:text-white'
                            }`}
                    >
                        <Heart size={20} className={isFavorited ? 'fill-current' : ''} />
                        <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex items-center w-full h-full px-4 py-2 gap-2 border border-black bg-white hover:bg-black text-gray-600 hover:text-white rounded-3xl transition-colors"
                    >
                        {copied ? <Check size={20} className="text-green-600" /> : <Share2 size={20} className="text-gray-600" />}
                        <span>{copied ? 'Copied!' : 'Share'}</span>
                    </button>
                    <a
                        href='#download'
                        className="flex items-center w-full px-4 py-2 gap-2 border border-black rounded-3xl transition-colors bg-white hover:bg-black text-gray-600 hover:text-white"
                    >
                        <Download size={20} className={isFavorited ? 'fill-current' : ''} />
                        <span>Download</span>
                    </a>
                </div>
            </div>

            {/* Variant Previews Section */}
            <div className='w-full bg-white/20 text-black rounded-3xl border-2 border-black overflow-hidden'>
                {/* Controller Row */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-3xl border-b border-black bg-white hover:bg-gray-100">
                    <input
                        type="text"
                        value={variantPreviewText}
                        onChange={(e) => setVariantPreviewText(e.target.value)}
                        placeholder="Type something to preview..."
                        className="w-full md:w-1/2 text-xl bg-transparent border-b-2 border-gray-300 focus:border-black outline-none px-2 py-2 transition-colors placeholder:text-gray-400"
                    />
                    <div className="flex items-center gap-4 w-full md:w-auto bg-white px-4 py-2 rounded-full border border-gray-200">
                        <span className="text-xs font-bold uppercase text-gray-500">Size</span>
                        <input
                            type="range"
                            min="16"
                            max="150"
                            value={variantPreviewSize}
                            onChange={(e) => setVariantPreviewSize(Number(e.target.value))}
                            className="w-full md:w-48 accent-black cursor-pointer"
                        />
                        <span className="font-mono text-sm w-12 text-right">{variantPreviewSize}px</span>
                    </div>
                </div>

                {/* Main Font Preview */}
                <div className="p-8 rounded-3xl border-b border-black bg-white hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500 bg-gray-200 px-2 py-1 rounded-xl">Default</span>
                    </div>
                    <p
                        style={{
                            fontFamily: isFontLoaded ? `font-${font.id}` : 'sans-serif',
                            fontSize: `${variantPreviewSize}px`,
                            lineHeight: 1.2,
                            opacity: isFontLoaded ? 1 : 0
                        }}
                        className="wrap-break-word transition-all duration-200 w-full"
                    >
                        {variantPreviewText || font.name}
                    </p>
                </div>

                {/* Variants List */}
                {font.font_variants?.map(variant => (
                    <div key={variant.id} className="p-8 rounded-3xl border-b border-black bg-white hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500 bg-gray-200 px-2 py-1 rounded-xl">{variant.variant_name}</span>
                        </div>
                        <p
                            style={{
                                fontFamily: `'font-${font.id}-${variant.variant_name}'`,
                                fontSize: `${variantPreviewSize}px`,
                                lineHeight: 1.2
                            }}
                            className="wrap-break-word transition-all duration-200 w-full"
                        >
                            {variantPreviewText || `${font.name} ${variant.variant_name}`}
                        </p>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="">
                {/* Left Column: Tester (Span 2) */}
                <div className="space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold py-4 px-4 bg-white rounded-3xl border-2 border-black">Interactive Tester</h2>
                        <FontTester font={font} />
                    </section>
                </div>

                {/* Right Column: Metadata & License */}
                <div className="space-y-6">

                    <div className="bg-white rounded-3xl border border-gray-200 p-6">
                        <h3 className="font-bold text-2xl mb-4">Font Stats</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Downloads</span>
                                <span className="font-medium">{font.downloads?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Favorites</span>
                                <span className="font-medium capitalize">{font.favorites_count?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Download Buttons Stacked */}
                <div id='download' className="bg-white border border-black rounded-3xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Download Default</h3>
                        {profile?.role === 'admin' && (
                            <button
                                onClick={() => setIsEditingFiles(!isEditingFiles)}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${isEditingFiles ? 'bg-[#BDF522] text-black' : 'bg-gray-100 text-gray-500 hover:text-black'
                                    }`}
                            >
                                <Edit2 size={12} /> {isEditingFiles ? 'Done Editing' : 'Manage Files'}
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Admin: Show all potential slots in edit mode */}
                        {isEditingFiles && profile?.role === 'admin' ? (
                            (['woff2', 'woff', 'ttf', 'otf'] as const).map(format => {
                                const urlKey = `${format}_url` as keyof typeof font;
                                const url = font[urlKey] as string | null;

                                return (
                                    <div key={format} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-gray-50">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold uppercase">{format}</span>
                                            {url ? (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Check size={10} /> Present
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                                                    Missing
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="cursor-pointer bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-1">
                                                <Upload size={12} /> {url ? 'Replace' : 'Upload'}
                                                <input
                                                    type="file"
                                                    accept={`.${format}`}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleFileOp('replace', format, file);
                                                    }}
                                                    className="hidden"
                                                />
                                            </label>
                                            {url && (
                                                <button
                                                    onClick={() => handleFileOp('delete', format)}
                                                    className="bg-red-100 text-red-500 p-1.5 rounded-lg hover:bg-red-200"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            // Normal View
                            <div className="flex flex-col md:flex-row gap-3">
                                {availableFormats.length > 0 ? (
                                    availableFormats.map(format => {
                                        const url = font[format.key as keyof typeof font] as string;
                                        return (
                                            <button
                                                key={format.label}
                                                onClick={() => downloadFont(url, `${font.slug}.${format.type}`)}
                                                className="w-full flex items-center justify-between px-6 py-4 bg-black text-white rounded-3xl hover:bg-[#00C2FF] hover:text-black border-2 border-transparent transition-all font-black uppercase text-sm"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Download size={18} />
                                                    <span>Download {format.label}</span>
                                                </span>
                                                <span className="text-xs opacity-70 font-normal">.{format.type.toUpperCase()}</span>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-4 text-gray-400 italic">
                                        No download formats available.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Variants Section */}
                {font.font_variants && font.font_variants.length > 0 && (
                    <div className="lg:col-span-3 border border-black rounded-3xl">
                        <div className="grid grid-cols-1">
                            {font.font_variants.map(variant => (
                                <div key={variant.id} className=" bg-white border border-black rounded-3xl p-4 hover:border-black transition-colors">
                                    <h4 className="font-bold mb-3">{variant.variant_name}</h4>

                                    {isEditingFiles && profile?.role === 'admin' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {(['woff2', 'woff', 'ttf', 'otf'] as const).map(format => {
                                                const urlKey = `${format}_url` as keyof typeof variant;
                                                const url = variant[urlKey];

                                                return (
                                                    <div key={format} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-gray-50 text-xs">
                                                        <span className="font-bold uppercase">{format}</span>
                                                        <div className="flex items-center gap-2">
                                                            <label className="cursor-pointer text-blue-600 hover:text-blue-800 font-bold">
                                                                {url ? 'Replace' : 'Upload'}
                                                                <input
                                                                    type="file"
                                                                    accept={`.${format}`}
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleFileOp('replace', format, file, variant.id, variant.variant_name);
                                                                    }}
                                                                    className="hidden"
                                                                />
                                                            </label>
                                                            {url && (
                                                                <button
                                                                    onClick={() => handleFileOp('delete', format, undefined, variant.id, variant.variant_name)}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {(['ttf', 'otf', 'woff', 'woff2'] as const).map(format => {
                                                const urlKey = `${format}_url` as keyof typeof variant;
                                                const url = variant[urlKey];
                                                if (!url) return null;
                                                return (
                                                    <button
                                                        key={format}
                                                        onClick={() => downloadFont(url as string, `${font.slug}-${variant.variant_name}.${format}`)}
                                                        className="flex items-center justify-between px-6 py-4 bg-black text-white rounded-3xl hover:bg-[#00C2FF] hover:text-black border-2 border-transparent transition-all font-black uppercase text-sm"
                                                    >
                                                        {format}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add New Variant Button - Admin Only */}
                        {isEditingFiles && profile?.role === 'admin' && (
                            <div className="p-4 border-t border-black mt-4">
                                {!isAddingVariant ? (
                                    <button
                                        onClick={() => setIsAddingVariant(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors"
                                    >
                                        <Plus size={16} /> Add Variant
                                    </button>
                                ) : (
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                                        <h4 className="font-bold">Add New Variant</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Variant Name (e.g. Bold Italic)"
                                                value={newVariantName}
                                                onChange={e => setNewVariantName(e.target.value)}
                                                className="border-2 border-gray-300 rounded-lg px-3 py-2 w-full font-bold"
                                            />
                                            <div className="flex gap-2">
                                                <select
                                                    value={newVariantFormat}
                                                    onChange={e => setNewVariantFormat(e.target.value as any)}
                                                    className="border-2 border-gray-300 rounded-lg px-3 py-2 font-bold bg-white"
                                                >
                                                    <option value="woff2">WOFF2</option>
                                                    <option value="woff">WOFF</option>
                                                    <option value="ttf">TTF</option>
                                                    <option value="otf">OTF</option>
                                                </select>
                                                <label className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg px-3 py-2 cursor-pointer hover:border-black hover:bg-white bg-white">
                                                    <span className="text-xs font-bold truncate">
                                                        {newVariantFile ? newVariantFile.name : 'Choose File'}
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept={`.${newVariantFormat}`}
                                                        onChange={e => setNewVariantFile(e.target.files?.[0] || null)}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => setIsAddingVariant(false)}
                                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-black"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleAddVariant}
                                                disabled={!newVariantName || !newVariantFile}
                                                className="px-4 py-2 bg-black text-white rounded-full font-bold text-sm hover:bg-gray-800 disabled:opacity-50"
                                            >
                                                Add Variant
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Similar Fonts Section */}
                {similarFonts.length > 0 && (
                    <div>
                        <div className="flex justify-between items-center gap-2 bg-white rounded-3xl border-y border-black p-1">
                            <h3 className="bg-white rounded-3xl p-5 font-black text-3xl uppercase tracking-tight">Similar Fonts</h3>

                            <div className="flex items-center mr-2">
                                <div className="flex bg-gray-100 h-11 p-1 w-auto rounded-full border border-gray-200">
                                    <button
                                        onClick={() => setViewMode('font')}
                                        className={`p-2 aspect-square rounded-full transition-all ${viewMode === 'font'
                                            ? 'bg-black text-white shadow-sm'
                                            : 'text-gray-500 hover:text-black'
                                            }`}
                                        title="Font View"
                                    >
                                        <Type size={16} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('image')}
                                        className={`p-2 aspect-square rounded-full transition-all ${viewMode === 'image'
                                            ? 'bg-black text-white shadow-sm'
                                            : 'text-gray-500 hover:text-black'
                                            }`}
                                        title="Image View"
                                    >
                                        <ImageIcon size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                            {similarFonts.map(f => (
                                <FontCard key={f.id} font={f} viewMode={viewMode} />
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div >
    );
}
