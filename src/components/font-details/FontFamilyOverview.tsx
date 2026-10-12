import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Layers3 } from 'lucide-react';
import type { Font } from '../../types/font';

const SUBFAMILY_ORDER = ['Neon', 'Argon', 'Krypton', 'Radon', 'Xenon'];

function sortSubfamilies(fonts: NonNullable<Font['subfamilies']>) {
  return [...fonts].sort((a, b) => {
    const aName = a.name.replace(/^Monaspace\s+/i, '');
    const bName = b.name.replace(/^Monaspace\s+/i, '');
    const aIndex = SUBFAMILY_ORDER.indexOf(aName);
    const bIndex = SUBFAMILY_ORDER.indexOf(bName);
    if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

export default function FontFamilyOverview({ font }: { font: Font }) {
  const subfamilies = sortSubfamilies(font.subfamilies || []);

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-background">
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-24 md:px-8 md:pt-32">
        <Link
          to="/fonts"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to fonts
        </Link>

        <header className="mt-12 border-b border-foreground/10 pb-10 md:mt-16 md:pb-14">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted">
            <Layers3 size={15} />
            Font family
          </div>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight md:text-7xl">{font.name}</h1>
          {font.description && (
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted md:text-lg">{font.description}</p>
          )}
          <p className="mt-5 text-sm text-muted">
            {subfamilies.length} {subfamilies.length === 1 ? 'subfamily' : 'subfamilies'} in this family
          </p>
        </header>

        <section className="mt-10 md:mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Explore the family</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Subfamilies</h2>
            </div>
          </div>

          {subfamilies.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {subfamilies.map((subfamily) => (
                <Link
                  key={subfamily.id}
                  to={`/fonts/${subfamily.slug}`}
                  className="group flex min-h-28 items-center justify-between gap-5 rounded-2xl border border-border p-5 transition-colors hover:border-border hover:bg-card-background md:p-6"
                >
                  <div className="min-w-0">
                    <h3 className="text-lg font-medium tracking-tight">{subfamily.name}</h3>
                    <p className="mt-1 text-sm text-muted">View styles and font files</p>
                  </div>
                  <ArrowUpRight size={18} className="shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-foreground/15 p-8 text-sm text-muted">
              Subfamilies have not been linked to this family yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
