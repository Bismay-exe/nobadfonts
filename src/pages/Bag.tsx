import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Handbag } from "lucide-react";
import { useBag } from "../contexts/BagContext";
import type { BagItem } from "../contexts/BagContext";
import type { Database } from "../types/database.types";
import { CustomClipboard } from "../components/ui/CustomIcons";

type FontVariant = Database["public"]["Tables"]["font_variants"]["Row"];
type ExportMode = "embed" | "cli" | "zip";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSelectedVariantObjects(item: BagItem): FontVariant[] {
    const variants = item.font.font_variants || [];
    if (item.selectedVariants === "all") return variants;
    return variants.filter((v) =>
        (item.selectedVariants as string[]).includes(v.variant_name),
    );
}

function buildEmbedCode(items: BagItem[]): string {
    const lines: string[] = [];
    for (const item of items) {
        const selectedVariants = getSelectedVariantObjects(item);
        if (selectedVariants.length === 0 && item.selectedVariants === "all") {
            lines.push(
                `@import url("${window.location.origin}/css/${item.font.slug}");`,
            );
        } else if (selectedVariants.length > 0) {
            const variantParam = selectedVariants
                .map((v) => v.variant_name)
                .join(",");
            lines.push(
                `@import url("${window.location.origin}/css/${item.font.slug}?variants=${encodeURIComponent(variantParam)}");`,
            );
        } else {
            lines.push(
                `@import url("${window.location.origin}/css/${item.font.slug}");`,
            );
        }
    }

    return [...lines].join("\n");
}

function buildFontFaces(items: BagItem[]): string {
    const blocks: string[] = [];
    for (const item of items) {
        const selectedVariants = getSelectedVariantObjects(item);
        const name = item.font.name;
        const slug = item.font.slug;
        if (selectedVariants.length === 0) {
            blocks.push(
                `@font-face {\n  font-family: "${name}";\n  src: url("${window.location.origin}/fonts/${slug}/${slug}.woff2") format("woff2");\n}`,
            );
        } else {
            for (const v of selectedVariants) {
                const safeName = v.variant_name.replace(/[^a-zA-Z0-9-_]/g, "-");
                blocks.push(
                    `@font-face {\n  font-family: "${name}";\n  src: url("${window.location.origin}/fonts/${slug}/${slug}-${safeName}.woff2") format("woff2");\n}`,
                );
            }
        }
    }
    return blocks.join("\n\n");
}

function buildCSSRules(items: BagItem[]): string {
    const cssVars: string[] = items.map(
        (item) => `  --font-${item.font.slug}: "${item.font.name}", sans-serif;`,
    );

    return ["@theme {", ...cssVars, "}"].join("\n");
}

function buildCliCommand(items: BagItem[]): string {
    return items
        .map((item) => {
            const base = `${item.font.slug}`;
            if (item.selectedVariants === "all") return base;
            const variants = item.selectedVariants as string[];
            if (variants.length === 0) return base;
            const flags = variants
                .map((v) => `--variant ${v.toLowerCase().replace(/\s+/g, "-")}`)
                .join(" ");
            return `${base} ${flags}`;
        })
        .join("\n");
}

// ─── ZIP Download ─────────────────────────────────────────────────────────────

