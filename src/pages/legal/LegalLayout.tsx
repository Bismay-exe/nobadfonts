import { NavLink } from 'react-router-dom';
import SEO from '../../components/shared/SEO';

interface LegalLayoutProps {
    title: string;
    description: string;
    lastUpdated: string;
    kicker?: string;
    children: React.ReactNode;
}

const LEGAL_TABS = [
    { name: 'Terms of Service', path: '/legal/terms' },
    { name: 'Privacy Policy', path: '/legal/privacy' },
    { name: 'DMCA Takedown', path: '/legal/dmca' },
    { name: 'Cookie Policy', path: '/legal/cookies' },
];

export const LEGAL_STYLES = {
    h2: "text-lg md:text-3xl font-medium text-[rgb(var(--color-foreground))] tracking-tight",
    p: "text-[15px] leading-relaxed text-[rgb(var(--color-foreground)/0.8)]",
    strong: "font-medium text-[rgb(var(--color-foreground))]",
    a: "text-[rgb(var(--color-orange))] hover:underline underline-offset-4 font-medium transition-colors duration-300 ease-in-out",
    code: "text-xs bg-[rgb(var(--color-foreground)/0.06)] px-1.5 py-0.5 rounded font-mono text-[rgb(var(--color-foreground))]",
};

export function LegalH2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <h2 className={`${LEGAL_STYLES.h2} ${className}`}>{children}</h2>;
}

export function LegalP({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <p className={`${LEGAL_STYLES.p} ${className}`}>{children}</p>;
}

export default function LegalLayout({
    title,
    description,
    lastUpdated,
    children
}: LegalLayoutProps) {
    return (
        <div className="min-h-screen bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] py-6 sm:py-15 md:py-20 px-0 sm:px-4 md:px-8">
            <SEO title={`${title} | Legal`} description={description} />

            <div className="max-w-3xl mx-auto">
                {/* Back Link */}
                {/* <div className="mb-10">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out group"
                    >
                        <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-1" />
                        Back to Archive
                    </Link>
                </div> */}

                <div className="mb-10">
                    <p className='font-inter-tight text-[22px] text-[rgb(var(--color-secondary)/0.8)]'>Legal</p>
                </div>

                {/* Header */}
                <header className="mb-14 md:mb-24">
                    <h1 className="text-3xl md:text-5xl font-medium font-inter-tight text-[rgb(var(--color-foreground))] mb-3">
                        {title}
                    </h1>
                    <p className="text-[22px] font-light md:text-[22px] font-inter-tight text-[rgb(var(--color-secondary))] leading-relaxed mb-3">
                        {description}
                    </p>
                    <p className="text-md font-mono text-[rgb(var(--color-secondary)/0.6)]">
                        Last updated {lastUpdated}
                    </p>
                </header>

                {/* Policy Navigation Pills */}
                <nav className="flex flex-wrap gap-2 pb-6 mb-10 border-b border-[rgb(var(--color-foreground)/0.08)]">
                    {LEGAL_TABS.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className={({ isActive }) =>
                                `px-3.5 py-1.5 rounded-full text-xs transition-all ${isActive
                                    ? 'bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] font-medium shadow-sm'
                                    : 'text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] bg-[rgb(var(--color-foreground)/0.04)] hover:bg-[rgb(var(--color-foreground)/0.08)]'
                                }`
                            }
                        >
                            {tab.name}
                        </NavLink>
                    ))}
                </nav>

                {/* Main Content Body: Centralized typography classes for h2, p, strong, code, and links */}
                <main className="space-y-20 text-[22px] font-light leading-[1.75] text-[rgb(var(--color-secondary)/0.7)]
                    [&_h2]:text-3xl [&_h2]:md:text-4xl [&_h2]:font-inter-tight [&_h2]:font-normal [&_h2]:text-[rgb(var(--color-foreground))]
                    [&_p]:leading-normal [&_p]:md:leading-relaxed [&_p]:font-inter-tight
                    [&_strong]:font-light [&_strong]:text-[rgb(var(--color-foreground))]
                    [&_code]:text-[22px] [&_code]:bg-[rgb(var(--color-foreground)/0.06)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[rgb(var(--color-foreground)/0.9)]
                    [&_a]:text-[rgb(var(--color-orange))] [&_a]:hover:underline [&_a]:underline-offset-4 [&_a]:font-medium [&_a]:transition-colors duration-300 ease-in-out"
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
