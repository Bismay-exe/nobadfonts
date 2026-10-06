import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DocsBreadcrumbsProps {
  category?: string;
  title: string;
}

export const DocsBreadcrumbs: React.FC<DocsBreadcrumbsProps> = ({ category, title }) => {
  return (
    <nav
      aria-label="Breadcrumbs"
      className="flex items-center gap-1.5 text-xs mb-6 font-inter-tight"
      style={{ color: 'var(--color-muted)' }}
    >
      <Link
        to="/docs"
        className="flex items-center gap-1 transition-colors"
        style={{ color: 'var(--color-muted)' }}
        onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-foreground)'}
        onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-muted)'}
      >
        <Home className="w-3.5 h-3.5" />
        <span>Docs</span>
      </Link>
      {category && (
        <>
          <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'var(--color-border)' }} />
          <span className="truncate">{category}</span>
        </>
      )}
      <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'var(--color-border)' }} />
      <span
        className="font-semibold truncate"
        style={{ color: 'var(--color-foreground)' }}
      >
        {title}
      </span>
    </nav>
  );
};
