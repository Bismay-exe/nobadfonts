import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import SEO from '../components/shared/SEO';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface TemplateFont {
    id: string;
    name: string;
    woff2_url?: string;
    woff_url?: string;
}

const SAMPLE_TEMPLATES = [
    {
        id: 'portfolio',
        name: 'Personal Portfolio',
        emoji: '🎨',
        html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:var(--body-font,'Georgia'),serif;background:#fafafa;color:#1a1a1a;line-height:1.6}
  nav{display:flex;align-items:center;justify-content:space-between;padding:20px 40px;border-bottom:1px solid #eee;background:#fff}
  .logo{font-family:var(--heading-font,'Georgia'),serif;font-size:24px;font-weight:700;letter-spacing:-0.5px}
  .nav-links{display:flex;gap:28px;list-style:none}
  .nav-links a{text-decoration:none;color:#555;font-size:14px;font-weight:500;font-family:var(--body-font,'Georgia'),serif}
  .hero{padding:100px 40px 80px;text-align:center;background:linear-gradient(135deg,#fff 0%,#f8f8ff 100%)}
  .hero h1{font-family:var(--heading-font,'Georgia'),serif;font-size:clamp(48px,8vw,96px);font-weight:800;letter-spacing:-2px;line-height:1;margin-bottom:24px;color:#0a0a0a}
  .hero p{font-size:18px;color:#666;max-width:540px;margin:0 auto 36px;font-family:var(--body-font,'Georgia'),serif}
  .hero-cta{display:inline-block;padding:14px 32px;background:#0a0a0a;color:#fff;border-radius:50px;text-decoration:none;font-weight:600;font-size:15px;font-family:var(--body-font,'Georgia'),serif}
  .work{padding:80px 40px;max-width:1100px;margin:0 auto}
  .work h2{font-family:var(--heading-font,'Georgia'),serif;font-size:clamp(28px,4vw,48px);font-weight:700;margin-bottom:48px;color:#0a0a0a;letter-spacing:-1px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px}
  .card{background:#fff;border-radius:16px;padding:32px;border:1px solid #eee;transition:transform 0.2s}
  .card:hover{transform:translateY(-4px)}
  .card-title{font-family:var(--heading-font,'Georgia'),serif;font-size:20px;font-weight:700;margin-bottom:8px;color:#0a0a0a}
  .card-desc{font-size:14px;color:#888;line-height:1.6;font-family:var(--body-font,'Georgia'),serif}
  .card-tag{display:inline-block;padding:4px 12px;background:#f0f0f0;border-radius:50px;font-size:12px;font-weight:600;margin-top:16px;color:#555}
</style>
</head>
<body>
<nav>
  <div class="logo">Alex Studio</div>
  <ul class="nav-links">
    <li><a href="#">Work</a></li>
    <li><a href="#">About</a></li>
    <li><a href="#">Services</a></li>
    <li><a href="#">Contact</a></li>
  </ul>
</nav>
<div class="hero">
  <h1>Design that<br>moves people</h1>
  <p>Brand identity, UI/UX, and visual storytelling for ambitious companies.</p>
  <a href="#" class="hero-cta">View My Work</a>
</div>
<div class="work">
  <h2>Selected Work</h2>
  <div class="grid">
    <div class="card">
      <div class="card-title">Brand Identity System</div>
      <div class="card-desc">Complete visual identity for a sustainable fashion startup, including logo, color system, and typography.</div>
      <div class="card-tag">Branding</div>
    </div>
    <div class="card">
      <div class="card-title">Mobile App Design</div>
      <div class="card-desc">End-to-end product design for a fintech app serving over 200k users across Southeast Asia.</div>
      <div class="card-tag">UI/UX</div>
    </div>
    <div class="card">
      <div class="card-title">Editorial Design</div>
      <div class="card-desc">Annual report design for a global NGO, balancing impact storytelling with clean information hierarchy.</div>
      <div class="card-tag">Print</div>
    </div>
  </div>
</div>
</body>
</html>`,
    },
    {
        id: 'blog',
        name: 'Blog Article',
        emoji: '📝',
        html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:var(--body-font,'Georgia'),serif;background:#fff;color:#1a1a1a;max-width:680px;margin:0 auto;padding:40px 24px}
  .category{font-family:var(--body-font,'Georgia'),serif;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#888;margin-bottom:20px}
  h1{font-family:var(--heading-font,'Georgia'),serif;font-size:clamp(32px,5vw,52px);font-weight:800;line-height:1.1;letter-spacing:-1.5px;margin-bottom:24px;color:#0a0a0a}
  .meta{display:flex;align-items:center;gap:12px;margin-bottom:36px;padding-bottom:24px;border-bottom:1px solid #eee}
  .avatar{width:36px;height:36px;border-radius:50%;background:#e0e0e0}
  .author{font-family:var(--body-font,'Georgia'),serif;font-size:14px;font-weight:600;color:#333}
  .date{font-family:var(--body-font,'Georgia'),serif;font-size:13px;color:#888}
  p{font-family:var(--body-font,'Georgia'),serif;font-size:18px;line-height:1.75;color:#2a2a2a;margin-bottom:24px}
  h2{font-family:var(--heading-font,'Georgia'),serif;font-size:28px;font-weight:700;letter-spacing:-0.5px;margin:48px 0 20px;color:#0a0a0a}
  blockquote{margin:36px 0;padding:24px 32px;border-left:3px solid #0a0a0a;background:#f8f8f8}
  blockquote p{font-style:italic;font-size:20px;color:#333;margin:0}
</style>
</head>
<body>
<div class="category">Design × Typography</div>
<h1>Why Great Type Choices Define Great Brands</h1>
<div class="meta">
  <div class="avatar"></div>
  <div>
    <div class="author">Sarah Chen</div>
    <div class="date">September 26, 2026 · 8 min read</div>
  </div>
</div>
<p>Typography is the backbone of every design system. Before colors, before imagery, before layout — type defines the voice of a brand. Yet it's often the most underappreciated craft in the studio.</p>
<p>The difference between a forgettable brand and a memorable one can sometimes be traced to a single typeface decision. That's not an overstatement; it's the lived experience of every designer who's spent hours wrestling with which font family feels right.</p>
<h2>The Hierarchy Principle</h2>
<p>Every great typographic system starts with a clear hierarchy. Headings command attention. Body text invites reading. Labels and captions support without competing. When these three levels work in harmony, readers absorb information naturally, often without noticing the effort behind it.</p>
<blockquote>
  <p>"Typography is what language looks like." — Ellen Lupton</p>
</blockquote>
<p>Contrast is the engine of hierarchy. Size contrast, weight contrast, and spacing contrast all contribute to guiding the reader's eye through the page in the intended order.</p>
<h2>Pairing Typefaces</h2>
<p>The classic approach is to pair a serif with a sans-serif. The logic is simple: the distinct personalities of each style create contrast that keeps the design lively without becoming chaotic. Headings in a high-contrast display serif, body in a clean geometric sans — it almost always works.</p>
</body>
</html>`,
    },
    {
        id: 'product',
        name: 'Product Landing Page',
        emoji: '🚀',
        html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:var(--body-font,'Inter'),sans-serif;background:#0a0a0a;color:#fff}
  nav{display:flex;align-items:center;justify-content:space-between;padding:20px 40px}
  .logo{font-family:var(--heading-font,'Inter'),sans-serif;font-size:20px;font-weight:800;letter-spacing:-0.5px;color:#fff}
  .nav-links{display:flex;gap:24px;list-style:none}
  .nav-links a{text-decoration:none;color:#aaa;font-size:14px;font-family:var(--body-font,'Inter'),sans-serif}
  .cta-btn{padding:10px 20px;background:#fff;color:#0a0a0a;border-radius:8px;font-size:14px;font-weight:700;font-family:var(--body-font,'Inter'),sans-serif;text-decoration:none}
  .hero{padding:120px 40px 100px;text-align:center}
  .badge{display:inline-block;padding:6px 16px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:50px;font-size:12px;font-weight:600;margin-bottom:32px;color:#ccc;font-family:var(--body-font,'Inter'),sans-serif}
  .hero h1{font-family:var(--heading-font,'Inter'),sans-serif;font-size:clamp(44px,7vw,88px);font-weight:900;letter-spacing:-3px;line-height:1;margin-bottom:24px}
  .hero p{font-size:18px;color:#888;max-width:520px;margin:0 auto 40px;line-height:1.6;font-family:var(--body-font,'Inter'),sans-serif}
  .btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
  .btn-primary{padding:14px 28px;background:#fff;color:#0a0a0a;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;font-family:var(--body-font,'Inter'),sans-serif}
  .btn-secondary{padding:14px 28px;border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;font-family:var(--body-font,'Inter'),sans-serif}
  .features{padding:80px 40px;max-width:1100px;margin:0 auto}
  .features h2{font-family:var(--heading-font,'Inter'),sans-serif;font-size:clamp(28px,4vw,44px);font-weight:800;letter-spacing:-1.5px;margin-bottom:48px;text-align:center}
  .feat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}
  .feat-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px}
  .feat-icon{font-size:28px;margin-bottom:16px}
  .feat-title{font-family:var(--heading-font,'Inter'),sans-serif;font-size:18px;font-weight:700;margin-bottom:8px}
  .feat-desc{font-size:14px;color:#777;line-height:1.6;font-family:var(--body-font,'Inter'),sans-serif}
</style>
</head>
<body>
<nav>
  <div class="logo">Nexus</div>
  <ul class="nav-links">
    <li><a href="#">Features</a></li>
    <li><a href="#">Pricing</a></li>
    <li><a href="#">Docs</a></li>
  </ul>
  <a href="#" class="cta-btn">Start Free</a>
</nav>
<div class="hero">
  <div class="badge">✦ Now in public beta</div>
  <h1>Build faster.<br>Ship smarter.</h1>
  <p>The all-in-one platform that gives your team superpowers. From planning to production in one place.</p>
  <div class="btns">
    <a href="#" class="btn-primary">Get started free</a>
    <a href="#" class="btn-secondary">See a demo →</a>
  </div>
</div>
<div class="features">
  <h2>Everything you need</h2>
  <div class="feat-grid">
    <div class="feat-card">
      <div class="feat-icon">⚡</div>
      <div class="feat-title">Blazing Fast</div>
      <div class="feat-desc">Sub-second load times globally. Built on edge infrastructure with smart caching.</div>
    </div>
    <div class="feat-card">
      <div class="feat-icon">🔒</div>
      <div class="feat-title">Enterprise Security</div>
      <div class="feat-desc">SOC 2 Type II certified with end-to-end encryption and fine-grained access controls.</div>
    </div>
    <div class="feat-card">
      <div class="feat-icon">🎛️</div>
      <div class="feat-title">Full Control</div>
      <div class="feat-desc">Customize everything. Integrate with your existing stack through our open API.</div>
    </div>
  </div>
</div>
</body>
</html>`,
    },
    {
        id: 'restaurant',
        name: 'Restaurant Menu',
        emoji: '🍽️',
        html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:var(--body-font,'Georgia'),serif;background:#faf8f5;color:#1a1208;max-width:820px;margin:0 auto;padding:40px 24px}
  .restaurant-name{font-family:var(--heading-font,'Georgia'),serif;font-size:clamp(48px,8vw,80px);font-weight:800;letter-spacing:-2px;text-align:center;margin-bottom:8px;color:#0a0802}
  .tagline{text-align:center;font-size:14px;letter-spacing:0.25em;text-transform:uppercase;color:#888;margin-bottom:60px;font-family:var(--body-font,'Georgia'),serif}
  .divider{display:flex;align-items:center;gap:16px;margin:40px 0 32px}
  .divider::before,.divider::after{content:'';flex:1;height:1px;background:#d8c9a8}
  .section-title{font-family:var(--heading-font,'Georgia'),serif;font-size:24px;font-weight:700;color:#0a0802;letter-spacing:0.05em}
  .menu-item{display:flex;align-items:baseline;gap:8px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #ede8dd}
  .item-name{font-family:var(--heading-font,'Georgia'),serif;font-size:18px;font-weight:700;color:#0a0802;flex:1}
  .item-desc{font-family:var(--body-font,'Georgia'),serif;font-size:13px;color:#888;margin-top:4px;display:block;line-height:1.5}
  .item-price{font-family:var(--heading-font,'Georgia'),serif;font-size:16px;font-weight:700;color:#6b4226;white-space:nowrap}
  .item-badge{font-size:10px;background:#f4e8d8;color:#8b5e34;padding:2px 8px;border-radius:50px;font-weight:600;margin-left:8px;vertical-align:middle;font-family:var(--body-font,'Georgia'),serif}
</style>
</head>
<body>
<div class="restaurant-name">La Maison</div>
<div class="tagline">Fine dining · Farm to table · Est. 1998</div>
<div class="divider"><span class="section-title">Starters</span></div>
<div class="menu-item"><div><div class="item-name">Burrata Crostini<span class="item-badge">Chef's Pick</span></div><span class="item-desc">Fresh burrata, heirloom tomato, basil oil, fleur de sel, grilled sourdough.</span></div><div class="item-price">$18</div></div>
<div class="menu-item"><div><div class="item-name">Smoked Salmon Rillette</div><span class="item-desc">House-cured salmon, crème fraîche, caviar, dill, blini.</span></div><div class="item-price">$22</div></div>
<div class="menu-item"><div><div class="item-name">Truffle Arancini</div><span class="item-desc">Risotto croquettes, black truffle, aged parmesan, lemon aioli.</span></div><div class="item-price">$16</div></div>
<div class="divider"><span class="section-title">Mains</span></div>
<div class="menu-item"><div><div class="item-name">Duck Confit<span class="item-badge">Signature</span></div><span class="item-desc">12-hour slow-cooked duck leg, cherry jus, haricots verts, pomme purée.</span></div><div class="item-price">$46</div></div>
<div class="menu-item"><div><div class="item-name">Pan Seared Halibut</div><span class="item-desc">Wild-caught Pacific halibut, saffron beurre blanc, fennel, heirloom carrots.</span></div><div class="item-price">$52</div></div>
<div class="menu-item"><div><div class="item-name">Filet Mignon</div><span class="item-desc">8oz prime tenderloin, truffle butter, seasonal vegetables, bordelaise.</span></div><div class="item-price">$68</div></div>
<div class="divider"><span class="section-title">Desserts</span></div>
<div class="menu-item"><div><div class="item-name">Crème Brûlée</div><span class="item-desc">Classic Madagascar vanilla custard, caramelized sugar, seasonal berries.</span></div><div class="item-price">$14</div></div>
<div class="menu-item"><div><div class="item-name">Chocolate Fondant</div><span class="item-desc">Warm Valrhona chocolate lava cake, Tahitian vanilla ice cream.</span></div><div class="item-price">$16</div></div>
</body>
</html>`,
    },
];

const FONT_LOAD_CACHE = new Map<string, boolean>();

function loadFontFace(name: string, url: string): Promise<void> {
    if (FONT_LOAD_CACHE.get(name)) return Promise.resolve();
    const face = new FontFace(name, `url('${url}')`);
    return face.load().then(loaded => {
        document.fonts.add(loaded);
        FONT_LOAD_CACHE.set(name, true);
    }).catch(() => {});
}

export default function TypeSwap() {
    const [fonts, setFonts] = useState<TemplateFont[]>([]);
    const [fontsLoading, setFontsLoading] = useState(true);
    const [activeTemplate, setActiveTemplate] = useState(SAMPLE_TEMPLATES[0].id);
    const [headingFont, setHeadingFont] = useState<TemplateFont | null>(null);
    const [bodyFont, setBodyFont] = useState<TemplateFont | null>(null);
    const [headingSearch, setHeadingSearch] = useState('');
    const [bodySearch, setBodySearch] = useState('');
    const [headingPickerOpen, setHeadingPickerOpen] = useState(false);
    const [bodyPickerOpen, setBodyPickerOpen] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const template = SAMPLE_TEMPLATES.find(t => t.id === activeTemplate) || SAMPLE_TEMPLATES[0];

    useEffect(() => {
        supabase
            .from('fonts')
            .select('id, name, slug, font_variants(variant_name, woff2_url, woff_url)')
            .order('name')
            .limit(200)
            .then(({ data }) => {
                const list: TemplateFont[] = (data || []).map((f: any) => {
                    const variants = f.font_variants || [];
                    const regular = variants.find((v: any) => v.variant_name === 'Regular') || variants[0];
                    return {
                        id: f.id,
                        name: f.name,
                        slug: f.slug,
                        woff2_url: regular?.woff2_url,
                        woff_url: regular?.woff_url,
                    };
                });
                setFonts(list);
                setFontsLoading(false);
            });
    }, []);

    // Inject fonts into iframe when they change
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const injectFonts = async () => {
            if (headingFont) {
                const url = headingFont.woff2_url || headingFont.woff_url;
                if (url) await loadFontFace(headingFont.name, url);
            }
            if (bodyFont) {
                const url = bodyFont.woff2_url || bodyFont.woff_url;
                if (url) await loadFontFace(bodyFont.name, url);
            }

            const doc = iframe.contentDocument;
            if (!doc) return;

            // Remove old injected style
            const old = doc.getElementById('nbf-font-overrides');
            if (old) old.remove();

            const headingFontUrl = headingFont?.woff2_url || headingFont?.woff_url;
            const bodyFontUrl = bodyFont?.woff2_url || bodyFont?.woff_url;

            const style = doc.createElement('style');
            style.id = 'nbf-font-overrides';
            style.textContent = `
                ${headingFont && headingFontUrl ? `@font-face { font-family: '${headingFont.name}'; src: url('${headingFontUrl}'); }` : ''}
                ${bodyFont && bodyFontUrl ? `@font-face { font-family: '${bodyFont.name}'; src: url('${bodyFontUrl}'); }` : ''}
                :root {
                    --heading-font: '${headingFont?.name || 'Georgia'}';
                    --body-font: '${bodyFont?.name || 'Georgia'}';
                }
            `;
            doc.head.appendChild(style);
        };

        // Small delay to let iframe load
        const t = setTimeout(injectFonts, 100);
        return () => clearTimeout(t);
    }, [headingFont, bodyFont]);

    const filteredHeading = useMemo(() =>
        fonts.filter(f => f.name.toLowerCase().includes(headingSearch.toLowerCase())).slice(0, 50),
        [fonts, headingSearch]
    );

    const filteredBody = useMemo(() =>
        fonts.filter(f => f.name.toLowerCase().includes(bodySearch.toLowerCase())).slice(0, 50),
        [fonts, bodySearch]
    );

    return (
        <div className="min-h-screen bg-background pt-16">
            <SEO
                title="Typography Swap — Preview Fonts on Real Layouts | NoBadFonts"
                description="Paste a design template and instantly swap heading and body fonts from NoBadFonts to see how they look in context."
            />

            <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
                {/* Sidebar */}
                <aside className="w-full lg:w-80 xl:w-96 shrink-0 border-r border-border/50 overflow-y-auto bg-card-background/50 backdrop-blur-sm">
                    <div className="p-5 border-b border-border/30">
                        <h1 className="text-lg font-black text-foreground">Typography Swap</h1>
                        <p className="text-xs text-muted mt-0.5">Preview fonts on real layouts</p>
                    </div>

                    <div className="p-4 space-y-5">
                        {/* Template picker */}
                        <div>
                            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Layout Template</label>
                            <div className="grid grid-cols-2 gap-2">
                                {SAMPLE_TEMPLATES.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveTemplate(t.id)}
                                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all flex items-center gap-2 ${
                                            activeTemplate === t.id
                                                ? 'bg-foreground text-background'
                                                : 'bg-foreground/5 text-foreground hover:bg-foreground/8'
                                        }`}
                                    >
                                        <span>{t.emoji}</span>
                                        <span className="truncate">{t.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Heading font */}
                        <FontSelectorDropdown
                            label="Heading Font"
                            selected={headingFont}
                            search={headingSearch}
                            onSearchChange={setHeadingSearch}
                            isOpen={headingPickerOpen}
                            onToggle={() => { setHeadingPickerOpen(v => !v); setBodyPickerOpen(false); }}
                            fonts={filteredHeading}
                            loading={fontsLoading}
                            onSelect={(font) => { setHeadingFont(font); setHeadingPickerOpen(false); setHeadingSearch(''); }}
                            onClear={() => setHeadingFont(null)}
                        />

                        {/* Body font */}
                        <FontSelectorDropdown
                            label="Body Font"
                            selected={bodyFont}
                            search={bodySearch}
                            onSearchChange={setBodySearch}
                            isOpen={bodyPickerOpen}
                            onToggle={() => { setBodyPickerOpen(v => !v); setHeadingPickerOpen(false); }}
                            fonts={filteredBody}
                            loading={fontsLoading}
                            onSelect={(font) => { setBodyFont(font); setBodyPickerOpen(false); setBodySearch(''); }}
                            onClear={() => setBodyFont(null)}
                        />

                        {/* Quick swaps */}
                        <div>
                            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Quick Swap</label>
                            <button
                                onClick={() => { setHeadingFont(null); setBodyFont(null); }}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted hover:bg-foreground/5 hover:text-foreground transition-colors"
                            >
                                <RefreshCw size={14} />
                                Reset to defaults
                            </button>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="m-4 p-4 rounded-2xl bg-foreground/3 border border-border/30">
                        <p className="text-xs text-muted leading-relaxed">
                            <strong className="text-foreground">How it works:</strong> Select a layout template and assign heading and body fonts. The iframe preview updates instantly — no page reload needed.
                        </p>
                    </div>
                </aside>

                {/* Preview */}
                <main className="flex-1 overflow-hidden bg-card-background/30">
                    <div className="h-full p-4">
                        <iframe
                            ref={iframeRef}
                            srcDoc={template.html}
                            title="Typography Preview"
                            className="w-full h-full rounded-2xl border border-border/30 bg-white shadow-sm"
                            sandbox="allow-same-origin"
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}

function FontSelectorDropdown({
    label, selected, search, onSearchChange, isOpen, onToggle, fonts, loading, onSelect, onClear,
}: {
    label: string;
    selected: TemplateFont | null;
    search: string;
    onSearchChange: (v: string) => void;
    isOpen: boolean;
    onToggle: () => void;
    fonts: TemplateFont[];
    loading: boolean;
    onSelect: (f: TemplateFont) => void;
    onClear: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                if (isOpen) onToggle();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onToggle]);

    return (
        <div ref={ref}>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">{label}</label>
            <div className="relative">
                <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-foreground/5 hover:bg-foreground/8 border border-border/50 transition-colors text-sm"
                >
                    <span
                        className="truncate"
                        style={selected ? { fontFamily: `'${selected.name}', sans-serif` } : {}}
                    >
                        {selected?.name || `Choose ${label.toLowerCase()}...`}
                    </span>
                    <div className="flex items-center gap-1">
                        {selected && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onClear(); }}
                                className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-foreground/10 text-muted"
                            >
                                ✕
                            </button>
                        )}
                        <ChevronDown size={14} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1 z-50 bg-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
                            style={{ maxHeight: '280px' }}
                        >
                            <div className="p-2 border-b border-border/30">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={e => onSearchChange(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-foreground/5 text-sm outline-none"
                                />
                            </div>
                            <div className="overflow-y-auto" style={{ maxHeight: '220px' }}>
                                {loading ? (
                                    <div className="flex justify-center py-6">
                                        <div className="w-5 h-5 rounded-full border-2 border-foreground/10 border-t-[var(--color-foreground)] animate-spin" />
                                    </div>
                                ) : fonts.map(font => (
                                    <button
                                        key={font.id}
                                        onClick={() => onSelect(font)}
                                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-foreground/5 transition-colors flex items-center gap-3"
                                    >
                                        <span className="text-lg" style={{ fontFamily: `'${font.name}', sans-serif` }}>Aa</span>
                                        <span>{font.name}</span>
                                        {selected?.id === font.id && <span className="ml-auto text-accent">✓</span>}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
