import LicenseInfo from '../fonts/LicenseInfo';
import type { Font } from '../../types/font';
import type { Database } from '../../types/database.types';

type FontResearchRow = Database['public']['Tables']['font_research']['Row'];

interface FontIntegrationSectionProps {
    font: Font;
    research?: FontResearchRow | null;
}

export default function FontIntegrationSection({ font, research }: FontIntegrationSectionProps) {
    const generateFontFace = (name: string, weight: number, style: string, urls: any) => {
        const sources = [];
        if (urls.eot) sources.push(`url("${urls.eot}") format("embedded-opentype")`);
        if (urls.woff2) sources.push(`url("${urls.woff2}") format("woff2")`);
        if (urls.woff) sources.push(`url("${urls.woff}") format("woff")`);
        if (urls.ttf) sources.push(`url("${urls.ttf}") format("truetype")`);
        if (urls.otf) sources.push(`url("${urls.otf}") format("opentype")`);
        if (urls.svg) sources.push(`url("${urls.svg}") format("svg")`);

        if (sources.length === 0) return '';

        return `@font-face {\n  font-family: "${name}";\n  src: ${sources.join(',\n       ')};\n  font-weight: ${weight};\n  font-style: ${style};\n}`;
    };

    const variants = font.font_variants || [];
    const blocks = variants.map(v => {
        const name = font.name;
        const lower = v.variant_name.toLowerCase();
        let weight = 400;
        if (lower.includes('thin')) weight = 100;
        else if (lower.includes('extra light')) weight = 200;
        else if (lower.includes('light')) weight = 300;
        else if (lower.includes('regular')) weight = 400;
        else if (lower.includes('medium')) weight = 500;
        else if (lower.includes('semi bold')) weight = 600;
        else if (lower.includes('bold')) weight = 700;
        else if (lower.includes('extra bold')) weight = 800;
        else if (lower.includes('black') || lower.includes('heavy')) weight = 900;

        const style = lower.includes('italic') ? 'italic' : 'normal';

        const urls = {
            woff2: v.woff2_url,
            woff: v.woff_url,
            ttf: v.ttf_url,
            otf: v.otf_url
        };

        return generateFontFace(name, weight, style, urls);
    }).filter(Boolean);

    if (blocks.length === 0 && (font.woff2_url || font.ttf_url)) {
        blocks.push(generateFontFace(font.name, 400, 'normal', {
            woff2: font.woff2_url,
            woff: font.woff_url,
            ttf: font.ttf_url,
            otf: font.otf_url
        }));
    }

    const fontFaceCSS = blocks.join('\n\n');

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
                <h2 className="text-2xl font-bold uppercase tracking-widest text-[rgb(var(--color-muted-foreground))]">
                    Integration
                </h2>
                <div className="h-px bg-[rgb(var(--color-foreground)/0.1)] flex-1"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <section
                    id="embed-section"
                    className="bg-[rgb(var(--color-card,var(--color-muted)))] border border-[rgb(var(--color-foreground)/0.05)] rounded-[2.5rem] overflow-hidden scroll-mt-24 h-full"
                >
                    <div className="p-8 space-y-8">
                        {/* Option 1: Head Link */}
                        <div>
                            <h3 className="font-bold text-lg mb-3 text-[rgb(var(--color-foreground))]">
                                1. Add to the head section of web page
                            </h3>
                            <div className="bg-[rgb(var(--color-background)/0.5)] rounded-2xl border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground)/0.7)] text-sm font-mono p-5 overflow-x-auto whitespace-pre shadow-inner">
                                {`<link href="${window.location.origin}/css/${font.slug}" rel="stylesheet">`}
                            </div>
                        </div>

                        {/* Option 2: Import */}
                        <div>
                            <h3 className="font-bold text-lg mb-3 text-[rgb(var(--color-foreground))]">
                                OR Using @import CSS directive
                            </h3>
                            <div className="bg-[rgb(var(--color-background)/0.5)] rounded-2xl border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground)/0.7)] text-sm font-mono p-5 overflow-x-auto whitespace-pre shadow-inner">
                                {`@import url(${window.location.origin}/css/${font.slug});`}
                            </div>
                        </div>

                        {/* Option 3: Font Face */}
                        <div>
                            <h3 className="font-bold text-lg mb-3 text-[rgb(var(--color-foreground))]">
                                OR Use font-face declaration
                            </h3>
                            <div className="bg-[rgb(var(--color-background)/0.5)] rounded-2xl border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-highlight))] text-sm font-mono p-5 overflow-x-auto whitespace-pre shadow-inner">
                                {fontFaceCSS}
                            </div>
                        </div>

                        {/* Section 2: CSS Rules */}
                        <div>
                            <h3 className="font-bold text-lg mb-3 text-[rgb(var(--color-foreground))]">
                                2. CSS rules to specify fonts
                            </h3>
                            <div className="bg-[rgb(var(--color-background)/0.5)] rounded-2xl border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-highlight))] text-sm font-mono p-5 overflow-x-auto whitespace-pre shadow-inner">
                                {`font-family: "${font.name}", sans-serif;`}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="space-y-6">
                    <div className="bg-[rgb(var(--color-card,var(--color-muted)))] border border-[rgb(var(--color-foreground)/0.05)] rounded-[2.5rem] p-8">
                        <h3 className="font-bold text-2xl mb-6 text-[rgb(var(--color-foreground))] uppercase tracking-wider">
                            Font Stats
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-[rgb(var(--color-foreground)/0.05)] p-4 rounded-xl">
                                <span className="text-[rgb(var(--color-muted-foreground))] font-medium">Downloads</span>
                                <span className="font-bold text-[rgb(var(--color-foreground))] text-xl">
                                    {font.downloads?.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-[rgb(var(--color-foreground)/0.05)] p-4 rounded-xl">
                                <span className="text-[rgb(var(--color-muted-foreground))] font-medium">Favorites</span>
                                <span className="font-bold text-[rgb(var(--color-foreground))] text-xl capitalize">
                                    {font.favorites_count?.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <LicenseInfo font={font} research={research} />
                </div>
            </div>
        </div>
    );
}
