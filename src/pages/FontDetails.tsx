import { useNavigate, useParams, Link } from 'react-router-dom';
import { Download, Heart, Share2, ArrowLeft, Check, X, Link as LinkIcon, Image as ImageIcon, MoveLeft, MoveRight, Save, Trash2, Edit2, Upload, Plus, Type, Loader2, FileType } from 'lucide-react';
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
import { generateDescription, generateFontFeaturesList, generateHeaderTagline, generateFooterTagline } from '../utils/fontDescriptionGenerator';
import SEO from '../components/shared/SEO';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

const VARIANT_NAMES = [
    'Regular', 'Italic', 'Bold', 'Bold Italic', 'Light', 'Light Italic',
    'Medium', 'Medium Italic', 'SemiBold', 'SemiBold Italic',
    'ExtraBold', 'ExtraBold Italic', 'Black', 'Black Italic',
    'Thin', 'Thin Italic', 'ExtraLight', 'ExtraLight Italic'
];

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

    // Batch Save Logic for Existing File Edits
    type StagedChange = {
        variantId: string;
        format: string; // 'ttf' | 'otf' | 'woff' | 'woff2'
        action: 'replace' | 'delete';
        file?: File;
        variantName?: string;
    };
    const [stagedChanges, setStagedChanges] = useState<StagedChange[]>([]);

    const handleStageChange = (
        action: 'replace' | 'delete',
        format: string,
        file?: File,
        variantId?: string,
        variantName?: string
    ) => {
        if (!variantId) return; // Only for existing variants for now

        setStagedChanges(prev => {
            // Remove any existing pending change for this specific slot
            const filtered = prev.filter(c => !(c.variantId === variantId && c.format === format));

            // If we are "deleting", and there was no previous upload, adds delete.
            // If we are "replacing", adds replace.

            // Note: If user uploads then deletes, we just remove the upload from pending.
            // If user deletes then uploads, we overwrite with upload.

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
        if (!font || !user) return;
        // Confirm dialogs moved to UI or skipped for batch actions


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
                // Check if we should delete the variant entirely (if deleting the last file)
                let shouldDeleteVariant = false;

                if (type === 'delete') {
                    const variant = font.font_variants?.find(v => v.id === variantId);
                    if (variant) {
                        // Check if all OTHER formats are empty
                        const otherFormats = ['ttf', 'otf', 'woff', 'woff2'].filter(f => f !== format);
                        const hasOthers = otherFormats.some(f => variant[`${f}_url` as keyof typeof variant]);

                        if (!hasOthers) {
                            shouldDeleteVariant = true;
                        }
                    }
                }

                if (shouldDeleteVariant) {
                    const { error } = await supabase
                        .from('font_variants')
                        .delete()
                        .eq('id', variantId);

                    if (error) throw error;
                    if (error) throw error;
                    // alert('Variant deleted completely as it has no more files.');
                } else {
                    // Update Variant
                    const updateData: any = {};
                    updateData[`${format}_url`] = publicUrl;

                    const { error } = await supabase
                        .from('font_variants')
                        .update(updateData)
                        .eq('id', variantId);

                    if (error) throw error;
                    if (error) throw error;
                    // alert(`File ${type === 'replace' ? 'uploaded' : 'deleted'} successfully!`);
                }

                // window.location.reload();
                return; // Exit checking main font update (if we had specific flow for that)
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

            // alert(`File ${type === 'replace' ? 'uploaded' : 'deleted'} successfully!`);
            // window.location.reload();

        } catch (err: any) {
            console.error('File operation failed:', err);
            alert('Operation failed: ' + err.message);
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
            // Process sequentially
            // 1. Existing file changes
            for (const change of stagedChanges) {
                await executeSingleChange(
                    change.action,
                    change.format,
                    change.file,
                    change.variantId,
                    change.variantName
                );
            }

            // 2. New Variants
            for (const variant of addedVariants) {
                // Skip if no files selected (though we should probably validate this before saving)
                if (!Object.values(variant.files).some(f => f !== null)) continue;

                const uploadUrls: any = {};
                const fileSizes: any = {};

                // Upload each selected file
                for (const [format, file] of Object.entries(variant.files)) {
                    if (file) {
                        const fileName = `${Date.now()}-${file.name}`;
                        const path = `${font.uploaded_by}/${font.slug}/variants/${variant.name}/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                            .from('fonts')
                            .upload(path, file, { upsert: true });

                        if (uploadError) throw new Error(`Failed to upload ${variant.name} ${format.toUpperCase()}: ${uploadError.message}`);

                        const { data } = supabase.storage.from('fonts').getPublicUrl(path);
                        uploadUrls[`${format}_url`] = data.publicUrl;
                        fileSizes[`file_size_${format}`] = file.size;
                    }
                }

                const insertData: any = {
                    font_id: font.id,
                    variant_name: variant.name,
                    ...uploadUrls,
                    ...fileSizes
                };

                const { error: insertError } = await supabase
                    .from('font_variants')
                    .insert(insertData);

                if (insertError) throw insertError;
            }

            alert('All changes saved successfully!');
            window.location.reload();
        } catch (error: any) {
            console.error("Batch save error:", error);
            alert("Error saving changes: " + error.message);
        }
    };

    const handleCancelAll = () => {
        if (stagedChanges.length > 0 || addedVariants.length > 0) {
            if (!confirm('Discard all unsaved changes and stop editing?')) return;
        }
        setStagedChanges([]);
        setAddedVariants([]);
        setIsEditingFiles(false);
    };

    // Batch Add Variant State
    type NewVariant = {
        id: string; // temporary ID
        name: string;
        isCustom: boolean;
        files: { ttf: File | null; otf: File | null; woff: File | null; woff2: File | null };
    };
    const [addedVariants, setAddedVariants] = useState<NewVariant[]>([]);

    const addStdVariantToState = () => {
        const existingNames = font?.font_variants?.map(v => v.variant_name) || [];

        setAddedVariants(prev => {
            const addedNames = prev.map(v => v.name);
            const allUsedNames = [...existingNames, ...addedNames];

            if (allUsedNames.length >= VARIANT_NAMES.length) return prev;

            const firstAvailableName = VARIANT_NAMES.find(n => !allUsedNames.includes(n)) || 'Regular';

            return [
                ...prev,
                {
                    id: Math.random().toString(36).substring(7),
                    name: firstAvailableName,
                    isCustom: false,
                    files: { ttf: null, otf: null, woff: null, woff2: null }
                }
            ]
        });
    };

    const addCustomVariantToState = () => {
        setAddedVariants(prev => [
            ...prev,
            {
                id: Math.random().toString(36).substring(7),
                name: 'New Custom Variant',
                isCustom: true,
                files: { ttf: null, otf: null, woff: null, woff2: null }
            }
        ]);
    };

    const removeAddedVariant = (id: string) => {
        setAddedVariants(prev => prev.filter(v => v.id !== id));
    };

    const updateAddedVariantName = (id: string, name: string) => {
        setAddedVariants(prev => prev.map(v => v.id === id ? { ...v, name } : v));
    };

    const updateAddedVariantFile = (id: string, format: keyof NewVariant['files'], file: File | null) => {
        setAddedVariants(prev => prev.map(v => v.id === id ? {
            ...v,
            files: { ...v.files, [format]: file }
        } : v));
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
            alert('Failed to update favorites');
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

            alert('Font and all associated files deleted successfully.');
            navigate('/');

        } catch (err: any) {
            console.error('Delete failed:', err);
            alert('Error deleting font: ' + err.message);
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

    // Scroll Detection
    const [isScrolled, setIsScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 500);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;
    if (error || !font) return <div className="container mx-auto px-4 py-8">Font not found</div>;



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
        <div className="min-h-screen bg-black text-foreground relative selection:bg-lime-400 selection:text-black">
            <SEO
                title={`${font.name} by ${font.designer}`}
                description={`Download ${font.name}, a ${font.tags ? font.tags.join(', ') : 'unique'} font${font.designer ? ` by ${font.designer}` : ''}. Available now on NoBadFonts.`}
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
                animate={{ y: isScrolled ? 0 : -200 }}
                className="fixed top-22 md:top-0 left-0 right-0 h-20 bg-black/50 backdrop-blur-md z-30 border-b border-white/10 flex items-center justify-between px-6 md:px-10"
            >
                <div className="flex flex-wrap items-center gap-0">
                    <h2 className="text-xl font-bold text-white pr-2">{font.name}</h2>
                    <span className="text-zinc-500">by {font.designer}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleShare}
                        disabled={shareLoading}
                        className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                        {shareLoading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                    </button>
                    <a
                        href={font.woff2_url || "#"}
                        onClick={() => downloadFont(font.woff2_url || "", `${font.name}.woff2`)}
                        className="px-4 md:px-6 py-2.5 md:py-2.5 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"
                    >
                        <Download size={18} />
                        <span className="hidden md:inline">Download</span>
                    </a>
                </div>
            </motion.div>

            <div className="max-w-480 mx-auto pt-6 pb-24 space-y-12 md:space-y-24">

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
                            {/* Favorite Button */}
                            <button
                                onClick={handleFavorite}
                                className={cn(
                                    "flex items-center gap-2 px-4 md:px-6 py-3 rounded-full border transition-all duration-300",
                                    isFavorited
                                        ? "bg-pink-500/10 border-pink-500 text-pink-500"
                                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                )}
                            >
                                <Heart size={20} className={isFavorited ? "fill-pink-500" : ""} />
                                <span className="font-bold">{font.favorites_count || 0}</span>
                            </button>

                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                disabled={shareLoading}
                                className="flex items-center gap-2 px-4 md:px-6 py-3 rounded-full border bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all duration-300"
                            >
                                {shareLoading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                                <span className="font-bold hidden md:inline">Share</span>
                            </button>

                            {/* Download Button */}
                            <a
                                href={font.woff2_url || "#"}
                                onClick={() => downloadFont(font.woff2_url || "", `${font.name}.woff2`)}
                                className="flex items-center gap-2 px-4 md:px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                <Download size={20} />
                                <span className="font-bold  md:inline">Download Font</span>
                            </a>
                        </div>
                    </div>

                    {/* Gallery / Hero Display */}
                    <div className="relative w-full overflow-hidden border border-none shadow-2xl group" style={{ '--mobile-ar': mobileAr, '--desktop-ar': desktopAr } as React.CSSProperties}>
                        {galleryImages.length > 0 ? (
                            <div className={`relative w-full aspect-(--mobile-ar) md:aspect-(--desktop-ar)`}>
                                <PreviewAccordion images={galleryImages} />
                            </div>
                        ) : (
                            <div className="relative w-full h-full min-h-[60vh] bg-zinc-900 rounded-4xl flex items-center justify-center p-8">
                                <h2
                                    style={{
                                        fontFamily: isFontLoaded ? `font-${font.id}` : 'sans-serif',
                                        opacity: isFontLoaded ? 1 : 0
                                    }}
                                    className="text-[15vw] leading-none text-white/90 text-center wrap-break-word transition-opacity duration-500 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
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

                {/* Rest of the content will go here */}

                {/* Admin Gallery Editor */}
                {profile?.role === 'admin' && (
                    <div className="bg-zinc-800 rounded-3xl mb-8 border border-white/10 overflow-hidden mt-8">
                        {!isEditingGallery ? (
                            <div className='p-4 w-full flex justify-between items-center bg-zinc-900/50'>
                                <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest pl-2">Admin Controls</span>
                                <div className="flex gap-2 md:gap-4">
                                    <button
                                        onClick={handleDeleteFont}
                                        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full font-bold text-sm hover:bg-red-500/20 transition-colors"
                                    >
                                        <Trash2 size={16} /> <span className="hidden md:inline">Delete Font</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            const section = document.getElementById('download-section');
                                            if (section) section.scrollIntoView({ behavior: 'smooth' });
                                            setIsEditingFiles(true);
                                        }}
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
                                            className="flex items-center gap-2 px-6 py-2 bg-[#BDF522] text-black rounded-full font-bold text-sm hover:scale-105 transition-transform"
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
                                                    <span className="absolute top-2 left-2 bg-[#BDF522] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
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
                                                    className="flex-1 min-w-0 bg-black/50 border border-white/20 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-[#BDF522]"
                                                    autoFocus
                                                    onKeyDown={e => e.key === 'Enter' && handleAddGalleryUrl()}
                                                />
                                                <button onClick={handleAddGalleryUrl} className="bg-[#BDF522] text-black px-2 rounded-lg hover:bg-lime-300">
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
                                <p className="text-xs text-zinc-500 italic text-center mt-4">
                                    Tip: The first image will be used as the main preview card.
                                </p>
                            </div>
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
                        <div className="h-px bg-white/10 flex-1"></div>
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-zinc-500">Variant Previews</h2>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-4xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors" >
                        <input
                            type="text"
                            value={variantPreviewText}
                            onChange={(e) => setVariantPreviewText(e.target.value)}
                            placeholder="Type something to preview..."
                            className="w-full md:w-1/2 text-xl bg-transparent border-b border-white/20 focus:border-[#BDF522] outline-none px-2 py-2 transition-colors placeholder:text-gray-500 text-white"
                        />
                        <div className="flex items-center gap-4 w-full md:w-auto bg-black/50 px-6 py-3 rounded-full border border-white/10 shadow-inner">
                            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Size</span>
                            <input
                                type="range"
                                min="16"
                                max="150"
                                value={variantPreviewSize}
                                onChange={(e) => setVariantPreviewSize(Number(e.target.value))}
                                className="w-full md:w-48 accent-[#BDF522] cursor-pointer"
                            />
                            <span className="font-mono text-sm w-12 text-right text-[#BDF522]">{variantPreviewSize}px</span>
                        </div>
                    </div>
                    {/* Variants List */}
                    <div className='rounded-4xl overflow-hidden border border-white/10'>
                        {
                            (() => {
                                const variants = font.font_variants?.slice() || [];
                                const isAllCustom = variants.every(v => !VARIANT_NAMES.includes(v.variant_name));

                                const sortedVariants = isAllCustom
                                    ? variants
                                    : variants.sort((a, b) => {
                                        const getWeight = (name: string) => {
                                            const n = name.toLowerCase();
                                            if (n.includes('thin')) return 100;
                                            if (n.includes('extra light') || n.includes('extralight')) return 200;
                                            if (n.includes('light')) return 300;
                                            if (n.includes('regular')) return 400;
                                            if (n.includes('medium')) return 500;
                                            if (n.includes('semi bold') || n.includes('semibold')) return 600;
                                            if (n.includes('extra bold') || n.includes('extrabold')) return 800;
                                            if (n.includes('bold')) return 700;
                                            if (n.includes('black') || n.includes('heavy')) return 900;
                                            return 400; // default
                                        };
                                        const weightA = getWeight(a.variant_name);
                                        const weightB = getWeight(b.variant_name);

                                        // Primary sort by weight (Descending)
                                        if (weightA !== weightB) return weightB - weightA;

                                        // Secondary sort: Non-italic before Italic
                                        const isItalicA = a.variant_name.toLowerCase().includes('italic');
                                        const isItalicB = b.variant_name.toLowerCase().includes('italic');
                                        if (isItalicA !== isItalicB) return isItalicA ? 1 : -1;

                                        return 0;
                                    });

                                return sortedVariants.map(variant => (
                                    <div key={variant.id} className="p-8 xmt-4 xrounded-4xl last:border-none border-b border-white/10 bg-white/5 hover:bg-white/10 transition-all group">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-[12px] font-bold uppercase tracking-wider text-[#BDF522] bg-[#BDF522]/10 px-3 py-1.5 rounded-full border border-[#BDF522]/20">{variant.variant_name}</span>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {(['ttf', 'otf', 'woff', 'woff2'] as const).map(format => {
                                                    const url = variant[`${format}_url` as keyof typeof variant] as string;
                                                    if (url) {
                                                        return (
                                                            <button
                                                                key={format}
                                                                onClick={() => downloadFont(url, `${font.name}-${variant.variant_name}.${format}`)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 border border-white/20 rounded-full text-[10px] font-bold uppercase hover:bg-[#BDF522] hover:text-black hover:border-[#BDF522] transition-colors cursor-pointer"
                                                                title={`Download ${format.toUpperCase()}`}
                                                            >
                                                                <Download size={12} /> {format}
                                                            </button>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </div>
                                        </div>
                                        <p
                                            style={{
                                                fontFamily: `'font-${font.id}-${variant.variant_name}'`,
                                                fontSize: `${variantPreviewSize}px`,
                                                lineHeight: 1.2
                                            }}
                                            className="wrap-break-word transition-all duration-200 w-full text-white"
                                        >
                                            {variantPreviewText || `${font.name} ${variant.variant_name}`}
                                        </p>
                                    </div>
                                ));
                            })()
                        }
                    </div>
                </div>

                {/* 3. DESCRIPTION & FEATURES */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-zinc-500">About this Font</h2>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <section className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 h-full">

                                {/* Header Tagline */}
                                <h3 className="text-2xl font-bold mb-6 leading-tight text-white">
                                    {generateHeaderTagline(font)}
                                </h3>

                                <div className="prose prose-lg prose-invert max-w-none text-gray-300">
                                    <p className="whitespace-pre-line leading-relaxed text-lg">
                                        {generateDescription(font)}
                                    </p>

                                    {/* Footer Tagline */}
                                    <p className="mt-8 font-serif italic text-2xl text-white border-l-4 border-[#BDF522] pl-6 py-2 bg-white/5 rounded-r-2xl">
                                        "{generateFooterTagline(font)}"
                                    </p>

                                    <p className="mt-8 text-gray-500 italic text-sm">
                                        Having a great day,<br />
                                        <span className="font-bold not-italic text-white text-base">{font.designer || 'The Designer'}</span>
                                    </p>
                                </div>
                            </section>
                        </div>

                        <div className="flex flex-col gap-6">
                            <section className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 flex-1">
                                <h2 className="text-xl font-black uppercase tracking-wider mb-6 text-[#BDF522]">Font Features</h2>
                                <ul className="space-y-4">
                                    {generateFontFeaturesList(font).map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-base font-medium text-gray-300 bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <Check size={20} className="mt-0.5 text-[#BDF522] shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8">
                                <h2 className="text-xl font-black uppercase tracking-wider mb-6 text-[#BDF522]">Item Tags</h2>
                                <div className="flex flex-wrap gap-2">
                                    {displayTags.map((tag, i) => (
                                        <span key={i} className="bg-white/10 text-white text-sm px-4 py-2 rounded-full font-medium hover:bg-[#BDF522] hover:text-black hover:-translate-y-1 hover:shadow-[0_4px_15px_rgba(189,245,34,0.3)] transition-all cursor-pointer border border-white/10">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* 4. INTERACTIVE TESTER */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-zinc-500">Type Tester</h2>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <FontTester font={font} />
                </div>

                {/* 5. EMBED & STATS */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-zinc-500">Integration</h2>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <section id="embed-section" className="bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden scroll-mt-24 h-full">
                            <div className="p-8 space-y-8">

                                {/* Option 1: Head Link */}
                                <div>
                                    <h3 className="font-bold text-lg mb-3 text-white">1. Add to the head section of web page</h3>
                                    <div className="bg-black/50 rounded-2xl border border-white/10 text-gray-300 text-sm font-mono p-5 overflow-x-auto whitespace-pre shadow-inner">
                                        {`<link href="${window.location.origin}/css/${font.slug}" rel="stylesheet">`}
                                    </div>
                                </div>

                                {/* Option 2: Import */}
                                <div>
                                    <h3 className="font-bold text-lg mb-3 text-white">OR Using @import CSS directive</h3>
                                    <div className="bg-black/50 rounded-2xl border border-white/10 text-gray-300 text-sm font-mono p-5 overflow-x-auto whitespace-pre shadow-inner">
                                        {`@import url(${window.location.origin}/css/${font.slug});`}
                                    </div>
                                </div>

                                {/* Option 3: Font Face */}
                                <div>
                                    <h3 className="font-bold text-lg mb-3 text-white">OR Use font-face declaration</h3>
                                    <div className="bg-black/50 rounded-2xl border border-white/10 text-[#BDF522] text-sm font-mono p-5 overflow-x-auto whitespace-pre shadow-inner">
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
                                    <h3 className="font-bold text-lg mb-3 text-white">2. CSS rules to specify fonts</h3>
                                    <div className="bg-black/50 rounded-2xl border border-white/10 text-[#BDF522] text-sm font-mono p-5 overflow-x-auto whitespace-pre shadow-inner">
                                        {`font-family: "${font.name}", sans-serif;`}
                                    </div>
                                </div>

                            </div>
                        </section>

                        <div className="space-y-6">
                            <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 h-full">
                                <h3 className="font-bold text-2xl mb-6 text-white uppercase tracking-wider">Font Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                                        <span className="text-zinc-400 font-medium">Downloads</span>
                                        <span className="font-bold text-white text-xl">{font.downloads?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                                        <span className="text-zinc-400 font-medium">Favorites</span>
                                        <span className="font-bold text-white text-xl capitalize">{font.favorites_count?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. GLYPH MAP */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-zinc-500">Glyphs</h2>
                        <div className="h-px bg-white/10 flex-1"></div>
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
                        <div className="space-y-8 pt-12 border-t border-white/10 mt-12">
                            <div className="flex justify-between items-center gap-2">
                                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">You might also like</h2>

                                <div className="flex items-center">
                                    <div className="flex bg-white/5 backdrop-blur-md h-10 p-1 w-auto rounded-full border border-white/10">
                                        <button
                                            onClick={() => setViewMode('font')}
                                            className={`p-1.5 aspect-square rounded-full transition-all ${viewMode === 'font'
                                                ? 'bg-[#BDF522] text-black shadow-[0_0_15px_rgba(189,245,34,0.3)]'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                            title="Font View"
                                        >
                                            <Type size={16} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('image')}
                                            className={`p-1.5 aspect-square rounded-full transition-all ${viewMode === 'image'
                                                ? 'bg-[#BDF522] text-black shadow-[0_0_15px_rgba(189,245,34,0.3)]'
                                                : 'text-gray-400 hover:text-white'
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
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Manage Variants & Files</h2>
                            <button onClick={handleCancelAll} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X /></button>
                        </div>

                        {/* Main Font Files */}
                        <div className="hidden space-y-4">
                            <h3 className="text-lg font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <FileType size={16} /> Main Font Files
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['woff2', 'woff', 'ttf', 'otf'].map(format => (
                                    <div key={format} className="p-4 bg-black/50 rounded-xl border border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 font-mono text-xs uppercase shadow-inner">
                                                {format}
                                            </div>
                                            <div>
                                                <span className="block font-bold text-zinc-300 uppercase leading-tight">{format}</span>
                                                <span className={cn("text-[10px] font-bold uppercase tracking-wider", (font as any)[`${format}_url`] ? "text-green-500" : "text-red-500/50")}>
                                                    {(font as any)[`${format}_url`] ? 'Installed' : 'Missing'}
                                                </span>
                                            </div>
                                        </div>
                                        {/* File replacement input */}
                                        <label className={cn(
                                            "cursor-pointer p-2 rounded-lg transition-all border",
                                            (stagedChanges.find(c => !c.variantId && c.format === format)?.file)
                                                ? "bg-green-500/10 border-green-500/50 text-green-500"
                                                : "bg-white/5 border-transparent text-zinc-400 hover:bg-white/10 hover:text-white"
                                        )}>
                                            <Upload size={16} />
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
                            <div className="flex justify-between items-center border-t border-white/10 pt-8">
                                <h3 className="text-lg font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <Type size={16} /> Variants
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={addCustomVariantToState}
                                        className="text-xs bg-white/5 text-white border border-white/10 px-4 py-2 rounded-full font-bold hover:bg-white/10 transition-colors"
                                    >
                                        + Custom
                                    </button>
                                    <button
                                        onClick={addStdVariantToState}
                                        className="text-xs bg-[#BDF522] text-black px-4 py-2 rounded-full font-bold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(189,245,34,0.2)]"
                                    >
                                        + Standard
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {font.font_variants?.map(variant => (
                                    <div key={variant.id} className="p-5 bg-black/50 rounded-2xl border border-white/5 space-y-4">
                                        <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                            <span className="font-bold text-white text-lg tracking-wide">{variant.variant_name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-[#BDF522]/50 uppercase border border-[#BDF522]/20 bg-[#BDF522]/5 px-2 py-0.5 rounded shadow-inner"> Existing </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                            {['woff2', 'woff', 'ttf', 'otf'].map(format => {
                                                const staged = stagedChanges.find(c => c.variantId === variant.id && c.format === format);
                                                const isPendingDelete = staged?.action === 'delete';

                                                return (
                                                    <div key={format} className="relative group">
                                                        <label className={cn(
                                                            "flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-sm cursor-pointer transition-all h-full",
                                                            isPendingDelete
                                                                ? "border-red-500/30 bg-red-500/10 text-red-500/50 opacity-50"
                                                                : (staged?.file)
                                                                    ? "border-green-500/50 bg-green-500/10 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                                                                    : (variant as any)[`${format}_url`]
                                                                        ? "border-white/10 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 shadow-inner"
                                                                        : "border-dashed border-white/10 bg-white/5 text-zinc-500 hover:border-white/30 hover:text-zinc-300"
                                                        )}>
                                                            <span className="uppercase font-bold text-xs tracking-wider">{format}</span>
                                                            <span className="text-[9px] uppercase font-bold opacity-70">
                                                                {isPendingDelete ? 'Deleting' : staged?.file ? 'Modified' : (variant as any)[`${format}_url`] ? 'Installed' : 'Upload'}
                                                            </span>
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

                                                        {((variant as any)[`${format}_url`] || staged?.file) && !isPendingDelete && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault(); e.stopPropagation();
                                                                    handleStageChange('delete', format, undefined, variant.id, variant.variant_name);
                                                                }}
                                                                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-lg"
                                                                title="Remove File"
                                                            >
                                                                <Trash2 size={10} />
                                                            </button>
                                                        )}
                                                        {isPendingDelete && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault(); e.stopPropagation();
                                                                    setStagedChanges(prev => prev.filter(c => !(c.variantId === variant.id && c.format === format)));
                                                                }}
                                                                className="absolute -top-2 -right-2 p-1 text-[9px] font-bold uppercase bg-zinc-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-600 shadow-lg px-2"
                                                            >
                                                                Undo
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Added New Variants UI */}
                                {addedVariants.map(variant => (
                                    <div key={variant.id} className="p-5 bg-green-500/5 rounded-2xl border border-green-500/30 space-y-4 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 shadow-[0_0_20px_rgba(34,197,94,0.05)]">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center pb-3 border-b border-white/5">
                                            <div className="w-full md:w-1/3">
                                                {variant.isCustom ? (
                                                    <input
                                                        type="text"
                                                        value={variant.name}
                                                        onChange={(e) => updateAddedVariantName(variant.id, e.target.value)}
                                                        className="bg-transparent border-b border-white/20 text-white font-bold text-lg tracking-wide focus:border-green-500 outline-none pb-1 w-full placeholder:text-zinc-600 transition-colors"
                                                        placeholder="Variant Name"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <select
                                                        value={variant.name}
                                                        onChange={(e) => updateAddedVariantName(variant.id, e.target.value)}
                                                        className="bg-zinc-900 border border-white/10 text-white font-bold text-lg tracking-wide rounded-xl px-3 py-2 w-full focus:outline-none focus:border-green-500/50 appearance-none shadow-inner"
                                                    >
                                                        {VARIANT_NAMES.filter(name => name === variant.name || !addedVariants.some(v => v.name === name)).map(name => (
                                                            <option key={name} value={name}>{name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                            <button onClick={() => removeAddedVariant(variant.id)} className="ml-auto text-zinc-500 hover:text-red-500 hover:scale-110 transition-transform p-1 bg-white/5 rounded-full"><X size={16} /></button>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                            {(['ttf', 'otf', 'woff', 'woff2'] as const).map(fmt => (
                                                <div key={fmt} className="relative">
                                                    {variant.files[fmt] ? (
                                                        <div className="flex items-center justify-between border border-green-500/50 bg-green-500/10 text-green-500 rounded-xl p-3 text-xs font-bold shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                                                            <span className="truncate max-w-20 uppercase tracking-widest">{variant.files[fmt]?.name || fmt}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateAddedVariantFile(variant.id, fmt, null)}
                                                                className="hover:scale-110 transition-transform"
                                                            >
                                                                <Trash2 size={14} className="text-green-500 hover:text-red-400" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="flex flex-col items-center justify-center gap-1 border border-dashed border-white/20 bg-white/5 text-zinc-500 rounded-xl p-3 text-xs font-bold cursor-pointer hover:border-green-500/50 hover:text-green-500 transition-all">
                                                            <span className="uppercase tracking-widest">{fmt}</span>
                                                            <span className="text-[9px] opacity-70"><Plus size={10} className="inline mb-0.5" /> UPLOAD</span>
                                                            <input type="file" className="hidden" accept={`.${fmt}`} onChange={(e) => updateAddedVariantFile(variant.id, fmt, e.target.files?.[0] || null)} />
                                                        </label>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="sticky bottom-0 pt-6 pb-2 border-t border-white/10 flex justify-end gap-3 bg-zinc-900">
                            <button
                                onClick={handleCancelAll}
                                className="px-6 py-3 rounded-full font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeBatchChanges}
                                disabled={stagedChanges.length === 0 && addedVariants.length === 0}
                                className="px-8 py-3 rounded-full font-bold bg-[#BDF522] text-black hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 shadow-[0_0_20px_rgba(189,245,34,0.2)] disabled:shadow-none"
                            >
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

