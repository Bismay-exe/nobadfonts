import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroNew() {
    return (
        <section className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-black">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-indigo-500/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 bg-fuchsia-500/10 blur-[100px] rounded-full mix-blend-screen" />
            </div>

            <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-sm text-zinc-400 backdrop-blur-xl mb-6">
                        <span className="flex h-2 w-2 rounded-full bg-lime-500 mr-2 animate-pulse"></span>
                        v2.0 Now Live
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white to-white/40 mb-6 font-bricolage-grotesque"
                >
                    No Bad Fonts.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    className="max-w-2xl text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed"
                >
                    A curated collection of the finest digital typography.
                    Discover, test, and pair fonts for your next masterpiece.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <Link to="/fonts">
                        <Button size="lg" variant="neon" className="rounded-full px-8 text-base h-12">
                            Browse Collection <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                    <Link to="/pairing">
                        <Button size="lg" variant="glass" className="rounded-full px-8 text-base h-12">
                            Try Font Pairing
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-zinc-500 flex flex-col items-center gap-2"
            >
                <div className="w-px h-12 bg-linear-to-b from-transparent via-zinc-500 to-transparent" />
                <span className="text-xs uppercase tracking-widest opacity-50">Scroll</span>
            </motion.div>
        </section>
    )
}
