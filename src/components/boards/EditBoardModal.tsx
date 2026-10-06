import { useState } from 'react';
import type { Board } from '../../hooks/useBoards';
import { X, Lock, Globe, Trash2 } from 'lucide-react';

interface EditBoardModalProps {
  board: Board;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (boardId: string, updates: Partial<Pick<Board, 'name' | 'description' | 'visibility'>>) => Promise<boolean>;
  onDelete: (boardId: string) => Promise<boolean>;
  onDeleted: () => void; // Callback after successful deletion to navigate away
}

export default function EditBoardModal({ board, isOpen, onClose, onUpdate, onDelete, onDeleted }: EditBoardModalProps) {
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description || '');
  const [visibility, setVisibility] = useState<'public' | 'private'>(board.visibility as 'public' | 'private');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Board name is required');
      return;
    }
    setError('');
    setIsSaving(true);
    
    const success = await onUpdate(board.id, {
      name: name.trim(),
      description: description.trim() || null,
      visibility,
    });

    setIsSaving(false);
    if (success) {
      onClose();
    } else {
      setError('Failed to update board. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    
    setIsDeleting(true);
    const success = await onDelete(board.id);
    setIsDeleting(false);
    
    if (success) {
      onClose();
      onDeleted();
    } else {
      setError('Failed to delete board.');
      setDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-foreground/10 rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-foreground/5">
          <h2 className="text-xl font-bold text-foreground">Edit Board</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="px-5 pt-5">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium border border-red-500/20">
                {error}
              </div>
            </div>
          )}

          <form id="edit-board-form" onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="board-name" className="block text-sm font-medium text-foreground mb-1.5">
                Board Name
              </label>
              <input
                id="board-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g., Retro Display Fonts"
                className="w-full px-4 py-2.5 rounded-xl bg-foreground/3 border border-foreground/10 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-foreground font-medium"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="board-desc" className="block text-sm font-medium text-foreground mb-1.5">
                Description <span className="text-muted font-normal">(Optional)</span>
              </label>
              <textarea
                id="board-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this board for?"
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-foreground/3 border border-foreground/10 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-foreground resize-none"
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Visibility
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    visibility === 'public' 
                      ? 'border-accent bg-accent/5 text-accent' 
                      : 'border-foreground/10 bg-foreground/2 text-muted hover:border-foreground/20'
                  }`}
                >
                  <Globe size={20} className="mb-1.5" />
                  <span className="font-semibold text-sm">Public</span>
                  <span className="text-xs opacity-70 mt-0.5">Visible to everyone</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    visibility === 'private' 
                      ? 'border-accent bg-accent/5 text-accent' 
                      : 'border-foreground/10 bg-foreground/2 text-muted hover:border-foreground/20'
                  }`}
                >
                  <Lock size={20} className="mb-1.5" />
                  <span className="font-semibold text-sm">Private</span>
                  <span className="text-xs opacity-70 mt-0.5">Only you can view</span>
                </button>
              </div>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="p-5 border-t border-foreground/5 bg-warning/2">
            <h3 className="text-sm font-semibold text-warning mb-2">Danger Zone</h3>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted max-w-50">
                Once you delete a board, there is no going back. Please be certain.
              </p>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-1.5 ${
                  deleteConfirm
                    ? 'bg-warning text-white hover:bg-warning/90'
                    : 'border border-warning/30 text-warning hover:bg-warning/10'
                }`}
              >
                {isDeleting ? 'Deleting...' : (
                  <>
                    <Trash2 size={14} />
                    {deleteConfirm ? 'Click to confirm' : 'Delete Board'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-foreground/5 bg-foreground/2 flex gap-3 justify-end rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving || isDeleting}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-foreground hover:bg-foreground/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-board-form"
            disabled={isSaving || isDeleting}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        
      </div>
    </div>
  );
}
