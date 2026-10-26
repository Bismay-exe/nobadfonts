import type { Font } from '@/types/font';
import type { MoodDefinition } from '@/config/moods';

// ─── Search Categories ────────────────────────────────────────────────────────
export type SearchCategory = 'fonts' | 'designers' | 'publishers' | 'foundries';

// ─── Filter Types ─────────────────────────────────────────────────────────────
export type LicenseFilter = 'free' | 'paid' | 'personal' | 'commercial' | 'ofl';
export type SourceFilter = 'google' | 'github' | 'other';

export interface SearchFilters {
  license: LicenseFilter[];
  source: SourceFilter[];
  tags: string[];
  moods: string[];
}

// ─── Search Results ───────────────────────────────────────────────────────────
export interface DesignerResult {
  name: string;
  fontCount: number;
  fonts: Font[];
}

export interface FoundryResult {
  name: string;
  fontCount: number;
  fonts: Font[];
}

export interface PublisherResult {
  name: string;
  fontCount: number;
  fonts: Font[];
}

export interface SearchResults {
  fonts: Font[];
  designers: DesignerResult[];
  foundries: FoundryResult[];
  publishers: PublisherResult[];
  totalCount: number;
}

// ─── Indexed Font (precomputed for fast search) ───────────────────────────────
export interface IndexedFont {
  font: Font;
  nameLower: string;
  cleanName: string;
  designer: string;
  designerLower: string;
  cleanDesigner: string;
  categoryLower: string;
  cleanCategory: string;
  tagsLower: string[];
  cleanTags: string[];
  fullSearch: string;
  licenseInfo: LicenseInfo;
  sourceInfo: SourceInfo;
}

export interface LicenseInfo {
  isFree: boolean;
  isPaid: boolean;
  isPersonalUse: boolean;
  isCommercialUse: boolean;
  licenseLabel: string;
}

export interface SourceInfo {
  isGoogle: boolean;
  isGitHub: boolean;
  isOther: boolean;
}

// ─── Commands ─────────────────────────────────────────────────────────────────
export type CommandType = 'navigate' | 'action' | 'setting';

export interface SearchCommand {
  id: string;
  label: string;
  description?: string;
  icon: string; // lucide icon name
  type: CommandType;
  shortcut?: string;
  action: () => void;
}

// ─── Tab config ───────────────────────────────────────────────────────────────
export interface FilterTab {
  id: 'tags' | 'moods' | 'license' | 'source';
  label: string;
}

// ─── Mood definition re-export ────────────────────────────────────────────────
export type { MoodDefinition };
