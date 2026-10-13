"use client";

import {
  Clock,
  LoaderCircle,
  Search,
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
} from "motion/react";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { EASE_OUT, SPRING_LAYOUT, SPRING_SWAP } from "@/lib/ease";
import { useDismiss } from "@/lib/hooks/use-dismiss";
import { useOnOpen } from "@/lib/hooks/use-on-open";
import { PresenceGate } from "@/lib/presence-gate";
import { cn } from "@/lib/utils";
import { MOODS, type MoodDefinition } from "@/config/moods";
import { supabase } from "@/lib/supabase";
import type { Font } from "@/types/font";
import { stopLenis, startLenis } from "@/hooks/useLenis";

// Spring physics matching modern luxury design tokens
const SPRING_MORPH = { type: "spring", stiffness: 520, damping: 40, mass: 0.1 } as const;
const MORPH_ENTER: Transition = { ...SPRING_MORPH, opacity: { duration: 0.22 } };
const MORPH_EXIT: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 40,
  mass: 0.1,
  opacity: { duration: 0.22, delay: 0.08 },
};

const SEED = { width: 365, height: 44 };
const SEED_TUCK = 24;
const CONTENT_IN: Transition = { duration: 0.18, ease: EASE_OUT, delay: 0.01 };
const CONTENT_OUT: Transition = { duration: 0.08, ease: EASE_OUT };

// Dark luxury surface styling matching the reference screenshots
const PANEL_GLASS =
  "bg-[#141416]/95 backdrop-blur-[24px] backdrop-saturate-[1.8] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_24px_60px_-20px_rgba(0,0,0,0.7)] text-white";
const BAR_GLASS =
  "bg-[#161618] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_32px_-12px_rgba(0,0,0,0.5)] text-white";

const CHIP_HIDDEN = { opacity: 0, scale: 0.9, filter: "blur(4px)" };
const CHIP_SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };
const CHIP_ENTER: Transition = {
  ...SPRING_SWAP,
  opacity: { duration: 0.16 },
  filter: { duration: 0.2 },
};
const CHIP_EXIT: Transition = { duration: 0.14, ease: EASE_OUT };
const SURFACE_RADIUS = 28;
const PANEL_ROOM = 360;

// Curated default tags for typography search with initial count weights
const POPULAR_TAGS = [
  { id: "sans", label: "Sans", defaultCount: 48 },
  { id: "serif", label: "Serif", defaultCount: 36 },
  { id: "display", label: "Display", defaultCount: 52 },
  { id: "script", label: "Script", defaultCount: 26 },
  { id: "monospace", label: "Mono", defaultCount: 18 },
  { id: "cyberpunk", label: "Cyberpunk", defaultCount: 14 },
  { id: "retro", label: "Retro", defaultCount: 22 },
  { id: "y2k", label: "Y2K", defaultCount: 16 },
  { id: "minimal", label: "Minimal", defaultCount: 24 },
  { id: "wedding", label: "Wedding", defaultCount: 12 },
  { id: "luxury", label: "Luxury", defaultCount: 15 },
  { id: "editorial", label: "Editorial", defaultCount: 28 },
  { id: "sci-fi", label: "Sci-Fi", defaultCount: 14 },
  { id: "brutalist", label: "Brutalist", defaultCount: 12 },
  { id: "modern", label: "Modern", defaultCount: 38 },
  { id: "playful", label: "Playful", defaultCount: 17 },
  { id: "geometric", label: "Geometric", defaultCount: 29 },
  { id: "bold", label: "Bold", defaultCount: 32 },
];

