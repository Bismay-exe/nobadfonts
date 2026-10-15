"use client";

import {
  Clock,
  LoaderCircle,
  Search,
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Building2,
} from "lucide-react";
import gsap from "gsap";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useDismiss } from "@/lib/hooks/use-dismiss";
import { cn } from "@/lib/utils";
import { MOODS, type MoodDefinition } from "@/config/moods";
import { POPULAR_TAGS, FALLBACK_FONTS } from "@/config/search-fallbacks";
import { supabase } from "@/lib/supabase";
import type { Font } from "@/types/font";
import { stopLenis, startLenis } from "@/hooks/useLenis";

// Dark luxury surface styling matching the reference screenshots
const PANEL_GLASS =
  "bg-[#141416]/95 backdrop-blur-[24px] backdrop-saturate-[1.8] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_24px_60px_-20px_rgba(0,0,0,0.7)] text-white";
const BAR_GLASS =
  "bg-[#161618] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_32px_-12px_rgba(0,0,0,0.5)] text-white";

const SURFACE_RADIUS = 28;
const PANEL_ROOM = 360;

export interface MorphingSearchChipsProps {
  /** Active filters shown as chips inside the bar. */
  chips?: string[];
  defaultChips?: string[];
  onChipsChange?: (chips: string[]) => void;
  /** Text in the field. */
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** Recent searches, newest first. */
  recents?: string[];
  defaultRecents?: string[];
  onRecentsChange?: (recents: string[]) => void;
  /** Persist uncontrolled recents in localStorage under this key. */
  storageKey?: string;
  /** How many recent searches to keep. Default 8. */
  maxRecents?: number;
  /** Terms offered while typing. */
  suggestions?: string[];
  /** Optional font list provided by caller. Otherwise fetched live from Supabase. */
  fonts?: Font[];
  /** Newly added fonts to show in suggestions / new additions. */
  newFonts?: Font[];
  /** Callback triggered when a font card is clicked. */
  onSelectFont?: (font: Font) => void;
  /** Callback triggered when a tag chip is toggled. */
  onSelectTag?: (tag: string) => void;
  /** Callback triggered when a mood chip is selected. */
  onSelectMood?: (mood: MoodDefinition) => void;
  /** Auto navigate to /fonts/{slug} when font is clicked. Defaults to true. */
  navigateOnSelect?: boolean;
  /** Suggestions are being fetched. */
  loading?: boolean;
  /** Most chips allowed at once. */
  maxChips?: number;
  /** Clean a term before it becomes a chip; return null to reject it. */
  normalize?: (term: string) => string | null;
  /** Shown when the field is empty and there are no recent searches. */
  emptyState?: ReactNode;
  /** Which way the surface grows. "auto" grows up unless there is no room. Default "bottom". */
  side?: "top" | "bottom" | "auto";
  /** Size variant: "default" (56px) or "sm" (40px) for compact navbar integration */
  size?: "default" | "sm";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** Submit each chip with a form under this name. */
  name?: string;
  placeholder?: string;
  /** Accessible name for the search field. */
  label?: string;
  /** Trailing controls inside the bar, such as filter buttons. */
  actions?: ReactNode;
  className?: string;
}

function useControllable<T>(value: T | undefined, initial: T, onChange?: (next: T) => void) {
  const [internal, setInternal] = useState<T>(value !== undefined ? value : initial);

  useEffect(() => {
    if (value !== undefined) {
      setInternal(value);
    }
  }, [value]);

  const current = value !== undefined ? value : internal;
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setInternal((prevInternal) => {
        const resolved = typeof next === "function" ? (next as (prev: T) => T)(prevInternal) : next;
        onChange?.(resolved);
        return resolved;
      });
    },
    [onChange],
  );
  return [current, set, setInternal] as const;
}

const sameTerm = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

const getChipLabel = (chip: string): string => {
  const matchedTag = POPULAR_TAGS.find(
    (t) => sameTerm(t.id, chip) || sameTerm(t.label, chip),
  );
  if (matchedTag) return matchedTag.label;
  const matchedMood = MOODS.find(
    (m) =>
      sameTerm(m.slug, chip) ||
      sameTerm(m.id, chip) ||
      sameTerm(m.name, chip),
  );
  if (matchedMood) return matchedMood.name;
  return chip.charAt(0).toUpperCase() + chip.slice(1);
};

