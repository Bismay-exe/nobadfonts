import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AlignLeft } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

export const DocsTableOfContents: React.FC = () => {
  const [headings, setHeadings] = useState<TocHeading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const location = useLocation();
  const observerRef = useRef<IntersectionObserver | null>(null);

  const scanHeadings = useCallback(() => {
    const container = document.getElementById('docs-content-container');
    if (!container) return;

    const elements = Array.from(container.querySelectorAll('h2, h3'));
    const extracted: TocHeading[] = elements
      .map((el) => {
        let id = el.id;
        const text = el.textContent?.replace(/#/g, '').trim() || '';
        if (!id && text) {
          id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          el.id = id;
        }
        return { id, text, level: Number(el.tagName.replace('H', '')) };
      })
      .filter((h) => h.id && h.text);

    setHeadings(extracted);
    if (extracted.length > 0) {
      setActiveId((prev) => (extracted.some((h) => h.id === prev) ? prev : extracted[0].id));
    }
  }, []);

  useEffect(() => {
    scanHeadings();
    const t1 = setTimeout(scanHeadings, 150);
    const t2 = setTimeout(scanHeadings, 500);
    const container = document.getElementById('docs-content-container');
    let mo: MutationObserver | null = null;
    if (container) {
      mo = new MutationObserver(scanHeadings);
      mo.observe(container, { childList: true, subtree: true });
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (mo) mo.disconnect();
    };
  }, [location.pathname, scanHeadings]);

  useEffect(() => {
    if (headings.length === 0) return;
    if (observerRef.current) observerRef.current.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: '-80px 0% -65% 0%', threshold: 0.1 }
    );
    observerRef.current = observer;
    headings.forEach((h) => { const el = document.getElementById(h.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', `#${id}`);
      setActiveId(id);
    }
  };

  return (
    <div className="space-y-3 font-inter-tight">
      <div
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-muted)' }}
      >
        <AlignLeft className="w-3.5 h-3.5" />
        On this page
      </div>

      {headings.length === 0 ? (
        <p className="text-xs italic" style={{ color: 'var(--color-muted)' }}>
          No sections on this page
        </p>
      ) : (
        <nav
          className="space-y-0.5 text-[13px] border-l ml-1 pl-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {headings.map((h) => {
            const isActive = activeId === h.id;
            return (
              <a
                key={h.id}
                href={`#${h.id}`}
                onClick={(e) => handleClick(e, h.id)}
                className="block py-1 transition-all leading-snug truncate"
                style={{
                  paddingLeft: h.level === 3 ? '12px' : '0',
                  fontSize: h.level === 3 ? '11px' : '13px',
                  color: isActive ? 'var(--color-foreground)' : 'var(--color-muted)',
                  fontWeight: isActive ? '600' : '400',
                  borderLeft: isActive ? '2px solid var(--color-foreground)' : '2px solid transparent',
                  marginLeft: isActive ? '-13px' : '0',
                  paddingRight: '4px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-foreground)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-muted)';
                }}
              >
                {h.text}
              </a>
            );
          })}
        </nav>
      )}
    </div>
  );
};
