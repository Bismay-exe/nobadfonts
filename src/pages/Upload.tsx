import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, File, X } from 'lucide-react';

const Upload = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        designer: '',
        tags: [] as string[],
    });

    const CATEGORIES = [
        { id: '3d', label: '3D' },
        { id: 'abstract', label: 'Abstract' },
        { id: 'aesthetic', label: 'Aesthetic' },
        { id: 'antique', label: 'Antique' },
        { id: 'art', label: 'Artistic' },
        { id: 'bold', label: 'Bold' },
        { id: 'branding', label: 'Branding' },
        { id: 'brutalist', label: 'Brutalist' },
        { id: 'calligraphy', label: 'Calligraphy' },
        { id: 'casual', label: 'Casual' },
        { id: 'chalk', label: 'Chalk' },
        { id: 'christmas', label: 'Christmas' },
        { id: 'classic', label: 'Classic' },
        { id: 'clean', label: 'Clean' },
        { id: 'comic', label: 'Comic' },
        { id: 'condensed', label: 'Condensed' },
        { id: 'cool', label: 'Cool' },
        { id: 'corporate', label: 'Corporate' },
        { id: 'culture', label: 'Cultural' },
        { id: 'curly', label: 'Curly' },
        { id: 'cute', label: 'Cute' },
        { id: 'cyberpunk', label: 'Cyberpunk' },
        { id: 'decorative', label: 'Decorative' },
        { id: 'display', label: 'Display' },
        { id: 'distorted', label: 'Distorted' },
        { id: 'elegant', label: 'Elegant' },
        { id: 'experimental', label: 'Experimental' },
        { id: 'fancy', label: 'Fancy' },
        { id: 'fat', label: 'Fat' },
        { id: 'feminine', label: 'Feminine' },
        { id: 'futuristic', label: 'Futuristic' },
        { id: 'geometric', label: 'Geometric' },
        { id: 'gothic', label: 'Gothic' },
        { id: 'grunge', label: 'Grunge' },
        { id: 'hairline', label: 'Hairline' },
        { id: 'handwritten', label: 'Handwritten' },
        { id: 'handwriting', label: 'Handwriting' },
        { id: 'hard-to-read', label: 'Hard to Read' },
        { id: 'headline', label: 'Headline' },
        { id: 'heavy', label: 'Heavy' },
        { id: 'hipster', label: 'Hipster' },
        { id: 'industrial', label: 'Industrial' },
        { id: 'italic', label: 'Italic' },
        { id: 'kids', label: 'Kids' },
        { id: 'light', label: 'Light' },
        { id: 'logo', label: 'Logo' },
        { id: 'long', label: 'Long' },
        { id: 'luxury', label: 'Luxury' },
        { id: 'masculine', label: 'Masculine' },
        { id: 'messy', label: 'Messy' },
        { id: 'minimal', label: 'Minimal' },
        { id: 'modern', label: 'Modern' },
        { id: 'monospace', label: 'Monospace' },
        { id: 'monospaced', label: 'Monospaced' },
        { id: 'neon', label: 'Neon' },
        { id: 'narrow', label: 'Narrow' },
        { id: 'old-school', label: 'Old School' },
        { id: 'organic', label: 'Organic' },
        { id: 'outline', label: 'Outline' },
        { id: 'pixel', label: 'Pixel' },
        { id: 'playful', label: 'Playful' },
        { id: 'poster', label: 'Poster' },
        { id: 'psychedelic', label: 'Psychedelic' },
        { id: 'retro', label: 'Retro' },
        { id: 'regular', label: 'Regular' },
        { id: 'rounded', label: 'Rounded' },
        { id: 'romantic', label: 'Romantic' },
        { id: 'sans-serif', label: 'Sans Serif' },
        { id: 'script', label: 'Script' },
        { id: 'serif', label: 'Serif' },
        { id: 'signature', label: 'Signature' },
        { id: 'slab-serif', label: 'Slab Serif' },
        { id: 'soft', label: 'Soft' },
        { id: 'sport', label: 'Sport' },
        { id: 'square', label: 'Square' },
        { id: 'stencil', label: 'Stencil' },
        { id: 'strong', label: 'Strong' },
        { id: 'tech', label: 'Tech' },
        { id: 'thin', label: 'Thin' },
        { id: 'typewriter', label: 'Typewriter' },
        { id: 'vintage', label: 'Vintage' },
        { id: 'wedding', label: 'Wedding' },
        { id: 'wide', label: 'Wide' },
        { id: 'wild', label: 'Wild' },
    ];




    // Store files for each format
    const [files, setFiles] = useState<{
        ttf: File | null;
        otf: File | null;
        woff: File | null;
        woff2: File | null;
    }>({
        ttf: null,
        otf: null,
        woff: null,
        woff2: null
    });

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

    const handleFileChange = (format: keyof typeof files) => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [format]: e.target.files![0] }));
        }
    };

    const removeFile = (format: keyof typeof files) => {
        setFiles(prev => ({ ...prev, [format]: null }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return alert('You must be logged in to upload');
        if (formData.tags.length === 0) return alert('Please select at least one category.');

        // Validate at least one file
        const hasFile = Object.values(files).some(f => f !== null);
        if (!hasFile) return alert('Please upload at least one font format (TTF, OTF, WOFF, or WOFF2).');

        setLoading(true);

        try {
            // Generate a unique slug by appending a random string
            const baseSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
            const folderPath = `${user.id}/${slug}`;
            const uploadUrls: any = {};

            // Helper to upload a single file
            const uploadFile = async (file: File, format: string) => {
                const filePath = `${folderPath}/${file.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('fonts')
                    .upload(filePath, file, { upsert: true });

                if (uploadError) throw new Error(`Failed to upload ${format.toUpperCase()}: ${uploadError.message}`);

                const { data: { publicUrl } } = supabase.storage
                    .from('fonts')
                    .getPublicUrl(filePath);

                return publicUrl;
            };

            // Upload all selected files in parallel
            const uploadPromises = [];
            if (files.ttf) uploadPromises.push(uploadFile(files.ttf, 'ttf').then(url => uploadUrls.ttf_url = url));
            if (files.otf) uploadPromises.push(uploadFile(files.otf, 'otf').then(url => uploadUrls.otf_url = url));
            if (files.woff) uploadPromises.push(uploadFile(files.woff, 'woff').then(url => uploadUrls.woff_url = url));
            if (files.woff2) uploadPromises.push(uploadFile(files.woff2, 'woff2').then(url => uploadUrls.woff2_url = url));

            await Promise.all(uploadPromises);

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
                        // Spread the uploaded URLs
                        ...uploadUrls
                    }
                ]);

            if (dbError) {
                console.error('Database Error:', dbError);
                throw new Error(`Database insert failed: ${dbError.message}`);
            }

            alert('Font uploaded successfully!');
            navigate('/profile');
        } catch (error: any) {
            console.error('Full Error Object:', error);
            alert(error.message || 'Error uploading font');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto">
            <form onSubmit={handleSubmit} className="rounded-3xl grid grid-cols-1 md:grid-cols-2">

                <h1 className="hidden col-span-1 md:col-span-2 text-4xl bg-white p-4 rounded-3xl border-b border-black text-center md:text-left font-black uppercase">Upload Font</h1>
                {/* Meta Inputs */}
                <div className="col-span-1 space-y-4 bg-white p-8 rounded-3xl border-r border-b border-black">
                    <div>
                        <label className="block font-bold mb-2 uppercase">Font Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full border-2 border-black p-3 rounded-2xl font-bold focus:outline-none focus:ring-4 ring-[#FF90E8]"
                            required
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

                <div className="col-span-1 bg-white p-8 rounded-3xl border-l border-y border-black">
                    <label className="block font-bold mb-4 uppercase text-lg">Font Files <span className="text-sm text-red-500 normal-case ml-2">(At least one required)</span></label>
                    <div className="grid grid-cols-1 gap-4">
                        {(['ttf', 'otf', 'woff', 'woff2'] as const).map((format) => (
                            <div key={format} className="flex items-center gap-4">
                                <div className="w-20 font-black uppercase text-xl bg-gray-100 py-2 text-center rounded-lg border-2 border-black">
                                    {format}
                                </div>

                                {files[format] ? (
                                    <div className="flex-1 flex justify-between items-center bg-green-50 border-2 border-green-500 p-3 rounded-xl">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <File className="text-green-600 shrink-0" />
                                            <span className="font-bold truncate">{files[format]?.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(format)}
                                            className="p-1 hover:bg-green-200 rounded-full transition-colors"
                                        >
                                            <X size={20} className="text-green-700" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 relative cursor-pointer group">
                                        <input
                                            type="file"
                                            accept={`.${format}`}
                                            onChange={handleFileChange(format)}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="border-2 border-dashed border-gray-300 group-hover:border-black group-hover:bg-gray-50 p-3 rounded-xl flex items-center justify-center transition-all">
                                            <span className="font-bold text-gray-400 group-hover:text-black flex items-center gap-2">
                                                <UploadIcon size={16} /> Upload .{format}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className='col-span-1 md:col-span-2 space-y-4 bg-white p-8 rounded-3xl border-y border-black'>
                    <label className="block font-bold mb-2 uppercase">Categories</label>
                    <div className="flex gap-2 flex-wrap max-h-full overflow-y-auto p-1">
                        {CATEGORIES.map(cat => (
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
                
                <button
                    type="submit"
                    disabled={loading}
                    className="col-span-1 md:col-span-2 w-full bg-white text-black py-4 rounded-3xl font-black uppercase tracking-wider hover:bg-[#FF6B00] hover:border-black border-r border-t border-b-2 border-black transition-all flex justify-center items-center gap-2"
                >
                    {loading ? 'Uploading...' : 'Submit Font'}
                </button>
            </form>
        </div>
    );
};

export default Upload;
