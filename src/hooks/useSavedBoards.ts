import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Board } from './useBoards';

export interface SavedBoard {
  id: string;
  user_id: string;
  board_id: string;
  saved_at: string;
  boards?: Board & {
    profiles?: {
      full_name: string;
      username: string | null;
      avatar_url: string | null;
    };
  };
}

export function useSavedBoards() {
  const { user } = useAuth();
  const [savedBoards, setSavedBoards] = useState<SavedBoard[]>([]);
  const [savedBoardIds, setSavedBoardIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchSavedBoards = useCallback(async () => {
    if (!user) { setSavedBoards([]); setSavedBoardIds(new Set()); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_boards')
        .select(`
          id, user_id, board_id, saved_at,
          boards (
            id, user_id, name, slug, description, visibility, share_token, font_count, created_at, updated_at,
            profiles:user_id ( full_name, username, avatar_url ),
            board_fonts ( fonts ( id, name, font_variants ( variant_name, woff2_url, woff_url, ttf_url, otf_url ) ) )
          )
        `)
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((row: any) => ({
        ...row,
        boards: row.boards
          ? {
              ...row.boards,
              preview_fonts: row.boards.board_fonts
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
                    otf_url: regular?.otf_url,
                  };
                })
                ?.filter(Boolean)
                ?.slice(0, 4) || [],
            }
          : null,
      }));

      setSavedBoards(formatted);
      setSavedBoardIds(new Set(formatted.map((row: any) => row.board_id)));
    } catch (err) {
      console.error('fetchSavedBoards error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedBoards();
  }, [fetchSavedBoards]);

  const isBoardSaved = useCallback(
    (boardId: string) => savedBoardIds.has(boardId),
    [savedBoardIds]
  );

  const saveBoard = useCallback(
    async (boardId: string): Promise<boolean> => {
      if (!user) return false;
      const { error } = await supabase
        .from('saved_boards')
        .insert({ user_id: user.id, board_id: boardId });
      if (error) { console.error('saveBoard error:', error); return false; }
      setSavedBoardIds((prev) => new Set([...prev, boardId]));
      return true;
    },
    [user]
  );

  const unsaveBoard = useCallback(
    async (boardId: string): Promise<boolean> => {
      if (!user) return false;
      const { error } = await supabase
        .from('saved_boards')
        .delete()
        .eq('user_id', user.id)
        .eq('board_id', boardId);
      if (error) { console.error('unsaveBoard error:', error); return false; }
      setSavedBoardIds((prev) => {
        const next = new Set(prev);
        next.delete(boardId);
        return next;
      });
      setSavedBoards((prev) => prev.filter((sb) => sb.board_id !== boardId));
      return true;
    },
    [user]
  );

  const toggleSaveBoard = useCallback(
    async (boardId: string): Promise<'saved' | 'unsaved' | null> => {
      if (savedBoardIds.has(boardId)) {
        const ok = await unsaveBoard(boardId);
        return ok ? 'unsaved' : null;
      } else {
        const ok = await saveBoard(boardId);
        return ok ? 'saved' : null;
      }
    },
    [savedBoardIds, saveBoard, unsaveBoard]
  );

  return {
    savedBoards,
    savedBoardIds,
    loading,
    fetchSavedBoards,
    isBoardSaved,
    saveBoard,
    unsaveBoard,
    toggleSaveBoard,
  };
}
