import { Search } from 'lucide-react';
import type { FontFilterParams } from '../../types/font';
import { useState } from 'react';

interface FiltersProps {
    filters: FontFilterParams;
    onChange: (newFilters: FontFilterParams) => void;
}

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

const SORT_OPTIONS = [
    { id: 'trending', label: 'Trending' },
    { id: 'popular', label: 'Most Popular' },
    { id: 'editor-picks', label: 'Editor’s picks' },
    { id: 'featured', label: 'Featured' },
    { id: 'newest', label: 'Newest' },
    { id: 'alpha', label: 'A-Z' },
];

export default function Filters({ filters, onChange }: FiltersProps) {
    const handleChange = (key: keyof FontFilterParams, value: any) => {
        onChange({ ...filters, [key]: value });
    };

    const [isSortOpen, setIsSortOpen] = useState(false);

    // Find current label
    const currentSortLabel = SORT_OPTIONS.find(opt => opt.id === (filters.sortBy || 'trending'))?.label || 'Trending';

    return (
        <div className="gap-8 sticky top-24 grid grid-cols-1 md:grid-cols-2">

            {/* Categories */}
            <div className='col-span-1 md:col-span-2'>
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-500">Categories</h4>
                <div className="flex gap-2 flex-wrap max-h-96 overflow-y-auto p-1">
                    {CATEGORIES.map(cat => {
                        const isSelected = filters.categories?.includes(cat.id);
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                    const current = filters.categories || [];
                                    const newCategories = current.includes(cat.id)
                                        ? current.filter(c => c !== cat.id)
                                        : [...current, cat.id];
                                    handleChange('categories', newCategories);
                                }}
                                className={`
                                    px-3 py-1.5 font-bold rounded-full border-2 text-sm transition-all duration-200 text-left
                                    ${isSelected
                                        ? "bg-black text-white border-black shadow-md"
                                        : "bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black hover:-translate-y-0.5"
                                    }
                                `}
                            >
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>


            {/* Search */}
            <div className="relative col-span-1">
                <input
                    type="text"
                    placeholder="Search fonts..."
                    value={filters.query || ''}
                    onChange={(e) => handleChange('query', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-700 bg-black/10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>

            {/* Sort */}
            <div className='col-span-1 flex flex-col md:items-end gap-2 relative z-50'>
                <div className="flex items-center gap-3 w-full md:justify-end">
                    <h4 className="w-full md:w-auto font-semibold text-sm uppercase tracking-wider text-gray-500">Sort By</h4>
                    <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="w-full md:w-52 px-4 py-2 flex justify-between items-center border border-gray-700 bg-black/10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                    >
                        <span>{currentSortLabel}</span>
                        <span className={`transform transition-transform ${isSortOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                </div>

                {/* Dropdown Menu */}
                <div
                    className={`
                        w-full md:w-52
                        overflow-hidden
                        transition-all
                        duration-400
                        ease-linear
                        ${isSortOpen ? 'max-h-100 opacity-100 translate-y-0' : 'max-h-0 opacity-100 -translate-y-10 scale-0 pointer-events-none'}
                    `}
                >
                    <div className="overflow-hidden flex flex-col gap-1">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => {
                                    handleChange('sortBy', opt.id);
                                    setIsSortOpen(false);
                                }}
                                className={`
                                    text-left px-4 py-2 rounded-full border border-black font-bold transition-colors
                                    ${filters.sortBy === opt.id
                                        ? 'bg-black text-white'
                                        : 'hover:bg-gray-100 text-gray-700'
                                    }
                                `}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
