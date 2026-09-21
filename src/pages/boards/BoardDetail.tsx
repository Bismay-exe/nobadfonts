import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import SEO from '../../components/shared/SEO';
import type { Board, BoardFont } from '../../hooks/useBoards';

interface BoardOwner {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
}

export default function BoardDetail() {
  const { username, boardSlug } = useParams<{ username: string; boardSlug: string }>();
  const { user } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [owner, setOwner] = useState<BoardOwner | null>(null);
  const [fonts, setFonts] = useState<BoardFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = user && owner && user.id === owner.id;

  const copyLink = useCallback(() => {
    if (!board) return;
    const link = board.visibility === 'private'
      ? `${window.location.origin}/board-share/${board.share_token}`
      : `${window.location.origin}/${username}/${boardSlug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [board, username, boardSlug]);

  useEffect(() => {
    if (!username || !boardSlug) return;
    const load = async () => {
      setLoading(true);
      // Fetch owner by username
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('username', username)
        .maybeSingle();
      if (!profileData) { setNotFound(true); setLoading(false); return; }
      setOwner(profileData as BoardOwner);

      // Fetch board
      const { data: boardData } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('slug', boardSlug)
        .maybeSingle();
      if (!boardData) { setNotFound(true); setLoading(false); return; }
      const b = boardData as Board;

      // Block private boards unless owner
      const viewerIsOwner = user?.id === profileData.id;
      if (b.visibility === 'private' && !viewerIsOwner) {
        setNotFound(true); setLoading(false); return;
      }
      setBoard(b);

      // Fetch board fonts
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
  }, [username, boardSlug, user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--color-background))]">
      <div className="w-8 h-8 rounded-full border-2 border-[rgb(var(--color-foreground)/0.1)] border-t-[rgb(var(--color-highlight))] animate-spin" />
    </div>
  );

  if (notFound || !board || !owner) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))]">
      <p className="text-5xl mb-4">🔒</p>
      <h1 className="text-2xl font-black mb-2">Board not found</h1>
      <p className="text-[rgb(var(--color-muted-foreground))] mb-6">This board doesn't exist or is private.</p>
      <Link to="/" className="text-[rgb(var(--color-highlight))] hover:underline text-sm font-semibold">← Back to home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))]">
      <SEO
        title={`${board.name} by ${owner.full_name} — NoBadFonts`}
        description={board.description || `A curated font board by ${owner.full_name} on NoBadFonts.`}
      />

      {/* Board header */}
      <div className="border-b border-[rgb(var(--color-foreground)/0.08)] bg-[rgb(var(--color-card)/0.4)] backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-muted-foreground))] mb-5">
            <Link to={`/${username}`} className="hover:text-[rgb(var(--color-foreground))] transition-colors flex items-center gap-1.5">
              {owner.avatar_url ? (
                <img src={owner.avatar_url} alt={owner.full_name} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[rgb(var(--color-highlight))] flex items-center justify-center text-white text-[10px] font-black">{owner.full_name?.[0]}</div>
              )}
              @{owner.username}
            </Link>
            <span className="text-[rgb(var(--color-foreground)/0.3)]">/</span>
            <span className="text-[rgb(var(--color-foreground))] font-semibold">{board.name}</span>
          </div>

          <div className="flex items-start gap-4 justify-between flex-wrap">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black text-[rgb(var(--color-foreground))]">{board.name}</h1>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${board.visibility === 'private'
                  ? 'bg-[rgb(var(--color-foreground)/0.08)] text-[rgb(var(--color-muted-foreground))]'
                  : 'bg-[rgb(var(--color-highlight)/0.1)] text-[rgb(var(--color-highlight))]'}`}>
                  {board.visibility === 'private' ? '🔒 Private' : '🌐 Public'}
                </span>
              </div>
              {board.description && (
                <p className="text-[rgb(var(--color-muted-foreground))] mt-2 max-w-xl">{board.description}</p>
              )}
              <p className="text-sm text-[rgb(var(--color-muted-foreground))] mt-2">
                {board.font_count} font{board.font_count !== 1 ? 's' : ''}
              </p>
            </div>

            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgb(var(--color-foreground)/0.15)] text-sm font-semibold text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.04)] transition-all"
            >
              {copied ? (
                <><svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Copied!</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  {board.visibility === 'private' ? 'Share private link' : 'Share board'}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Font grid */}
      <div className="mx-auto p-2 sm:p-3 md:p-6">
        {fonts.length === 0 ? (
          <div className="text-center py-20 text-[rgb(var(--color-muted-foreground))]">
            <p className="text-4xl mb-3">🎨</p>
            <p className="font-semibold text-[rgb(var(--color-foreground))]">This board is empty</p>
            {isOwner && (
              <p className="text-sm mt-1">
                <Link to="/fonts" className="text-[rgb(var(--color-highlight))] hover:underline">Browse fonts</Link> and save them to this board.
              </p>
            )}
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
                  className="group bg-[rgb(var(--color-card))] border border-[rgb(var(--color-foreground)/0.08)] rounded-2xl overflow-hidden hover:border-[rgb(var(--color-foreground)/0.2)] hover:shadow-md transition-all"
                >
                  {/* Preview */}
                  <div className="bg-[rgb(var(--color-background))] flex items-center justify-center overflow-hidden">
                    {font.preview_image_url ? (
                      <img src={font.preview_image_url} alt={font.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-3xl font-black text-[rgb(var(--color-foreground)/0.1)]" style={{ fontFamily: 'serif' }}>Aa</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-black text-[rgb(var(--color-foreground))] text-sm truncate group-hover:text-[rgb(var(--color-highlight))] transition-colors">{font.name}</h3>
                    <p className="text-xs text-[rgb(var(--color-muted-foreground))] mt-0.5">{font.designer}</p>
                    {entry.note && (
                      <p className="text-xs text-[rgb(var(--color-muted-foreground))] mt-2 italic border-l-2 border-[rgb(var(--color-highlight)/0.4)] pl-2 line-clamp-2">"{entry.note}"</p>
                    )}
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgb(var(--color-foreground)/0.06)] text-[rgb(var(--color-muted-foreground))] font-medium capitalize">{font.category}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${font.commercial_use ? 'bg-green-500/10 text-green-400' : 'bg-[rgb(var(--color-foreground)/0.06)] text-[rgb(var(--color-muted-foreground))]'}`}>
                        {font.commercial_use ? 'Free commercial' : font.license_type || 'Unknown'}
                      </span>
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
