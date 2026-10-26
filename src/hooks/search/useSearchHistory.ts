import { useCallback, useEffect, useState } from 'react';
import { SEARCH_STORAGE_KEY, MAX_RECENTS } from '@/features/search/search.constants';

/**
 * useSearchHistory — manages text search history with localStorage persistence.
 */
export function useSearchHistory(storageKey = SEARCH_STORAGE_KEY, max = MAX_RECENTS) {
  const [recents, setRecents] = useState<string[]>([]);

  // Load from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecents(parsed.filter((t): t is string => typeof t === 'string').slice(0, max));
        }
      }
    } catch { /* storage blocked */ }
  }, [storageKey, max]);

  const addRecent = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      setRecents((prev) => {
        const next = [trimmed, ...prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, max);
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    },
    [storageKey, max],
  );

  const removeRecent = useCallback(
    (term: string) => {
      setRecents((prev) => {
        const next = prev.filter((t) => t !== term);
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    },
    [storageKey],
  );

  const clearRecents = useCallback(() => {
    setRecents([]);
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
  }, [storageKey]);

  return { recents, addRecent, removeRecent, clearRecents };
}
