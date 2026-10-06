import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Search, BookOpen, Terminal, Sparkles, Compass, Layers } from 'lucide-react';
import { DOCS_NAVIGATION } from '../../config/docsNav';

interface DocsSidebarProps {
  onItemClick?: () => void;
  onOpenSearch: () => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Getting Started': BookOpen,
  'CLI Companion': Terminal,
  'NoBadFonts MCP': Sparkles,
  'Typography Guides': Compass,
  'Community & Open Source': Layers,
};

export const DocsSidebar: React.FC<DocsSidebarProps> = ({ onItemClick, onOpenSearch }) => {
  const location = useLocation();
  const currentPath = location.pathname.replace(/^\/docs\/?/, '').replace(/\/$/, '') || 'introduction';

  return (
    <aside className="w-full flex flex-col h-full font-inter-tight">
      {/* Search Trigger */}
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl border transition-all"
          style={{
            color: 'var(--color-muted)',
            backgroundColor: 'var(--color-card-background)',
            borderColor: 'var(--color-border)',
          }}
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
            <span>Search docs...</span>
          </span>
          <kbd
            className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded"
            style={{
              backgroundColor: 'var(--color-muted)',
              color: 'var(--color-muted)',
            }}
          >
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 text-sm">
        {DOCS_NAVIGATION.map((category) => {
          const CategoryIcon = CATEGORY_ICONS[category.title] || BookOpen;

          return (
            <div key={category.title} className="space-y-1.5">
              {/* Category Label */}
              <div
                className="flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-muted)' }}
              >
                <CategoryIcon className="w-3.5 h-3.5" />
                <span>{category.title}</span>
              </div>

              {/* Items */}
              <div className="space-y-0.5">
                {category.items.map((item) => {
                  const toPath = `/docs/${item.slug === 'introduction' ? '' : item.slug}`;
                  const isActive = currentPath === item.slug;

                  return (
                    <NavLink
                      key={item.slug}
                      to={toPath}
                      onClick={onItemClick}
                      className="group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        backgroundColor: isActive ? 'color-mix(in srgb, var(--color-foreground) 8%, transparent)' : 'transparent',
                        color: isActive ? 'var(--color-foreground)' : 'var(--color-muted)',
                        fontWeight: isActive ? '600' : '500',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'color-mix(in srgb, var(--color-foreground) 5%, transparent)';
                          (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-foreground)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
                          (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-muted)';
                        }
                      }}
                    >
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <span
                          className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: isActive ? 'color-mix(in srgb, var(--color-foreground) 15%, transparent)' : 'var(--color-muted)',
                            color: isActive ? 'var(--color-foreground)' : 'var(--color-muted)',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};
