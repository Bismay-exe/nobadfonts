import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    Upload as UploadIcon, X, Image as ImageIcon, Link as LinkIcon,
    FileJson, Download, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { useUpload } from '../contexts/UploadContext';
import { FixWoff2Scanner } from '../components/admin/FixWoff2Scanner';
import SEO from '../components/shared/SEO';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Toast } from '@capacitor/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomLock } from '../components/ui/CustomIcons';
import { extractFontMetadata, validateFontFile, validateImageFile } from '../utils/fontValidator';
import { extractRichFontMetadata } from '../utils/fontMetadataExtractor';
import { JsonImportModal, type FontFormState } from '../components/fonts/JsonImportModal';
import { cleanUrl } from '../utils/urlHelper';
import TurnstileWidget from '../components/shared/TurnstileWidget';

export const LICENSE_OPTIONS = [
    {
        id: 'SIL Open Font License (OFL 1.1)',
        name: 'SIL Open Font License (OFL 1.1)',
        badge: 'OFL',
        commercialUse: true,
        description: '100% Free for personal and commercial projects. Open source.'
    },
    {
        id: '100% Free / Public Domain (CC0)',
        name: '100% Free / Public Domain (CC0)',
        badge: '100% Free',
        commercialUse: true,
        description: 'Dedicated to the public domain. Free for all commercial and personal uses.'
    },
    {
        id: 'Free for Personal Use Only',
        name: 'Free for Personal Use Only',
        badge: 'Personal Only',
        commercialUse: false,
        description: 'Free for personal hobby/non-profit projects. Commercial use prohibited without license.'
    },
    {
        id: 'Freeware / Demo / Donationware',
        name: 'Freeware / Demo / Donationware',
        badge: 'Demo',
        commercialUse: false,
        description: 'Trial or demo version. Full commercial release requires separate purchase.'
    }
];

const VARIANT_NAMES = [
    "Thin", "Extra Light", "Light", "Regular", "Medium", "Semi Bold", "Bold", "Extra Bold", "Black",
    "Thin Italic", "Extra Light Italic", "Light Italic", "Regular Italic",
    "Medium Italic", "Semi Bold Italic", "Bold Italic", "Extra Bold Italic", "Black Italic"
];

interface UploadVariantDropdownProps {
    value: string;
    onChange: (value: string) => void;
    availableNames: string[];
}

