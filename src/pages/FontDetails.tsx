import { Link, useNavigate, useParams } from 'react-router-dom';
import { Download, Heart, Share2, ArrowLeft, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useFont } from '../hooks/useFont';
import FontTester from '../components/fonts/FontTester';
import { PreviewAccordion } from '../components/fonts/PreviewAccordion';

export default function FontDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { font, loading, error, isFavorited, setIsFavorited } = useFont(id);
    const [copied, setCopied] = useState(false);
    const [isFontLoaded, setIsFontLoaded] = useState(false);

    const [variantPreviewText, setVariantPreviewText] = useState('');
    const [variantPreviewSize, setVariantPreviewSize] = useState(48);

    useEffect(() => {
        if (!font) return;

        // Load main font
        const fontUrl = font.woff2_url || font.woff_url || font.ttf_url || font.otf_url;
        if (fontUrl) {
            const fontFamily = `font-${font.id}`;
            const fontFace = new FontFace(fontFamily, `url(${fontUrl})`);
            fontFace.load().then((loadedFace) => {
                document.fonts.add(loadedFace);
                setIsFontLoaded(true);
            }).catch((err) => {
                console.error(`Failed to load font ${font.name}:`, err);
            });
        }

        // Load variant fonts
        font.font_variants?.forEach(variant => {
            const variantUrl = variant.woff2_url || variant.woff_url || variant.ttf_url || variant.otf_url;
            if (variantUrl) {
                const variantFamily = `font-${font.id}-${variant.variant_name}`;
                const variantFace = new FontFace(variantFamily, `url(${variantUrl})`);
                variantFace.load().then((loadedFace) => {
                    document.fonts.add(loadedFace);
                }).catch((err) => {
                    console.error(`Failed to load variant ${variant.variant_name}:`, err);
                });
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



            {/* Header */}
            <div className="relative column col-span-3  justify-between items-start md:items-center gap-4">
                <div className='flex flex-col items-start justify-end w-full md:w-auto bg-[#BDF522] rounded-3xl border-2 border-black p-4'>
                    {/* Back Button */}
                    <Link to="/fonts" className="absolute top-3 left-3 inline-flex items-center bg-black px-3 py-2 rounded-full font-semibold text-gray-50 hover:text-gray-900 mb-8 transition-colors">
                        <ArrowLeft size={18} className="mr-2" />
                        Back to Catalog
                    </Link>
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

                    {/* Format Badges */}
                    <div className="flex gap-2 mt-2">
                        {availableFormats.map(f => (
                            <span key={f.label} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {f.label}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-start justify-end h-full w-full bg-white rounded-3xl border-2 border-black p-4">
                    <div className="flex flex-wrap gap-1">
                        {displayTags.map((tag, i) => (
                            <div key={i} className="bg-gray-900 text-gray-300 text-xs px-6 py-4 rounded-full font-medium">
                                {tag}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex md:flex-col justify-between">
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
                                fontFamily: `font-${font.id}-${variant.variant_name}`,
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
            <div className="grid grid-cols-1 lg:grid-cols-3">
                {/* Left Column: Tester (Span 2) */}
                <div className="lg:col-span-2 space-y-8">
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
                <div id='download' className="lg:col-span-3 bg-white border border-black rounded-3xl p-6">
                    <h3 className="font-bold text-lg mb-4">Download Default</h3>

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
                </div>

                {/* Variants Section */}
                {font.font_variants && font.font_variants.length > 0 && (
                    <div className="lg:col-span-3 border border-black rounded-3xl">
                        <div className="grid grid-cols-1">
                            {font.font_variants.map(variant => (
                                <div key={variant.id} className=" bg-white border border-black rounded-3xl p-4 hover:border-black transition-colors">
                                    <h4 className="font-bold mb-3">{variant.variant_name}</h4>
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
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
