import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const DOMAIN = 'https://nobadfonts.in';
const DEFAULT_BANNER = `${DOMAIN}/banner/banner.png`;

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function renderHtml(meta: {
    title: string;
    description: string;
    image: string;
    url: string;
}): string {
    const safeTitle = escapeHtml(meta.title);
    const safeDesc = escapeHtml(meta.description);
    const safeImage = escapeHtml(meta.image);
    const safeUrl = escapeHtml(meta.url);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <link rel="canonical" href="${safeUrl}" />

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="NoBadFonts" />
  <meta property="og:url" content="${safeUrl}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:image:secure_url" content="${safeImage}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${safeTitle}" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@nobadfonts" />
  <meta name="twitter:url" content="${safeUrl}" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />
  <meta name="twitter:image:alt" content="${safeTitle}" />
</head>
<body>
  <h1>${safeTitle}</h1>
  <p>${safeDesc}</p>
  <img src="${safeImage}" alt="${safeTitle}" style="max-width: 100%; height: auto;" />
  <script>
    // Seamless client-side redirection if opened by a human browser
    window.location.replace("${safeUrl}");
  </script>
</body>
</html>`;
}

export default async function handler(req: any, res: any) {
    try {
        const slugParam = req.query.slug;
        const rawSlug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
        const cleanSlug = rawSlug ? String(rawSlug).trim().replace(/^\/+|\/+$/g, '') : '';

        // If no slug provided, return default site metadata
        if (!cleanSlug) {
            const defaultHtml = renderHtml({
                title: 'NoBadFonts — Curated Typography for Modern Interfaces',
                description: 'A meticulously curated archive of 100% free and open-source typography. Browse, preview, and download high-quality fonts for modern interfaces.',
                image: DEFAULT_BANNER,
                url: `${DOMAIN}/fonts`
            });
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
            return res.status(200).send(defaultHtml);
        }

        let ogImage = DEFAULT_BANNER;
        let fontName = cleanSlug;
        let designer = '';
        let description = '';
        let canonicalUrl = `${DOMAIN}/fonts/${cleanSlug}`;

        if (SUPABASE_URL && SUPABASE_ANON_KEY) {
            const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);
            const column = isUuid ? 'id' : 'slug';

            const { data: font } = await supabase
                .from('fonts')
                .select('id, name, slug, designer, description, tags, og_image_url, gallery_images, preview_image_url')
                .eq(column, cleanSlug)
                .maybeSingle();

            if (font) {
                fontName = font.name || fontName;
                designer = font.designer || '';
                canonicalUrl = `${DOMAIN}/fonts/${font.slug || font.id}`;

                // Three-tier OG image fallback:
                // 1. Custom generated OG image
                // 2. 1st gallery image
                // 3. preview_image_url
                // 4. Default site banner
                if (font.og_image_url && typeof font.og_image_url === 'string' && font.og_image_url.trim()) {
                    ogImage = font.og_image_url.trim();
                } else if (Array.isArray(font.gallery_images) && font.gallery_images.length > 0 && font.gallery_images[0]) {
                    ogImage = font.gallery_images[0];
                } else if (font.preview_image_url && typeof font.preview_image_url === 'string' && font.preview_image_url.trim()) {
                    ogImage = font.preview_image_url.trim();
                }

                if (font.description && typeof font.description === 'string') {
                    description = font.description.slice(0, 160);
                }
            }
        }

        // Ensure image URL is absolute
        if (ogImage.startsWith('/')) {
            ogImage = `${DOMAIN}${ogImage}`;
        }

        const title = `${fontName}${designer ? ` by ${designer}` : ''} — Free Font Download | NoBadFonts`;
        const finalDesc = description || `Download ${fontName}${designer ? ` by ${designer}` : ''}. Free typography package with WOFF2, TTF/OTF formats on NoBadFonts.`;

        const html = renderHtml({
            title,
            description: finalDesc,
            image: ogImage,
            url: canonicalUrl
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).send(html);
    } catch (err: any) {
        console.error('Error generating OG meta tags:', err);
        const fallbackHtml = renderHtml({
            title: 'NoBadFonts — Curated Typography for Modern Interfaces',
            description: 'A meticulously curated archive of 100% free and open-source typography. Browse, preview, and download high-quality fonts for modern interfaces.',
            image: DEFAULT_BANNER,
            url: `${DOMAIN}/fonts`
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(fallbackHtml);
    }
}