function UploadVariantDropdown({ value, onChange, availableNames }: UploadVariantDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => {
                    setIsOpen(!isOpen);
                    Haptics.impact({ style: ImpactStyle.Light });
                }}
                className="h-8 px-3 py-1 bg-[rgb(var(--color-muted)/0.1)] hover:bg-[rgb(var(--color-foreground)/0.9)] hover:text-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-md text-xs font-medium whitespace-nowrap hover:border-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out flex items-center gap-2 cursor-pointer"
            >
                {value || 'Select Variant'}
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`absolute left-0 top-full mt-2 w-48 bg-[rgb(var(--color-background)/0.8)] backdrop-blur-2xl border border-[rgb(var(--color-border))] divide-y divide-[rgb(var(--color-border)/0.5)] rounded-xl overflow-y-auto max-h-64 custom-scrollbar transition-all shadow-xl z-20 flex flex-col origin-top-left transform ${isOpen ? 'opacity-100 visible scale-100 pointer-events-auto' : 'opacity-0 invisible scale-95 pointer-events-none'}`}>
                {availableNames.map(name => (
                    <button
                        key={name}
                        type="button"
                        onClick={() => {
                            onChange(name);
                            setIsOpen(false);
                            Haptics.impact({ style: ImpactStyle.Light });
                        }}
                        className="px-4 py-3 text-xs font-bold text-[rgb(var(--color-foreground))] hover:bg-[rgb(var(--color-muted)/0.1)] transition-colors duration-300 ease-in-out text-left flex justify-between items-center cursor-pointer"
                    >
                        <span>{name}</span>
                        {value === name && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-foreground))]"></span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

const CATEGORIES = [
    {
        group: 'Classification',
        items: [
            { id: 'sans', label: 'Sans' },
            { id: 'serif', label: 'Serif' },
            { id: 'slab-serif', label: 'Slab Serif' },
            { id: 'display', label: 'Display' },
            { id: 'monospace', label: 'Mono' },
            { id: 'script', label: 'Script' },
            { id: 'calligraphy', label: 'Calligraphy' },
            { id: 'brush', label: 'Brush' },
            { id: 'handwritten', label: 'Handwritten' },
            { id: 'signature', label: 'Signature' }
        ],
    },
    {
        group: 'Style',
        items: [
            { id: 'modern', label: 'Modern' },
            { id: 'classic', label: 'Classic' },
            { id: 'minimal', label: 'Minimal' },
            { id: 'bold', label: 'Bold' },
            { id: 'elegant', label: 'Elegant' },
            { id: 'luxury', label: 'Luxury' },
            { id: 'playful', label: 'Playful' },
            { id: 'comic', label: 'Comic' },
            { id: 'graffiti', label: 'Graffiti' },
            { id: 'experimental', label: 'Experimental' },
            { id: 'brutalist', label: 'Brutalist' },
            { id: 'industrial', label: 'Industrial' },
            { id: 'editorial', label: 'Editorial' },
            { id: 'geometric', label: 'Geometric' },
            { id: 'organic', label: 'Organic' },
            { id: 'techno', label: 'Techno' },
            { id: 'sci-fi', label: 'Sci-Fi' }
        ],
    },
    {
        group: 'Use Case',
        items: [
            { id: 'branding', label: 'Branding' },
            { id: 'logo', label: 'Logo' },
            { id: 'headline', label: 'Headline' },
            { id: 'poster', label: 'Poster' },
            { id: 'editorial-use', label: 'Editorial' },
            { id: 'corporate', label: 'Corporate' },
            { id: 'tech', label: 'Tech / UI' },
            { id: "social-media", label: "Social Media" }
        ],
    },
    {
        group: 'Weight & Shape',
        items: [
            { id: "hairline", label: "Hairline" },
            { id: 'thin', label: 'Thin' },
            { id: 'light', label: 'Light' },
            { id: "normal-width", label: "Normal Width" },
            { id: 'heavy', label: 'Heavy' },
            { id: 'tall', label: 'Tall' },
            { id: 'condensed', label: 'Condensed' },
            { id: 'wide', label: 'Wide' },
            { id: "extended", label: "Extended" },
        ],
    },
    {
        group: "Construction & Features",
        items: [
            { id: "inktrap", label: "Ink Trap" },
            { id: "rounded", label: "Rounded" },
            { id: "square", label: "Square" },
            { id: 'sharp', label: 'Sharp' },
            { id: "stencil", label: "Stencil" },
            { id: "outline", label: "Outline" },
            { id: "inline", label: "Inline" },
            { id: "pixel", label: "Pixel / Bitmap" },
            { id: "messy", label: "Messy" }
        ]
    },
    {
        group: 'Era & Vibe',
        items: [
            { id: 'casual', label: 'Casual' },
            { id: 'retro', label: 'Retro' },
            { id: 'vintage', label: 'Vintage' },
            { id: 'cyberpunk', label: 'Cyberpunk' },
            { id: 'futuristic', label: 'Futuristic' },
            { id: 'gothic', label: 'Gothic' },
            { id: 'y2k', label: 'Y2K' }
        ],
    },
];

const Upload = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Comprehensive Structured Form State
    const [formState, setFormState] = useState<FontFormState>({
        // Identity
        name: '',
        familyName: '',
        version: '',
        releaseYear: '',

        // Creator
        designer: '',
        foundry: '',
        publisher: '',

        // Classification
        category: 'sans',
        subcategory: '',
        style: 'modern',
        tags: ['sans'],
        mood: [],
        recommendedUses: [],

        // Description
        description: '',
        history: '',
        characteristics: '',

        // License (3-step)
        distributionStatus: 'open_source',
        licenseType: 'SIL Open Font License (OFL 1.1)',
        licenseUrl: '',
        commercialUse: true,
        personalUse: true,
        modificationAllowed: true,
        redistributionAllowed: true,
        licenseEvidence: '',

        // Official Links
        officialWebsite: '',
        officialFontPage: '',
        purchaseUrl: '',
        freeDownloadUrl: '',
        githubUrl: '',
        googleFontsUrl: '',

        // Technical
        glyphCount: undefined,
        languages: ['Latin'],
        opentypeFeatures: [],
    });

    // Detected raw tooling hints (displayed as reference, NOT verified provenance)
    const [detectedHints, setDetectedHints] = useState<{
        manufacturer?: string;
        manufacturerUrl?: string;
        designerUrl?: string;
        copyright?: string;
        postscriptName?: string;
    }>({});

    // Extracted notification banner
    const [extractionSummary, setExtractionSummary] = useState<string | null>(null);

    // Collapsible section state
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showJsonModal, setShowJsonModal] = useState(false);

    // Anti-spam & Bot Protection
    const [honeypot, setHoneypot] = useState('');
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

    // Banner state
    const [bannerItems, setBannerItems] = useState<{ id: string, type: 'file' | 'url', content: File | string }[]>([]);
    const [urlInput, setUrlInput] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);

    // Variant State
    type FontVariant = {
        id: string;
        name: string;
        isCustom?: boolean;
        files: {
            ttf: File | null;
            otf: File | null;
            woff: File | null;
            woff2: File | null;
        };
    };
    const [variants, setVariants] = useState<FontVariant[]>([{
        id: 'initial-1',
        name: 'Regular',
        files: { ttf: null, otf: null, woff: null, woff2: null }
    }]);

    // Compute dynamic technical attributes
    const dynamicFormats = useMemo(() => {
        const set = new Set<string>();
        variants.forEach(v => {
            (['ttf', 'otf', 'woff', 'woff2'] as const).forEach(f => {
                if (v.files[f]) set.add(f.toUpperCase());
            });
        });
        return Array.from(set);
    }, [variants]);

    const dynamicWeights = useMemo(() => {
        const weightMap: Record<string, number> = {
            hairline: 100, thin: 100, 'extra light': 200, light: 300, regular: 400,
            medium: 500, 'semi bold': 600, bold: 700, 'extra bold': 800, black: 900, heavy: 900
        };
        const weights: number[] = [];
        variants.forEach(v => {
            const lower = v.name.toLowerCase().replace('italic', '').trim();
            const w = weightMap[lower] || 400;
            if (!weights.includes(w)) weights.push(w);
        });
        return weights.sort((a, b) => a - b);
    }, [variants]);

    const dynamicStyles = useMemo(() => {
        const styles = new Set<string>();
        variants.forEach(v => {
            if (v.name.toLowerCase().includes('italic')) styles.add('Italic');
            else styles.add('Regular');
        });
        return Array.from(styles);
    }, [variants]);

    // Live slug preview
    const slugPreview = useMemo(() => {
        return formState.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }, [formState.name]);

    // Handlers for form inputs
    const handleFieldChange = useCallback((field: keyof FontFormState, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleTagChange = useCallback((tagId: string) => {
        setFormState(prev => {
            const newTags = prev.tags.includes(tagId)
                ? prev.tags.filter(t => t !== tagId)
                : [...prev.tags, tagId];
            return {
                ...prev,
                tags: newTags,
                category: newTags.length > 0 ? newTags[0] : 'sans'
            };
        });
    }, []);

    // 3-Step License Selection Handlers
    const handleDistributionStatusChange = useCallback((status: FontFormState['distributionStatus']) => {
        setFormState(prev => {
            let defaultLicense = prev.licenseType;
            let comm = prev.commercialUse;
            let pers = prev.personalUse;
            let mod = prev.modificationAllowed;
            let redist = prev.redistributionAllowed;

            if (status === 'open_source') {
                defaultLicense = 'SIL Open Font License (OFL 1.1)';
                comm = true;
                pers = true;
                mod = true;
                redist = true;
            } else if (status === 'free') {
                defaultLicense = '100% Free / Public Domain (CC0)';
                comm = true;
                pers = true;
                mod = false;
                redist = true;
            } else if (status === 'demo') {
                defaultLicense = 'Freeware / Demo / Donationware';
                comm = false;
                pers = true;
                mod = false;
                redist = false;
            } else if (status === 'paid') {
                defaultLicense = 'Commercial / Proprietary';
                comm = true;
                pers = true;
                mod = false;
                redist = false;
            } else {
                defaultLicense = 'Custom / Other';
            }

            return {
                ...prev,
                distributionStatus: status,
                licenseType: defaultLicense,
                commercialUse: comm,
                personalUse: pers,
                modificationAllowed: mod,
                redistributionAllowed: redist,
            };
        });
    }, []);

    // Contextual license options for Step 2
    const contextualLicenses = useMemo(() => {
        const ds = formState.distributionStatus;
        if (ds === 'open_source') {
            return [
                { id: 'SIL Open Font License (OFL 1.1)', label: 'SIL OFL 1.1', comm: true, pers: true, mod: true, redist: true },
                { id: 'Apache 2.0', label: 'Apache 2.0', comm: true, pers: true, mod: true, redist: true },
                { id: 'MIT License', label: 'MIT', comm: true, pers: true, mod: true, redist: true },
                { id: '100% Free / Public Domain (CC0)', label: 'CC0 / Public Domain', comm: true, pers: true, mod: true, redist: true },
                { id: 'Custom Open Source', label: 'Custom Open Source', comm: true, pers: true, mod: true, redist: true },
            ];
        }
        if (ds === 'free') {
            return [
                { id: '100% Free / Public Domain (CC0)', label: '100% Free (All Uses)', comm: true, pers: true, mod: false, redist: true },
                { id: 'Free for Personal Use Only', label: 'Personal Use Only', comm: false, pers: true, mod: false, redist: false },
                { id: 'Donationware / Freeware', label: 'Freeware / Donationware', comm: false, pers: true, mod: false, redist: true },
                { id: 'Custom Free License', label: 'Custom Free License', comm: false, pers: true, mod: false, redist: false },
            ];
        }
        if (ds === 'demo') {
            return [
                { id: 'Freeware / Demo / Donationware', label: 'Trial / Demo Version', comm: false, pers: true, mod: false, redist: false },
                { id: 'Personal Evaluation License', label: 'Evaluation Only', comm: false, pers: true, mod: false, redist: false },
                { id: 'Custom Demo', label: 'Custom Demo', comm: false, pers: true, mod: false, redist: false },
            ];
        }
        if (ds === 'paid') {
            return [
                { id: 'Commercial / Proprietary', label: 'Commercial / Proprietary', comm: true, pers: true, mod: false, redist: false },
                { id: 'Desktop & Webfont License', label: 'Desktop & Webfont', comm: true, pers: true, mod: false, redist: false },
                { id: 'Custom Commercial License', label: 'Custom Commercial', comm: true, pers: true, mod: false, redist: false },
            ];
        }
        return [
            { id: 'Unspecified / Other', label: 'Unspecified', comm: false, pers: true, mod: false, redist: false },
            { id: 'Custom License', label: 'Custom License', comm: false, pers: true, mod: false, redist: false },
        ];
    }, [formState.distributionStatus]);

    const handleLicenseSelect = useCallback((lic: { id: string; comm: boolean; pers: boolean; mod: boolean; redist: boolean }) => {
        setFormState(prev => ({
            ...prev,
            licenseType: lic.id,
            commercialUse: lic.comm,
            personalUse: lic.pers,
            modificationAllowed: lic.mod,
            redistributionAllowed: lic.redist,
        }));
    }, []);

    // Banner file handlers
    const handleBannerFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const validFiles: { id: string; type: 'file'; content: File }[] = [];

            for (const file of files) {
                const validation = await validateImageFile(file);
                if (!validation.valid) {
                    await Toast.show({ text: `${file.name}: ${validation.error}`, duration: 'long' });
                    continue;
                }
                validFiles.push({
                    id: Math.random().toString(36).substring(7),
                    type: 'file' as const,
                    content: file
                });
            }

            if (validFiles.length > 0) {
                setBannerItems(prev => [...prev, ...validFiles]);
            }
        }
    }, []);

    const addBannerUrl = useCallback(() => {
        if (!urlInput) return;
        setBannerItems(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            type: 'url',
            content: urlInput
        }]);
        setUrlInput('');
        setShowUrlInput(false);
    }, [urlInput]);

    const removeBannerItem = useCallback((id: string) => {
        setBannerItems(prev => prev.filter(item => item.id !== id));
    }, []);

    // Variant Helpers
    const addVariant = useCallback(() => {
        setVariants(prev => {
            if (prev.length >= VARIANT_NAMES.length + 10) return prev;
            const usedNames = prev.map(v => v.name);
            const firstAvailableName = VARIANT_NAMES.find(name => !usedNames.includes(name)) || 'Regular';

            return [
                ...prev,
                {
                    id: Math.random().toString(36).substring(7),
                    name: firstAvailableName,
                    files: { ttf: null, otf: null, woff: null, woff2: null }
                }
            ];
        });
    }, []);

    const addCustomVariant = useCallback(() => {
        setVariants(prev => [
            ...prev,
            {
                id: Math.random().toString(36).substring(7),
                name: '',
                isCustom: true,
                files: { ttf: null, otf: null, woff: null, woff2: null }
            }
        ]);
    }, []);

    const addVariableFont = useCallback(() => {
        setVariants(prev => [
            ...prev,
            {
                id: Math.random().toString(36).substring(7),
                name: 'Variable',
                isCustom: true,
                files: { ttf: null, otf: null, woff: null, woff2: null }
            }
        ]);
    }, []);

    const removeVariant = useCallback((id: string) => {
        setVariants(prev => prev.filter(v => v.id !== id));
    }, []);

    const updateVariantName = useCallback((id: string, name: string) => {
        setVariants(prev => prev.map(v => v.id === id ? { ...v, name } : v));
    }, []);

    // File assignment + OpenType Extraction Engine
    const updateVariantFile = useCallback(async (id: string, format: keyof FontVariant['files'], file: File | null) => {
        if (!file) {
            setVariants(prev => prev.map(v => v.id === id ? {
                ...v,
                files: { ...v.files, [format]: null }
            } : v));
            return;
        }

        // Validate font extension and binary signature
        const validation = await validateFontFile(file, format);
        if (!validation.valid) {
            await Toast.show({
                text: `${file.name}: ${validation.error || 'Invalid font file.'}`,
                duration: 'long'
            });
            return;
        }

        setVariants(prev => prev.map(v => v.id === id ? {
            ...v,
            files: { ...v.files, [format]: file }
        } : v));

        // Auto-extract metadata from TTF, OTF, WOFF, or WOFF2
        if (format === 'ttf' || format === 'otf' || format === 'woff' || format === 'woff2') {
            const meta = await extractRichFontMetadata(file);
            let extractedCount = 0;

            // Auto-update variant name if it's currently generic and a specific subfamily was extracted
            if (meta.subfamily_name && meta.subfamily_name !== 'Regular') {
                setVariants(prev => prev.map(v => v.id === id && v.name === 'Regular' ? { ...v, name: meta.subfamily_name! } : v));
            }

            setFormState(prev => {
                const next = { ...prev };
                if (!prev.name && meta.name) { next.name = meta.name; extractedCount++; }
                if (!prev.familyName && meta.family_name) { next.familyName = meta.family_name; extractedCount++; }
                if (!prev.version && meta.version) { next.version = meta.version; extractedCount++; }
                if (!prev.designer && meta.designer) { next.designer = meta.designer; extractedCount++; }
                if (!prev.description && meta.description) { next.description = meta.description; extractedCount++; }
                if (!prev.licenseUrl && meta.detected_license_url) { next.licenseUrl = meta.detected_license_url; extractedCount++; }

                if (meta.glyph_count) {
                    next.glyphCount = meta.glyph_count;
                    extractedCount++;
                }
                if (meta.opentype_features && meta.opentype_features.length > 0) {
                    next.opentypeFeatures = meta.opentype_features;
                    extractedCount++;
                }
                if (meta.detected_languages && meta.detected_languages.length > 0) {
                    next.languages = meta.detected_languages;
                    extractedCount++;
                }

                // If license detected and user hasn't modified it yet
                if (meta.suggested_distribution_status) {
                    next.distributionStatus = meta.suggested_distribution_status;
                    if (meta.suggested_license_type) next.licenseType = meta.suggested_license_type;
                    if (meta.suggested_commercial_use !== undefined) next.commercialUse = meta.suggested_commercial_use;
                    if (meta.suggested_personal_use !== undefined) next.personalUse = meta.suggested_personal_use;
                }

                return next;
            });

            // Store tooling hints (NOT verified provenance)
            setDetectedHints({
                manufacturer: meta.detected_manufacturer,
                manufacturerUrl: meta.detected_manufacturer_url,
                designerUrl: meta.detected_designer_url,
                copyright: meta.detected_copyright,
                postscriptName: meta.postscript_name,
            });

            console.log('[Upload] OpenType binary metadata extracted:', meta);

            const foundAttributes: string[] = [];
            if (meta.name) foundAttributes.push(`"${meta.name}"`);
            if (meta.designer) foundAttributes.push(`Designer: "${meta.designer}"`);
            if (meta.version) foundAttributes.push(`v${meta.version}`);
            foundAttributes.push(`${meta.glyph_count || 0} glyphs`);
            foundAttributes.push(`${meta.opentype_features?.length || 0} layout features`);
            if (meta.detected_languages && meta.detected_languages.length > 0) {
                foundAttributes.push(`Scripts: ${meta.detected_languages.join(', ')}`);
            }
            if (meta.is_variable) {
                foundAttributes.push('Variable font');
            }

            const missingAttributes: string[] = [];
            if (!meta.designer) missingAttributes.push('Designer');
            if (!meta.suggested_license_type && !meta.detected_license_url) missingAttributes.push('License');

            const missingNote = missingAttributes.length > 0
                ? ` (${missingAttributes.join(' & ')} not embedded in font file by author)`
                : '';

            setExtractionSummary(
                `✨ Analyzed ${file.name}: ${foundAttributes.join(' · ')}${missingNote}`
            );
            await Haptics.impact({ style: ImpactStyle.Light });
        }
    }, []);

    // Apply JSON data imported from modal
    const handleApplyJsonData = useCallback((imported: Partial<FontFormState>) => {
        setFormState(prev => ({
            ...prev,
            ...imported,
        }));
    }, []);

    // Export current form state as canonical JSON
    const handleExportJson = useCallback(async () => {
        const canonical = {
            identity: {
                name: formState.name || 'Untitled',
                family_name: formState.familyName || formState.name || 'Untitled',
                slug: slugPreview || 'untitled',
                version: formState.version || '1.000',
                release_year: formState.releaseYear ? Number(formState.releaseYear) : null
            },
            creator: {
                designer: formState.designer || null,
                foundry: formState.foundry || null,
                publisher: formState.publisher || null
            },
            classification: {
                category: formState.category,
                subcategory: formState.subcategory || null,
                style: formState.style || null,
                tags: formState.tags,
                mood: formState.mood,
                recommended_uses: formState.recommendedUses
            },
            description: {
                description: formState.description || null,
                history: formState.history || null,
                characteristics: formState.characteristics || null
            },
            license: {
                distribution_status: formState.distributionStatus,
                license_type: formState.licenseType,
                license_url: formState.licenseUrl || null,
                commercial_use: formState.commercialUse,
                personal_use: formState.personalUse,
                modification_allowed: formState.modificationAllowed,
                redistribution_allowed: formState.redistributionAllowed,
                license_evidence: formState.licenseEvidence || null
            },
            official_links: {
                official_website: formState.officialWebsite || null,
                official_font_page: formState.officialFontPage || null,
                purchase_url: formState.purchaseUrl || null,
                free_download_url: formState.freeDownloadUrl || null,
                github_url: formState.githubUrl || null,
                google_fonts_url: formState.googleFontsUrl || null
            },
            technical: {
                formats: dynamicFormats,
                weights: dynamicWeights,
                styles: dynamicStyles,
                glyph_count: formState.glyphCount || null,
                languages: formState.languages || ['Latin'],
                opentype_features: formState.opentypeFeatures || []
            }
        };

        const jsonStr = JSON.stringify(canonical, null, 2);
        const filename = `${slugPreview || 'font'}-metadata.json`;

        // 1. Trigger actual file download
        try {
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (downloadErr) {
            console.error('File download failed:', downloadErr);
        }

        // 2. Also copy to clipboard for convenience
        try {
            await navigator.clipboard.writeText(jsonStr);
            await Toast.show({ text: `Exported ${filename} downloaded & copied to clipboard!`, duration: 'short' });
        } catch {
            await Toast.show({ text: `Exported ${filename} downloaded!`, duration: 'short' });
        }
    }, [formState, slugPreview, dynamicFormats, dynamicWeights, dynamicStyles]);

    // Current form JSON for pre-populating the JSON import/edit modal
    const currentUploadJsonString = useMemo(() => {
        if (!formState.name && !formState.designer && !formState.description) return '';
        return JSON.stringify({
            identity: {
                name: formState.name || 'Untitled',
                family_name: formState.familyName || formState.name || 'Untitled',
                slug: slugPreview || 'untitled',
                version: formState.version || '1.000',
                release_year: formState.releaseYear ? Number(formState.releaseYear) : null
            },
            creator: {
                designer: formState.designer || null,
                foundry: formState.foundry || null,
                publisher: formState.publisher || null
            },
            classification: {
                category: formState.category,
                subcategory: formState.subcategory || null,
                style: formState.style || null,
                tags: formState.tags,
                mood: formState.mood,
                recommended_uses: formState.recommendedUses
            },
            description: {
                description: formState.description || null,
                history: formState.history || null,
                characteristics: formState.characteristics || null
            },
            license: {
                distribution_status: formState.distributionStatus,
                license_type: formState.licenseType,
                license_url: formState.licenseUrl || null,
                commercial_use: formState.commercialUse,
                personal_use: formState.personalUse,
                modification_allowed: formState.modificationAllowed,
                redistribution_allowed: formState.redistributionAllowed,
                license_evidence: formState.licenseEvidence || null
            },
            official_links: {
                official_website: formState.officialWebsite || null,
                official_font_page: formState.officialFontPage || null,
                purchase_url: formState.purchaseUrl || null,
                free_download_url: formState.freeDownloadUrl || null,
                github_url: formState.githubUrl || null,
                google_fonts_url: formState.googleFontsUrl || null
            },
            technical: {
                formats: dynamicFormats,
                weights: dynamicWeights,
                styles: dynamicStyles,
                glyph_count: formState.glyphCount || null,
                languages: formState.languages || ['Latin'],
                opentype_features: formState.opentypeFeatures || []
            }
        }, null, 2);
    }, [formState, slugPreview, dynamicFormats, dynamicWeights, dynamicStyles]);

    const { queueWoff2Conversion } = useUpload();

    // Submission Handler
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        // Honeypot check (bots fill hidden inputs)
        if (honeypot) {
            console.warn('Bot trapped via honeypot.');
            return;
        }

        if (import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken) {
            return await Toast.show({ text: 'Please complete the bot security check.', duration: 'short' });
        }

        if (!user) return await Toast.show({ text: 'You must be logged in to upload', duration: 'short' });
        if (!formState.name.trim()) return await Toast.show({ text: 'Please enter a font name.', duration: 'short' });
        if (!formState.licenseType) return await Toast.show({ text: 'Please select a mandatory license specification.', duration: 'short' });
        if (formState.tags.length === 0) return await Toast.show({ text: 'Please select at least one category.', duration: 'short' });

        // Validate variants
        if (variants.length === 0) return await Toast.show({ text: 'Please add at least one font variant.', duration: 'short' });

        // Validate that at least one variant has files OR release zips are present
        const hasManualFiles = variants.some(v => Object.values(v.files).some(f => f !== null));
        const hasAutoDownload = formState.releaseZips && formState.releaseZips.length > 0;
        
        if (!hasManualFiles && !hasAutoDownload) {
            return await Toast.show({ text: 'Please upload files or provide release zip URLs for auto-download.', duration: 'short' });
        }

        await Haptics.impact({ style: ImpactStyle.Medium });
        setLoading(true);

        try {
            const slug = slugPreview;

            // Check if font name already exists
            const { data: existingFont } = await supabase
                .from('fonts')
                .select('id')
                .eq('slug', slug)
                .maybeSingle();

            if (existingFont) {
                throw new Error('A font with this name already exists. Please choose a unique name.');
            }
            const folderPath = `${user.id}/${slug}`;
            const galleryUrls: string[] = [];
            const gallerySizes: number[] = [];

            // Process Banner Items
            for (const item of bannerItems) {
                if (item.type === 'file') {
                    const file = item.content as File;
                    gallerySizes.push(file.size);

                    const bannerPath = `${folderPath}/gallery/${Date.now()}-${file.name}`;
                    const { error: bannerUploadError } = await supabase.storage
                        .from('fonts')
                        .upload(bannerPath, file, { upsert: true });

                    if (bannerUploadError) {
                        console.error(`Failed to upload banner ${file.name}:`, bannerUploadError);
                        continue;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('fonts')
                        .getPublicUrl(bannerPath);

                    galleryUrls.push(publicUrl);
                } else if (item.type === 'url') {
                    gallerySizes.push(0);
                    galleryUrls.push(item.content as string);
                }
            }

            const previewImageUrl = galleryUrls.length > 0 ? galleryUrls[0] : null;
            const previewImageSize = gallerySizes.length > 0 ? gallerySizes[0] : null;

            // Compute SHA-256 hash of primary font file for deduplication
            let fontFileHash: string | null = null;
            const primaryFile = variants[0]?.files.ttf || variants[0]?.files.otf || variants[0]?.files.woff2 || variants[0]?.files.woff;
            const fontMetadata = primaryFile ? await extractFontMetadata(primaryFile) : {};
            if (primaryFile) {
                try {
                    const buffer = await primaryFile.arrayBuffer();
                    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
                    fontFileHash = Array.from(new Uint8Array(hashBuffer))
                        .map(b => b.toString(16).padStart(2, '0')).join('');
                } catch (hashErr) {
                    console.warn('Failed to compute font file hash:', hashErr);
                }
            }

            // 1. Insert into fonts table
            const { error: dbError } = await supabase
                .from('fonts')
                .insert([
                    {
                        name: formState.name,
                        designer: formState.designer || 'Unknown',
                        category: formState.category || formState.tags[0] || 'sans',
                        tags: formState.tags,
                        description: formState.description || null,
                        license_type: formState.licenseType,
                        commercial_use: formState.commercialUse,
                        slug: slug,
                        is_published: true,
                        user_id: user.id,
                        font_file_hash: fontFileHash,
                        glyph_count: formState.glyphCount || null,
                        weights: dynamicWeights.length > 0 ? dynamicWeights : [400],
                        has_italic: dynamicStyles.includes('Italic'),
                        research_status: 'unresearched',

                        preview_image_url: previewImageUrl,
                        file_size_image_preview: previewImageSize,
                        gallery_images: galleryUrls,
                        gallery_image_sizes: gallerySizes,
                        uploaded_by: user.id,
                    }
                ]);

            if (dbError) {
                console.error('Database Error:', dbError);
                throw new Error(`Database insert failed: ${dbError.message}`);
            }

            // Retrieve new font ID
            const { data: insertedFont, error: insertError } = await supabase
                .from('fonts')
                .select('id')
                .eq('slug', slug)
                .single();

            if (insertError || !insertedFont) throw new Error('Failed to retrieve new font ID');

            // 2. Upsert comprehensive metadata into font_research table
            // Stores first-class columns + full structured JSON taxonomy in JSONB
            const canonicalTaxonomy = {
                identity: {
                    name: formState.name,
                    family_name: formState.familyName || formState.name,
                    slug: slug,
                    version: formState.version || '1.000',
                    release_year: formState.releaseYear ? Number(formState.releaseYear) : null,
                },
                creator: {
                    designer: formState.designer,
                    foundry: formState.foundry,
                    publisher: formState.publisher,
                },
                classification: {
                    category: formState.category,
                    subcategory: formState.subcategory,
                    style: formState.style,
                    tags: formState.tags,
                    mood: formState.mood,
                    recommended_uses: formState.recommendedUses,
                },
                description: {
                    description: formState.description,
                    history: formState.history,
                    characteristics: formState.characteristics,
                },
                license: {
                    distribution_status: formState.distributionStatus,
                    license_type: formState.licenseType,
                    license_url: cleanUrl(formState.licenseUrl),
                    commercial_use: formState.commercialUse,
                    personal_use: formState.personalUse,
                    modification_allowed: formState.modificationAllowed,
                    redistribution_allowed: formState.redistributionAllowed,
                    license_evidence: formState.licenseEvidence,
                },
                official_links: {
                    official_website: cleanUrl(formState.officialWebsite),
                    official_font_page: cleanUrl(formState.officialFontPage),
                    purchase_url: cleanUrl(formState.purchaseUrl),
                    free_download_url: cleanUrl(formState.freeDownloadUrl),
                    github_url: cleanUrl(formState.githubUrl),
                    google_fonts_url: cleanUrl(formState.googleFontsUrl),
                },
                technical: {
                    formats: dynamicFormats,
                    weights: dynamicWeights,
                    styles: dynamicStyles,
                    glyph_count: formState.glyphCount,
                    languages: formState.languages,
                    opentype_features: formState.opentypeFeatures,
                }
            };

            const { error: metadataError } = await supabase.from('font_research').upsert({
                font_id: insertedFont.id,
                foundry: formState.foundry || null,
                official_website: cleanUrl(formState.officialWebsite),
                official_font_page: cleanUrl(formState.officialFontPage),
                purchase_url: cleanUrl(formState.purchaseUrl),
                free_download_url: cleanUrl(formState.freeDownloadUrl),
                license_url: cleanUrl(formState.licenseUrl),
                license_type_verified: formState.licenseType,
                commercial_use_verified: formState.commercialUse,
                personal_use_verified: formState.personalUse,
                ai_description: formState.description || null,
                font_metadata_extracted: {
                    ...fontMetadata,
                    detected_hints: detectedHints,
                    taxonomy: canonicalTaxonomy,
                },
                research_status: 'unresearched',
            }, { onConflict: 'font_id' });

            if (metadataError) console.warn('Failed to store font research metadata:', metadataError);

            // 3. Upload and Insert Variants
            const variantsToConvert: { id: string; name: string; files: { ttf: File | null; otf: File | null } }[] = [];

            for (const variant of variants) {
                const variantUrls: any = {};
                const variantSizes: any = {};
                const promises = [];

                if (!variant.files.woff2 && (variant.files.ttf || variant.files.otf)) {
                    variantsToConvert.push({
                        id: variant.id,
                        name: variant.name,
                        files: { ttf: variant.files.ttf, otf: variant.files.otf }
                    });
                }

                for (const format of ['ttf', 'otf', 'woff', 'woff2'] as const) {
                    const file = variant.files[format];
                    if (file) {
                        const variantSlug = variant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        const newFileName = `${slug}-${variantSlug}.${format}`;
                        const variantPath = `${folderPath}/variants/${variant.name}/${newFileName}`;

                        const uploadVariantFile = async () => {
                            const { error: uploadError } = await supabase.storage
                                .from('fonts')
                                .upload(variantPath, file, { upsert: true });

                            if (uploadError) throw new Error(`Failed to upload ${variant.name} ${format.toUpperCase()}: ${uploadError.message}`);

                            const { data: { publicUrl } } = supabase.storage
                                .from('fonts')
                                .getPublicUrl(variantPath);

                            return publicUrl;
                        };

                        promises.push(uploadVariantFile().then(url => {
                            variantUrls[`${format}_url`] = url;
                            variantSizes[`file_size_${format}`] = file.size;
                        }));
                    }
                }

                if (promises.length > 0) {
                    await Promise.all(promises);

                    const { error: variantError } = await supabase
                        .from('font_variants')
                        .insert({
                            font_id: insertedFont.id,
                            variant_name: variant.name,
                            ...variantUrls,
                            ...variantSizes
                        });

                    if (variantError) console.error(`Failed to save variant ${variant.name}`, variantError);
                }
            }

            // 4. Queue automated background downloads from release zips
            if (hasAutoDownload) {
                console.log('Queuing release zip downloads:', formState.releaseZips);
                const { error: queueError } = await supabase
                    .from('font_processing_queue')
                    .insert({
                        font_id: insertedFont.id,
                        slug: slug,
                        download_urls: formState.releaseZips
                    });
                
                if (queueError) {
                    console.error('Failed to queue release zip downloads:', queueError);
                    await Toast.show({ text: `⚠️ Upload succeeded but auto-download queue failed: ${queueError.message}`, duration: 'long' });
                } else {
                    console.log('✅ Queued release zip downloads successfully');
                }
            }

            // Queue background conversion for missing WOFF2
            if (variantsToConvert.length > 0) {
                queueWoff2Conversion(insertedFont.id, slug, variantsToConvert);
            }

            await Toast.show({ text: `Typeface "${formState.name}" published successfully!`, duration: 'short' });
            navigate(`/fonts/${slug}`);

        } catch (error: any) {
            console.error('Upload error:', error);
            await Toast.show({ text: error.message || 'An error occurred during upload.', duration: 'long' });
        } finally {
            setLoading(false);
        }
    }, [user, formState, slugPreview, variants, dynamicFormats, dynamicWeights, dynamicStyles, detectedHints, bannerItems, honeypot, turnstileToken, queueWoff2Conversion, navigate]);

    // Role Check
    if (!profile || (profile.role !== 'member' && profile.role !== 'admin')) {
        return (
            <div className="pt-24 flex flex-col items-center justify-center w-full md:h-[86vh] max-w-480 bg-[rgb(var(--color-background))] rounded-4xl text-center space-y-6 z-90">
                <div className="bg-[rgb(var(--color-destructive)/0.9)] p-10 rounded-full mt-40 md:mt-0">
                    <div className="text-6xl">
                        <CustomLock className='h-24 w-24' />
                    </div>
                </div>
                <h1 className="text-2xl md:text-4xl font-black uppercase">Access Restricted</h1>
                <p className="text-md md:text-xl text-[rgb(var(--color-muted-foreground))] max-w-sm">
                    Uploading fonts is currently restricted to approved <strong>Members</strong> and <strong>Admins</strong>.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/fonts')} className="px-6 py-3 bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-2xl font-bold hover:scale-105 transition-transform">
                        Explore Fonts
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-24 mx-auto max-w-5xl pb-16">
            <SEO
                title="Upload & Publish Typography | NoBadFonts"
                description="Upload and distribute your open-source typeface on NoBadFonts. Multi-format packaging, glyph validation, and license compliance."
                url="/upload"
                noindex
            />

            {/* Header with Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-6 mb-8">
                <div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-[rgb(var(--color-foreground))] mb-2">
                        Upload Font
                    </h1>
                    <p className="text-sm text-[rgb(var(--color-muted-foreground))] max-w-xl">
                        Drop font files to auto-extract OpenType metadata, or import a JSON preset.
                    </p>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setShowJsonModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase bg-[rgb(var(--color-foreground)/0.06)] hover:bg-[rgb(var(--color-foreground)/0.12)] border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] transition-all cursor-pointer shadow-sm"
                    >
                        <FileJson size={14} className="text-[rgb(var(--color-highlight))]" />
                        Auto-fill from JSON
                    </button>
                    <button
                        type="button"
                        onClick={handleExportJson}
                        className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase bg-[rgb(var(--color-foreground)/0.06)] hover:bg-[rgb(var(--color-foreground)/0.12)] border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] transition-all cursor-pointer shadow-sm"
                    >
                        <Download size={14} />
                        Export JSON
                    </button>
                </div>
            </div>

            {/* Extraction Alert Banner */}
            {extractionSummary && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-2xl bg-[rgb(var(--color-highlight)/0.15)] border border-[rgb(var(--color-highlight)/0.3)] text-xs font-mono flex items-center justify-between text-[rgb(var(--color-foreground))]"
                >
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-[rgb(var(--color-highlight))]" />
                        <span>{extractionSummary}</span>
                    </div>
                    <button
                        onClick={() => setExtractionSummary(null)}
                        className="p-1 text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]"
                    >
                        <X size={14} />
                    </button>
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="rounded-4xl bg-[rgb(var(--color-card)/0.3)] border border-[rgb(var(--color-border))] space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* ════════════════════════════════════════════════════════════════
                    SECTION 1: FONT FILES & VARIANTS (THE ENGINE)
                ════════════════════════════════════════════════════════════════ */}
                <div className="p-4 md:p-8 border-b border-[rgb(var(--color-border))]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <div>
                            <label className="font-bold uppercase text-lg flex items-center gap-2">
                                Font Files & Variants <span className="text-sm text-[rgb(var(--color-destructive))] font-normal normal-case">*Required</span>
                            </label>
                            <p className="text-xs text-[rgb(var(--color-muted-foreground))]">
                                Upload at least one TTF, OTF, or WOFF file. Dropping files automatically auto-populates metadata.
                            </p>
                        </div>
                        {dynamicFormats.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-mono text-[rgb(var(--color-muted-foreground))] uppercase mr-1">Detected:</span>
                                {dynamicFormats.map(fmt => (
                                    <span key={fmt} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[rgb(var(--color-highlight)/0.2)] text-[rgb(var(--color-foreground))]">
                                        {fmt}
                                    </span>
                                ))}
                                {formState.glyphCount && (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgb(var(--color-foreground)/0.08)] text-[rgb(var(--color-muted-foreground))]">
                                        {formState.glyphCount} glyphs
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {formState.releaseZips && formState.releaseZips.length > 0 && (
                        <div className="mb-6 p-4 rounded-2xl bg-[rgb(var(--color-highlight)/0.15)] border border-[rgb(var(--color-highlight)/0.3)]">
                            <h3 className="font-bold text-sm text-[rgb(var(--color-foreground))] mb-2 flex items-center gap-2">
                                <Sparkles size={16} className="text-[rgb(var(--color-highlight))]" />
                                AI Auto-Download Queued
                            </h3>
                            <p className="text-xs text-[rgb(var(--color-foreground)/0.8)] mb-3">
                                {formState.releaseZips.length} release zip{formState.releaseZips.length > 1 ? 's' : ''} will be downloaded, extracted, and processed automatically after submission.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {formState.releaseZips.map((z, i) => (
                                    <span key={i} className="text-[10px] font-mono px-2 py-1 rounded bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-border))] flex items-center gap-1.5">
                                        <span className="text-[rgb(var(--color-highlight))] uppercase font-bold">{z.label}</span>
                                        <span className="text-[rgb(var(--color-muted-foreground))] truncate max-w-[180px]">{z.url.split('/').pop()}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {variants.map((variant) => (
                            <div key={variant.id} className="p-4 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-2xl shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        {variant.isCustom ? (
                                            <input
                                                type="text"
                                                value={variant.name}
                                                onChange={(e) => updateVariantName(variant.id, e.target.value)}
                                                className="bg-[rgb(var(--color-card))] border-2 border-[rgb(var(--color-border))] rounded-xl px-3 py-1 text-sm font-bold focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                                                placeholder="e.g. Semi Bold Italic"
                                                autoFocus
                                            />
                                        ) : (
                                            <UploadVariantDropdown
                                                value={variant.name}
                                                onChange={(value: string) => updateVariantName(variant.id, value)}
                                                availableNames={VARIANT_NAMES.filter(name => name === variant.name || !variants.some(v => v.name === name))}
                                            />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(variant.id)}
                                        className="text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-destructive))] p-1 rounded-lg hover:bg-[rgb(var(--color-destructive)/0.1)] transition-colors duration-300 ease-in-out"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {(['ttf', 'otf', 'woff', 'woff2'] as const).map(format => (
                                        <div key={format} className="relative">
                                            {variant.files[format] ? (
                                                <div className="flex items-center justify-between bg-[rgb(var(--color-highlight)/0.15)] border border-[rgb(var(--color-highlight)/0.3)] text-[rgb(var(--color-foreground))] rounded-xl p-2.5 text-xs font-mono">
                                                    <span className="truncate max-w-25 font-bold">{variant.files[format]?.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateVariantFile(variant.id, format, null)}
                                                        className="p-1 hover:bg-[rgb(var(--color-destructive)/0.2)] rounded text-[rgb(var(--color-destructive))]"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept={`.${format}`}
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) {
                                                                updateVariantFile(variant.id, format, e.target.files[0]);
                                                            }
                                                        }}
                                                        className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                                                    />
                                                    <div className="border-2 border-dashed border-[rgb(var(--color-border))] bg-[rgb(var(--color-card)/0.4)] rounded-xl p-2.5 text-center text-xs font-mono text-[rgb(var(--color-muted-foreground))] hover:border-[rgb(var(--color-foreground))] hover:text-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out flex items-center justify-center gap-1.5">
                                                        <UploadIcon size={12} />
                                                        <span>.{format.toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end items-center mt-4 text-xs">
                        <div className="flex gap-2 flex-wrap justify-end">
                            <button
                                type="button"
                                onClick={addVariableFont}
                                className="px-3.5 py-1.5 rounded-full font-bold bg-[rgb(var(--color-foreground)/0.05)] hover:bg-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out cursor-pointer"
                            >
                                + Variable Font
                            </button>
                            <button
                                type="button"
                                onClick={addCustomVariant}
                                className="px-3.5 py-1.5 rounded-full font-bold bg-[rgb(var(--color-foreground)/0.05)] hover:bg-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out cursor-pointer"
                            >
                                + Custom Variant
                            </button>
                            <button
                                type="button"
                                onClick={addVariant}
                                disabled={variants.length >= VARIANT_NAMES.length + 10}
                                className="px-3.5 py-1.5 rounded-full font-bold bg-[rgb(var(--color-foreground)/0.05)] hover:bg-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out cursor-pointer"
                            >
                                + Std Variant
                            </button>
                        </div>
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════════════
                    SECTION 2: CORE IDENTITY (NAME, DESIGNER, SLUG)
                ════════════════════════════════════════════════════════════════ */}
                <div className="p-4 md:p-8 space-y-4 border-b border-[rgb(var(--color-border))]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-bold mb-1 uppercase text-sm">
                                Font Name <span className="text-[rgb(var(--color-destructive))]">*</span>
                            </label>
                            <input
                                value={formState.name}
                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                placeholder="e.g. Cabinet Grotesk"
                                className="w-full border-2 border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] p-3 rounded-2xl font-bold focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                            />
                            {slugPreview && (
                                <p className="text-[11px] font-mono text-[rgb(var(--color-muted-foreground))] mt-1">
                                    Slug: /fonts/{slugPreview}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block font-bold mb-1 uppercase text-sm">
                                Designer <span className="text-xs font-normal text-[rgb(var(--color-muted-foreground))] lowercase">(optional)</span>
                            </label>
                            <input
                                value={formState.designer}
                                onChange={(e) => handleFieldChange('designer', e.target.value)}
                                placeholder="e.g. Matthieu Salvaggio (or leave blank)"
                                className="w-full border-2 border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] p-3 rounded-2xl font-bold focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                            />
                            {detectedHints.designerUrl && (
                                <p className="text-[11px] font-mono text-[rgb(var(--color-muted-foreground))] mt-1 truncate">
                                    Detected designer URL: {detectedHints.designerUrl}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════════════
                    SECTION 3: 3-STEP LICENSING & PERMISSIONS
                ════════════════════════════════════════════════════════════════ */}
                <div className="p-4 md:p-8 space-y-6 border-b border-[rgb(var(--color-border))]">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="font-bold uppercase text-lg">
                                Licensing & Usage Rights <span className="text-[rgb(var(--color-destructive))]">*</span>
                            </label>
                            <Link to="/legal/terms" target="_blank" className="text-xs text-[rgb(var(--color-muted-foreground))] hover:underline flex items-center gap-1">
                                Licensing Guide ↗
                            </Link>
                        </div>
                        <p className="text-xs text-[rgb(var(--color-muted-foreground))]">
                            Specify the distribution model and explicit permissions for this release.
                        </p>
                    </div>

                    {/* Step 1: Distribution Model */}
                    <div className="space-y-2">
                        <label className="block text-xs font-mono uppercase tracking-wider text-[rgb(var(--color-muted-foreground))]">
                            Step 1 — Distribution Model
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            {[
                                { id: 'open_source', label: 'Open Source', desc: 'Free & source code' },
                                { id: 'free', label: '100% Free', desc: 'Freeware / CC0' },
                                { id: 'demo', label: 'Demo / Trial', desc: 'Personal / sample' },
                                { id: 'paid', label: 'Paid / Store', desc: 'Commercial purchase' },
                                { id: 'unknown', label: 'Unknown', desc: 'Undetermined' },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleDistributionStatusChange(item.id as any)}
                                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${formState.distributionStatus === item.id
                                            ? 'border-[rgb(var(--color-foreground))] bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] shadow-md'
                                            : 'border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] hover:border-[rgb(var(--color-foreground)/0.4)] text-[rgb(var(--color-foreground))]'
                                        }`}
                                >
                                    <div className="font-bold text-sm">{item.label}</div>
                                    <div className={`text-[10px] mt-0.5 ${formState.distributionStatus === item.id ? 'opacity-80' : 'text-[rgb(var(--color-muted-foreground))]'}`}>
                                        {item.desc}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Contextual License Specification */}
                    <div className="space-y-2">
                        <label className="block text-xs font-mono uppercase tracking-wider text-[rgb(var(--color-muted-foreground))]">
                            Step 2 — License Specification
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {contextualLicenses.map(lic => (
                                <button
                                    key={lic.id}
                                    type="button"
                                    onClick={() => handleLicenseSelect(lic)}
                                    className={`px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${formState.licenseType === lic.id
                                            ? 'bg-[rgb(var(--color-highlight))] text-black border-[rgb(var(--color-foreground))] shadow-sm'
                                            : 'bg-[rgb(var(--color-background))] border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-foreground))] text-[rgb(var(--color-foreground))]'
                                        }`}
                                >
                                    {lic.label}
                                </button>
                            ))}
                        </div>
                        <div className="pt-2">
                            <input
                                type="url"
                                value={formState.licenseUrl}
                                onChange={(e) => handleFieldChange('licenseUrl', e.target.value)}
                                placeholder="Official License URL (optional, e.g. https://scripts.sil.org/OFL)"
                                className="w-full text-xs bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-xl p-2.5 font-mono text-[rgb(var(--color-foreground))] focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                            />
                        </div>
                    </div>

                    {/* Step 3: User-Claimed Usage Rights */}
                    <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-mono uppercase tracking-wider text-[rgb(var(--color-muted-foreground))]">
                                Step 3 — User-Claimed Usage Rights
                            </label>
                            <span className="text-[10px] font-mono text-[rgb(var(--color-muted-foreground))] bg-[rgb(var(--color-foreground)/0.05)] px-2 py-0.5 rounded-full">
                                User claim · Pending AI verification
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { key: 'commercialUse', label: 'Commercial Use', val: formState.commercialUse },
                                { key: 'personalUse', label: 'Personal Use', val: formState.personalUse },
                                { key: 'modificationAllowed', label: 'Modification Allowed', val: formState.modificationAllowed },
                                { key: 'redistributionAllowed', label: 'Redistribution Allowed', val: formState.redistributionAllowed },
                            ].map(perm => (
                                <button
                                    key={perm.key}
                                    type="button"
                                    onClick={() => handleFieldChange(perm.key as keyof FontFormState, !perm.val)}
                                    className={`flex items-center justify-between p-3 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${perm.val
                                            ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300'
                                            : 'border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-muted-foreground))]'
                                        }`}
                                >
                                    <span>{perm.label}</span>
                                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${perm.val ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-[rgb(var(--color-foreground)/0.08)]'}`}>
                                        {perm.val ? '✓ Allowed' : '✗ No'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════════════
                    SECTION 4: CATEGORIES & TAGS
                ════════════════════════════════════════════════════════════════ */}
                <div className="p-4 md:p-8 space-y-4 border-b border-[rgb(var(--color-border))]">
                    <label className="block font-bold mb-2 uppercase text-lg">
                        Categories & Classification <span className="text-[rgb(var(--color-destructive))]">*</span>
                    </label>
                    <div className="flex flex-col gap-5 max-h-full overflow-y-auto">
                        {CATEGORIES.map((group, groupIndex) => (
                            <div key={groupIndex} className="flex flex-col gap-2">
                                <h3 className="text-xs font-semibold text-[rgb(var(--color-muted-foreground))] uppercase tracking-widest px-1">
                                    {group.group}
                                </h3>
                                <div className="flex gap-2 flex-wrap">
                                    {group.items.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleTagChange(cat.id)}
                                            className={`
                                                px-3 py-1.5 font-mono rounded-full border text-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer
                                                ${formState.tags.includes(cat.id)
                                                    ? "bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] border-[rgb(var(--color-foreground))] shadow-md font-bold"
                                                    : "text-[rgb(var(--color-foreground)/0.6)] border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] hover:border-[rgb(var(--color-foreground))]"
                                                }
                                            `}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════════════
                    SECTION 5: COLLAPSIBLE ADVANCED PROVENANCE & DETAILS
                ════════════════════════════════════════════════════════════════ */}
                <div className="p-4 md:p-8 border-b border-[rgb(var(--color-border))]">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-foreground)/0.4)] transition-all text-left cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-[rgb(var(--color-foreground)/0.06)] text-[rgb(var(--color-foreground))]">
                                {showAdvanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm uppercase tracking-tight text-[rgb(var(--color-foreground))]">
                                    Advanced Provenance, Story & Official Links
                                </h3>
                                <p className="text-xs text-[rgb(var(--color-muted-foreground))]">
                                    {showAdvanced ? 'Click to collapse additional options' : 'Foundry, release year, history, store links & technical specs'}
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-mono uppercase text-[rgb(var(--color-muted-foreground))] hidden sm:inline">
                            {showAdvanced ? 'Collapse' : 'Expand'}
                        </span>
                    </button>

                    <AnimatePresence>
                        {showAdvanced && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-6 pt-6 overflow-hidden"
                            >
                                {/* Group A: Creator & Provenance */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-mono uppercase tracking-wider text-[rgb(var(--color-muted-foreground))]">
                                        Creator & Provenance
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold mb-1 uppercase">Foundry</label>
                                            <input
                                                value={formState.foundry}
                                                onChange={(e) => handleFieldChange('foundry', e.target.value)}
                                                placeholder="e.g. Indian Type Foundry"
                                                className="w-full text-xs p-2.5 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-xl font-bold focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 uppercase">Publisher</label>
                                            <input
                                                value={formState.publisher}
                                                onChange={(e) => handleFieldChange('publisher', e.target.value)}
                                                placeholder="e.g. Fontshare"
                                                className="w-full text-xs p-2.5 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-xl font-bold focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 uppercase">Original Release Year</label>
                                            <input
                                                type="number"
                                                value={formState.releaseYear}
                                                onChange={(e) => handleFieldChange('releaseYear', e.target.value)}
                                                placeholder="e.g. 2021"
                                                min={1900}
                                                max={2030}
                                                className="w-full text-xs p-2.5 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-xl font-bold focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                                            />
                                        </div>
                                    </div>
                                    {detectedHints.manufacturer && (
                                        <div className="text-[11px] font-mono text-[rgb(var(--color-muted-foreground))] p-2.5 rounded-xl bg-[rgb(var(--color-foreground)/0.03)] border border-[rgb(var(--color-foreground)/0.08)]">
                                            ℹ️ Raw OpenType Tooling / Manufacturer record: <strong>{detectedHints.manufacturer}</strong> (Reference hint only — not verified foundry)
                                        </div>
                                    )}
                                </div>

                                {/* Group B: Story & Details */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-mono uppercase tracking-wider text-[rgb(var(--color-muted-foreground))]">
                                        Story & Characteristics
                                    </h4>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 uppercase">Description</label>
                                        <textarea
                                            rows={3}
                                            value={formState.description}
                                            onChange={(e) => handleFieldChange('description', e.target.value)}
                                            placeholder="Overview of the typeface, design intent, and typographic expression..."
                                            className="w-full text-xs p-2.5 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold mb-1 uppercase">History & Background</label>
                                            <textarea
                                                rows={2}
                                                value={formState.history}
                                                onChange={(e) => handleFieldChange('history', e.target.value)}
                                                placeholder="Commission background, release milestones, open-source history..."
                                                className="w-full text-xs p-2.5 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 uppercase">Design Characteristics</label>
                                            <textarea
                                                rows={2}
                                                value={formState.characteristics}
                                                onChange={(e) => handleFieldChange('characteristics', e.target.value)}
                                                placeholder="Distinct letterforms, x-height, apertures, ink traps..."
                                                className="w-full text-xs p-2.5 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Group C: Canonical Links */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-mono uppercase tracking-wider text-[rgb(var(--color-muted-foreground))]">
                                        Official Links & Repositories
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold mb-1 uppercase">Official Website</label>
                                            <input
                                                type="url"
                                                value={formState.officialWebsite}
                                                onChange={(e) => handleFieldChange('officialWebsite', e.target.value)}
                                                placeholder="https://..."
                                                className="w-full text-xs p-2.5 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-xl font-mono focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 uppercase">Official Font Page</label>
                                            <input
                                                type="url"
                                                value={formState.officialFontPage}
                                                onChange={(e) => handleFieldChange('officialFontPage', e.target.value)}
                                                placeholder="https://..."
                                                className="w-full text-xs p-2.5 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-xl font-mono focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 uppercase">GitHub Repository</label>
                                            <input
                                                type="url"
                                                value={formState.githubUrl}
                                                onChange={(e) => handleFieldChange('githubUrl', e.target.value)}
                                                placeholder="https://github.com/..."
                                                className="w-full text-xs p-2.5 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-xl font-mono focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 uppercase">Purchase / Commercial URL</label>
                                            <input
                                                type="url"
                                                value={formState.purchaseUrl}
                                                onChange={(e) => handleFieldChange('purchaseUrl', e.target.value)}
                                                placeholder="https://..."
                                                className="w-full text-xs p-2.5 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-xl font-mono focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 uppercase">Free Download URL</label>
                                            <input
                                                type="url"
                                                value={formState.freeDownloadUrl}
                                                onChange={(e) => handleFieldChange('freeDownloadUrl', e.target.value)}
                                                placeholder="https://..."
                                                className="w-full text-xs p-2.5 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-xl font-mono focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 uppercase">Google Fonts URL</label>
                                            <input
                                                type="url"
                                                value={formState.googleFontsUrl}
                                                onChange={(e) => handleFieldChange('googleFontsUrl', e.target.value)}
                                                placeholder="https://fonts.google.com/specimen/..."
                                                className="w-full text-xs p-2.5 bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-xl font-mono focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Group D: Detected Technical Specs */}
                                <div className="space-y-3 pt-2">
                                    <h4 className="text-xs font-mono uppercase tracking-wider text-[rgb(var(--color-muted-foreground))]">
                                        Detected Technical Specifications
                                    </h4>
                                    <div className="p-4 rounded-2xl bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] space-y-3">
                                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                                            <div>
                                                <span className="text-[rgb(var(--color-muted-foreground))]">Glyph Count: </span>
                                                <span className="font-bold text-[rgb(var(--color-foreground))]">
                                                    {formState.glyphCount ? `${formState.glyphCount} glyphs` : 'Pending file analysis'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[rgb(var(--color-muted-foreground))]">Weights: </span>
                                                <span className="font-bold text-[rgb(var(--color-foreground))]">
                                                    {dynamicWeights.length > 0 ? dynamicWeights.join(', ') : '400'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[rgb(var(--color-muted-foreground))]">Formats: </span>
                                                <span className="font-bold text-[rgb(var(--color-foreground))]">
                                                    {dynamicFormats.length > 0 ? dynamicFormats.join(', ') : 'None uploaded'}
                                                </span>
                                            </div>
                                        </div>

                                        {formState.opentypeFeatures && formState.opentypeFeatures.length > 0 && (
                                            <div>
                                                <span className="text-xs text-[rgb(var(--color-muted-foreground))] block mb-1 font-mono">
                                                    OpenType Layout Features ({formState.opentypeFeatures.length}):
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {formState.opentypeFeatures.map(feat => (
                                                        <span key={feat} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgb(var(--color-foreground)/0.06)] border border-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))]">
                                                            {feat}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {formState.languages && formState.languages.length > 0 && (
                                            <div>
                                                <span className="text-xs text-[rgb(var(--color-muted-foreground))] block mb-1 font-mono">
                                                    Character Map (cmap) Supported Scripts ({formState.languages.length}):
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {formState.languages.map(lang => (
                                                        <span key={lang} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgb(var(--color-highlight)/0.15)] border border-[rgb(var(--color-highlight)/0.3)] text-[rgb(var(--color-foreground))]">
                                                            {lang}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ════════════════════════════════════════════════════════════════
                    SECTION 6: BANNER GALLERY SPECIMENS
                ════════════════════════════════════════════════════════════════ */}
                <div className="p-4 md:p-8 space-y-4 border-b border-[rgb(var(--color-border))]">
                    <label className="block font-bold uppercase text-lg">
                        Banner Gallery <span className="text-xs text-[rgb(var(--color-muted-foreground))] normal-case ml-2">(Optional - Specimen images)</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 empty:hidden">
                        {bannerItems.map((item) => (
                            <div key={item.id} className="relative group aspect-video bg-[rgb(var(--color-muted)/0.1)] rounded-2xl overflow-hidden border-2 border-[rgb(var(--color-border))]">
                                {item.type === 'file' ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                                        <ImageIcon className="text-[rgb(var(--color-muted-foreground))]" />
                                        <span className="text-xs font-bold truncate w-full">{(item.content as File).name}</span>
                                    </div>
                                ) : (
                                    <img
                                        src={item.content as string}
                                        alt="Uploaded banner specimen preview"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeBannerItem(item.id)}
                                    className="absolute top-2 right-2 text-[rgb(var(--color-destructive))] p-1 rounded-full bg-[rgb(var(--color-background)/0.8)] backdrop-blur-sm transition-opacity"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        <div className="relative flex justify-center items-center group aspect-video bg-[rgb(var(--color-muted)/0.05)] rounded-2xl overflow-hidden border-2 border-dashed border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-foreground))] transition-colors duration-300 ease-in-out">
                            <input
                                type="file"
                                multiple
                                accept="image/png, image/jpeg, image/webp, image/avif"
                                onChange={handleBannerFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full z-10"
                            />
                            <button
                                type="button"
                                className="flex flex-col items-center gap-2 font-bold text-[rgb(var(--color-muted-foreground))]"
                            >
                                <UploadIcon size={24} />
                                <span className="text-xs uppercase">Add Specimen Images</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {showUrlInput ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={e => setUrlInput(e.target.value)}
                                    placeholder="https://..."
                                    className="bg-[rgb(var(--color-background))] border-2 border-[rgb(var(--color-border))] rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[rgb(var(--color-foreground))]"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={addBannerUrl}
                                    className="bg-[rgb(var(--color-foreground))] hover:opacity-90 text-[rgb(var(--color-background))] px-4 py-1.5 rounded-xl font-bold text-xs"
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowUrlInput(false)}
                                    className="text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-destructive))]"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowUrlInput(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs bg-[rgb(var(--color-foreground)/0.05)] hover:bg-[rgb(var(--color-foreground)/0.1)] text-[rgb(var(--color-foreground))] border border-[rgb(var(--color-foreground)/0.1)] transition-colors duration-300 ease-in-out cursor-pointer"
                            >
                                <LinkIcon size={14} /> Add Image URL
                            </button>
                        )}
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════════════
                    SUBMIT & SECURITY
                ════════════════════════════════════════════════════════════════ */}
                <div className="p-4 md:p-8 space-y-4">
                    {/* Invisible Honeypot to trap automated bots */}
                    <div className="opacity-0 absolute -left-2499.75 h-0 w-0 overflow-hidden" aria-hidden="true">
                        <input
                            type="text"
                            name="website_url"
                            tabIndex={-1}
                            autoComplete="off"
                            value={honeypot}
                            onChange={(e) => setHoneypot(e.target.value)}
                        />
                    </div>

                    {/* Bot Protection Widget */}
                    <TurnstileWidget onVerify={setTurnstileToken} />

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full text-[rgb(var(--color-background))] py-4 rounded-3xl font-black uppercase tracking-wider bg-[rgb(var(--color-foreground))] hover:opacity-90 transition-all flex justify-center items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                    >
                        {loading ? 'Processing & Publishing Typeface...' : 'Submit & Publish Typeface'}
                    </motion.button>
                </div>

            </form>

            {/* Admin Tools Section */}
            {profile?.role === 'admin' && (
                <div className="mt-8">
                    <FixWoff2Scanner />
                </div>
            )}

            {/* JSON Import & Paste Modal */}
            <JsonImportModal
                isOpen={showJsonModal}
                onClose={() => setShowJsonModal(false)}
                onApplyData={handleApplyJsonData}
                initialJson={currentUploadJsonString}
                applyLabel="Apply to Form"
            />
        </div>
    );
};

export default Upload;