// Rich fallback fonts with specimen banners so the component is instantly visually stunning
const FALLBACK_FONTS: Font[] = [
  {
    id: "f-clash-display",
    name: "Clash Display",
    slug: "clash-display",
    designer: "Indian Type Foundry",
    category: "display",
    tags: ["display", "bold", "modern", "headline", "poster", "geometric"],
    preview_image_url: "/moods/cards/editorial-card.png",
    gallery_images: ["/moods/cards/editorial-card.png"],
    downloads: 14200,
    is_featured: true,
    is_trending: true,
    created_at: new Date().toISOString(),
    family_role: "standalone",
    parent_font_id: null,
    commercial_use: true,
    license_type: "OFL",
    description: "A modern, bold display sans with personality and geometric character.",
    downloads_7d: 120,
    favorites_count: 530,
    file_size_woff2: 24000,
    file_size_ttf: null,
    file_size_otf: null,
    file_size_woff: null,
    font_file_hash: null,
    glyph_count: 420,
    has_italic: false,
    is_editors_pick: true,
    is_published: true,
    research_status: null,
    github_url: null,
    weights: [400, 500, 600, 700],
    woff2_url: null,
    woff_url: null,
    ttf_url: null,
    otf_url: null,
    zip_url: null,
    file_size_image_preview: null,
    gallery_image_sizes: null,
    uploaded_by: "system",
    og_image_url: null,
    og_image_variant_id: null,
    og_image_variant_count: null,
    og_image_variant_signature: null,
    og_image_generated_at: null,
    updated_at: null,
  },
  {
    id: "f-satoshi",
    name: "Satoshi",
    slug: "satoshi",
    designer: "Indian Type Foundry",
    category: "sans",
    tags: ["sans", "modern", "minimal", "branding", "tech", "clean"],
    preview_image_url: "/moods/cards/minimal-card.png",
    gallery_images: ["/moods/cards/minimal-card.png"],
    downloads: 28500,
    is_featured: true,
    is_trending: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    family_role: "standalone",
    parent_font_id: null,
    commercial_use: true,
    license_type: "OFL",
    description: "Versatile neo-grotesque sans-serif inspired by modern Swiss typography.",
    downloads_7d: 250,
    favorites_count: 890,
    file_size_woff2: 26000,
    file_size_ttf: null,
    file_size_otf: null,
    file_size_woff: null,
    font_file_hash: null,
    glyph_count: 500,
    has_italic: true,
    is_editors_pick: true,
    is_published: true,
    research_status: null,
    github_url: null,
    weights: [300, 400, 500, 700, 900],
    woff2_url: null,
    woff_url: null,
    ttf_url: null,
    otf_url: null,
    zip_url: null,
    file_size_image_preview: null,
    gallery_image_sizes: null,
    uploaded_by: "system",
    og_image_url: null,
    og_image_variant_id: null,
    og_image_variant_count: null,
    og_image_variant_signature: null,
    og_image_generated_at: null,
    updated_at: null,
  },
  {
    id: "f-syntha",
    name: "Syntha Cyber",
    slug: "syntha-cyber",
    designer: "Neon Foundry",
    category: "techno",
    tags: ["techno", "cyberpunk", "sci-fi", "experimental", "gaming"],
    preview_image_url: "/moods/cards/cyberpunk-card.png",
    gallery_images: ["/moods/cards/cyberpunk-card.png"],
    downloads: 9800,
    is_featured: false,
    is_trending: true,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    family_role: "standalone",
    parent_font_id: null,
    commercial_use: true,
    license_type: "Free",
    description: "High-octane cyberpunk display typeface for futuristic interfaces.",
    downloads_7d: 180,
    favorites_count: 420,
    file_size_woff2: 21000,
    file_size_ttf: null,
    file_size_otf: null,
    file_size_woff: null,
    font_file_hash: null,
    glyph_count: 310,
    has_italic: false,
    is_editors_pick: false,
    is_published: true,
    research_status: null,
    github_url: null,
    weights: [400, 700],
    woff2_url: null,
    woff_url: null,
    ttf_url: null,
    otf_url: null,
    zip_url: null,
    file_size_image_preview: null,
    gallery_image_sizes: null,
    uploaded_by: "system",
    og_image_url: null,
    og_image_variant_id: null,
    og_image_variant_count: null,
    og_image_variant_signature: null,
    og_image_generated_at: null,
    updated_at: null,
  },
  {
    id: "f-cabinet-grotesk",
    name: "Cabinet Grotesk",
    slug: "cabinet-grotesk",
    designer: "Indian Type Foundry",
    category: "sans",
    tags: ["sans", "grotesk", "editorial", "bold", "modern", "brutalist"],
    preview_image_url: "/moods/cards/retro-card.png",
    gallery_images: ["/moods/cards/retro-card.png"],
    downloads: 16700,
    is_featured: true,
    is_trending: false,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    family_role: "standalone",
    parent_font_id: null,
    commercial_use: true,
    license_type: "OFL",
    description: "Eccentric sans serif with distinctive geometric quirks.",
    downloads_7d: 90,
    favorites_count: 360,
    file_size_woff2: 25000,
    file_size_ttf: null,
    file_size_otf: null,
    file_size_woff: null,
    font_file_hash: null,
    glyph_count: 460,
    has_italic: true,
    is_editors_pick: true,
    is_published: true,
    research_status: null,
    github_url: null,
    weights: [400, 700, 800],
    woff2_url: null,
    woff_url: null,
    ttf_url: null,
    otf_url: null,
    zip_url: null,
    file_size_image_preview: null,
    gallery_image_sizes: null,
    uploaded_by: "system",
    og_image_url: null,
    og_image_variant_id: null,
    og_image_variant_count: null,
    og_image_variant_signature: null,
    og_image_generated_at: null,
    updated_at: null,
  },
  {
    id: "f-amour-script",
    name: "Amour Romance",
    slug: "amour-romance",
    designer: "Atelier Paris",
    category: "script",
    tags: ["script", "wedding", "romantic", "calligraphy", "luxury", "elegant"],
    preview_image_url: "/moods/cards/wedding-card.png",
    gallery_images: ["/moods/cards/wedding-card.png"],
    downloads: 8200,
    is_featured: true,
    is_trending: false,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    family_role: "standalone",
    parent_font_id: null,
    commercial_use: true,
    license_type: "Free",
    description: "Flowing luxury script font crafted for invitations and high-end romance.",
    downloads_7d: 85,
    favorites_count: 310,
    file_size_woff2: 22000,
    file_size_ttf: null,
    file_size_otf: null,
    file_size_woff: null,
    font_file_hash: null,
    glyph_count: 340,
    has_italic: false,
    is_editors_pick: false,
    is_published: true,
    research_status: null,
    github_url: null,
    weights: [400],
    woff2_url: null,
    woff_url: null,
    ttf_url: null,
    otf_url: null,
    zip_url: null,
    file_size_image_preview: null,
    gallery_image_sizes: null,
    uploaded_by: "system",
    og_image_url: null,
    og_image_variant_id: null,
    og_image_variant_count: null,
    og_image_variant_signature: null,
    og_image_generated_at: null,
    updated_at: null,
  },
  {
    id: "f-y2k-blob",
    name: "Bubble 2000",
    slug: "bubble-2000",
    designer: "Tokyo Type Lab",
    category: "display",
    tags: ["y2k", "playful", "bubbly", "retro", "experimental"],
    preview_image_url: "/moods/cards/y2k-card.png",
    gallery_images: ["/moods/cards/y2k-card.png"],
    downloads: 11400,
    is_featured: true,
    is_trending: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    family_role: "standalone",
    parent_font_id: null,
    commercial_use: true,
    license_type: "Free",
    description: "Puffy inflatable Y2K typography with metallic aesthetics.",
    downloads_7d: 140,
    favorites_count: 480,
    file_size_woff2: 19000,
    file_size_ttf: null,
    file_size_otf: null,
    file_size_woff: null,
    font_file_hash: null,
    glyph_count: 280,
    has_italic: false,
    is_editors_pick: false,
    is_published: true,
    research_status: null,
    github_url: null,
    weights: [700],
    woff2_url: null,
    woff_url: null,
    ttf_url: null,
    otf_url: null,
    zip_url: null,
    file_size_image_preview: null,
    gallery_image_sizes: null,
    uploaded_by: "system",
    og_image_url: null,
    og_image_variant_id: null,
    og_image_variant_count: null,
    og_image_variant_signature: null,
    og_image_generated_at: null,
    updated_at: null,
  },
  {
    id: "f-stellar-orbit",
    name: "Orbit Sci-Fi",
    slug: "orbit-scifi",
    designer: "Deep Cosmos",
    category: "display",
    tags: ["sci-fi", "techno", "future", "space", "geometric"],
    preview_image_url: "/moods/cards/sci-fi-card.png",
    gallery_images: ["/moods/cards/sci-fi-card.png"],
    downloads: 7500,
    is_featured: false,
    is_trending: false,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    family_role: "standalone",
    parent_font_id: null,
    commercial_use: true,
    license_type: "OFL",
    description: "Astronautic display typeface with clean geometric cuts.",
    downloads_7d: 65,
    favorites_count: 220,
    file_size_woff2: 23000,
    file_size_ttf: null,
    file_size_otf: null,
    file_size_woff: null,
    font_file_hash: null,
    glyph_count: 360,
    has_italic: false,
    is_editors_pick: false,
    is_published: true,
    research_status: null,
    github_url: null,
    weights: [400, 700],
    woff2_url: null,
    woff_url: null,
    ttf_url: null,
    otf_url: null,
    zip_url: null,
    file_size_image_preview: null,
    gallery_image_sizes: null,
    uploaded_by: "system",
    og_image_url: null,
    og_image_variant_id: null,
    og_image_variant_count: null,
    og_image_variant_signature: null,
    og_image_generated_at: null,
    updated_at: null,
  },
  {
    id: "f-royal-serif",
    name: "Royale Serif",
    slug: "royale-serif",
    designer: "Foundry Milano",
    category: "serif",
    tags: ["serif", "luxury", "editorial", "elegant", "classic"],
    preview_image_url: "/moods/cards/luxury-card.png",
    gallery_images: ["/moods/cards/luxury-card.png"],
    downloads: 12900,
    is_featured: true,
    is_trending: false,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    family_role: "standalone",
    parent_font_id: null,
    commercial_use: true,
    license_type: "OFL",
    description: "High-contrast editorial serif built for haute couture and high luxury.",
    downloads_7d: 110,
    favorites_count: 510,
    file_size_woff2: 27000,
    file_size_ttf: null,
    file_size_otf: null,
    file_size_woff: null,
    font_file_hash: null,
    glyph_count: 480,
    has_italic: true,
    is_editors_pick: true,
    is_published: true,
    research_status: null,
    github_url: null,
    weights: [300, 400, 600],
    woff2_url: null,
    woff_url: null,
    ttf_url: null,
    otf_url: null,
    zip_url: null,
    file_size_image_preview: null,
    gallery_image_sizes: null,
    uploaded_by: "system",
    og_image_url: null,
    og_image_variant_id: null,
    og_image_variant_count: null,
    og_image_variant_signature: null,
    og_image_generated_at: null,
    updated_at: null,
  },
];

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
        const resolved = typeof next === "function" ? (next as any)(prevInternal) : next;
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

