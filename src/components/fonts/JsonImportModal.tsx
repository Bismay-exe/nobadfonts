import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileJson, Copy, Check, Upload as UploadIcon, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { Toast } from '@capacitor/toast';
import { cleanUrl } from '../../utils/urlHelper';

export interface FontFormState {
    // Identity
    name: string;
    familyName: string;
    version: string;
    releaseYear: string;

    // Creator
    designer: string;
    foundry: string;
    publisher: string;

    // Classification
    category: string;
    subcategory: string;
    style: string;
    tags: string[];
    mood: string[];
    recommendedUses: string[];

    // Description
    description: string;
    history: string;
    characteristics: string;

    // License (3-step)
    distributionStatus: 'open_source' | 'free' | 'demo' | 'paid' | 'unknown';
    licenseType: string;
    licenseUrl: string;
    commercialUse: boolean;
    personalUse: boolean;
    modificationAllowed: boolean;
    redistributionAllowed: boolean;
    licenseEvidence: string;

    // Official Links
    officialWebsite: string;
    officialFontPage: string;
    purchaseUrl: string;
    freeDownloadUrl: string;
    githubUrl: string;
    googleFontsUrl: string;

    // Technical
    glyphCount?: number;
    languages?: string[];
    opentypeFeatures?: string[];
    formats?: string[];
    weights?: string[];
    styles?: string[];
}

/**
 * 58 Curated controlled tags from Upload.tsx:L120-L211 across all 6 taxonomy groups
 */
export const CONTROLLED_TAG_VOCABULARY = [
    // Classification
    'sans', 'serif', 'slab-serif', 'display', 'monospace', 'mono', 'script', 'calligraphy', 'brush', 'handwritten', 'signature',
    // Style
    'modern', 'classic', 'minimal', 'bold', 'elegant', 'luxury', 'playful', 'comic', 'graffiti', 'experimental', 'brutalist', 'industrial', 'editorial', 'geometric', 'organic', 'techno', 'sci-fi',
    // Use Case
    'branding', 'logo', 'headline', 'poster', 'editorial-use', 'corporate', 'tech', 'social-media',
    // Weight & Shape
    'hairline', 'thin', 'light', 'normal-width', 'heavy', 'tall', 'condensed', 'wide', 'extended',
    // Construction & Features
    'inktrap', 'rounded', 'square', 'sharp', 'stencil', 'outline', 'inline', 'pixel', 'messy',
    // Era & Vibe
    'casual', 'retro', 'vintage', 'cyberpunk', 'futuristic', 'gothic', 'y2k'
] as const;

export const JSON_SCHEMA_TEMPLATE = {
    identity: {
        name: "string",
        family_name: "string",
        slug: "string",
        version: "string (e.g. 1.000)",
        release_year: "number (e.g. 2026)"
    },
    creator: {
        designer: "string",
        foundry: "string",
        publisher: "string"
    },
    classification: {
        category: "string (sans | serif | display | script | slab-serif | monospace | handwritten)",
        subcategory: "string",
        style: "string",
        tags: ["string"],
        mood: ["string"],
        recommended_uses: ["string"]
    },
    description: {
        description: "string",
        history: "string",
        characteristics: "string"
    },
    license: {
        distribution_status: "string (open_source | free | demo | paid | unknown)",
        license_type: "string",
        license_url: "string (url)",
        commercial_use: "boolean (true / false)",
        personal_use: "boolean (true / false)",
        modification_allowed: "boolean (true / false)",
        redistribution_allowed: "boolean (true / false)",
        license_evidence: "string"
    },
    official_links: {
        official_website: "string (url)",
        official_font_page: "string (url)",
        purchase_url: "string (url)",
        free_download_url: "string (url)",
        github_url: "string (url)",
        google_fonts_url: "string (url)"
    },
    technical: {
        formats: ["string (e.g. OTF, TTF, WOFF2)"],
        weights: ["string (e.g. Regular, Bold)"],
        styles: ["string (e.g. Normal, Italic)"],
        glyph_count: "number",
        languages: ["string"],
        opentype_features: ["string"]
    }
};

