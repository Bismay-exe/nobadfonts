import { Link } from 'react-router-dom';
import { Heart, Download } from 'lucide-react';
import type { Font } from '../../types/font';
import { useEffect, useState } from 'react';

interface FontCardProps {
    font: Font;
}

export default function FontCard({ font }: FontCardProps) {
    const [isFontLoaded, setIsFontLoaded] = useState(false);

    useEffect(() => {
        if (!font) return;

        const getFontSource = () => {
            if (font.woff2_url) return { url: font.woff2_url, format: 'woff2' };
            if (font.woff_url) return { url: font.woff_url, format: 'woff' };
            if (font.ttf_url) return { url: font.ttf_url, format: 'truetype' };
            if (font.otf_url) return { url: font.otf_url, format: 'opentype' };
            return null;
        };

        const fontSource = getFontSource();
        if (!fontSource) return;

        const { url, format } = fontSource;
        const fontFamily = `font-${font.id}`;
        const source = `url(${url}) format('${format}')`;
        const fontFace = new FontFace(fontFamily, source);

        fontFace.load().then((loadedFace) => {
            document.fonts.add(loadedFace);
            setIsFontLoaded(true);
        }).catch((err) => {
            console.error(`Failed to load font ${font.name}:`, err);
        });
    }, [font.id, font.woff2_url, font.woff_url, font.ttf_url, font.otf_url]);

    if (!font) return null;

    // Safety check for tags/category
    const displayTags = (font.tags && Array.isArray(font.tags) && font.tags.length > 0)
        ? font.tags
        : (font.category ? [font.category] : []);

    return (
        <div className="group relative bg-white rounded-3xl border-2 border-black hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
            {/* Preview Area */}
            <Link to={`/fonts/${font.id}`} className="h-full w-full bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden group/preview">
                {/* Fallback text if no preview image, or overlay text */}
                <p
                    className="text-8xl md:text-6xl text-gray-800 text-center wrap-break-word w-full transition-opacity duration-300"
                    style={{
                        fontFamily: isFontLoaded ? `'font-${font.id}'` : 'sans-serif',
                        opacity: isFontLoaded ? 1 : 0
                    }}
                >
                    {font.name}
                </p>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        className="p-2 bg-black rounded-full shadow-sm text-white hover:text-red-500 transition-colors pointer-events-auto"
                        onClick={(e) => {
                            e.preventDefault();
                            // Add favorite logic here
                        }}
                    >
                        <Heart size={18} />
                    </button>
                </div>

                {/* Info Area */}
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/30 to-transparent p-4 grow flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <div>
                        <div className="flex justify-between items-start mb-1 gap-2">
                            <div className="flex flex-wrap gap-1">
                                {displayTags.map((tag, i) => (
                                    <div key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                                        {tag}
                                    </div>
                                ))}
                            </div>
                            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Quick Download">
                                <Download size={18} />
                            </button>
                        </div>
                    </div>
                </div> </Link>
        </div>
    );
}
