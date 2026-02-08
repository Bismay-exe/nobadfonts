import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, X, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

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
                { id: 'sans-serif', label: 'Sans Serif' },
                { id: 'serif', label: 'Serif' },
                { id: 'slab-serif', label: 'Slab Serif' },
                { id: 'script', label: 'Script' },
                { id: 'monospace', label: 'Monospace' },
                { id: 'display', label: 'Display' },
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
                { id: 'tech', label: 'Tech' },
            ],
        },

        {
            group: 'Weight & Shape',
            items: [
                { id: 'light', label: 'Light' },
                { id: 'regular', label: 'Regular' },
                { id: 'heavy', label: 'Heavy' },
                { id: 'condensed', label: 'Condensed' },
                { id: 'wide', label: 'Wide' },
                { id: 'tall', label: 'Tall' },      // NEW
                { id: 'rounded', label: 'Rounded' },
            ],
        },

        {
            group: 'Era & Vibe',
            items: [
                { id: 'retro', label: 'Retro' },
                { id: 'vintage', label: 'Vintage' },
                { id: 'futuristic', label: 'Futuristic' }, // CONFIRMED
                { id: 'gothic', label: 'Gothic' },
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
        if (variants.length >= VARIANT_NAMES.length) return;
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return alert('You must be logged in to upload');
        if (formData.tags.length === 0) return alert('Please select at least one category.');

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
            const uploadUrls: any = {};
            const galleryUrls: string[] = [];

            const gallerySizes: number[] = [];

            // Process Banner Items
            for (const item of bannerItems) {
                if (item.type === 'file') {
                    const file = item.content as File;
                    gallerySizes.push(file.size); // Track size

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
                    // For URLs, we can't easily get size without fetching, so 0 or null
                    gallerySizes.push(0);
                    galleryUrls.push(item.content as string);
                }
            }

            const previewImageUrl = galleryUrls.length > 0 ? galleryUrls[0] : null;
            // Assuming first gallery image is preview, tracking its size separately as well if needed, 
            // but the new column file_size_image_preview is for it.
            const previewImageSize = gallerySizes.length > 0 ? gallerySizes[0] : null;





            console.log("Files uploaded. URLs:", uploadUrls);

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
                        // Spread the uploaded URLs and Sizes

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


            // Actually, we need the ID. Let's assume the insert returns data if we ask.
            // But standard insert doesn't return unless .select() is chained.

            // Refetch or use a select insert
            const { data: insertedFont, error: insertError } = await supabase
                .from('fonts')
                .select('id')
                .eq('slug', slug)
                .single();

            if (insertError || !insertedFont) throw new Error('Failed to retrieve new font ID');

            // Upload and Insert Variants
            for (const variant of variants) {
                const variantUrls: any = {};
                const variantSizes: any = {};
                const promises = [];

                for (const format of ['ttf', 'otf', 'woff', 'woff2'] as const) {
                    const file = variant.files[format];
                    if (file) {
                        const fileName = file.name;
                        // Use the specific folder structure for variants: [id]/[slug]/variants/[VariantName]/[filename]
                        const variantPath = `${folderPath}/variants/${variant.name}/${fileName}`;

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

            alert('Font uploaded successfully!');
            navigate(`/fonts/${slug}`);
        } catch (error: any) {
            console.error('Full Error Object:', error);
            alert(error.message || 'A font with same name is already exist!');
        } finally {
            setLoading(false);
        }
    };

    // Role Check
    if (!profile || (profile.role !== 'member' && profile.role !== 'admin')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6">
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
        <div className="mx-auto">
            <form onSubmit={handleSubmit} className="rounded-4xl grid grid-cols-1 md:grid-cols-2">

                <h1 className="md:hidden col-span-1 md:col-span-2 text-4xl bg-white p-4 rounded-4xl border-b border-black text-center md:text-left font-black uppercase">Upload Font</h1>
                {/* Meta Inputs */}
                <div className="col-span-1 space-y-4 bg-white p-8 rounded-4xl border-r border-b border-black">
                    <div>
                        <label className="block font-bold mb-2 uppercase">Font Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full border-2 border-black p-3 rounded-2xl font-bold focus:outline-none focus:ring-4 ring-[#FF90E8]"

                        />
                    </div>

                    <div>
                        <label className="block font-bold mb-2 uppercase">Designer <span className="text-sm text-gray-500 lowercase">(optional)</span></label>
                        <input
                            name="designer"
                            value={formData.designer}
                            onChange={handleChange}
                            className="w-full border-2 border-black p-3 rounded-2xl font-bold focus:outline-none focus:ring-4 ring-[#00C2FF]"
                            placeholder="Leave blank if unknown"
                        />
                    </div>
                </div>





                {/* Variants Section */}
                <div className="col-span-1 md:col-span-2 bg-white p-8 rounded-4xl border-l border-y border-black border-t-0 md:border-t">
                    <div className="flex justify-between items-center mb-4">
                        <label className="font-bold uppercase text-lg">Font Variants <span className="text-sm text-red-500 normal-case ml-2">(At least one required)</span></label>
                        <button
                            type="button"
                            onClick={addVariant}
                            disabled={variants.length >= VARIANT_NAMES.length}
                            className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${variants.length >= VARIANT_NAMES.length
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-black text-white hover:bg-gray-800'
                                }`}
                        >
                            + Add Variant
                        </button>
                    </div>

                    <div className="space-y-6">
                        {variants.map((variant) => (
                            <div key={variant.id} className="p-4 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Variant Name</label>
                                        <select
                                            value={variant.name}
                                            onChange={(e) => updateVariantName(variant.id, e.target.value)}
                                            className="border-2 border-black rounded-lg px-3 py-1 font-bold bg-white"
                                        >
                                            {VARIANT_NAMES.filter(name => name === variant.name || !variants.some(v => v.name === name)).map(name => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(variant.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {(['ttf', 'otf', 'woff', 'woff2'] as const).map(format => (
                                        <div key={format} className="relative">
                                            {variant.files[format] ? (
                                                <div className="flex items-center justify-between bg-green-100 border border-green-300 rounded-lg p-2 text-xs font-bold">
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
                                                    <div className="border border-gray-300 bg-white rounded-lg p-2 text-center text-xs font-bold text-gray-500 hover:border-black hover:text-black transition-colors">
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
                </div>
                {/* Banner Image Section */}
                <div className="col-span-1 md:col-span-2 bg-white p-8 rounded-4xl border-x border-b border-black md:border-t-0 space-y-4">
                    <label className="block font-bold uppercase text-lg">Banner Gallery <span className="text-sm text-gray-500 normal-case ml-2">(Optional - Multiple images allowed)</span></label>

                    {/* List of items */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 empty:hidden">
                        {bannerItems.map((item) => (
                            <div key={item.id} className="relative group aspect-video bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
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
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="relative">
                            <input
                                type="file"
                                multiple
                                accept="image/png, image/jpeg, image/webp, image/avif"
                                onChange={handleBannerFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full z-10"
                            />
                            <button
                                type="button"
                                className="flex items-center gap-2 px-4 py-2 rounded-full font-bold border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 transition-all text-gray-500 hover:text-black"
                            >
                                <UploadIcon size={18} /> Add Images
                            </button>
                        </div>

                        <div className="flex gap-2">
                            {showUrlInput ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="url"
                                        value={urlInput}
                                        onChange={e => setUrlInput(e.target.value)}
                                        placeholder="https://..."
                                        className="border-2 border-black rounded-lg px-2 py-1 focus:outline-none"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={addBannerUrl}
                                        className="bg-black text-white px-3 py-1 rounded-lg font-bold text-sm"
                                    >
                                        Add
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowUrlInput(false)}
                                        className="text-gray-500 hover:text-black"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowUrlInput(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full font-bold border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 transition-all text-gray-500 hover:text-black"
                                >
                                    <LinkIcon size={18} /> Add URL
                                </button>
                            )}
                        </div>
                    </div>
                </div >

                <div className='col-span-1 md:col-span-2 space-y-4 bg-white p-8 rounded-4xl border-y border-black'>
                    <label className="block font-bold mb-2 uppercase">Categories</label>
                    <div className="flex flex-col gap-6 max-h-full overflow-y-auto p-1">
                        {CATEGORIES.map((group, groupIndex) => (
                            <div key={groupIndex} className="flex flex-col gap-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">
                                    {group.group}
                                </h3>
                                <div className="flex gap-2 flex-wrap">
                                    {group.items.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleTagChange(cat.id)}
                                            className={`
                                                px-3 py-1.5 font-bold rounded-full border-2 text-sm transition-all duration-200
                                                ${formData.tags.includes(cat.id)
                                                    ? "bg-black text-white border-black shadow-md"
                                                    : "bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black hover:-translate-y-0.5"
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

                <button
                    type="submit"
                    disabled={loading}
                    className="col-span-1 md:col-span-2 w-full bg-white text-black py-4 rounded-4xl font-black uppercase tracking-wider hover:bg-[#FF6B00] hover:border-black border-r border-t border-b-2 border-black transition-all flex justify-center items-center gap-2"
                >
                    {loading ? 'Uploading...' : 'Submit Font'}
                </button>
            </form>
        </div>
    );
};

export default Upload;
