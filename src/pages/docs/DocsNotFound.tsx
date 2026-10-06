import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export const DocsNotFound: React.FC = () => {
  return (
    <div className="py-20 text-center max-w-md mx-auto font-bricolage-grotesque">
      <div
        className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-card-background)', color: 'var(--color-muted)' }}
      >
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1
        className="text-2xl font-bold mb-2"
        style={{ color: 'var(--color-foreground)' }}
      >
        Doc Page Not Found
      </h1>
      <p
        className="text-sm mb-6"
        style={{ color: 'var(--color-muted)' }}
      >
        The documentation page you requested does not exist or may have been moved.
      </p>
      <div className="flex items-center justify-center gap-3 font-inter-tight">
        <Link
          to="/docs"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
          style={{
            backgroundColor: 'var(--color-foreground)',
            color: 'var(--color-background)',
          }}
        >
          <Home className="w-4 h-4" />
          Docs Home
        </Link>
        <Link
          to="/fonts"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-foreground)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-card-background)'}
          onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>
      </div>
    </div>
  );
};
