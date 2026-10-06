import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import SEO from '../../components/shared/SEO';
import type { Board, BoardFont } from '../../hooks/useBoards';

interface BoardOwner {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
}

export default function BoardShare() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [owner, setOwner] = useState<BoardOwner | null>(null);
  const [fonts, setFonts] = useState<BoardFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!shareToken) return;
    const load = async () => {
      setLoading(true);
      // Use the DB function to resolve share_token (bypasses RLS for private boards)
      const { data, error } = await supabase.rpc('get_board_by_share_token', { p_share_token: shareToken });
      if (error || !data || data.length === 0) { setNotFound(true); setLoading(false); return; }
      const b = data[0] as Board;
      setBoard(b);

      // Fetch owner
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('id', b.user_id)
        .maybeSingle();
      setOwner(profileData as BoardOwner);

      // Fetch fonts — use service-level select since board may be private
      const { data: bfData } = await supabase
        .from('board_fonts')
        .select(`
          id, board_id, font_id, note, position, added_at,
          fonts (id, name, slug, category, preview_image_url, designer, license_type, commercial_use)
        `)
        .eq('board_id', b.id)
        .order('position', { ascending: true });
      setFonts((bfData as unknown as BoardFont[]) || []);
      setLoading(false);
    };
    load();
  }, [shareToken]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-foreground/10 border-t-[var(--color-accent)] animate-spin" />
    </div>
  );

  if (notFound || !board) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <p className="text-5xl mb-4">🔗</p>
      <h1 className="text-2xl font-black mb-2">Invalid share link</h1>
      <p className="text-muted mb-6">This link may have expired or doesn't exist.</p>
      <Link to="/" className="text-accent hover:underline text-sm font-semibold">← Back to home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${board.name} — Shared Board on NoBadFonts`}
        description={board.description || `A curated font board shared via NoBadFonts.`}
      />

      {/* Header */}
      <div className="border-b border-foreground/8 bg-card-background/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Private badge */}
          <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-foreground/6 text-muted font-medium mb-4">
            🔒 Shared private board · View only
          </div>
          <h1 className="text-3xl font-black text-foreground mb-2">{board.name}</h1>
          {board.description && <p className="text-muted max-w-xl">{board.description}</p>}
          {owner && (
            <Link to={`/${owner.username}`} className="mt-4 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
              {owner.avatar_url ? (
                <img src={owner.avatar_url} alt={owner.full_name} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-xs font-black">{owner.full_name?.[0]}</div>
              )}
              by <strong>{owner.full_name}</strong>
            </Link>
          )}
          <p className="text-sm text-muted mt-2">{board.font_count} font{board.font_count !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Fonts */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {fonts.length === 0 ? (
          <div className="text-center py-20 text-muted">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold text-foreground">This board is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {fonts.map(entry => {
              const font = entry.fonts as any;
              if (!font) return null;
              return (
                <Link
                  key={entry.id}
                  to={`/fonts/${font.slug}`}
                  className="group bg-card-background border border-foreground/8 rounded-2xl overflow-hidden hover:border-foreground/20 hover:shadow-md transition-all"
                >
                  <div className="aspect-4/3 bg-background flex items-center justify-center overflow-hidden">
                    {font.preview_image_url ? (
                      <img src={font.preview_image_url} alt={font.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-3xl font-black text-foreground/10" style={{ fontFamily: 'serif' }}>Aa</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-black text-foreground text-sm truncate group-hover:text-accent transition-colors">{font.name}</h3>
                    <p className="text-xs text-muted mt-0.5">{font.designer}</p>
                    {entry.note && (
                      <p className="text-xs text-muted mt-2 italic border-l-2 border-accent/40 pl-2 line-clamp-2">"{entry.note}"</p>
                    )}
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/6 text-muted font-medium capitalize">{font.category}</span>
                      {font.commercial_use && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">Free commercial</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
