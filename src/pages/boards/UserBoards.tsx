import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import SEO from '../../components/shared/SEO';
import { useBoards, type Board } from '../../hooks/useBoards';
import BoardCard from '../../components/boards/BoardCard2';
import { Trash2 } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function UserBoards() {
  const { username } = useParams<{ username: string }>();
  const { user, profile } = useAuth();
  // const navigate = useNavigate();
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // const [copied, setCopied] = useState<string | null>(null);

  const { deleteBoards } = useBoards();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<Set<string>>(new Set());

  const toggleBoardSelection = useCallback((boardId: string) => {
    setSelectedBoards(prev => {
      const next = new Set(prev);
      if (next.has(boardId)) next.delete(boardId);
      else next.add(boardId);
      return next;
    });
  }, []);

  const handleDeleteSelected = async () => {
    if (selectedBoards.size === 0) return;
    const ids = Array.from(selectedBoards);
    const success = await deleteBoards(ids);
    if (success) {
      setBoards(prev => prev.filter(b => !selectedBoards.has(b.id)));
      setSelectionMode(false);
      setSelectedBoards(new Set());
    } else {
      alert("Failed to delete some boards. Please try again.");
    }
  };

  const isOwnProfile = user && profile?.username === username;

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      setLoading(true);
      // Fetch profile by username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, bio')
        .eq('username', username)
        .maybeSingle();

      if (profileError || !profileData) { setNotFound(true); setLoading(false); return; }
      setOwnerProfile(profileData as UserProfile);

      // Fetch their public boards (or all if own profile)
      const query = supabase
        .from('boards')
        .select('*, board_fonts(fonts(id, name, font_variants(variant_name, woff2_url, woff_url, ttf_url, otf_url)))')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      if (!isOwnProfile) query.eq('visibility', 'public');

      const { data: boardsData } = await query;

      const formattedBoards = (boardsData || []).map((b: any) => ({
        ...b,
        preview_fonts: b.board_fonts
          ?.map((bf: any) => {
            const font = bf.fonts;
            if (!font) return null;
            const variants = font.font_variants || [];
            const regular = variants.find((v: any) => v.variant_name === 'Regular') || variants[0];
            return {
              id: font.id,
              name: font.name,
              woff2_url: regular?.woff2_url,
              woff_url: regular?.woff_url,
              ttf_url: regular?.ttf_url,
              otf_url: regular?.otf_url
            };
          })
          ?.filter(Boolean)
          ?.slice(0, 4) || []
      }));

      setBoards(formattedBoards as Board[]);
      setLoading(false);
    };
    load();
  }, [username, isOwnProfile]);

  // const copyLink = useCallback((board: Board) => {
  //   const link = board.visibility === 'private'
  //     ? `${window.location.origin}/board-share/${board.share_token}`
  //     : `${window.location.origin}/${username}/${board.slug}`;
  //   navigator.clipboard.writeText(link);
  //   setCopied(board.id);
  //   setTimeout(() => setCopied(null), 2000);
  // }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--color-background))]">
        <div className="w-8 h-8 rounded-full border-2 border-[rgb(var(--color-foreground)/0.1)] border-t-[rgb(var(--color-highlight))] animate-spin" />
      </div>
    );
  }

  if (notFound || !ownerProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))]">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-black mb-2">User not found</h1>
        <p className="text-[rgb(var(--color-muted-foreground))] mb-6">No user with username <strong>@{username}</strong> exists.</p>
        <Link to="/" className="text-[rgb(var(--color-highlight))] hover:underline text-sm font-semibold">← Back to home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))]">
      <SEO
        title={`${ownerProfile.full_name}'s Boards — NoBadFonts`}
        description={`Font boards curated by ${ownerProfile.full_name} on NoBadFonts.`}
      />

      {/* Profile header */}
      <div className="border-b border-[rgb(var(--color-foreground)/0.08)] bg-[rgb(var(--color-card)/0.5)] backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-8 flex md:flex-row flex-col md:items-center gap-5">
          {ownerProfile.avatar_url ? (
            <img src={ownerProfile.avatar_url} alt={ownerProfile.full_name} className="w-24 h-24 md:w-20 md:h-20 rounded-full object-cover border-2 border-[rgb(var(--color-foreground)/0.1)]" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-[rgb(var(--color-highlight))] to-[rgb(var(--color-accent))] flex items-center justify-center text-white text-xl font-black">
              {ownerProfile.full_name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-black text-[rgb(var(--color-foreground))]">{ownerProfile.full_name}</h1>
            <p className="text-sm text-[rgb(var(--color-muted-foreground))]">@{ownerProfile.username}</p>
            {ownerProfile.bio && <p className="text-sm text-[rgb(var(--color-foreground)/0.7)] mt-5">{ownerProfile.bio}</p>}
          </div>
          {isOwnProfile && (
            <Link
              to="/profile"
              className="w-fit text-sm font-semibold text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] border border-[rgb(var(--color-foreground)/0.15)] px-4 py-2 rounded-xl hover:bg-[rgb(var(--color-foreground)/0.04)] transition-all"
            >
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* Boards grid */}
      <div className="zmax-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-[rgb(var(--color-foreground))] flex items-center gap-2">
            Boards <span className="text-[rgb(var(--color-muted-foreground))] font-normal text-sm">{boards.length}</span>
          </h2>
          {isOwnProfile && boards.length > 0 && (
            <button
              onClick={() => {
                setSelectionMode(!selectionMode);
                setSelectedBoards(new Set());
              }}
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                selectionMode ? 'bg-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))]' : 'text-[rgb(var(--color-highlight))] hover:bg-[rgb(var(--color-highlight)/0.1)]'
              }`}
            >
              {selectionMode ? 'Cancel' : 'Manage Boards'}
            </button>
          )}
        </div>

        {selectionMode && (
          <div className="mb-6 p-4 rounded-2xl bg-[rgb(var(--color-foreground)/0.03)] border border-[rgb(var(--color-foreground)/0.08)] flex items-center justify-between">
            <span className="font-semibold text-sm">
              {selectedBoards.size} board{selectedBoards.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (selectedBoards.size === boards.length) setSelectedBoards(new Set());
                  else setSelectedBoards(new Set(boards.map(b => b.id)));
                }}
                className="text-xs font-semibold text-[rgb(var(--color-foreground)/0.6)] hover:text-[rgb(var(--color-foreground))] transition-colors"
              >
                {selectedBoards.size === boards.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedBoards.size === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgb(var(--color-destructive)/0.1)] text-[rgb(var(--color-destructive))] text-xs font-bold hover:bg-[rgb(var(--color-destructive)/0.2)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {boards.length === 0 ? (
          <div className="text-center py-16 text-[rgb(var(--color-muted-foreground))]">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold text-[rgb(var(--color-foreground))]">{isOwnProfile ? "You don't have any boards yet" : "No public boards yet"}</p>
            <p className="text-sm mt-1">
              {isOwnProfile ? 'Save fonts to boards from any font page.' : 'This user hasn\'t created any public boards.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
            {boards.map(board => (
              <BoardCard 
                key={board.id} 
                board={board} 
                username={username!} 
                selectionMode={selectionMode}
                isSelected={selectedBoards.has(board.id)}
                onToggleSelect={() => toggleBoardSelection(board.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
