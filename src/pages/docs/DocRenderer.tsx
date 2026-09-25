import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MDX_COMPONENTS } from '../../components/docs/MDXComponents';
import { DocsBreadcrumbs } from '../../components/docs/DocsBreadcrumbs';
import { DocsPager } from '../../components/docs/DocsPager';
import { DocsTableOfContents } from '../../components/docs/DocsTableOfContents';
import { DocsNotFound } from './DocsNotFound';
import { getDocItemBySlug, getPrevNextDoc } from '../../config/docsNav';

// Dynamically discover all MDX files in src/content/docs/
const mdxModules = import.meta.glob<{
  default: React.ComponentType<{ components?: Record<string, any> }>;
  frontmatter?: {
    title?: string;
    description?: string;
    badge?: string;
    order?: number;
    [key: string]: unknown;
  };
}>('/src/content/docs/**/*.mdx');

interface DocRendererProps {
  defaultSlug?: string;
}

export const DocRenderer: React.FC<DocRendererProps> = ({ defaultSlug }) => {
  const params = useParams();
  const location = useLocation();

  const rawPath = params['*'] || defaultSlug || '';
  const currentSlug = rawPath.replace(/^\/+|\/+$/g, '') || 'introduction';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [MDXComponent, setMDXComponent] = useState<React.ComponentType<{ components?: Record<string, any> }> | null>(null);
  const [frontmatter, setFrontmatter] = useState<Record<string, any>>({});

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    const targetPath = `/src/content/docs/${currentSlug}.mdx`;
    const targetModuleLoader = mdxModules[targetPath];

    if (!targetModuleLoader) {
      if (isMounted) { setLoading(false); setError(true); }
      return;
    }

    targetModuleLoader()
      .then((mod) => {
        if (isMounted) {
          setMDXComponent(() => mod.default);
          setFrontmatter(mod.frontmatter || {});
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(`Failed to load docs at ${targetPath}:`, err);
        if (isMounted) { setError(true); setLoading(false); }
      });

    return () => { isMounted = false; };
  }, [currentSlug]);

  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [currentSlug, location.hash]);

  const navItem = getDocItemBySlug(currentSlug);
  const pageTitle = frontmatter.title || navItem?.title || 'Documentation';
  const pageDescription = frontmatter.description || navItem?.description || 'NoBadFonts Documentation';
  const { prev, next } = getPrevNextDoc(currentSlug);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 py-8">
        {[['w-1/4', 'h-4', 'mb-6'], ['w-3/4', 'h-8', 'mb-4'], ['w-full', 'h-4', ''], ['w-5/6', 'h-4', '']].map(([w, h, mb], i) => (
          <div
            key={i}
            className={`${h} ${w} ${mb} rounded`}
            style={{ backgroundColor: 'rgb(var(--color-card))' }}
          />
        ))}
        <div className="h-32 rounded-xl mt-6" style={{ backgroundColor: 'rgb(var(--color-card))' }} />
      </div>
    );
  }

  if (error || !MDXComponent) {
    return <DocsNotFound />;
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle} — NoBadFonts Docs</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={`${pageTitle} — NoBadFonts Docs`} />
        <meta property="og:description" content={pageDescription} />
      </Helmet>

      {/* Breadcrumbs */}
      <DocsBreadcrumbs category={navItem?.category} title={pageTitle} />

      {/* Mobile/tablet inline TOC (< 1024px) */}
      <div
        className="lg:hidden my-6 p-4 rounded-xl not-prose"
        style={{
          border: '1px solid rgb(var(--color-border))',
          backgroundColor: 'rgb(var(--color-card)/0.5)',
        }}
      >
        <DocsTableOfContents />
      </div>

      {/* MDX Article Content */}
      <article className="font-bricolage-grotesque">
        <MDXComponent components={MDX_COMPONENTS} />
      </article>

      {/* Prev / Next Pager */}
      <DocsPager prev={prev} next={next} />
    </>
  );
};

export default DocRenderer;