const normalizeSearchText = (str: string) => str.toLowerCase().replace(/[\s\-_'".]/g, "");

/** Single Font Specimen Thumbnail Component displaying preview image or typographic fallback */
const FontThumbnailCard = memo(function FontThumbnailCard({
  font,
  onClick,
  onRemoveRecent,
  isRecent = false,
  isActive = false,
  cardRef,
}: {
  font: Font;
  onClick: () => void;
  onRemoveRecent?: () => void;
  isRecent?: boolean;
  isActive?: boolean;
  cardRef?: (node: HTMLDivElement | null) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl = font.preview_image_url || font.gallery_images?.[0] || font.og_image_url;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="group relative flex w-36 sm:w-44 shrink-0 cursor-pointer flex-col select-none text-left active:scale-95 transition-transform duration-150"
    >
      {/* Thumbnail Container */}
      <div
        className={cn(
          "relative h-28 sm:h-32 w-full overflow-hidden rounded-2xl bg-[#1c1c1f] border transition-all duration-300",
          isActive
            ? "border-white ring-2 ring-white/90 shadow-[0_0_24px_rgba(255,255,255,0.25)] scale-[1.02]"
            : "border-white/5 group-hover:border-white/20 group-hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.8)]"
        )}
      >
        {imageUrl && !imgFailed ? (
          <img
            src={imageUrl}
            alt={`${font.name} font preview`}
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
          />
        ) : (
          /* High-end Typographic Specimen Fallback */
          <div className="relative flex h-full w-full flex-col justify-between bg-linear-to-br from-neutral-800 to-neutral-950 p-3 text-white">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-white/50">
              <span className="truncate max-w-[65%]">{font.category || "Font"}</span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-white/10 text-white/70">
                {font.license_type || "OFL"}
              </span>
            </div>
            <div className="my-auto text-center px-1">
              <span className="block truncate text-lg sm:text-xl font-bold tracking-tight text-white/95 transition-transform duration-300 group-hover:scale-105">
                {font.name}
              </span>
              <span className="block text-[10px] tracking-widest font-mono text-white/40 mt-0.5">
                Aa Bb Cc 123
              </span>
            </div>
            <div className="text-[10px] text-white/40 truncate">
              {font.designer ? `by ${font.designer}` : "NoBadFonts"}
            </div>
          </div>
        )}

        {/* Remove recent badge button */}
        {isRecent && onRemoveRecent && (
          <button
            type="button"
            title="Remove from recents"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveRecent();
            }}
            className="absolute top-2 right-2 z-10 grid size-6 place-items-center rounded-full bg-black/60 text-white/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90 hover:text-white"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* Font title below thumbnail */}
      <div className="mt-2 flex flex-col px-0.5">
        <span
          className={cn(
            "truncate text-sm font-semibold transition-colors",
            isActive ? "text-white" : "text-white/60 group-hover:text-white"
          )}
        >
          {font.name}
        </span>
        <span
          className={cn(
            "truncate text-[11px] transition-colors",
            isActive ? "text-white/80" : "text-muted group-hover:text-white/60"
          )}
        >
          by {(font as { taxonomy?: { creator?: { foundry?: string; publisher?: string } } }).taxonomy?.creator?.foundry || (font as { taxonomy?: { creator?: { foundry?: string; publisher?: string } } }).taxonomy?.creator?.publisher || font.designer || 'Unknown'}
        </span>
      </div>
    </div>
  );
});

export function MorphingSearchChips({
  chips: chipsProp,
  defaultChips = [],
  onChipsChange,
  query: queryProp,
  defaultQuery = "",
  onQueryChange,
  recents: recentsProp,
  defaultRecents = [],
  onRecentsChange,
  storageKey = "nobadfonts_morphing_search_recents",
  maxRecents = 8,
  suggestions = [],
  fonts: customFonts,
  newFonts: customNewFonts,
  onSelectFont,
  onSelectTag,
  onSelectMood,
  navigateOnSelect = true,
  loading = false,
  maxChips,
  normalize,
  side = "bottom",
  size = "default",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  name,
  placeholder = "Search fonts, tags, moods...",
  label = "Search fonts",
  actions,
  className,
}: MorphingSearchChipsProps) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropMRef = useRef<HTMLDivElement>(null);

  const isCompact = size === "sm";
  const surfaceRadius = isCompact ? 20 : SURFACE_RADIUS;

  const [chips, setChips] = useControllable(chipsProp, defaultChips, onChipsChange);
  const [query, setQuery] = useControllable(queryProp, defaultQuery, onQueryChange);
  const deferredQuery = useDeferredValue(query);
  const [recents, setRecentsState, setStoredRecents] = useControllable(
    recentsProp,
    defaultRecents,
    onRecentsChange,
  );
  const [openState, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const open = openState && !disabled;

  const [filterTab, setFilterTab] = useState<"tags" | "moods">("tags");
  const [dbFonts, setDbFonts] = useState<Font[]>([]);
  const [isFetchingDb, setIsFetchingDb] = useState(false);
  const [recentlyViewedFonts, setRecentlyViewedFonts] = useState<Font[]>([]);
  const [serverFonts, setServerFonts] = useState<Font[]>([]);
  const [isSearchingServer, setIsSearchingServer] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isMac, setIsMac] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
    }
  }, []);

  // Auto-focus input when search expands
  useEffect(() => {
    if (open) {
      inputRef.current?.focus({ preventScroll: true });
    } else {
      setActiveIndex(null);
    }
  }, [open]);

  // Reset active highlight when search criteria change
  useEffect(() => {
    setActiveIndex(null);
  }, [query, chips]);

  // Auto-scroll the active font card smoothly into view
  useEffect(() => {
    if (activeIndex !== null && cardRefs.current[activeIndex]) {
      cardRefs.current[activeIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [activeIndex]);

  const [announcement, setAnnouncement] = useState({ text: "", count: 0 });
  const [markedChip, setMarkedChip] = useState<string | null>(null);
  const [placed, setPlaced] = useState<"top" | "bottom">(side === "top" ? "top" : "bottom");
  const [rtl, setRtl] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  // Load live fonts from Supabase on mount
  useEffect(() => {
    let active = true;
    async function loadFonts() {
      setIsFetchingDb(true);
      try {
        const { data, error } = await supabase
          .from("fonts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(80);

        if (!error && data && data.length > 0 && active) {
          setDbFonts(data as Font[]);
        }
      } catch {
        // Safe silent fallback to curated presets
      } finally {
        if (active) setIsFetchingDb(false);
      }
    }

    if (!customFonts || customFonts.length === 0) {
      loadFonts();
    }
    return () => {
      active = false;
    };
  }, [customFonts]);

  // Combined master font list (custom prop > db fonts > fallbacks)
  const allFonts = useMemo<Font[]>(() => {
    if (customFonts && customFonts.length > 0) return customFonts;
    if (dbFonts.length > 0) {
      // Merge dbFonts with fallback fonts to ensure plenty of rich specimen content
      const existingNames = new Set(dbFonts.map((f) => f.name.toLowerCase()));
      const filteredFallbacks = FALLBACK_FONTS.filter((f) => !existingNames.has(f.name.toLowerCase()));
      return [...dbFonts, ...filteredFallbacks];
    }
    return FALLBACK_FONTS;
  }, [customFonts, dbFonts]);

  // Debounced live Supabase search_fonts RPC call for 100% database coverage
  useEffect(() => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery && chips.length === 0) {
      setServerFonts([]);
      setIsSearchingServer(false);
      return;
    }

    let active = true;
    setIsSearchingServer(true);

    const timer = setTimeout(async () => {
      try {
        const filterTags = chips.length > 0 ? chips.map((c) => c.toLowerCase().trim()) : undefined;
        const { data, error } = await supabase.rpc("search_fonts", {
          query: trimmedQuery || undefined,
          filter_tags: filterTags,
          limit_val: 40,
        });

        if (active && !error && data && Array.isArray(data)) {
          const valid = (data as Font[]).filter(
            (f) => f && typeof f === "object" && f.family_role !== "parent",
          );
          setServerFonts(valid);
        }
      } catch {
        // Safe silent fallback to cached fonts
      } finally {
        if (active) setIsSearchingServer(false);
      }
    }, 220);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, chips]);

  // Merged font pool combining local fonts and live server search results
  const allMergedFonts = useMemo<Font[]>(() => {
    const map = new Map<string, Font>();
    for (const f of allFonts) {
      map.set(f.id, f);
    }
    for (const f of serverFonts) {
      if (!map.has(f.id)) {
        map.set(f.id, f);
      }
    }
    return Array.from(map.values());
  }, [allFonts, serverFonts]);

  // Newly added fonts
  const newAddedFonts = useMemo<Font[]>(() => {
    if (customNewFonts && customNewFonts.length > 0) return customNewFonts;
    return allFonts.slice(0, 10);
  }, [customNewFonts, allFonts]);

  // Restore and persist recently viewed font objects
  const recentFontsKey = `${storageKey}_viewed_fonts`;
  useEffect(() => {
    try {
      const stored = localStorage.getItem(recentFontsKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentlyViewedFonts(parsed.slice(0, maxRecents));
        }
      }
    } catch {
      // Storage unavailable or disabled
    }
  }, [recentFontsKey, maxRecents]);

  const saveRecentFont = useCallback(
    (font: Font) => {
      setRecentlyViewedFonts((prev) => {
        const filtered = prev.filter((f) => f.id !== font.id && f.slug !== font.slug);
        const updated = [font, ...filtered].slice(0, maxRecents);
        try {
          localStorage.setItem(recentFontsKey, JSON.stringify(updated));
        } catch {
          // ignore storage error
        }
        return updated;
      });
    },
    [recentFontsKey, maxRecents],
  );

  const clearRecentFonts = useCallback(() => {
    setRecentlyViewedFonts([]);
    setRecentsState([]);
    try {
      localStorage.removeItem(recentFontsKey);
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [recentFontsKey, storageKey, setRecentsState]);

  const removeSingleRecentFont = useCallback(
    (fontId: string) => {
      setRecentlyViewedFonts((prev) => {
        const updated = prev.filter((f) => f.id !== fontId);
        try {
          localStorage.setItem(recentFontsKey, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    [recentFontsKey],
  );

  // Dynamic tag counts calculated from loaded fonts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const font of allFonts) {
      if (font.category) {
        const cat = font.category.toLowerCase();
        counts[cat] = (counts[cat] || 0) + 1;
      }
      if (Array.isArray(font.tags)) {
        for (const t of font.tags) {
          if (typeof t === "string") {
            const tag = t.trim().toLowerCase();
            counts[tag] = (counts[tag] || 0) + 1;
          }
        }
      }
    }
    return counts;
  }, [allFonts]);

  // Dynamic mood counts
  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const mood of MOODS) {
      const targets = [
        mood.slug,
        ...(mood.preferredCategories || []),
        ...(mood.contextCategories || []),
      ].map((s) => s.toLowerCase());

      const matchCount = allFonts.filter((f) => {
        const cat = (f.category || "").toLowerCase();
        const tags = (f.tags || []).map((t) => t.toLowerCase());
        return targets.some((t) => cat.includes(t) || tags.includes(t));
      }).length;

      counts[mood.id] = Math.max(matchCount, 6);
    }
    return counts;
  }, [allFonts]);

  // Fast precomputed index for 100% database search with zero regex thrashing
  const indexedFonts = useMemo(() => {
    return allMergedFonts.map((font) => {
      const rawName = font.name || "";
      const rawDesigner =
        font.designer ||
        (font as { taxonomy?: { creator?: { foundry?: string; publisher?: string } } }).taxonomy?.creator?.foundry ||
        (font as { taxonomy?: { creator?: { foundry?: string; publisher?: string } } }).taxonomy?.creator?.publisher ||
        "";
      const rawCategory = font.category || "";
      const rawTags = Array.isArray(font.tags)
        ? font.tags.filter((t): t is string => typeof t === "string")
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
        fullSearch: normalizeSearchText(`${rawName} ${rawDesigner} ${rawCategory} ${rawTags.join(" ")}`),
      };
    });
  }, [allMergedFonts]);

  // Search filtering logic matching font name, designer, category, tags, and moods
  const trimmed = deferredQuery.trim().toLowerCase();

  const matchingFonts = useMemo<Font[]>(() => {
    if (!trimmed && chips.length === 0) return [];
    const cleanQ = normalizeSearchText(trimmed);

    let pool = indexedFonts;

    // 1. Intersection filtering: font must match EVERY selected chip (AND logic)
    if (chips.length > 0) {
      pool = pool.filter((item) =>
        chips.every((chip) => {
          const cLower = chip.toLowerCase().trim();
          const cleanC = normalizeSearchText(cLower);

          // Fast mood match
          const matchedMood = MOODS.find(
            (m) =>
              m.id.toLowerCase() === cLower ||
              m.slug.toLowerCase() === cLower ||
              m.name.toLowerCase() === cLower,
          );
          if (matchedMood) {
            const moodKeywords = [
              matchedMood.slug,
              matchedMood.name.toLowerCase(),
              ...(matchedMood.preferredCategories || []),
              ...(matchedMood.contextCategories || []),
            ].map((s) => s.toLowerCase());

            return moodKeywords.some(
              (k) =>
                item.categoryLower.includes(k) ||
                item.tagsLower.some((t) => t.includes(k)),
            );
          }

          // Alias checking (e.g. mono / monospace)
          if (cLower === "mono" || cLower === "monospace") {
            return (
              item.categoryLower.includes("mono") ||
              item.tagsLower.some((t) => t.includes("mono"))
            );
          }

          // Direct category / tag / name match
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

    // 2. Query filter
    if (trimmed) {
      pool = pool.filter((item) => {
        return (
          item.nameLower.includes(trimmed) ||
          item.cleanName.includes(cleanQ) ||
          item.designerLower.includes(trimmed) ||
          item.cleanDesigner.includes(cleanQ) ||
          item.categoryLower.includes(trimmed) ||
          item.cleanCategory.includes(cleanQ) ||
          item.fullSearch.includes(cleanQ)
        );
      });
    }

    // 3. Intelligent relevance sorting
    return pool
      .map((item) => item.font)
      .sort((a, b) => {
        if (!trimmed) return 0;
        const aName = (a.name || "").toLowerCase();
        const bName = (b.name || "").toLowerCase();

        // Exact name match first
        if (aName === trimmed && bName !== trimmed) return -1;
        if (bName === trimmed && aName !== trimmed) return 1;

        // Prefix match second
        const aStarts = aName.startsWith(trimmed) || normalizeSearchText(aName).startsWith(cleanQ);
        const bStarts = bName.startsWith(trimmed) || normalizeSearchText(bName).startsWith(cleanQ);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;

        // Downloads popularity third
        return (b.downloads || 0) - (a.downloads || 0);
      });
  }, [chips, trimmed, indexedFonts]);

  // Capped preview list for instant zero-lag rendering
  const previewMatchingFonts = useMemo(() => matchingFonts.slice(0, 24), [matchingFonts]);

  // Foundries and Designers extracted from matching fonts
  const matchingDesigners = useMemo(() => {
    if (!trimmed || trimmed.length < 2) return [];
    const cleanQ = normalizeSearchText(trimmed);
    const designers = new Set<string>();

    for (const item of indexedFonts) {
      if (item.designer) {
        if (item.designerLower.includes(trimmed) || item.cleanDesigner.includes(cleanQ)) {
          designers.add(item.designer.trim());
        }
      }
    }

    return Array.from(designers).slice(0, 4);
  }, [trimmed, indexedFonts]);

  // Active list of fonts currently displayed on screen for keyboard arrow navigation
  const displayedFonts = useMemo<Font[]>(() => {
    if (trimmed || chips.length > 0) {
      return previewMatchingFonts;
    }
    if (recentlyViewedFonts.length > 0) {
      return recentlyViewedFonts;
    }
    return newAddedFonts;
  }, [trimmed, chips.length, previewMatchingFonts, recentlyViewedFonts, newAddedFonts]);

  // Quick suggestions based on typed query with normalized matching
  const matchingSuggestions = useMemo(() => {
    if (!trimmed) return [];
    const cleanQ = normalizeSearchText(trimmed);
    const pool = [
      ...suggestions,
      ...POPULAR_TAGS.map((t) => t.id),
      ...MOODS.map((m) => m.slug),
    ];
    return Array.from(new Set(pool))
      .filter((term) => {
        const tLower = term.toLowerCase();
        const matches = tLower.includes(trimmed) || normalizeSearchText(tLower).includes(cleanQ);
        return matches && !chips.some((c) => sameTerm(c, term));
      })
      .slice(0, 6);
  }, [trimmed, suggestions, chips]);

  const announce = useCallback(
    (text: string) => setAnnouncement((current) => ({ text, count: current.count + 1 })),
    [],
  );

  const marked = markedChip !== null && chips.includes(markedChip) ? markedChip : null;
  if (markedChip !== null && marked === null) setMarkedChip(null);

  const chipsLatest = useRef(chips);
  useLayoutEffect(() => {
    chipsLatest.current = chips;
  });

  useLayoutEffect(() => {
    if (rootRef.current) setRtl(getComputedStyle(rootRef.current).direction === "rtl");
  }, []);

  // Recents persistence for text terms
  const persist = storageKey && recentsProp === undefined ? storageKey : null;
  useEffect(() => {
    if (!persist) return;
    try {
      const stored = JSON.parse(window.localStorage.getItem(persist) ?? "null");
      if (Array.isArray(stored)) {
        setStoredRecents(
          stored.filter((term): term is string => typeof term === "string").slice(0, maxRecents),
        );
      }
    } catch {
      // Storage blocked
    }
  }, [persist, maxRecents, setStoredRecents]);

  const setRecents = (next: string[]) => {
    setRecentsState(next);
    if (!persist) return;
    try {
      window.localStorage.setItem(persist, JSON.stringify(next));
    } catch {
      // storage error
    }
  };

  const hasPanel = true;
  const panelOpen = open && hasPanel;

  // Clean background scroll lock when search panel is open without jerky scroll jump
  useEffect(() => {
    if (!panelOpen) return;

    stopLenis();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      startLenis();
    };
  }, [panelOpen]);

  // Direction calculation
  useLayoutEffect(() => {
    if (!panelOpen) return;
    if (side !== "auto") {
      setPlaced(side);
      return;
    }
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const above = rect.top;
    const below = window.innerHeight - rect.bottom;
    setPlaced(above < PANEL_ROOM && below > above ? "bottom" : "top");
  }, [panelOpen, side]);

  const close = useCallback(() => setOpen(false), [setOpen]);
  useDismiss(open, close, rootRef);

  // Scroll newly added chips into view
  const chipCount = useRef(chips.length);
  useEffect(() => {
    const row = chipsRef.current;
    const added = chips.length > chipCount.current;
    chipCount.current = chips.length;
    if (!row || !added || row.scrollWidth <= row.clientWidth) return;
    const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollTo({ left: rtl ? -row.scrollWidth : row.scrollWidth, behavior: prefersReduced ? "auto" : "smooth" });
  }, [chips.length, rtl]);

  const full = maxChips !== undefined && chips.length >= maxChips;

  const addChip = (term: string) => {
    const value = normalize ? normalize(term) : term.trim();
    if (!value) return;
    const exists = chips.some((chip) => sameTerm(chip, value));
    if (!exists && full) {
      announce(`Up to ${maxChips} filters`);
      return;
    }
    if (!exists) {
      setChips([...chips, value]);
      announce(`Added filter ${getChipLabel(value)}`);
    }
    setRecents([value, ...recents.filter((recent) => !sameTerm(recent, value))].slice(0, maxRecents));
    if (query) {
      setQuery("");
    }
  };

  const removeChip = (term: string) => {
    setChips(chips.filter((chip) => !sameTerm(chip, term)));
    announce(`Removed filter ${getChipLabel(term)}`);
    inputRef.current?.focus({ preventScroll: true });
  };

  const toggleChip = (term: string, altTerm?: string) => {
    const existing = chips.find(
      (chip) => sameTerm(chip, term) || (altTerm && sameTerm(chip, altTerm))
    );
    if (existing) {
      removeChip(existing);
    } else {
      addChip(term);
    }
  };

  const stepMark = (direction: 1 | -1) =>
    setMarkedChip((current) => {
      const list = chipsLatest.current;
      if (list.length === 0) return null;
      const at = current === null ? list.length : list.indexOf(current);
      const next = at + direction;
      if (next >= list.length) return null;
      return list[Math.max(next, 0)];
    });

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const field = event.currentTarget;
    const atStart = field.selectionStart === 0 && field.selectionEnd === 0;
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";

    // Arrow navigation down into result cards
    if (event.key === "ArrowDown") {
      if (displayedFonts.length > 0) {
        event.preventDefault();
        setActiveIndex((prev) => (prev === null ? 0 : Math.min(prev + 1, displayedFonts.length - 1)));
        return;
      }
    }

    // Arrow navigation up back towards the input or previous card
    if (event.key === "ArrowUp") {
      if (activeIndex !== null) {
        event.preventDefault();
        if (activeIndex <= 0) {
          setActiveIndex(null);
          inputRef.current?.focus({ preventScroll: true });
        } else {
          setActiveIndex((prev) => (prev !== null ? prev - 1 : null));
        }
        return;
      }
    }

    // Horizontal arrow navigation when a card is actively highlighted
    if (activeIndex !== null) {
      if (event.key === forward) {
        event.preventDefault();
        setActiveIndex((prev) => (prev !== null ? Math.min(prev + 1, displayedFonts.length - 1) : 0));
        return;
      }
      if (event.key === back) {
        event.preventDefault();
        setActiveIndex((prev) => (prev !== null ? Math.max(prev - 1, 0) : 0));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (displayedFonts[activeIndex]) {
          handleFontSelect(displayedFonts[activeIndex]);
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setActiveIndex(null);
        return;
      }
    }

    if (marked !== null) {
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        setMarkedChip(null);
        removeChip(marked);
        return;
      }
      if (event.key === back || event.key === forward) {
        event.preventDefault();
        stepMark(event.key === back ? -1 : 1);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setMarkedChip(null);
        return;
      }
      setMarkedChip(null);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (query !== "") {
        setQuery("");
      } else {
        close();
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (trimmed) {
        // If exact matching font exists, open it, otherwise add as search chip
        const directFont = matchingFonts.find(
          (f) => f.name.toLowerCase() === trimmed || f.slug.toLowerCase() === trimmed,
        );
        if (directFont) {
          handleFontSelect(directFont);
        } else {
          addChip(query.trim());
          if (navigateOnSelect && typeof window !== "undefined" && window.location.pathname !== "/fonts") {
            const params = new URLSearchParams();
            if (query.trim()) params.set("query", query.trim());
            const nextChips = chips.some((c) => sameTerm(c, query.trim())) ? chips : [...chips, query.trim()];
            if (nextChips.length > 0) params.set("categories", nextChips.join(","));
            navigate(`/fonts?${params.toString()}`);
            close();
          }
        }
      }
      return;
    }

    if (event.key === "Backspace" && atStart && chips.length > 0) {
      event.preventDefault();
      const last = chips[chips.length - 1];
      setMarkedChip(last);
      announce(`${getChipLabel(last)} selected. Press Backspace again to remove it.`);
      return;
    }

    if (event.key === back && atStart && chips.length > 0) {
      event.preventDefault();
      stepMark(-1);
    }
  };

  const handleFontSelect = (font: Font) => {
    saveRecentFont(font);
    onSelectFont?.(font);
    if (navigateOnSelect) {
      navigate(`/fonts/${font.slug}`);
    }
    close();
  };

  const handleTagClick = (tagId: string, tagLabel: string) => {
    toggleChip(tagId, tagLabel);
    onSelectTag?.(tagLabel);
  };

  const handleMoodClick = (mood: MoodDefinition) => {
    toggleChip(mood.slug, mood.name);
    onSelectMood?.(mood);
  };

  const focusField = (event: ReactPointerEvent) => {
    if (disabled || (event.target as Element).closest("button, input, a")) return;
    event.preventDefault();
    inputRef.current?.focus({ preventScroll: true });
    setOpen(true);
  };

  const below = placed === "bottom";

  // GSAP: animate panel open/close
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (panelOpen) {
      const dir = below ? -8 : 8;
      gsap.fromTo(el, { opacity: 0, y: dir, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: "power2.out" });
    } else {
      const dir = below ? -6 : 6;
      gsap.to(el, { opacity: 0, y: dir, scale: 0.98, duration: 0.12, ease: "power2.in" });
    }
  }, [panelOpen, below]);

  // Content for the expanded panel matching the screenshots
  const panelContent = (
    <div className="flex flex-col gap-5 p-2 sm:p-3 text-white">
      {/* 1. FILTER SECTION: ANIMATION / CATEGORIES & MOODS PILLS (Matches reference screenshots) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">
              {filterTab === "tags" ? "CATEGORIES" : "MOODS"}
            </span>

            {/* Subtle Tab Switcher */}
            <div className="flex items-center rounded-full bg-white/6 p-0.5">
              <button
                type="button"
                onClick={() => setFilterTab("tags")}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                  filterTab === "tags" ? "bg-white text-black font-semibold" : "text-white/60 hover:text-white",
                )}
              >
                Tags
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("moods")}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                  filterTab === "moods" ? "bg-white text-black font-semibold" : "text-white/60 hover:text-white",
                )}
              >
                Moods
              </button>
            </div>
          </div>

          {chips.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setChips([]);
                announce("Cleared filter chips");
              }}
              className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Horizontal Scrollable Row of Filter Pills (Hover 10, Press 17, Drag 10...) */}
        <div className="relative -mx-2 px-2 mask-[linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]">
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {filterTab === "tags"
              ? POPULAR_TAGS.map((tag) => {
                const isSelected = chips.some(
                  (c) => sameTerm(c, tag.id) || sameTerm(c, tag.label),
                );
                const count = tagCounts[tag.id] ?? tag.defaultCount;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTagClick(tag.id, tag.label);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all duration-300 select-none cursor-pointer active:scale-95",
                      isSelected
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "bg-white/8 hover:bg-white/14 text-white/70 hover:text-white",
                    )}
                  >
                    <span>{tag.label}</span>
                    <span
                      className={cn(
                        "text-[11px] font-semibold transition-colors",
                        isSelected ? "text-black/60" : "text-white/40",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })
              : MOODS.map((mood) => {
                const isSelected = chips.some(
                  (c) => sameTerm(c, mood.slug) || sameTerm(c, mood.id) || sameTerm(c, mood.name),
                );
                const count = moodCounts[mood.id] ?? 8;
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMoodClick(mood);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 select-none cursor-pointer active:scale-95",
                      isSelected
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "bg-white/8 hover:bg-white/14 text-white/80 hover:text-white border border-white/5",
                    )}
                  >
                    <span>{mood.emoji}</span>
                    <span>{mood.name}</span>
                    <span
                      className={cn(
                        "text-[11px] font-normal transition-colors",
                        isSelected ? "text-black/60" : "text-white/40",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* 2. MAIN SECTION: SEARCH RESULTS / RECENTLY VIEWED / NEW ADDED FONTS (With Images!) */}
      {trimmed || chips.length > 0 ? (
        /* SEARCH RESULTS STATE */
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold tracking-wider text-white/50 uppercase flex items-center gap-1.5">
              <Sparkles className="size-3 text-white/40" />
              FONTS ({matchingFonts.length})
              {isSearchingServer && (
                <LoaderCircle className="size-3 animate-spin text-white/50 ml-0.5" />
              )}
            </span>
            {matchingFonts.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const params = new URLSearchParams();
                  if (query.trim()) params.set("query", query.trim());
                  if (chips.length > 0) params.set("categories", chips.join(","));
                  navigate(`/fonts?${params.toString()}`);
                  close();
                }}
                className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                View all in catalog
                <ArrowRight className="size-3" />
              </button>
            )}
          </div>

          {/* Quick autocomplete / suggested tags & moods chips */}
          {matchingSuggestions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap px-1">
              <span className="text-[11px] text-white/40">Suggested:</span>
              {matchingSuggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addChip(sug);
                  }}
                  className="rounded-full bg-white/6 hover:bg-white/14 px-2.5 py-0.5 text-xs text-white/80 transition-colors cursor-pointer"
                >
                  + {getChipLabel(sug)}
                </button>
              ))}
            </div>
          )}

          {/* Matching Foundries & Designers Section */}
          {matchingDesigners.length > 0 && (
            <div className="flex flex-col gap-1.5 px-1 py-1">
              <span className="text-[11px] font-semibold tracking-wider text-white/50 uppercase flex items-center gap-1.5">
                <Building2 className="size-3 text-white/40" />
                FOUNDRIES &amp; DESIGNERS ({matchingDesigners.length})
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {matchingDesigners.map((designer) => (
                  <button
                    key={designer}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/designers/${encodeURIComponent(designer)}`);
                      close();
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/6 hover:bg-white/14 border border-white/5 hover:border-white/20 text-xs font-medium text-white/90 hover:text-white transition-all cursor-pointer group"
                  >
                    <Building2 className="size-3 text-white/40 group-hover:text-white/70 transition-colors" />
                    <span>{designer}</span>
                    <ArrowRight className="size-2.5 text-white/30 group-hover:text-white/60 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {previewMatchingFonts.length > 0 ? (
            <div className="relative -mx-2 px-2 mask-[linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]">
              <div className="flex items-start gap-3.5 overflow-x-auto py-1 scrollbar-none">
                {previewMatchingFonts.map((font, idx) => (
                  <FontThumbnailCard
                    key={font.id}
                    font={font}
                    isActive={activeIndex === idx}
                    cardRef={(el) => {
                      cardRefs.current[idx] = el;
                    }}
                    onClick={() => handleFontSelect(font)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-2xl bg-white/3">
              <Search className="size-8 text-white/20 mb-2" />
              <p className="text-sm font-medium text-white/80">
                {query
                  ? `No fonts found for "${query}"`
                  : `No fonts found matching the selected filter${chips.length > 1 ? "s" : ""}: ${chips.map(getChipLabel).join(", ")}`}
              </p>
              <p className="text-xs text-white/40 mt-1 max-w-sm">
                Try searching for sans, serif, cyberpunk, or clear existing filters.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* EMPTY / DEFAULT STATE: RECENTLY VIEWED & NEW ADDED FONTS (Matches Image 1 & 2) */
        <div className="flex flex-col gap-5">
          {/* RECENTLY VIEWED SECTION (Image 1) */}
          {recentlyViewedFonts.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold tracking-wider text-white/50 uppercase flex items-center gap-1.5">
                  <Clock className="size-3 text-white/40" />
                  RECENTLY VIEWED
                </span>
                <button
                  type="button"
                  onClick={clearRecentFonts}
                  className="text-xs text-white/40 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>

              <div className="relative -mx-2 px-2 mask-[linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]">
                <div className="flex items-start gap-3.5 overflow-x-auto py-1 scrollbar-none">
                  {recentlyViewedFonts.map((font, idx) => (
                    <FontThumbnailCard
                      key={`recent-${font.id}`}
                      font={font}
                      isRecent={true}
                      isActive={activeIndex === idx}
                      cardRef={(el) => {
                        cardRefs.current[idx] = el;
                      }}
                      onRemoveRecent={() => removeSingleRecentFont(font.id)}
                      onClick={() => handleFontSelect(font)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NEW ADDED FONTS / SUGGESTIONS SECTION (Image 2) */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold tracking-wider text-white/50 uppercase flex items-center gap-1.5">
                <TrendingUp className="size-3 text-white/40" />
                {recentlyViewedFonts.length > 0 ? "NEW ADDED FONTS" : "SUGGESTIONS"}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigate("/fonts");
                  close();
                }}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
              >
                Explore all
                <ArrowRight className="size-3" />
              </button>
            </div>

            <div className="relative -mx-2 px-2 mask-[linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]">
              <div className="flex items-start gap-3.5 overflow-x-auto py-1 scrollbar-none">
                {newAddedFonts.map((font, idx) => {
                  const isPrimary = recentlyViewedFonts.length === 0;
                  return (
                    <FontThumbnailCard
                      key={`new-${font.id}`}
                      font={font}
                      isActive={isPrimary && activeIndex === idx}
                      cardRef={(el) => {
                        if (isPrimary) cardRefs.current[idx] = el;
                      }}
                      onClick={() => handleFontSelect(font)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading state indicator */}
      {(loading || isFetchingDb) && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-white/40">
          <LoaderCircle className="size-3.5 animate-spin" />
          Loading typefaces...
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex justify-center font-inter transition-all duration-300 min-w-0 max-w-full",
        open ? "w-full max-w-none md:max-w-xl" : "w-full max-w-full",
        isCompact ? "h-10" : "h-14",
        disabled && "opacity-60",
        className,
      )}
    >
      {/* Low-opacity dark backdrop covering whole screen portaled to body */}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            ref={backdropMRef}
            onPointerDown={(e) => {
              e.preventDefault();
              close();
            }}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs cursor-pointer"
            style={{ display: panelOpen ? "block" : "none" }}
            aria-hidden="true"
          />,
          document.body,
        )}

      {/* Morphing Expandable Flyout Panel */}
      {panelOpen && (
        <div
          ref={panelRef}
          style={{ borderRadius: surfaceRadius, opacity: 0 }}
          className={cn(
            "absolute z-50 left-1/2 -translate-x-1/2 w-[calc(100vw-20px)] sm:w-[540px] md:w-[580px] max-w-xl overflow-hidden",
            below ? "top-full mt-2.5" : "bottom-full mb-2.5",
            PANEL_GLASS,
          )}
        >
          <div className="max-h-[75vh] sm:max-h-[80vh] overflow-y-auto scrollbar-none p-2 sm:p-2.5">
            {panelContent}
          </div>
        </div>
      )}

      {/* Main Pill Search Input Bar */}
      <div
        onPointerDown={focusField}
        style={{ borderRadius: surfaceRadius, transition: "width 0.3s cubic-bezier(0.16,1,0.3,1)" }}
        className={cn(
          "relative z-40 flex min-w-0 items-center gap-1.5 sm:gap-2 max-w-full",
          isCompact ? "h-10 ps-3 pe-2" : "h-14 ps-3 sm:ps-4 pe-2.5 sm:pe-4",
          BAR_GLASS,
          disabled ? "cursor-not-allowed" : "cursor-text",
          actions ? "pe-2" : isCompact ? "pe-2.5" : "pe-3 sm:pe-4",
          open ? "w-full ring-1 ring-white/20" : "w-full sm:w-fit max-w-full hover:border-white/20",
        )}
      >
        {loading || isFetchingDb || isSearchingServer ? (
          <LoaderCircle aria-hidden="true" className={cn("shrink-0 text-white/50 animate-spin", isCompact ? "size-4" : "size-5")} />
        ) : (
          <Search aria-hidden="true" className={cn("shrink-0 text-white/50", isCompact ? "size-4" : "size-5")} />
        )}

        {/* Selected Morphing Filter Chips inside the bar */}
        <div
          ref={chipsRef}
          className={cn(
            "relative flex min-w-0 shrink items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none",
            chips.length > 0 &&
            "-mx-1 px-1.5 sm:-mx-1.5 sm:px-2 mask-[linear-gradient(to_right,transparent,#000_8px,#000_calc(100%-8px),transparent)]",
          )}
        >
          {chips.map((chip) => {
            const chipLabel = getChipLabel(chip);
            return (
              <span
                key={chip}
                style={{ transformOrigin: rtl ? "right center" : "left center" }}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full text-white transition-all duration-200 select-none",
                  isCompact ? "h-6.5 ps-2.5 pe-1 text-[11px]" : "h-8 ps-3 pe-1 text-xs",
                  marked === chip
                    ? "bg-red-500/25 text-red-100 ring-1 ring-red-400/80 animate-pulse border border-red-500/40"
                    : "bg-white/12 text-white hover:bg-white/16",
                )}
              >
                <span className="max-w-20 sm:max-w-32 truncate" title={chipLabel}>
                  {chipLabel}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Remove filter ${chipLabel}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChip(chip);
                  }}
                  className="grid size-5 shrink-0 place-items-center rounded-full text-white/60 outline-none transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
                >
                  <X aria-hidden="true" className="size-3" />
                </button>
              </span>
            );
          })}
        </div>

        {/* Search Input Field */}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={panelOpen}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          disabled={disabled}
          value={query}
          placeholder={chips.length > 0 ? (open ? "Filter..." : "") : placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          style={
            open
              ? undefined
              : chips.length > 0
                ? { width: query ? `${query.length + 1}ch` : "1.5ch" }
                : { width: `${Math.max(placeholder.length, 6) + 2}ch` }
          }
          className={cn(
            "text-ellipsis bg-transparent text-white outline-none placeholder:text-white/40 disabled:cursor-not-allowed",
            open
              ? "min-w-20 flex-1"
              : chips.length > 0
                ? "min-w-0 w-2 shrink-0"
                : "min-w-16 flex-1 sm:flex-none",
            isCompact ? "h-7 text-xs sm:text-sm" : "h-9 text-sm sm:text-base",
          )}
        />

        {/* Clear query icon */}
        {query && (
          <button
            type="button"
            title="Clear text"
            onClick={(e) => {
              e.stopPropagation();
              setQuery("");
              inputRef.current?.focus({ preventScroll: true });
            }}
            className="grid size-6 place-items-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        )}

        {/* Mobile Cancel button when expanded */}
        {open && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="md:hidden text-xs text-white/70 hover:text-white px-2 py-1 shrink-0 font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}

        {/* Keyboard shortcut pill when idle */}
        {!open && chips.length === 0 && !query && (
          <span
            aria-hidden="true"
            className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-white/6 px-1.5 py-0.5 text-[10px] font-mono tracking-wider text-white/40 select-none shrink-0"
          >
            {isMac ? "⌘K" : "Ctrl K"}
          </span>
        )}

        {/* Trailing actions */}
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </div>

      {name
        ? chips.map((chip) => <input key={chip} type="hidden" name={name} value={chip} />)
        : null}

      <span aria-live="polite" className="sr-only">
        {announcement.text}
        {announcement.count % 2 ? " " : ""}
      </span>
    </div>
  );
}

export default MorphingSearchChips;
