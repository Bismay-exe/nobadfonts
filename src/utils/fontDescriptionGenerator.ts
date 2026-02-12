
export type Font = {
    name: string;
    tags?: string[] | null;
    variants?: string[] | null;
    category?: string | null;
    designer?: string | null;
    formats?: string[] | null;
};

// --- Constants & Dictionaries ---

const CLASSIFICATION_TEXT: Record<string, string[]> = {
    sans: ["a clean sans serif typeface"],
    serif: ["a refined serif typeface"],
    display: ["a display font designed for large sizes"],
    script: ["a flowing script typeface"],
    'slab-serif': ["a robust slab serif typeface"],
    monospace: ["a precise monospace typeface"],
    calligraphy: ["an elegant calligraphy typeface"],
    brush: ["an expressive brush typeface"],
    handwritten: ["a personal handwritten typeface"],
};

const STYLE_TEXT: Record<string, string[]> = {
    playful: [
        "with a lively and expressive personality",
        "bringing a fun and energetic tone"
    ],

    elegant: [
        "with refined and elegant details",
        "showing graceful and balanced proportions"
    ],

    luxury: [
        "with a refined and luxurious character",
        "designed to convey a premium and sophisticated feel",
        "suited for high-end branding and upscale visual identities"
    ],

    modern: [
        "with a modern and contemporary feel",
        "reflecting current design aesthetics"
    ],

    geometric: [
        "built on geometric shapes",
        "constructed from precise geometric forms"
    ],

    brutalist: [
        "with a bold brutalist structure",
        "emphasizing raw and uncompromising forms"
    ],

    classic: [
        "with a timeless classic appeal",
        "inspired by traditional typographic conventions"
    ],

    minimal: [
        "with a clean minimal aesthetic",
        "reduced to simple and essential forms"
    ],

    bold: [
        "with a strong bold presence",
        "creating a confident and impactful impression"
    ],

    experimental: [
        "with an experimental character",
        "exploring unconventional letterforms and structure"
    ],

    organic: [
        "with organic natural forms",
        "inspired by fluid and natural shapes"
    ],
};

const FEATURE_TEXT: Record<string, string> = {
    rounded: "soft rounded terminals",
    stencil: "stencil-style cuts",
    outline: "outline styling",
    pixel: "a pixel-based construction",
    inktrap: "ink traps that improve readability at small sizes",
    inline: "decorative inline details",
    square: "squared-off terminals",
};

const SHAPE_TEXT: Record<string, string> = {
    condensed: "condensed letterforms",
    wide: "wide letterforms",
    tall: "tall proportions",
    heavy: "heavy strokes",
    extended: "extended widths",
    "normal-width": "balanced proportions",
    hairline: "ultra-thin strokes",
};

const USECASE_TEXT: Record<string, string> = {
    branding: "branding projects",
    logo: "logo design",
    headline: "headlines",
    poster: "posters",
    corporate: "corporate identities",
    tech: "tech and UI interfaces",
    "social-media": "social media content",
};

const TONE_PHRASES: Record<string, string[]> = {
    retro: ["inspired by vintage signage and classic print"],
    vintage: ["with a nostalgic atmosphere"],
    futuristic: ["with a forward-looking futuristic aesthetic"],
    cyberpunk: ["with a sharp cyberpunk influence"],
    gothic: ["with a distinct gothic influence"],
    casual: ["with a relaxed casual vibe"],
    y2k: ["with a trendy Y2K aesthetic"],
};

const CLOSING_BY_CONTEXT: Record<string, string[]> = {
    tech: [
        "It performs reliably in modern digital interfaces and UI layouts.",
        "Its clarity and structure make it well suited for screens and interface design."
    ],
    display: [
        "Its strong presence helps designs stand out in large-scale compositions.",
        "It maintains excellent visual impact in headlines and large typography."
    ],
    editorial: [
        "It reads comfortably in longer text and editorial compositions.",
        "Its balanced proportions make it suitable for both print and digital publishing."
    ],
    general: [
        "It adapts well across both print and digital layouts.",
        "Its balanced design helps it perform consistently in a wide range of projects."
    ]
};

const FEATURE_VERBS = [
    "features",
    "includes",
    "offers",
    "incorporates",
    "presents"
];

const USAGE_VERBS = [
    "works well for",
    "is well suited for",
    "performs effectively in",
    "is ideal for",
    "adapts well to"
];

