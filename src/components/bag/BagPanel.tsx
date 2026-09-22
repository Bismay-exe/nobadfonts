import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Code2, Download, Terminal, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useBag } from '../../contexts/BagContext';
import type { BagItem } from '../../contexts/BagContext';
import type { Database } from '../../types/database.types';
import { CustomClipboard } from '../ui/CustomIcons';

type FontVariant = Database['public']['Tables']['font_variants']['Row'];

// ─── Export Tab Types ─────────────────────────────────────────────────────────

type ExportMode = 'embed' | 'download' | 'cli';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSelectedVariantObjects(item: BagItem): FontVariant[] {
    const variants = item.font.font_variants || [];
    if (item.selectedVariants === 'all') return variants;
    return variants.filter(v => (item.selectedVariants as string[]).includes(v.variant_name));
}

function buildEmbedCode(items: BagItem[]): string {
    const lines: string[] = [];
    for (const item of items) {
        const selectedVariants = getSelectedVariantObjects(item);
        if (selectedVariants.length === 0 && item.selectedVariants === 'all') {
            // Use the CDN CSS endpoint
            lines.push(`@import url("https://www.nobadfonts.in/css/${item.font.slug}");`);
        } else if (selectedVariants.length > 0) {
            const variantParam = selectedVariants.map(v => v.variant_name).join(',');
            lines.push(`@import url("https://www.nobadfonts.in/css/${item.font.slug}?variants=${encodeURIComponent(variantParam)}");`);
        } else {
            lines.push(`@import url("https://www.nobadfonts.in/css/${item.font.slug}");`);
        }
    }

    const cssVars: string[] = items.map(item =>
        `  --font-${item.font.slug}: "${item.font.name}", sans-serif;`
    );

    return [...lines, '', '@theme {', ...cssVars, '}'].join('\n');
}

function buildCliCommand(items: BagItem[]): string {
    return items.map(item => {
        const base = `npx nobadfonts add ${item.font.slug}`;
        if (item.selectedVariants === 'all') return base;
        const variants = item.selectedVariants as string[];
        if (variants.length === 0) return base;
        const flags = variants.map(v => `--variant ${v.toLowerCase().replace(/\s+/g, '-')}`).join(' ');
        return `${base} ${flags}`;
    }).join('\n');
}

// ─── ZIP Download ─────────────────────────────────────────────────────────────

