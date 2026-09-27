/**
 * NoBadFonts — Mood/World Definition System
 * Adding a new mood requires only adding one entry to MOODS array — zero page rebuilds.
 */

export interface MoodDefinition {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  emoji: string;

  /** CSS variable overrides applied as inline style on the mood page wrapper */
  cssVars: Record<string, string>;

  /** Gradient/background for the hero section (full CSS value) */
  heroBackground: string;
  desktopBanner?: string;
  mobileBanner?: string;

  /** Gradient overlay for the hero text area */
  heroOverlay: string;

  /** Color used for the active filter chip */
  accentColor: string;
  accentFg: string;

  /** Filter chips relevant to this mood — first item is "All" placeholder */
  contextCategories: string[];

  /** Decorative CSS classes / identifiers for the hero art (used by MoodHero) */
  decorationStyle: string;

  /** Font categories/tags to pre-filter when loading this mood (fed to useFonts query) */
  preferredCategories: string[];

  /** Card style override */
  cardStyle: {
    borderRadius?: string;
    background?: string;
    border?: string;
    shadow?: string;
    overlayGradient?: string;
  };

  /** Background art elements (CSS background or solid) */
  pageBackground: string;

  /** Ambient texture class applied to the page */
  textureClass?: string;
}

export const MOODS: MoodDefinition[] = [
  {
    id: 'wedding',
    slug: 'wedding',
    name: 'Wedding',
    tagline: 'Fonts for moments worth remembering',
    description:
      'Elegant, romantic and expressive fonts for invitations, save the dates, wedding websites and everything in between.',
    emoji: '💍',
    cssVars: {
      '--mood-primary': '186 104 79',     // dusty rose
      '--mood-secondary': '214 186 167',  // blush beige
      '--mood-accent': '139 80 55',       // dark rose
      '--mood-bg': '253 242 222 0',         // ivory
      '--mood-card': '255 252 248',       // cream white
      '--mood-text': '82 55 45',          // brown
      '--mood-muted': '165 130 110',      // muted mauve
    },
    heroBackground: 'linear-gradient(135deg, #f8ede4 0%, #f5e6d8 40%, #eedfd4 70%, #e8d5c4 100%)',
    desktopBanner: '/moods/desktop-banners/wedding.png',
    mobileBanner: '/moods/mobile-banners/wedding.png',
    heroOverlay: 'linear-gradient(to bottom, #FBF2E400 0%, #FBF2E4 100%)',
    accentColor: 'rgb(139, 80, 55)',
    accentFg: '#fff8f5',
    contextCategories: ['Invitation', 'Save the Date', 'Wedding Website', 'Signage', 'Indian Wedding', 'Luxury', 'Minimal', 'Romantic'],
    decorationStyle: 'wedding',
    preferredCategories: ['script', 'serif', 'display', 'calligraphic'],
    cardStyle: {
      borderRadius: '24px',
      background: "url('/moods/cards/wedding-card.png') center/cover",
      border: '1px solid rgba(252,252,252,0.05)',
      // shadow: '0 4px 24px rgba(186,104,79,0.08)',
      // overlayGradient: 'linear-gradient(to bottom, rgba(250,240,230,0.2), rgba(250,240,230,0.6))',
    },
    pageBackground: 'linear-gradient(180deg, #FDF8EB00 0%, #FDEED300 50%, #FDF8EB00 100%)',
    textureClass: 'mood-texture-floral',
  },
  {
    id: 'cyberpunk',
    slug: 'cyberpunk',
    name: 'Cyberpunk',
    tagline: 'Fonts for a neon future',
    description:
      'Dark, electric, and edgy typefaces for tech brands, gaming titles, sci-fi projects, and anything that runs on neon.',
    emoji: '⚡',
    cssVars: {
      '--mood-primary': '0 255 170',      // neon green
      '--mood-secondary': '255 0 128',    // hot pink
      '--mood-accent': '0 200 255',       // electric cyan
      '--mood-bg': '8 6 18',             // near-black
      '--mood-card': '14 10 28',          // deep dark
      '--mood-text': '220 240 255',       // light blue-white
      '--mood-muted': '90 100 140',       // muted blue
    },
    heroBackground: 'linear-gradient(135deg, #060410 0%, #0d0820 40%, #120a2a 70%, #0a0618 100%)',
    desktopBanner: '/moods/desktop-banners/cyberpunk.png',
    mobileBanner: '/moods/mobile-banners/cyberpunk.png',
    heroOverlay: 'linear-gradient(to bottom, rgba(8,6,18,0) 0%, rgba(8,6,18,0.5) 60%, rgba(8,6,18,1) 100%)',
    accentColor: '#00ffaa',
    accentFg: '#060410',
    contextCategories: ['Tech', 'Gaming', 'Sci-Fi', 'Experimental', 'Neon', 'Industrial', 'Distorted', 'Grunge'],
    decorationStyle: 'cyberpunk',
    preferredCategories: ['monospace', 'display', 'sans-serif', 'techno', 'experimental'],
    cardStyle: {
      borderRadius: '8px',
      background: "url('/moods/cards/cyberpunk-card.png') center/cover",
      border: '1px solid rgba(0,255,170,0.2)',
      shadow: '0 0 24px rgba(0,255,170,0.08), 0 0 1px rgba(0,255,170,0.4)',
      overlayGradient: 'linear-gradient(to bottom, rgba(0,255,170,0.04), rgba(255,0,128,0.06))',
    },
    pageBackground: 'linear-gradient(160deg, #060410 0%, #0a0820 50%, #0d0a24 100%)',
    textureClass: 'mood-texture-grid',
  },
  {
    id: 'y2k',
    slug: 'y2k',
    name: 'Y2K',
    tagline: 'Fonts for a brighter tomorrow',
    description:
      'Playful, nostalgic and futuristic fonts for posters, branding, social media, fashion, stickers and everything Y2K.',
    emoji: '💿',
    cssVars: {
      '--mood-primary': '168 130 255',   // soft purple
      '--mood-secondary': '255 180 240', // bubble pink
      '--mood-accent': '130 200 255',    // sky blue
      '--mood-bg': '225 215 255',        // lavender
      '--mood-card': '240 232 255',      // light purple
      '--mood-text': '60 30 100',        // deep purple
      '--mood-muted': '140 110 200',     // muted purple
    },
    heroBackground: 'linear-gradient(135deg, #e8d8ff 0%, #d8c8f8 25%, #f0d8f8 50%, #c8deff 75%, #d8f0ff 100%)',
    desktopBanner: '/moods/desktop-banners/y2k.png',
    mobileBanner: '/moods/mobile-banners/y2k.png',
    heroOverlay: 'linear-gradient(to bottom, rgba(225,215,255,0) 0%, rgba(225,215,255,0.5) 60%, rgba(225,215,255,1) 100%)',
    accentColor: 'rgb(168, 130, 255)',
    accentFg: '#fff',
    contextCategories: ['Retro', 'Y2K', 'Playful', 'Experimental', 'Display', 'Tech', 'Gaming', 'Fashion', 'Stickers', 'Web', 'Pop Culture'],
    decorationStyle: 'y2k',
    preferredCategories: ['display', 'techno', 'bubbly', 'retro', 'sans-serif'],
    cardStyle: {
      borderRadius: '20px',
      background: "url('/moods/cards/y2k-card.png') center/cover",
      border: '1px solid rgba(168,130,255,0.25)',
      shadow: '0 4px 20px rgba(168,130,255,0.15)',
      overlayGradient: 'linear-gradient(to bottom, rgba(200,180,255,0.15), rgba(255,200,240,0.2))',
    },
    pageBackground: 'linear-gradient(160deg, #e4d4ff 0%, #dcd4ff 40%, #d8e8ff 100%)',
    textureClass: 'mood-texture-chrome',
  },
  {
    id: 'editorial',
    slug: 'editorial',
    name: 'Editorial',
    tagline: 'Fonts for bolder ideas',
    description:
      'Sophisticated, expressive and timeless fonts for branding, editorial design, fashion, print and everything in between.',
    emoji: '📰',
    cssVars: {
      '--mood-primary': '10 10 10',      // near-black
      '--mood-secondary': '50 50 50',    // dark grey
      '--mood-accent': '220 180 80',     // warm gold
      '--mood-bg': '248 244 238',        // warm off-white
      '--mood-card': '252 250 245',      // cream
      '--mood-text': '15 15 15',         // black
      '--mood-muted': '120 110 100',     // warm grey
    },
    heroBackground: 'linear-gradient(135deg, #f4f0ea 0%, #ece6dc 40%, #f0ece6 70%, #e8e0d4 100%)',
    desktopBanner: '/moods/desktop-banners/editorial.png',
    mobileBanner: '/moods/mobile-banners/editorial.png',
    heroOverlay: 'linear-gradient(to bottom, rgba(248,244,238,0) 0%, rgba(248,244,238,0.5) 60%, rgba(248,244,238,1) 100%)',
    accentColor: 'rgb(10, 10, 10)',
    accentFg: '#f8f4ee',
    contextCategories: ['Editorial', 'Fashion', 'Branding', 'Magazine', 'Luxury', 'Minimal', 'Classic', 'Modern', 'High Contrast', 'Serif', 'Sans Serif', 'Display'],
    decorationStyle: 'editorial',
    preferredCategories: ['serif', 'display', 'sans-serif', 'editorial'],
    cardStyle: {
      borderRadius: '4px',
      background: "url('/moods/cards/editorial-card.png') center/cover",
      border: '1px solid rgba(15,15,15,0.08)',
      shadow: '0 2px 12px rgba(15,15,15,0.06)',
      overlayGradient: 'linear-gradient(to bottom, rgba(248,244,238,0.1), rgba(220,180,80,0.05))',
    },
    pageBackground: 'linear-gradient(160deg, #f8f4ee 0%, #f4f0e8 50%, #f0ece4 100%)',
    textureClass: 'mood-texture-grain',
  },
  {
    id: 'romantic',
    slug: 'romantic',
    name: 'Romantic',
    tagline: 'Fonts for beautiful stories',
    description:
      'Elegant, dreamy and expressive fonts for love letters, weddings, invitations and everything heartfelt.',
    emoji: '🌹',
    cssVars: {
      '--mood-primary': '210 100 120',   // dusty rose
      '--mood-secondary': '240 180 180', // soft pink
      '--mood-accent': '180 60 80',      // deep rose
      '--mood-bg': '255 244 246',        // blush white
      '--mood-card': '255 248 250',      // soft cream pink
      '--mood-text': '100 40 55',        // dark rose
      '--mood-muted': '190 130 140',     // muted pink
    },
    heroBackground: 'linear-gradient(135deg, #fce8ec 0%, #f9dde4 40%, #f8d4de 70%, #f5ccd8 100%)',
    desktopBanner: '/moods/desktop-banners/romantic.png',
    mobileBanner: '/moods/mobile-banners/romantic.png',
    heroOverlay: 'linear-gradient(to bottom, rgba(255,244,246,0) 0%, rgba(255,244,246,0.55) 60%, rgba(255,244,246,1) 100%)',
    accentColor: 'rgb(210, 100, 120)',
    accentFg: '#fff',
    contextCategories: ['Wedding', 'Love Letter', 'Invitation', 'Elegant', 'Calligraphy', 'Script', 'Serif', 'Luxury', 'Editorial', 'Minimal', 'Classic'],
    decorationStyle: 'romantic',
    preferredCategories: ['script', 'calligraphic', 'serif', 'display'],
    cardStyle: {
      borderRadius: '24px',
      background: "url('/moods/cards/romantic-card.png') center/cover",
      border: '1px solid rgba(210,100,120,0.12)',
      shadow: '0 4px 24px rgba(210,100,120,0.08)',
      overlayGradient: 'linear-gradient(to bottom, rgba(255,220,230,0.15), rgba(255,200,220,0.3))',
    },
    pageBackground: 'linear-gradient(160deg, #fff0f3 0%, #fde6ec 50%, #fce0e8 100%)',
    textureClass: 'mood-texture-petals',
  },
  {
    id: 'sci-fi',
    slug: 'sci-fi',
    name: 'Sci-Fi',
    tagline: 'Fonts from another dimension',
    description:
      'Futuristic, technical and otherworldly typefaces for space operas, interstellar brands, and sci-fi UI designs.',
    emoji: '🚀',
    cssVars: {
      '--mood-primary': '0 180 255',     // electric blue
      '--mood-secondary': '30 250 160',  // teal green
      '--mood-accent': '80 160 255',     // medium blue
      '--mood-bg': '4 8 20',            // deep space
      '--mood-card': '8 14 32',          // dark navy
      '--mood-text': '180 220 255',      // pale blue
      '--mood-muted': '70 100 150',      // space blue
    },
    heroBackground: 'radial-gradient(ellipse at 50% 100%, #0a1844 0%, #040814 50%, #020408 100%)',
    desktopBanner: '/moods/desktop-banners/sci-fi.png',
    mobileBanner: '/moods/mobile-banners/sci-fi.png',
    heroOverlay: 'linear-gradient(to bottom, rgba(4,8,20,0) 0%, rgba(4,8,20,0.5) 60%, rgba(4,8,20,1) 100%)',
    accentColor: 'rgb(0, 180, 255)',
    accentFg: '#020814',
    contextCategories: ['Space', 'Futuristic', 'Tech', 'HUD', 'Sci-Fi', 'Display', 'Monospace', 'Techno', 'Industrial'],
    decorationStyle: 'scifi',
    preferredCategories: ['monospace', 'techno', 'sans-serif', 'display'],
    cardStyle: {
      borderRadius: '8px',
      background: "url('/moods/cards/sci-fi-card.png') center/cover",
      border: '1px solid rgba(0,180,255,0.2)',
      shadow: '0 0 20px rgba(0,180,255,0.06), 0 0 1px rgba(0,180,255,0.3)',
      overlayGradient: 'linear-gradient(to bottom, rgba(0,180,255,0.03), rgba(30,250,160,0.05))',
    },
    pageBackground: 'radial-gradient(ellipse at 50% 0%, #081428 0%, #040a1c 50%, #020408 100%)',
    textureClass: 'mood-texture-stars',
  },
  {
    id: 'retro',
    slug: 'retro',
    name: 'Retro / Vintage',
    tagline: 'Fonts from the golden age',
    description:
      'Warm, textured and nostalgic typefaces inspired by 70s poster art, vintage signage, and analog print culture.',
    emoji: '📻',
    cssVars: {
      '--mood-primary': '210 110 50',    // burnt orange
      '--mood-secondary': '180 160 80',  // mustard
      '--mood-accent': '160 60 30',      // rust
      '--mood-bg': '244 234 210',        // aged paper
      '--mood-card': '248 240 218',      // warm parchment
      '--mood-text': '55 40 20',         // dark brown
      '--mood-muted': '140 110 70',      // muted brown
    },
    heroBackground: 'linear-gradient(135deg, #f4e8c8 0%, #eedad8 30%, #f0e4c0 60%, #ead8a8 100%)',
    desktopBanner: '/moods/desktop-banners/retro.png',
    mobileBanner: '/moods/mobile-banners/retro.png',
    heroOverlay: 'linear-gradient(to bottom, rgba(244,234,210,0) 0%, rgba(244,234,210,0.5) 60%, rgba(244,234,210,1) 100%)',
    accentColor: 'rgb(210, 110, 50)',
    accentFg: '#fff8f0',
    contextCategories: ['Vintage', 'Retro', '70s', '80s', 'Poster', 'Display', 'Serif', 'Slab Serif', 'Script', 'Western', 'Classic'],
    decorationStyle: 'retro',
    preferredCategories: ['serif', 'slab-serif', 'display', 'script', 'retro'],
    cardStyle: {
      borderRadius: '12px',
      background: "url('/moods/cards/retro-card.png') center/cover",
      border: '1px solid rgba(210,110,50,0.15)',
      shadow: '0 3px 16px rgba(100,60,20,0.1)',
      overlayGradient: 'linear-gradient(to bottom, rgba(210,110,50,0.04), rgba(180,160,80,0.08))',
    },
    pageBackground: 'linear-gradient(160deg, #f8ecd8 0%, #f4e4c0 50%, #f0ddb0 100%)',
    textureClass: 'mood-texture-grain',
  },
  {
    id: 'horror',
    slug: 'horror',
    name: 'Horror',
    tagline: 'Fonts for darker ideas',
    description:
      'Dark, eerie and unsettling fonts for horror posters, thrillers, games, mysterious brands and everything supernatural.',
    emoji: '🕯️',
    cssVars: {
      '--mood-primary': '200 30 30',     // blood red
      '--mood-secondary': '100 15 15',   // dark red
      '--mood-accent': '220 60 30',      // fire orange
      '--mood-bg': '8 4 4',             // near-black
      '--mood-card': '15 6 6',           // very dark
      '--mood-text': '230 200 190',      // aged parchment
      '--mood-muted': '100 70 60',       // dark muted
    },
    heroBackground: 'radial-gradient(ellipse at 50% 100%, #3d0a0a 0%, #1a0404 50%, #080404 100%)',
    desktopBanner: '/moods/desktop-banners/horror.png',
    mobileBanner: '/moods/mobile-banners/horror.png',
    heroOverlay: 'linear-gradient(to bottom, rgba(8,4,4,0) 0%, rgba(8,4,4,0.5) 60%, rgba(8,4,4,1) 100%)',
    accentColor: 'rgb(200, 30, 30)',
    accentFg: '#fff0ec',
    contextCategories: ['Horror', 'Spooky', 'Grunge', 'Distressed', 'Handwritten', 'Creepy', 'Dark Serif', 'Blackletter', 'Display', 'Vintage', 'Gothic'],
    decorationStyle: 'horror',
    preferredCategories: ['display', 'blackletter', 'serif', 'horror', 'distressed'],
    cardStyle: {
      borderRadius: '8px',
      background: "url('/moods/cards/horror-card.png') center/cover",
      border: '1px solid rgba(200,30,30,0.2)',
      shadow: '0 0 24px rgba(200,30,30,0.08)',
      overlayGradient: 'linear-gradient(to bottom, rgba(200,30,30,0.04), rgba(100,15,15,0.1))',
    },
    pageBackground: 'radial-gradient(ellipse at 50% 0%, #1a0606 0%, #0c0404 50%, #080404 100%)',
    textureClass: 'mood-texture-cracks',
  },
  {
    id: 'minimal',
    slug: 'minimal',
    name: 'Minimal',
    tagline: 'Less, but better',
    description:
      'Clean, restrained and purely functional typefaces for interfaces, editorial design, and modern minimal brands.',
    emoji: '⬜',
    cssVars: {
      '--mood-primary': '15 15 15',      // black
      '--mood-secondary': '100 100 100', // mid grey
      '--mood-accent': '15 15 15',       // black
      '--mood-bg': '252 252 252',        // near-white
      '--mood-card': '255 255 255',      // white
      '--mood-text': '15 15 15',         // black
      '--mood-muted': '160 160 160',     // neutral grey
    },
    heroBackground: 'linear-gradient(180deg, #f8f8f8 0%, #f2f2f2 100%)',
    desktopBanner: '/moods/desktop-banners/minimal.png',
    mobileBanner: '/moods/mobile-banners/minimal.png',
    heroOverlay: 'linear-gradient(to bottom, rgba(252,252,252,0) 0%, rgba(252,252,252,0.5) 60%, rgba(252,252,252,1) 100%)',
    accentColor: 'rgb(15, 15, 15)',
    accentFg: '#ffffff',
    contextCategories: ['Minimal', 'Sans Serif', 'Clean', 'Interface', 'Editorial', 'Geometric', 'Neutral', 'Modern', 'Swiss'],
    decorationStyle: 'minimal',
    preferredCategories: ['sans-serif', 'geometric', 'minimal'],
    cardStyle: {
      borderRadius: '16px',
      background: "url('/moods/cards/minimal-card.png') center/cover",
      border: '1px solid rgba(15,15,15,0.06)',
      shadow: '0 1px 8px rgba(0,0,0,0.04)',
      overlayGradient: 'none',
    },
    pageBackground: '#f8f8f8',
    textureClass: '',
  },
  {
    id: 'luxury',
    slug: 'luxury',
    name: 'Luxury',
    tagline: 'Fonts of prestige and refinement',
    description:
      'Black, marble and gold typefaces for premium brands, high-end fashion, jewelry, and aspirational editorial design.',
    emoji: '✦',
    cssVars: {
      '--mood-primary': '200 165 80',    // gold
      '--mood-secondary': '160 130 60',  // dark gold
      '--mood-accent': '220 195 110',    // bright gold
      '--mood-bg': '10 8 6',            // near-black
      '--mood-card': '18 14 10',         // dark brown-black
      '--mood-text': '240 230 200',      // warm gold-white
      '--mood-muted': '110 90 60',       // muted gold
    },
    heroBackground: 'linear-gradient(135deg, #0e0a06 0%, #14100a 40%, #100c08 70%, #0c0806 100%)',
    desktopBanner: '/moods/desktop-banners/luxury.png',
    mobileBanner: '/moods/mobile-banners/luxury.png',
    heroOverlay: 'linear-gradient(to bottom, rgba(10,8,6,0) 0%, rgba(10,8,6,0.5) 60%, rgba(10,8,6,1) 100%)',
    accentColor: 'rgb(200, 165, 80)',
    accentFg: '#080604',
    contextCategories: ['Luxury', 'Premium', 'Fashion', 'Jewelry', 'Cosmetics', 'Serif', 'Ligature', 'Display', 'Classic', 'Refined', 'Marble'],
    decorationStyle: 'luxury',
    preferredCategories: ['serif', 'display', 'ligature', 'luxury'],
    cardStyle: {
      borderRadius: '12px',
      background: "url('/moods/cards/luxury-card.png') center/cover",
      border: '1px solid rgba(200,165,80,0.2)',
      shadow: '0 4px 20px rgba(200,165,80,0.06)',
      overlayGradient: 'linear-gradient(to bottom, rgba(200,165,80,0.04), rgba(160,130,60,0.06))',
    },
    pageBackground: 'linear-gradient(160deg, #0e0a06 0%, #120e08 50%, #100c08 100%)',
    textureClass: 'mood-texture-marble',
  },
  {
    id: 'kawaii',
    slug: 'kawaii',
    name: 'Kawaii / Cute',
    tagline: 'Fonts that make you go aww',
    description:
      'Playful, bubbly and irresistibly cute typefaces for sticker brands, social content, gaming, and all things adorable.',
    emoji: '🌸',
    cssVars: {
      '--mood-primary': '255 130 170',   // candy pink
      '--mood-secondary': '130 210 255', // sky blue
      '--mood-accent': '255 100 150',    // hot pink
      '--mood-bg': '255 244 252',        // soft pink-white
      '--mood-card': '255 250 255',      // near white
      '--mood-text': '80 40 80',         // dark purple
      '--mood-muted': '190 140 180',     // muted purple-pink
    },
    heroBackground: 'linear-gradient(135deg, #fde8f4 0%, #f8e0f8 30%, #e8eeff 60%, #ffe8f8 100%)',
    desktopBanner: '/moods/desktop-banners/cute.png',
    mobileBanner: '/moods/mobile-banners/cute.png',
    heroOverlay: 'linear-gradient(to bottom, rgba(255,244,252,0) 0%, rgba(255,244,252,0.5) 60%, rgba(255,244,252,1) 100%)',
    accentColor: 'rgb(255, 130, 170)',
    accentFg: '#fff',
    contextCategories: ['Cute', 'Bubbly', 'Playful', 'Stickers', 'Kawaii', 'Rounded', 'Handwritten', 'Script', 'Display', 'Cartoon', 'Pop'],
    decorationStyle: 'kawaii',
    preferredCategories: ['rounded', 'handwritten', 'display', 'bubbly', 'script'],
    cardStyle: {
      borderRadius: '28px',
      background: "url('/moods/cards/cute-card.png') center/cover",
      border: '2px solid rgba(255,130,170,0.15)',
      shadow: '0 4px 20px rgba(255,130,170,0.12)',
      overlayGradient: 'linear-gradient(to bottom, rgba(255,200,230,0.15), rgba(200,230,255,0.15))',
    },
    pageBackground: 'linear-gradient(160deg, #fff0fa 0%, #fde8f8 50%, #f8e8ff 100%)',
    textureClass: 'mood-texture-dots',
  },
  {
    id: 'pixel',
    slug: 'pixel',
    name: 'Pixel / Futuristic',
    tagline: 'Fonts from the digital frontier',
    description:
      'Pixel-perfect, grid-based and digital typefaces for game UIs, retro-computing aesthetics, and futuristic pixel art.',
    emoji: '👾',
    cssVars: {
      '--mood-primary': '0 255 100',     // neon green
      '--mood-secondary': '255 200 0',   // neon yellow
      '--mood-accent': '0 220 80',       // green
      '--mood-bg': '6 10 6',            // terminal black
      '--mood-card': '10 16 10',         // dark green-black
      '--mood-text': '180 255 180',      // terminal green text
      '--mood-muted': '60 100 60',       // muted green
    },
    heroBackground: 'linear-gradient(135deg, #060a06 0%, #0a100a 40%, #081008 70%, #060c06 100%)',
    desktopBanner: '/moods/desktop-banners/futuristic.png',
    mobileBanner: '/moods/mobile-banners/futuristic.png',
    heroOverlay: 'linear-gradient(to bottom, rgba(6,10,6,0) 0%, rgba(6,10,6,0.5) 60%, rgba(6,10,6,1) 100%)',
    accentColor: 'rgb(0, 255, 100)',
    accentFg: '#060a06',
    contextCategories: ['Pixel', 'Retro Gaming', 'Monospace', 'Terminal', 'Techno', 'Display', 'Neon', 'Futuristic', 'Bitmap', 'Glitch'],
    decorationStyle: 'pixel',
    preferredCategories: ['pixel', 'monospace', 'techno', 'display'],
    cardStyle: {
      borderRadius: '4px',
      background: "url('/moods/cards/futuristic-card.png') center/cover",
      border: '1px solid rgba(0,255,100,0.25)',
      shadow: '0 0 16px rgba(0,255,100,0.06)',
      overlayGradient: 'linear-gradient(to bottom, rgba(0,255,100,0.03), rgba(255,200,0,0.03))',
    },
    pageBackground: 'linear-gradient(160deg, #060a06 0%, #080e08 50%, #060c06 100%)',
    textureClass: 'mood-texture-scanlines',
  },
];

/** Map from slug → mood for O(1) lookup */
export const MOOD_BY_SLUG = Object.fromEntries(
  MOODS.map((m) => [m.slug, m])
) as Record<string, MoodDefinition>;
