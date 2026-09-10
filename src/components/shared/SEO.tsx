import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    imageAlt?: string;
    imageWidth?: number;
    imageHeight?: number;
    url?: string;
    type?: string;
    keywords?: string[];
    schema?: Record<string, any> | Record<string, any>[];
    author?: string;
    twitterHandle?: string;
    noindex?: boolean;
}

const SEO: React.FC<SEOProps> = ({
    title = 'NoBadFonts - Curated Typography for Modern Interfaces',
    description = 'Browse and download high-quality free fonts. Preview, test, and download TTF, OTF, and WOFF2 formats for web and design projects.',
    image = 'https://nobadfonts.in/banner/banner.png', // Fallback image
    imageAlt = 'NoBadFonts — Typography for Modern Interfaces',
    imageWidth = 1200,
    imageHeight = 630,
    url = 'https://nobadfonts.in',
    type = 'website',
    keywords = [],
    schema,
    author,
    twitterHandle = '@nobadfonts',
    noindex = false
}) => {
    const siteTitle = 'NoBadFonts';
    const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;

    // Ensure URL is absolute
    const absoluteUrl = url.startsWith('http') ? url : `https://nobadfonts.in${url}`;
    const absoluteImage = image.startsWith('http') ? image : `https://nobadfonts.in${image}`;

    // Format JSON-LD schema
    const structuredData = schema
        ? Array.isArray(schema)
            ? { '@context': 'https://schema.org', '@graph': schema }
            : (schema['@context'] ? schema : { '@context': 'https://schema.org', ...schema })
        : null;

    return (
        <Helmet>
            {/* Standard Metrics */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={['fonts', 'typography', 'design', 'web fonts', 'curated fonts', 'free fonts', ...keywords].join(', ')} />
            {author && <meta name="author" content={author} />}
            <link rel="canonical" href={absoluteUrl} />
            {noindex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            )}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={absoluteUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={absoluteImage} />
            <meta property="og:image:alt" content={imageAlt} />
            <meta property="og:image:width" content={String(imageWidth)} />
            <meta property="og:image:height" content={String(imageHeight)} />
            <meta property="og:site_name" content={siteTitle} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={absoluteUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={absoluteImage} />
            <meta name="twitter:image:alt" content={imageAlt} />
            {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
            {twitterHandle && <meta name="twitter:creator" content={twitterHandle} />}

            {/* Structured Data (JSON-LD) */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
};

export default React.memo(SEO);
