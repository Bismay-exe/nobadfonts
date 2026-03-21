"use client";

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { Type, Combine, Terminal, Users, Upload, User, Shield, Plus, Sun, Moon, Coffee, Sparkles, Cherry, Gem, Leaf, Flame, Cloud, SunDim, Waves, Anchor, Building, Joystick, ShoppingBag, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useUpdate } from '../../contexts/UpdateContext';
import { Download } from 'lucide-react';
import Logo from '/logo/logo.png'; // Assuming white version exists or we filter it

export default function Navbar() {
    const { user, profile } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { hasUpdate, isDownloading, progress, openModal, closeModal, isModalOpen } = useUpdate();
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = useMemo(() => [
        { name: 'Fonts', path: '/fonts', icon: Type },
        { name: 'Pairing', path: '/pairing', icon: Combine },
        { name: 'CLI', path: '/cli', icon: Terminal, badge: 'NEW' },
        ...(profile?.role === 'member' || profile?.role === 'admin'
            ? [{ name: 'Members', path: '/members', icon: Users }]
            : []),
    ], [profile?.role]);

    const mobileNavLinks = useMemo(() => [
        { name: 'Fonts', path: '/fonts', icon: Type },
        { name: 'Pairing', path: '/pairing', icon: Combine },
        { name: 'CLI', path: '/cli', icon: Terminal, badge: 'NEW' },
        ...(profile?.role === 'member' || profile?.role === 'admin'
            ? [{ name: 'Members', path: '/members', icon: Users },
            { name: 'Upload', path: '/upload', icon: Upload },]
            : []),
    ], [profile?.role]);

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 w-full left-1/2 -translate-x-1/2 z-50 border-[rgb(var(--color-border)/0.1)] transition-all duration-300",
                    isScrolled
                        ? "max-w-full md:rounded-none bg-[rgb(var(--color-background)/0.5)] border-b backdrop-blur-3xl py-2 md:py-4 px-6 md:px-10"
                        : "md:top-4 max-w-7xl md:rounded-3xl bg-transparent border-none py-4 px-4"
                )}
            >
                <div className="flex items-center pt-[env(safe-area-inset-top)] md:pt-0">
                    <div className="max-w-480 w-full mx-auto flex items-center justify-between">
                        {/* Logo */}
                        <Link
                            to="/"
                            onClick={async () => {
                                await Haptics.impact({ style: ImpactStyle.Light });
                            }}
                            className="flex items-center gap-2 group"
                        >
                            <div className="w-10 h-10 bg-[rgb(var(--color-foreground)/0.1)] rounded-xl group-hover:bg-[rgb(var(--color-foreground)/0.2)] transition-colors backdrop-blur-sm border border-[rgb(var(--color-foreground)/0.05)]">
                                <img src={Logo} alt="" className='rounded-xl object-cover' />
                            </div>
                            <span className={cn(
                                "font-advine text-3xl transition-opacity duration-300 hidden sm:block",
                                "text-[rgb(var(--color-foreground))]"
                            )}>
                                NoBadFonts
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className={cn("hidden md:flex items-center gap-1 ",
                            isScrolled
                                ? "bg-transparent backdrop-blur-none border-none border-[rgb(var(--color-foreground))] rounded-full p-0 px-0"
                                : "bg-[rgb(var(--color-foreground)/0.15)] backdrop-blur-md border border-[rgb(var(--color-foreground)/0.15)] rounded-full p-1"
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
                                                ? "bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] shadow-sm"
                                                : "text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.15)]"
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
                            {/* Update Download Icon */}
                            {hasUpdate && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={async () => {
                                        await Haptics.impact({ style: ImpactStyle.Light });
                                        isModalOpen ? closeModal() : openModal();
                                    }}
                                    className="relative h-10 w-10 flex items-center justify-center rounded-full bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-border)/0.2)] text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.1)] transition-all cursor-pointer group"
                                    title="Software Update Available"
                                >
                                    {isDownloading && (
                                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
                                            <circle
                                                cx="20"
                                                cy="20"
                                                r="18"
                                                fill="none"
                                                stroke="rgb(var(--color-foreground) / 0.1)"
                                                strokeWidth="2"
                                            />
                                            <motion.circle
                                                cx="20"
                                                cy="20"
                                                r="18"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeDasharray="113.1"
                                                initial={{ strokeDashoffset: 113.1 }}
                                                animate={{ strokeDashoffset: 113.1 - (113.1 * progress) / 100 }}
                                                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                                            />
                                        </svg>
                                    )}
                                    <Download size={18} className={cn("transition-transform duration-300 group-hover:-translate-y-0.5", isDownloading && "animate-pulse")} />
                                    {!isDownloading && (
                                        <span className="absolute top-0 right-0 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                        </span>
                                    )}
                                </motion.button>
                            )}

                            {/* Theme Switcher */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={async () => {
                                    await Haptics.impact({ style: ImpactStyle.Light });
                                    toggleTheme();
                                }}
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-border)/0.2)] text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.1)] transition-all cursor-pointer group"
                                title={`Switch Theme (Current: ${theme.charAt(0).toUpperCase() + theme.slice(1)})`}
                            >
                                <div className="transition-transform duration-300 group-hover:rotate-12 group-active:scale-90">
                                    {theme === 'light' && <Sun size={18} />}
                                    {theme === 'dark' && <Moon size={18} />}
                                    {theme === 'sepia' && <Coffee size={18} />}
                                    {theme === 'vibrant' && <Sparkles size={18} />}
                                    {theme === 'candy' && <Cherry size={18} />}
                                    {theme === 'soft-blue' && <Cloud size={18} />}
                                    {theme === 'luxury' && <Gem size={18} />}
                                    {theme === 'terminal' && <Terminal size={18} />}
                                    {theme === 'nature' && <Leaf size={18} />}
                                    {theme === 'neo-red' && <Flame size={18} />}
                                    {theme === 'neo-blue' && <Droplets size={18} />}
                                    {theme === 'neo-yellow' && <SunDim size={18} />}
                                    {theme === 'uv' && <Waves size={18} />}
                                    {theme === 'rust' && <Anchor size={18} />}
                                    {theme === 'concrete' && <Building size={18} />}
                                    {theme === 'rgb-clash' && <Joystick size={18} />}
                                    {theme === 'ikea-chaos' && <ShoppingBag size={18} />}
                                </div>
                            </motion.button>

                            {user ? (
                                <>
                                    {profile?.role === 'admin' && (
                                        <Link to="/admin"
                                            onClick={async () => {
                                                await Haptics.impact({ style: ImpactStyle.Light });
                                            }}
                                            className="flex items-center justify-center h-10 w-10 rounded-full bg-[rgb(var(--color-accent)/0.2)] text-[rgb(var(--color-accent))] border border-[rgb(var(--color-accent)/0.3)] hover:bg-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-background))] transition-all">
                                            <Shield size={18} />
                                        </Link>
                                    )}
                                    <Link to="/upload"
                                        onClick={async () => {
                                            await Haptics.impact({ style: ImpactStyle.Light });
                                        }}
                                        className="hidden sm:flex items-center gap-2 bg-[rgb(var(--color-foreground))] border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-muted-foreground))] text-[rgb(var(--color-background))] px-4 py-2 rounded-full text-sm font-medium transition-all">
                                        <Plus size={16} />
                                        <span>Upload</span>
                                    </Link>
                                    <Link to="/profile"
                                        onClick={async () => {
                                            await Haptics.impact({ style: ImpactStyle.Light });
                                        }}
                                        className="h-10 w-10 rounded-full bg-[rgb(var(--color-foreground)/0.1)] border border-[rgb(var(--color-border)/0.2)] flex items-center justify-center text-[rgb(var(--color-foreground))] overflow-hidden hover:bg-[rgb(var(--color-foreground)/0.2)] hover:scale-105 transition-transform">
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
                                    className="bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] px-5 py-2 rounded-full font-bold text-sm hover:bg-[rgb(var(--color-muted-foreground))] transition-colors"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Dock */}
            <div className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 z-100">
                <nav className="flex items-center justify-evenly w-screen px-2 py-2.5 bg-[rgb(var(--color-background)/0.6)] backdrop-blur-3xl border-t border-[rgb(var(--color-border)/0.3)] shadow-2xl">
                    {mobileNavLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={async () => {
                                    await Haptics.selectionChanged()
                                }}
                                className={cn(
                                    "relative flex flex-col items-center justify-center h-12 px-4 rounded-full transition-all duration-300",
                                    isActive
                                        ? "text-[rgb(var(--color-foreground))]"
                                        : "text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.1)]"
                                )}
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                                {/* Animated Background Pill */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav-pill"
                                        className="absolute inset-0 bg-white/10 rounded-full"
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    />
                                )}

                                {/* Icon & Label */}
                                <span className="relative z-10 flex items-center gap-2">
                                    <Icon size={20} strokeWidth={isActive ? 3.5 : 2} />

                                    {isActive && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="font-black text-md overflow-hidden whitespace-nowrap"
                                        >
                                            {link.name}
                                        </motion.span>
                                    )}
                                </span>

                                {link.badge && (
                                    <span className="absolute top-1 right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[rgb(var(--color-success)/0.75)]"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[rgb(var(--color-success))]"></span>
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
