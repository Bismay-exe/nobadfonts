import SEO from '../components/shared/SEO';
import { Link } from 'react-router-dom';

const VALUES = [
  {
    emoji: '🔍',
    title: 'Curated, not collected',
    body: 'Every font on NoBadFonts is hand-reviewed. We pick for quality, versatility, and legibility — not just novelty. If it\'s here, it\'s worth using.',
  },
  {
    emoji: '🆓',
    title: 'Free, forever',
    body: 'All fonts are free and open-source — licensed under OFL, Apache, MIT, or CC0. No paywalls, no subscriptions, no "premium tier".',
  },
  {
    emoji: '⚡',
    title: 'Built for how designers work',
    body: 'Live preview with your own text. Font pairing. CLI install. WOFF2 in the browser. We build the tools we wish existed.',
  },
  {
    emoji: '🌐',
    title: 'Open to everyone',
    body: 'Whether you\'re a freelancer, a startup, or a solo dev building something at midnight — NoBadFonts is for you.',
  },
];

const STACK = [
  { name: 'React 19', label: 'UI Framework' },
  { name: 'TypeScript', label: 'Language' },
  { name: 'Vite', label: 'Build Tool' },
  { name: 'Tailwind CSS v4', label: 'Styling' },
  { name: 'Supabase', label: 'Backend & Storage' },
  { name: 'Capacitor', label: 'Mobile (iOS & Android)' },
  { name: 'Framer Motion', label: 'Animations' },
  { name: 'GSAP + Lenis', label: 'Scroll & Parallax' },
];

const LINKS = [
  {
    label: 'Browse fonts',
    to: '/fonts',
    description: 'Explore the full catalogue',
  },
  {
    label: 'CLI docs',
    to: '/docs',
    description: 'Install fonts from your terminal',
  },
  {
    label: 'Changelog',
    to: '/changelog',
    description: 'See what\'s new',
  },
  {
    label: 'Support',
    to: '/support',
    description: 'Get help or report a bug',
  },
];

export default function About() {
  return (
    <>
      <SEO
        title="About — NoBadFonts"
        description="NoBadFonts is a curated archive of free and open-source typography built for designers, developers, and anyone who takes type seriously."
        url="/about"
      />

      <div className="min-h-screen bg-background px-4 pt-20 pb-32 sm:pt-28">
        <div className="mx-auto max-w-3xl space-y-24">

          {/* Hero */}
          <section>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/6 border border-foreground/10 text-xs font-medium text-muted mb-6">
              <span className="font-mono text-foreground/50">nbf</span>
              <span className="text-foreground/30">/</span>
              <span>about</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.05]">
              Typography shouldn't<br className="hidden sm:block" /> be a chore.
            </h1>

            <div className="mt-8 space-y-4 max-w-2xl">
              <p className="text-base sm:text-lg text-foreground/75 leading-relaxed">
                <strong className="text-foreground font-semibold">NoBadFonts</strong> is a curated archive of free and open-source typography built for designers, developers, and anyone who takes type seriously.
              </p>
              <p className="text-base text-muted leading-relaxed">
                Finding a good free font used to mean crawling through dozens of sites, downloading mystery ZIPs, and praying the license was actually open. We built the platform we wished existed — one that makes discovering, testing, and using quality typefaces fast and painless.
              </p>
              <p className="text-base text-muted leading-relaxed">
                Every font is hand-reviewed, every preview is interactive, and everything is free — always.
              </p>
            </div>
          </section>

          {/* Values */}
          <section className="space-y-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted/60">What we believe</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {VALUES.map((v) => (
                <div
                  key={v.title}
                  className="rounded-2xl border border-foreground/8 bg-card-background p-6 hover:border-foreground/16 transition-colors duration-300"
                >
                  <div className="text-2xl mb-3 leading-none">{v.emoji}</div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">{v.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{v.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Story */}
          <section className="rounded-2xl border border-foreground/8 bg-card-background p-8 sm:p-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted/60 mb-6">The story</h2>
            <div className="space-y-4 text-sm text-muted leading-relaxed">
              <p>
                NoBadFonts started as a personal project — a simple list of fonts worth using. But the more people asked for a recommendation, the more it became clear that the problem wasn't a shortage of free fonts. It was a shortage of a good way to find them.
              </p>
              <p>
                So we built the interactive preview. Then the font pairing tool. Then the CLI. Then boards for sharing collections. Each feature came from a real frustration — either our own, or one you told us about.
              </p>
              <p className="text-foreground/70">
                We're still building. If something's missing or broken,{' '}
                <Link to="/support" className="text-foreground underline underline-offset-2 hover:text-accent transition-colors">
                  let us know
                </Link>
                . This is a living product and you're part of shaping it.
              </p>
            </div>
          </section>

          {/* Stack */}
          <section className="space-y-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted/60">Built with</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STACK.map((s) => (
                <div
                  key={s.name}
                  className="flex flex-col gap-0.5 rounded-xl border border-foreground/8 bg-card-background px-4 py-3"
                >
                  <span className="text-sm font-medium text-foreground">{s.name}</span>
                  <span className="text-xs text-muted">{s.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted/50 leading-relaxed">
              The full source for the CLI is open on GitHub. The web app and mobile clients share 99% of the same codebase via Capacitor.
            </p>
          </section>

          {/* Numbers / Stats */}
          <section className="rounded-2xl border border-foreground/8 bg-card-background overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-foreground/8">
              {[
                { value: '100+', label: 'Curated fonts' },
                { value: '100%', label: 'Free & open-source' },
                { value: '3', label: 'Platforms' },
              ].map((stat) => (
                <div key={stat.label} className="px-6 py-8 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{stat.value}</div>
                  <div className="mt-1 text-xs text-muted">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick links */}
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted/60">Explore</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-foreground/8 bg-card-background px-5 py-4 hover:border-foreground/20 hover:bg-foreground/[0.02] transition-all duration-200"
                >
                  <div>
                    <div className="text-sm font-semibold text-foreground group-hover:text-foreground transition-colors">{link.label}</div>
                    <div className="text-xs text-muted mt-0.5">{link.description}</div>
                  </div>
                  <svg
                    className="shrink-0 text-muted/40 group-hover:text-foreground/60 group-hover:translate-x-0.5 transition-all duration-200"
                    xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>

          {/* Bottom note */}
          <footer className="pt-6 border-t border-foreground/8">
            <p className="text-xs text-muted/50 leading-relaxed">
              NoBadFonts is an independent project. We're not affiliated with any font foundry.
              All trademarks belong to their respective owners. Font licenses are set by their designers — always check before commercial use.
            </p>
          </footer>

        </div>
      </div>
    </>
  );
}