async function downloadAsZip(items: BagItem[], onProgress?: (msg: string) => void) {
    // Dynamically import jszip
    let JSZip: any;
    try {
        const mod = await import('jszip');
        JSZip = mod.default;
    } catch {
        alert('JSZip is not installed. Run: npm install jszip');
        return;
    }

    const zip = new JSZip();
    const cssBlocks: string[] = [];

    for (const item of items) {
        const fontFolder = zip.folder(item.font.slug)!;
        const selectedVariants = getSelectedVariantObjects(item);

        const getWeightFromName = (name: string): number => {
            const n = name.toLowerCase();
            if (n.includes('thin')) return 100;
            if (n.includes('extralight') || n.includes('extra light')) return 200;
            if (n.includes('light')) return 300;
            if (n.includes('regular')) return 400;
            if (n.includes('medium')) return 500;
            if (n.includes('semibold') || n.includes('semi bold')) return 600;
            if (n.includes('extrabold') || n.includes('extra bold')) return 800;
            if (n.includes('bold')) return 700;
            if (n.includes('black') || n.includes('heavy')) return 900;
            return 400;
        };

        const downloadFile = async (url: string | null, filename: string) => {
            if (!url) return null;
            try {
                onProgress?.(`Downloading ${filename}...`);
                const res = await fetch(url);
                if (!res.ok) return null;
                const buffer = await res.arrayBuffer();
                fontFolder.file(filename, buffer);
                return filename;
            } catch {
                return null;
            }
        };

        // Download each selected variant's files
        for (const variant of selectedVariants) {
            const safeName = variant.variant_name.replace(/[^a-zA-Z0-9-_]/g, '-');
            const weight = getWeightFromName(variant.variant_name);
            const style = variant.variant_name.toLowerCase().includes('italic') ? 'italic' : 'normal';
            const srcs: string[] = [];

            if (variant.woff2_url) {
                const name = `${item.font.slug}-${safeName}.woff2`;
                const ok = await downloadFile(variant.woff2_url, name);
                if (ok) srcs.push(`url('./${item.font.slug}/${name}') format('woff2')`);
            }
            if (variant.woff_url) {
                const name = `${item.font.slug}-${safeName}.woff`;
                const ok = await downloadFile(variant.woff_url, name);
                if (ok) srcs.push(`url('./${item.font.slug}/${name}') format('woff')`);
            }
            if (variant.ttf_url) {
                const name = `${item.font.slug}-${safeName}.ttf`;
                const ok = await downloadFile(variant.ttf_url, name);
                if (ok) srcs.push(`url('./${item.font.slug}/${name}') format('truetype')`);
            }
            if (variant.otf_url) {
                const name = `${item.font.slug}-${safeName}.otf`;
                const ok = await downloadFile(variant.otf_url, name);
                if (ok) srcs.push(`url('./${item.font.slug}/${name}') format('opentype')`);
            }

            if (srcs.length > 0) {
                cssBlocks.push(`
@font-face {
  font-family: '${item.font.name}';
  src: ${srcs.join(',\n       ')};
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}`);
            }
        }

        // If no variants but 'all' selected, try main font files
        if (selectedVariants.length === 0) {
            const mainSrcs: string[] = [];
            if (item.font.woff2_url) {
                const name = `${item.font.slug}.woff2`;
                const ok = await downloadFile(item.font.woff2_url, name);
                if (ok) mainSrcs.push(`url('./${item.font.slug}/${name}') format('woff2')`);
            }
            if (mainSrcs.length > 0) {
                cssBlocks.push(`
@font-face {
  font-family: '${item.font.name}';
  src: ${mainSrcs.join(',\n       ')};
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`);
            }
        }
    }

    // Add fonts.css to ZIP
    const themeVars = items.map(item => `  --font-${item.font.slug}: "${item.font.name}", sans-serif;`).join('\n');
    const cssContent = `/* Fonts downloaded from NoBadFonts — nobadfonts.in */\n${cssBlocks.join('\n')}\n\n@theme {\n${themeVars}\n}`;
    zip.file('fonts.css', cssContent);
    zip.file('README.md', `# NoBadFonts — Downloaded Fonts\n\nPlace these files in your \`public/fonts\` directory.\nThen import \`fonts.css\` in your main CSS or JS entry file.\n\n## Usage\n\n\`\`\`css\nfont-family: var(--font-<slug>);\n\`\`\`\n`);

    onProgress?.('Compressing ZIP...');
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nobadfonts-export.zip';
    a.click();
    URL.revokeObjectURL(url);
    onProgress?.('Done!');
}

// ─── Variant Chip Component ───────────────────────────────────────────────────

function VariantChip({ label, isSelected, onToggle }: {
    label: string;
    isSelected: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            onClick={onToggle}
            className={`
                text-[11px] px-2.5 py-1 rounded-full font-medium font-inter-tight tracking-wide
                transition-all duration-200 cursor-pointer border
                ${isSelected
                    ? 'bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] border-[rgb(var(--color-foreground))]'
                    : 'bg-transparent text-[rgb(var(--color-muted-foreground))] border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-foreground)/0.5)]'
                }
            `}
        >
            {label}
        </button>
    );
}

// ─── Individual Bag Item ──────────────────────────────────────────────────────

