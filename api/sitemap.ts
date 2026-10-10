import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const DOMAIN = 'https://nobadfonts.in';

const staticRoutes = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: '/fonts', priority: '0.9', changefreq: 'daily' },
    { path: '/pairing', priority: '0.8', changefreq: 'weekly' },
    { path: '/members', priority: '0.7', changefreq: 'weekly' },
    { path: '/cli', priority: '0.7', changefreq: 'monthly' },
    // Legal & Compliance Routes
    { path: '/legal/terms', priority: '0.5', changefreq: 'yearly' },
    { path: '/legal/privacy', priority: '0.5', changefreq: 'yearly' },
    { path: '/legal/dmca', priority: '0.5', changefreq: 'yearly' },
    { path: '/legal/cookies', priority: '0.5', changefreq: 'yearly' },
    // Curated Category Landing Paths
    { path: '/fonts?categories=sans', priority: '0.8', changefreq: 'daily' },
    { path: '/fonts?categories=serif', priority: '0.8', changefreq: 'daily' },
    { path: '/fonts?categories=slab-serif', priority: '0.7', changefreq: 'weekly' },
    { path: '/fonts?categories=display', priority: '0.8', changefreq: 'daily' },
    { path: '/fonts?categories=monospace', priority: '0.7', changefreq: 'weekly' },
    { path: '/fonts?categories=script', priority: '0.7', changefreq: 'weekly' }
];

export default async function handler(req: any, res: any) {
    try {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // 1. Static & Category Routes
        for (const route of staticRoutes) {
            const urlLoc = `${DOMAIN}${route.path}`.replace(/&/g, '&amp;');
            xml += `\n    <url>\n        <loc>${urlLoc}</loc>\n        <changefreq>${route.changefreq}</changefreq>\n        <priority>${route.priority}</priority>\n    </url>`;
        }

        // 2. Fetch live published fonts and designers from Supabase
        if (SUPABASE_URL && SUPABASE_ANON_KEY) {
            const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Fetch fonts
            const { data: fonts } = await supabase
                .from('fonts')
                .select('id, slug, updated_at')
                .eq('is_published', true)
            .neq('family_role', 'parent');

            if (fonts && fonts.length > 0) {
                for (const font of fonts) {
                    const slugOrId = font.slug || font.id;
                    const lastmod = font.updated_at ? new Date(font.updated_at).toISOString() : new Date().toISOString();
                    xml += `\n    <url>\n        <loc>${DOMAIN}/fonts/${slugOrId}</loc>\n        <lastmod>${lastmod}</lastmod>\n        <changefreq>weekly</changefreq>\n        <priority>0.9</priority>\n    </url>`;
                }
            }

            // Fetch designers
            const { data: designers } = await supabase
                .from('fonts')
                .select('designer')
                .eq('is_published', true);

            if (designers && designers.length > 0) {
                const uniqueDesigners = [...new Set(designers.map(f => f.designer).filter(Boolean))];
                for (const designer of uniqueDesigners) {
                    xml += `\n    <url>\n        <loc>${DOMAIN}/designers/${encodeURIComponent(designer)}</loc>\n        <changefreq>weekly</changefreq>\n        <priority>0.7</priority>\n    </url>`;
                }
            }
        }

        xml += `\n</urlset>`;

        // Set response headers for XML and Vercel CDN Edge Caching
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader(
            'Cache-Control',
            'public, s-maxage=3600, stale-while-revalidate=86400'
        );
        return res.status(200).send(xml);
    } catch (error) {
        console.error('Error generating dynamic sitemap:', error);
        // Fallback minimal sitemap on unexpected error
        const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n    <url>\n        <loc>${DOMAIN}</loc>\n        <changefreq>daily</changefreq>\n        <priority>1.0</priority>\n    </url>\n    <url>\n        <loc>${DOMAIN}/fonts</loc>\n        <changefreq>daily</changefreq>\n        <priority>0.9</priority>\n    </url>\n</urlset>`;
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        return res.status(200).send(fallbackXml);
    }
}
