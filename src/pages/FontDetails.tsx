import { Link, useNavigate, useParams } from 'react-router-dom';
import { Download, Heart, Share2, ArrowLeft, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useFont } from '../hooks/useFont';
import FontTester from '../components/fonts/FontTester';

export default function FontDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { font, loading, error, isFavorited, setIsFavorited } = useFont(id);
    const [copied, setCopied] = useState(false);
    const [isFontLoaded, setIsFontLoaded] = useState(false);

    useEffect(() => {
        if (!font) return;

        const fontUrl = font.woff2_url || font.woff_url || font.ttf_url || font.otf_url;
        if (!fontUrl) return;

        const fontFamily = `font-${font.id}`;
        const fontFace = new FontFace(fontFamily, `url(${fontUrl})`);

        fontFace.load().then((loadedFace) => {
            document.fonts.add(loadedFace);
            setIsFontLoaded(true);
        }).catch((err) => {
            console.error(`Failed to load font ${font.name}:`, err);
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

    const downloadFont = async (format: 'ttf' | 'otf' | 'woff' | 'woff2') => {
        if (!font) return;

        const urlKey = `${format}_url` as keyof typeof font;
        const url = font[urlKey];

        if (!url) return alert('This format is not available.');

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
            link.href = url as string;
            link.download = `${font.slug}.${format}`;
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

    // Safety check for tags/category
    const displayTags = (font.tags && Array.isArray(font.tags) && font.tags.length > 0)
        ? font.tags
        : (font.category ? [font.category] : []);


    return (
        <div className="mx-auto">
            <div className='relative h-100 w-full bg-white rounded-3xl border-2 border-black flex justify-center items-center'>
                <h1
                    style={{
                        fontFamily: isFontLoaded ? `font-${font.id}` : 'sans-serif',
                        opacity: isFontLoaded ? 1 : 0
                    }}
                    className="text-9xl text-center text-gray-900 mb-2 transition-opacity duration-300">{font.name}</h1>
            </div>



            {/* Header */}
            <div className="relative column col-span-3  justify-between items-start md:items-center gap-4">
                <div className='flex flex-col items-start justify-end w-full md:w-auto bg-white rounded-3xl border-2 border-black p-4'>
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
                    <h3 className="font-bold text-lg mb-4">Download Options</h3>

                    <div className="flex flex-col md:flex-row gap-3">
                        {availableFormats.length > 0 ? (
                            availableFormats.map(format => (
                                <button
                                    key={format.label}
                                    onClick={() => downloadFont(format.type)}
                                    className="w-full flex items-center justify-between px-6 py-4 bg-black text-white rounded-3xl hover:bg-[#00C2FF] hover:text-black border-2 border-transparent transition-all font-black uppercase text-sm"
                                >
                                    <span className="flex items-center gap-2">
                                        <Download size={18} />
                                        <span>Download {format.label}</span>
                                    </span>
                                    <span className="text-xs opacity-70 font-normal">.{(format.type as string).toUpperCase()}</span>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-4 text-gray-400 italic">
                                No download formats available.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
