import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, X, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { useUpload } from '../contexts/UploadContext';
import { FixWoff2Scanner } from '../components/admin/FixWoff2Scanner';
import SEO from '../components/shared/SEO';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";

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
        },

        {
            group: 'Weight & Shape',
            items: [
                { id: "hairline", label: "Hairline" },
                { id: 'light', label: 'Light' },
                { id: "normal-width", label: "Normal Width" },
                { id: 'heavy', label: 'Heavy' },
                { id: 'tall', label: 'Tall' },
                { id: 'condensed', label: 'Condensed' },
                { id: 'wide', label: 'Wide' },
                { id: "extended", label: "Extended" },
            ],
        },

        {
            group: "Construction & Features",
            items: [
                { id: "inktrap", label: "Ink Trap" },
                { id: "rounded", label: "Rounded" },
                { id: "square", label: "Square" },
                { id: "stencil", label: "Stencil" },
                { id: "outline", label: "Outline" },
                { id: "inline", label: "Inline" },
                { id: "pixel", label: "Pixel / Bitmap" },
                { id: "messy", label: "Messy" }
            ]
        },

        {
            group: 'Era & Vibe',
            items: [
                { id: 'casual', label: 'Casual' },
                { id: 'retro', label: 'Retro' },
                { id: 'vintage', label: 'Vintage' },
                { id: 'cyberpunk', label: 'Cyberpunk' },
                { id: 'futuristic', label: 'Futuristic' },
                { id: 'gothic', label: 'Gothic' },
                { id: 'y2k', label: 'Y2K' }
            ],
        },
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
        if (variants.length >= VARIANT_NAMES.length + 10) return; // Cap total variants to reasonable number
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

    const addVariableFont = () => {
        setVariants(prev => [
            ...prev,
            {
                id: Math.random().toString(36).substring(7),
                name: 'Variable',
                isCustom: true,
                files: { ttf: null, otf: null, woff: null, woff2: null }
            }
        ]);
    };

    const removeVariant = (id: string) => {
        // Prevent removing the last variant if we want to enforce at least one, 
        // but maybe allow removing and then validating on submit is better UX 
        // or just re-add one if empty? Let's allow empty and validate on submit.
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

        // Validate variants
        if (variants.length === 0) return alert('Please add at least one font variant.');

        // Validate that at least one variant has files
        const validVariants = variants.filter(v => Object.values(v.files).some(f => f !== null));
        if (validVariants.length === 0) return alert('Please upload files for at least one variant.');

        setLoading(true);

        try {
            // Generate a unique slug by appending a random string
            const baseSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const slug = baseSlug;

            // Check if font name already exists
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

            // Process Banner Items
            for (const item of bannerItems) {
                if (item.type === 'file') {
                    const file = item.content as File;
                    gallerySizes.push(file.size);

                    // Use timestamp to allow same filename multiple times
                    const bannerPath = `${folderPath}/gallery/${Date.now()}-${file.name}`;
                    const { error: bannerUploadError } = await supabase.storage
                        .from('fonts')
                        .upload(bannerPath, file, { upsert: true });

                    if (bannerUploadError) {
                        console.error(`Failed to upload banner ${file.name}:`, bannerUploadError);
                        continue;
                    }

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

            // Insert Record
            const { error: dbError } = await supabase
                .from('fonts')
                .insert([
                    {
                        name: formData.name,
                        designer: formData.designer || 'Unknown',
                        category: formData.tags[0], // Legacy support, use first tag
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

            if (dbError) {
                console.error('Database Error:', dbError);
                throw new Error(`Database insert failed: ${dbError.message}`);
            }

            // Retrieve new font ID
            const { data: insertedFont, error: insertError } = await supabase
                .from('fonts')
                .select('id')
                .eq('slug', slug)
                .single();

            if (insertError || !insertedFont) throw new Error('Failed to retrieve new font ID');

            // Upload and Insert Variants (Original Files)
            const variantsToConvert: { id: string; name: string; files: { ttf: File | null; otf: File | null } }[] = [];

            for (const variant of variants) {
                const variantUrls: any = {};
                const variantSizes: any = {};
                const promises = [];

                // Prepare for conversion queue if WOFF2 is missing but source exists
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
                        // Force appropriate extension based on format to ensure consistency
                        const newFileName = `${slug}-${variantSlug}.${format}`;
                        // Use the specific folder structure for variants: [id]/[slug]/variants/[VariantName]/[filename]
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

            // Queue background conversion for missing WOFF2
            console.log("Variants to convert:", variantsToConvert.length);
            if (variantsToConvert.length > 0) {
                queueWoff2Conversion(insertedFont.id, slug, variantsToConvert);
            }

            // Redirect immediately
            navigate(`/fonts/${slug}`);

        } catch (error: any) {
            console.error('Full Error Object:', error);
            alert(error.message || 'An error occurred during upload.');
        } finally {
            setLoading(false);
        }
    };

    // Role Check
    if (!profile || (profile.role !== 'member' && profile.role !== 'admin')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[84.4vh]  rounded-4xl text-center p-8 space-y-6">
                <div className="bg-red-100 p-6 rounded-full">
                    <div className="text-6xl">🔒</div>
                </div>
                <h1 className="text-4xl font-black uppercase">Access Restricted</h1>
                <p className="text-xl text-gray-600 max-w-lg">
                    Uploading fonts is currently restricted to approved <strong>Members</strong> and <strong>Admins</strong>.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/')} className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:scale-105 transition-transform">
                        Go Home
                    </button>
                    {/* Placeholder for future "Request Access" feature */}
                    <button disabled className="px-6 py-3 border-2 border-black text-black rounded-xl font-bold opacity-50 cursor-not-allowed">
                        Request Access
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl">
            <SEO title="Upload Font" />

            <div className="flex items-center justify-center">
                <div className="mt-6 mb-8 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-4">Upload Font</h1>
                    <p className="text-zinc-500 max-w-xl mx-auto">
                        Share your typographic creation with the world.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="rounded-4xl bg-white/5 border border-white/10 space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Meta Inputs */}
                <div className="col-span-1 space-y-4 p-4 md:p-8 border-y border-black">
                    <div>
                        <label className="block font-bold mb-2 uppercase">Font Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            onBlur={(e) => setFormData(prev => ({ ...prev, name: e.target.value.trim() }))}
                            className="w-full border-2 border-white/5 bg-white/5 p-3 rounded-2xl font-bold focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block font-bold mb-2 uppercase">Designer <span className="text-sm text-white/40 font-normal font-mono lowercase">(optional)</span></label>
                        <input
                            name="designer"
                            value={formData.designer}
                            onChange={handleChange}
                            onBlur={(e) => setFormData(prev => ({ ...prev, designer: e.target.value.trim() }))}
                            className="w-full border-2 border-white/5 bg-white/5 p-3 rounded-2xl font-bold focus:outline-none"
                            placeholder="Leave blank if unknown"
                        />
                    </div>
                </div>

                <div className='h-px mx-4 md:mx-8 bg-white/10' />

                {/* Variants Section */}
                <div className="col-span-1 md:col-span-2 p-4 md:p-8">
                    <div className="flex justify-start items-center mb-4">
                        <label className="font-bold uppercase text-lg">Font Variants <span className="text-sm text-red-500 font-normal normal-case ml-2">(At least one required)</span></label>
                    </div>

                    <div className="space-y-6">
                        {variants.map((variant) => (
                            <div key={variant.id} className="p-4 bg-black/30 border border-white/10 rounded-2xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        {variant.isCustom ? (
                                            <input
                                                type="text"
                                                value={variant.name}
                                                onChange={(e) => updateVariantName(variant.id, e.target.value)}
                                                className="border-2 border-white/5 rounded-lg px-3 py-1 font-bold bg-white/5 w-full focus:outline-none"
                                                placeholder="e.g. Demi Bold"
                                                autoFocus
                                            />
                                        ) : (
                                            <Select
                                                value={variant.name}
                                                onValueChange={(value: string) => updateVariantName(variant.id, value)}
                                            >
                                                <SelectTrigger className="border-2 border-white/5 rounded-lg px-4 py-2 font-bold bg-white/5 h-auto">
                                                    <SelectValue placeholder="Select variant" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {VARIANT_NAMES.filter(name => name === variant.name || !variants.some(v => v.name === name)).map(name => (
                                                        <SelectItem key={name} value={name}>{name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(variant.id)}
                                        className="text-zinc-600 hover:text-red-500 p-1"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {(['ttf', 'otf', 'woff', 'woff2'] as const).map(format => (
                                        <div key={format} className="relative">
                                            {variant.files[format] ? (
                                                <div className="flex items-center justify-between bg-[#BDF522]/10 border border-[#BDF522]/10 text-[#BDF522] rounded-lg p-2 text-xs font-mono">
                                                    <span className="truncate max-w-20">{variant.files[format]?.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateVariantFile(variant.id, format, null as any)}
                                                    >
                                                        <X size={14} className="text-green-700" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept={`.${format}`}
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) {
                                                                updateVariantFile(variant.id, format, e.target.files[0]);
                                                            }
                                                        }}
                                                        className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                                                    />
                                                    <div className="border border-white/5 bg-white/5 rounded-lg p-2 text-center text-xs font-mono text-white/40 hover:border-black hover:text-black transition-colors">
                                                        {format.toUpperCase()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {variants.length === 0 && (
                            <p className="text-red-500 text-center text-sm italic font-bold">
                                No variants added. Please add at least one variant.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end items-center mt-4 text-[12px] md:text-[14px]">
                        <div className="flex gap-2 flex-wrap justify-end">
                            <button
                                type="button"
                                onClick={addVariableFont}
                                className="px-4 py-2 rounded-full font-bold hover:bg-white/90 text-white/70 hover:text-black transition-colors cursor-pointer"
                            >
                                + Variable Font
                            </button>
                            <button
                                type="button"
                                onClick={addCustomVariant}
                                className="px-4 py-2 rounded-full font-bold hover:bg-white/90 text-white/70 hover:text-black transition-colors cursor-pointer"
                            >
                                + Custom Variant
                            </button>
                            <button
                                type="button"
                                onClick={addVariant}
                                disabled={variants.length >= VARIANT_NAMES.length + 10}
                                className={`px-4 py-2 rounded-full font-bold hover:bg-white/90 text-white/70 hover:text-black transition-colors cursor-pointer ${variants.length >= VARIANT_NAMES.length + 10
                                    ? 'cursor-not-allowed'
                                    : ''
                                    }`}
                            >
                                + Std Variant
                            </button>
                        </div>
                    </div>
                </div>

                <div className='h-px mx-4 md:mx-8 bg-white/10' />


                {/* Banner Image Section */}
                <div className="col-span-1 md:col-span-2 p-4 md:p-8 space-y-4">
                    <label className="block font-bold uppercase text-lg">Banner Gallery <span className="text-sm text-white/40 normal-case ml-2">(Optional - Multiple images allowed)</span></label>

                    {/* List of items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 empty:hidden">
                        {bannerItems.map((item) => (
                            <div key={item.id} className="relative group aspect-video bg-white/5 rounded-xl overflow-hidden border-2 border-white/5">
                                {item.type === 'file' ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                                        <ImageIcon className="text-gray-400 mb-1" />
                                        <span className="text-xs font-bold truncate w-full">{(item.content as File).name}</span>
                                    </div>
                                ) : (
                                    <img
                                        src={item.content as string}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeBannerItem(item.id)}
                                    className="absolute top-1 right-1 text-red-500 p-1 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        <div className="relative flex justify-center items-center group aspect-video bg-white/5 rounded-xl overflow-hidden border-2 border-dashed border-white/5">
                            <input
                                type="file"
                                multiple
                                accept="image/png, image/jpeg, image/webp, image/avif"
                                onChange={handleBannerFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full z-10"
                            />
                            <button
                                type="button"
                                className="flex flex-col items-center gap-2 font-bold text-white/40"
                            >
                                <UploadIcon size={28} />
                                Add Images
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {showUrlInput ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={e => setUrlInput(e.target.value)}
                                    placeholder="https://..."
                                    className="bg-white/5 border-2 border-white/5 rounded-lg px-2 py-1 focus:outline-none"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={addBannerUrl}
                                    className="bg-white hover:bg-white/90 text-black px-3 py-1 rounded-lg font-bold text-sm"
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowUrlInput(false)}
                                    className="text-white/40 hover:text-red-500"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowUrlInput(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-full font-bold bg-white/5 hover:bg-white/90 text-white/70 hover:text-black border border-white/5 transition-colors cursor-pointer"
                            >
                                <LinkIcon size={18} /> Add URL
                            </button>
                        )}
                    </div>
                </div >

                <div className='h-px mx-4 md:mx-8 bg-white/10' />

                <div className='space-y-4 p-4 md:p-8'>
                    <label className="block font-bold mb-4 uppercase">Categories</label>
                    <div className="flex flex-col gap-6 max-h-full overflow-y-auto">
                        {CATEGORIES.map((group, groupIndex) => (
                            <div key={groupIndex} className="flex flex-col gap-3">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest px-1">
                                    {group.group}
                                </h3>
                                <div className="flex gap-2 flex-wrap">
                                    {group.items.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleTagChange(cat.id)}
                                            className={`
                                                px-2 md:px-3 py-1 md:py-1.5 font-mono rounded-full border text-sm transition-all duration-200  hover:-translate-y-0.5
                                                ${formData.tags.includes(cat.id)
                                                    ? "bg-white text-black border-white shadow-md"
                                                    : " text-white/40 border-white/5 hover:bg-white/80 hover:text-black"
                                                }
                                            `}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='h-px mx-4 md:mx-8 bg-white/10' />

                <div className='p-4 -mt-4'>
                    <button
                        type="submit"
                        disabled={loading}
                        className="col-span-1 md:col-span-2 w-full  text-black py-4 rounded-4xl font-black uppercase tracking-wider bg-[#BDF522] hover:bg-[#FF6B00] transition-all flex justify-center items-center gap-2"
                    >
                        {loading ? 'Uploading...' : 'Submit Font'}
                    </button>
                </div>


            </form>
            {/* Admin Tools Section */}
            {profile?.role === 'admin' && (
                <FixWoff2Scanner />
            )}
        </div>
    );
};

export default Upload;
