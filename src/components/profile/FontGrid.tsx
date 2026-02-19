import FontCard from '../fonts/FontCard';
import type { Font } from '../../types/font';
import { motion } from 'framer-motion';

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
                    <div key={i} className="bg-zinc-900/50 rounded-3xl h-64 animate-pulse border border-white/5" />
                ))}
            </div>
        );
    }

    if (fonts.length === 0) {
        return (
            <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-dashed border-white/10">
                <p className="text-zinc-500 font-medium">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {fonts.map((font, idx) => (
                <motion.div
                    key={font.id}
                    className="h-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                >
                    <FontCard font={font} viewMode={viewMode} />
                </motion.div>
            ))}
        </div>
    );
}
