import { motion } from 'framer-motion';

const STATS = [
    { label: 'Curated Fonts', value: '500+' },
    { label: 'Total Downloads', value: '50k+' },
    { label: 'Active Designers', value: '10k+' },
    { label: 'Countries', value: '120+' },
];

export default function Statistics() {
    return (
        <section className="py-20 bg-[#FFEDD4] w-full border-b-2 border-black rounded-3xl">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {STATS.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-400">
                                {stat.value}
                            </div>
                            <div className="text-gray-400">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
