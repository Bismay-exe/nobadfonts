import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Board } from '../../hooks/useBoards';
import { Globe, Lock } from 'lucide-react';

interface BoardCardProps {
    board: Board;
    username: string;
    selectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: () => void;
}

export default function BoardCard2({ board, username, selectionMode, isSelected, onToggleSelect }: BoardCardProps) {
    const previewFonts = board.preview_fonts || [];
    const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

    // Dynamically load the fonts so they can be previewed[cite: 4]
    useEffect(() => {
        if (!previewFonts || previewFonts.length === 0) return;

        let isMounted = true;
        previewFonts.forEach(font => {
            if (loadedFonts.has(font.id)) return;

            const url = font.woff2_url || font.woff_url || font.ttf_url || font.otf_url;
            if (!url) return;

            const format = url.endsWith('.woff2') ? 'woff2' : url.endsWith('.woff') ? 'woff' : url.endsWith('.ttf') ? 'truetype' : 'opentype';
            const fontFamily = `board-preview-${font.id}`;
            const source = `url(${url}) format('${format}')`;

            const fontFace = new FontFace(fontFamily, source);
            fontFace.load().then(loadedFace => {
                if (!isMounted) return;
                document.fonts.add(loadedFace);
                setLoadedFonts(prev => new Set(prev).add(font.id));
            }).catch(err => {
                console.error(`Failed to load font preview for ${font.name}:`, err);
            });
        });

        return () => { isMounted = false; };
    }, [previewFonts, loadedFonts]);

    // Ensure we always have exactly 4 slots for the 2x2 grid[cite: 3]
    const displayFonts = [...previewFonts].slice(0, 4);
    while (displayFonts.length < 4) {
        displayFonts.push(null as any);
    }

    return (
        <Link
            to={`/${username}/${board.slug}`}
            className="group flex flex-col gap-3 w-full cursor-pointer relative"
            onClick={(e) => {
                if (selectionMode) {
                    e.preventDefault();
                    onToggleSelect?.();
                }
            }}
        >
            {/* Selection Overlay */}
            {selectionMode && (
                <div
                    className={`absolute aspect-4/3 inset-0 z-20 rounded-3xl border-2 transition-all pointer-events-none ${isSelected ? 'border-[rgb(var(--color-foreground))] bg-[rgb(var(--color-background)/0.5)]' : 'border-transparent group-hover:border-[rgb(var(--color-foreground)/0.2)]'
                        }`}
                >
                    <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm ${isSelected ? 'border-[rgb(var(--color-foreground))] bg-[rgb(var(--color-foreground))]' : 'border-[rgb(var(--color-foreground)/0.3)] bg-[rgb(var(--color-card))]'
                        }`}>
                        {isSelected && <svg className="w-4 h-4 text-[rgb(var(--color-background))]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                </div>
            )}

            {/* 2x2 Grid Container matching the image design[cite: 3] */}
            <div className={`w-full aspect-4/3 bg-[rgb(var(--color-foreground)/0.03)] rounded-3xl p-2 grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden transition-all duration-300 ease-in-out ${isSelected ? 'scale-95' : ''} `}>

                {displayFonts.map((font, idx) => {

                    const cornerRounding =
                        idx === 0 ? "rounded-tl-2xl" :
                            idx === 1 ? "rounded-tr-2xl" :
                                idx === 2 ? "rounded-bl-2xl" :
                                    idx === 3 ? "rounded-br-2xl" : "rounded-none";
                                    
                    if (!font) {
                        // Empty placeholder for missing fonts to maintain grid structure
                        return (
                            <div
                                key={`empty-${idx}`}
                                className={`bg-[rgb(var(--color-foreground)/0.04)] rounded-lg ${cornerRounding} flex items-center justify-center`}
                            />
                        );
                    }

                    const fontFam = loadedFonts.has(font.id) ? `"board-preview-${font.id}", sans-serif` : 'sans-serif';

                    return (
                        <div
                            key={font.id}
                            className={`bg-[rgb(var(--color-foreground)/0.08)] rounded-lg flex items-center justify-center overflow-hidden p-2 transition-transform duration-500 ${cornerRounding}`}
                            style={{ fontFamily: fontFam }}
                        >
                            <span className="text-3xl text-[rgb(var(--color-foreground))] font-normal text-center">
                                {font.name}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Board Info placed below the grid[cite: 3] */}
            <div className="px-3 flex flex-col">
                <h3 className="font-inter-tight font-medium text-xl md:text-2xl tracking-wide text-[rgb(var(--color-foreground)/0.8)] group-hover:text-[rgb(var(--color-foreground))] transition-colors duration-300 truncate">
                    <span className={`${isSelected ? 'text-[rgb(var(--color-muted))] italic line-through decoration-3 decoration-current zdecoration-[rgb(var(--color-foreground))]' : ''}`}>{board.name}</span>
                </h3>
                <p className={`${isSelected ? 'text-[rgb(var(--color-muted))] italic line-through decoration-3 decoration-current zdecoration-[rgb(var(--color-foreground))]' : 'text-[rgb(var(--color-muted-foreground))]'} text-sm md:text-base mt-0.5 flex items-center gap-1.5`}>
                    {board.font_count} font{board.font_count !== 1 ? 's' : ''}
                    <span className="mx-1 opacity-50">·</span>
                    {board.visibility === 'private' ? <Lock size={14} /> : <Globe size={14} />}
                </p>
            </div>
        </Link>
    );
}