const CONNECTORS = [
    "Additionally",
    "At the same time",
    "In practice",
    "As a result",
    "Because of this"
];

const FONT_REFERENCES = [
    "it",
    "the typeface",
    "the font",
    "the family"
];

// --- Helpers ---

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function formatList(items: string[]): string {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return items.join(" and ");
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
}

const PROPER_NOUNS = [
    "Swiss", "English", "French", "German", "Latin", "Greek", "Cyrillic", "Hebrew", "Arabic",
    "Gothic", "Roman", "Italic", "Humanist", "Grotesque", "Geometric"
];

function normalizeTag(tag: string): string {
    // Handle CamelCase (e.g. "SansSerif" -> "sans-serif") and spaces
    return tag
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .toLowerCase()
        .replace(/[\s_]+/g, "-");
}

function pickVerbNoRepeat(pool: string[], lastVerb?: string): string {
    const filtered = lastVerb ? pool.filter(v => v !== lastVerb) : pool;
    return pickRandom(filtered.length ? filtered : pool);
}

function maybeConnector(): string {
    return Math.random() < 0.4
        ? pickRandom(CONNECTORS) + ", "
        : "";
}

function maybeMergeSentences(a: string, b: string): string[] {
    if (!a || !b || Math.random() > 0.5) {
        return [a, b].filter(Boolean);
    }

    const cleanA = a.replace(/[.]+$/, ""); // Remove trailing dot(s)

    // Check if B starts with a proper noun
    const firstWord = b.split(' ')[0].replace(/[^a-zA-Z]/g, '');
    const isProper = PROPER_NOUNS.includes(firstWord);

    const cleanB = isProper
        ? b
        : b.replace(/^[A-Z](?=[a-z])/, m => m.toLowerCase());

    return [`${cleanA}, ${cleanB}`];
}

function describeVariants(variants?: string[]): string {
    if (!variants || variants.length === 0) return "";

    const weightCount = variants.filter(v => !v.toLowerCase().includes("italic")).length;
    const hasItalic = variants.some(v => v.toLowerCase().includes("italic"));

    // If we can't determine weights reliably or it's just 1, simplify
    if (weightCount <= 1 && !hasItalic) return "";

    let text = `The family includes ${weightCount > 0 ? weightCount + ' weights' : 'multiple styles'}`;
    if (hasItalic) text += " with matching italic styles";

    return text + ", providing flexibility across different design needs.";
}

function detectClosingContext(tags: string[]): string {
    if (tags.some(t => ["tech", "cyberpunk", "futuristic"].includes(t)))
        return "tech";

    if (tags.some(t => ["display", "headline"].includes(t)))
        return "display";

    if (tags.some(t => ["serif", "editorial"].includes(t)))
        return "editorial";

    return "general";
}

function maybeAddClosing(tags: string[]): string | null {
    if (Math.random() > 0.45) return null;

    const context = detectClosingContext(tags);
    const options = CLOSING_BY_CONTEXT[context] || CLOSING_BY_CONTEXT.general;
    return pickRandom(options);
}

