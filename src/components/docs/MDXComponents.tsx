import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Hash } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { Callout } from './Callout';
import { FontPlaygroundEmbed } from './FontPlaygroundEmbed';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const headingBase: React.CSSProperties = {
  color: 'var(--color-foreground)',
  fontFamily: 'var(--font-bricolage-grotesque)',
};

export const MDX_COMPONENTS = {
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      style={{ ...headingBase, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem', marginTop: '0.5rem' }}
      {...props}
    >
      {children}
    </h1>
  ),

  h2: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = typeof children === 'string' ? children : '';
    const headingId = id || (text ? slugify(text) : undefined);
    return (
      <h2
        id={headingId}
        style={{
          ...headingBase,
          fontSize: '1.4rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginTop: '2.5rem',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          scrollMarginTop: '96px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
        className="group"
        {...props}
      >
        <span>{children}</span>
        {headingId && (
          <a
            href={`#${headingId}`}
            aria-label="Direct link to heading"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--color-muted)' }}
          >
            <Hash className="w-4 h-4" />
          </a>
        )}
      </h2>
    );
  },

  h3: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = typeof children === 'string' ? children : '';
    const headingId = id || (text ? slugify(text) : undefined);
    return (
      <h3
        id={headingId}
        style={{
          ...headingBase,
          fontSize: '1.15rem',
          fontWeight: 600,
          marginTop: '2rem',
          marginBottom: '0.75rem',
          scrollMarginTop: '96px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
        className="group"
        {...props}
      >
        <span>{children}</span>
        {headingId && (
          <a
            href={`#${headingId}`}
            aria-label="Direct link to heading"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--color-muted)' }}
          >
            <Hash className="w-3.5 h-3.5" />
          </a>
        )}
      </h3>
    );
  },

  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      style={{ color: 'var(--color-secondary)', lineHeight: 1.75, marginTop: '1rem', marginBottom: '1rem', fontSize: '15px' }}
      {...props}
    >
      {children}
    </p>
  ),

  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      style={{ color: 'var(--color-secondary)', paddingLeft: '1.5rem', marginTop: '1rem', marginBottom: '1rem', fontSize: '15px', listStyleType: 'disc' }}
      {...props}
    >
      {children}
    </ul>
  ),

  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      style={{ color: 'var(--color-secondary)', paddingLeft: '1.5rem', marginTop: '1rem', marginBottom: '1rem', fontSize: '15px', listStyleType: 'decimal' }}
      {...props}
    >
      {children}
    </ol>
  ),

  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li style={{ lineHeight: 1.7, marginTop: '0.35rem' }} {...props}>{children}</li>
  ),

  a: ({ href = '', children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isInternal = href.startsWith('/') || href.startsWith('#');
    const linkStyle: React.CSSProperties = {
      color: 'var(--color-foreground)',
      fontWeight: 500,
      textDecoration: 'underline',
      textUnderlineOffset: '3px',
    };
    if (isInternal) {
      return (
        <Link to={href} style={linkStyle} className="hover:opacity-70 transition-opacity" {...props}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
        className="inline-flex items-center gap-0.5 hover:opacity-70 transition-opacity"
        {...props}
      >
        <span>{children}</span>
        <ExternalLink className="w-3 h-3 ml-0.5" />
      </a>
    );
  },

  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      style={{
        borderLeft: '3px solid var(--color-border)',
        paddingLeft: '1rem',
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
        fontStyle: 'italic',
        color: 'var(--color-muted)',
      }}
      {...props}
    >
      {children}
    </blockquote>
  ),

  pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => {
    if (React.isValidElement(children)) {
      const codeProps = children.props as any;
      return (
        <CodeBlock className={codeProps.className} filename={codeProps.filename}>
          {codeProps.children}
        </CodeBlock>
      );
    }
    return <CodeBlock>{children}</CodeBlock>;
  },

  code: ({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) => {
    if (!className) {
      return (
        <code
          style={{
            padding: '2px 6px',
            margin: '0 2px',
            fontSize: '12px',
            fontFamily: 'monospace',
            fontWeight: 500,
            borderRadius: '6px',
            backgroundColor: 'color-mix(in srgb, var(--color-foreground) 7%, transparent)',
            color: 'var(--color-foreground)',
            border: '1px solid var(--color-border)',
          }}
          {...props}
        >
          {children}
        </code>
      );
    }
    return <code className={className} {...props}>{children}</code>;
  },

  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div
      className="my-6 w-full overflow-x-auto rounded-xl not-prose"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <table
        style={{ width: '100%', textAlign: 'left', fontSize: '14px', color: 'var(--color-secondary)' }}
        {...props}
      >
        {children}
      </table>
    </div>
  ),

  thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead
      style={{
        backgroundColor: 'var(--color-card-background)',
        borderBottom: '1px solid var(--color-border)',
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--color-muted)',
      }}
      {...props}
    >
      {children}
    </thead>
  ),

  th: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th style={{ padding: '10px 16px', fontWeight: 600 }} {...props}>{children}</th>
  ),

  td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      style={{
        padding: '10px 16px',
        borderBottom: '1px solid color-mix(in srgb, var(--color-border) 50%, transparent)',
        fontSize: '13px',
      }}
      {...props}
    >
      {children}
    </td>
  ),

  hr: () => (
    <hr style={{ marginTop: '2.5rem', marginBottom: '2.5rem', borderColor: 'var(--color-border)' }} />
  ),

  // Globally available in MDX without import
  Callout,
  CodeBlock,
  FontPlaygroundEmbed,
};
