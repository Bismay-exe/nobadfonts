/**
 * Thoroughly sanitizes and cleans URLs provided in JSON, AI outputs, or Markdown copy-paste.
 * 
 * Handles:
 * - Markdown links: `[title](https://example.com)` or `[https://example.com](https://example.com)`
 * - Prepended site prefixes: `https://www.nobadfonts.in/fonts/[https://example.com](https://example.com)`
 * - Stray brackets/parentheses: `<url>`, `(url)`, `[url]`, `url)`, `url]`
 * - Missing protocol: `example.com/path` -> `https://example.com/path`
 * - Trailing punctuation: `url.`, `url,`, `url;`
 */
export function cleanUrl(rawUrl: string | null | undefined): string | null {
    if (!rawUrl || typeof rawUrl !== 'string') return null;

    let url = rawUrl.trim();
    if (!url || url.toLowerCase() === 'null' || url.toLowerCase() === 'undefined' || url.toLowerCase() === 'n/a') {
        return null;
    }

    // 1. If wrapped in markdown link syntax: [Title](https://...) or [url](url)
    const mdMatch = url.match(/\[.*?\]\((https?:\/\/[^\s\)]+|[^\s\)]+)\)/);
    if (mdMatch) {
        url = mdMatch[1].trim();
    }

    // 2. If it contains a nested/embedded URL after a site prefix (e.g. 'https://www.nobadfonts.in/fonts/...')
    if (url.includes('/fonts/http') || url.includes('/fonts/[http')) {
        const idx = url.indexOf('/fonts/');
        if (idx !== -1) {
            url = url.slice(idx + 7).trim();
            const innerMd = url.match(/\[.*?\]\((https?:\/\/[^\s\)]+|[^\s\)]+)\)/);
            if (innerMd) {
                url = innerMd[1].trim();
            }
        }
    }

    // 3. Remove leading/trailing wrapper characters: <, >, (, ), [, ], ", ', `
    url = url.replace(/^[<(\["'`]+|[>)\]"'`]+$/g, '').trim();

    // 4. Remove accidental trailing punctuation often left by copy-pasting from sentences or lists
    url = url.replace(/[),;.]+$/, '').trim();

    if (!url) return null;

    // 5. Ensure valid protocol: if missing http:// or https://, prepend https://
    if (/^(mailto:|tel:|javascript:)/i.test(url)) {
        return null;
    }

    if (!/^https?:\/\//i.test(url)) {
        if (url.startsWith('//')) {
            url = `https:${url}`;
        } else {
            url = `https://${url}`;
        }
    }

    // 6. Final verification through standard URL constructor
    try {
        const parsed = new URL(url);
        // Ensure valid domain with at least one dot or localhost
        if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
            return null;
        }
        return parsed.toString();
    } catch {
        return null;
    }
}

/**
 * Clean URL and return a concise, readable domain representation for UI cards.
 */
export function formatUrlForDisplay(rawUrl: string | null | undefined): string {
    const cleaned = cleanUrl(rawUrl);
    if (!cleaned) return '';
    try {
        const parsed = new URL(cleaned);
        return parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
    } catch {
        return cleaned.replace(/^https?:\/\//, '');
    }
}
