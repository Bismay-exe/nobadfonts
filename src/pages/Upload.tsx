
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, Link as LinkIcon, Plus, Check } from 'lucide-react';
import { useUpload } from '../contexts/UploadContext';
import { FixWoff2Scanner } from '../components/admin/FixWoff2Scanner';
import SEO from '../components/shared/SEO';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const Upload = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        designer: '',
        tags: [] as string[],
    });

    // Banner state
    const [bannerItems, setBannerItems] = useState<{ id: string, type: 'file' | 'url', content: File | string }[]>([]);
    const [urlInput, setUrlInput] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);

    // Variant State
    type FontVariant = {
        id: string;
        name: string;
        isCustom?: boolean;
        files: {
            ttf: File | null;
            otf: File | null;
            woff: File | null;
            woff2: File | null;
        };
    };
    const [variants, setVariants] = useState<FontVariant[]>([{
        id: 'initial-1',
        name: 'Regular',
        files: { ttf: null, otf: null, woff: null, woff2: null }
    }]);

    const VARIANT_NAMES = [
        "Thin", "Extra Light", "Light", "Regular", "Medium", "Semi Bold", "Bold", "Extra Bold", "Black",
        "Thin Italic", "Extra Light Italic", "Light Italic", "Regular Italic",
        "Medium Italic", "Semi Bold Italic", "Bold Italic", "Extra Bold Italic", "Black Italic"
    ];

    const CATEGORIES = [
        {
            group: 'Classification',
            items: [
                { id: 'sans', label: 'Sans' },
                { id: 'serif', label: 'Serif' },
                { id: 'slab-serif', label: 'Slab Serif' },
                { id: 'display', label: 'Display' },
                { id: 'monospace', label: 'Monospace' },
                { id: 'script', label: 'Script' },
                { id: 'calligraphy', label: 'Calligraphy' },
                { id: 'brush', label: 'Brush' },
                { id: 'handwritten', label: 'Handwritten' },
                { id: 'signature', label: 'Signature' }
            ],
            color: 'border-[#BDF522] text-[#BDF522]'
        },
        {
            group: 'Style',
            items: [
                { id: 'modern', label: 'Modern' },
                { id: 'classic', label: 'Classic' },
                { id: 'minimal', label: 'Minimal' },
                { id: 'bold', label: 'Bold' },
                { id: 'elegant', label: 'Elegant' },
                { id: 'luxury', label: 'Luxury' },
                { id: 'playful', label: 'Playful' },
                { id: 'experimental', label: 'Experimental' },
                { id: 'brutalist', label: 'Brutalist' },
                { id: 'geometric', label: 'Geometric' },
                { id: 'organic', label: 'Organic' },
            ],
            color: 'border-[#FF90E8] text-[#FF90E8]'
        },
        {
            group: 'Use Case',
            items: [
                { id: 'branding', label: 'Branding' },
                { id: 'logo', label: 'Logo' },
                { id: 'headline', label: 'Headline' },
                { id: 'poster', label: 'Poster' },
                { id: 'corporate', label: 'Corporate' },
                { id: 'tech', label: 'Tech / UI' },
                { id: "social-media", label: "Social Media" }
            ],
            color: 'border-[#00C2FF] text-[#00C2FF]'
        },
        // ... other groups could be collapsed or added
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTagChange = (tagId: string) => {
        setFormData(prev => {
            const newTags = prev.tags.includes(tagId)
                ? prev.tags.filter(t => t !== tagId)
                : [...prev.tags, tagId];
            return { ...prev, tags: newTags };
        });
    };

    const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newfiles = Array.from(e.target.files).map(file => ({
                id: Math.random().toString(36).substring(7),
                type: 'file' as const,
                content: file
            }));
            setBannerItems(prev => [...prev, ...newfiles]);
        }
    };

    const addBannerUrl = () => {
        if (!urlInput) return;
        setBannerItems(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            type: 'url',
            content: urlInput
        }]);
        setUrlInput('');
        setShowUrlInput(false);
    };

    const removeBannerItem = (id: string) => {
        setBannerItems(prev => prev.filter(item => item.id !== id));
    };

    // Variant Helpers
    const addVariant = () => {
        if (variants.length >= VARIANT_NAMES.length + 10) return;
        setVariants(prev => {
            const usedNames = prev.map(v => v.name);
            const firstAvailableName = VARIANT_NAMES.find(name => !usedNames.includes(name)) || 'Regular';

            return [
                ...prev,
                {
                    id: Math.random().toString(36).substring(7),
                    name: firstAvailableName,
                    files: { ttf: null, otf: null, woff: null, woff2: null }
                }
            ]
        });
    };

    const addCustomVariant = () => {
        setVariants(prev => [
            ...prev,
            {
                id: Math.random().toString(36).substring(7),
                name: '',
                isCustom: true,
                files: { ttf: null, otf: null, woff: null, woff2: null }
            }
        ]);
    };

    const removeVariant = (id: string) => {
        setVariants(prev => prev.filter(v => v.id !== id));
    };

    const updateVariantName = (id: string, name: string) => {
        setVariants(prev => prev.map(v => v.id === id ? { ...v, name } : v));
    };

    const updateVariantFile = (id: string, format: keyof FontVariant['files'], file: File) => {
        setVariants(prev => prev.map(v => v.id === id ? {
            ...v,
            files: { ...v.files, [format]: file }
        } : v));
    };

    const { queueWoff2Conversion } = useUpload();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return alert('You must be logged in to upload');
        if (formData.tags.length === 0) return alert('Please select at least one category.');
        if (variants.length === 0) return alert('Please add at least one font variant.');

        const validVariants = variants.filter(v => Object.values(v.files).some(f => f !== null));
        if (validVariants.length === 0) return alert('Please upload files for at least one variant.');

        setLoading(true);

        try {
            const baseSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const slug = baseSlug;

            const { data: existingFont } = await supabase
                .from('fonts')
                .select('id')
                .eq('slug', slug)
                .maybeSingle();

            if (existingFont) {
                throw new Error('A font with same name is already exist!');
            }
            const folderPath = `${user.id}/${slug}`;
            const galleryUrls: string[] = [];
            const gallerySizes: number[] = [];

            // Upload Banner Items
            for (const item of bannerItems) {
                if (item.type === 'file') {
                    const file = item.content as File;
                    gallerySizes.push(file.size);
                    const bannerPath = `${folderPath}/gallery/${Date.now()}-${file.name}`;
                    const { error: bannerUploadError } = await supabase.storage
                        .from('fonts')
                        .upload(bannerPath, file, { upsert: true });

                    if (bannerUploadError) throw bannerUploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('fonts')
                        .getPublicUrl(bannerPath);

                    galleryUrls.push(publicUrl);
                } else if (item.type === 'url') {
                    gallerySizes.push(0);
                    galleryUrls.push(item.content as string);
                }
            }

            const previewImageUrl = galleryUrls.length > 0 ? galleryUrls[0] : null;
            const previewImageSize = gallerySizes.length > 0 ? gallerySizes[0] : null;

            // Insert Font Record
            const { error: dbError } = await supabase
                .from('fonts')
                .insert([
                    {
                        name: formData.name,
                        designer: formData.designer || 'Unknown',
                        category: formData.tags[0],
                        tags: formData.tags,
                        license_type: 'Unknown',
                        slug: slug,
                        is_published: true,
                        user_id: user.id,
                        preview_image_url: previewImageUrl,
                        file_size_image_preview: previewImageSize,
                        gallery_images: galleryUrls,
                        gallery_image_sizes: gallerySizes,
                        uploaded_by: user.id
                    }
                ]);

            if (dbError) throw new Error(`Database insert failed: ${dbError.message}`);

            // Get Font ID
            const { data: insertedFont, error: insertError } = await supabase
                .from('fonts')
                .select('id')
                .eq('slug', slug)
                .single();

            if (insertError || !insertedFont) throw new Error('Failed to retrieve new font ID');

            // Upload Variants
            const variantsToConvert: any[] = [];

            for (const variant of variants) {
                const variantUrls: any = {};
                const variantSizes: any = {};
                const promises = [];

                if (!variant.files.woff2 && (variant.files.ttf || variant.files.otf)) {
                    variantsToConvert.push({
                        id: variant.id,
                        name: variant.name,
                        files: { ttf: variant.files.ttf, otf: variant.files.otf }
                    });
                }

                for (const format of ['ttf', 'otf', 'woff', 'woff2'] as const) {
                    const file = variant.files[format];
                    if (file) {
                        const variantSlug = variant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        const newFileName = `${slug}-${variantSlug}.${format}`;
                        const variantPath = `${folderPath}/variants/${variant.name}/${newFileName}`;

                        const uploadVariantFile = async () => {
                            const { error: uploadError } = await supabase.storage
                                .from('fonts')
                                .upload(variantPath, file, { upsert: true });

                            if (uploadError) throw new Error(`Failed to upload ${variant.name} ${format.toUpperCase()}: ${uploadError.message}`);

                            const { data: { publicUrl } } = supabase.storage
                                .from('fonts')
                                .getPublicUrl(variantPath);

                            return publicUrl;
                        };

                        promises.push(uploadVariantFile().then(url => {
                            variantUrls[`${format}_url`] = url;
                            variantSizes[`file_size_${format}`] = file.size;
                        }));
                    }
                }

                if (promises.length > 0) {
                    await Promise.all(promises);

                    const { error: variantError } = await supabase
                        .from('font_variants')
                        .insert({
                            font_id: insertedFont.id,
                            variant_name: variant.name,
                            ...variantUrls,
                            ...variantSizes
                        });

                    if (variantError) console.error(`Failed to save variant ${variant.name}`, variantError);
                }
            }

            // Queue Conversion
            if (variantsToConvert.length > 0) {
                queueWoff2Conversion(insertedFont.id, slug, variantsToConvert);
            }

            navigate(`/fonts/${slug}`);

        } catch (error: any) {
            console.error('Upload Error:', error);
            alert(error.message || 'An error occurred during upload.');
        } finally {
            setLoading(false);
        }
    };

    // Access Check
    if (!profile || (profile.role !== 'member' && profile.role !== 'admin')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-zinc-900 border border-white/10 rounded-3xl text-center p-8 space-y-6 mt-12">
                <div className="bg-red-500/10 p-6 rounded-full border border-red-500/20">
                    <div className="text-4xl">🔒</div>
                </div>
                <div>
                    <h1 className="text-3xl font-black uppercase text-white mb-2">Access Restricted</h1>
                    <p className="text-zinc-400 max-w-md">
                        Uploading fonts is currently restricted to approved <strong>Members</strong> and <strong>Admins</strong>.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/')} className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:scale-105 transition-transform">
                        Go Home
                    </button>
                    <button disabled className="px-6 py-3 border border-white/20 text-zinc-500 rounded-xl font-bold opacity-50 cursor-not-allowed">
                        Request Access
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-12 px-4">
            <SEO title="Upload Font" />

            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black uppercase text-white mb-2">Upload Font</h1>
                        <p className="text-zinc-400">Share your typographic creation with the world.</p>
                    </div>
                    {/* Admin Tools Hook */}
                    {profile?.role === 'admin' && <FixWoff2Scanner />}
                </div>

                {/* Main Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900 p-8 rounded-3xl border border-white/10 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Font Name</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Helvetica Neue"
                                className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white font-bold text-lg focus:outline-none focus:border-[#FF90E8] transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Designer <span className="text-zinc-600 normal-case">(optional)</span></label>
                            <input
                                name="designer"
                                value={formData.designer}
                                onChange={handleChange}
                                placeholder="Your Name or Studio"
                                className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white font-bold focus:outline-none focus:border-[#00C2FF] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Banner Gallery */}
                    <div className="bg-zinc-900 p-8 rounded-3xl border border-white/10 flex flex-col">
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Gallery Images <span className="text-zinc-600 normal-case">(First is preview)</span></label>

                        <div className="flex-1 min-h-30 bg-black/30 rounded-xl border-2 border-dashed border-white/10 p-4 mb-4 grid grid-cols-3 gap-2">
                            {bannerItems.map((item) => (
                                <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden bg-black/50 border border-white/5">
                                    {item.type === 'file' ? (
                                        <img src={URL.createObjectURL(item.content as File)} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={item.content as string} className="w-full h-full object-cover" />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeBannerItem(item.id)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}

                            <label className="aspect-square rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center cursor-pointer text-zinc-500 hover:text-white">
                                <Plus size={24} />
                                <span className="text-[10px] mt-1 font-bold">ADD</span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleBannerFileChange} />
                            </label>
                        </div>

                        <div className="flex justify-end">
                            {showUrlInput ? (
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="url"
                                        value={urlInput}
                                        onChange={e => setUrlInput(e.target.value)}
                                        placeholder="https://..."
                                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                                        autoFocus
                                    />
                                    <button type="button" onClick={addBannerUrl} className="bg-white text-black px-3 py-2 rounded-lg font-bold text-xs">ADD</button>
                                    <button type="button" onClick={() => setShowUrlInput(false)} className="text-zinc-500"><X size={18} /></button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => setShowUrlInput(true)} className="text-xs font-bold text-zinc-500 hover:text-white flex items-center gap-1">
                                    <LinkIcon size={12} /> ADD FROM URL
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="bg-zinc-900 p-8 rounded-3xl border border-white/10">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-6">Categories & Style</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {CATEGORIES.map((group, i) => (
                            <div key={i}>
                                <h3 className={cn("text-sm font-black uppercase mb-3 border-b border-white/10 pb-2", group.color)}>{group.group}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {group.items.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleTagChange(cat.id)}
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-bold rounded-full border transition-all",
                                                formData.tags.includes(cat.id)
                                                    ? "bg-white text-black border-white"
                                                    : "bg-transparent text-zinc-500 border-white/10 hover:border-white/30 hover:text-white"
                                            )}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Variants */}
                <div className="bg-zinc-900 p-8 rounded-3xl border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Font Files <span className="text-red-500 normal-case ml-2">(At least one required)</span></label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={addCustomVariant}
                                className="px-4 py-2 text-xs font-bold text-white bg-white/5 rounded-full hover:bg-white/10 border border-white/10 transition-colors"
                            >
                                + Custom Style
                            </button>
                            <button
                                type="button"
                                onClick={addVariant}
                                disabled={variants.length >= VARIANT_NAMES.length + 10}
                                className={cn(
                                    "px-4 py-2 text-xs font-bold rounded-full transition-colors",
                                    variants.length >= VARIANT_NAMES.length + 10
                                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                        : "bg-white text-black hover:bg-zinc-200"
                                )}
                            >
                                + Standard Weight
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {variants.length === 0 && (
                            <div className="p-8 border-2 border-dashed border-red-500/20 rounded-2xl bg-red-500/5 text-center">
                                <p className="text-red-500 text-sm font-bold">
                                    No variants added. Please add at least one variant to publish.
                                </p>
                            </div>
                        )}
                        <AnimatePresence>
                            {variants.map((variant) => (
                                <motion.div
                                    key={variant.id}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-black/30 border border-white/5 rounded-2xl p-4"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-1/3">
                                            {variant.isCustom ? (
                                                <input
                                                    value={variant.name}
                                                    onChange={(e) => updateVariantName(variant.id, e.target.value)}
                                                    placeholder="Variant Name"
                                                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-white/30"
                                                />
                                            ) : (
                                                <select
                                                    value={variant.name}
                                                    onChange={(e) => updateVariantName(variant.id, e.target.value)}
                                                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-white/30"
                                                >
                                                    {VARIANT_NAMES.filter(name => name === variant.name || !variants.some(v => v.name === name)).map(name => (
                                                        <option key={name} value={name}>{name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                        <button type="button" onClick={() => removeVariant(variant.id)} className="ml-auto text-zinc-600 hover:text-red-500"><X size={18} /></button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {(['ttf', 'otf', 'woff', 'woff2'] as const).map(format => (
                                            <div key={format} className="relative">
                                                {variant.files[format] ? (
                                                    <div className="bg-[#BDF522]/10 border border-[#BDF522]/30 rounded-lg p-3 flex items-center justify-between group">
                                                        <span className="text-[#BDF522] font-mono text-xs font-bold uppercase">{format}</span>
                                                        <button type="button" onClick={() => updateVariantFile(variant.id, format, null as any)} className="text-[#BDF522] opacity-50 group-hover:opacity-100"><X size={14} /></button>
                                                    </div>
                                                ) : (
                                                    <label className="bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 rounded-lg p-3 flex items-center justify-center cursor-pointer transition-all">
                                                        <span className="text-zinc-500 font-mono text-xs font-bold uppercase group-hover:text-white">{format}</span>
                                                        <input type="file" accept={`.${format}`} className="hidden" onChange={(e) => {
                                                            if (e.target.files?.[0]) updateVariantFile(variant.id, format, e.target.files[0]);
                                                        }} />
                                                    </label>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#BDF522] text-black py-4 rounded-2xl font-black text-xl uppercase tracking-widest hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(189,245,34,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {loading ? 'Uploading...' : (
                            <>
                                <span>Publish Font</span>
                                <Check strokeWidth={4} />
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default Upload;
