import { Link } from 'react-router-dom';
import {
    AlertCircle,
    ArrowRight,
    Bug,
    CloudOff,
    FileJson,
    Globe,
    Info,
    KeyRound,
    Languages,
    Layers,
    Monitor,
    MousePointerClick,
    Palette,
    RefreshCw,
    RotateCcw,
    Save,
    Scale,
    ShieldCheck,
    SlidersHorizontal,
    Type,
    Wifi,
} from 'lucide-react';
import SEO from '../components/shared/SEO';
import { BouncyAccordion } from '../components/motion/bouncy-accordion';

const FAQ_ITEMS = [
    {
        id: 'change-font',
        icon: <Palette size={16} />,
        title: 'How do I change a font on a site?',
        description:
            'Open NoBadFonts from the toolbar, pick an element, then choose a typeface from the font library or write CSS yourself. Changes apply immediately and are saved for that site.',
    },
    {
        id: 'what-is-nobadfonts',
        icon: <Info size={16} />,
        title: 'What is NoBadFonts?',
        description:
            'NoBadFonts is a typography tool that lets you customize how websites look. Explore typefaces, preview them, and apply your favourites to website elements without modifying the original website.',
    },
    {
        id: 'specific-elements',
        icon: <MousePointerClick size={16} />,
        title: 'Can I change the font of just one element?',
        description:
            'Yes. Use the element picker to select individual headings, paragraphs, buttons, or other page elements. You can customize each selection without changing the entire website.',
    },
    {
        id: 'site-specific',
        icon: <Globe size={16} />,
        title: 'Will my changes affect other websites?',
        description:
            'No. Your styles are saved separately for each website. Changing the typography on one website does not automatically change it on another.',
    },
    {
        id: 'saved-styles',
        icon: <Save size={16} />,
        title: 'Will my font changes stay after refreshing the page?',
        description:
            'Yes. NoBadFonts saves your styles for the website and reapplies them when you visit it again. You do not need to repeat the same changes every time.',
    },
    {
        id: 'local-changes',
        icon: <Monitor size={16} />,
        title: 'Can other visitors see my font changes?',
        description:
            'No. Your typography changes are applied through the extension in your own browser. They do not modify the website itself or affect what other visitors see.',
    },
    {
        id: 'website-support',
        icon: <Globe size={16} />,
        title: 'Does NoBadFonts work on every website?',
        description:
            'It works on most regular websites. However, browser-restricted pages, extension stores, embedded frames, and certain protected or dynamically rendered elements may have limitations.',
    },
    {
        id: 'font-not-applying',
        icon: <AlertCircle size={16} />,
        title: 'Why is the selected font not applying everywhere?',
        description:
            'Some websites use highly specific CSS rules, embedded frames, or isolated components that can prevent styles from applying. Try selecting the element directly or using a more specific CSS rule.',
    },
    {
        id: 'font-weights',
        icon: <SlidersHorizontal size={16} />,
        title: 'Can I change font weights and styles?',
        description:
            'Yes. You can use the available variants of a typeface, including different weights and styles where provided. Available options depend on the font files in the library.',
    },
    {
        id: 'missing-characters',
        icon: <Languages size={16} />,
        title: 'Why are some characters still using a different font?',
        description:
            'A typeface may not include every character, symbol, or language script. When a character is missing, your browser automatically uses another available font. Check the font’s glyph coverage before choosing it.',
    },
    {
        id: 'custom-font',
        icon: <Type size={16} />,
        title: 'Can I use a font that is not in the library?',
        description:
            'Yes. You can write your own CSS using the editor and reference a font already installed on your computer or loaded by the website. The browser must have access to that font.',
    },
    {
        id: 'reset-styles',
        icon: <RotateCcw size={16} />,
        title: 'How do I restore a website’s original fonts?',
        description:
            'Use the reset option in the editor to remove your custom styles for that website. You can also undo recent changes while editing.',
    },
    {
        id: 'internet',
        icon: <Wifi size={16} />,
        title: 'Do I need an internet connection?',
        description:
            'An internet connection is needed to browse the NoBadFonts library and retrieve fonts hosted online. Do not rely on every font being available offline.',
    },
    {
        id: 'font-license',
        icon: <Scale size={16} />,
        title: 'Can I use NoBadFonts typefaces in commercial projects?',
        description:
            'Usage rights depend on the individual typeface and its license. NoBadFonts does not grant additional font licenses. Always review the original license before using a font in personal or commercial projects.',
    },
    {
        id: 'sync-styles',
        icon: <CloudOff size={16} />,
        title: 'Can I sync my styles between browsers or devices?',
        description:
            'Automatic Google Drive synchronization is no longer available in version 1.0. You can manually transfer your styles between installations using the JSON backup and import options.',
    },
    {
        id: 'backup-styles',
        icon: <FileJson size={16} />,
        title: 'How do I back up or transfer my styles?',
        description:
            'Open the extension’s options page and navigate to Backup. Export your styles as a JSON file, then import that file from another NoBadFonts installation to restore them.',
    },
    {
        id: 'style-gallery',
        icon: <Layers size={16} />,
        title: 'Where did the Style Gallery go?',
        description:
            'The Style Gallery was removed in NoBadFonts 1.0. The current version focuses on the live editing experience and portable JSON backups instead.',
    },
    {
        id: 'font-library',
        icon: <RefreshCw size={16} />,
        title: 'Why is the font library not loading?',
        description:
            'Check your internet connection and try reopening the extension. If the library still does not load, the service may be temporarily unavailable. Report persistent issues with your browser and extension version.',
    },
    {
        id: 'account',
        icon: <KeyRound size={16} />,
        title: 'Do I need an account?',
        description:
            'No. The editor, font library, profiles, history and backup all work without signing in. Signing in is optional and only needed for account features.',
    },
    {
        id: 'disconnect',
        icon: <ShieldCheck size={16} />,
        title: 'How do I disconnect the extension from my account?',
        description:
            'Sign out in the extension to clear that browser, or revoke access for every device on the Connected apps page. A revoked access token can remain valid for up to an hour.',
    },
    {
        id: 'bug',
        icon: <Bug size={16} />,
        title: 'Something is broken. Where do I report it?',
        description:
            'Open an issue in the public extension repository with your browser, extension version and the site where it happened. Do not include passwords or private page content.',
    },
];

