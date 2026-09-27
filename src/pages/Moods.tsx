import { Link } from 'react-router-dom';
import { MOODS } from '../config/moods';
import SEO from '../components/shared/SEO';
import { motion, type Variants } from 'framer-motion';

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }),
};

export default function Moods() {
    return (
        <div className="min-h-screen pt-24 bg-[rgb(var(--color-background))]">
            <SEO
                title="Moods — Explore Font Worlds on NoBadFonts"
                description="Step into immersive font worlds. From Wedding elegance to Cyberpunk neon, discover typefaces through the lens of design moods."
            />

            {/* Hero */}
            <div className="px-6 md:px-10 pb-12 text-center max-w-3xl mx-auto">
                <p className="text-xs uppercase tracking-[0.3em] text-[rgb(var(--color-muted-foreground))] mb-4 font-medium">
                    — Explore —
                </p>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[rgb(var(--color-foreground))] mb-5 leading-[0.95]">
                    Font Worlds
                </h1>
                <p className="text-[rgb(var(--color-muted-foreground))] text-lg max-w-xl mx-auto leading-relaxed">
                    Each mood transforms the entire font-discovery experience — colors, textures, imagery, copy and font recommendations — all tailored to a single design universe.
                </p>
            </div>

            {/* Mood Grid */}
            <div className="px-3 sm:px-4 md:px-8 pb-24">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {MOODS.map((mood, i) => (
                        <motion.div
                            key={mood.id}
                            custom={i}
                            initial="hidden"
                            animate="visible"
                            variants={cardVariants}
                        >
                            <Link
                                to={`/moods/${mood.slug}`}
                                className="group relative block rounded-3xl overflow-hidden h-64 cursor-pointer"
                                style={{ background: mood.heroBackground }}
                            >
                                {/* Decorative pattern overlay */}
                                <MoodCardDecor mood={mood} />

                                {/* Gradient overlay bottom */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0) 100%)',
                                    }}
                                />

                                {/* Content */}
                                <div className="absolute inset-0 flex flex-col justify-end p-6">
                                    <div
                                        className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-500 ease-out w-fit"
                                    >
                                        {mood.emoji}
                                    </div>
                                    <h2
                                        className="text-white text-2xl font-black tracking-tight leading-none mb-1 group-hover:translate-x-1 transition-transform duration-300"
                                    >
                                        {mood.name}
                                    </h2>
                                    <p className="text-white/70 text-xs font-medium uppercase tracking-widest">
                                        {mood.tagline}
                                    </p>
                                </div>

                                {/* Hover border glow */}
                                <div
                                    className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-white/20 transition-all duration-300 pointer-events-none"
                                />

                                {/* Explore pill */}
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                    <span className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                                        Explore →
                                    </span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/** Small decorative SVG overlay per mood style */
function MoodCardDecor({ mood }: { mood: (typeof MOODS)[0] }) {
    const style = mood.decorationStyle;

    if (style === 'cyberpunk' || style === 'pixel') {
        return (
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id={`grid-${mood.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={mood.accentColor} strokeWidth="0.5"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#grid-${mood.id})`}/>
                </svg>
            </div>
        );
    }

    if (style === 'scifi') {
        return (
            <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full border"
                        style={{
                            width: `${100 + i * 60}px`,
                            height: `${100 + i * 60}px`,
                            borderColor: mood.accentColor,
                            opacity: 0.3 - i * 0.05,
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                ))}
            </div>
        );
    }

    if (style === 'y2k') {
        return (
            <div className="absolute top-3 right-3 opacity-60 pointer-events-none">
                <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
                    <circle cx="40" cy="40" r="25" fill="rgba(200,180,255,0.2)"/>
                    <circle cx="40" cy="40" r="5" fill="rgba(255,255,255,0.6)"/>
                </svg>
            </div>
        );
    }

    if (style === 'horror') {
        return (
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-2 left-4 text-red-500 text-7xl font-black opacity-20 rotate-12">✝</div>
                <div className="absolute bottom-8 right-6 text-red-400 text-5xl opacity-15 -rotate-6">†</div>
            </div>
        );
    }

    if (style === 'kawaii') {
        return (
            <div className="absolute top-3 right-4 opacity-40 pointer-events-none text-3xl">
                🌸
            </div>
        );
    }

    if (style === 'luxury') {
        return (
            <div className="absolute top-4 right-4 opacity-20 pointer-events-none">
                <svg width="60" height="60" viewBox="0 0 60 60">
                    <polygon points="30,2 36,22 58,22 40,35 46,55 30,42 14,55 20,35 2,22 24,22" fill="none" stroke={mood.accentColor} strokeWidth="1"/>
                </svg>
            </div>
        );
    }

    return null;
}
