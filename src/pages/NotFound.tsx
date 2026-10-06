import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Home, ArrowRight, Compass, Sparkles } from 'lucide-react';
import SEO from '../components/shared/SEO';

const POPULAR_SHORTCUTS = [
    { label: 'Sans-Serif', path: '/fonts?categories=sans' },
    { label: 'Serif', path: '/fonts?categories=serif' },
    { label: 'Display', path: '/fonts?categories=display' },
    { label: 'Monospace', path: '/fonts?categories=monospace' },
    { label: 'Variable', path: '/fonts?query=variable' },
    { label: 'Font Pairings', path: '/pairing' },
    { label: 'Submit Font', path: '/upload' },
];

export default function NotFound() {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/fonts?query=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate('/fonts');
        }
    };

    return (
        <>
            <SEO
                title="404 — Glyph Not Found | NoBadFonts"
                description="The page or font specimen you are looking for does not exist on NoBadFonts. Explore our curated catalog of free and open-source fonts."
                noindex
            />
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 selection:bg-foreground selection:text-background">
                <div className="max-w-2xl w-full text-center space-y-10">

                    {/* Visual 404 Specimen */}
                    <div className="relative flex flex-col items-center justify-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="relative select-none"
                        >
                            <span className="text-[28vw] md:text-[180px] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-linear-to-b from-foreground to-foreground/15 drop-shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
                                404
                            </span>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs uppercase tracking-[0.3em] font-mono px-3 py-1 rounded-full bg-card-background border border-foreground/10 text-muted shadow-md">
                                    Missing Glyph
                                </span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="space-y-3 mt-4"
                        >
                            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">
                                Oops! This page is off the grid.
                            </h1>
                            <p className="text-sm md:text-base text-muted max-w-md mx-auto leading-relaxed">
                                The font specimen, designer page, or link you followed could not be found or has been moved to a new home.
                            </p>
                        </motion.div>
                    </div>

                    {/* Search Bar */}
                    <motion.form
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        onSubmit={handleSearch}
                        className="relative max-w-lg mx-auto"
                    >
                        <div className="relative flex items-center">
                            <Search className="absolute left-4 text-muted" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search fonts, styles, or designers..."
                                className="w-full bg-card-background border border-foreground/10 rounded-2xl py-3.5 pl-11 pr-24 text-sm text-foreground placeholder-muted/70 shadow-sm focus:outline-none focus:border-accent transition-colors duration-300 ease-in-out"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 px-4 py-2 bg-foreground text-background text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity"
                            >
                                Search
                            </button>
                        </div>
                    </motion.form>

                    {/* Popular Tags / Short cuts */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="space-y-3"
                    >
                        <div className="text-xs uppercase tracking-widest font-semibold text-muted/70 flex items-center justify-center gap-1.5">
                            <Sparkles size={13} />
                            <span>Try Exploring</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {POPULAR_SHORTCUTS.map(item => (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-foreground/10 bg-foreground/3 text-foreground hover:bg-foreground hover:text-background transition-all"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </motion.div>

                    {/* Primary Actions */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
                    >
                        <Link
                            to="/"
                            className="w-full sm:w-auto px-6 py-3 rounded-full bg-foreground text-background font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
                        >
                            <Home size={16} />
                            <span>Return to Homepage</span>
                        </Link>
                        <Link
                            to="/fonts"
                            className="w-full sm:w-auto px-6 py-3 rounded-full border border-foreground/15 bg-card-background text-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-foreground/5 transition-all active:scale-95"
                        >
                            <Compass size={16} />
                            <span>Explore Catalog</span>
                            <ArrowRight size={14} />
                        </Link>
                    </motion.div>

                </div>
            </div>
        </>
    );
}