function BagItemRow({ item }: { item: BagItem }) {
    const { removeFromBag, toggleVariant, setAllVariants } = useBag();
    const [expanded, setExpanded] = useState(false);
    const variants = item.font.font_variants || [];
    const hasVariants = variants.length > 0;

    const isVariantSelected = (variantName: string): boolean => {
        if (item.selectedVariants === 'all') return true;
        return (item.selectedVariants as string[]).includes(variantName);
    };

    const selectedCount = item.selectedVariants === 'all'
        ? variants.length || 1
        : (item.selectedVariants as string[]).length;

    return (
        <div className="bg-[rgb(var(--color-foreground)/0.04)] rounded-2xl overflow-hidden border border-[rgb(var(--color-border)/0.5)]">
            {/* Font Header */}
            <div className="flex items-center gap-3 p-3.5">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[rgb(var(--color-foreground))] truncate">
                        {item.font.name}
                    </p>
                    <p className="text-[11px] text-[rgb(var(--color-muted-foreground))] mt-0.5">
                        {item.font.designer && <span>{item.font.designer} · </span>}
                        {selectedCount} variant{selectedCount !== 1 ? 's' : ''} selected
                    </p>
                </div>

                <div className="flex items-center gap-1.5">
                    {hasVariants && (
                        <button
                            onClick={() => setExpanded(e => !e)}
                            className="p-1.5 rounded-xl text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.08)] transition-all"
                            aria-label="Toggle variants"
                        >
                            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                    )}
                    <button
                        onClick={() => removeFromBag(item.font.id)}
                        className="p-1.5 rounded-xl text-[rgb(var(--color-muted-foreground))] hover:text-red-500 hover:bg-red-500/10 transition-all"
                        aria-label={`Remove ${item.font.name} from bag`}
                    >
                        <X size={15} />
                    </button>
                </div>
            </div>

            {/* Variant Chips */}
            <AnimatePresence>
                {expanded && hasVariants && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3.5 pb-3.5 flex flex-col gap-2">
                            {/* Select All */}
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-[rgb(var(--color-muted-foreground))] font-medium uppercase tracking-widest">
                                    Variants
                                </span>
                                <button
                                    onClick={() => setAllVariants(item.font.id)}
                                    className="text-[11px] text-[rgb(var(--color-primary))] hover:underline transition-colors"
                                >
                                    Select all
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {variants.map(v => (
                                    <VariantChip
                                        key={v.id}
                                        label={v.variant_name}
                                        isSelected={isVariantSelected(v.variant_name)}
                                        onToggle={() => toggleVariant(item.font.id, v.variant_name)}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [text]);

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-xl text-xs font-bold font-inter-tight tracking-wide hover:opacity-80 transition-all shrink-0 cursor-pointer"
        >
            {copied ? <Check size={13} strokeWidth={3} /> : <CustomClipboard className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : label}
        </button>
    );
}

// ─── Export Sections ──────────────────────────────────────────────────────────

function EmbedCodeSection({ items }: { items: BagItem[] }) {
    const code = buildEmbedCode(items);
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-sm font-semibold text-[rgb(var(--color-foreground))]">Embed Code</p>
                    <p className="text-[11px] text-[rgb(var(--color-muted-foreground))] mt-0.5">
                        Paste this into your CSS file
                    </p>
                </div>
                <CopyButton text={code} label="Copy CSS" />
            </div>
            <pre className="bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-border))] rounded-xl p-3.5 text-[11px] font-mono text-[rgb(var(--color-foreground)/0.85)] overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                {code}
            </pre>
        </div>
    );
}

function DownloadSection({ items }: { items: BagItem[] }) {
    const [status, setStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async () => {
        setIsLoading(true);
        setStatus('Preparing download...');
        try {
            await downloadAsZip(items, (msg) => setStatus(msg));
        } catch (err: any) {
            setStatus('Error: ' + err?.message);
        } finally {
            setIsLoading(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <div>
                <p className="text-sm font-semibold text-[rgb(var(--color-foreground))]">Download ZIP</p>
                <p className="text-[11px] text-[rgb(var(--color-muted-foreground))] mt-0.5">
                    Font files + ready-to-use CSS in a single ZIP
                </p>
            </div>

            <div className="bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-border))] rounded-xl p-3.5 space-y-2">
                <p className="text-[11px] text-[rgb(var(--color-muted-foreground))]">
                    📦 Includes all selected variant files + <code className="font-mono">fonts.css</code> with <code className="font-mono">@font-face</code> definitions
                </p>
                <p className="text-[11px] text-[rgb(var(--color-muted-foreground))]">
                    📂 Place font files in <code className="font-mono bg-[rgb(var(--color-foreground)/0.1)] px-1 py-0.5 rounded">public/fonts/</code> and import the CSS
                </p>
            </div>

            <button
                onClick={handleDownload}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-xl text-sm font-bold font-inter-tight tracking-wide hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                <Download size={16} />
                {isLoading ? (status || 'Downloading...') : 'Download All Fonts'}
            </button>

            {status && !isLoading && (
                <p className="text-[11px] text-[rgb(var(--color-muted-foreground))] text-center">{status}</p>
            )}
        </div>
    );
}

function CliSection({ items }: { items: BagItem[] }) {
    const command = buildCliCommand(items);
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-sm font-semibold text-[rgb(var(--color-foreground))]">CLI Command</p>
                    <p className="text-[11px] text-[rgb(var(--color-muted-foreground))] mt-0.5">
                        Paste & run in your project terminal
                    </p>
                </div>
                <CopyButton text={command} label="Copy" />
            </div>

            <div className="bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-border))] rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[rgb(var(--color-border)/0.5)]">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                    </div>
                    <span className="text-[10px] text-[rgb(var(--color-muted-foreground))] font-mono">terminal</span>
                </div>
                <pre className="text-[11px] font-mono text-[rgb(var(--color-foreground)/0.85)] whitespace-pre-wrap break-all leading-relaxed">
                    <span className="text-[rgb(var(--color-primary))]">$ </span>{command}
                </pre>
            </div>

            <p className="text-[11px] text-[rgb(var(--color-muted-foreground))]">
                💡 No account needed. Works with any React, Vite, or Next.js project.
            </p>
        </div>
    );
}

// ─── Main BagPanel ────────────────────────────────────────────────────────────

export default function BagPanel() {
    const { items, isOpen, closeBag, clearBag } = useBag();
    const [activeTab, setActiveTab] = useState<ExportMode>('embed');

    // Prevent body scroll when panel is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const tabs: { id: ExportMode; label: string; icon: React.ReactNode }[] = [
        { id: 'embed', label: 'Embed', icon: <Code2 size={14} /> },
        { id: 'download', label: 'ZIP', icon: <Download size={14} /> },
        { id: 'cli', label: 'CLI', icon: <Terminal size={14} /> },
    ];

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="bag-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={closeBag}
                        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="bag-panel"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="fixed right-0 top-0 bottom-0 z-[90] w-full max-w-sm bg-[rgb(var(--color-background))] border-l border-[rgb(var(--color-border))] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(var(--color-border)/0.5)]">
                            <div className="flex items-center gap-2">
                                <ShoppingBag size={18} className="text-[rgb(var(--color-foreground))]" />
                                <span className="font-bold text-base font-inter-tight tracking-tight text-[rgb(var(--color-foreground))]">
                                    Font Bag
                                </span>
                                {items.length > 0 && (
                                    <span className="bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {items.length}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {items.length > 0 && (
                                    <button
                                        onClick={clearBag}
                                        className="flex items-center gap-1 text-[11px] text-[rgb(var(--color-muted-foreground))] hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                                    >
                                        <Trash2 size={12} />
                                        Clear all
                                    </button>
                                )}
                                <button
                                    onClick={closeBag}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-foreground)/0.08)] transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {items.length === 0 ? (
                            /* Empty State */
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
                                <div className="w-16 h-16 rounded-3xl bg-[rgb(var(--color-foreground)/0.06)] flex items-center justify-center">
                                    <ShoppingBag size={28} className="text-[rgb(var(--color-muted-foreground))]" />
                                </div>
                                <div>
                                    <p className="font-semibold text-[rgb(var(--color-foreground))]">Your bag is empty</p>
                                    <p className="text-sm text-[rgb(var(--color-muted-foreground))] mt-1">
                                        Browse fonts and click the bag icon to add them
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Font List */}
                                <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5 min-h-0">
                                    {items.map(item => (
                                        <BagItemRow key={item.font.id} item={item} />
                                    ))}
                                </div>

                                {/* Export Section */}
                                <div className="border-t border-[rgb(var(--color-border)/0.5)] flex flex-col">
                                    {/* Tabs */}
                                    <div className="flex gap-1 p-3 pb-0">
                                        {tabs.map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`
                                                    flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold font-inter-tight tracking-wide transition-all
                                                    ${activeTab === tab.id
                                                        ? 'bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))]'
                                                        : 'text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-foreground)/0.08)] hover:text-[rgb(var(--color-foreground))]'
                                                    }
                                                `}
                                            >
                                                {tab.icon}
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Tab Content */}
                                    <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeTab}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                {activeTab === 'embed' && <EmbedCodeSection items={items} />}
                                                {activeTab === 'download' && <DownloadSection items={items} />}
                                                {activeTab === 'cli' && <CliSection items={items} />}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
