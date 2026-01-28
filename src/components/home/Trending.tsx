import { motion } from 'framer-motion';

// Mock data for initial development
const TRENDING_FONTS = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    name: `Font ${i + 1}`,
    designer: 'Designer Name',
    image: `https://placehold.co/300x200?text=Font+${i + 1}`
}));

export default function Trending() {
    return (
        <section className="py-20 w-full border-b-2 border-black bg-white rounded-3xl">
            <div className="container mx-auto px-4 mb-10">
                <h2 className="text-3xl font-bold">Trending This Week</h2>
                <p className="text-gray-500">Most downloaded fonts by the community</p>
            </div>

            <div className="relative">
                <motion.div
                    className="flex space-x-6 px-4"
                    animate={{ x: [0, -1000] }}
                    transition={{
                        repeat: Infinity,
                        duration: 20,
                        ease: "linear",
                        repeatType: "loop" // Basic loop for now, needs better infinite scroll logic later
                    }}
                >
                    {[...TRENDING_FONTS, ...TRENDING_FONTS].map((font, idx) => (
                        <div
                            key={`${font.id}-${idx}`}
                            className="shrink-0 w-80 group cursor-pointer"
                        >
                            <div className="aspect-3/2 rounded-xl overflow-hidden bg-gray-100 mb-4">
                                <img
                                    src={font.image}
                                    alt={font.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>
                            <h3 className="text-lg font-bold">{font.name}</h3>
                            <p className="text-sm text-gray-500">by {font.designer}</p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
