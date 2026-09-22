import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useBoards } from '../../hooks/useBoards';
import { useAuth } from '../../contexts/AuthContext';
import type { Board } from '../../hooks/useBoards';
import { Check, CheckCheck, Globe, Lock, Plus, X } from 'lucide-react';

interface SaveToBoardModalProps {
  fontId: string;
  fontName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SaveToBoardModal({ fontId, isOpen, onClose }: SaveToBoardModalProps) {
  const { user } = useAuth();
  const { boards, loading, createBoard, saveFontToBoards, getFontBoardIds } = useBoards();

  const [selectedBoardIds, setSelectedBoardIds] = useState<Set<string>>(new Set());
  const [savedBoardIds, setSavedBoardIds] = useState<Set<string>>(new Set()); // already-saved state
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardVisibility, setNewBoardVisibility] = useState<'public' | 'private'>('public');
  const [saving, setSaving] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Load which boards already have this font
  useEffect(() => {
    if (!isOpen || !user) return;
    getFontBoardIds(fontId).then(ids => {
      const idSet = new Set(ids);
      setSavedBoardIds(idSet);
      setSelectedBoardIds(new Set(idSet));
    });
  }, [isOpen, fontId, user, getFontBoardIds]);

  const toggle = useCallback((id: string) => {
    setSelectedBoardIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Boards to add (selected but not already saved)
      const toAdd = [...selectedBoardIds].filter(id => !savedBoardIds.has(id));
      // Boards to remove (was saved but now deselected)
      const toRemove = [...savedBoardIds].filter(id => !selectedBoardIds.has(id));

      if (toAdd.length > 0) await saveFontToBoards(fontId, toAdd);
      if (toRemove.length > 0) {
        const { supabase } = await import('../../lib/supabase');
        for (const boardId of toRemove) {
          await supabase.from('board_fonts')
            .delete()
            .eq('board_id', boardId)
            .eq('font_id', fontId);
        }
      }
      onClose();
    } catch (err) {
      console.error('Save to board error:', err);
    } finally {
      setSaving(false);
    }
  }, [user, fontId, selectedBoardIds, savedBoardIds, saveFontToBoards, onClose]);

  const handleCreateBoard = useCallback(async () => {
    if (!newBoardName.trim()) return;
    setCreateLoading(true);
    try {
      const board = await createBoard(newBoardName, newBoardVisibility);
      if (board) {
        setSelectedBoardIds(prev => new Set([...prev, board.id]));
        setIsCreating(false);
        setNewBoardName('');
        setNewBoardVisibility('public');
      }
    } finally {
      setCreateLoading(false);
    }
  }, [newBoardName, newBoardVisibility, createBoard]);

  const copyShareLink = useCallback((board: Board) => {
    const link = board.visibility === 'public'
      ? `${window.location.origin}/${board.user_id}/boards/${board.slug}`
      : `${window.location.origin}/board-share/${board.share_token}`;
    navigator.clipboard.writeText(link);
    setCopied(board.id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  if (!isOpen) return null;

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-200 flex items-center justify-center p-4 md:p-6 font-inter-tight tracking-wide"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[rgb(var(--color-foreground)/0.05)] backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-[rgb(var(--color-background)/0.8)] backdrop-blur-2xl rounded-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between text-3xl font-inter-tight font-medium tracking-wide">
            <div>
              <h2 className="text-[rgb(var(--color-foreground))] ml-3">Save to Board</h2>
              {/* <p className="text-xs text-[rgb(var(--color-muted-foreground))] mt-0.5 truncate max-w-65">{fontName}</p> */}
            </div>
            <button
              onClick={onClose}
              className="p-2 flex items-center justify-center rounded-full hover:bg-[rgb(var(--color-foreground)/0.08)] transition-colors duration-300 ease-in-out text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]"
            >
              <X />
            </button>
          </div>
        </div>

        {/* Board list */}
        <div className="max-h-[75dvh] overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-[rgb(var(--color-foreground)/0.15)] border-t-[rgb(var(--color-foreground))] animate-spin" />
            </div>
          ) : boards.length === 0 ? (
            <p className="text-sm text-center text-[rgb(var(--color-muted-foreground))] py-6">
              You don't have any boards yet.<br />Create one below to get started.
            </p>
          ) : (
            <ul className="space-y-1">
              {boards.map(board => {
                const isSelected = selectedBoardIds.has(board.id);
                return (
                  <li key={board.id}>
                    <div className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 ease-in-out cursor-pointer group ${isSelected
                      ? 'bg-[rgb(var(--color-foreground)/0.1)]'
                      : 'bg-[rgb(var(--color-foreground)/0.02)] hover:bg-[rgb(var(--color-foreground)/0.05)]'}`}
                      onClick={() => toggle(board.id)}
                    >
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-300 ease-in-out ${isSelected
                        ? 'text-[rgb(var(--color-foreground))] translate-x-0 scale-100'
                        : 'text-[rgb(var(--color-foreground)/0.25)] -translate-x-5 scale-0'}`}
                      >
                        {isSelected ? (
                          <Check />
                        ) : (
                          <></>
                        )}
                      </div>
                      {/* Info */}
                      <div className={`min-w-0 w-full flex items-center gap-4 ${isSelected ? 'translate-x-0' : '-translate-x-5'} transition-all duration-300 ease-in-out`}>
                        <span className="text-sm font-normal tracking-wider text-[rgb(var(--color-foreground))] block truncate">{board.name}</span>
                        <span className="text-xs text-[rgb(var(--color-muted-foreground))] flex items-center gap-1">
                          {board.font_count} font{board.font_count !== 1 ? 's' : ''} · {board.visibility === 'private' ? <Lock size={12} /> : <Globe size={12} />} {board.visibility === 'private' ? 'Private' : 'Public'}
                        </span>
                      </div>
                      {/* Share button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); copyShareLink(board); }}
                        title={`Copy share link (${board.visibility === 'private' ? 'private link' : 'public'})`}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[rgb(var(--color-foreground)/0.08)] transition-all duration-300 ease-in-out text-[rgb(var(--color-muted-foreground))]"
                      >
                        {copied === board.id ? (
                          <CheckCheck className='w-3.5 h-3.5 text-[rgb(var(--color-foreground))]' />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Create new board */}
        {/* <div className="px-5 pb-2 pt-2">
          {isCreating ? (
            <div className="space-y-2">
              <input
                autoFocus
                type="text"
                placeholder="Board name..."
                value={newBoardName}
                onChange={e => setNewBoardName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateBoard(); if (e.key === 'Escape') setIsCreating(false); }}
                className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-foreground)/0.15)] rounded-xl px-3 py-2 text-sm text-[rgb(var(--color-foreground))] placeholder-[rgb(var(--color-muted-foreground))] focus:outline-none focus:border-[rgb(var(--color-highlight))] transition-colors"
              />
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setNewBoardVisibility(v => v === 'public' ? 'private' : 'public')}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${newBoardVisibility === 'private'
                    ? 'border-[rgb(var(--color-foreground)/0.3)] bg-[rgb(var(--color-foreground)/0.06)] text-[rgb(var(--color-foreground))]'
                    : 'border-[rgb(var(--color-foreground)/0.15)] text-[rgb(var(--color-muted-foreground))]'}`}
                >
                  {newBoardVisibility === 'private' ? '🔒 Private' : '🌐 Public'}
                </button>
                <button
                  onClick={() => { setIsCreating(false); setNewBoardName(''); }}
                  className="text-xs px-3 py-1.5 rounded-lg text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-foreground)/0.06)] transition-colors"
                >Cancel</button>
                <button
                  onClick={handleCreateBoard}
                  disabled={!newBoardName.trim() || createLoading}
                  className="ml-auto text-xs px-4 py-1.5 rounded-lg bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))] font-bold disabled:opacity-50 transition-all hover:opacity-90"
                >
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-foreground)/0.05)] hover:text-[rgb(var(--color-foreground))] transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">New Board</span>
            </button>
          )}
        </div> */}

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 flex gap-4">
          {/* <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[rgb(var(--color-foreground)/0.15)] text-sm font-semibold text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.05)] transition-all"
          >
            Cancel
          </button> */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`zflex-1 px-5 py-2.5 rounded-xl bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] text-lg font-inter-tight font-medium tracking-wider transition-all duration-300 ease-in-out hover:opacity-90 disabled:opacity-60 ${isCreating ? 'hidden' : 'block'}`}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          {/* Create new board */}
          <div className='w-full'>
            {isCreating ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Board name..."
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateBoard(); if (e.key === 'Escape') setIsCreating(false); }}
                  className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-foreground)/0.1)] rounded-xl px-3 py-2 text-xl text-[rgb(var(--color-foreground))] placeholder-[rgb(var(--color-muted-foreground)/0.5)] focus:outline-none!"
                />
                <div className="flex w-full justify-between gap-2 items-center">
                  <button
                    onClick={() => setNewBoardVisibility(v => v === 'public' ? 'private' : 'public')}
                    className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border tracking-wider transition-all duration-300 ease-in-out ${newBoardVisibility === 'private'
                      ? 'border-[rgb(var(--color-foreground)/0.1)] bg-[rgb(var(--color-foreground)/0.06)] text-[rgb(var(--color-foreground))]'
                      : 'border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-muted-foreground))]'}`}
                  >
                    {newBoardVisibility === 'private' ? <Lock size={16} /> : <Globe size={16} />}
                    {newBoardVisibility === 'private' ? 'Private' : 'Public'}
                  </button>
                  <button
                    onClick={() => { setIsCreating(false); setNewBoardName(''); }}
                    className="ml-auto text-md tracking-wider font-medium px-3 py-1.5 rounded-xl text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-foreground)/0.06)] transition-colors"
                  >Cancel</button>
                  <button
                    onClick={handleCreateBoard}
                    disabled={!newBoardName.trim() || createLoading}
                    className="text-md tracking-wider px-4 py-1.5 rounded-xl bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] font-medium disabled:opacity-50 transition-all hover:opacity-90"
                  >
                    {createLoading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-lg text-[rgb(var(--color-muted-foreground))] bg-[rgb(var(--color-foreground)/0.05)] hover:bg-[rgb(var(--color-foreground)/0.1)] hover:text-[rgb(var(--color-foreground))] transition-all duration-300 ease-in-out"
              >
                <Plus />
                <span className="font-inter-tight font-normal tracking-wider">New Board</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
