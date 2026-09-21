import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Board {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: 'public' | 'private';
  share_token: string | null;
  font_count: number;
  created_at: string;
  updated_at: string;
  preview_fonts?: {
    id: string;
    name: string;
    woff2_url?: string;
    woff_url?: string;
    ttf_url?: string;
    otf_url?: string;
  }[];
}

export interface BoardFont {
  id: string;
  board_id: string;
  font_id: string;
  note: string | null;
  position: number;
  added_at: string;
  fonts?: {
    id: string;
    name: string;
    slug: string;
    category: string;
    preview_image_url: string | null;
    designer: string;
    license_type: string;
    commercial_use: boolean | null;
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function useBoards() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBoards = useCallback(async () => {
    if (!user) { setBoards([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*, board_fonts(fonts(id, name, font_variants(variant_name, woff2_url, woff_url, ttf_url, otf_url)))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const formattedBoards = (data || []).map((b: any) => ({
        ...b,
        preview_fonts: b.board_fonts
          ?.map((bf: any) => {
            const font = bf.fonts;
            if (!font) return null;
            // Try to get the Regular variant first, otherwise fallback to the first variant
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
    } catch (err) {
      console.error('useBoards fetchBoards error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const createBoard = useCallback(async (
    name: string,
    visibility: 'public' | 'private' = 'public',
    description?: string
  ): Promise<Board | null> => {
    if (!user) return null;
    const baseSlug = slugify(name) || 'board';
    // Ensure unique slug
    let slug = baseSlug;
    let attempt = 1;
    while (boards.find(b => b.slug === slug)) {
      slug = `${baseSlug}-${attempt++}`;
    }
    const { data, error } = await supabase
      .from('boards')
      .insert({ user_id: user.id, name: name.trim(), slug, description: description?.trim() || null, visibility })
      .select()
      .single();
    if (error) { console.error('createBoard error:', error); return null; }
    const newBoard = data as Board;
    setBoards(prev => [newBoard, ...prev]);
    return newBoard;
  }, [user, boards]);

  const updateBoard = useCallback(async (
    boardId: string,
    updates: Partial<Pick<Board, 'name' | 'description' | 'visibility'>>
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('boards')
      .update(updates)
      .eq('id', boardId);
    if (error) { console.error('updateBoard error:', error); return false; }
    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, ...updates } : b));
    return true;
  }, []);

  const deleteBoard = useCallback(async (boardId: string): Promise<boolean> => {
    const { error } = await supabase.from('boards').delete().eq('id', boardId);
    if (error) { console.error('deleteBoard error:', error); return false; }
    setBoards(prev => prev.filter(b => b.id !== boardId));
    return true;
  }, []);

  const toggleFontInBoard = useCallback(async (
    boardId: string,
    fontId: string,
    note?: string
  ): Promise<'added' | 'removed' | null> => {
    // Check if already in board
    const { data: existing } = await supabase
      .from('board_fonts')
      .select('id')
      .eq('board_id', boardId)
      .eq('font_id', fontId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from('board_fonts').delete().eq('id', existing.id);
      if (error) { console.error('toggleFont remove error:', error); return null; }
      setBoards(prev => prev.map(b => b.id === boardId ? { ...b, font_count: Math.max(0, b.font_count - 1) } : b));
      return 'removed';
    } else {
      const { error } = await supabase.from('board_fonts').insert({
        board_id: boardId,
        font_id: fontId,
        note: note?.trim() || null,
      });
      if (error) { console.error('toggleFont add error:', error); return null; }
      setBoards(prev => prev.map(b => b.id === boardId ? { ...b, font_count: b.font_count + 1 } : b));
      return 'added';
    }
  }, []);

  const saveFontToBoards = useCallback(async (
    fontId: string,
    boardIds: string[],
    note?: string
  ): Promise<void> => {
    // For each selected board: add if not present
    await Promise.all(boardIds.map(async (boardId) => {
      const { data: existing } = await supabase
        .from('board_fonts')
        .select('id')
        .eq('board_id', boardId)
        .eq('font_id', fontId)
        .maybeSingle();
      if (!existing) {
        await supabase.from('board_fonts').insert({ board_id: boardId, font_id: fontId, note: note?.trim() || null });
      }
    }));
    await fetchBoards(); // refresh counts
  }, [fetchBoards]);

  const getFontBoardIds = useCallback(async (fontId: string): Promise<string[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from('board_fonts')
      .select('board_id, boards!inner(user_id)')
      .eq('font_id', fontId)
      .eq('boards.user_id', user.id);
    return (data || []).map((row: any) => row.board_id);
  }, [user]);

  const getBoardFonts = useCallback(async (boardId: string): Promise<BoardFont[]> => {
    const { data, error } = await supabase
      .from('board_fonts')
      .select(`
        id, board_id, font_id, note, position, added_at,
        fonts (id, name, slug, category, preview_image_url, designer, license_type, commercial_use)
      `)
      .eq('board_id', boardId)
      .order('position', { ascending: true });
    if (error) { console.error('getBoardFonts error:', error); return []; }
    return (data as unknown as BoardFont[]) || [];
  }, []);

  const getShareUrl = useCallback((board: Board): string => {
    if (board.visibility === 'public') {
      // Public boards are accessible by username/slug
      return `${window.location.origin}/${board.user_id}/boards/${board.slug}`;
    }
    // Private boards use share_token
    return `${window.location.origin}/board-share/${board.share_token}`;
  }, []);

  const getBoardByShareToken = useCallback(async (token: string): Promise<{ board: Board; fonts: BoardFont[] } | null> => {
    const { data, error } = await supabase
      .rpc('get_board_by_share_token', { p_share_token: token });
    if (error || !data || data.length === 0) return null;
    const board = data[0] as Board;
    const fonts = await getBoardFonts(board.id);
    return { board, fonts };
  }, [getBoardFonts]);

  return {
    boards,
    loading,
    fetchBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    toggleFontInBoard,
    saveFontToBoards,
    getFontBoardIds,
    getBoardFonts,
    getShareUrl,
    getBoardByShareToken,
  };
}
