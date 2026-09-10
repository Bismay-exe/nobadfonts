"use client";

import SEO from '../components/shared/SEO';
import { useLenis } from '../hooks/useLenis';
import Hero from '../components/home/Hero/1';

const HOME_SCHEMAS = [
    {
        '@type': 'WebSite',
        '@id': 'https://nobadfonts.in/#website',
        name: 'NoBadFonts',
        url: 'https://nobadfonts.in',
        description: 'A curated archive of free and open-source typography. Preview, test, and download high-quality fonts for modern interfaces.',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://nobadfonts.in/fonts?query={search_term_string}'
            },
            'query-input': 'required name=search_term_string'
        }
    },
    {
        '@type': 'Organization',
        '@id': 'https://nobadfonts.in/#organization',
        name: 'NoBadFonts',
        url: 'https://nobadfonts.in',
        logo: 'https://nobadfonts.in/logo/logo.png',
        sameAs: [
            'https://github.com',
            'https://twitter.com',
            'https://instagram.com'
        ]
    }
];

export default function Home() {
    useLenis();
    return (
        <div className="flex flex-col">
            <SEO
                title="NoBadFonts — Free Curated Typography for Modern Interfaces"
                description="Browse, preview, and download 100% free and open-source fonts. Interactive glyph maps, live type testing, and zero-dependency ZIP packages."
                url="/"
                schema={HOME_SCHEMAS}
            />
            <Hero />
        </div>
    );
}
