import { MOODS } from '@/config/moods';
import { POPULAR_TAGS } from '@/config/search-fallbacks';
import type { Font } from '@/types/font';
import type { DesignerResult, FoundryResult } from './search.types';

// ─── Text normalization ───────────────────────────────────────────────────────
export const normalizeSearchText = (str: string): string =>
  str.toLowerCase().replace(/[\s\-_'".,]/g, '');

export const sameTerm = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

// ─── License detection ────────────────────────────────────────────────────────
/**
 * Derive license info from font row data.
 * Uses `license_type` and `commercial_use` columns — no new DB fields needed.
 */
export function deriveLicenseInfo(font: {
  license_type?: string | null;
  commercial_use?: boolean | null;
}) {
  const lt = (font.license_type ?? '').toLowerCase().trim();
  const hasCommercial = font.commercial_use === true;

  const isPaid =
    (lt.includes('commercial') && !hasCommercial) ||
    lt === 'paid' ||
    lt === 'proprietary' ||
    lt === 'premium';

  const isFree =
    !isPaid &&
    (lt === 'ofl' ||
      lt === 'free' ||
      lt.includes('open') ||
      lt.includes('mit') ||
      lt.includes('apache') ||
      lt.includes('public domain') ||
      lt === 'sil' ||
      lt === 'cc0');

  const isPersonalUse =
    lt.includes('personal') || lt.includes('demo') || lt === 'free personal';

  const isCommercialUse = hasCommercial || isFree;

  const licenseLabel =
    lt === 'ofl'
      ? 'OFL'
      : lt === 'free'
      ? 'Free'
      : lt === 'paid' || lt === 'proprietary'
      ? 'Paid'
      : lt === 'personal' || lt === 'free personal'
      ? 'Personal'
      : lt.toUpperCase() || 'Unknown';

  return { isFree, isPaid, isPersonalUse, isCommercialUse, licenseLabel };
}

// ─── Source detection ─────────────────────────────────────────────────────────
/**
 * Detect font source from existing link fields.
 * Uses `github_url` on the fonts row and tags/description heuristics for Google.
 * No new DB fields or migrations needed.
 */
export function deriveSourceInfo(font: {
  github_url?: string | null;
  tags?: string[] | null;
  description?: string | null;
}) {
  const isGitHub =
    !!font.github_url && font.github_url.toLowerCase().includes('github');
  const tagsStr = (font.tags ?? []).join(' ').toLowerCase();
  const desc = (font.description ?? '').toLowerCase();
  const isGoogle =
    tagsStr.includes('google') ||
    desc.includes('google fonts') ||
    desc.includes('fonts.google.com');
  const isOther = !isGitHub && !isGoogle;

  return { isGoogle, isGitHub, isOther };
}

// ─── Chip label helper ────────────────────────────────────────────────────────
export const getChipLabel = (chip: string): string => {
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

// ─── Designer / Foundry grouping ──────────────────────────────────────────────
export function groupByDesigner(fonts: Font[]): DesignerResult[] {
  const map = new Map<string, Font[]>();
  for (const font of fonts) {
    const name = font.designer?.trim();
    if (!name) continue;
    const existing = map.get(name) ?? [];
    existing.push(font);
    map.set(name, existing);
  }
  return Array.from(map.entries())
    .map(([name, fs]) => ({ name, fontCount: fs.length, fonts: fs }))
    .sort((a, b) => b.fontCount - a.fontCount);
}

export function groupByFoundry(fonts: Font[]): FoundryResult[] {
  return groupByDesigner(fonts);
}
