import { useState, useEffect, useCallback } from 'react';
import SEO from '../components/shared/SEO';

interface ChangelogSection {
  type: 'New' | 'Improved' | 'Fixed' | 'Removed';
  items: string[];
}

interface ChangelogEntry {
  date: string;
  year: string;
  title: string;
  image?: string;
  description?: string;
  sections: ChangelogSection[];
}

const CHANGELOG: ChangelogEntry[] = [
  // ─────────────────────────────────────────────
  // NOVEMBER 2026
  // ─────────────────────────────────────────────
  {
    date: 'November 17',
    year: '2026',
    title: 'Branding & Website Polish',
    image: 'banner/banner.webp',
    description:
      'A series of refinements to the public-facing experience, contributor interface, and website presentation.',
    sections: [
      {
        type: 'Improved',
        items: [
          'Website banner and social sharing artwork refreshed.',
          'Profile contributor request section redesigned.',
          'SEO metadata and canonical URLs updated.',
          'Favicon assets refreshed in multiple sizes.',
          'Website presentation and profile interface polished.',
        ],
      },
    ],
  },
  {
    date: 'November 6',
    year: '2026',
    title: 'Public Profiles & Connected Apps',
    image: '/changelogs/nov26/profile.webp',
    description:
      'A more connected community experience with public user profiles, dedicated board collections, and application integrations.',
    sections: [
      {
        type: 'New',
        items: [
          'Public user profile pages at /@username.',
          'Personal profile route at /@me.',
          'Public profile information including biography, social links, and board previews.',
          'Dedicated public user board listings.',
          'Connected Apps settings page.',
          'Connected applications section in user profiles.',
          'Application identity and icon support for browser extensions, Figma, ChatGPT, Claude, and Gemini integrations.',
          'Support page with frequently asked questions and product guidance.',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Board routes reorganized under username-based profile URLs.',
          'Profile statistics link directly to board collections.',
          'Board cards display their owners’ profile pictures.',
          'Connected application cards display clearer authorization information.',
          'Profile and board navigation updated to use the new route structure.',
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────
  // OCTOBER 2026
  // ─────────────────────────────────────────────
  {
    date: 'October 30',
    year: '2026',
    title: 'Profile & Administration Improvements',
    description:
      'Improvements to account presentation, contributor workflows, and administrative controls.',
    sections: [
      {
        type: 'New',
        items: [
          'Administrative controls visibility toggle.',
          'Connected application information in the profile interface.',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Profile header and social links refined.',
          'Avatar selection and profile settings interface improved.',
          'Font administration controls made easier to manage.',
        ],
      },
      {
        type: 'Fixed',
        items: [
          'Profile picture and account onboarding issues addressed.',
        ],
      },
    ],
  },
  {
    date: 'October 27',
    year: '2026',
    title: 'OAuth & Browser Extension Authentication',
    description:
      'The foundation for connecting external NoBadFonts applications through a centralized authorization system.',
    sections: [
      {
        type: 'New',
        items: [
          'NoBadFonts OAuth authentication system.',
          'Dedicated OAuth authorization and consent page.',
          'Application client identification and authorization flow.',
          'Browser extension authentication integration.',
        ],
      },
      {
        type: 'Improved',
        items: [
          'OAuth redirects validate the requesting application and authenticated user.',
          'Authorized application access managed through the NoBadFonts account.',
        ],
      },
    ],
  },
  {
    date: 'October 13',
    year: '2026',
    title: 'Search & Font Discovery Experience',
    description:
      'A more accessible way to discover typefaces through the navigation experience.',
    sections: [
      {
        type: 'New',
        items: [
          'Search bar integrated into the navigation experience.',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Search integrated with catalogue query parameters.',
          'Font detail social preview and SEO metadata updated.',
          'Font category filtering handles alternative category names more consistently.',
        ],
      },
      {
        type: 'Fixed',
        items: [
          'Font detail loading and rendering issues addressed.',
        ],
      },
    ],
  },
  {
    date: 'October 12',
    year: '2026',
    title: 'Automated Font Processing Pipeline',
    description:
      'A major backend improvement connecting font discovery, classification, extraction, and publishing into a scheduled processing workflow.',
    sections: [
      {
        type: 'New',
        items: [
          'Scheduled font processing queue.',
          'Automated font archive extraction and validation.',
          'Font classification using Gemini with embedded metadata as a fallback.',
          'Automatic font family and variant grouping.',
          'Creation of parent and sub-family font records.',
          'Automated publishing of processed font variants to Supabase.',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Processing jobs use queue states to prevent duplicate execution.',
          'Publishing workflows support safe retries and concurrency protection.',
          'Font metadata and existing curation information are preserved during processing.',
        ],
      },
    ],
  },
  {
    date: 'October 10',
    year: '2026',
    title: 'Font Metadata & Processing Reliability',
    description:
      'Major improvements to font asset discovery, metadata extraction, classification, and publishing reliability.',
    sections: [
      {
        type: 'New',
        items: [
          'Read-only font asset discovery pipeline.',
          'Deterministic font processing and variant grouping engine.',
          'SHA-256-based asset fingerprinting and duplicate detection.',
          'Local WOFF2 metadata extraction using fontTools.',
          'Discovery report validation and baseline comparisons.',
          'Ambiguous font metadata review workflow.',
          'Parent family, sub-family, and variant relationships.',
          'Atomic Supabase font publishing infrastructure.',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Font weights and variants reconciled using embedded metadata.',
          'Conflicting or incomplete metadata can be flagged for review.',
          'Complex font families support multiple independent sub-families.',
          'Publishing workflows include staging, validation, and explicit write safeguards.',
          'Gemini-assisted classification supports structured review of ambiguous font groups.',
        ],
      },
    ],
  },
  {
    date: 'October 7',
    year: '2026',
    title: 'Global Page Transitions',
    description:
      'A coordinated navigation transition system designed to make movement between pages feel smoother and more consistent.',
    sections: [
      {
        type: 'New',
        items: [
          'Global page transition system with coordinated cover and reveal animations.',
          'Page readiness tracking for navigation transitions.',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Font detail pages integrated with transition readiness tracking.',
          'Scroll restoration coordinated with navigation transitions.',
          'Transition styling and navigation behavior refined.',
        ],
      },
    ],
  },
  {
    date: 'October 5',
    year: '2026',
    title: 'Font Archive Downloads',
    image: '/changelogs/oct26/cli.webp',
    description:
      'A more flexible approach to automatically retrieving font files from complete font release archives.',
    sections: [
      {
        type: 'Improved',
        items: [
          'Automatic font downloads migrated to a release ZIP-based strategy.',
          'Font source metadata now supports complete release archive URLs.',
          'Archive extraction prepares available font formats for processing.',
          'Upload validation updated to support release archive sources.',
        ],
      },
    ],
  },
  {
    date: 'October 2',
    year: '2026',
    title: 'GitHub Font Discovery',
    description:
      'Infrastructure for discovering font projects, scanning repositories, extracting metadata, and reviewing new font candidates.',
    sections: [
      {
        type: 'New',
        items: [
          'Automated GitHub font repository discovery.',
          'Scheduled repository discovery and scanning infrastructure.',
          'Admin GitHub Discovery dashboard with repository and candidate information.',
          'Font candidate review and approval workflows.',
          'Automated extraction of font files and embedded metadata from repositories.',
          'License detection and classification infrastructure.',
          'Duplicate repository and font asset detection.',
          'Supabase database and processing queue for discovered repositories.',
          'Admin publishing workflow for approved font candidates.',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Discovery workers can recover stale scanning jobs.',
          'Repository tracking uses stable GitHub repository identifiers.',
          'Font metadata and licensing evidence are retained for candidate review.',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // SEPTEMBER 2026
  // ─────────────────────────────────────────────
  {
    date: 'September 28',
    year: '2026',
    title: 'Moods, Font Playground & TypeSwap',
    description:
      'Font discovery expands beyond traditional categories with immersive visual experiences and interactive typography tools.',
    sections: [
      {
        type: 'New',
        items: [
          'Mood-based font discovery with dedicated pages for different visual styles.',
          'Individual mood identities with custom colors, backgrounds, typography, and artwork.',
          'Mood-specific font cards and desktop/mobile hero artwork.',
          'Interactive Font Playground for experimenting with multiple typefaces.',
          'Independent specimen controls for font size, weight, line height, and letter spacing.',
          'Variable font axis controls in the playground.',
          'TypeSwap tool for testing typography combinations in preset page templates.',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Font catalogue cards support mood-specific visual treatments.',
          'Font browsing and previews integrated into mood pages.',
          'Saved board functionality integrated into board detail and user collection pages.',
        ],
      },
    ],
  },
  {
    date: 'September 26',
    year: '2026',
    title: 'Documentation Center',
    image: '/changelogs/sep26/docs.webp',
    description:
      'A dedicated documentation experience covering the platform, developer tools, integrations, and typography workflows.',
    sections: [
      {
        type: 'New',
        items: [
          'Dedicated documentation section built around MDX content.',
          'Documentation navigation sidebar.',
          'Documentation search interface.',
          'Automatic table of contents and page navigation.',
          'Code blocks, callouts, breadcrumbs, and embedded playground components.',
          'CLI installation, configuration, and command documentation.',
          'MCP installation, setup, and tool reference documentation.',
          'Guides covering font pairing, licensing, curation, and self-hosting.',
        ],
      },
    ],
  },
  {
    date: 'September 23',
    year: '2026',
    title: 'Font Bag & Developer Workflow',
    image: '/changelogs/sep26/bag.webp',
    description:
      'A dedicated space for collecting typefaces and preparing them for use in websites and development projects.',
    sections: [
      {
        type: 'New',
        items: [
          'Dedicated Font Bag page.',
          'Add fonts to the Bag directly from font cards and detail pages.',
          'Select individual variants or include complete font families.',
          'Export modes for CSS embedding, CLI installation, and ZIP downloads.',
          'Generated font-face code for collected typefaces.',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Bag functionality moved from a floating panel into a dedicated page.',
          'Font selection and variant management integrated into the font detail experience.',
          'CLI installation guidance incorporated into developer workflows.',
        ],
      },
    ],
  },
  {
    date: 'September 22',
    year: '2026',
    title: 'Font Boards & Onboarding',
    image: '/changelogs/sep26/boards.webp',
    description:
      'A new way to organize typography collections, save interesting typefaces, and build shareable font boards.',
    sections: [
      {
        type: 'New',
        items: [
          'User onboarding flow for completing account profiles.',
          'Font boards with names, descriptions, and public or private visibility.',
          'Add and remove fonts from personal boards.',
          'Dedicated board detail pages.',
          'Public board sharing with dedicated share links.',
          'Board management, editing, and deletion.',
          'Public user board listing pages.',
          'Database infrastructure and row-level security for boards.',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Board detail pages support font browsing and masonry layouts.',
          'Font cards integrated with the Save to Board interaction.',
          'Board previews display selected fonts.',
          'Board navigation and profile connections refined.',
        ],
      },
    ],
  },
  {
    date: 'September 19',
    year: '2026',
    title: 'Catalogue & Interface Redesign',
    image: '/changelogs/sep26/catalog3.webp',
    description:
      'A broad visual and interaction refinement across the font catalogue, filters, navigation, and application layout.',
    sections: [
      {
        type: 'Improved',
        items: [
          'Font cards redesigned with smoother shapes and improved hover interactions.',
          'Floating filter toolbar and category panels redesigned.',
          'Masonry layout and virtualized scrolling refined.',
          'Font card rendering optimized for dynamic masonry widths.',
          'Favourite interactions synchronized with Supabase.',
          'Navigation, profile header, and footer refined.',
          'React runtime dependencies and rendering configuration updated.',
        ],
      },
    ],
  },
  {
    date: 'September 17',
    year: '2026',
    title: 'NoBadFonts MCP Integration',
    description:
      'A new integration layer that allows compatible AI clients to interact with the NoBadFonts font catalogue through the Model Context Protocol.',
    sections: [
      {
        type: 'New',
        items: [
          'Remote MCP server implemented as a Supabase Edge Function.',
          'Tools for searching and retrieving fonts.',
          'Tools for identifying missing font metadata and verifying font sources.',
          'Font research and proposed metadata update workflows.',
          'Font revision history with approval, rejection, publishing, and rollback operations.',
          'Role-based access controls for MCP operations.',
          'Audit and revision management infrastructure.',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Font modification workflows separated into proposal, review, and publishing stages.',
          'Server-side authentication and origin validation added to MCP connections.',
        ],
      },
    ],
  },
  {
    date: 'September 16',
    year: '2026',
    title: 'Font Details & Specimen Controls',
    image: '/changelogs/sep26/details.webp',
    description:
      'A substantial restructuring of the font detail experience, introducing richer typography controls and a more structured metadata system.',
    sections: [
      {
        type: 'New',
        items: [
          'Modular font detail architecture with dedicated sections for specimens, variants, glyphs, integrations, and related fonts.',
          'Canonical font metadata JSON import and export tools.',
          'OpenType metadata extraction supporting TTF, OTF, WOFF, and WOFF2.',
          'Unicode coverage, glyph metrics, variable font axes, and OpenType feature detection.',
          'Local WASM-based WOFF2 decompression for font metadata extraction.',
          'Structured taxonomy for font identity, designers, foundries, classifications, and licensing.',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Interactive font specimen controls with adjustable line height and letter spacing.',
          'Editorial typography information redesigned with richer metadata and official source links.',
          'Font variant selectors redesigned with animated dropdowns and haptic feedback.',
          'Consistent variant selection across Glyph Map and Upload interfaces.',
          'Official URLs and license links normalized to handle malformed or copied Markdown links.',
          'Font detail navigation and section layouts refined.',
        ],
      },
      {
        type: 'Fixed',
        items: [
          'Resolved metadata synchronization issues when editing fonts without changing their names.',
          'Improved font research persistence and avoided unnecessary metadata refetches.',
        ],
      },
    ],
  },
  {
    date: 'September 13',
    year: '2026',
    title: 'Social Sharing & Search Visibility',
    image: '/changelogs/sep26/monasans-og.webp',
    description:
      'Better-looking font sharing cards and improved presentation of NoBadFonts links across search engines and social platforms.',
    sections: [
      {
        type: 'New',
        items: [
          'Administrative OG image generator for individual fonts.',
          'Adaptive social sharing cards with font and variant-specific previews.',
          'Dynamic server-side Open Graph metadata for font detail pages.',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Generated social preview images can be managed and replaced.',
          'Obsolete Open Graph images are cleaned up when associated font assets are removed.',
          'Legal information and license presentation updated.',
          'Footer layout and contact information refined.',
        ],
      },
    ],
  },
  {
    date: 'September 10',
    year: '2026',
    image: '/changelogs/sep26/landing.webp',
    title: 'Platform Foundations & Launch Hardening',
    description:
      'A major round of platform infrastructure, security, compliance, accessibility, and performance improvements.',
    sections: [
      {
        type: 'New',
        items: [
          'Legal pages covering Terms of Service, Privacy Policy, DMCA, and Cookie Policy.',
          'Cookie consent interface with essential-only and all-cookie options.',
          'Progressive file upload security and infrastructure improvements.',
          'ZIP-based font packaging and download infrastructure.',
          'Progressive Web App manifest and installation metadata.',
          'Automated sitemap generation with dynamic font URLs.',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Security headers configured for the application through Vercel.',
          'Accessibility improvements including keyboard focus indicators, skip navigation, and ARIA labels.',
          'Reduced-motion support for users with motion preferences.',
          'Image lazy loading and asynchronous decoding.',
          'Dynamic bundle splitting and extended font asset caching.',
          'Improved runtime error recovery and error boundary handling.',
          'Mobile navigation updated to account for device safe areas.',
          'Robots directives and search engine metadata refined.',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // EARLIER DEVELOPMENT
  // ─────────────────────────────────────────────
  {
    date: 'March 9',
    year: '2026',
    title: 'Repository Configuration & Security',
    description:
      'An early maintenance update improving how local environment configuration is handled in the repository.',
    sections: [
      {
        type: 'Improved',
        items: [
          'Local environment files removed from version control.',
          'Environment configuration files added to Git ignore rules.',
        ],
      },
    ],
  },
  {
    date: 'February 9',
    year: '2026',
    title: 'Font Asset Delivery',
    description:
      'Improvements to cross-origin delivery of hosted font files and stylesheets.',
    sections: [
      {
        type: 'Fixed',
        items: [
          'Updated CORS response headers for hosted font files and CSS resources.',
          'Expanded supported cross-origin request methods and headers.',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // LAUNCH NOBADFONTS
  // ─────────────────────────────────────────────
  {
  date: 'January 26',
  year: '2026',
  title: 'Introducing NoBadFonts',
  description: 'NoBadFonts is officially live. A curated typography platform built to help designers discover, explore, and pair typefaces without the usual friction. Browse fonts, inspect their details, experiment with previews, and find typography that fits your next project.',
  image: '/banner/banner2.webp',
  sections: [
    {
      type: 'New',
      items: [
        'A curated library of typefaces for designers and developers.',
        'Detailed font pages with metadata, variants, and glyph information.',
        'Interactive font previews to experiment with typography.',
        'A font pairing experience for exploring combinations.',
      ],
    },
  ],
}
];

export default function Changelog() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  const close = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox, close]);

  return (
    <>
      <SEO title="Changelog — NoBadFonts" description="A full history of NoBadFonts updates, new features, improvements, and fixes." url="/changelog" />

      {/* Ensure main or any outer wrapper does NOT have overflow: hidden if it cuts off scrolling */}
      <main className="min-h-screen bg-background pt-32 pb-40">
        <header className="mb-28 px-5 sm:px-8">
          <div className="mx-auto max-w-190">
            <h1 className="text-5xl sm:text-6xl md:text-[76px] font-semibold tracking-[-0.065em] leading-none text-foreground">
              Changelog
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted leading-relaxed">
              Everything that's new, improved, and happening at NoBadFonts.
            </p>
          </div>
        </header>

        <div className="space-y-32 sm:space-y-40">
          {CHANGELOG.map((entry, i) => (
            <article key={i} className="relative flex items-start self-start">

              {/* Sticky Aside */}
              <aside className="hidden xl:block absolute left-0 top-0 bottom-0 w-[calc((100%-760px)/2)]">
                <div className="sticky top-24 pl-8">
                  <time className="text-xl sm:text-2xl font-medium text-muted/70 whitespace-nowrap">
                    {entry.date}, <br/>
                    {entry.year}
                  </time>
                </div>
              </aside>

              <div className="w-full md:max-w-190 mx-auto min-w-0 px-5 sm:px-8 md:px-0">
                <div className="xl:hidden mb-5">
                  <time className="text-xl sm:text-2xl font-medium text-muted/70 whitespace-nowrap">
                    {entry.date},{' '}{entry.year}
                  </time>
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-[46px] font-semibold tracking-[-0.055em] leading-[1.12] text-foreground">
                  {entry.title}
                </h2>

                {entry.description && (
                  <p className="mt-6 text-xl sm:text-2xl font-inter leading-relaxed text-muted">
                    {entry.description}
                  </p>
                )}

                {entry.image && (
                  <figure className="mt-10 overflow-hidden rounded-xl sm:rounded-2xl md:rounded-2xl xl:rounded-3xl border border-foreground/10 shadow-[0_0_1000px_0] shadow-border">
                    <img
                      src={entry.image}
                      alt={`${entry.title} preview`}
                      className="block w-full h-auto cursor-zoom-in"
                      loading="lazy"
                      onClick={() => setLightbox(entry.image!)}
                    />
                  </figure>
                )}

                <div className="mt-10 space-y-9">
                  {entry.sections.map((section) => (
                    <section key={section.type}>
                      <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                        {section.type}
                      </h3>
                      <ul className="mt-4 space-y-3 list-disc pl-5 marker:text-muted/50">
                        {section.items.map((item, j) => (
                          <li key={j} className="pl-1 text-xl sm:text-2xl font-inter leading-[1.8] text-muted">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>

              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-border/50 backdrop-blur-md"
          onClick={close}
        >
          {/* Close button */}
          <button
            onClick={close}
            className="absolute top-4 right-4 text-foreground hover:-rotate-90 transition-transform duration-300 ease-in-out p-2"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Image — stop propagation so clicking the image itself doesn't close */}
          <img
            src={lightbox}
            alt="Full size preview"
            className="max-w-[92vw] max-h-[90vh] w-auto h-auto rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}