/** Single Font Specimen Thumbnail Component displaying preview image or typographic fallback */
function FontThumbnailCard({
  font,
  onClick,
  onRemoveRecent,
  isRecent = false,
}: {
  font: Font;
  onClick: () => void;
  onRemoveRecent?: () => void;
  isRecent?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl = font.preview_image_url || font.gallery_images?.[0] || font.og_image_url;

  return (
    <motion.div
      layout="position"
      whileTap={{ scale: 0.90 }}
      onClick={onClick}
      className="group relative flex w-36 sm:w-44 shrink-0 cursor-pointer flex-col select-none text-left"
    >
      {/* Thumbnail Container */}
      <div className="relative h-28 sm:h-32 w-full overflow-hidden rounded-2xl bg-[#1c1c1f] border border-white/2 transition-all duration-300 group-hover:border-white/5 group-hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.8)]">
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
        <span className="truncate text-sm font-semibold text-white/60 transition-colors group-hover:text-white">
          {font.name}
        </span>
        <span className="truncate text-[11px] text-muted transition-colors group-hover:text-white/60">
          by {(font as any).taxonomy?.creator?.foundry || (font as any).taxonomy?.creator?.publisher || font.designer || 'Unknown'}
        </span>
      </div>
    </motion.div>
  );
}

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
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  const isCompact = size === "sm";
  const surfaceRadius = isCompact ? 20 : SURFACE_RADIUS;

  const [chips, setChips] = useControllable(chipsProp, defaultChips, onChipsChange);
  const [query, setQuery] = useControllable(queryProp, defaultQuery, onQueryChange);
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

  // Search filtering logic matching font name, designer, category, tags, and moods
  const trimmed = query.trim().toLowerCase();

  const matchingFonts = useMemo<Font[]>(() => {
    let result = allFonts;

    // Filter by active chips (tags or moods)
    if (chips.length > 0) {
      result = result.filter((font) => {
        const fontCat = (font.category || "").toLowerCase();
        const fontTags = (font.tags || []).map((t) => (typeof t === "string" ? t.toLowerCase() : ""));
        const fontName = (font.name || "").toLowerCase();
        const fontDesc = (font.description || "").toLowerCase();

        return chips.some((chip) => {
          const filter = chip.toLowerCase().trim();

          // Check if filter matches a mood
          const matchedMood = MOODS.find(
            (m) =>
              sameTerm(m.id, filter) ||
              sameTerm(m.slug, filter) ||
              sameTerm(m.name, filter),
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
                fontCat.includes(k) ||
                fontTags.some((t) => t.includes(k)) ||
                fontDesc.includes(k),
            );
          }

          // Alias checking (e.g. mono / monospace)
          if (filter === "mono" || filter === "monospace") {
            return (
              fontCat.includes("mono") ||
              fontCat.includes("monospace") ||
              fontTags.some((t) => t.includes("mono") || t.includes("monospace"))
            );
          }

          // Check against known tag
          const matchedTag = POPULAR_TAGS.find(
            (t) => sameTerm(t.id, filter) || sameTerm(t.label, filter),
          );
          if (matchedTag) {
            const tagId = matchedTag.id.toLowerCase();
            const tagLabel = matchedTag.label.toLowerCase();
            return (
              fontCat.includes(tagId) ||
              fontCat.includes(tagLabel) ||
              fontTags.some((t) => t.includes(tagId) || t.includes(tagLabel)) ||
              fontName.includes(tagId) ||
              fontName.includes(tagLabel) ||
              fontDesc.includes(tagId) ||
              fontDesc.includes(tagLabel)
            );
          }

          return (
            fontCat.includes(filter) ||
            fontTags.some((t) => t.includes(filter)) ||
            fontName.includes(filter) ||
            fontDesc.includes(filter)
          );
        });
      });
    }

    // Filter by typed query
    if (trimmed) {
      result = result.filter((font) => {
        const nameMatch = (font.name || "").toLowerCase().includes(trimmed);
        const designerMatch = (font.designer || "").toLowerCase().includes(trimmed);
        const catMatch = (font.category || "").toLowerCase().includes(trimmed);
        const tagMatch = (font.tags || []).some(
          (t) => typeof t === "string" && t.toLowerCase().includes(trimmed),
        );
        return nameMatch || designerMatch || catMatch || tagMatch;
      });
    }

    return result;
  }, [allFonts, chips, trimmed]);

  // Quick suggestions based on typed query
  const matchingSuggestions = useMemo(() => {
    if (!trimmed) return [];
    const pool = [
      ...suggestions,
      ...POPULAR_TAGS.map((t) => t.id),
      ...MOODS.map((m) => m.slug),
    ];
    return Array.from(new Set(pool))
      .filter((term) => term.toLowerCase().includes(trimmed) && !chips.some((c) => sameTerm(c, term)))
      .slice(0, 6);
  }, [trimmed, suggestions, chips]);

  const announce = useCallback(
    (text: string) => setAnnouncement((current) => ({ text, count: current.count + 1 })),
    [],
  );

  const marked = markedChip !== null && chips.includes(markedChip) ? markedChip : null;
  if (markedChip !== null && marked === null) setMarkedChip(null);

  // ResizeObserver for morphing glass container
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const panelObserver = useRef<ResizeObserver | null>(null);
  const measurePanel = useCallback((node: HTMLDivElement | null) => {
    panelObserver.current?.disconnect();
    panelObserver.current = null;
    if (!node) return;
    const read = () => setPanelSize({ width: node.offsetWidth, height: node.offsetHeight });
    read();
    panelObserver.current = new ResizeObserver(read);
    panelObserver.current.observe(node);
  }, []);

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

  // Lock background scroll on the page below while search panel is open without jumping to top
  useEffect(() => {
    if (!panelOpen) return;

    // Capture the exact current scroll position so page never jumps
    const currentScrollY = window.scrollY;

    // Stop Lenis virtual scrolling
    stopLenis();

    // Prevent touch gestures outside search container
    const preventTouch = (e: TouchEvent) => {
      if (rootRef.current && rootRef.current.contains(e.target as Node)) {
        return;
      }
      e.preventDefault();
    };

    // Prevent wheel gestures outside search container
    const preventWheel = (e: WheelEvent) => {
      if (rootRef.current && rootRef.current.contains(e.target as Node)) {
        return;
      }
      e.preventDefault();
    };

    // Keep page strictly at currentScrollY if any browser event attempts to jump
    const maintainScroll = () => {
      if (window.scrollY !== currentScrollY) {
        window.scrollTo({ top: currentScrollY, behavior: "instant" });
      }
    };

    document.addEventListener("touchmove", preventTouch, { passive: false });
    document.addEventListener("wheel", preventWheel, { passive: false });
    window.addEventListener("scroll", maintainScroll, { passive: true });

    return () => {
      startLenis();
      document.removeEventListener("touchmove", preventTouch);
      document.removeEventListener("wheel", preventWheel);
      window.removeEventListener("scroll", maintainScroll);
    };
  }, [panelOpen]);

  // Track panel height floor during session
  const [panelFloor, setPanelFloor] = useState(0);
  useOnOpen(panelOpen, () => setPanelFloor(0));
  const rowsObserver = useRef<ResizeObserver | null>(null);
  const measureRows = useCallback((node: HTMLDivElement | null) => {
    rowsObserver.current?.disconnect();
    rowsObserver.current = null;
    if (!node) return;
    const read = () => setPanelFloor((floor) => Math.max(floor, node.offsetHeight + 16));
    read();
    rowsObserver.current = new ResizeObserver(read);
    rowsObserver.current.observe(node);
  }, []);

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
    row.scrollTo({ left: rtl ? -row.scrollWidth : row.scrollWidth, behavior: reduce ? "auto" : "smooth" });
  }, [chips.length, reduce, rtl]);

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

  const layout = reduce ? { duration: 0 } : SPRING_LAYOUT;
  const below = placed === "bottom";
  const seed = { ...SEED, y: below ? -SEED_TUCK : SEED_TUCK };

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
                  <motion.button
                    key={tag.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTagClick(tag.id, tag.label);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all duration-300 select-none cursor-pointer",
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
                  </motion.button>
                );
              })
              : MOODS.map((mood) => {
                const isSelected = chips.some(
                  (c) => sameTerm(c, mood.slug) || sameTerm(c, mood.id) || sameTerm(c, mood.name),
                );
                const count = moodCounts[mood.id] ?? 8;
                return (
                  <motion.button
                    key={mood.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMoodClick(mood);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 select-none cursor-pointer",
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
                  </motion.button>
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

          {matchingFonts.length > 0 ? (
            <div className="relative -mx-2 px-2 mask-[linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]">
              <div className="flex items-start gap-3.5 overflow-x-auto py-1 scrollbar-none">
                {matchingFonts.map((font) => (
                  <FontThumbnailCard
                    key={font.id}
                    font={font}
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
                  {recentlyViewedFonts.map((font) => (
                    <FontThumbnailCard
                      key={`recent-${font.id}`}
                      font={font}
                      isRecent={true}
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
                {newAddedFonts.map((font) => (
                  <FontThumbnailCard
                    key={`new-${font.id}`}
                    font={font}
                    onClick={() => handleFontSelect(font)}
                  />
                ))}
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
        "relative flex justify-center font-inter transition-all duration-300",
        open ? "w-full max-w-none md:max-w-xl" : "w-full max-w-full",
        isCompact ? "h-10" : "h-14",
        disabled && "opacity-60",
        className,
      )}
    >
      {/* Low-opacity dark backdrop covering whole screen portaled to body */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {panelOpen && (
              <motion.div
                key="screen-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  close();
                }}
                onWheel={(e) => e.preventDefault()}
                onTouchMove={(e) => e.preventDefault()}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs cursor-pointer"
                aria-hidden="true"
              />
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Morphing Expandable Flyout Panel */}
      <AnimatePresence>
        {panelOpen ? (
          <PresenceGate key="panel">
            {({ gate }) => (
              <div
                {...gate}
                className={cn(
                  "absolute inset-x-0 z-50",
                  below ? "top-full mt-2.5" : "bottom-full mb-2.5",
                )}
              >
                {/* Background Glass Plate springing into shape */}
                <motion.div
                  aria-hidden="true"
                  initial={reduce ? { opacity: 0 } : { ...seed, opacity: 0 }}
                  animate={{
                    width: panelSize.width || SEED.width,
                    height: panelSize.height || SEED.height,
                    y: 0,
                    opacity: 1,
                  }}
                  exit={
                    reduce
                      ? { opacity: 0, transition: { duration: 0.12 } }
                      : { ...seed, opacity: 0, transition: MORPH_EXIT }
                  }
                  transition={reduce ? { duration: 0 } : MORPH_ENTER}
                  style={{ borderRadius: SURFACE_RADIUS, x: "-50%" }}
                  className={cn("absolute left-1/2", below ? "top-0" : "bottom-0", PANEL_GLASS)}
                />

                {/* Content inside panel */}
                <motion.div
                  initial={{ opacity: 0, y: reduce ? 0 : below ? -6 : 6 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: reduce ? { duration: 0.15 } : CONTENT_IN,
                  }}
                  exit={{ opacity: 0, transition: CONTENT_OUT }}
                  ref={measurePanel}
                  style={{ minHeight: panelFloor || undefined }}
                  className="relative p-2 sm:p-2.5 max-w-[calc(100vw-16px)] sm:max-w-none"
                >
                  <div ref={measureRows} className="max-h-[75vh] sm:max-h-[80vh] overflow-y-auto scrollbar-none">{panelContent}</div>
                </motion.div>
              </div>
            )}
          </PresenceGate>
        ) : null}
      </AnimatePresence>

      {/* Main Pill Search Input Bar */}
      <motion.div
        layout
        transition={layout}
        onPointerDown={focusField}
        style={{ borderRadius: surfaceRadius }}
        className={cn(
          "relative z-40 flex min-w-0 items-center gap-2",
          isCompact ? "h-10 ps-3.5" : "h-14 ps-4",
          BAR_GLASS,
          disabled ? "cursor-not-allowed" : "cursor-text",
          actions ? "pe-2" : isCompact ? "pe-2.5" : "pe-4",
          open ? "w-full ring-1 ring-white/20" : "w-fit max-w-full hover:border-white/20",
        )}
      >
        {loading || isFetchingDb ? (
          <LoaderCircle aria-hidden="true" className={cn("shrink-0 text-white/50 animate-spin", isCompact ? "size-4" : "size-5")} />
        ) : (
          <Search aria-hidden="true" className={cn("shrink-0 text-white/50", isCompact ? "size-4" : "size-5")} />
        )}

        {/* Selected Morphing Filter Chips inside the bar */}
        <div
          ref={chipsRef}
          className={cn(
            "relative flex min-w-0 items-center gap-1.5 overflow-x-auto scrollbar-none",
            chips.length > 0 &&
            "-mx-1.5 px-2 mask-[linear-gradient(to_right,transparent,#000_12px,#000_calc(100%-12px),transparent)]",
          )}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {chips.map((chip) => {
              const chipLabel = getChipLabel(chip);
              return (
                <motion.span
                  key={chip}
                  layout={reduce ? false : "position"}
                  initial={reduce ? { opacity: 0 } : CHIP_HIDDEN}
                  animate={reduce ? { opacity: 1 } : CHIP_SHOWN}
                  exit={
                    reduce
                      ? { opacity: 0, transition: { duration: 0.1 } }
                      : { ...CHIP_HIDDEN, transition: CHIP_EXIT }
                  }
                  transition={reduce ? { duration: 0.12 } : CHIP_ENTER}
                  style={{ transformOrigin: rtl ? "right center" : "left center" }}
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-full text-white transition-all duration-300 select-none",
                    isCompact ? "h-6.5 ps-2.5 pe-1 text-[11px]" : "h-8 ps-3 pe-1 text-xs",
                    marked === chip
                      ? "bg-white/20"
                      : "bg-white/12",
                  )}
                >
                  <span className="max-w-32 truncate" title={chipLabel}>
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
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Search Input Field */}
        <motion.input
          ref={inputRef}
          layout={reduce ? false : "position"}
          transition={layout}
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={panelOpen}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          disabled={disabled}
          value={query}
          placeholder={chips.length > 0 ? "Filter..." : placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          style={open ? undefined : { width: `${Math.max(placeholder.length, 6) + 2}ch` }}
          className={cn(
            "min-w-24 text-ellipsis bg-transparent text-white outline-none placeholder:text-white/40 disabled:cursor-not-allowed",
            isCompact ? "h-7 text-xs sm:text-sm" : "h-9 text-sm sm:text-base",
            open && "flex-1",
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

        {/* Trailing actions */}
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </motion.div>

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
