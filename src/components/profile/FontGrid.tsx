import FontCard from '../fonts/FontCard';
import type { Font } from '../../types/font';

interface FontGridProps {
    fonts: Font[];
    emptyMessage?: string;
    loading?: boolean;
    viewMode?: 'font' | 'image';
}

export default function FontGrid({ fonts, emptyMessage = "No fonts found.", loading = false, viewMode = 'font' }: FontGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-4xl h-64 animate-pulse" />
                ))}
            </div>
        );
    }

    if (fonts.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-4xl border border-dashed border-gray-200">
                <p className="text-gray-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="gap-0"
            style={{
                columnWidth: 'clamp(220px, 20vw, 320px)',
            }}>
            {fonts.map((font) => (
                <div key={font.id} className="h-full">
                    <FontCard font={font} viewMode={viewMode} />
                </div>
            ))}
        </div>
    );
}
