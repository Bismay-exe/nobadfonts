import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { FALLBACK_FONTS } from '@/config/search-fallbacks';
import {
  normalizeSearchText,
  deriveLicenseInfo,
  deriveSourceInfo,
} from '@/features/search/search.utils';
import {
  DB_FONT_INITIAL_LIMIT,
  SEARCH_DEBOUNCE_MS,
  MAX_FONT_RESULTS,
} from '@/features/search/search.constants';
import { MOODS } from '@/config/moods';
import type { Font } from '@/types/font';
import type { IndexedFont, SearchFilters } from '@/features/search/search.types';

/**
 * useFontSearch — manages font data loading, indexing, filtering, and live search.
 * Separated from UI concerns so it can be used or tested in isolation.
 */
export function useFontSearch(
  customFonts?: Font[],
  customNewFonts?: Font[],
  storageKey = 'nobadfonts_morphing_search_recents',
  maxRecents = 8,
) {
  const [dbFonts, setDbFonts] = useState<Font[]>([]);
  const [isFetchingDb, setIsFetchingDb] = useState(false);
  const [serverFonts, setServerFonts] = useState<Font[]>([]);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  // ── Initial font load ──────────────────────────────────────────────────────
  useEffect(() => {
    if (customFonts && customFonts.length > 0) return;
    let active = true;
    setIsFetchingDb(true);
    supabase
      .from('fonts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(DB_FONT_INITIAL_LIMIT)
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data && data.length > 0) setDbFonts(data as Font[]);
        setIsFetchingDb(false);
      });
    return () => { active = false; };
  }, [customFonts]);

  // ── All fonts: custom > db > fallbacks (memoized) ────────────────────────
  const allFonts = useMemo<Font[]>(() => {
    if (customFonts && customFonts.length > 0) return customFonts;
    if (dbFonts.length > 0) {
      const existingNames = new Set(dbFonts.map((f) => f.name.toLowerCase()));
      return [...dbFonts, ...FALLBACK_FONTS.filter((f) => !existingNames.has(f.name.toLowerCase()))];
    }
    return FALLBACK_FONTS;
  }, [customFonts, dbFonts]);

  const newAddedFonts = useMemo<Font[]>(
    () => (customNewFonts && customNewFonts.length > 0 ? customNewFonts : allFonts.slice(0, 10)),
    [customNewFonts, allFonts],
  );

  // ── Pre-computed search index (sync with allFonts via ref) ────────────────
  // We use a ref so filterFonts always reads the latest index without becoming
  // a new function reference on every render.
  const indexedFontsRef = useRef<IndexedFont[]>([]);
  indexedFontsRef.current = useMemo(
    () =>
      allFonts.map((font) => {
        const rawName = font.name || '';
        const rawDesigner = font.designer || '';
        const rawCategory = font.category || '';
        const rawTags = Array.isArray(font.tags)
          ? font.tags.filter((t): t is string => typeof t === 'string')
          : [];
        return {
          font,
          nameLower: rawName.toLowerCase(),
          cleanName: normalizeSearchText(rawName),
          designer: rawDesigner,
          designerLower: rawDesigner.toLowerCase(),
          cleanDesigner: normalizeSearchText(rawDesigner),
          categoryLower: rawCategory.toLowerCase(),
          cleanCategory: normalizeSearchText(rawCategory),
          tagsLower: rawTags.map((t) => t.toLowerCase()),
          cleanTags: rawTags.map(normalizeSearchText),
          fullSearch: normalizeSearchText(
            `${rawName} ${rawDesigner} ${rawCategory} ${rawTags.join(' ')}`,
          ),
          licenseInfo: deriveLicenseInfo(font),
          sourceInfo: deriveSourceInfo(font),
        };
      }),
    [allFonts],
  );

  // ── Live server search ────────────────────────────────────────────────────
  const runServerSearch = useCallback(
    (query: string, chips: string[]) => {
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery && chips.length === 0) {
        setServerFonts([]);
        setIsSearchingServer(false);
        return;
      }
      setIsSearchingServer(true);
      const timer = setTimeout(async () => {
        try {
          const { data, error } = await supabase.rpc('search_fonts', {
            query: trimmedQuery || undefined,
            filter_category: chips.length > 0 ? chips[0] : undefined,
          });
          if (!error && data && Array.isArray(data)) {
            const fonts = (data as Array<{ font_data?: Font } | Font>)
              .map((row) => ('font_data' in row && row.font_data ? row.font_data : row as Font))
              .filter((f): f is Font => f != null && typeof f === 'object' && f.family_role !== 'parent');
            setServerFonts(fonts);
          }
        } catch {
          // silent fallback to local index
        } finally {
          setIsSearchingServer(false);
        }
      }, SEARCH_DEBOUNCE_MS);
      return () => clearTimeout(timer);
    },
    [],
  );

  // ── Client-side filtering ─────────────────────────────────────────────────
  // `serverFonts` is in the dependency array so filterFonts stays fresh.
  const filterFonts = useCallback(
    (query: string, chips: string[], filters: SearchFilters): Font[] => {
      const trimmed = query.trim().toLowerCase();
      const cleanQ = normalizeSearchText(trimmed);

      // Build merged pool: local index + any server results not already in it
      const localPool = indexedFontsRef.current;
      const localIds = new Set(localPool.map((p) => p.font.id));
      const extra: IndexedFont[] = serverFonts
        .filter((sf) => !localIds.has(sf.id))
        .map((sf) => ({
          font: sf,
          nameLower: sf.name.toLowerCase(),
          cleanName: normalizeSearchText(sf.name),
          designer: sf.designer || '',
          designerLower: (sf.designer || '').toLowerCase(),
          cleanDesigner: normalizeSearchText(sf.designer || ''),
          categoryLower: (sf.category || '').toLowerCase(),
          cleanCategory: normalizeSearchText(sf.category || ''),
          tagsLower: (sf.tags || []).map((t: string) => t.toLowerCase()),
          cleanTags: (sf.tags || []).map(normalizeSearchText),
          fullSearch: normalizeSearchText(
            `${sf.name} ${sf.designer} ${sf.category} ${(sf.tags || []).join(' ')}`,
          ),
          licenseInfo: deriveLicenseInfo(sf),
          sourceInfo: deriveSourceInfo(sf),
        }));
      let pool: IndexedFont[] = [...localPool, ...extra];

      // Chip / tag / mood filter (AND logic — font must match every chip)
      if (chips.length > 0) {
        pool = pool.filter((item) =>
          chips.every((chip) => {
            const cLower = chip.toLowerCase().trim();
            const cleanC = normalizeSearchText(cLower);
            const matchedMood = MOODS.find(
              (m) =>
                m.id.toLowerCase() === cLower ||
                m.slug.toLowerCase() === cLower ||
                m.name.toLowerCase() === cLower,
            );
            if (matchedMood) {
              const keywords = [
                matchedMood.slug,
                matchedMood.name.toLowerCase(),
                ...(matchedMood.preferredCategories || []),
                ...(matchedMood.contextCategories || []),
              ].map((s) => s.toLowerCase());
              return keywords.some(
                (k) => item.categoryLower.includes(k) || item.tagsLower.some((t) => t.includes(k)),
              );
            }
            if (cLower === 'mono' || cLower === 'monospace') {
              return (
                item.categoryLower.includes('mono') ||
                item.tagsLower.some((t) => t.includes('mono'))
              );
            }
            return (
              item.categoryLower.includes(cLower) ||
              item.cleanCategory.includes(cleanC) ||
              item.tagsLower.some((t) => t.includes(cLower)) ||
              item.cleanTags.some((t) => t.includes(cleanC)) ||
              item.nameLower.includes(cLower) ||
              item.cleanName.includes(cleanC)
            );
          }),
        );
      }

      // License filter (OR between selected options)
      if (filters.license.length > 0) {
        pool = pool.filter((item) => {
          const li = item.licenseInfo;
          return filters.license.some((f) => {
            if (f === 'free') return li.isFree;
            if (f === 'paid') return li.isPaid;
            if (f === 'personal') return li.isPersonalUse;
            if (f === 'commercial') return li.isCommercialUse;
            if (f === 'ofl') return item.font.license_type?.toLowerCase() === 'ofl';
            return false;
          });
        });
      }

      // Source filter (OR between selected options)
      if (filters.source.length > 0) {
        pool = pool.filter((item) => {
          const si = item.sourceInfo;
          return filters.source.some((f) => {
            if (f === 'google') return si.isGoogle;
            if (f === 'github') return si.isGitHub;
            if (f === 'other') return si.isOther;
            return false;
          });
        });
      }

      // Text query filter
      if (trimmed) {
        pool = pool.filter(
          (item) =>
            item.nameLower.includes(trimmed) ||
            item.cleanName.includes(cleanQ) ||
            item.designerLower.includes(trimmed) ||
            item.cleanDesigner.includes(cleanQ) ||
            item.categoryLower.includes(trimmed) ||
            item.cleanCategory.includes(cleanQ) ||
            item.fullSearch.includes(cleanQ),
        );
      }

      // Sort: exact match → prefix → popularity
      return pool
        .map((item) => item.font)
        .sort((a, b) => {
          if (!trimmed) return 0;
          const aName = (a.name || '').toLowerCase();
          const bName = (b.name || '').toLowerCase();
          if (aName === trimmed && bName !== trimmed) return -1;
          if (bName === trimmed && aName !== trimmed) return 1;
          const aStarts = aName.startsWith(trimmed);
          const bStarts = bName.startsWith(trimmed);
          if (aStarts && !bStarts) return -1;
          if (bStarts && !aStarts) return 1;
          return (b.downloads || 0) - (a.downloads || 0);
        })
        .slice(0, MAX_FONT_RESULTS);
    },
    [serverFonts],
  );

  // ── Recently viewed fonts ─────────────────────────────────────────────────
  const viewedKey = `${storageKey}_viewed_fonts`;
  const [recentlyViewedFonts, setRecentlyViewedFonts] = useState<Font[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(viewedKey);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) setRecentlyViewedFonts(parsed.slice(0, maxRecents));
      }
    } catch { /* storage blocked */ }
  }, [viewedKey, maxRecents]);

  const saveRecentFont = useCallback(
    (font: Font) => {
      setRecentlyViewedFonts((prev) => {
        const filtered = prev.filter((f) => f.id !== font.id);
        const updated = [font, ...filtered].slice(0, maxRecents);
        try { localStorage.setItem(viewedKey, JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      });
    },
    [viewedKey, maxRecents],
  );

  const removeSingleRecentFont = useCallback(
    (fontId: string) => {
      setRecentlyViewedFonts((prev) => {
        const updated = prev.filter((f) => f.id !== fontId);
        try { localStorage.setItem(viewedKey, JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      });
    },
    [viewedKey],
  );

  const clearRecentFonts = useCallback(() => {
    setRecentlyViewedFonts([]);
    try {
      localStorage.removeItem(viewedKey);
      localStorage.removeItem(storageKey);
    } catch { /* ignore */ }
  }, [viewedKey, storageKey]);

  return {
    allFonts,
    newAddedFonts,
    indexedFonts: indexedFontsRef.current,
    isFetchingDb,
    isSearchingServer,
    recentlyViewedFonts,
    saveRecentFont,
    removeSingleRecentFont,
    clearRecentFonts,
    filterFonts,
    runServerSearch,
  };
}
