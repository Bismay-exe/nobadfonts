"use client";

import { Clock, LoaderCircle, Search, X, Sparkles, ArrowRight, TrendingUp, Building2, Users, Type, Layers2, User, ShoppingBag, Palette, Sliders, RefreshCw, Upload, BookOpen, Terminal, Sun, Moon, Settings, ChevronRight, Github } from "lucide-react";
import { type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode, memo, useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MOODS, type MoodDefinition } from "@/config/moods";
import { POPULAR_TAGS } from "@/config/search-fallbacks";
import type { Font } from "@/types/font";
import { stopLenis, startLenis } from "@/hooks/useLenis";
import { useTheme } from "@/contexts/ThemeContext";
import { useFontSearch } from "@/hooks/search/useFontSearch";
import { useSearchFilters } from "@/hooks/search/useSearchFilters";
import { useSearchHistory } from "@/hooks/search/useSearchHistory";
import { useSearchKeyboard } from "@/hooks/search/useSearchKeyboard";
import { normalizeSearchText, sameTerm, getChipLabel, groupByDesigner } from "@/features/search/search.utils";
import { FILTER_TABS, LICENSE_OPTIONS, SOURCE_OPTIONS, SEARCH_CATEGORIES, COMMAND_ROUTES, MAX_SUGGESTIONS, MAX_DESIGNER_RESULTS } from "@/features/search/search.constants";
import type { SearchCategory, LicenseFilter, SourceFilter } from "@/features/search/search.types";

// ─── Styling tokens ───────────────────────────────────────────────────────────
const PANEL_GLASS =
  "bg-[#111113]/96 backdrop-blur-[28px] backdrop-saturate-[1.8] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07),0_32px_80px_-20px_rgba(0,0,0,0.75)] text-white";
const BAR_GLASS =
  "bg-[#161618] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_32px_-12px_rgba(0,0,0,0.5)] text-white";
const SURFACE_RADIUS = 28;
const COMPACT_RADIUS = 20;

// ─── Lucide icon map for command palette ─────────────────────────────────────
const ICON_MAP: Record<string, ReactNode> = {
  Type: <Type className="size-3.5" />,
  Layers2: <Layers2 className="size-3.5" />,
  User: <User className="size-3.5" />,
  ShoppingBag: <ShoppingBag className="size-3.5" />,
  Palette: <Palette className="size-3.5" />,
  Sliders: <Sliders className="size-3.5" />,
  RefreshCw: <RefreshCw className="size-3.5" />,
  Upload: <Upload className="size-3.5" />,
  BookOpen: <BookOpen className="size-3.5" />,
  Terminal: <Terminal className="size-3.5" />,
  Users: <Users className="size-3.5" />,
};

