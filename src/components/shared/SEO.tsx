import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    keywords?: string[];
}

const SEO: React.FC<SEOProps> = ({
    title = 'NoBadFonts - Curated Typography for Modern Interfaces',
    description = 'Browse and download high-quality free fonts. Preview, test, and download TTF, OTF, and WOFF2 formats for web and design projects.',
    image = 'https://nobadfonts.in/banner/banner.png', // Fallback image
    url = 'https://nobadfonts.in',
    type = 'website',
    keywords = []
}) => {
    const siteTitle = 'NoBadFonts';
    const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;

    // Ensure URL is absolute
    const absoluteUrl = url.startsWith('http') ? url : `https://nobadfonts.in${url}`;
    const absoluteImage = image.startsWith('http') ? image : `https://nobadfonts.in${image}`;

    return (
        <Helmet>
            {/* Standard Metrics */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={['fonts', 'typography', 'design', 'web fonts', 'curated fonts', ...keywords].join(', ')} />
            <link rel="canonical" href={absoluteUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={absoluteUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={absoluteImage} />
            <meta property="og:site_name" content={siteTitle} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={absoluteUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={absoluteImage} />
        </Helmet>
    );
};

export default React.memo(SEO);
