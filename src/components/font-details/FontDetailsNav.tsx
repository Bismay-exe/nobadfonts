import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sun, Moon, ArrowLeft, User, Share2, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import type { Font } from '../../types/font';

interface FontDetailsNavProps {
    font: Font;
    user: any;
    profile: any;
    isScrolled: boolean;
    shareLoading: boolean;
    isDownloadingZip: boolean;
    onShare: () => void;
    onDownloadZip: (e?: React.MouseEvent) => void;
}

export default function FontDetailsNav({
    font,
    user,
    profile,
    isScrolled,
    shareLoading,
    isDownloadingZip,
    onShare,
    onDownloadZip,
}: FontDetailsNavProps) {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    return (
        <>
            {/* Top Navigation Bar */}
            <nav
                className={cn(
                    "fixed top-0 w-full left-1/2 -translate-x-1/2 z-50 border-[rgb(var(--color-border)/0.1)] transition-all duration-300",
                    isScrolled
                        ? "max-w-full md:rounded-none bg-[rgb(var(--color-background))] border-none py-2 md:py-3 px-6 md:px-10"
                        : "md:top-4 max-w-full md:rounded-3xl bg-transparent border-none py-2 px-4"
                )}
            >
                <div className="flex items-center pt-[env(safe-area-inset-top)] md:pt-0">
                    <div className="max-w-480 w-full mx-auto flex items-center justify-between">
                        <button
                            onClick={async (e) => {
                                e.preventDefault();
                                await Haptics.impact({ style: ImpactStyle.Light });
                                navigate(-1);
                            }}
                            aria-label="Go back to previous page"
                            className="flex items-center gap-2 group bg-transparent border-none p-0 cursor-pointer"
                        >
                            <ArrowLeft className="h-6 w-6" strokeWidth={2.5} />
                            <span className="text-[rgb(var(--color-foreground))] font-bold">
                                Back
                            </span>
                        </button>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-3">
                            {/* Theme Switcher */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={async () => {
                                    await Haptics.impact({ style: ImpactStyle.Light });
                                    toggleTheme();
                                }}
                                aria-label={`Switch theme, current theme is ${theme}`}
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-border)/0.2)] text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.1)] transition-all cursor-pointer group"
                                title={`Switch Theme (Current: ${theme.charAt(0).toUpperCase() + theme.slice(1)})`}
                            >
                                <div className="transition-transform duration-300 group-hover:rotate-12 group-active:scale-90">
                                    {theme === 'light' && <Sun size={18} />}
                                    {theme === 'dark' && <Moon size={18} />}
                                </div>
                            </motion.button>

                            {user ? (
                                <Link
                                    to="/profile"
                                    onClick={async () => {
                                        await Haptics.impact({ style: ImpactStyle.Light });
                                    }}
                                    className="h-10 w-10 rounded-full bg-[rgb(var(--color-foreground)/0.1)] border border-[rgb(var(--color-border)/0.2)] flex items-center justify-center text-[rgb(var(--color-foreground))] overflow-hidden hover:bg-[rgb(var(--color-foreground)/0.2)] hover:scale-105 transition-transform"
                                >
                                    {profile?.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt={profile?.full_name ? `${profile.full_name}'s avatar` : "User profile avatar"}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <User size={18} />
                                    )}
                                </Link>
                            ) : (
                                <Link
                                    to="/auth"
                                    className="bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] px-5 py-2 rounded-full font-bold text-sm hover:bg-[rgb(var(--color-muted-foreground))] transition-colors duration-300 ease-in-out"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
                <motion.div
                    initial={{ y: -100 }}
                    animate={{ y: isScrolled ? 0 : -200 }}
                    className={`absolute top-[calc(3.5rem+env(safe-area-inset-top))] md:top-0 h-full left-0 md:left-33 right-0 md:right-37 w-full md:w-auto z-40 flex items-center justify-center px-6 md:px-0
                    bg-[rgb(var(--color-background))] md:bg-transparent`}
                >
                    <div className="absolute top-0 h-px w-full bg-linear-to-r from-transparent via-[rgb(var(--color-foreground)/0.1)] to-transparent"></div>
                    <div className="max-w-480 w-full mx-auto flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-0">
                            <h2 className="text-xl font-bold text-[rgb(var(--color-foreground))] pr-2 leading-none">
                                {font.name}
                            </h2>
                            <span className="text-[rgb(var(--color-muted-foreground))]">
                                by {font.designer}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onShare}
                                disabled={shareLoading}
                                aria-label={`Share ${font.name} font family`}
                                className="p-2.5 rounded-full bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] hover:opacity-80 transition-all active:scale-95"
                            >
                                {shareLoading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                            </button>
                            <button
                                onClick={onDownloadZip}
                                disabled={isDownloadingZip}
                                aria-label={`Download ${font.name} font ZIP package`}
                                className="px-4 md:px-6 py-2.5 md:py-2 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-full font-bold hover:opacity-80 transition-all flex items-center gap-2 disabled:opacity-75 cursor-pointer"
                            >
                                {isDownloadingZip ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                <span className="hidden md:inline">
                                    {isDownloadingZip ? 'Packaging ZIP...' : 'Download ZIP'}
                                </span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </nav>
        </>
    );
}
