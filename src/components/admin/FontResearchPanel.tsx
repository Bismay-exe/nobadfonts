import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Toast } from '@capacitor/toast';
import {
    Search, CheckCircle2, AlertTriangle, XCircle, Clock, Loader2,
    ExternalLink, Shield, Globe, User, Building2, FileText, RefreshCw,
    ChevronDown, ChevronUp, Sparkles, Copy
} from 'lucide-react';
import type { Database } from '../../types/database.types';

type FontResearch = Database['public']['Tables']['font_research']['Row'];
type FontSource = Database['public']['Tables']['font_sources']['Row'];

interface FontResearchPanelProps {
    fontId: string;
    fontName: string;
    research: FontResearch | null;
    sources: FontSource[];
    onResearchComplete?: () => void;
    compact?: boolean;
    isAnyResearching?: boolean;
    activeResearchingFontId?: string | null;
    onResearchStart?: (fontId: string) => void;
    onResearchEnd?: () => void;
}

// ─── Status Badge Component ─────────────────────────────────────────

function ResearchStatusBadge({ status }: { status: string | null }) {
    const config: Record<string, { label: string; color: string; icon: any; animate?: boolean }> = {
        unresearched: { label: 'Unresearched', color: 'rgb(var(--color-muted-foreground))', icon: Clock },
        pending: { label: 'Unresearched', color: 'rgb(var(--color-muted-foreground))', icon: Clock },
        researching: { label: 'Researching...', color: 'rgb(var(--color-accent))', icon: Loader2, animate: true },
        verified: { label: 'Verified', color: 'rgb(var(--color-highlight))', icon: CheckCircle2 },
        needs_review: { label: 'Needs Review', color: 'rgb(var(--color-warning))', icon: AlertTriangle },
        failed: { label: 'Failed', color: 'rgb(var(--color-destructive))', icon: XCircle },
    };

    const s = config[status || 'unresearched'] || config.unresearched;
    const Icon = s.icon;

    return (
        <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
            style={{
                color: s.color,
                borderColor: s.color,
                backgroundColor: `color-mix(in srgb, ${s.color} 10%, transparent)`,
            }}
        >
            <Icon size={12} className={s.animate ? 'animate-spin' : ''} />
            {s.label}
        </span>
    );
}

// ─── Confidence Bar ─────────────────────────────────────────────────