export const CANONICAL_JSON_SAMPLE = {
    identity: {
        name: "Cabinet Grotesk",
        family_name: "Cabinet Grotesk",
        slug: "cabinet-grotesk",
        version: "1.000",
        release_year: 2021
    },
    creator: {
        designer: "Matthieu Salvaggio",
        foundry: "Indian Type Foundry",
        publisher: "Fontshare"
    },
    classification: {
        category: "sans",
        subcategory: "grotesque",
        style: "modern",
        tags: ["sans", "grotesque", "display", "branding", "variable"],
        mood: ["bold", "confident", "contemporary"],
        recommended_uses: ["headlines", "branding", "posters", "editorial"]
    },
    description: {
        description: "Cabinet Grotesk is a quirky, geometric sans-serif typeface designed with distinctive idiosyncratic features and high stroke contrast in bold weights.",
        history: "Commissioned by Fontshare in 2021 as a versatile display and text family with variable font support.",
        characteristics: "Angled terminals, oversized punctuation, alternate characters, tight apertures."
    },
    license: {
        distribution_status: "open_source",
        license_type: "SIL Open Font License (OFL 1.1)",
        license_url: "https://scripts.sil.org/OFL",
        commercial_use: true,
        personal_use: true,
        modification_allowed: true,
        redistribution_allowed: true,
        license_evidence: "Included OFL.txt in official font repository."
    },
    official_links: {
        official_website: "https://www.fontshare.com",
        official_font_page: "https://www.fontshare.com/fonts/cabinet-grotesk",
        purchase_url: null,
        free_download_url: "https://www.fontshare.com/fonts/cabinet-grotesk",
        github_url: null,
        google_fonts_url: null
    },
    technical: {
        glyph_count: 482,
        languages: ["Latin", "Western European", "Central European"],
        opentype_features: ["liga", "kern", "calt", "ss01", "ss02", "case", "frac"]
    }
};

/**
 * Normalizes both nested and flat JSON objects into partial FontFormState
 */
