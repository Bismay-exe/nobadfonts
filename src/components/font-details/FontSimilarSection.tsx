import { useState } from 'react';
import { Type, Image as ImageIcon } from 'lucide-react';
import FontCard from '../fonts/FontCard';
import type { Font } from '../../types/font';

interface FontSimilarSectionProps {
    similarFonts: Font[];
}

export default function FontSimilarSection({ similarFonts }: FontSimilarSectionProps) {
    const [viewMode, setViewMode] = useState<'font' | 'image'>('font');

    if (!similarFonts || similarFonts.length === 0) return null;

    return (
        <div className="space-y-8 pt-12 border-t border-[rgb(var(--color-foreground)/0.1)] mt-12">
            <div className="flex justify-between items-center gap-2">
                <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--color-foreground))] tracking-tight">
                    You might also like
                </h2>

                <div className="flex items-center">
                    <div className="flex bg-[rgb(var(--color-foreground)/0.05)] backdrop-blur-md h-10 p-1 w-auto rounded-full border border-[rgb(var(--color-foreground)/0.1)]">
                        <button
                            onClick={() => setViewMode('font')}
                            className={`p-1.5 aspect-square rounded-full transition-all cursor-pointer ${
                                viewMode === 'font'
                                    ? 'bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))] shadow-[0_0_15px_rgba(var(--color-highlight),0.3)]'
                                    : 'text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]'
                            }`}
                            title="Font View"
                        >
                            <Type size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('image')}
                            className={`p-1.5 aspect-square rounded-full transition-all cursor-pointer ${
                                viewMode === 'image'
                                    ? 'bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))] shadow-[0_0_15px_rgba(var(--color-highlight),0.3)]'
                                    : 'text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]'
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
    );
}
