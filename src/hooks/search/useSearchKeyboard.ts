import { useEffect, useCallback } from 'react';

interface UseSearchKeyboardOptions {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

/**
 * useSearchKeyboard — registers global ⌘K / Ctrl+K shortcut to open search.
 */
export function useSearchKeyboard({ open, onOpen, onClose }: UseSearchKeyboardOptions) {
  const isMac = typeof navigator !== 'undefined' && /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key === 'k') {
        e.preventDefault();
        if (open) {
          onClose();
        } else {
          onOpen();
        }
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        onClose();
      }
    },
    [open, onOpen, onClose, isMac],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { isMac };
}