function ConfidenceBar({ label, score }: { label: string; score: number | null }) {
    const pct = score ?? 0;
    const color = pct >= 80 ? 'rgb(var(--color-highlight))' : pct >= 60 ? 'rgb(var(--color-warning))' : 'rgb(var(--color-destructive))';

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-[rgb(var(--color-muted-foreground))] font-medium">{label}</span>
                <span className="font-bold" style={{ color }}>{pct}/100</span>
            </div>
            <div className="h-1.5 bg-[rgb(var(--color-foreground)/0.08)] rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}

// ─── Source Tier Badge ───────────────────────────────────────────────

function TierBadge({ tier }: { tier: number }) {
    const config: Record<number, { label: string; color: string }> = {
        1: { label: 'Official', color: 'rgb(var(--color-highlight))' },
        2: { label: 'Trusted', color: 'rgb(var(--color-accent))' },
        3: { label: 'Secondary', color: 'rgb(var(--color-warning))' },
        4: { label: 'Unverified', color: 'rgb(var(--color-destructive))' },
    };
    const c = config[tier] || config[4];
    return (
        <span
            className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-full font-bold"
            style={{
                color: c.color,
                backgroundColor: `color-mix(in srgb, ${c.color} 12%, transparent)`,
                borderColor: c.color,
            }}
        >
            Tier {tier} · {c.label}
        </span>
    );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function FontResearchPanel({
    fontId,
    // fontName,
    research,
    sources,
    onResearchComplete,
    compact = false,
    isAnyResearching = false,
    activeResearchingFontId = null,
    onResearchStart,
    onResearchEnd,
}: FontResearchPanelProps) {
    const [isResearching, setIsResearching] = useState(false);
    const [showSources, setShowSources] = useState(false);
    const [showDescription, setShowDescription] = useState(false);

    const isCurrentFontResearching = isResearching || (activeResearchingFontId === fontId);
    const isButtonDisabled = isCurrentFontResearching ? true : (isAnyResearching || isResearching);

    const triggerResearch = useCallback(async () => {
        if (isAnyResearching && activeResearchingFontId !== fontId) {
            await Toast.show({
                text: 'Another font is currently being researched. Only 1 font can be researched at a time.',
                duration: 'short'
            });
            return;
        }

        await Haptics.impact({ style: ImpactStyle.Medium });
        setIsResearching(true);
        onResearchStart?.(fontId);

        try {
            // 1. Concurrency Check: Check database for any job currently processing across all fonts
            const { data: runningJobs } = await supabase
                .from('research_jobs')
                .select('id, font_id, status, started_at')
                .eq('status', 'processing');

            if (runningJobs && runningJobs.length > 0) {
                const now = Date.now();
                let activeAnotherJob = false;

                for (const job of runningJobs) {
                    const started = job.started_at ? new Date(job.started_at).getTime() : 0;
                    const ageMs = now - started;

                    // Stale job (> 5 minutes) - auto-expire it
                    if (ageMs > 5 * 60 * 1000) {
                        await supabase.from('research_jobs').update({
                            status: 'failed',
                            error: 'Job timed out after 5 minutes',
                            completed_at: new Date().toISOString()
                        }).eq('id', job.id);
                    } else if (job.font_id !== fontId) {
                        activeAnotherJob = true;
                    }
                }

                if (activeAnotherJob) {
                    await Toast.show({
                        text: 'Another font is currently being researched. Please wait for it to finish.',
                        duration: 'short'
                    });
                    setIsResearching(false);
                    onResearchEnd?.();
                    return;
                }
            }

            let jobId: string;

            // Reuse existing queued job for this font or insert a fresh one
            const { data: existingJob, error: existingJobError } = await supabase
                .from('research_jobs')
                .select('id, status')
                .eq('font_id', fontId)
                .in('status', ['queued', 'processing'])
                .maybeSingle();

            if (existingJobError) throw existingJobError;

            if (existingJob?.status === 'processing') {
                await Toast.show({ text: 'Research is already running for this font.', duration: 'short' });
                setIsResearching(false);
                onResearchEnd?.();
                return;
            }

            if (existingJob) {
                jobId = existingJob.id;
            } else {
                const { data: job, error: jobError } = await supabase
                    .from('research_jobs')
                    .insert({
                        font_id: fontId,
                        trigger_type: 'admin',
                        status: 'queued',
                    })
                    .select('id')
                    .single();

                if (jobError || !job) throw jobError || new Error('Failed to create research job');
                jobId = job.id;
            }

            // Directly invoke the edge function
            const { data, error } = await supabase.functions.invoke('research-font', {
                body: { font_id: fontId, job_id: jobId },
            });

            if (error) throw error;

            await Toast.show({ text: `Research complete: ${data?.status || 'done'}`, duration: 'short' });
            onResearchComplete?.();

        } catch (err: any) {
            console.error('Research failed:', err);
            await Toast.show({ text: `Research failed: ${err.message}`, duration: 'long' });
        } finally {
            setIsResearching(false);
            onResearchEnd?.();
        }
    }, [fontId, onResearchComplete, isAnyResearching, activeResearchingFontId, onResearchStart, onResearchEnd]);

    const applyDescription = useCallback(async () => {
        if (!research?.ai_description) return;
        await Haptics.impact({ style: ImpactStyle.Light });

        try {
            const { error } = await supabase
                .from('fonts')
                .update({ description: research.ai_description })
                .eq('id', fontId);

            if (error) throw error;
            await Toast.show({ text: 'AI description applied to font page.', duration: 'short' });
        } catch (err: any) {
            await Toast.show({ text: 'Failed to apply description.', duration: 'short' });
        }
    }, [fontId, research]);

    const sortedSources = [...sources].sort((a, b) => a.source_tier - b.source_tier);

    // ─── Compact Mode (for admin table rows) ────────────────────────

    if (compact) {
        return (
            <div className="flex items-center gap-3">
                <ResearchStatusBadge status={research?.research_status || 'unresearched'} />
                {research?.confidence && research.confidence !== 'none' && (
                    <span className="text-xs text-[rgb(var(--color-muted-foreground))] font-mono">
                        {research.confidence.toUpperCase()}
                    </span>
                )}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={triggerResearch}
                    disabled={isButtonDisabled}
                    title={isAnyResearching && !isCurrentFontResearching ? "Another font is currently being researched (1 at a time)" : ""}
                    className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors duration-300 ease-in-out flex items-center gap-1 ${isCurrentFontResearching
                            ? 'bg-[rgb(var(--color-accent)/0.15)] text-[rgb(var(--color-accent))] border-[rgb(var(--color-accent)/0.3)]'
                            : 'bg-[rgb(var(--color-foreground)/0.05)] hover:bg-[rgb(var(--color-foreground)/0.1)] border-[rgb(var(--color-border))] disabled:opacity-40 disabled:cursor-not-allowed'
                        }`}
                >
                    {isCurrentFontResearching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                    {isCurrentFontResearching ? 'Working...' : research?.researched_at ? 'Re-Research' : 'Research'}
                </motion.button>
            </div>
        );
    }

    // ─── Full Panel ─────────────────────────────────────────────────

    return (
        <div className="bg-[rgb(var(--color-card,var(--color-muted)))] border border-[rgb(var(--color-foreground)/0.05)] rounded-4xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[rgb(var(--color-foreground)/0.05)]">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Sparkles className="text-[rgb(var(--color-highlight))]" size={20} />
                        <h3 className="font-bold text-lg uppercase tracking-wider text-[rgb(var(--color-foreground))]">
                            AI Research
                        </h3>
                        <ResearchStatusBadge status={research?.research_status || 'unresearched'} />
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={triggerResearch}
                        disabled={isButtonDisabled}
                        title={isAnyResearching && !isCurrentFontResearching ? "Another font is currently being researched (1 at a time)" : ""}
                        className="px-5 py-2 text-sm font-bold rounded-full bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    >
                        {isCurrentFontResearching ? (
                            <><Loader2 size={14} className="animate-spin" /> Researching...</>
                        ) : (
                            <><RefreshCw size={14} /> {research?.researched_at ? 'Re-Research' : 'Research Now'}</>
                        )}
                    </motion.button>
                </div>

                {research?.researched_at && (
                    <p className="text-xs text-[rgb(var(--color-muted-foreground))] mt-2">
                        Last researched: {new Date(research.researched_at).toLocaleString()}
                    </p>
                )}
            </div>

            {/* Content — only show if research exists */}
            {research && research.research_status !== 'pending' && research.research_status !== 'unresearched' && (
                <div className="p-6 space-y-6">
                    {/* Conflict Warning */}
                    {research.has_conflicts && (
                        <div className="p-4 rounded-2xl bg-[rgb(var(--color-warning)/0.1)] border border-[rgb(var(--color-warning)/0.3)]">
                            <div className="flex items-start gap-2">
                                <AlertTriangle size={16} className="text-[rgb(var(--color-warning))] mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-[rgb(var(--color-foreground))]">Conflicting Information Detected</p>
                                    <p className="text-xs text-[rgb(var(--color-muted-foreground))] mt-1">
                                        {research.conflict_details || 'Some sources provide contradictory information. Manual review recommended.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scores */}
                    <div className="grid grid-cols-2 gap-4">
                        <ConfidenceBar label="Ownership" score={research.ownership_score} />
                        <ConfidenceBar label="License" score={research.license_score} />
                    </div>

                    {/* Verified Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Designer */}
                        <InfoRow icon={User} label="Designer" value={research.designer_verified} />
                        {/* Foundry */}
                        <InfoRow icon={Building2} label="Foundry" value={research.foundry} />
                        {/* Official Website */}
                        <InfoRow icon={Globe} label="Official Website" value={research.official_website} isLink />
                        {/* Font Page */}
                        <InfoRow icon={FileText} label="Font Page" value={research.official_font_page} isLink />
                        {/* License */}
                        <InfoRow icon={Shield} label="License" value={research.license_type_verified} />
                        {/* License Status */}
                        <InfoRow
                            icon={Shield}
                            label="Status"
                            value={research.license_status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || null}
                        />
                        {/* License URL */}
                        <InfoRow icon={ExternalLink} label="License URL" value={research.license_url} isLink />
                        {/* Commercial */}
                        <InfoRow
                            icon={CheckCircle2}
                            label="Commercial Use"
                            value={research.commercial_use_verified === true ? 'Allowed' : research.commercial_use_verified === false ? 'Not Allowed' : null}
                        />
                        {/* Free Download */}
                        <InfoRow icon={ExternalLink} label="Free Download" value={research.free_download_url} isLink />
                        {/* Purchase */}
                        <InfoRow icon={ExternalLink} label="Purchase" value={research.purchase_url} isLink />
                    </div>

                    {/* Google Fonts Match */}
                    {research.google_fonts_match && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgb(var(--color-highlight)/0.08)] border border-[rgb(var(--color-highlight)/0.2)]">
                            <CheckCircle2 size={14} className="text-[rgb(var(--color-highlight))]" />
                            <span className="text-xs font-bold text-[rgb(var(--color-foreground))]">Available on Google Fonts</span>
                        </div>
                    )}

                    {/* License Evidence */}
                    {research.license_evidence && (
                        <div className="p-4 rounded-2xl bg-[rgb(var(--color-foreground)/0.03)] border border-[rgb(var(--color-foreground)/0.08)]">
                            <p className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-muted-foreground))] mb-2">
                                License Evidence
                            </p>
                            <blockquote className="text-sm text-[rgb(var(--color-foreground)/0.7)] italic border-l-2 border-[rgb(var(--color-highlight))] pl-3">
                                "{research.license_evidence}"
                            </blockquote>
                        </div>
                    )}

                    {/* AI Description */}
                    {research.ai_description && (
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowDescription(!showDescription)}
                                className="flex items-center gap-2 text-sm font-bold text-[rgb(var(--color-foreground))] hover:text-[rgb(var(--color-highlight))] transition-colors duration-300 ease-in-out"
                            >
                                <Sparkles size={14} />
                                AI-Generated Description
                                {showDescription ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {showDescription && (
                                <div className="p-4 rounded-2xl bg-[rgb(var(--color-foreground)/0.03)] border border-[rgb(var(--color-foreground)/0.08)] space-y-3">
                                    <p className="text-sm text-[rgb(var(--color-foreground)/0.7)] leading-relaxed">
                                        {research.ai_description}
                                    </p>
                                    {research.ai_tags && research.ai_tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {research.ai_tags.map(tag => (
                                                <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgb(var(--color-foreground)/0.06)] text-[rgb(var(--color-muted-foreground))]">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={applyDescription}
                                            className="px-4 py-1.5 text-xs font-bold rounded-full bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))] hover:opacity-90 transition-all cursor-pointer"
                                        >
                                            Apply to Font Page
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={async () => {
                                                await navigator.clipboard.writeText(research.ai_description || '');
                                                await Toast.show({ text: 'Copied!', duration: 'short' });
                                            }}
                                            className="px-4 py-1.5 text-xs font-bold rounded-full bg-[rgb(var(--color-foreground)/0.05)] hover:bg-[rgb(var(--color-foreground)/0.1)] border border-[rgb(var(--color-border))] transition-colors duration-300 ease-in-out cursor-pointer flex items-center gap-1"
                                        >
                                            <Copy size={10} /> Copy
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sources */}
                    {sortedSources.length > 0 && (
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowSources(!showSources)}
                                className="flex items-center gap-2 text-sm font-bold text-[rgb(var(--color-foreground))] hover:text-[rgb(var(--color-highlight))] transition-colors duration-300 ease-in-out"
                            >
                                <Search size={14} />
                                Sources ({sortedSources.length})
                                {showSources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {showSources && (
                                <div className="space-y-2">
                                    {sortedSources.map((source) => (
                                        <div key={source.id} className="p-3 rounded-xl bg-[rgb(var(--color-foreground)/0.03)] border border-[rgb(var(--color-foreground)/0.05)]">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <TierBadge tier={source.source_tier} />
                                                        <span className="text-[10px] font-mono text-[rgb(var(--color-muted-foreground))]">
                                                            {source.source_type?.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                    <a
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-medium text-[rgb(var(--color-foreground))] hover:text-[rgb(var(--color-highlight))] truncate block"
                                                    >
                                                        {source.domain || source.url}
                                                        <ExternalLink size={10} className="inline ml-1" />
                                                    </a>
                                                    {source.supports && source.supports.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {source.supports.map(s => (
                                                                <span key={s} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[rgb(var(--color-foreground)/0.05)] text-[rgb(var(--color-muted-foreground))]">
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {source.evidence && (
                                                        <p className="text-[10px] text-[rgb(var(--color-muted-foreground))] mt-1 italic truncate">
                                                            "{source.evidence}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {(!research || research.research_status === 'pending' || research.research_status === 'unresearched') && (
                <div className="p-8 text-center">
                    <Search size={32} className="mx-auto text-[rgb(var(--color-muted-foreground)/0.3)] mb-3" />
                    <p className="text-sm text-[rgb(var(--color-muted-foreground))]">
                        No research data yet. Click "Research Now" to analyze this font.
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── Helper: Info Row ───────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, isLink }: {
    icon: any;
    label: string;
    value: string | null;
    isLink?: boolean;
}) {
    if (!value) return null;

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgb(var(--color-foreground)/0.03)]">
            <Icon size={14} className="text-[rgb(var(--color-muted-foreground))] shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[rgb(var(--color-muted-foreground))] uppercase tracking-wider font-mono">{label}</p>
                {isLink ? (
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[rgb(var(--color-foreground))] hover:text-[rgb(var(--color-highlight))] truncate block"
                    >
                        {value.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                        <ExternalLink size={10} className="inline ml-1" />
                    </a>
                ) : (
                    <p className="text-xs font-bold text-[rgb(var(--color-foreground))] truncate">{value}</p>
                )}
            </div>
        </div>
    );
}