export function normalizeFontJson(raw: any): { parsedState: Partial<FontFormState>; fieldCount: number } {
    if (!raw || typeof raw !== 'object') return { parsedState: {}, fieldCount: 0 };

    const state: Partial<FontFormState> = {};
    let count = 0;

    // Helper to extract string or array
    const toStr = (v: any) => (typeof v === 'string' || typeof v === 'number') ? String(v).trim() : '';
    const toArr = (v: any): string[] => {
        if (Array.isArray(v)) return v.map(toStr).filter(Boolean);
        if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
        return [];
    };
    const toBool = (v: any, fallback = false): boolean => {
        if (typeof v === 'boolean') return v;
        if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
        return fallback;
    };
    const toUrl = (v: any): string => {
        const s = toStr(v);
        if (!s) return '';
        return cleanUrl(s) || s;
    };

    // 1. Identity
    const idObj = raw.identity || raw;
    if (idObj.name) { state.name = toStr(idObj.name); count++; }
    if (idObj.family_name || idObj.familyName) { state.familyName = toStr(idObj.family_name || idObj.familyName); count++; }
    if (idObj.version) { state.version = toStr(idObj.version); count++; }
    if (idObj.release_year || idObj.releaseYear) { state.releaseYear = toStr(idObj.release_year || idObj.releaseYear); count++; }

    // 2. Creator
    const creatorObj = raw.creator || raw;
    if (creatorObj.designer) { state.designer = toStr(creatorObj.designer); count++; }
    if (creatorObj.foundry) { state.foundry = toStr(creatorObj.foundry); count++; }
    if (creatorObj.publisher) { state.publisher = toStr(creatorObj.publisher); count++; }

    // 3. Classification
    const classObj = raw.classification || raw;
    if (classObj.category) {
        let cat = toStr(classObj.category).toLowerCase().trim();
        if (cat === 'mono') cat = 'monospace';
        if (cat === 'sans-serif') cat = 'sans';
        if (cat === 'slab') cat = 'slab-serif';
        if (cat === 'handwriting') cat = 'handwritten';
        if (cat === 'calligraphy' || cat === 'brush' || cat === 'signature') cat = 'script';
        state.category = cat;
        count++;
    }
    if (classObj.subcategory) { state.subcategory = toStr(classObj.subcategory); count++; }
    if (classObj.style) { state.style = toStr(classObj.style); count++; }
    if (classObj.tags) {
        const tags = toArr(classObj.tags).map(t => t.toLowerCase().trim()).filter(Boolean);
        if (tags.length > 0) { state.tags = Array.from(new Set(tags)); count++; }
    }
    if (classObj.mood) {
        const mood = toArr(classObj.mood);
        if (mood.length > 0) { state.mood = mood; count++; }
    }
    if (classObj.recommended_uses || classObj.recommendedUses) {
        const uses = toArr(classObj.recommended_uses || classObj.recommendedUses);
        if (uses.length > 0) { state.recommendedUses = uses; count++; }
    }

    // 4. Description
    const descObj = typeof raw.description === 'object' && raw.description !== null 
        ? raw.description 
        : (raw.description_details || raw || {});

    if (typeof raw.description === 'string' && raw.description.trim()) {
        state.description = raw.description.trim();
        count++;
    } else if (descObj.description) {
        state.description = toStr(descObj.description);
        count++;
    }

    if (descObj.history || raw.history) {
        state.history = toStr(descObj.history || raw.history);
        count++;
    }
    if (descObj.characteristics || raw.characteristics) {
        state.characteristics = toStr(descObj.characteristics || raw.characteristics);
        count++;
    }

    // 5. License
    const licObj = raw.license || raw;
    if (licObj.distribution_status || licObj.distributionStatus) {
        const ds = toStr(licObj.distribution_status || licObj.distributionStatus).toLowerCase();
        if (['open_source', 'free', 'demo', 'paid', 'unknown'].includes(ds)) {
            state.distributionStatus = ds as any;
            count++;
        }
    }
    if (licObj.license_type || licObj.licenseType) {
        state.licenseType = toStr(licObj.license_type || licObj.licenseType);
        count++;
    }
    if (licObj.license_url || licObj.licenseUrl) {
        state.licenseUrl = toUrl(licObj.license_url || licObj.licenseUrl);
        count++;
    }
    if (licObj.commercial_use !== undefined || licObj.commercialUse !== undefined) {
        state.commercialUse = toBool(licObj.commercial_use ?? licObj.commercialUse);
        count++;
    }
    if (licObj.personal_use !== undefined || licObj.personalUse !== undefined) {
        state.personalUse = toBool(licObj.personal_use ?? licObj.personalUse, true);
        count++;
    }
    if (licObj.modification_allowed !== undefined || licObj.modificationAllowed !== undefined) {
        state.modificationAllowed = toBool(licObj.modification_allowed ?? licObj.modificationAllowed);
        count++;
    }
    if (licObj.redistribution_allowed !== undefined || licObj.redistributionAllowed !== undefined) {
        state.redistributionAllowed = toBool(licObj.redistribution_allowed ?? licObj.redistributionAllowed);
        count++;
    }
    if (licObj.license_evidence || licObj.licenseEvidence) {
        state.licenseEvidence = toStr(licObj.license_evidence || licObj.licenseEvidence);
        count++;
    }

    // 6. Official Links
    const linksObj = raw.official_links || raw.links || raw;
    if (linksObj.official_website || linksObj.officialWebsite) {
        state.officialWebsite = toUrl(linksObj.official_website || linksObj.officialWebsite);
        count++;
    }
    if (linksObj.official_font_page || linksObj.officialFontPage) {
        state.officialFontPage = toUrl(linksObj.official_font_page || linksObj.officialFontPage);
        count++;
    }
    if (linksObj.purchase_url || linksObj.purchaseUrl) {
        state.purchaseUrl = toUrl(linksObj.purchase_url || linksObj.purchaseUrl);
        count++;
    }
    if (linksObj.free_download_url || linksObj.freeDownloadUrl) {
        state.freeDownloadUrl = toUrl(linksObj.free_download_url || linksObj.freeDownloadUrl);
        count++;
    }
    if (linksObj.github_url || linksObj.githubUrl) {
        state.githubUrl = toUrl(linksObj.github_url || linksObj.githubUrl);
        count++;
    }
    if (linksObj.google_fonts_url || linksObj.googleFontsUrl) {
        state.googleFontsUrl = toUrl(linksObj.google_fonts_url || linksObj.googleFontsUrl);
        count++;
    }

    // 7. Technical
    const techObj = raw.technical || raw;
    if (techObj.formats) {
        const f = toArr(techObj.formats);
        if (f.length > 0) { state.formats = f; count++; }
    }
    if (techObj.weights) {
        const w = toArr(techObj.weights);
        if (w.length > 0) { state.weights = w; count++; }
    }
    if (techObj.styles) {
        const s = toArr(techObj.styles);
        if (s.length > 0) { state.styles = s; count++; }
    }
    if (techObj.glyph_count || techObj.glyphCount) {
        const g = Number(techObj.glyph_count || techObj.glyphCount);
        if (!isNaN(g)) { state.glyphCount = g; count++; }
    }
    if (techObj.languages) {
        const langs = toArr(techObj.languages);
        if (langs.length > 0) { state.languages = langs; count++; }
    }
    if (techObj.opentype_features || techObj.opentypeFeatures) {
        const feats = toArr(techObj.opentype_features || techObj.opentypeFeatures);
        if (feats.length > 0) { state.opentypeFeatures = feats; count++; }
    }

    return { parsedState: state, fieldCount: count };
}

