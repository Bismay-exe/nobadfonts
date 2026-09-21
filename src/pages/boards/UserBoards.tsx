import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import SEO from '../../components/shared/SEO';
import type { Board } from '../../hooks/useBoards';

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
  const [copied, setCopied] = useState<string | null>(null);

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
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      if (!isOwnProfile) query.eq('visibility', 'public');

      const { data: boardsData } = await query;
      setBoards((boardsData as Board[]) || []);
      setLoading(false);
    };
    load();
  }, [username, isOwnProfile]);

  const copyLink = useCallback((board: Board) => {
    const link = board.visibility === 'private'
      ? `${window.location.origin}/board-share/${board.share_token}`
      : `${window.location.origin}/${username}/${board.slug}`;
    navigator.clipboard.writeText(link);
    setCopied(board.id);
    setTimeout(() => setCopied(null), 2000);
  }, [username]);

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
        <div className="max-w-5xl mx-auto px-4 py-8 flex items-center gap-5">
          {ownerProfile.avatar_url ? (
            <img src={ownerProfile.avatar_url} alt={ownerProfile.full_name} className="w-16 h-16 rounded-full object-cover border-2 border-[rgb(var(--color-foreground)/0.1)]" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-[rgb(var(--color-highlight))] to-[rgb(var(--color-accent))] flex items-center justify-center text-white text-xl font-black">
              {ownerProfile.full_name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-black text-[rgb(var(--color-foreground))]">{ownerProfile.full_name}</h1>
            <p className="text-sm text-[rgb(var(--color-muted-foreground))]">@{ownerProfile.username}</p>
            {ownerProfile.bio && <p className="text-sm text-[rgb(var(--color-foreground)/0.7)] mt-1">{ownerProfile.bio}</p>}
          </div>
          {isOwnProfile && (
            <Link
              to="/profile"
              className="text-sm font-semibold text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] border border-[rgb(var(--color-foreground)/0.15)] px-4 py-2 rounded-xl hover:bg-[rgb(var(--color-foreground)/0.04)] transition-all"
            >
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* Boards grid */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-[rgb(var(--color-foreground))]">
            Boards <span className="text-[rgb(var(--color-muted-foreground))] font-normal text-sm ml-1">{boards.length}</span>
          </h2>
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-16 text-[rgb(var(--color-muted-foreground))]">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold text-[rgb(var(--color-foreground))]">{isOwnProfile ? "You don't have any boards yet" : "No public boards yet"}</p>
            <p className="text-sm mt-1">
              {isOwnProfile ? 'Save fonts to boards from any font page.' : 'This user hasn\'t created any public boards.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map(board => (
              <div key={board.id} className="group bg-[rgb(var(--color-card))] border border-[rgb(var(--color-foreground)/0.08)] rounded-2xl overflow-hidden hover:border-[rgb(var(--color-foreground)/0.18)] hover:shadow-lg transition-all">
                {/* Board thumbnail placeholder */}
                <Link to={`/${username}/${board.slug}`} className="block aspect-3/2 bg-linear-to-br from-[rgb(var(--color-highlight)/0.08)] to-[rgb(var(--color-accent)/0.08)] relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl opacity-30">
                      {board.visibility === 'private' ? '🔒' : '📋'}
                    </span>
                  </div>
                  {/* Font count badge */}
                  <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    {board.font_count} font{board.font_count !== 1 ? 's' : ''}
                  </div>
                </Link>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/${username}/${board.slug}`} className="flex-1 min-w-0">
                      <h3 className="font-black text-[rgb(var(--color-foreground))] truncate group-hover:text-[rgb(var(--color-highlight))] transition-colors">{board.name}</h3>
                      {board.description && (
                        <p className="text-xs text-[rgb(var(--color-muted-foreground))] mt-0.5 line-clamp-2">{board.description}</p>
                      )}
                    </Link>
                    <button
                      onClick={() => copyLink(board)}
                      title="Copy share link"
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-foreground)/0.06)] hover:text-[rgb(var(--color-foreground))] transition-all"
                    >
                      {copied === board.id ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      )}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${board.visibility === 'private' ? 'bg-[rgb(var(--color-foreground)/0.08)] text-[rgb(var(--color-muted-foreground))]' : 'bg-[rgb(var(--color-highlight)/0.1)] text-[rgb(var(--color-highlight))]'}`}>
                      {board.visibility === 'private' ? '🔒 Private' : '🌐 Public'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
