import { useState } from 'react';
import type { Board } from '../../hooks/useBoards';
import { X } from 'lucide-react';

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
      <div className="relative bg-card-background border border-foreground/10 rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

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
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${visibility === 'public'
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-muted hover:border-foreground/20'
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
                    <path fill="currentColor" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M4.882 1.731a.48.48 0 0 0 .14.291a.487.487 0 0 1-.126.78l-.291.146a.7.7 0 0 0-.188.135l-.48.48a1 1 0 0 1-1.023.242l-.02-.007a1 1 0 0 0-.462-.04a7 7 0 0 1 2.45-2.027m-3 9.674l.86-.216a1 1 0 0 0 .758-.97v-.184a1 1 0 0 1 .445-.832l.04-.026a1 1 0 0 0 .152-1.54L3.121 6.621a.414.414 0 0 1 .542-.624l1.09.818a.5.5 0 0 0 .523.047a.5.5 0 0 1 .724.447v.455a.8.8 0 0 0 .131.433l.795 1.192a1 1 0 0 1 .116.238l.73 2.19a1 1 0 0 0 .949.683h.058a1 1 0 0 0 .949-.684l.73-2.189a1 1 0 0 1 .116-.238l.791-1.187A.45.45 0 0 1 11.743 8c.16 0 .306.084.392.218c.557.875 1.63 2.282 2.365 2.282l.04-.001a7.003 7.003 0 0 1-12.658.905Z" />
                  </svg>
                  <span className="mt-1.5 font-semibold text-sm">Public</span>
                  <span className="text-xs opacity-70 mt-0.5">Visible to everyone</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${visibility === 'private'
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-muted hover:border-foreground/20'
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect fill='currentColor' width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="mt-1.5 font-semibold text-sm">Private</span>
                  <span className="text-xs opacity-70 mt-0.5">Only you can view</span>
                </button>
              </div>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="p-5 border-t border-foreground/5 bg-warning/2">
            <h3 className="text-sm font-semibold text-warning mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 12 12">
                <path fill="currentColor" d="M4.283 1.973c.777-1.297 2.655-1.297 3.432 0l2.997 5.005c.797 1.332-.163 3.027-1.716 3.027H3.003c-1.554 0-2.514-1.694-1.716-3.027zM6 6.75a.75.75 0 1 0 0 1.5a.75.75 0 0 0 0-1.5M6 3.5a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 1 0V4a.5.5 0 0 0-.5-.5" />
              </svg>
              Danger Zone</h3>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted max-w-50">
                Once you delete a board, there is no going back. Please be certain.
              </p>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-1.5 ${deleteConfirm
                  ? 'bg-warning text-white hover:bg-warning/90'
                  : 'border border-warning/30 text-warning hover:bg-warning/10'
                  }`}
              >
                {isDeleting ? 'Deleting...' : (
                  <div className='flex items-center gap-1 group'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                      <path fill="currentColor" fillRule="evenodd" className="transition-all duration-300 ease-in-out group-hover:[d:path('M9.774_5L3.758_3.94l.174-.986a.5.5_0_0_1_.58-.405L18.411_5h.088h-.087l1.855.327a.5.5_0_0_1_.406.58l-.174.984l-2.09-.368l-.8_13.594A2_2_0_0_1_15.615_22H8.386a2_2_0_0_1-1.997-1.883L5.59_6.5h12.69zH5.5zM9_9l.5_9H11l-.4-9zm4.5_0l-.5_9h1.5l.5-9zm-2.646-7.871l3.94.694a.5.5_0_0_1_.405.58l-.174.984l-4.924-.868l.174-.985a.5.5_0_0_1_.58-.405z')]"
                        d="m18.412 6.5l-.801 13.617A2 2 0 0 1 15.614 22H8.386a2 2 0 0 1-1.997-1.883L5.59 6.5H3.5v-1A.5.5 0 0 1 4 5h16a.5.5 0 0 1 .5.5v1zM10 2.5h4a.5.5 0 0 1 .5.5v1h-5V3a.5.5 0 0 1 .5-.5M9 9l.5 9H11l-.4-9zm4.5 0l-.5 9h1.5l.5-9z"
                      />
                    </svg>
                    {deleteConfirm ? 'Click to confirm' : 'Delete Board'}
                  </div>
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
            className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}
