export interface DocItem {
  title: string;
  slug: string; // e.g. "cli/installation" or "introduction"
  description: string;
  badge?: string;
  keywords?: string[];
}

export interface DocCategory {
  title: string;
  items: DocItem[];
}

export const DOCS_NAVIGATION: DocCategory[] = [
  {
    title: 'Getting Started',
    items: [
      {
        title: 'Introduction',
        slug: 'introduction',
        description: 'Overview of NoBadFonts, core mission, and feature summary.',
        keywords: ['intro', 'welcome', 'start', 'overview'],
      },
      {
        title: 'Philosophy',
        slug: 'philosophy',
        description: 'Why curation beats quantity and how fonts are selected.',
        keywords: ['curation', 'principles', 'standards', 'philosophy'],
      },
    ],
  },
  {
    title: 'CLI Companion',
    items: [
      {
        title: 'Installation',
        slug: 'cli/installation',
        description: 'Install and authenticate nobadfonts-cli on Mac, Linux, or Windows.',
        badge: 'v1.0',
        keywords: ['terminal', 'npm', 'pnpm', 'cli', 'install'],
      },
      {
        title: 'Commands Reference',
        slug: 'cli/commands',
        description: 'Full reference of CLI commands: search, pair, inspect, and download.',
        keywords: ['commands', 'cli', 'search', 'download', 'pair'],
      },
      {
        title: 'Configuration',
        slug: 'cli/configuration',
        description: 'Configuring API keys, local cache directories, and export targets.',
        keywords: ['config', 'settings', 'cache', 'keys'],
      },
    ],
  },
  {
    title: 'NoBadFonts MCP',
    items: [
      {
        title: 'Overview',
        slug: 'mcp/overview',
        description: 'Connect AI agents (Cursor, Claude, Antigravity) to the curated font index.',
        badge: 'AI',
        keywords: ['mcp', 'agent', 'model context protocol', 'ai', 'cursor'],
      },
      {
        title: 'Setup & Connection',
        slug: 'mcp/setup',
        description: 'Step-by-step setup in Cursor, Claude Desktop, and custom MCP clients.',
        keywords: ['mcp', 'setup', 'claude', 'cursor', 'config'],
      },
      {
        title: 'Tool Reference',
        slug: 'mcp/tool-reference',
        description: 'Available MCP tools: query_fonts, recommend_pairings, get_font_css.',
        keywords: ['tools', 'mcp tools', 'schema', 'api'],
      },
    ],
  },
  {
    title: 'Typography Guides',
    items: [
      {
        title: 'Font Pairing Guide',
        slug: 'guides/font-pairing',
        description: 'Formulas and principles for pairing display and body typefaces.',
        keywords: ['pairing', 'serif', 'sans', 'contrast', 'scale'],
      },
      {
        title: 'Licensing Guide',
        slug: 'guides/licensing',
        description: 'Plain-English guide to SIL Open Font License, web vs. desktop, and commercial rights.',
        keywords: ['license', 'ofl', 'commercial', 'free', 'copyright'],
      },
    ],
  },
  {
    title: 'Community & Open Source',
    items: [
      {
        title: 'Curation Standards',
        slug: 'contributing/curation',
        description: 'How fonts are evaluated and accepted into NoBadFonts.',
        keywords: ['curation', 'submissions', 'quality', 'standards'],
      },
      {
        title: 'Self-Hosting',
        slug: 'contributing/self-hosting',
        description: 'Run your own instance of NoBadFonts with Supabase and Vite.',
        keywords: ['docker', 'supabase', 'self-host', 'deploy'],
      },
    ],
  },
];

/**
 * Returns all doc items in a flat array for search and index lookups
 */
export function getAllDocItems(): (DocItem & { category: string })[] {
  return DOCS_NAVIGATION.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      category: category.title,
    }))
  );
}

/**
 * Find previous and next doc pages for bottom pagination
 */
export function getPrevNextDoc(currentSlug: string): {
  prev: DocItem | null;
  next: DocItem | null;
} {
  const allItems = DOCS_NAVIGATION.flatMap((c) => c.items);
  const cleanSlug = currentSlug.replace(/^\/+|\/+$/g, '') || 'introduction';
  const currentIndex = allItems.findIndex((item) => item.slug === cleanSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? allItems[currentIndex - 1] : null,
    next: currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null,
  };
}

/**
 * Find doc item metadata by slug
 */
export function getDocItemBySlug(slug: string): (DocItem & { category: string }) | undefined {
  const cleanSlug = slug.replace(/^\/+|\/+$/g, '') || 'introduction';
  return getAllDocItems().find((item) => item.slug === cleanSlug);
}
