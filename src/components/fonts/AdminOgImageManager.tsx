'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Font } from '../../types/font';
import SocialShareCard from './SocialShareCard';
import { Toast } from '@capacitor/toast';
import {
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    ExternalLink,
    Image as ImageIcon,
    ChevronDown,
    Layers,
    Clock,
    Check
} from 'lucide-react';

interface AdminOgImageManagerProps {
    font: Font;
    onFontUpdated: (updatedFields: Partial<Font>) => void;
    onVariantChange?: (variantId: string) => void;
}

type GenerationStatus =
    | 'idle'
    | 'fetching'
    | 'hashing'
    | 'rendering'
    | 'capturing'
    | 'uploading'
    | 'saving'
    | 'success'
    | 'error';

export default function AdminOgImageManager({ font, onFontUpdated, onVariantChange }: AdminOgImageManagerProps) {
    const variants = useMemo(() => font.font_variants || [], [font.font_variants]);
    const currentVariantsCount = variants.length > 0 ? variants.length : 1;

    // Default variant selection: font.og_image_variant_id || 'Regular' || 1st
    const initialVariantId = useMemo(() => {
        if (font.og_image_variant_id && variants.some(v => v.id === font.og_image_variant_id)) {
            return font.og_image_variant_id;
        }
        const regular = variants.find(v => v.variant_name.toLowerCase() === 'regular');
        return regular ? regular.id : (variants[0]?.id || '');
    }, [font.og_image_variant_id, variants]);

    const [selectedVariantId, setSelectedVariantId] = useState<string>(initialVariantId);

    // Keep parent in sync with variant selection
    useEffect(() => {
        if (selectedVariantId) {
            onVariantChange?.(selectedVariantId);
        }
    }, [selectedVariantId, onVariantChange]);

    const [status, setStatus] = useState<GenerationStatus>('idle');
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [activeFontFamily, setActiveFontFamily] = useState<string | undefined>(undefined);

    const hiddenCardRef = useRef<HTMLDivElement>(null);

    // Currently chosen variant object
    const selectedVariant = useMemo(() => {
        return variants.find(v => v.id === selectedVariantId) || variants[0] || null;
    }, [variants, selectedVariantId]);

    // Active OG variant recorded in DB
    const currentOgVariant = useMemo(() => {
        if (!font.og_image_variant_id) return null;
        return variants.find(v => v.id === font.og_image_variant_id) || null;
    }, [font.og_image_variant_id, variants]);

    // ── STALE / DRIFT DETECTION ─────────────────────────────────────────────
    const driftState = useMemo(() => {
        if (!font.og_image_url) return null;

        // 1. Variant Count drift
        if (font.og_image_variant_count != null && font.og_image_variant_count !== currentVariantsCount) {
            return {
                type: 'count_drift',
                message: `Variant count changed: Card was generated with ${font.og_image_variant_count} styles, but font now has ${currentVariantsCount} styles.`
            };
        }

        // 2. Active OG variant was deleted
        if (font.og_image_variant_id && !currentOgVariant) {
            return {
                type: 'variant_missing',
                message: 'The variant originally used to generate this OG image no longer exists.'
            };
        }

        return null;
    }, [font.og_image_url, font.og_image_variant_count, font.og_image_variant_id, currentVariantsCount, currentOgVariant]);

    // ── GENERATE & COMMIT PIPELINE ──────────────────────────────────────────
    const handleGenerateOgImage = async () => {
        if (!selectedVariant) {
            await Toast.show({ text: 'Please select a variant first.', duration: 'short' });
            return;
        }

        const fileUrl = selectedVariant.woff2_url || selectedVariant.ttf_url || selectedVariant.otf_url || selectedVariant.woff_url;
        if (!fileUrl) {
            await Toast.show({ text: 'The selected variant has no font file available.', duration: 'long' });
            return;
        }

        setErrorMessage(null);
        setStatus('fetching');
        setStatusMessage('Fetching font binary...');

        try {
            // 1. Fetch exact binary as ArrayBuffer
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status} when downloading font binary`);
            const arrayBuffer = await response.arrayBuffer();

            // 2. Cryptographic SHA-256 calculation
            setStatus('hashing');
            setStatusMessage('Computing cryptographic binary SHA-256...');
            const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const sha256Hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            const variantSignature = `${selectedVariant.id}::${sha256Hex}`;

            // 3. Register deterministic collision-safe FontFace
            const deterministicFamily = `OGFont_${font.id}_${selectedVariant.id}`;
            setActiveFontFamily(deterministicFamily);

            const fontFace = new FontFace(deterministicFamily, arrayBuffer);
            setStatusMessage('Loading font binary into document...');
            const loadedFace = await fontFace.load();
            document.fonts.add(loadedFace);
            await document.fonts.ready;

            // 4. Render & settle card DOM
            setStatus('rendering');
            setStatusMessage('Rendering 1200×630 high-res card...');
            await new Promise(r => setTimeout(r, 150));

            if (!hiddenCardRef.current) {
                throw new Error('Hidden card DOM element could not be found');
            }

            // 5. Capture PNG blob via html-to-image
            setStatus('capturing');
            setStatusMessage('Capturing high-res card snapshot...');
            const { toBlob } = await import('html-to-image');
            const blob = await toBlob(hiddenCardRef.current, {
                quality: 0.95,
                pixelRatio: 1,
                width: 1200,
                height: 630
            });

            if (!blob) {
                throw new Error('Canvas capture produced an empty blob');
            }

            // 6. Upload to Supabase Storage
            setStatus('uploading');
            setStatusMessage('Uploading to Supabase Storage...');
            const storagePath = `og-images/${font.id}/og-${selectedVariant.id}-${Date.now()}.png`;

            const { error: uploadError } = await supabase.storage
                .from('fonts')
                .upload(storagePath, blob, {
                    contentType: 'image/png',
                    upsert: true
                });

            if (uploadError) {
                console.error('Storage Upload Error:', uploadError);
                throw new Error(`Storage upload failed: ${uploadError.message}`);
            }

            const { data: publicData } = supabase.storage.from('fonts').getPublicUrl(storagePath);
            const publicUrl = publicData.publicUrl;

            // 7. Atomic DB commit
            setStatus('saving');
            setStatusMessage('Committing metadata to database...');
            const nowIso = new Date().toISOString();

            const updatePayload: Record<string, any> = {
                og_image_url: publicUrl,
                og_image_variant_id: selectedVariant.id,
                og_image_variant_count: currentVariantsCount,
                og_image_variant_signature: variantSignature,
                og_image_generated_at: nowIso
            };

            const { error: dbError } = await supabase
                .from('fonts')
                .update(updatePayload)
                .eq('id', font.id);

            if (dbError) {
                console.error('Database Update Error:', dbError);
                throw new Error(`Failed to save OG URL to database: ${dbError.message}`);
            }

            // 8. Success: sync local state
            setStatus('success');
            setStatusMessage('✓ OG image generated and saved successfully!');

            onFontUpdated({
                og_image_url: publicUrl,
                og_image_variant_id: selectedVariant.id,
                og_image_variant_count: currentVariantsCount,
                og_image_variant_signature: variantSignature,
                og_image_generated_at: nowIso
            });

            await Toast.show({
                text: `OG Social Card updated using ${selectedVariant.variant_name}!`,
                duration: 'short'
            });

            // Reset status after a few seconds
            setTimeout(() => {
                setStatus('idle');
                setStatusMessage('');
            }, 3000);

        } catch (err: any) {
            console.error('OG Image Generation Error:', err);
            setStatus('error');
            setErrorMessage(err.message || 'Unknown error occurred during generation.');
            await Toast.show({
                text: 'Generation failed: ' + (err.message || 'Unknown error'),
                duration: 'long'
            });
        }
    };

    const isWorking = status !== 'idle' && status !== 'success' && status !== 'error';

    return (
        <div className="rounded-3xl border-2 border-dashed border-[rgb(var(--color-primary)/0.4)] bg-[rgb(var(--color-foreground)/0.02)] p-6 md:p-8 space-y-6 mb-8">
            
            {/* Header / Admin Pill */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[rgb(var(--color-foreground)/0.1)]">
                <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[rgb(var(--color-primary))] text-[rgb(var(--color-background))] text-xs font-bold font-mono">
                        A
                    </span>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[rgb(var(--color-foreground))] flex items-center gap-2">
                            Admin · OG Social Card Manager
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgb(var(--color-primary)/0.1)] text-[rgb(var(--color-primary))] font-mono font-normal">
                                ADMIN ONLY
                            </span>
                        </h3>
                        <p className="text-xs text-[rgb(var(--color-muted-foreground))]">
                            Generate and commit a custom 1200×630 specimen card to Supabase Storage for Twitter, Discord, and social crawlers.
                        </p>
                    </div>
                </div>

                {/* Current Status Pill */}
                <div className="flex items-center gap-2 text-xs font-mono">
                    {font.og_image_url ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Custom OG Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Using Fallback Image
                        </span>
                    )}
                </div>
            </div>

            {/* Drift / Staleness Alert */}
            {driftState && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <strong className="block font-bold uppercase mb-0.5">⚠ Stale Snapshot Warning</strong>
                        {driftState.message}
                    </div>
                </div>
            )}

            {/* Main Control Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Left: Thumbnail Preview of current OG image */}
                <div className="md:col-span-4">
                    <div className="relative aspect-1200/630 rounded-2xl overflow-hidden border border-[rgb(var(--color-foreground)/0.15)] bg-[rgb(var(--color-background))] group shadow-sm">
                        {font.og_image_url ? (
                            <>
                                <img
                                    src={font.og_image_url}
                                    alt={`${font.name} OG Card`}
                                    className="w-full h-full object-cover"
                                />
                                <a
                                    href={font.og_image_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-mono font-bold"
                                >
                                    <ExternalLink className="w-4 h-4" /> View Full PNG
                                </a>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-xs font-mono text-[rgb(var(--color-muted-foreground))]">
                                <ImageIcon className="w-8 h-8 opacity-40 mb-2" />
                                <span>No Custom OG Image</span>
                                <span className="text-[10px] text-[rgb(var(--color-muted-foreground)/0.7)] mt-1">
                                    Crawlers fall back to 1st gallery image or site banner
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Metadata Subtext */}
                    {font.og_image_url && (
                        <div className="mt-2.5 text-[11px] font-mono text-[rgb(var(--color-muted-foreground))] space-y-1">
                            <div className="flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5" />
                                <span>Generated from: <strong>{currentOgVariant?.variant_name || 'Variant'}</strong></span>
                            </div>
                            {font.og_image_generated_at && (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Captured: {new Date(font.og_image_generated_at).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Variant Selector & Generation Controls */}
                <div className="md:col-span-8 space-y-5">
                    
                    {/* Variant Selector Dropdown */}
                    <div className="space-y-2">
                        <label className="text-xs font-mono font-bold uppercase tracking-wider text-[rgb(var(--color-foreground)/0.8)] block">
                            Choose Variant to Render on OG Card:
                        </label>
                        <div className="relative">
                            <select
                                value={selectedVariantId}
                                onChange={(e) => setSelectedVariantId(e.target.value)}
                                disabled={isWorking}
                                className="w-full h-12 px-4 pr-10 rounded-2xl border border-[rgb(var(--color-foreground)/0.2)] bg-[rgb(var(--color-background))] text-sm font-medium text-[rgb(var(--color-foreground))] outline-none focus:border-[rgb(var(--color-primary))] transition-all appearance-none cursor-pointer disabled:opacity-50"
                            >
                                {variants.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.variant_name} {v.id === font.og_image_variant_id ? '★ (Current OG Variant)' : ''}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-[rgb(var(--color-muted-foreground))] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    {/* Multi-Step Status Indicator */}
                    {statusMessage && (
                        <div className="text-xs font-mono p-3 rounded-xl bg-[rgb(var(--color-foreground)/0.05)] border border-[rgb(var(--color-foreground)/0.1)] flex items-center gap-2">
                            {isWorking && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[rgb(var(--color-primary))]" />}
                            {status === 'success' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                            <span className={status === 'error' ? 'text-red-500' : 'text-[rgb(var(--color-foreground))]'}>
                                {statusMessage}
                            </span>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="text-xs font-mono p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500">
                            {errorMessage}
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleGenerateOgImage}
                            disabled={isWorking}
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                            {isWorking ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 text-[rgb(var(--color-primary))]" />
                                    {font.og_image_url ? 'Regenerate & Update OG Image' : 'Generate & Save OG Image'}
                                </>
                            )}
                        </button>

                        <span className="text-xs font-mono text-[rgb(var(--color-muted-foreground))]">
                            Renders 1200×630 with true metadata chips
                        </span>
                    </div>

                </div>

            </div>

            {/* ── HIDDEN CARD FOR REAL-TIME OFFSCREEN CAPTURE ── */}
            <div className="absolute -left-2499.75 -top-2499.75 pointer-events-none opacity-0">
                <SocialShareCard
                    ref={hiddenCardRef}
                    font={font}
                    aspectRatio="og"
                    selectedVariantId={selectedVariantId}
                    fontFamilyOverride={activeFontFamily}
                    activeVariantName={selectedVariant?.variant_name}
                    variantCount={currentVariantsCount}
                />
            </div>

        </div>
    );
}