function replaceRepeatedFontName(text: string, fontName: string): string {
    let firstFound = false;
    // Escape regex special chars in font name just in case
    const escapedName = fontName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedName}\\b`, "gi");

    return text.replace(regex, match => {
        if (!firstFound) {
            firstFound = true;
            return match; // Keep the first occurrence
        }
        return pickRandom(FONT_REFERENCES);
    });
}

function humanizeDescription(text: string, fontName: string): string {
    let result = text;

    result = replaceRepeatedFontName(result, fontName);

    // Capitalize start of sentences
    result = result.replace(
        /(^\w|[.!?]\s+\w)/g,
        c => c.toUpperCase()
    );

    return result.trim();
}

function shuffleMiddle(sentences: string[]): string[] {
    if (sentences.length <= 2) return sentences;
    // Keep first (intro) and last (closing) fixed-ish, shuffle the middle ones
    // Actually, usually closing is last. Variant is second to last.
    // Let's just shuffle everything between the first (intro) and the last (closing/variant combo).
    // The previous implementation constructed array: [intro+style+tone, merged_construction_usage, variant, closing]
    // So we safely shuffle the middle elements.

    // We expect sentences[0] to be valid intro.
    const middle = sentences.slice(1, -1).sort(() => Math.random() - 0.5);
    return [sentences[0], ...middle, sentences[sentences.length - 1]];
}

// --- Main Generator ---

export function generateDescription(font: Font): string {
    // Optimized tag merging & normalization
    const baseTags = font.tags || [];
    const allTags = font.category ? [...baseTags, font.category] : baseTags;

    // Dedupe with normalization
    const uniqueTags = Array.from(new Set(allTags.map(t => normalizeTag(t))));

    const classTag = uniqueTags.find(t => CLASSIFICATION_TEXT[t]);
    const styleTags = uniqueTags.filter(t => STYLE_TEXT[t]);
    const featureTags = uniqueTags.filter(t => FEATURE_TEXT[t]);
    const shapeTags = uniqueTags.filter(t => SHAPE_TEXT[t]);
    const useTags = uniqueTags.filter(t => USECASE_TEXT[t]);
    const toneTag = uniqueTags.find(t => TONE_PHRASES[t]);

    const intro = `${font.name} is ${classTag
        ? pickRandom(CLASSIFICATION_TEXT[classTag])
        : "a versatile typeface"
        }`;

    const styleSentence =
        styleTags.length
            ? formatList(styleTags.map(t => pickRandom(STYLE_TEXT[t])))
            : "";

    const toneSentence =
        toneTag ? pickRandom(TONE_PHRASES[toneTag]) : "";

    let lastVerb = pickVerbNoRepeat(FEATURE_VERBS);

    const constructionSentence =
        featureTags.length || shapeTags.length
            ? `${maybeConnector()}the design ${lastVerb} ${formatList([
                ...featureTags.map(t => FEATURE_TEXT[t]),
                ...shapeTags.map(t => SHAPE_TEXT[t])
            ])}.`
            : "";

    const usageVerb = pickVerbNoRepeat(USAGE_VERBS, lastVerb);

    const usageSentence =
        useTags.length
            ? `${maybeConnector()}it ${usageVerb} ${formatList(
                useTags.map(t => USECASE_TEXT[t])
            )}.`
            : "";

    const variantSentence = describeVariants(font.variants || undefined);
    const closingSentence = maybeAddClosing(uniqueTags);

    let sentences: string[] = [];

    // Combine Intro, Style, Tone
    let firstPart = intro;
    if (styleSentence) firstPart += ` ${styleSentence}`;
    if (toneSentence) firstPart += `. ${toneSentence}`;
    firstPart += ".";

    sentences.push(firstPart.replace(/\.\./g, ".")); // cleanup double dots if any

    sentences.push(
        ...maybeMergeSentences(constructionSentence, usageSentence)
    );

    if (variantSentence) sentences.push(variantSentence);
    if (closingSentence) sentences.push(closingSentence);

    // Shuffle for variety
    sentences = shuffleMiddle(sentences);

    return humanizeDescription(sentences.join(" "), font.name);
}

// --- Header Tagline Generator ---

export function generateHeaderTagline(font: Font): string {
    const baseTags = font.tags || [];
    const allTags = font.category ? [...baseTags, font.category] : baseTags;
    const uniqueTags = Array.from(new Set(allTags.map(t => normalizeTag(t))));

    // Adjective: prefer style tags (first one found)
    const styleTag = uniqueTags.find(t => STYLE_TEXT[t]);
    const adjective = styleTag ? (styleTag.charAt(0).toUpperCase() + styleTag.slice(1)) : "";

    // Classification noun: prefer classification tags
    const classTag = uniqueTags.find(t => CLASSIFICATION_TEXT[t]);
    let classification = "Font";
    if (classTag) {
        // Map common IDs to display names if needed, or just capitalize
        if (classTag === 'sans') classification = "Sans Serif";
        else if (classTag === 'serif') classification = "Serif Font";
        else if (classTag === 'display') classification = "Display Font";
        else if (classTag === 'script') classification = "Script Font";
        else classification = classTag.charAt(0).toUpperCase() + classTag.slice(1) + " Font";
    }

    // Use Case
    const useTags = uniqueTags.filter(t => USECASE_TEXT[t]);
    let useCaseString = "";
    if (useTags.length > 0) {
        // Take up to 2
        const selected = useTags.slice(0, 2).map(t => {
            // "branding projects" -> "Branding"
            if (t === 'branding') return "Branding";
            if (t === 'logo') return "Logos";
            if (t === 'social-media') return "Social Media";
            // default: capitalize generic
            return t.charAt(0).toUpperCase() + t.slice(1);
        });
        useCaseString = "for " + selected.join(" & ");
    }

    // Construct: "{Name} – {Adjective} {Classification} {UseCase}"
    const parts = [font.name, "–"];

    // Fallback adjective if missing
    if (!adjective) {
        // Simple fallback logic
        parts.push("Professional");
    } else {
        parts.push(adjective);
    }

    parts.push(classification);
    if (useCaseString) parts.push(useCaseString);

    return parts.join(" ");
}

// --- Footer Tagline Generator ---

const FOOTER_ATTRIBUTES: Record<string, string> = {
    elegant: "elegance",
    modern: "modernity",
    tech: "the future",
    retro: "nostalgia",
    vintage: "timelessness",
    minimal: "clarity",
    bold: "impact",
    playful: "joy",
    geometric: "precision",
    organic: "warmth",
    display: "impact",
    serif: "sophistication",
    sans: "readability"
};

const FOOTER_BENEFITS: Record<string, string> = {
    branding: "memorable branding",
    logo: "distinctive logos",
    headline: "commanding headlines",
    tech: "digital screens",
    editorial: "comfortable reading",
    display: "visual storytelling",
    general: "modern design"
};

export function generateFooterTagline(font: Font): string {
    const baseTags = font.tags || [];
    const allTags = font.category ? [...baseTags, font.category] : baseTags;
    const uniqueTags = Array.from(new Set(allTags.map(t => normalizeTag(t))));

    // Find first matching attribute
    const attrTag = uniqueTags.find(t => FOOTER_ATTRIBUTES[t]);
    const attribute = attrTag ? FOOTER_ATTRIBUTES[attrTag] : "excellence";

    // Find benefit based on context
    const context = detectClosingContext(uniqueTags); // tech, display, editorial, general
    // Or try to find specific use case tags first
    const useTag = uniqueTags.find(t => FOOTER_BENEFITS[t]);

    let benefit = "timeless design";
    if (useTag) benefit = FOOTER_BENEFITS[useTag];
    else if (FOOTER_BENEFITS[context]) benefit = FOOTER_BENEFITS[context];
    else benefit = FOOTER_BENEFITS.general;

    // "Designed for {Attribute}, crafted for {Benefit}."
    return `Designed for ${attribute}, crafted for ${benefit}.`;
}

export function generateTagline(font: Font): string {
    const baseTags = font.tags || [];
    const allTags = font.category ? [...baseTags, font.category] : baseTags;
    const uniqueTags = Array.from(new Set(allTags.map(t => normalizeTag(t))));

    const styleTag = uniqueTags.find(t => STYLE_TEXT[t]);
    const classTag = uniqueTags.find(t => CLASSIFICATION_TEXT[t]);
    const useTag = uniqueTags.find(t => USECASE_TEXT[t]);

    const style = styleTag ? STYLE_TEXT[styleTag][0] : "";
    const classification = classTag
        ? CLASSIFICATION_TEXT[classTag][0].replace("a ", "")
        : "typeface";
    const usecase = useTag ? "for " + USECASE_TEXT[useTag] : "";

    return [style, classification, usecase]
        .filter(Boolean)
        .join(" ")
        .replace(/\.$/, ""); // remove trailing dot if any from dicts
}

export function generateFontFeaturesList(font: Font): string[] {
    const features: string[] = [];

    // Add variants summary
    const variants = font.variants || [];
    const hasItalic = variants.some(v => v.toLowerCase().includes('italic'));
    const regular = variants.some(v => v.toLowerCase().includes('regular'));

    if (regular && hasItalic) features.push("Regular version includes Italic");

    // Add generic features if we have basic chars (which we assume for most fonts here)
    features.push("Character set A-Z in Uppercase and Lowercase");
    features.push("Numerals & Punctuation");

    // Add specific features based on tags
    const tags = font.tags || [];
    if (tags.includes('multi-lang') || tags.includes('multilingual')) features.push("Multiple Languages Supported");
    if (tags.includes('ligatures')) features.push("Standard Ligatures");
    if (tags.includes('alternates')) features.push("Stylistic Alternates");

    // Formats
    if (font.formats && font.formats.length > 0) {
        features.push(`Format File: ${font.formats.join(", ").toUpperCase()}`);
    } else {
        features.push("Format File: OTF, TTF, WOFF, WOFF2");
    }

    return features;
}
