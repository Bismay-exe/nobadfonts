import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const FEATURED_FONTS = [
    { id: 1, name: 'Bricolage Grotesque', style: 'Sans Serif', creator: 'Mathieu Réguer' },
    { id: 2, name: 'Big Shoulders', style: 'Display', creator: 'Patric King' },
    { id: 3, name: 'Inter', style: 'Sans', creator: 'Rasmus Andersson' },
    { id: 4, name: 'Baleron', style: 'Serif', creator: 'Unknown' },
];

export default function FeaturedFonts() {
    return (
        <section className="py-24 px-4 overflow-hidden">
            <div className="max-w-7xl mx-auto mb-12 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Featured Collection</h2>
                    <p className="text-zinc-400">Hand-picked typefaces for the week.</p>
                </div>
                <button className="text-white flex items-center gap-2 hover:underline underline-offset-4">
                    View All <ArrowUpRight className="h-4 w-4" />
                </button>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar snap-x snap-mandatory">
                {FEATURED_FONTS.map((font, i) => (
                    <FontCard key={font.id} font={font} index={i} />
                ))}
            </div>
        </section>
    );
}

function FontCard({ font, index }: { font: any; index: number }) {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            onClick={() => navigate(`/fonts/`)} // Assuming ID isn't real yet, just placeholder logic
            className="min-w-75 md:min-w-100 snap-center group cursor-pointer"
        >
            <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="aspect-4/3 bg-zinc-900 rounded-2xl border border-white/5 p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-500 group-hover:border-white/20">

                <div className="relative z-10">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{font.style}</span>
                </div>

                <h3
                    className="relative z-10 text-6xl text-white font-bold leading-none tracking-tighter transition-transform duration-500 group-hover:scale-105 origin-bottom-left"
                    style={{ fontFamily: font.name !== 'Inter' ? font.name : 'sans-serif' }}
                >
                    Aa
                </h3>
            </div>

            <div className="mt-4 flex justify-between items-center px-2">
                <div>
                    <h4 className="text-white font-medium text-lg">{font.name}</h4>
                    <p className="text-zinc-500 text-sm">by {font.creator}</p>
                </div>
                <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center text-white opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                    <ArrowUpRight size={18} />
                </div>
            </div>
        </motion.div>
    );
}