export default function Support() {
    return (
        <>
            <SEO
                title="Support | NoBadFonts"
                description="Get help with the NoBadFonts browser extension: common questions, backup, accounts and reporting bugs."
            />
            <div className="min-h-[80vh] px-4 py-16 sm:py-24 selection:bg-foreground selection:text-background">
                <div className="mx-auto max-w-3xl space-y-16">
                    <header className="space-y-4 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-foreground/10 bg-card-background text-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 26 26">
                                <path fill="currentColor" d="M13 0c-1.7 0-3 1.3-3 3v6c0 1.7 1.3 3 3 3h6l4 4v-4c1.7 0 3-1.3 3-3V3c0-1.7-1.3-3-3-3zm4.188 3h1.718l1.688 6h-1.5l-.407-1.5h-1.5L16.813 9H15.5zM18 4c-.1.4-.212.888-.313 1.188l-.28 1.312h1.187l-.282-1.313C18.113 4.888 18 4.4 18 4M3 10c-1.7 0-3 1.3-3 3v6c0 1.7 1.3 3 3 3v4l4-4h6c1.7 0 3-1.3 3-3v-6h-3c-1.9 0-3.406-1.3-3.906-3zm4.594 2.906c1.7 0 2.5 1.4 2.5 3c0 1.4-.481 2.288-1.281 2.688c.4.2.874.306 1.374.406l-.374 1c-.7-.2-1.426-.512-2.126-.813c-.1-.1-.275-.093-.375-.093C6.112 18.994 5 18 5 16c0-1.7.994-3.094 2.594-3.094m0 1.094c-.8 0-1.188.9-1.188 2c0 1.2.388 2 1.188 2s1.218-.9 1.218-2s-.418-2-1.218-2" />
                            </svg>

                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            Support
                        </h1>
                        <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                            Help with the NoBadFonts browser extension. Most answers
                            are below; the developer docs cover the internals.
                        </p>
                    </header>

                    <section className="space-y-4">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted/70">
                            Common questions
                        </h2>
                        <BouncyAccordion
                            items={FAQ_ITEMS}
                            collapsible
                        />
                    </section>

                    <section className="grid gap-3 sm:grid-cols-3">
                        <Link to="/docs" className="group rounded-2xl border border-transparent bg-card-background p-5 transition-colors hover:border-border duration-300 ease-in-out">
                            <span className="text-sm font-semibold text-foreground">
                                Documentation
                            </span>
                            <span className="mt-1 flex items-center gap-1 text-xs text-muted">
                                Guides and reference
                                <ArrowRight
                                    size={12}
                                    className="transition-transform group-hover:translate-x-0.5"
                                />
                            </span>
                        </Link>
                        <Link to="/settings/connected-apps" className="group rounded-2xl border border-transparent bg-card-background p-5 transition-colors hover:border-border duration-300 ease-in-out">
                            <span className="text-sm font-semibold text-foreground">
                                Connected apps
                            </span>
                            <span className="mt-1 flex items-center gap-1 text-xs text-muted">
                                Review and revoke access
                                <ArrowRight
                                    size={12}
                                    className="transition-transform group-hover:translate-x-0.5"
                                />
                            </span>
                        </Link>
                        <a
                            href="https://github.com/Bismay-exe/nobadfonts-extension/issues"
                            target="_blank"
                            rel="noreferrer"
                            className="group rounded-2xl border border-transparent bg-card-background p-5 transition-colors hover:border-border duration-300 ease-in-out"
                        >
                            <span className="text-sm font-semibold text-foreground">
                                Report a bug
                            </span>
                            <span className="mt-1 flex items-center gap-1 text-xs text-muted">
                                Open an issue on GitHub
                                <ArrowRight
                                    size={12}
                                    className="transition-transform group-hover:translate-x-0.5"
                                />
                            </span>
                        </a>
                    </section>

                    <section className="space-y-3 rounded-2xl bg-card-background border border-dashed border-foreground/20 p-5">
                        <h2 className="text-sm font-semibold text-foreground">
                            Contact
                        </h2>
                        <p className="text-sm leading-relaxed text-muted">
                            For account deletion, data requests or anything that
                            cannot go in a public issue, write to{' '}
                            <a
                                href="mailto:nobadfonts@gmail.com"
                                className="font-mono text-foreground underline underline-offset-2 transition-colors hover:text-foreground/80"
                            >
                                nobadfonts@gmail.com
                            </a>
                            .
                        </p>
                    </section>
                </div>
            </div>
        </>
    );
}