// ─── Controllable state helper ───────────────────────────────────────────────
function useControllable<T>(value: T | undefined, initial: T, onChange?: (next: T) => void) {
  const [internal, setInternal] = useState<T>(value !== undefined ? value : initial);
  useEffect(() => {
    if (value !== undefined) setInternal(value);
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

// ─── Font thumbnail card ──────────────────────────────────────────────────────
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
      className="group relative flex w-36 sm:w-44 shrink-0 cursor-pointer flex-col select-none text-left"
    >
      <div
        className={cn(
          "relative h-28 sm:h-32 w-full overflow-hidden rounded-2xl bg-[#1c1c1f] border",
          "transition-[border-color,box-shadow,transform] duration-200",
          isActive
            ? "border-white/50 ring-1 ring-white/40 shadow-[0_0_20px_rgba(255,255,255,0.12)] scale-[1.02]"
            : "border-white/5 group-hover:border-white/15 group-hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]",
        )}
      >
        {imageUrl && !imgFailed ? (
          <img
            src={imageUrl}
            alt={`${font.name} preview`}
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="relative flex h-full w-full flex-col justify-between p-3"
            style={{ background: "linear-gradient(135deg, #1e1e22 0%, #111113 100%)" }}>
            <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-white/40">
              <span className="truncate max-w-[65%]">{font.category || "Font"}</span>
              <span className="px-1 py-0.5 rounded bg-white/8 text-white/60">{font.license_type || "—"}</span>
            </div>
            <div className="my-auto text-center px-1">
              <span className="block truncate text-base sm:text-lg font-bold tracking-tight text-white/90 transition-transform duration-200 group-hover:scale-105">
                {font.name}
              </span>
              <span className="block text-[9px] tracking-widest font-mono text-white/30 mt-1">Aa Bb 123</span>
            </div>
            <div className="text-[9px] text-white/30 truncate">
              {font.designer || "NoBadFonts"}
            </div>
          </div>
        )}
        {/* Source badge */}
        {font.github_url && (
          <span className="absolute top-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[9px] text-white/60">
            <Github className="size-2.5" /> GitHub
          </span>
        )}
        {/* Remove recent button */}
        {isRecent && onRemoveRecent && (
          <button
            type="button"
            title="Remove from recents"
            onClick={(e) => { e.stopPropagation(); onRemoveRecent(); }}
            className="absolute top-2 right-2 z-10 grid size-6 place-items-center rounded-full bg-black/60 text-white/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90 hover:text-white"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-col px-0.5">
        <span className={cn("truncate text-[13px] font-semibold transition-colors leading-tight",
          isActive ? "text-white" : "text-white/60 group-hover:text-white")}>
          {font.name}
        </span>
        <span className={cn("truncate text-[11px] transition-colors mt-0.5",
          isActive ? "text-white/70" : "text-white/35 group-hover:text-white/55")}>
          {font.designer || "Unknown"}
        </span>
      </div>
    </div>
  );
});

// ─── Designer result row ──────────────────────────────────────────────────────
const DesignerRow = memo(function DesignerRow({
  name,
  fontCount,
  onClick,
}: {
  name: string;
  fontCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl bg-white/4 hover:bg-white/8 border border-white/5 hover:border-white/12 transition-all duration-150 group text-left"
    >
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-white/8 text-white/60 group-hover:text-white transition-colors">
        <User className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-white/90 truncate">{name}</span>
        <span className="text-xs text-white/40">{fontCount} font{fontCount !== 1 ? "s" : ""}</span>
      </div>
      <ChevronRight className="size-3.5 text-white/30 group-hover:text-white/60 shrink-0 transition-colors" />
    </button>
  );
});

// ─── Command item ─────────────────────────────────────────────────────────────
const CommandItem = memo(function CommandItem({
  icon,
  label,
  description,
  onClick,
  shortcut,
}: {
  icon: ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/6 transition-colors duration-100 group text-left"
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/6 text-white/50 group-hover:text-white/80 transition-colors">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <span className="block text-sm text-white/80 group-hover:text-white transition-colors font-medium leading-tight">{label}</span>
        {description && <span className="text-[11px] text-white/35">{description}</span>}
      </div>
      {shortcut && (
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/8 text-[10px] font-mono text-white/40 shrink-0">
          {shortcut}
        </kbd>
      )}
    </button>
  );
});

// ─── Filter chip row ──────────────────────────────────────────────────────────
function FilterChipRow({
  activeTab,
  setActiveTab,
  chips,
  onToggleTag,
  onToggleMood,
  onToggleLicense,
  onToggleSource,
  licenseFilters,
  sourceFilters,
  tagCounts,
  moodCounts,
  onClearAll,
  hasChips,
}: {
  activeTab: "tags" | "moods" | "license" | "source";
  setActiveTab: (t: "tags" | "moods" | "license" | "source") => void;
  chips: string[];
  onToggleTag: (id: string, label: string) => void;
  onToggleMood: (m: MoodDefinition) => void;
  onToggleLicense: (f: LicenseFilter) => void;
  onToggleSource: (f: SourceFilter) => void;
  licenseFilters: LicenseFilter[];
  sourceFilters: SourceFilter[];
  tagCounts: Record<string, number>;
  moodCounts: Record<string, number>;
  onClearAll: () => void;
  hasChips: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Tab bar + clear */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5 rounded-full bg-white/5 p-0.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-150",
                activeTab === tab.id
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-white/50 hover:text-white/80",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {(hasChips || licenseFilters.length > 0 || sourceFilters.length > 0) && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] text-white/35 hover:text-white/70 transition-colors px-2 py-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Scrollable pill row */}
      <div className="relative -mx-2 px-2" style={{ maskImage: "linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)" }}>
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {activeTab === "tags" &&
            POPULAR_TAGS.map((tag) => {
              const sel = chips.some((c) => sameTerm(c, tag.id) || sameTerm(c, tag.label));
              const count = tagCounts[tag.id] ?? tag.defaultCount;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleTag(tag.id, tag.label); }}
                  className={cn(
                    "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-medium select-none cursor-pointer",
                    "transition-all duration-150 active:scale-95",
                    sel
                      ? "bg-white text-black font-semibold"
                      : "bg-white/7 hover:bg-white/12 text-white/65 hover:text-white",
                  )}
                >
                  <span>{tag.label}</span>
                  <span className={cn("text-[10px]", sel ? "text-black/50" : "text-white/35")}>{count}</span>
                </button>
              );
            })}

          {activeTab === "moods" &&
            MOODS.map((mood) => {
              const sel = chips.some((c) => sameTerm(c, mood.slug) || sameTerm(c, mood.id) || sameTerm(c, mood.name));
              const count = moodCounts[mood.id] ?? 8;
              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleMood(mood); }}
                  className={cn(
                    "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-medium select-none cursor-pointer",
                    "transition-all duration-150 active:scale-95",
                    sel
                      ? "bg-white text-black font-semibold"
                      : "bg-white/7 hover:bg-white/12 text-white/65 hover:text-white border border-white/5",
                  )}
                >
                  <span>{mood.emoji}</span>
                  <span>{mood.name}</span>
                  <span className={cn("text-[10px]", sel ? "text-black/50" : "text-white/35")}>{count}</span>
                </button>
              );
            })}

          {activeTab === "license" &&
            LICENSE_OPTIONS.map((opt) => {
              const sel = licenseFilters.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleLicense(opt.id); }}
                  className={cn(
                    "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-medium select-none cursor-pointer",
                    "transition-all duration-150 active:scale-95",
                    sel
                      ? "bg-white text-black font-semibold"
                      : "bg-white/7 hover:bg-white/12 text-white/65 hover:text-white",
                  )}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}

          {activeTab === "source" &&
            SOURCE_OPTIONS.map((opt) => {
              const sel = sourceFilters.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSource(opt.id); }}
                  className={cn(
                    "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-medium select-none cursor-pointer",
                    "transition-all duration-150 active:scale-95",
                    sel
                      ? "bg-white text-black font-semibold"
                      : "bg-white/7 hover:bg-white/12 text-white/65 hover:text-white",
                  )}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

// ─── Settings panel ───────────────────────────────────────────────────────────
function SearchSettings({ onClose }: { onClose: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-1">
      <div className="px-1 pb-1">
        <span className="text-[10px] font-semibold tracking-widest text-white/35 uppercase">Settings & Navigation</span>
      </div>

      {/* Theme toggle */}
      <CommandItem
        icon={theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
        label={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        description={`Currently ${theme} mode`}
        onClick={toggleTheme}
      />

      {/* Nav commands */}
      <div className="mt-1 px-1">
        <span className="text-[10px] font-semibold tracking-widest text-white/35 uppercase">Navigate</span>
      </div>
      {COMMAND_ROUTES.map((cmd) => (
        <CommandItem
          key={cmd.id}
          icon={ICON_MAP[cmd.icon]}
          label={cmd.label}
          description={cmd.description}
          onClick={() => { navigate(cmd.route); onClose(); }}
        />
      ))}
    </div>
  );
}

// ─── Props interface ──────────────────────────────────────────────────────────
export interface MorphingSearchChipsProps {
  chips?: string[];
  defaultChips?: string[];
  onChipsChange?: (chips: string[]) => void;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  fonts?: Font[];
  newFonts?: Font[];
  onSelectFont?: (font: Font) => void;
  onSelectTag?: (tag: string) => void;
  onSelectMood?: (mood: MoodDefinition) => void;
  navigateOnSelect?: boolean;
  loading?: boolean;
  maxChips?: number;
  normalize?: (term: string) => string | null;
  side?: "top" | "bottom" | "auto";
  size?: "default" | "sm";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  name?: string;
  placeholder?: string;
  label?: string;
  actions?: ReactNode;
  className?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MorphingSearchChips({
  chips: chipsProp,
  defaultChips = [],
  onChipsChange,
  query: queryProp,
  defaultQuery = "",
  onQueryChange,
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
  placeholder = "Search fonts, designers, moods…",
  label = "Search fonts",
  actions,
  className,
}: MorphingSearchChipsProps) {
  const navigate = useNavigate();
  const isCompact = size === "sm";
  const [panelPos, setPanelPos] = useState<{ top?: number; bottom?: number }>({});
  const surfaceRadius = isCompact ? COMPACT_RADIUS : SURFACE_RADIUS;

  // ── Controllable state ───────────────────────────────────────────────────
  const [chips, setChips] = useControllable(chipsProp, defaultChips, onChipsChange);
  const [query, setQuery] = useControllable(queryProp, defaultQuery, onQueryChange);
  const deferredQuery = useDeferredValue(query);
  const [openState, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const open = openState && !disabled;

  // ── Local UI state ───────────────────────────────────────────────────────
  const [filterTab, setFilterTab] = useState<"tags" | "moods" | "license" | "source">("tags");
  const [searchCategory, setSearchCategory] = useState<SearchCategory>("fonts");
  const [showSettings, setShowSettings] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [markedChip, setMarkedChip] = useState<string | null>(null);
  const [placed, setPlaced] = useState<"top" | "bottom">(side === "top" ? "top" : "bottom");
  const [rtl, setRtl] = useState(false);
  const [announcement, setAnnouncement] = useState({ text: "", count: 0 });

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // ── Hooks ────────────────────────────────────────────────────────────────
  const {
    allFonts,
    newAddedFonts,
    indexedFonts,
    isFetchingDb,
    isSearchingServer,
    recentlyViewedFonts,
    saveRecentFont,
    removeSingleRecentFont,
    clearRecentFonts,
    filterFonts,
    runServerSearch,
  } = useFontSearch(customFonts, customNewFonts);

  const { filters, toggleLicense, toggleSource, clearAll: clearFilterState, hasActiveFilters } = useSearchFilters();
  const { recents: recentSearches, addRecent: addRecentSearch, removeRecent: removeRecentSearch, clearRecents: clearRecentSearches } = useSearchHistory();

  const close = useCallback(() => setOpen(false), [setOpen]);

  useSearchKeyboard({
    open,
    onOpen: () => setOpen(true),
    onClose: close,
  });

  // ── Auto-focus ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
    } else {
      setActiveIndex(null);
      setShowSettings(false);
    }
  }, [open]);

  useEffect(() => { setActiveIndex(null); }, [query, chips]);

  useEffect(() => {
    if (activeIndex !== null && cardRefs.current[activeIndex]) {
      cardRefs.current[activeIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [activeIndex]);

  // ── Body scroll lock ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    stopLenis();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; startLenis(); };
  }, [open]);

  // ── Panel direction ───────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!open) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const goBelow = side === "top" ? false : side === "bottom" ? true : spaceBelow > rect.top;
    setPlaced(goBelow ? "bottom" : "top");
    setPanelPos(goBelow
      ? { top: rect.bottom + 10 }
      : { bottom: window.innerHeight - rect.top + 10 },
    );
  }, [open, side]);

  useLayoutEffect(() => {
    if (rootRef.current) setRtl(getComputedStyle(rootRef.current).direction === "rtl");
  }, []);

  // The flyout is rendered with createPortal(), so it is outside rootRef in the DOM.
  // Treat both the search bar and the portaled panel as inside when dismissing.
  useEffect(() => {
    if (!open) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [open, close]);

  // ── Panel open/close animation (pure CSS transitions, no GSAP needed) ────
  // Handled via CSS classes + will-change: transform, opacity

  // ── Chip scroll ──────────────────────────────────────────────────────────
  const chipCountRef = useRef(chips.length);
  useEffect(() => {
    const row = chipsRef.current;
    const added = chips.length > chipCountRef.current;
    chipCountRef.current = chips.length;
    if (!row || !added || row.scrollWidth <= row.clientWidth) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollTo({ left: rtl ? -row.scrollWidth : row.scrollWidth, behavior: prefersReduced ? "auto" : "smooth" });
  }, [chips.length, rtl]);

  // ── Tag/mood counts ───────────────────────────────────────────────────────
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const font of allFonts) {
      if (font.category) { const c = font.category.toLowerCase(); counts[c] = (counts[c] || 0) + 1; }
      for (const t of font.tags ?? []) { if (typeof t === "string") { const tag = t.toLowerCase(); counts[tag] = (counts[tag] || 0) + 1; } }
    }
    return counts;
  }, [allFonts]);

  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const mood of MOODS) {
      const targets = [mood.slug, ...(mood.preferredCategories || []), ...(mood.contextCategories || [])].map((s) => s.toLowerCase());
      counts[mood.id] = Math.max(allFonts.filter((f) => {
        const cat = (f.category || "").toLowerCase();
        const tags = (f.tags || []).map((t) => t.toLowerCase());
        return targets.some((t) => cat.includes(t) || tags.includes(t));
      }).length, 6);
    }
    return counts;
  }, [allFonts]);

  // ── Live server search trigger ────────────────────────────────────────────
  useEffect(() => {
    const cleanup = runServerSearch(query, chips);
    return cleanup;
  }, [query, chips, runServerSearch]);

  // ── Matching fonts ────────────────────────────────────────────────────────
  const trimmed = deferredQuery.trim().toLowerCase();

  const matchingFonts = useMemo(() => {
    if (!trimmed && chips.length === 0 && !hasActiveFilters) return [];
    return filterFonts(query, chips, filters);
  }, [trimmed, chips, filters, hasActiveFilters, filterFonts, query]);

  // ── Matching designers ────────────────────────────────────────────────────
  const matchingDesigners = useMemo(() => {
    if (!trimmed || trimmed.length < 2) return [];
    const cleanQ = normalizeSearchText(trimmed);
    const seen = new Set<string>();
    return indexedFonts
      .filter((item) => item.designer && (item.designerLower.includes(trimmed) || item.cleanDesigner.includes(cleanQ)))
      .reduce((acc, item) => {
        if (!seen.has(item.designer)) {
          seen.add(item.designer);
          acc.push(item);
        }
        return acc;
      }, [] as typeof indexedFonts)
      .slice(0, MAX_DESIGNER_RESULTS)
      .map((item) => item.designer);
  }, [trimmed, indexedFonts]);

  // ── All designers grouped ─────────────────────────────────────────────────
  const allDesignerGroups = useMemo(
    () => groupByDesigner(trimmed || chips.length > 0 ? matchingFonts : allFonts).slice(0, 8),
    [trimmed, chips.length, matchingFonts, allFonts],
  );

  // ── Suggestions ───────────────────────────────────────────────────────────
  const suggestions = useMemo(() => {
    if (!trimmed) return [];
    const cleanQ = normalizeSearchText(trimmed);
    const pool = [...POPULAR_TAGS.map((t) => t.id), ...MOODS.map((m) => m.slug)];
    return Array.from(new Set(pool))
      .filter((term) => {
        const tl = term.toLowerCase();
        return (tl.includes(trimmed) || normalizeSearchText(tl).includes(cleanQ)) && !chips.some((c) => sameTerm(c, term));
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [trimmed, chips]);

  // ── Chip helpers ──────────────────────────────────────────────────────────
  const full = maxChips !== undefined && chips.length >= maxChips;
  const announce = useCallback((text: string) => setAnnouncement((a) => ({ text, count: a.count + 1 })), []);

  const addChip = useCallback((term: string) => {
    const value = normalize ? normalize(term) : term.trim();
    if (!value) return;
    if (chips.some((c) => sameTerm(c, value))) return;
    if (full) { announce(`Up to ${maxChips} filters`); return; }
    setChips([...chips, value]);
    announce(`Added filter ${getChipLabel(value)}`);
    if (query) setQuery("");
  }, [chips, full, maxChips, normalize, query, setChips, setQuery, announce]);

  const removeChip = useCallback((term: string) => {
    setChips(chips.filter((c) => !sameTerm(c, term)));
    announce(`Removed filter ${getChipLabel(term)}`);
    inputRef.current?.focus({ preventScroll: true });
  }, [chips, setChips, announce]);

  const toggleChip = useCallback((term: string, altTerm?: string) => {
    const existing = chips.find((c) => sameTerm(c, term) || (altTerm && sameTerm(c, altTerm)));
    if (existing) removeChip(existing); else addChip(term);
  }, [chips, addChip, removeChip]);

  const clearAllFilters = useCallback(() => {
    setChips([]);
    clearFilterState();
    announce("Cleared all filters");
  }, [setChips, clearFilterState, announce]);

  // ── Displayed fonts ───────────────────────────────────────────────────────
  const displayedFonts = useMemo(() => {
    if (trimmed || chips.length > 0 || hasActiveFilters) return matchingFonts;
    if (recentlyViewedFonts.length > 0) return recentlyViewedFonts;
    return newAddedFonts;
  }, [trimmed, chips.length, hasActiveFilters, matchingFonts, recentlyViewedFonts, newAddedFonts]);

  // ── Keyboard handler ──────────────────────────────────────────────────────
  const chipsLatest = useRef(chips);
  useLayoutEffect(() => { chipsLatest.current = chips; });

  const marked = markedChip !== null && chips.includes(markedChip) ? markedChip : null;
  if (markedChip !== null && marked === null) setMarkedChip(null);

  const stepMark = (dir: 1 | -1) =>
    setMarkedChip((cur) => {
      const list = chipsLatest.current;
      if (list.length === 0) return null;
      const at = cur === null ? list.length : list.indexOf(cur);
      const next = at + dir;
      if (next >= list.length) return null;
      return list[Math.max(next, 0)];
    });

  const handleFontSelect = useCallback((font: Font) => {
    saveRecentFont(font);
    onSelectFont?.(font);
    if (navigateOnSelect) navigate(`/fonts/${font.slug}`);
    close();
  }, [saveRecentFont, onSelectFont, navigateOnSelect, navigate, close]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    const field = e.currentTarget;
    const atStart = field.selectionStart === 0 && field.selectionEnd === 0;
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const fwd = rtl ? "ArrowLeft" : "ArrowRight";

    if (e.key === "ArrowDown" && displayedFonts.length > 0) {
      e.preventDefault();
      setActiveIndex((p) => (p === null ? 0 : Math.min(p + 1, displayedFonts.length - 1)));
      return;
    }
    if (e.key === "ArrowUp" && activeIndex !== null) {
      e.preventDefault();
      if (activeIndex <= 0) { setActiveIndex(null); inputRef.current?.focus({ preventScroll: true }); }
      else setActiveIndex((p) => (p !== null ? p - 1 : null));
      return;
    }
    if (activeIndex !== null) {
      if (e.key === fwd) { e.preventDefault(); setActiveIndex((p) => p !== null ? Math.min(p + 1, displayedFonts.length - 1) : 0); return; }
      if (e.key === back) { e.preventDefault(); setActiveIndex((p) => p !== null ? Math.max(p - 1, 0) : 0); return; }
      if (e.key === "Enter") { e.preventDefault(); if (displayedFonts[activeIndex]) handleFontSelect(displayedFonts[activeIndex]); return; }
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setActiveIndex(null); return; }
    }
    if (marked !== null) {
      if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); setMarkedChip(null); removeChip(marked); return; }
      if (e.key === back || e.key === fwd) { e.preventDefault(); stepMark(e.key === back ? -1 : 1); return; }
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setMarkedChip(null); return; }
      setMarkedChip(null);
    }
    if (e.key === "Escape") {
      e.preventDefault(); e.stopPropagation();
      if (showSettings) { setShowSettings(false); return; }
      if (query !== "") { setQuery(""); return; }
      close(); return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (trimmed) {
        const directFont = matchingFonts.find((f) => f.name.toLowerCase() === trimmed || f.slug.toLowerCase() === trimmed);
        if (directFont) {
          handleFontSelect(directFont);
        } else {
          addRecentSearch(query.trim());
          addChip(query.trim());
          if (navigateOnSelect && window.location.pathname !== "/fonts") {
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
    if (e.key === "Backspace" && atStart && chips.length > 0) {
      e.preventDefault();
      const last = chips[chips.length - 1];
      setMarkedChip(last);
      announce(`${getChipLabel(last)} selected. Press Backspace again to remove.`);
      return;
    }
    if (e.key === back && atStart && chips.length > 0) { e.preventDefault(); stepMark(-1); }
  };

  const focusField = (e: ReactPointerEvent) => {
    if (disabled) return;
    const isInteractive = (e.target as Element).closest("button, input, a");
    if (isInteractive) return;
    e.preventDefault();
    setOpen(true);
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 10);
  };

  const below = placed === "bottom";
  const panelOpen = open;

  // ── Panel content ─────────────────────────────────────────────────────────
  const showingResults = !!(trimmed || chips.length > 0 || hasActiveFilters);

  const panelContent = (
    <div className="flex flex-col gap-4 p-2.5 sm:p-3 text-white">
      {/* Search category tabs */}
      {showingResults && (
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {SEARCH_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSearchCategory(cat.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-150",
                searchCategory === cat.id
                  ? "bg-white/12 text-white ring-1 ring-white/20"
                  : "text-white/40 hover:text-white/70",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Settings panel or filter+results */}
      {showSettings ? (
        <SearchSettings onClose={() => { setShowSettings(false); close(); }} />
      ) : (
        <>
          {/* Filter chips row */}
          <FilterChipRow
            activeTab={filterTab}
            setActiveTab={setFilterTab}
            chips={chips}
            onToggleTag={(id, label) => { toggleChip(id, label); onSelectTag?.(label); }}
            onToggleMood={(m) => { toggleChip(m.slug, m.name); onSelectMood?.(m); }}
            onToggleLicense={toggleLicense}
            onToggleSource={toggleSource}
            licenseFilters={filters.license}
            sourceFilters={filters.source}
            tagCounts={tagCounts}
            moodCounts={moodCounts}
            onClearAll={clearAllFilters}
            hasChips={chips.length > 0}
          />

          {/* Results or default state */}
          {showingResults ? (
            <div className="flex flex-col gap-3">
              {/* Header row */}
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-semibold tracking-widest text-white/40 uppercase flex items-center gap-1.5">
                  {searchCategory === "fonts" && <><Sparkles className="size-3 text-white/30" /> Fonts ({matchingFonts.length})</>}
                  {searchCategory === "designers" && <><Users className="size-3 text-white/30" /> Designers ({allDesignerGroups.length})</>}
                  {searchCategory === "foundries" && <><Building2 className="size-3 text-white/30" /> Foundries ({allDesignerGroups.length})</>}
                  {isSearchingServer && <LoaderCircle className="size-3 animate-spin text-white/40 ml-0.5" />}
                </span>
                {matchingFonts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (query.trim()) params.set("query", query.trim());
                      if (chips.length > 0) params.set("categories", chips.join(","));
                      navigate(`/fonts?${params.toString()}`);
                      close();
                    }}
                    className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    View all <ArrowRight className="size-3" />
                  </button>
                )}
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && searchCategory === "fonts" && (
                <div className="flex items-center gap-1.5 flex-wrap px-0.5">
                  <span className="text-[11px] text-white/30">Suggested:</span>
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); addChip(sug); }}
                      className="rounded-full bg-white/5 hover:bg-white/10 px-2.5 py-0.5 text-[11px] text-white/70 transition-colors cursor-pointer"
                    >
                      + {getChipLabel(sug)}
                    </button>
                  ))}
                </div>
              )}

              {/* Inline designers strip (shown in fonts category) */}
              {matchingDesigners.length > 0 && searchCategory === "fonts" && (
                <div className="flex items-center gap-2 flex-wrap px-0.5">
                  <span className="text-[10px] text-white/35 uppercase tracking-widest font-semibold shrink-0">
                    <Building2 className="size-2.5 inline mr-0.5" />Designers
                  </span>
                  {matchingDesigners.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => { navigate(`/designers/${encodeURIComponent(d)}`); close(); }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-[11px] text-white/80 hover:text-white transition-all cursor-pointer group"
                    >
                      <User className="size-2.5 text-white/35 group-hover:text-white/60" />
                      {d}
                      <ArrowRight className="size-2.5 text-white/25 group-hover:text-white/50" />
                    </button>
                  ))}
                </div>
              )}

              {/* Font results */}
              {searchCategory === "fonts" && (
                matchingFonts.length > 0 ? (
                  <div className="relative -mx-2 px-2" style={{ maskImage: "linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)" }}>
                    <div className="flex items-start gap-3 overflow-x-auto py-1 scrollbar-none">
                      {matchingFonts.map((font, idx) => (
                        <FontThumbnailCard
                          key={font.id}
                          font={font}
                          isActive={activeIndex === idx}
                          cardRef={(el) => { cardRefs.current[idx] = el; }}
                          onClick={() => handleFontSelect(font)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center rounded-2xl bg-white/2">
                    <Search className="size-7 text-white/15 mb-2" />
                    <p className="text-sm font-medium text-white/60">
                      {query ? `No fonts for "${query}"` : "No fonts match these filters"}
                    </p>
                    <p className="text-[11px] text-white/30 mt-1">Try sans, serif, cyberpunk, or clear filters</p>
                  </div>
                )
              )}

              {/* Designer / Foundry results */}
              {(searchCategory === "designers" || searchCategory === "foundries") && (
                <div className="flex flex-col gap-1.5">
                  {allDesignerGroups.length > 0 ? (
                    allDesignerGroups.map((g) => (
                      <DesignerRow
                        key={g.name}
                        name={g.name}
                        fontCount={g.fontCount}
                        onClick={() => { navigate(`/designers/${encodeURIComponent(g.name)}`); close(); }}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center rounded-2xl bg-white/2">
                      <Users className="size-7 text-white/15 mb-2" />
                      <p className="text-sm text-white/60">No designers found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Default / empty state */
            <div className="flex flex-col gap-4">
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[10px] font-semibold tracking-widest text-white/35 uppercase flex items-center gap-1.5">
                      <Clock className="size-3" /> Recent Searches
                    </span>
                    <button type="button" onClick={clearRecentSearches} className="text-[11px] text-white/30 hover:text-white/60 transition-colors">Clear</button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {recentSearches.slice(0, 6).map((term) => (
                      <div key={term} className="group flex items-center gap-0.5 rounded-full bg-white/6 hover:bg-white/10 transition-colors">
                        <button
                          type="button"
                          onClick={() => { setQuery(term); setOpen(true); inputRef.current?.focus({ preventScroll: true }); }}
                          className="pl-3 pr-1.5 py-1 text-[11px] text-white/65 hover:text-white transition-colors cursor-pointer"
                        >
                          {term}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRecentSearch(term)}
                          className="pr-2 py-1 text-white/25 hover:text-white/60 transition-colors"
                        >
                          <X className="size-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recently viewed fonts */}
              {recentlyViewedFonts.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[10px] font-semibold tracking-widest text-white/35 uppercase flex items-center gap-1.5">
                      <Clock className="size-3" /> Recently Viewed
                    </span>
                    <button type="button" onClick={clearRecentFonts} className="text-[11px] text-white/30 hover:text-white/60 transition-colors">Clear</button>
                  </div>
                  <div className="relative -mx-2 px-2" style={{ maskImage: "linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)" }}>
                    <div className="flex items-start gap-3 overflow-x-auto py-1 scrollbar-none">
                      {recentlyViewedFonts.map((font, idx) => (
                        <FontThumbnailCard
                          key={`recent-${font.id}`}
                          font={font}
                          isRecent
                          isActive={activeIndex === idx}
                          cardRef={(el) => { cardRefs.current[idx] = el; }}
                          onRemoveRecent={() => removeSingleRecentFont(font.id)}
                          onClick={() => handleFontSelect(font)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* New / trending fonts */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] font-semibold tracking-widest text-white/35 uppercase flex items-center gap-1.5">
                    <TrendingUp className="size-3" /> {recentlyViewedFonts.length > 0 ? "New Fonts" : "Discover"}
                  </span>
                  <button
                    type="button"
                    onClick={() => { navigate("/fonts"); close(); }}
                    className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors"
                  >
                    Explore all <ArrowRight className="size-3" />
                  </button>
                </div>
                <div className="relative -mx-2 px-2" style={{ maskImage: "linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)" }}>
                  <div className="flex items-start gap-3 overflow-x-auto py-1 scrollbar-none">
                    {newAddedFonts.map((font, idx) => {
                      const isPrimary = recentlyViewedFonts.length === 0;
                      return (
                        <FontThumbnailCard
                          key={`new-${font.id}`}
                          font={font}
                          isActive={isPrimary && activeIndex === idx}
                          cardRef={(el) => { if (isPrimary) cardRefs.current[idx] = el; }}
                          onClick={() => handleFontSelect(font)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading indicator */}
      {(loading || isFetchingDb) && (
        <div className="flex items-center justify-center gap-2 py-2 text-[11px] text-white/35">
          <LoaderCircle className="size-3.5 animate-spin" />
          Loading typefaces…
        </div>
      )}
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex justify-center font-inter min-w-0 max-w-full",
        // h-10 always on mobile (matches navbar buttons), h-14 on desktop (or h-10 for compact)
        isCompact ? "h-10" : "h-10 md:h-14",
        disabled && "opacity-60",
        className,
      )}
    >
      {/* Backdrop */}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            onPointerDown={(e) => { e.preventDefault(); close(); }}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
            aria-hidden="true"
            style={{
              position: "fixed", inset: 0, zIndex: 40,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
              cursor: "pointer",
              opacity: panelOpen ? 1 : 0,
              pointerEvents: panelOpen ? "auto" : "none",
              transition: "opacity 200ms cubic-bezier(0.16,1,0.3,1)",
            }}
          />,
          document.body,
        )}

      {/* Flyout panel */}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              borderRadius: surfaceRadius,
              zIndex: 50,
              position: "fixed",
              left: "50%",
              width: "min(calc(100vw - 20px), 600px)",
              transform: panelOpen
                ? "translateX(-50%) translateY(0) scale(1)"
                : below
                ? "translateX(-50%) translateY(-10px) scale(0.98)"
                : "translateX(-50%) translateY(10px) scale(0.98)",
              opacity: panelOpen ? 1 : 0,
              pointerEvents: panelOpen ? "auto" : "none",
              transition: panelOpen
                ? "opacity 200ms cubic-bezier(0.16,1,0.3,1), transform 200ms cubic-bezier(0.16,1,0.3,1)"
                : "opacity 140ms cubic-bezier(0.4,0,1,1), transform 140ms cubic-bezier(0.4,0,1,1)",
              willChange: "opacity, transform",
              ...panelPos,
            }}
            className={cn("overflow-hidden", PANEL_GLASS)}
          >
            <div className="max-h-[75vh] sm:max-h-[80vh] overflow-y-auto scrollbar-none">
              {panelContent}
            </div>
          </div>,
          document.body,
        )}

      {/* Search bar */}
      <div
        onPointerDown={focusField}
        style={{
          borderRadius: open ? surfaceRadius : COMPACT_RADIUS,
          transition: [
            "border-radius 300ms cubic-bezier(0.16,1,0.3,1)",
            "box-shadow 200ms cubic-bezier(0.16,1,0.3,1)",
          ].join(", "),
          width: "100%",
          minWidth: 0,
        }}
        className={cn(
          "relative z-40 flex min-w-0 items-center max-w-full overflow-hidden",
          // Height: always h-10 on mobile, h-14 on desktop (h-10 for compact)
          isCompact ? "h-10" : "h-10 md:h-14",
          // Padding & gap: no padding on mobile when closed (icon-only), full padding otherwise
          !open
            ? "gap-0 justify-center md:gap-2 md:justify-start md:ps-4 md:pe-4"
            : "gap-1.5 sm:gap-2 ps-3 sm:ps-4 pe-2.5 sm:pe-4",
          BAR_GLASS,
          disabled ? "cursor-not-allowed" : "cursor-text",
          open ? "ring-1 ring-white/20" : "hover:ring-1 hover:ring-white/10",
        )}
      >
        {/* Search / loading icon */}
        {loading || isFetchingDb || isSearchingServer ? (
          <LoaderCircle aria-hidden className={cn("shrink-0 text-white/40 animate-spin transition-all duration-300", "size-5")} />
        ) : (
          <Search
            aria-hidden
            onClick={() => { if (!open) setOpen(true); }}
            className="shrink-0 text-white/40 transition-all duration-300 cursor-pointer hover:text-white/70 size-5"
          />
        )}

        {/* Chips + Input — hidden on mobile when collapsed, always shown on desktop */}
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden",
            // On mobile (< md), hide unless open; on desktop always visible
            open ? "flex" : "hidden md:flex",
          )}
          style={{
            transition: "opacity 250ms cubic-bezier(0.16,1,0.3,1)",
            opacity: open ? 1 : 0.85,
          }}
        >
          {/* Chips */}
          <div
            ref={chipsRef}
            className={cn(
              "relative flex min-w-0 shrink items-center gap-1 overflow-x-auto scrollbar-none",
              chips.length > 0 && "-mx-1 px-1.5",
            )}
            style={chips.length > 0 ? { maskImage: "linear-gradient(to right, transparent, black 6px, black calc(100% - 6px), transparent)" } : undefined}
          >
            {chips.map((chip) => {
              const chipLabel = getChipLabel(chip);
              return (
                <span
                  key={chip}
                  style={{ transformOrigin: rtl ? "right center" : "left center" }}
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-full text-white select-none",
                    "transition-all duration-150",
                    isCompact ? "h-6 ps-2.5 pe-1 text-[11px]" : "h-7 ps-3 pe-1 text-xs",
                    marked === chip
                      ? "bg-red-500/20 text-red-200 ring-1 ring-red-400/60"
                      : "bg-white/10 text-white hover:bg-white/14",
                  )}
                >
                  <span className="max-w-20 sm:max-w-32 truncate" title={chipLabel}>{chipLabel}</span>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`Remove filter ${chipLabel}`}
                    onClick={(e) => { e.stopPropagation(); removeChip(chip); }}
                    className="grid size-4 shrink-0 place-items-center rounded-full text-white/50 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                  >
                    <X aria-hidden className="size-2.5" />
                  </button>
                </span>
              );
            })}
          </div>

          {/* Input */}
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
            placeholder={chips.length > 0 ? (open ? "Filter…" : "") : placeholder}
            onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className={cn(
              "bg-transparent text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed text-ellipsis flex-1 min-w-0",
              isCompact ? "h-7 text-xs" : "h-9 text-sm",
            )}
          />
        </div>

        {/* Clear query */}
        {query && (
          <button
            type="button"
            title="Clear"
            onClick={(e) => { e.stopPropagation(); setQuery(""); inputRef.current?.focus({ preventScroll: true }); }}
            className="grid size-6 shrink-0 place-items-center rounded-full text-white/35 hover:text-white hover:bg-white/8 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        )}

        {/* Mobile cancel */}
        {open && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="md:hidden text-xs text-white/60 hover:text-white px-2 py-1 shrink-0 font-medium transition-colors"
          >
            Cancel
          </button>
        )}

        {/* Settings button */}
        {open && (
          <button
            type="button"
            title="Settings & navigation"
            onClick={(e) => { e.stopPropagation(); setShowSettings((s) => !s); }}
            className={cn(
              "grid shrink-0 place-items-center rounded-full transition-all duration-150",
              isCompact ? "size-6" : "size-7",
              showSettings
                ? "bg-white/20 text-white ring-1 ring-white/30"
                : "text-white/40 hover:text-white hover:bg-white/8",
            )}
          >
            <Settings className={isCompact ? "size-3.5" : "size-4"} />
          </button>
        )}

        {/* Keyboard shortcut badge (idle state) */}
        {!open && chips.length === 0 && !query && (
          <span
            aria-hidden
            className="hidden md:inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono tracking-wider text-white/35 select-none shrink-0"
          >
            {typeof navigator !== "undefined" && /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent) ? "⌘K" : "Ctrl K"}
          </span>
        )}

        {/* Trailing actions */}
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>

      {/* Hidden form inputs */}
      {name ? chips.map((chip) => <input key={chip} type="hidden" name={name} value={chip} />) : null}

      {/* Accessible live region */}
      <span aria-live="polite" className="sr-only">
        {announcement.text}{announcement.count % 2 ? " " : ""}
      </span>
    </div>
  );
}

export default MorphingSearchChips;