async function downloadAsZip(
    items: BagItem[],
    onProgress?: (msg: string) => void,
) {
    let JSZip: any;
    try {
        const mod = await import("jszip");
        JSZip = mod.default;
    } catch {
        alert("JSZip is not installed. Run: npm install jszip");
        return;
    }

    const zip = new JSZip();
    const cssBlocks: string[] = [];

    for (const item of items) {
        const fontFolder = zip.folder(item.font.slug)!;
        const selectedVariants = getSelectedVariantObjects(item);

        const getWeightFromName = (name: string): number => {
            const n = name.toLowerCase();
            if (n.includes("thin")) return 100;
            if (n.includes("extralight") || n.includes("extra light")) return 200;
            if (n.includes("light")) return 300;
            if (n.includes("regular")) return 400;
            if (n.includes("medium")) return 500;
            if (n.includes("semibold") || n.includes("semi bold")) return 600;
            if (n.includes("extrabold") || n.includes("extra bold")) return 800;
            if (n.includes("bold")) return 700;
            if (n.includes("[rgb(var(--color-background))]") || n.includes("heavy"))
                return 900;
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

        for (const variant of selectedVariants) {
            const safeName = variant.variant_name.replace(/[^a-zA-Z0-9-_]/g, "-");
            const weight = getWeightFromName(variant.variant_name);
            const style = variant.variant_name.toLowerCase().includes("italic")
                ? "italic"
                : "normal";
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
                if (ok)
                    srcs.push(`url('./${item.font.slug}/${name}') format('truetype')`);
            }
            if (variant.otf_url) {
                const name = `${item.font.slug}-${safeName}.otf`;
                const ok = await downloadFile(variant.otf_url, name);
                if (ok)
                    srcs.push(`url('./${item.font.slug}/${name}') format('opentype')`);
            }

            if (srcs.length > 0) {
                cssBlocks.push(`
@font-face {
  font-family: '${item.font.name}';
  src: ${srcs.join(",\n       ")};
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}`);
            }
        }

        if (selectedVariants.length === 0) {
            const mainSrcs: string[] = [];
            if (item.font.woff2_url) {
                const name = `${item.font.slug}.woff2`;
                const ok = await downloadFile(item.font.woff2_url, name);
                if (ok)
                    mainSrcs.push(`url('./${item.font.slug}/${name}') format('woff2')`);
            }
            if (mainSrcs.length > 0) {
                cssBlocks.push(`
@font-face {
  font-family: '${item.font.name}';
  src: ${mainSrcs.join(",\n       ")};
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`);
            }
        }
    }

    const themeVars = items
        .map(
            (item) => `  --font-${item.font.slug}: "${item.font.name}", sans-serif;`,
        )
        .join("\n");
    const cssContent = `/* Fonts downloaded from NoBadFonts — nobadfonts.in */\n${cssBlocks.join("\n")}\n\n@theme {\n${themeVars}\n}`;
    zip.file("fonts.css", cssContent);
    zip.file(
        "README.md",
        `# NoBadFonts — Downloaded Fonts\n\nPlace these files in your \`public/fonts\` directory.\nThen import \`fonts.css\` in your main CSS or JS entry file.\n\n## Usage\n\n\`\`\`css\nfont-family: var(--font-<slug>);\n\`\`\`\n`,
    );

    onProgress?.("Compressing ZIP...");
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nobadfonts-export.zip";
    a.click();
    URL.revokeObjectURL(url);
    onProgress?.("Done!");
}

// ─── Components ───────────────────────────────────────────────────────────────

