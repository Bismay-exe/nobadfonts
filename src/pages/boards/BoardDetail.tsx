import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import SEO from '../../components/shared/SEO';
import { useBoards, type Board, type BoardFont } from '../../hooks/useBoards';
import EditBoardModal from '../../components/boards/EditBoardModal';
import { Trash2, Edit3, Lock, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useViewMode } from '../../hooks/useViewMode';
import { useWindowSize } from '../../hooks/useWindowSize';
import { Filters } from '../../components/fonts/Filters';
import FontCard from '../../components/fonts/FontCard';
import type { FontFilterParams } from '../../types/font';
import { Masonry } from "masonic";

interface BoardOwner {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
}

const MasonryCard = ({ data, width }: { data: any; width: number }) => {
  if (!data) return null;
  return (
    <div className="relative group/masonry">
      <FontCard
        font={data}
        viewMode={data.viewMode}
        customText={data.customText}
        isExpanded={data.isExpanded}
        onToggle={data.onToggle}
        isFavorited={data.isFavorited}
        onFavoriteChange={data.onFavoriteChange}
        cardWidth={width}
        disableLink={data.selectionMode}
      />
      {data.selectionMode && (
        <div
        className={`absolute inset-0 z-20 rounded-3xl border-2 transition-all duration-300 ease-in-out cursor-pointer 
          ${data.viewMode==='image' ? 'border-[rgb(var(--color-muted-foreground)/0)] rounded-4xl' : 'border-[rgb(var(--color-muted-foreground)/0.3)]'} 
          ${data.isSelected ? 
            'bg-[rgb(var(--color-muted)/0.85)]'
            : 'border-transparent hover:border-[rgb(var(--color-foreground)/0.2)] bg-[rgb(var(--color-foreground)/0.02)]'
            }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            data.onToggleSelect();
          }}
        >
          <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ease-in-out shadow-sm ${data.isSelected ? 'border-[rgb(var(--color-foreground))] bg-[rgb(var(--color-foreground))]' : 'border-[rgb(var(--color-foreground)/0.3)] bg-[rgb(var(--color-card))]'
            }`}>
            {data.isSelected && <svg className="w-4 h-4 text-[rgb(var(--color-background))]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          </div>
        </div>
      )}
    </div>
  );
};

export default function BoardDetail() {
  const { username, boardSlug } = useParams<{ username: string; boardSlug: string }>();
  const { user } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [owner, setOwner] = useState<BoardOwner | null>(null);
  const [fonts, setFonts] = useState<BoardFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const { updateBoard, deleteBoard, removeFontsFromBoard } = useBoards();

  // Board Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Font Selection State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFonts, setSelectedFonts] = useState<Set<string>>(new Set());
  const [deleteCount, setDeleteCount] = useState(0);

  const toggleFontSelection = useCallback((fontId: string) => {
    setSelectedFonts(prev => {
      const next = new Set(prev);
      if (next.has(fontId)) next.delete(fontId);
      else next.add(fontId);
      return next;
    });
  }, []);

  const handleRemoveSelectedFonts = async () => {
    if (selectedFonts.size === 0 || !board) return;
    const ids = Array.from(selectedFonts);
    const success = await removeFontsFromBoard(board.id, ids);
    if (success) {
      setFonts(prev => prev.filter(f => !selectedFonts.has(f.font_id)));
      setBoard(prev => prev ? { ...prev, font_count: Math.max(0, prev.font_count - ids.length) } : prev);
      setSelectionMode(false);
      setSelectedFonts(new Set());
      setDeleteCount(c => c + 1); // Force Masonic remount to clear internal WeakMap caches
    } else {
      alert('Failed to remove some fonts.');
    }
  };

  // Filters & Masonry State
  const [filters, setFilters] = useState<FontFilterParams>({ query: '', categories: [], sortBy: 'trending' });
  const [viewMode, setViewMode] = useViewMode();
  const [expandedFontId, setExpandedFontId] = useState<string | null>(null);
  const [globalExpanded, setGlobalExpanded] = useState(true);
  const [bulkToggleVersion, setBulkToggleVersion] = useState(0);
  const [isBulkToggling, setIsBulkToggling] = useState(false);
  const bulkToggleTimeoutRef = useRef<any>(null);
  const [customText, setCustomText] = useState('');
  const [userFavoriteIds, setUserFavoriteIds] = useState<Set<string>>(new Set());

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
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('username', username)
        .maybeSingle();
      if (!profileData) { setNotFound(true); setLoading(false); return; }
      setOwner(profileData as BoardOwner);

      const { data: boardData } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('slug', boardSlug)
        .maybeSingle();
      if (!boardData) { setNotFound(true); setLoading(false); return; }
      const b = boardData as Board;

      const viewerIsOwner = user?.id === profileData.id;
      if (b.visibility === 'private' && !viewerIsOwner) {
        setNotFound(true); setLoading(false); return;
      }
      setBoard(b);

      const { data: bfData } = await supabase
        .from('board_fonts')
        .select(`
          id, board_id, font_id, note, position, added_at,
          fonts (id, name, slug, category, preview_image_url, designer, license_type, commercial_use, tags, favorites_count, font_variants(variant_name, woff2_url, woff_url, ttf_url, otf_url))
        `)
        .eq('board_id', b.id)
        .order('position', { ascending: true });
      setFonts((bfData as unknown as BoardFont[]) || []);
      setLoading(false);
    };
    load();
  }, [username, boardSlug, user?.id]);

  useEffect(() => {
    if (!user) {
      setUserFavoriteIds(new Set());
      return;
    }
    let isMounted = true;
    supabase
      .from('favorites')
      .select('font_id')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (!isMounted || error || !data) return;
        setUserFavoriteIds(new Set(data.map((f: any) => f.font_id)));
      });
    return () => { isMounted = false; };
  }, [user]);

  const handleFavoriteToggle = useCallback((fontId: string, isFav: boolean) => {
    setUserFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFav) next.add(fontId);
      else next.delete(fontId);
      return next;
    });
  }, []);

  const getCardProps = useCallback((fontId: string) => {
    if (globalExpanded) {
      return {
        isExpanded: expandedFontId === fontId,
        onToggle: () => setExpandedFontId(expandedFontId === fontId ? null : fontId)
      };
    } else {
      return {
        isExpanded: true,
        onToggle: undefined
      };
    }
  }, [expandedFontId, globalExpanded]);

  const { width } = useWindowSize();

  const items = useMemo(() => {
    let filtered = fonts.map(entry => entry.fonts).filter(Boolean) as any[];

    if (filters.query) {
      const q = filters.query.toLowerCase();
      filtered = filtered.filter(f => f.name.toLowerCase().includes(q));
    }
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(f => filters.categories!.includes(f.category));
    }

    return filtered.map(f => {
      const cardProps = getCardProps(f.id);
      return {
        ...f,
        viewMode,
        customText,
        isExpanded: cardProps.isExpanded,
        onToggle: cardProps.onToggle,
        isFavorited: userFavoriteIds.has(f.id),
        onFavoriteChange: handleFavoriteToggle,
        bulkToggleVersion,
        selectionMode,
        isSelected: selectedFonts.has(f.id),
        onToggleSelect: () => toggleFontSelection(f.id)
      };
    });
  }, [fonts, filters, viewMode, customText, getCardProps, userFavoriteIds, handleFavoriteToggle, bulkToggleVersion, selectionMode, selectedFonts, toggleFontSelection]);

  const columns =
    width > 1280 ? 4 :
      width > 1024 ? 3 :
        width > 640 ? 2 :
          1;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--color-background))]">
      <div className="w-8 h-8 rounded-full border-2 border-[rgb(var(--color-foreground)/0.1)] border-t-[rgb(var(--color-foreground))] animate-spin" />
    </div>
  );

  if (notFound || !board || !owner) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))]">
      <p className="text-5xl mb-4">🔒</p>
      <h1 className="text-2xl font-black mb-2">Board not found</h1>
      <p className="text-[rgb(var(--color-muted-foreground))] mb-6">This board doesn't exist or is private.</p>
      <Link to="/" className="text-[rgb(var(--color-highlight))] hover:underline text-sm font-medium">← Back to home</Link>
    </div>
  );

  return (
    <div className="pt-24 min-h-screen bg-[rgb(var(--color-background))]">
      <SEO
        title={`${board.name} by ${owner.full_name} — NoBadFonts`}
        description={board.description || `A curated font board by ${owner.full_name} on NoBadFonts.`}
      />

      <div className="relative bg-[rgb(var(--color-card)/0.4)] backdrop-blur-sm">
        <div className='h-px w-full bg-linear-to-r from-transparent via-[rgb(var(--color-foreground)/0.08)] to-transparent absolute bottom-0 left-0 right-0' />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-muted-foreground))] mb-5">
            <Link to={`/${username}`} className="hover:text-[rgb(var(--color-foreground))] transition-colors flex items-center gap-1.5">
              {owner.avatar_url ? (
                <img src={owner.avatar_url} alt={owner.full_name} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[rgb(var(--color-foreground)/0.1)] flex items-center justify-center text-[rgb(var(--color-foreground))] text-[10px] font-black">{owner.full_name?.[0]}</div>
              )}
              @{owner.username}
            </Link>
            <span className="text-[rgb(var(--color-foreground)/0.3)]">/</span>
            <span className="text-[rgb(var(--color-foreground))] font-medium">{board.name}</span>
          </div>

          <div className="flex items-start gap-4 justify-between flex-wrap">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black text-[rgb(var(--color-foreground))]">{board.name}</h1>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${board.visibility === 'private'
                  ? 'bg-[rgb(var(--color-foreground)/0.08)] text-[rgb(var(--color-muted-foreground))]'
                  : 'bg-[rgb(var(--color-foreground)/0.08)] text-[rgb(var(--color-muted-foreground))]'}`}>
                  {board.visibility === 'private' ?
                    <div className='flex gap-1 items-center'><Lock size={14} /> Private</div>
                    : <div className='flex gap-1 items-center'><Globe size={14} /> Public</div>
                  }
                </span>
              </div>
              {board.description && (
                <p className="text-[rgb(var(--color-muted-foreground))] mt-2 max-w-xl">{board.description}</p>
              )}
              <p className="text-sm text-[rgb(var(--color-muted-foreground))] mt-2">
                {board.font_count} font{board.font_count !== 1 ? 's' : ''}
              </p>
            </div>

            <div className={`${selectionMode ? 'w-full' : 'w-auto'} md:w-auto flex justify-between md:justify-center items-center gap-2`}>
              <button
                onClick={copyLink}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgb(var(--color-foreground)/0.15)] text-sm font-medium text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.04)] transition-all ${selectionMode ? 'hidden' : ''}`}
              >
                {copied ? (
                  <><svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Copied!</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    {board.visibility === 'private' ? 'Share private link' : 'Share board'}</>
                )}
              </button>

              {isOwner && (
                <>
                  {selectionMode ? (
                    <div className="w-full flex items-center justify-between md:justify-center gap-2 font-inter-tight tracking-wider">
                      <span className="font-medium text-sm md:px-4">
                        {selectedFonts.size} font{selectedFonts.size !== 1 ? 's' : ''} selected
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (selectedFonts.size === fonts.length) setSelectedFonts(new Set());
                            else setSelectedFonts(new Set(fonts.map(f => f.font_id)));
                          }}
                          className="px-4 h-10 text-xs bg-[rgb(var(--color-foreground)/0.05)] hover:bg-[rgb(var(--color-foreground)/0.1)] rounded-xl font-medium text-[rgb(var(--color-foreground)/0.6)] hover:text-[rgb(var(--color-foreground))] transition-colors"
                        >
                          {selectedFonts.size === fonts.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <button
                          onClick={handleRemoveSelectedFonts}
                          disabled={selectedFonts.size === 0}
                          className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[rgb(var(--color-destructive)/0.15)] border border-[rgb(var(--color-destructive)/0.25)] text-[rgb(var(--color-destructive))] text-xs font-medium hover:bg-[rgb(var(--color-destructive)/0.25)] transition-colors duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={14} />
                          <span className='hidden sm:block'>Remove Selected</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex items-center justify-center w-10 h-10 rounded-xl border border-[rgb(var(--color-foreground)/0.15)] text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.04)] transition-all duration-300 ease-in-out"
                      title="Edit Board"
                    >
                      <Edit3 size={18} />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectionMode(!selectionMode);
                      setSelectedFonts(new Set());
                    }}
                    className={`flex items-center justify-center px-4 h-10 rounded-xl border border-[rgb(var(--color-foreground)/0.15)] transition-all duration-300 ease-in-out text-sm font-medium ${selectionMode
                      ? 'bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))]'
                      : 'text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.04)]'
                      }`}
                  >
                    {selectionMode ? 'Cancel' : 'Manage Fonts'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* {selectionMode && (
        <div className="max-w-6xl mx-auto px-4 mt-4 mb-2">
          <div className="p-4 rounded-2xl bg-[rgb(var(--color-foreground)/0.03)] border border-[rgb(var(--color-foreground)/0.08)] flex items-center justify-between">
            <span className="font-medium text-sm">
              {selectedFonts.size} font{selectedFonts.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (selectedFonts.size === fonts.length) setSelectedFonts(new Set());
                  else setSelectedFonts(new Set(fonts.map(f => f.font_id)));
                }}
                className="px-4 h-10 text-xs bg-[rgb(var(--color-foreground)/0.05)] hover:bg-[rgb(var(--color-foreground)/0.1)] rounded-xl font-medium text-[rgb(var(--color-foreground)/0.6)] hover:text-[rgb(var(--color-foreground))] transition-colors"
              >
                {selectedFonts.size === fonts.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleRemoveSelectedFonts}
                disabled={selectedFonts.size === 0}
                className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[rgb(var(--color-destructive)/0.1)] text-[rgb(var(--color-destructive))] text-xs font-medium hover:bg-[rgb(var(--color-destructive)/0.2)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
                Remove Selected
              </button>
            </div>
          </div>
        </div>
      )} */}

      {isEditModalOpen && board && (
        <EditBoardModal
          board={board}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={async (id, updates) => {
            const success = await updateBoard(id, updates);
            if (success) {
              setBoard(prev => prev ? { ...prev, ...updates } : prev);
            }
            return success;
          }}
          onDelete={deleteBoard}
          onDeleted={() => navigate(`/${username}`)}
        />
      )}

      <div className="relative px-1 sm:px-2 md:px-4 pt-4 md:pt-6 w-full">
        <aside className="w-full shrink-0 transition-all duration-300 ease-in-out">
          <Filters
            filters={filters}
            onChange={setFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showExpandToggle={true}
            allExpanded={globalExpanded}
            onToggleAll={() => {
              setGlobalExpanded(!globalExpanded);
              setBulkToggleVersion(v => v + 1);
              setIsBulkToggling(true);
              if (bulkToggleTimeoutRef.current) clearTimeout(bulkToggleTimeoutRef.current);
              bulkToggleTimeoutRef.current = setTimeout(() => setIsBulkToggling(false), 450);
              setExpandedFontId(null);
            }}
            customText={customText}
            onCustomTextChange={setCustomText}
          />
        </aside>

        <div className="w-full h-full pb-20">
          {fonts.length === 0 ? (
            <div className="text-center py-20 text-[rgb(var(--color-muted-foreground))]">
              <p className="text-4xl mb-3">🎨</p>
              <p className="font-medium text-[rgb(var(--color-foreground))]">This board is empty</p>
              {isOwner && (
                <p className="text-sm mt-1">
                  <Link to="/fonts" className="text-[rgb(var(--color-foreground))] hover:underline">Browse fonts</Link> and save them to this board.
                </p>
              )}
            </div>
          ) : items.length > 0 ? (
            <div className={`masonic-grid zselect-none ${isBulkToggling ? 'is-bulk-toggling' : ''}`}>
              <Masonry
                key={`masonry-grid-${deleteCount}`}
                items={items}
                itemKey={(data) => data.id}
                columnCount={columns}
                columnGutter={16}
                itemHeightEstimate={280}
                overscanBy={1}
                render={MasonryCard}
              />
            </div>
          ) : (
            <div className="text-center py-20 text-[rgb(var(--color-muted-foreground)/0.5)]">
              <p className="text-xl mb-2">No fonts match your filters</p>
              <button onClick={() => setFilters({ query: '', categories: [], sortBy: 'trending' })} className="text-[rgb(var(--color-foreground))] hover:underline text-sm font-medium cursor-pointer">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
