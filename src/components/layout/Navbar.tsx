"use client";

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Type, Combine, Terminal, Users, Upload, User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '/logo/logo-black.png'; // Assuming white version exists or we filter it

export default function Navbar() {
    const { user, profile } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
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
        ...(profile?.role === 'member' || profile?.role === 'admin'
            ? [{ name: 'Members', path: '/members', icon: Users }]
            : []),
    ];

    return (
        <>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={cn(
                    "fixed w-full left-1/2 -translate-x-1/2 z-50 border-white/10 transition-all duration-300",
                    isScrolled
                        ? "top-0 md:top-0 max-w-full md:rounded-none bg-black/50 border-b backdrop-blur-3xl py-2 md:py-4 px-6 md:px-10"
                        : "top-0 md:top-4 max-w-7xl md:rounded-3xl bg-transparent border-none py-2 md:py-4 px-4"
                )}
            >
                <div className="flex items-center pt-8 sm:pt-0">
                    <div className="max-w-480 w-full mx-auto flex items-center justify-between">
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
                        <div className={cn("hidden md:flex items-center gap-1 ",
                            isScrolled
                                ? "bg-transparent backdrop-blur-none border-none border-white/50 rounded-full p-0 px-0"
                                : "bg-white/10 backdrop-blur-md border border-white/5 rounded-full p-1.5 px-3"
                        )}>
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
                                        <Link to="/admin" className="flex items-center justify-center h-10 w-10 rounded-full bg-pink-500/20 text-pink-500 border border-pink-500/30 hover:bg-pink-500 hover:text-white transition-all">
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
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Bottom Dock */}
            <div className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 z-100">
                <nav className="flex items-center justify-evenly w-screen py-2.5 bg-black/60 backdrop-blur-3xl border-t-2 border-white/10 shadow-2xl shadow-black/50">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                                    isActive
                                        ? "text-white"
                                        : "text-zinc-500 hover:text-white hover:bg-white/10"
                                )}
                            >
                                <Icon size={20} className={cn("transition-transform duration-300", isActive && "scale-110")} />
                                <div className={cn(`uppercase text-xs font-bricolage-grotesque pt-1 ${profile?.role === 'admin' ? 'hidden' : 'block'}`)}>{link.name}</div>
                                <div className={cn("absolute inset-0 bg-white/30 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity", isActive && "opacity-100")}/>
                                {link.badge && (
                                    <span className="absolute top-1 right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
                                    </span>
                                )}
                            </Link>
                        );
                    })}

                    {profile?.role === 'member' || profile?.role === 'admin' && (
                        <Link
                            to="/upload"
                            className={cn(
                                "relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                                location.pathname === '/upload'
                                    ? "text-white"
                                    : "text-zinc-500 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <Upload size={20} className={cn("transition-transform duration-300", location.pathname === '/upload' && "scale-110")} />
                            <div className={cn("absolute inset-0 bg-white/30 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity", location.pathname === '/upload' && "opacity-100")}/>
                        </Link>
                    )}
                </nav>
            </div>
        </>
    );
}
