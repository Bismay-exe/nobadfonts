/** Central place for static search configuration and constants. */

export const SEARCH_STORAGE_KEY = 'nobadfonts_search_recents';
export const SEARCH_FONT_VIEWED_KEY = 'nobadfonts_search_viewed_fonts';
export const MAX_RECENTS = 8;
export const SEARCH_DEBOUNCE_MS = 200;
export const MAX_FONT_RESULTS = 24;
export const MAX_DESIGNER_RESULTS = 6;
export const MAX_FOUNDRY_RESULTS = 6;
export const DB_FONT_INITIAL_LIMIT = 80;
export const SERVER_SEARCH_LIMIT = 40;
export const MAX_SUGGESTIONS = 6;

export const FILTER_TABS = [
  { id: 'tags' as const, label: 'Tags' },
  { id: 'moods' as const, label: 'Moods' },
  { id: 'license' as const, label: 'License' },
  { id: 'source' as const, label: 'Source' },
];

export const LICENSE_OPTIONS = [
  { id: 'free' as const, label: 'Free', icon: '🆓' },
  { id: 'commercial' as const, label: 'Commercial', icon: '💼' },
  { id: 'personal' as const, label: 'Personal', icon: '👤' },
  { id: 'paid' as const, label: 'Paid', icon: '💳' },
  { id: 'ofl' as const, label: 'OFL', icon: '📄' },
];

export const SOURCE_OPTIONS = [
  { id: 'google' as const, label: 'Google Fonts', icon: '🌐' },
  { id: 'github' as const, label: 'GitHub', icon: '🐙' },
  { id: 'other' as const, label: 'Other', icon: '📦' },
];

export const SEARCH_CATEGORIES = [
  { id: 'fonts' as const, label: 'Fonts', shortLabel: 'Fonts' },
  { id: 'designers' as const, label: 'Designers', shortLabel: 'Designers' },
  { id: 'foundries' as const, label: 'Foundries', shortLabel: 'Foundries' },
];

// Quick-command definitions for the settings/command palette
export const COMMAND_ROUTES = [
  { id: 'browse-fonts', label: 'Browse Fonts', icon: 'Type', route: '/fonts', description: 'Explore the font catalog' },
  { id: 'font-pairing', label: 'Font Pairing', icon: 'Layers2', route: '/pairing', description: 'Find complementary font pairs' },
  { id: 'profile', label: 'My Profile', icon: 'User', route: '/profile', description: 'View your profile' },
  { id: 'bag', label: 'My Bag', icon: 'ShoppingBag', route: '/bag', description: 'Fonts saved in your bag' },
  { id: 'moods', label: 'Explore Moods', icon: 'Palette', route: '/moods', description: 'Browse fonts by mood & vibe' },
  { id: 'playground', label: 'Playground', icon: 'Sliders', route: '/playground', description: 'Test fonts interactively' },
  { id: 'type-swap', label: 'TypeSwap', icon: 'RefreshCw', route: '/type-swap', description: 'Swap fonts on any page' },
  { id: 'upload', label: 'Upload Font', icon: 'Upload', route: '/upload', description: 'Share a font with the community' },
  { id: 'docs', label: 'Documentation', icon: 'BookOpen', route: '/docs', description: 'Browse the docs' },
  { id: 'cli', label: 'CLI Tool', icon: 'Terminal', route: '/cli', description: 'Install fonts via terminal' },
  { id: 'members', label: 'Members', icon: 'Users', route: '/members', description: 'Community members' },
] as const;
