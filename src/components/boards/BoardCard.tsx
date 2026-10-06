import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Board } from '../../hooks/useBoards';
import { Globe, Lock } from 'lucide-react';

interface BoardCardProps {
  board: Board;
  username: string;
}

export default function BoardCard({ board, username }: BoardCardProps) {
  const previewFonts = board.preview_fonts || [];
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  // Dynamically load the fonts so they can be previewed
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

  return (
    <Link
      to={`/${username}/${board.slug}`}
      className="@container group relative flex flex-col justify-between p-6 bg-foreground/5 rounded-3xl overflow-hidden hover:border-foreground/18 hover:shadow-lg transition-all duration-500 aspect-video"
    >
      <div className="z-10 relative w-full flex flex-col justify-center items-center">
        <h3 className="font-inter-tight font-medium text-[8cqw] tracking-wide text-foreground md:text-foreground/60 group-hover:text-foreground transition-colors duration-300 truncate">
          {board.name}
        </h3>
        <p className="text-sm md:text-base text-muted mt-1 flex items-center gap-1.5">
          {board.font_count} font{board.font_count !== 1 ? 's' : ''}
          <span className="mx-1 opacity-50">·</span>
          {board.visibility === 'private' ? <Lock size={14} /> : <Globe size={14} />}
        </p>
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient overlay to ensure text is readable */}
        {/* <div className="absolute inset-0 bg-linear-to-b from-card-background via-card-background/80 to-transparent z-0 opacity-80"></div>
        <div className="absolute inset-0 bg-linear-to-r from-card-background via-card-background/80 to-transparent z-0 opacity-90"></div> */}

        <div className="absolute left-1/2 -translate-x-1/2 -bottom-18 w-35 h-40 flex justify-start items-start perspective-[1000px]">
          {previewFonts.length > 0 ? previewFonts.map((font, idx) => {
            // Apply precise scattering to match Design 2
            let rotate = 0;
            let translateX = 0;
            let translateY = 0;

            if (previewFonts.length === 3) {
              if (idx === 0) {
                // Front (Center - "OffBit")
                rotate = 0;
                translateX = 0;
                translateY = 0;
              } else if (idx === 1) {
                // Back Left (e.g., "dvine")
                rotate = -12;
                translateX = -130;
                translateY = 25;
              } else {
                // Back Right (e.g., "cer...")
                rotate = 12;
                translateX = 130;
                translateY = 25;
              }
            } else if (previewFonts.length === 2) {
              if (idx === 0) {
                // Left
                rotate = -8;
                translateX = -65;
                translateY = 15;
              } else {
                // Right
                rotate = 8;
                translateX = 65;
                translateY = 15;
              }
            } else if (previewFonts.length === 1) {
              rotate = 0;
              translateX = 0;
              translateY = 10;
            }

            const fontFam = loadedFonts.has(font.id) ? `"board-preview-${font.id}", sans-serif` : 'sans-serif';

            return (
              <div
                key={font.id}
                className={`board-preview-card-${idx} absolute inset-0 bg-foreground/8 backdrop-blur-3xl rounded-2xl md:rounded-[20px] border border-foreground/3 shadow-xl flex items-start justify-center px-2 py-4 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] origin-center`}
                style={{
                  zIndex: 10 - idx,
                  fontFamily: fontFam,
                  transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg)`,
                }}
              >
                <span className="text-2xl md:text-2xl text-foreground/70 font-normal ztruncate w-full text-center">
                  {/* Aa */}
                  {font.name}
                </span>
              </div>
            );
          }) : (
            <div className="absolute inset-0 translate-x-5 translate-y-5 rotate-[-5deg] bg-foreground/8 rounded-[20px] border border-foreground/5 flex items-start justify-center">
              <span className="text-xl pt-4 opacity-10">Empty</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .group:hover .board-preview-card-0 {
          transform: translateX(5px) translateY(10px) rotate(-6deg) !important;
        }
        .group:hover .board-preview-card-1 {
          transform: translateX(85px) translateY(40px) rotate(16deg) !important;
        }
        .group:hover .board-preview-card-2 {
          transform: translateX(-85px) translateY(45px) rotate(-6deg) !important;
        }
      `}</style>
    </Link>
  );
}
