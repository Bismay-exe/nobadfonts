import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DocItem } from '../../config/docsNav';

interface DocsPagerProps {
  prev: DocItem | null;
  next: DocItem | null;
}

export const DocsPager: React.FC<DocsPagerProps> = ({ prev, next }) => {
  if (!prev && !next) return null;

  const cardBase: React.CSSProperties = {
    border: '1px solid rgb(var(--color-border))',
    backgroundColor: 'rgb(var(--color-card)/0.5)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    color: 'inherit',
  };

  return (
    <div
      className="mt-16 pt-8 grid grid-cols-2 gap-4 not-prose font-inter-tight"
      style={{ borderTop: '1px solid rgb(var(--color-border))' }}
    >
      {prev ? (
        <Link
          to={`/docs/${prev.slug === 'introduction' ? '' : prev.slug}`}
          className="group"
          style={cardBase}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.backgroundColor = 'rgb(var(--color-foreground)/0.04)';
            el.style.borderColor = 'rgb(var(--color-foreground)/0.2)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.backgroundColor = 'rgb(var(--color-card)/0.5)';
            el.style.borderColor = 'rgb(var(--color-border))';
          }}
        >
          <span
            className="flex items-center gap-1.5 text-xs mb-1 transition-colors"
            style={{ color: 'rgb(var(--color-muted-foreground))' }}
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Previous
          </span>
          <span
            className="font-semibold text-sm transition-colors"
            style={{ color: 'rgb(var(--color-foreground))' }}
          >
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next && (
        <Link
          to={`/docs/${next.slug}`}
          className="group sm:items-end"
          style={{ ...cardBase, textAlign: 'right', alignItems: 'flex-end' }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.backgroundColor = 'rgb(var(--color-foreground)/0.04)';
            el.style.borderColor = 'rgb(var(--color-foreground)/0.2)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.backgroundColor = 'rgb(var(--color-card)/0.5)';
            el.style.borderColor = 'rgb(var(--color-border))';
          }}
        >
          <span
            className="flex items-center justify-end gap-1.5 text-xs mb-1 transition-colors"
            style={{ color: 'rgb(var(--color-muted-foreground))' }}
          >
            Next
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </span>
          <span
            className="font-semibold text-sm transition-colors"
            style={{ color: 'rgb(var(--color-foreground))' }}
          >
            {next.title}
          </span>
        </Link>
      )}
    </div>
  );
};
