import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Board } from '../../hooks/useBoards';

interface BoardCardProps {
    board: Board;
    username: string;
    avatarUrl?: string | null;
    ownerAvatar?: string | null;
    ownerAvatarUrl?: string | null;
    ownerName?: string;
    selectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: () => void;
}

export default function BoardCard2({
    board,
    username,
    avatarUrl,
    ownerAvatar,
    ownerAvatarUrl,
    ownerName,
    selectionMode,
    isSelected,
    onToggleSelect
}: BoardCardProps) {
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

    const resolvedAvatar = ownerAvatarUrl ?? avatarUrl ?? ownerAvatar ?? (board as any)?.profiles?.avatar_url;
    const resolvedOwnerName = ownerName || (board as any)?.profiles?.full_name || username;

    return (
        <Link
            to={`/@${username}/board/${board.slug}`}
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
                    className={`absolute aspect-4/3 inset-0 z-20 rounded-3xl border-2 transition-all pointer-events-none ${isSelected ? 'border-foreground' : 'border-transparent group-hover:border-foreground/20'
                        }`}
                >
                    <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm ${isSelected ? 'border-foreground bg-foreground' : 'border-foreground/30 bg-card-background'
                        }`}>
                        {isSelected && <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                </div>
            )}

            {/* 2x2 Grid Container matching the image design[cite: 3] */}
            <div className={`w-full aspect-4/3 bg-foreground/3 rounded-3xl p-2 grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden transition-all duration-300 ease-in-out ${isSelected ? 'scale-95 opacity-60' : ''} `}>

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
                                className={`bg-foreground/4 rounded-md md:rounded-lg ${cornerRounding} flex items-center justify-center`}
                            />
                        );
                    }

                    const fontFam = loadedFonts.has(font.id) ? `"board-preview-${font.id}", sans-serif` : 'sans-serif';

                    return (
                        <div
                            key={font.id}
                            className={`@container bg-foreground/8 rounded-md md:rounded-lg flex items-center justify-center overflow-hidden p-2 transition-transform duration-500 ${cornerRounding}`}
                            style={{ fontFamily: fontFam }}
                        >
                            <span className="text-[24cqw] text-foreground font-normal text-center leading-none">
                                {font.name}
                                {/* Aa */}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Board Info placed below the grid[cite: 3] */}
            <div className="px-3 flex flex-col">
                <h3 className="flex flex-wrap items-center gap-2 font-inter-tight font-medium text-md md:text-xl tracking-wide text-foreground/80 group-hover:text-foreground transition-colors duration-300 truncate">
                    <span className={`${isSelected ? 'text-muted/50 italic' : ''}`}>{board.name}</span>
                    <div className='flex gap-2 items-center'>
                        <span className='text-muted font-light text-sm'>by</span>
                        {resolvedAvatar ? (
                            <img
                                src={resolvedAvatar}
                                alt={resolvedOwnerName || 'Owner'}
                                className='h-5 md:h-7 w-5 md:w-7 rounded-full object-cover border border-border shrink-0'
                            />
                        ) : (
                            <div className='h-5 w-5 rounded-full bg-card-background border border-border flex items-center justify-center text-[10px] font-bold text-foreground shrink-0'>
                                {(resolvedOwnerName?.[0] || username?.[0] || '?').toUpperCase()}
                            </div>
                        )}
                    </div>
                </h3>
                <p className={`${isSelected ? 'text-muted/50 italic' : 'text-muted'} text-sm md:text-base mt-1 flex items-center gap-1.5`}>
                    {board.font_count} font{board.font_count !== 1 ? 's' : ''}
                    <span className="mx-1 opacity-50">·</span>
                    {board.visibility === 'private' ?
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect fill='currentColor' width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16">
                            <path fill="currentColor" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M4.882 1.731a.48.48 0 0 0 .14.291a.487.487 0 0 1-.126.78l-.291.146a.7.7 0 0 0-.188.135l-.48.48a1 1 0 0 1-1.023.242l-.02-.007a1 1 0 0 0-.462-.04a7 7 0 0 1 2.45-2.027m-3 9.674l.86-.216a1 1 0 0 0 .758-.97v-.184a1 1 0 0 1 .445-.832l.04-.026a1 1 0 0 0 .152-1.54L3.121 6.621a.414.414 0 0 1 .542-.624l1.09.818a.5.5 0 0 0 .523.047a.5.5 0 0 1 .724.447v.455a.8.8 0 0 0 .131.433l.795 1.192a1 1 0 0 1 .116.238l.73 2.19a1 1 0 0 0 .949.683h.058a1 1 0 0 0 .949-.684l.73-2.189a1 1 0 0 1 .116-.238l.791-1.187A.45.45 0 0 1 11.743 8c.16 0 .306.084.392.218c.557.875 1.63 2.282 2.365 2.282l.04-.001a7.003 7.003 0 0 1-12.658.905Z" />
                        </svg>
                    }
                </p>
            </div>
        </Link>
    );
}
