import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, Download, Loader2, BookmarkPlus, Handbag } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { Font } from '../../types/font';
import SaveToBoardModal from '../boards/SaveToBoardModal';
import { useAuth } from '../../contexts/AuthContext';
import { useBag } from '../../contexts/BagContext';

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
    const navigate = useNavigate();
    const { addToBag, isInBag } = useBag();
    const [boardModalOpen, setBoardModalOpen] = useState(false);
    const fontIsInBag = isInBag(font?.id);

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
                                ? "bg-[rgb(var(--color-accent)/0.15)] border-[rgb(var(--color-accent)/0.3)] text-[rgb(var(--color-accent))]"
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                                    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2">
                                        <path d="M21 16.0909V11.0975C21 6.80891 21 4.6646 19.682 3.3323C18.364 2 16.2426 2 12 2C7.75736 2 5.63604 2 4.31802 3.3323C3 4.6646 3 6.80891 3 11.0975V16.0909C3 19.1875 3 20.7358 3.73411 21.4123C4.08421 21.735 4.52615 21.9377 4.99692 21.9915C5.98402 22.1045 7.13673 21.0849 9.44216 19.0458C10.4612 18.1445 10.9708 17.6938 11.5603 17.5751C11.8506 17.5166 12.1494 17.5166 12.4397 17.5751C13.0292 17.6938 13.5388 18.1445 14.5578 19.0458C16.8633 21.0849 18.016 22.1045 19.0031 21.9915C19.4739 21.9377 19.9158 21.735 20.2659 21.4123C21 20.7358 21 19.1875 21 16.0909Z" />
                                    </g>
                                </svg>
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

                    {/* Add to Bag */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (fontIsInBag) {
                                navigate('/bag');
                            } else {
                                addToBag(font);
                                navigate('/bag');
                            }
                        }}
                        aria-label={fontIsInBag ? `${font.name} is in your bag` : `Add ${font.name} to bag`}
                        title={fontIsInBag ? 'View in bag' : 'Add to bag'}
                        className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-full border transition-all duration-300 cursor-pointer ${fontIsInBag
                            ? 'bg-blue-500/25 border-blue-500/30 text-blue-500'
                            : 'bg-[rgb(var(--color-foreground)/0.05)] border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] hover:opacity-80'
                            }`}
                    >
                        <Handbag size={22} className={`transition-all duration-300 ${fontIsInBag ? 'fill-blue-500/5' : ''}`} />
                        <span className="font-bold hidden md:inline">{fontIsInBag ? 'In bag' : 'Add to bag'}</span>
                    </motion.button>

                    {/* Download Family (.ZIP) Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onDownloadZip}
                        disabled={isDownloadingZip}
                        aria-label={`Download ${font.name} font ZIP package`}
                        className="flex items-center gap-2.5 px-4 md:px-6 py-3 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-full font-bold hover:opacity-85 transition-all shadow-[0_0_25px_rgba(var(--color-foreground),0.2)] disabled:opacity-75 cursor-pointer"
                    >
                        {isDownloadingZip ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span className="font-bold hidden md:inline">{zipStatusText || 'Packaging ZIP...'}</span>
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                <span className="font-bold hidden md:inline">Download Family (.ZIP)</span>
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
