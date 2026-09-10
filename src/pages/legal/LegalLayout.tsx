import { NavLink, Link } from 'react-router-dom';
import SEO from '../../components/shared/SEO';
import { ShieldCheck, FileText, Scale, Cookie, ArrowLeft } from 'lucide-react';

interface LegalLayoutProps {
    title: string;
    description: string;
    lastUpdated: string;
    children: React.ReactNode;
}

const LEGAL_TABS = [
    { name: 'Terms of Service', path: '/legal/terms', icon: Scale },
    { name: 'Privacy Policy', path: '/legal/privacy', icon: ShieldCheck },
    { name: 'DMCA Takedown', path: '/legal/dmca', icon: FileText },
    { name: 'Cookie Policy', path: '/legal/cookies', icon: Cookie },
];

export default function LegalLayout({ title, description, lastUpdated, children }: LegalLayoutProps) {
    return (
        <div className="min-h-screen bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] py-8 md:py-16 px-4 md:px-8">
            <SEO title={`${title} | Legal`} description={description} />

            <div className="max-w-4xl mx-auto">
                {/* Back Link */}
                <div className="mb-8">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors group"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        Back to Archive
                    </Link>
                </div>

                {/* Header */}
                <div className="border-b border-[rgb(var(--color-border))] pb-8 mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-muted-foreground))] mb-4">
                        Legal & Compliance
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                        {title}
                    </h1>
                    <p className="text-lg text-[rgb(var(--color-muted-foreground))] max-w-2xl leading-relaxed mb-4">
                        {description}
                    </p>
                    <p className="text-xs font-mono text-[rgb(var(--color-muted-foreground)/0.7)] uppercase tracking-wider">
                        Last Updated: {lastUpdated}
                    </p>
                </div>

                {/* Policy Tabs */}
                <div className="flex flex-wrap gap-2 mb-12 p-1.5 bg-[rgb(var(--color-card))] rounded-2xl border border-[rgb(var(--color-border))]">
                    {LEGAL_TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        isActive
                                            ? 'bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] shadow-sm'
                                            : 'text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.05)]'
                                    }`
                                }
                            >
                                <Icon size={16} />
                                {tab.name}
                            </NavLink>
                        );
                    })}
                </div>

                {/* Content Container */}
                <article className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-[rgb(var(--color-foreground)/0.9)] leading-relaxed">
                    {children}
                </article>

                {/* Contact Box */}
                <div className="mt-16 p-6 md:p-8 rounded-3xl bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="font-bold text-lg mb-1 text-[rgb(var(--color-foreground))]">Have legal questions or takedown inquiries?</h3>
                        <p className="text-sm text-[rgb(var(--color-muted-foreground))]">Our legal and support team reviews all requests within 24–48 hours.</p>
                    </div>
                    <a
                        href="mailto:legal@nobadfonts.in"
                        className="px-5 py-2.5 rounded-full font-bold text-sm bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                        Contact Legal Team
                    </a>
                </div>
            </div>
        </div>
    );
}
