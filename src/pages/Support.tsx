import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Bug,
    HelpCircle,
    KeyRound,
    LifeBuoy,
    Palette,
    ShieldCheck,
} from 'lucide-react';
import SEO from '../components/shared/SEO';

const FAQ = [
    {
        icon: Palette,
        question: 'How do I change a font on a site?',
        answer:
            'Open NoBadFonts from the toolbar, pick an element, then choose a typeface from the font library or write CSS yourself. Changes apply immediately and are saved for that site.',
    },
    {
        icon: HelpCircle,
        question: 'Where did sync and the gallery go?',
        answer:
            'NoBadFonts 1.0 removes Google Drive sync and the style gallery. Use Backup in the options page to export and import your styles as a JSON file.',
    },
    {
        icon: KeyRound,
        question: 'Do I need an account?',
        answer:
            'No. The editor, font library, profiles, history and backup all work without signing in. Signing in is optional and only needed for account features.',
    },
    {
        icon: ShieldCheck,
        question: 'How do I disconnect the extension from my account?',
        answer:
            'Sign out in the extension to clear that browser, or revoke access for every device on the Connected apps page. A revoked access token can remain valid for up to an hour.',
    },
    {
        icon: Bug,
        question: 'Something is broken. Where do I report it?',
        answer:
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
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-foreground/10 bg-card-background">
                            <LifeBuoy className="text-foreground" size={22} />
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
                        <div className="space-y-3">
                            {FAQ.map(({ icon: Icon, question, answer }) => (
                                <article
                                    key={question}
                                    className="rounded-2xl border border-foreground/10 bg-card-background p-5"
                                >
                                    <div className="flex items-start gap-3">
                                        <Icon
                                            className="mt-0.5 shrink-0 text-muted"
                                            size={18}
                                        />
                                        <div className="space-y-1.5">
                                            <h3 className="text-sm font-semibold text-foreground">
                                                {question}
                                            </h3>
                                            <p className="text-sm leading-relaxed text-muted">
                                                {answer}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="grid gap-3 sm:grid-cols-3">
                        <Link
                            to="/docs"
                            className="group rounded-2xl border border-foreground/10 bg-card-background p-5 transition-colors hover:border-foreground/20"
                        >
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
                        <Link
                            to="/settings/connected-apps"
                            className="group rounded-2xl border border-foreground/10 bg-card-background p-5 transition-colors hover:border-foreground/20"
                        >
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
                            className="group rounded-2xl border border-foreground/10 bg-card-background p-5 transition-colors hover:border-foreground/20"
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

                    <section className="space-y-3 rounded-2xl border border-dashed border-foreground/20 p-5">
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
