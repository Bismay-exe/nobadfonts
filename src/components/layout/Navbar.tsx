"use client";

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Menu, X, Type, Combine, Terminal, Users, Upload, User, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '/logo/logo-black.png'; // Assuming white version exists or we filter it

export default function Navbar() {
    const { user, profile } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Fonts', path: '/fonts', icon: Type },
        { name: 'Pairing', path: '/pairing', icon: Combine },
        { name: 'CLI', path: '/cli', icon: Terminal, badge: 'NEW' },
        { name: 'Members', path: '/members', icon: Users },
    ];

    return (
        <>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={cn(
                    "fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-7xl rounded-3xl transition-all duration-300",
                    isScrolled
                        ? "bg-black/60 backdrop-blur-lg shadow-[0_10px_40px_0_rgba(255,255,255,0.2)] py-2 px-4 w-[50%]"
                        : "bg-transparent py-4 px-0 w-[95%]"
                )}
            >
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/5">
                            <img src={Logo} alt="" className='rounded-xl object-cover' />
                        </div>
                        <span className={cn(
                            "font-advine text-3xl transition-opacity duration-300 hidden sm:block",
                            isScrolled ? "text-white" : "text-white/90"
                        )}>
                            NoBadFonts
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-md border border-white/5 rounded-full p-1.5 px-3 shadow-inner">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
                                        isActive
                                            ? "bg-white text-black shadow-sm"
                                            : "text-zinc-400 hover:text-white hover:bg-white/10"
                                    )}
                                >
                                    <Icon size={16} />
                                    {link.name}
                                    {link.badge && (
                                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-500"></span>
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                {profile?.role === 'admin' && (
                                    <Link to="/admin" className="hidden lg:flex items-center justify-center h-10 w-10 rounded-full bg-pink-500/20 text-pink-500 border border-pink-500/30 hover:bg-pink-500 hover:text-white transition-all">
                                        <Shield size={18} />
                                    </Link>
                                )}
                                <Link to="/upload" className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all">
                                    <Upload size={16} />
                                    <span>Upload</span>
                                </Link>
                                <Link to="/profile" className="h-10 w-10 rounded-full bg-linear-to-tr from-zinc-800 to-zinc-700 border border-white/10 flex items-center justify-center text-white overflow-hidden hover:scale-105 transition-transform">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <User size={18} />
                                    )}
                                </Link>
                            </>
                        ) : (
                            <Link
                                to="/auth"
                                className="bg-white text-black px-5 py-2 rounded-full font-bold text-sm hover:bg-zinc-200 transition-colors"
                            >
                                Login
                            </Link>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 text-white bg-white/10 rounded-full backdrop-blur-sm border border-white/5"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-24 px-6 md:hidden flex flex-col gap-6"
                    >
                        <div className="flex flex-col gap-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-4 text-2xl font-medium text-white/80 hover:text-white p-4 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                                >
                                    <link.icon size={24} />
                                    {link.name}
                                </Link>
                            ))}
                            {user && (
                                <Link
                                    to="/upload"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-4 text-2xl font-medium text-white/80 hover:text-white p-4 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                                >
                                    <Upload size={24} />
                                    Upload Font
                                </Link>
                            )}
                            {profile?.role === 'admin' && (
                                <Link
                                    to="/admin"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-4 text-2xl font-medium text-pink-500 p-4 rounded-xl hover:bg-pink-500/10 transition-all border border-transparent hover:border-pink-500/20"
                                >
                                    <Shield size={24} />
                                    Admin Panel
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
