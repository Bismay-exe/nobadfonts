import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Share2, Download, Loader2, BookmarkPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { Font } from '../../types/font';
import SaveToBoardModal from '../boards/SaveToBoardModal';
import { useAuth } from '../../contexts/AuthContext';

interface FontHeroHeaderProps {
    font: Font;
    isFavorited: boolean;
    shareLoading: boolean;
    isDownloadingZip: boolean;
    zipStatusText: string;
    onFavorite: () => void;
    onShare: () => void;
    onDownloadZip: (e?: React.MouseEvent) => void;
}

export default function FontHeroHeader({
    font,
    isFavorited,
    shareLoading,
    isDownloadingZip,
    zipStatusText,
    onFavorite,
    onShare,
    onDownloadZip,
}: FontHeroHeaderProps) {
    const { user } = useAuth();
    const [boardModalOpen, setBoardModalOpen] = useState(false);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-4">
            <div className="lg:col-span-2 space-y-8">
                <div>
                    <h1 className="text-5xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-[rgb(var(--color-foreground))] mb-2 leading-[1.1]">
                        {font.name}
                    </h1>
                    <div className="flex items-center gap-2 text-[rgb(var(--color-muted-foreground))] text-lg md:text-xl">
                        <span>by</span>
                        <Link
                            to={`/designers/${encodeURIComponent(font.designer || '')}`}
                            className="text-[rgb(var(--color-foreground))] hover:underline decoration-1 underline-offset-4 font-medium"
                        >
                            {font.designer || 'Unknown'}
                        </Link>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {/* Favorite Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onFavorite}
                        aria-label={isFavorited ? `Remove ${font.name} from favorites` : `Add ${font.name} to favorites`}
                        className={cn(
                            "flex items-center gap-2 px-4 md:px-6 py-3 rounded-full border transition-all duration-300 cursor-pointer",
                            isFavorited
                                ? "bg-[rgb(var(--color-accent)/0.1)] border-[rgb(var(--color-accent))] text-[rgb(var(--color-accent))]"
                                : "bg-[rgb(var(--color-foreground)/0.05)] border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] hover:opacity-80"
                        )}
                    >
                        <Heart size={20} className={isFavorited ? "fill-[rgb(var(--color-accent))]" : ""} />
                        <span className="font-bold">{font.favorites_count || 0}</span>
                    </motion.button>

                    {/* Save to Board Button — only for logged-in users */}
                    {user && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setBoardModalOpen(true)}
                            aria-label={`Save ${font.name} to a board`}
                            className="flex items-center gap-2 px-4 md:px-6 py-3 rounded-full border bg-[rgb(var(--color-foreground)/0.05)] border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] hover:opacity-80 transition-all duration-300 cursor-pointer"
                        >
                            <BookmarkPlus size={20} />
                            <span className="font-bold hidden md:inline">Save to</span>
                        </motion.button>
                    )}

                    {/* Share Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onShare}
                        disabled={shareLoading}
                        aria-label={`Share ${font.name} font family`}
                        className="flex items-center gap-2 px-4 md:px-6 py-3 rounded-full border bg-[rgb(var(--color-foreground)/0.05)] border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] hover:opacity-80 transition-all duration-300 cursor-pointer disabled:opacity-50"
                    >
                        {shareLoading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                        <span className="font-bold hidden md:inline">Share</span>
                    </motion.button>

                    {/* Download Family (.ZIP) Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onDownloadZip}
                        disabled={isDownloadingZip}
                        aria-label={`Download ${font.name} font ZIP package`}
                        className="flex items-center gap-2.5 px-6 md:px-8 py-3 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-full font-bold hover:opacity-85 transition-all shadow-[0_0_25px_rgba(var(--color-foreground),0.2)] disabled:opacity-75 cursor-pointer"
                    >
                        {isDownloadingZip ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span className="font-bold">{zipStatusText || 'Packaging ZIP...'}</span>
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                <span className="font-bold">Download Family (.ZIP)</span>
                            </>
                        )}
                    </motion.button>
                </div>
            </div>

            {/* Save to Board Modal */}
            <SaveToBoardModal
                fontId={font.id}
                fontName={font.name}
                isOpen={boardModalOpen}
                onClose={() => setBoardModalOpen(false)}
            />
        </div>
    );
}