function CopyButton({
    text,
    label = "Copy",
}: {
    text: string;
    label?: string;
}) {
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgb(var(--color-foreground)/0.1)] hover:bg-[rgb(var(--color-foreground)/0.2)] text-[rgb(var(--color-foreground))] rounded-md text-xs font-medium transition-all"
        >
            {copied ? (
                <Check size={14} />
            ) : (
                <CustomClipboard className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied" : label}
        </button>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BagPage() {
    const { items, clearBag, removeFromBag, toggleVariant } = useBag();
    const [activeTab, setActiveTab] = useState<ExportMode>("embed");
    const [expandedFontId, setExpandedFontId] = useState<string | null>(null);
    const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        setDownloadStatus("Preparing download...");
        try {
            await downloadAsZip(items, (msg) => setDownloadStatus(msg));
        } catch (err: any) {
            setDownloadStatus("Error: " + err?.message);
        } finally {
            setIsDownloading(false);
            setTimeout(() => setDownloadStatus(null), 3000);
        }
    };

    const isVariantSelected = (item: BagItem, variantName: string): boolean => {
        if (item.selectedVariants === "all") return true;
        return (item.selectedVariants as string[]).includes(variantName);
    };

    return (
        <div className="min-h-screen bg-[rgb(var(--color-background))] font-inter-tight text-[rgb(var(--color-foreground))]">
            <div>
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-184px)] text-center px-12">
                        <Handbag size={48} className="text-[rgb(var(--color-foreground))] mb-4" />
                        <h2 className="text-xl font-medium mb-2">Your bag is empty</h2>
                        <p className="text-[rgb(var(--color-foreground)/0.4)] text-center">
                            Browse fonts and add them to your bag to see them here.
                        </p>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto md:pt-24 pb-20 px-2 md:px-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-3xl font-medium font-inter-tight tracking-tight flex items-center gap-3">
                                Font Bag
                                <span className="bg-[rgb(var(--color-foreground))]text-[rgb(var(--color-background))] text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                    {items.length}
                                </span>
                            </h1>
                            <button onClick={clearBag} className="flex cursor-pointer  items-center gap-2 px-4 py-3 bg-[rgb(var(--color-foreground)/0.05)] hover:bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-foreground))] hover:text-[rgb(var(--color-background))] rounded-xl text-sm font-medium transition-all duration-300 ease-in-out">Clear bag</button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-[3fr_5fr] gap-4 md:gap-3">
                            {/* Left Column: Fonts List */}
                            <div className="flex flex-col gap-2">
                                {/* <h2 className="text-2xl font-medium mb-2">Fonts</h2> */}

                                {items.map((item) => {
                                    const isExpanded = expandedFontId === item.font.id;
                                    const variants = item.font.font_variants || [];
                                    const hasVariants = variants.length > 0;
                                    const selectedCount =
                                        item.selectedVariants === "all"
                                            ? variants.length || 1
                                            : (item.selectedVariants as string[]).length;

                                    return (
                                        <div
                                            key={item.font.id}
                                            className="bg-[rgb(var(--color-foreground)/0.05)] rounded-2xl overflow-hidden"
                                        >
                                            <div
                                                className="flex items-start justify-between p-5 cursor-pointer"
                                                onClick={() => {
                                                    if (hasVariants) {
                                                        setExpandedFontId(isExpanded ? null : item.font.id);
                                                    }
                                                }}
                                            >
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <h3
                                                        className="text-2xl font-medium font-inter-tight truncate tracking-wide"
                                                        style={{
                                                            fontFamily: `'font-${item.font.id}', sans-serif`,
                                                        }}
                                                    >
                                                        {item.font.name}
                                                    </h3>
                                                    <p className="text-[13px] font-light tracking-wider text-[rgb(var(--color-foreground)/0.5)] mt-1.5">
                                                        {selectedCount} variant{selectedCount !== 1 ? "s" : ""} selected
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFromBag(item.font.id);
                                                    }}
                                                    className="text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out"
                                                >
                                                    <X size={25} strokeWidth={2} />
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {isExpanded && hasVariants && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <div className="flex flex-col gap-px p-2">
                                                            {variants.map((v) => {
                                                                const selected = isVariantSelected(
                                                                    item,
                                                                    v.variant_name,
                                                                );
                                                                return (
                                                                    <button
                                                                        key={v.id}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleVariant(item.font.id, v.variant_name);
                                                                        }}
                                                                        className={`flex items-center justify-between p-3 px-4 rounded-xl ${selected ? "bg-[rgb(var(--color-foreground)/0.05)]" : "bg-[rgb(var(--color-foreground)/0.01)]"} hover:bg-[rgb(var(--color-foreground)/0.05)] transition-colors duration-300 ease-in-out group`}
                                                                    >
                                                                        <span
                                                                            className="text-[22px] tracking-tight"
                                                                            style={{
                                                                                fontFamily: `'font-${item.font.id}', sans-serif`,
                                                                                fontWeight: v.variant_name
                                                                                    .toLowerCase()
                                                                                    .includes("bold")
                                                                                    ? 700
                                                                                    : v.variant_name
                                                                                        .toLowerCase()
                                                                                        .includes("light")
                                                                                        ? 300
                                                                                        : 400,
                                                                                fontStyle: v.variant_name
                                                                                    .toLowerCase()
                                                                                    .includes("italic")
                                                                                    ? "italic"
                                                                                    : "normal",
                                                                            }}
                                                                        >
                                                                            {item.font.name} {v.variant_name}
                                                                        </span>
                                                                        <Check
                                                                            size={20}
                                                                            className={`transition-opacity ${selected ? "opacity-100 text-[rgb(var(--color-foreground))]" : "opacity-0 group-hover:opacity-30"}`}
                                                                        />
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right Column: Export Options */}
                            <div className="relative">
                                <div className="sticky top-25 bg-[rgb(var(--color-foreground)/0.05)] rounded-2xl p-4 md:p-6 @container">
                                    {/* Tabs */}
                                    <div className="flex gap-2 mb-8">
                                        <button
                                            onClick={() => setActiveTab("embed")}
                                            className={`px-6 py-2.5 rounded-xl text-sm font-medium tracking-wider transition-all duration-300 ease-in-out ${activeTab === "embed"
                                                ? "bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))]"
                                                : "bg-[rgb(var(--color-foreground)/0.05)] hover:bg-[rgb(var(--color-foreground)/0.08)] text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]"
                                                }`}
                                        >
                                            Embed
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("cli")}
                                            className={`px-6 py-2.5 rounded-xl text-sm font-medium tracking-wider transition-all duration-300 ease-in-out ${activeTab === "cli"
                                                ? "bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))]"
                                                : "bg-[rgb(var(--color-foreground)/0.05)] hover:bg-[rgb(var(--color-foreground)/0.08)] text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]"
                                                }`}
                                        >
                                            Cli
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("zip")}
                                            className={`px-6 py-2.5 rounded-xl text-sm font-medium tracking-wider transition-all duration-300 ease-in-out ${activeTab === "zip"
                                                ? "bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))]"
                                                : "bg-[rgb(var(--color-foreground)/0.05)] hover:bg-[rgb(var(--color-foreground)/0.08)] text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]"
                                                }`}
                                        >
                                            Zip
                                        </button>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeTab}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {activeTab === "embed" && (
                                                <div className="flex flex-col gap-8">
                                                    <div>
                                                        <h3 className="text-xl font-medium text-[rgb(var(--color-foreground)/0.9)] mb-4 tracking-wide">
                                                            1. Add to the head section of web page
                                                        </h3>
                                                        <div className="relative group bg-[rgb(var(--color-foreground)/0.05)] rounded-xl overflow-hidden">
                                                            <pre className="p-4 text-[13px] text-[rgb(var(--color-muted-foreground))] font-mono overflow-x-auto space-pre-wrap">
                                                                {items.map((i) => `<link href="${window.location.origin}/css/${i.font.slug}" rel="stylesheet">`).join("\n")}
                                                            </pre>
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <CopyButton text={items.map((i) => `<link href="${window.location.origin}/css/${i.font.slug}" rel="stylesheet">`).join("\n")} label="" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-xl font-medium text-[rgb(var(--color-foreground)/0.9)] mb-4 tracking-wide">
                                                            OR Using @import CSS directive
                                                        </h3>
                                                        <div className="relative group bg-[rgb(var(--color-foreground)/0.05)] rounded-xl overflow-hidden">
                                                            <pre className="max-h-40 p-4 text-[13px] text-[rgb(var(--color-muted-foreground))] font-mono overflow-x-auto space-pre-wrap">
                                                                {buildEmbedCode(items)}
                                                            </pre>
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <CopyButton text={buildEmbedCode(items)} label="" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-xl font-medium text-[rgb(var(--color-foreground)/0.9)] mb-4 tracking-wide">
                                                            OR Use font-face declaration
                                                        </h3>
                                                        <div className="relative group bg-[rgb(var(--color-foreground)/0.05)] rounded-xl overflow-hidden">
                                                            <pre className="max-h-60 p-4 text-[13px] text-[rgb(var(--color-muted-foreground))] font-mono overflow-x-auto space-pre-wrap">
                                                                {buildFontFaces(items)}
                                                            </pre>
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <CopyButton
                                                                    text={buildFontFaces(items)}
                                                                    label=""
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-xl font-medium text-[rgb(var(--color-foreground)/0.9)] mb-4 tracking-wide">
                                                            2. CSS rules to specify fonts
                                                        </h3>
                                                        <div className="relative group bg-[rgb(var(--color-foreground)/0.05)] rounded-xl overflow-hidden">
                                                            <pre className="max-h-40 p-4 text-[13px] text-[rgb(var(--color-muted-foreground))] font-mono overflow-x-auto space-pre-wrap">
                                                                {buildCSSRules(items)}
                                                            </pre>
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <CopyButton text={buildCSSRules(items)} label="" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === "cli" && (
                                                <div className="flex flex-col gap-8">
                                                    <div>
                                                        <h3 className="text-xl font-medium text-[rgb(var(--color-foreground)/0.9)] mb-4 tracking-wide">
                                                            Add via NoBadFonts CLI
                                                        </h3>
                                                        <div className="relative group bg-[rgb(var(--color-foreground)/0.05)] rounded-xl overflow-hidden">
                                                            <div className="p-4 text-[13px] text-[rgb(var(--color-muted-foreground))] font-mono overflow-x-auto whitespace-nowrap pr-14">
                                                                npx nobadfonts add {buildCliCommand(items)}
                                                            </div>
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <CopyButton
                                                                    text={buildCliCommand(items)}
                                                                    label=""
                                                                />
                                                            </div>
                                                        </div>
                                                        <p className="text-[rgb(var(--color-muted-foreground))] text-sm pl-2 mt-4">
                                                            Run this command in your project root to automatically
                                                            download and configure the fonts.
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-xl font-medium text-[rgb(var(--color-foreground)/0.9)] mb-4 tracking-wide">
                                                            Download via NoBadFonts CLI
                                                        </h3>
                                                        <div className="relative group bg-[rgb(var(--color-foreground)/0.05)] rounded-xl overflow-hidden">
                                                            <div className="p-4 text-[13px] text-[rgb(var(--color-muted-foreground))] font-mono overflow-x-auto whitespace-nowrap pr-14">
                                                                npx nobadfonts download {buildCliCommand(items)}
                                                            </div>
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <CopyButton
                                                                    text={buildCliCommand(items)}
                                                                    label=""
                                                                />
                                                            </div>
                                                        </div>
                                                        <p className="text-[rgb(var(--color-muted-foreground))] text-sm pl-2 mt-4">
                                                            Run this command in your project root to only download
                                                            the font files.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === "zip" && (
                                                <div className="flex flex-col gap-6">
                                                    <h3 className="text-[17px] font-medium text-[rgb(var(--color-foreground)/0.9)] mb-4 tracking-tight">
                                                        Download Font Files
                                                    </h3>
                                                    <p className="text-gray-400 text-sm mb-4">
                                                        Download a ZIP archive containing all selected font
                                                        files and a ready-to-use fonts.css file.
                                                    </p>
                                                    <button
                                                        onClick={handleDownload}
                                                        disabled={isDownloading}
                                                        className="w-full py-3.5 bg-[rgb(var(--color-foreground))]text-[rgb(var(--color-background))] rounded-xl font-bold font-inter-tight tracking-wide hover:bg-gray-200 transition-colors disabled:opacity-50"
                                                    >
                                                        {isDownloading
                                                            ? downloadStatus || "Downloading..."
                                                            : "Download ZIP"}
                                                    </button>
                                                    {downloadStatus && !isDownloading && (
                                                        <p className="text-center text-sm text-gray-400 mt-2">
                                                            {downloadStatus}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