interface JsonImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyData: (data: Partial<FontFormState>) => void;
    initialJson?: string;
    applyLabel?: string;
}

export const JsonImportModal: React.FC<JsonImportModalProps> = ({
    isOpen,
    onClose,
    onApplyData,
    initialJson = '',
    applyLabel = 'Apply Changes'
}) => {
    const [tab, setTab] = useState<'upload' | 'paste'>('paste');
    const [jsonText, setJsonText] = useState(initialJson || '');
    const [copied, setCopied] = useState(false);
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Sync initialJson whenever modal opens or initialJson changes
    useEffect(() => {
        if (isOpen) {
            setJsonText(initialJson || '');
        }
    }, [isOpen, initialJson]);

    // Validation state
    const parseResult = useMemo(() => {
        if (!jsonText.trim()) return null;
        try {
            const parsed = JSON.parse(jsonText);
            const { parsedState, fieldCount } = normalizeFontJson(parsed);
            return { valid: true, data: parsedState, count: fieldCount, raw: parsed };
        } catch (e: any) {
            return { valid: false, error: e.message || 'Invalid JSON syntax' };
        }
    }, [jsonText]);

    const handleApply = useCallback(async () => {
        if (!parseResult || !parseResult.valid || !parseResult.data) {
            await Toast.show({ text: 'Please provide valid JSON first.', duration: 'short' });
            return;
        }

        onApplyData(parseResult.data);
        await Toast.show({
            text: `Successfully loaded ${parseResult.count} font attributes from JSON!`,
            duration: 'short',
        });
        onClose();
    }, [parseResult, onApplyData, onClose]);

    const handleFileUpload = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setJsonText(text);
            setTab('paste');
        };
        reader.readAsText(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.json') || file.type.includes('json')) {
                handleFileUpload(file);
            } else {
                Toast.show({ text: 'Please drop a .json file.', duration: 'short' });
            }
        }
    }, [handleFileUpload]);

    const copySchemaFormat = useCallback(async () => {
        const schemaStr = JSON.stringify(JSON_SCHEMA_TEMPLATE, null, 2);
        try {
            await navigator.clipboard.writeText(schemaStr);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            await Toast.show({ text: 'JSON format template copied to clipboard.', duration: 'short' });
        } catch {
            setJsonText(schemaStr);
            await Toast.show({ text: 'Loaded JSON format template into editor.', duration: 'short' });
        }
    }, []);

    const copyAiPrompt = useCallback(async () => {
        const baseJson = jsonText.trim() || JSON.stringify(CANONICAL_JSON_SAMPLE, null, 2);
        const promptText = `You are a typography and font metadata expert for NoBadFonts.

TASK:
Modify the original font JSON data below with verified, accurate metadata for this font.

CRITICAL CONSTRAINTS:
1. Make changes directly inside the original JSON data provided below.
2. DO NOT create new sections, flat keys, or fields outside the 7 canonical schema sections:
   - identity (name, family_name, slug, version, release_year)
   - creator (designer, foundry, publisher)
   - classification (category, subcategory, style, tags, mood, recommended_uses)
   - description (description, history, characteristics)
   - license (distribution_status, license_type, license_url, commercial_use, personal_use, modification_allowed, redistribution_allowed, license_evidence)
   - official_links (official_website, official_font_page, purchase_url, free_download_url, github_url, google_fonts_url)
   - technical (formats, weights, styles, glyph_count, languages, opentype_features)
3. category MUST strictly be one of: sans, serif, display, script, slab-serif, monospace, handwritten.
4. tags MUST be lowercase strings chosen from the controlled tag taxonomy (e.g. modern, geometric, branding, headline, elegant, minimal, brutalist, retro, vintage, etc.).
5. Return ONLY the updated JSON object inside \`\`\`json ... \`\`\` codeblock with no outer wrapper keys.

ORIGINAL FONT JSON DATA TO EDIT:
${baseJson}`;

        try {
            await navigator.clipboard.writeText(promptText);
            setCopiedPrompt(true);
            setTimeout(() => setCopiedPrompt(false), 2000);
            await Toast.show({ text: 'AI prompt copied to clipboard with original JSON & strict schema rules!', duration: 'short' });
        } catch {
            await Toast.show({ text: 'Failed to copy prompt.', duration: 'short' });
        }
    }, [jsonText]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative w-full max-w-2xl bg-[rgb(var(--color-card))] border-2 border-[rgb(var(--color-border))] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--color-border))]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-[rgb(var(--color-highlight)/0.15)] text-[rgb(var(--color-foreground))]">
                                <FileJson size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold uppercase tracking-tight text-[rgb(var(--color-foreground))]">
                                    Auto-fill from JSON
                                </h2>
                                <p className="text-xs text-[rgb(var(--color-muted-foreground))]">
                                    Drop a file or paste structured metadata to populate all options instantly.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex items-center justify-between px-6 pt-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background)/0.5)]">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTab('paste')}
                                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-b-2 ${
                                    tab === 'paste'
                                        ? 'border-[rgb(var(--color-foreground))] text-[rgb(var(--color-foreground))] bg-[rgb(var(--color-card))]'
                                        : 'border-transparent text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]'
                                }`}
                            >
                                <FileText size={14} /> Paste JSON
                            </button>
                            <button
                                onClick={() => setTab('upload')}
                                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-b-2 ${
                                    tab === 'upload'
                                        ? 'border-[rgb(var(--color-foreground))] text-[rgb(var(--color-foreground))] bg-[rgb(var(--color-card))]'
                                        : 'border-transparent text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]'
                                }`}
                            >
                                <UploadIcon size={14} /> Drop / Upload File
                            </button>
                        </div>

                        <div className="flex items-center gap-2 pb-2">
                            <button
                                type="button"
                                onClick={copyAiPrompt}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-xl bg-[rgb(var(--color-highlight)/0.15)] hover:bg-[rgb(var(--color-highlight)/0.25)] text-[rgb(var(--color-foreground))] border border-[rgb(var(--color-highlight)/0.3)] transition-colors cursor-pointer"
                                title="Copy AI prompt with original font JSON and strict schema constraints for Claude / ChatGPT / Gemini"
                            >
                                {copiedPrompt ? <Check size={13} className="text-green-500" /> : <Sparkles size={13} className="text-[rgb(var(--color-highlight))]" />}
                                <span>{copiedPrompt ? 'Prompt Copied!' : 'Copy AI Prompt'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={copySchemaFormat}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-xl bg-[rgb(var(--color-foreground)/0.06)] hover:bg-[rgb(var(--color-foreground)/0.12)] text-[rgb(var(--color-foreground))] border border-[rgb(var(--color-foreground)/0.1)] transition-colors cursor-pointer"
                                title="Copy structured JSON format template with type specifications"
                            >
                                {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                                <span>{copied ? 'Format Copied!' : 'Copy JSON Format'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {tab === 'upload' ? (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all ${
                                    dragActive
                                        ? 'border-[rgb(var(--color-highlight))] bg-[rgb(var(--color-highlight)/0.08)] scale-[0.99]'
                                        : 'border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-foreground)/0.4)] bg-[rgb(var(--color-background))]'
                                }`}
                            >
                                <div className="p-4 rounded-full bg-[rgb(var(--color-foreground)/0.05)] mb-3 text-[rgb(var(--color-foreground))]">
                                    <FileJson size={32} />
                                </div>
                                <h3 className="font-bold text-sm uppercase mb-1">Drag & Drop your .json file here</h3>
                                <p className="text-xs text-[rgb(var(--color-muted-foreground))] mb-4">
                                    Supports both nested font taxonomy and flat metadata JSON.
                                </p>
                                <label className="px-5 py-2 rounded-full font-bold text-xs uppercase cursor-pointer bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] hover:opacity-90 transition-opacity">
                                    Browse Computer
                                    <input
                                        type="file"
                                        accept=".json,application/json"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                                        }}
                                    />
                                </label>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative">
                                    <textarea
                                        value={jsonText}
                                        onChange={(e) => setJsonText(e.target.value)}
                                        placeholder="Paste your JSON configuration here..."
                                        rows={12}
                                        className="w-full p-4 font-mono text-xs bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-2xl focus:outline-none focus:border-[rgb(var(--color-foreground))] resize-y text-[rgb(var(--color-foreground))]"
                                        spellCheck={false}
                                    />
                                </div>

                                {/* Status bar */}
                                {parseResult && (
                                    <div className={`p-3 rounded-xl flex items-center justify-between text-xs font-mono border ${
                                        parseResult.valid
                                            ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300'
                                            : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            {parseResult.valid ? <Check size={16} /> : <AlertCircle size={16} />}
                                            <span>
                                                {parseResult.valid
                                                    ? `✓ Valid JSON! Detected ${parseResult.count} matching font fields.`
                                                    : `✗ Syntax error: ${parseResult.error}`}
                                            </span>
                                        </div>
                                        {parseResult.valid && parseResult.data?.name && (
                                            <span className="font-bold uppercase tracking-wider text-[11px]">
                                                Font: {parseResult.data.name}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-background)/0.5)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-xs font-bold uppercase rounded-full hover:bg-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-muted-foreground))] transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            disabled={!parseResult?.valid}
                            onClick={handleApply}
                            className={`px-6 py-2.5 text-xs font-bold uppercase rounded-full transition-all flex items-center gap-2 ${
                                parseResult?.valid
                                    ? 'bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] hover:opacity-90 cursor-pointer shadow-md'
                                    : 'bg-[rgb(var(--color-muted))] text-[rgb(var(--color-muted-foreground))] opacity-50 cursor-not-allowed'
                            }`}
                        >
                            <Check size={14} /> {applyLabel} {parseResult?.valid ? `(${parseResult.count} Fields)` : ''}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
