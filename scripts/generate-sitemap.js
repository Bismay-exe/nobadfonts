
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const DOMAIN = 'https://nobadfonts.in';

async function generateSitemap() {
    console.log('Generating sitemap...');

    const staticRoutes = [
        '',
        '/fonts',
        '/pairing',
        '/auth',
        '/upload',
        '/profile',
        '/members',
        '/cli'
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // 1. Static Routes
    staticRoutes.forEach(route => {
        xml += `
    <url>
        <loc>${DOMAIN}${route}</loc>
        <changefreq>daily</changefreq>
        <priority>${route === '' ? '1.0' : '0.8'}</priority>
    </url>`;
    });

    // 2. Dynamic Fonts
    const { data: fonts, error: fontsError } = await supabase
        .from('fonts')
        .select('id, slug, updated_at')
        .eq('is_published', true);

    if (fontsError) {
        console.error('Error fetching fonts:', fontsError);
    } else {
        fonts?.forEach(font => {
            // Prefer slug if available, otherwise ID (update FontDetails to support slug if needed, but assuming ID for now based on routes)
            // The route is /fonts/:id currently.
            xml += `
    <url>
        <loc>${DOMAIN}/fonts/${font.slug || font.id}</loc>
        <lastmod>${new Date(font.updated_at).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>`;
        });
        console.log(`Added ${fonts?.length || 0} fonts.`);
    }

    // 3. Dynamic Designers (Group by designer)
    const { data: designers, error: designersError } = await supabase
        .from('fonts')
        .select('designer')
        .eq('is_published', true);

    if (designersError) {
        console.error('Error fetching designers:', designersError);
    } else {
        const uniqueDesigners = [...new Set(designers?.map(f => f.designer).filter(Boolean))];
        uniqueDesigners.forEach(designer => {
            xml += `
    <url>
        <loc>${DOMAIN}/designers/${encodeURIComponent(designer)}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>`;
        });
        console.log(`Added ${uniqueDesigners.length} designers.`);
    }

    xml += `
</urlset>`;

    // Ensure public directory exists
    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
    console.log(`Sitemap generated at ${path.join(publicDir, 'sitemap.xml')}`);
}

generateSitemap();
