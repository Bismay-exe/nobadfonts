/**
 * GitHubDiscoveryTab.tsx
 * ======================
 * Phase 4: Admin UI — GitHub Discovery Tab
 *
 * Sub-views:
 *   1. Discovery Health — last run stats, queue counts, "Run Now" button
 *   2. Candidate Queue — filterable table of font_candidates
 *   3. Candidate Detail — full metadata, license evidence, warnings, actions
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import {
    RefreshCw, ExternalLink, CheckCircle2, XCircle, Copy,
    AlertTriangle, Clock, GitBranch, Shield, Zap, Eye,
    ChevronDown, ChevronUp, RotateCcw, Star
} from 'lucide-react';
import { Toast } from '@capacitor/toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiscoveryRun {
    id: string;
    trigger_type: string;
    started_at: string;
    finished_at: string | null;
    status: string;
    queries_executed: number;
    repositories_seen: number;
    repositories_added: number;
    repositories_queued: number;
    repositories_skipped: number;
    errors_count: number;
    github_api_calls: number;
    rate_limit_remaining: number | null;
    summary: string | null;
}

interface ManifestFile {
    path?: string;
    format?: string;
    size_bytes?: number;
    commit_pinned_url?: string;
}

interface FontCandidate {
    id: string;
    repository_id: string;
    family_name: string;
    slug_candidate: string | null;
    description_extracted: string | null;
    designer_name: string | null;
    foundry_name: string | null;
    official_url: string | null;
    repository_path: string | null;
    font_metadata: Record<string, unknown> | null;
    font_file_manifest: ManifestFile[];
    license_name: string | null;
    license_identifier: string | null;
    license_category: string | null;
    license_text_url: string | null;
    license_evidence: string | null;
    license_status: 'verified' | 'uncertain' | 'missing' | 'conflicting' | 'not_checked';
    validation_status: 'pending' | 'passed' | 'warnings' | 'failed';
    validation_warnings: Array<{ code: string; message: string; severity: string }>;
    duplicate_of_font_id: string | null;
    duplicate_of_candidate_id: string | null;
    status: 'queued' | 'scanning' | 'needs_review' | 'approved' | 'rejected' | 'duplicate' | 'scan_failed';
    reviewed_at: string | null;
    review_notes: string | null;
    rejection_reason: string | null;
    published_font_id: string | null;
    created_at: string;
    updated_at: string;
    github_font_repositories?: {
        full_name: string;
        html_url: string;
        stars_count: number;
        default_branch: string;
    };
}

interface QueueStats {
    needs_review: number;
    approved: number;
    rejected: number;
    scan_failed: number;
    scanning: number;
    queued: number;
}

type SubView = 'health' | 'queue' | 'detail';
type StatusFilter = 'all' | 'needs_review' | 'scan_failed' | 'duplicate';
type LicenseFilter = 'all' | 'verified' | 'uncertain' | 'missing' | 'conflicting';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LICENSE_STATUS_COLORS: Record<string, string> = {
    verified:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    uncertain:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
    missing:     'bg-red-500/15 text-red-400 border-red-500/30',
    conflicting: 'bg-red-600/15 text-red-500 border-red-600/30',
    not_checked: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

const CANDIDATE_STATUS_COLORS: Record<string, string> = {
    needs_review: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    approved:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    rejected:     'bg-red-500/15 text-red-400 border-red-500/30',
    duplicate:    'bg-purple-500/15 text-purple-400 border-purple-500/30',
    scan_failed:  'bg-orange-500/15 text-orange-400 border-orange-500/30',
    scanning:     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    queued:       'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

function formatRelativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const m  = Math.floor(ms / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function StatusBadge({ status, label, className = '' }: { status: string; label?: string; className?: string }) {
    const colors = LICENSE_STATUS_COLORS[status] ?? CANDIDATE_STATUS_COLORS[status] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors} ${className}`}>
            {label ?? status.replace(/_/g, ' ')}
        </span>
    );
}

// ---------------------------------------------------------------------------
// Discovery Health Panel
// ---------------------------------------------------------------------------

function DiscoveryHealth({ onRunNow }: { onRunNow: () => Promise<void> }) {
    const [lastRun, setLastRun] = useState<DiscoveryRun | null>(null);
    const [stats, setStats]     = useState<QueueStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [runRes, statsRes] = await Promise.all([
                supabase.from('font_discovery_runs').select('*').order('started_at', { ascending: false }).limit(1).single(),
                supabase.from('font_candidates').select('status'),
            ]);
            if (runRes.data) setLastRun(runRes.data as DiscoveryRun);
            if (statsRes.data) {
                const rows = statsRes.data as { status: string }[];
                setStats({
                    needs_review: rows.filter(r => r.status === 'needs_review').length,
                    approved:     rows.filter(r => r.status === 'approved').length,
                    rejected:     rows.filter(r => r.status === 'rejected').length,
                    scan_failed:  rows.filter(r => r.status === 'scan_failed').length,
                    scanning:     rows.filter(r => r.status === 'scanning').length,
                    queued:       rows.filter(r => r.status === 'queued').length,
                });
            }
        } catch (err) {
            console.error('Discovery health fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void fetchData(); }, [fetchData]);

    const handleRunNow = async () => {
        setRunning(true);
        try { await onRunNow(); await fetchData(); } finally { setRunning(false); }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-foreground/20" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-foreground">Discovery Health</h3>
                    <p className="text-sm text-muted mt-0.5">Automated GitHub font discovery pipeline status</p>
                </div>
                <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={fetchData}
                        className="px-4 py-2 rounded-xl border-2 border-foreground/15 bg-background text-foreground text-sm font-semibold flex items-center gap-2 hover:border-foreground/40 transition-colors">
                        <RefreshCw size={14} /> Refresh
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => void handleRunNow()} disabled={running}
                        className="px-4 py-2 rounded-xl border-2 border-accent bg-accent text-black text-sm font-bold flex items-center gap-2 hover:opacity-85 transition-opacity disabled:opacity-50">
                        {running ? <div className="animate-spin w-3 h-3 border-2 border-black/30 border-t-black rounded-full" /> : <Zap size={14} />}
                        Run Discovery Now
                    </motion.button>
                </div>
            </div>

            {/* Last run */}
            <div className="rounded-2xl border-2 border-foreground/10 bg-background p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted uppercase tracking-wide">
                    <Clock size={16} /> Last Discovery Run
                </div>
                {lastRun ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {([
                                { label: 'Status',       value: <StatusBadge status={lastRun.status} /> },
                                { label: 'Started',      value: formatRelativeTime(lastRun.started_at) },
                                { label: 'Repos Seen',   value: lastRun.repositories_seen.toLocaleString() },
                                { label: 'Repos Queued', value: lastRun.repositories_queued.toLocaleString() },
                                { label: 'Repos Added',  value: lastRun.repositories_added.toLocaleString() },
                                { label: 'API Calls',    value: lastRun.github_api_calls.toLocaleString() },
                                { label: 'Rate Limit',   value: lastRun.rate_limit_remaining ?? 'N/A' },
                                { label: 'Errors',       value: <span className={lastRun.errors_count > 0 ? 'text-red-400' : 'text-emerald-400'}>{lastRun.errors_count}</span> },
                            ] as const).map(item => (
                                <div key={item.label} className="space-y-1">
                                    <div className="text-xs text-muted font-medium">{item.label}</div>
                                    <div className="text-sm font-bold text-foreground">{item.value}</div>
                                </div>
                            ))}
                        </div>
                        {lastRun.summary && <p className="text-xs text-muted border-t border-foreground/8 pt-3">{lastRun.summary}</p>}
                    </>
                ) : (
                    <p className="text-sm text-muted">No discovery runs recorded yet.</p>
                )}
            </div>

            {/* Queue stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {([
                        { label: 'Needs Review', value: stats.needs_review, color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
                        { label: 'Approved',     value: stats.approved,     color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                        { label: 'Rejected',     value: stats.rejected,     color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
                        { label: 'Scan Failed',  value: stats.scan_failed,  color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20' },
                        { label: 'Scanning',     value: stats.scanning,     color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20' },
                        { label: 'Queued',       value: stats.queued,       color: 'text-zinc-400',    bg: 'bg-zinc-500/10 border-zinc-500/20' },
                    ] as const).map(item => (
                        <div key={item.label} className={`rounded-xl border-2 ${item.bg} p-4 text-center`}>
                            <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                            <div className="text-xs text-muted mt-1 font-medium">{item.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Schedule info */}
            <div className="rounded-2xl border-2 border-foreground/8 bg-foreground/2 p-4">
                <div className="flex items-start gap-3">
                    <Clock size={16} className="text-muted mt-0.5 shrink-0" />
                    <div className="text-xs text-muted space-y-1">
                        <div className="font-semibold text-foreground/70">Automation Schedule</div>
                        <div>Discovery: Supabase Cron daily at 02:00 UTC</div>
                        <div>Scanner worker: GitHub Actions every 6 hours</div>
                        <div>Stale job recovery: runs at start of each cycle</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Candidate Queue
// ---------------------------------------------------------------------------

function CandidateQueue({ onSelectCandidate }: { onSelectCandidate: (c: FontCandidate) => void }) {
    const [candidates, setCandidates] = useState<FontCandidate[]>([]);
    const [loading, setLoading]       = useState(true);
    const [statusFilter, setStatusFilter]   = useState<StatusFilter>('needs_review');
    const [licenseFilter, setLicenseFilter] = useState<LicenseFilter>('all');
    const [search, setSearch]         = useState('');
    const [sortDesc, setSortDesc]     = useState(true);

    const fetchCandidates = useCallback(async () => {
        setLoading(true);
        try {
            type SupabaseQuery = ReturnType<typeof supabase.from> & {
                eq: (col: string, val: unknown) => SupabaseQuery;
                order: (col: string, opts: { ascending: boolean }) => SupabaseQuery;
                limit: (n: number) => SupabaseQuery;
            };
            let query: SupabaseQuery = supabase
                .from('font_candidates')
                .select('*, github_font_repositories(full_name,html_url,stars_count,default_branch)')
                .order('created_at', { ascending: !sortDesc })
                .limit(100) as unknown as SupabaseQuery;

            if (statusFilter !== 'all') query = query.eq('status', statusFilter);
            if (licenseFilter !== 'all') query = query.eq('license_status', licenseFilter);

            const { data, error } = await (query as unknown as Promise<{ data: unknown; error: unknown }>);
            if (error) throw error;
            setCandidates((data as FontCandidate[]) ?? []);
        } catch (err) {
            console.error('Failed to fetch candidates:', err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, licenseFilter, sortDesc]);

    useEffect(() => { void fetchCandidates(); }, [fetchCandidates]);

    const filtered = candidates.filter(c =>
        !search ||
        c.family_name.toLowerCase().includes(search.toLowerCase()) ||
        c.github_font_repositories?.full_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <input type="text" placeholder="Search family or repo..." value={search} onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-48 px-4 py-2 rounded-xl border-2 border-foreground/12 bg-background text-foreground text-sm outline-none focus:border-accent transition-colors" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                    className="px-3 py-2 rounded-xl border-2 border-foreground/12 bg-background text-foreground text-sm outline-none cursor-pointer">
                    <option value="all">All statuses</option>
                    <option value="needs_review">Needs Review</option>
                    <option value="scan_failed">Scan Failed</option>
                    <option value="duplicate">Duplicate</option>
                </select>
                <select value={licenseFilter} onChange={e => setLicenseFilter(e.target.value as LicenseFilter)}
                    className="px-3 py-2 rounded-xl border-2 border-foreground/12 bg-background text-foreground text-sm outline-none cursor-pointer">
                    <option value="all">All licenses</option>
                    <option value="verified">Verified ✓</option>
                    <option value="uncertain">Uncertain ⚠</option>
                    <option value="missing">Missing ✗</option>
                    <option value="conflicting">Conflicting !</option>
                </select>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSortDesc(v => !v)}
                    className="px-3 py-2 rounded-xl border-2 border-foreground/12 bg-background text-foreground text-sm flex items-center gap-1 hover:border-foreground/30 transition-colors">
                    {sortDesc ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    {sortDesc ? 'Newest' : 'Oldest'}
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => void fetchCandidates()}
                    className="px-3 py-2 rounded-xl border-2 border-foreground/12 bg-background text-foreground flex items-center gap-1 hover:border-foreground/30 transition-colors">
                    <RefreshCw size={14} />
                </motion.button>
            </div>

            <p className="text-sm text-muted">{filtered.length} candidate{filtered.length !== 1 ? 's' : ''}</p>

            {loading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-foreground/20" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-foreground/10 rounded-2xl text-muted font-medium">No candidates match your filters</div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(c => (
                        <motion.div key={c.id} whileHover={{ scale: 1.002 }} onClick={() => onSelectCandidate(c)}
                            className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border-2 border-foreground/8 bg-background hover:border-foreground/25 cursor-pointer transition-all">
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-foreground truncate">{c.family_name}</div>
                                <div className="text-xs text-muted truncate flex items-center gap-1 mt-0.5">
                                    <GitBranch size={10} />
                                    {c.github_font_repositories?.full_name ?? 'Unknown repo'}
                                    {c.github_font_repositories?.stars_count ? (
                                        <span className="flex items-center gap-0.5 ml-1"><Star size={9} />{c.github_font_repositories.stars_count}</span>
                                    ) : null}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                                <StatusBadge status={c.status} />
                                <StatusBadge status={c.license_status} label={`License: ${c.license_status}`} />
                                {c.validation_warnings.length > 0 && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                        <AlertTriangle size={10} />{c.validation_warnings.length} warning{c.validation_warnings.length > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-muted shrink-0">{formatRelativeTime(c.created_at)}</div>
                            <Eye size={16} className="text-muted shrink-0" />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Candidate Detail
// ---------------------------------------------------------------------------

function CandidateDetail({ candidate, onBack, onActionComplete }: {
    candidate: FontCandidate;
    onBack: () => void;
    onActionComplete: () => void;
}) {
    const [reviewNotes, setReviewNotes]         = useState(candidate.review_notes ?? '');
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing]           = useState(false);
    const [editedFamily, setEditedFamily]       = useState(candidate.family_name);
    const [editedDesc, setEditedDesc]           = useState(candidate.description_extracted ?? '');
    const [editedDesigner, setEditedDesigner]   = useState(candidate.designer_name ?? '');
    const [showManifest, setShowManifest]       = useState(false);

    const doAction = useCallback(async (action: 'approve' | 'reject' | 'retry') => {
        setProcessing(true);
        try {
            if (action === 'approve') {
                if (editedFamily !== candidate.family_name || editedDesc !== candidate.description_extracted || editedDesigner !== candidate.designer_name) {
                    await supabase.from('font_candidates').update({ family_name: editedFamily, description_extracted: editedDesc || null, designer_name: editedDesigner || null }).eq('id', candidate.id);
                }
                const { data: { session } } = await supabase.auth.getSession();
                const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/publish-font-candidate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                    body: JSON.stringify({ candidate_id: candidate.id, review_notes: reviewNotes || null }),
                });
                const result = await resp.json() as { error?: string };
                if (!resp.ok) throw new Error(result.error ?? 'Publish failed');
                await Toast.show({ text: '✅ Font approved and published!', duration: 'long' });
            }
            if (action === 'reject') {
                await supabase.from('font_candidates').update({ status: 'rejected', rejection_reason: rejectionReason || null, review_notes: reviewNotes || null, reviewed_at: new Date().toISOString() }).eq('id', candidate.id);
                await Toast.show({ text: '❌ Candidate rejected', duration: 'short' });
            }
            if (action === 'retry') {
                await supabase.from('font_scan_jobs').insert({ repository_id: candidate.repository_id, status: 'queued', available_at: new Date().toISOString() });
                await supabase.from('font_candidates').update({ status: 'queued' }).eq('id', candidate.id);
                await Toast.show({ text: '🔄 Rescan queued', duration: 'short' });
            }
            onActionComplete();
            onBack();
        } catch (err: unknown) {
            await Toast.show({ text: `Error: ${err instanceof Error ? err.message : String(err)}`, duration: 'long' });
        } finally {
            setProcessing(false);
        }
    }, [candidate, editedFamily, editedDesc, editedDesigner, reviewNotes, rejectionReason, onActionComplete, onBack]);

    const manifest  = candidate.font_file_manifest ?? [];
    const metadata  = (candidate.font_metadata ?? {}) as Record<string, unknown>;
    const warnings  = candidate.validation_warnings ?? [];

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="text-sm text-muted hover:text-foreground flex items-center gap-2 transition-colors">← Back to queue</button>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-foreground">{candidate.family_name}</h3>
                    <a href={candidate.github_font_repositories?.html_url} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-muted hover:text-foreground flex items-center gap-1 mt-1 transition-colors">
                        <GitBranch size={13} />{candidate.github_font_repositories?.full_name}<ExternalLink size={11} />
                    </a>
                </div>
                <div className="flex flex-wrap gap-2"><StatusBadge status={candidate.status} /><StatusBadge status={candidate.license_status} label={`License: ${candidate.license_status}`} /></div>
            </div>

            {warnings.length > 0 && (
                <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/[0.08] p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm"><AlertTriangle size={15} />{warnings.length} Validation Warning{warnings.length > 1 ? 's' : ''}</div>
                    {warnings.map((w, i) => (
                        <div key={i} className={`text-xs flex items-start gap-2 ${w.severity === 'error' ? 'text-red-400' : 'text-amber-300'}`}>
                            <span className="shrink-0 mt-0.5">{w.severity === 'error' ? '✗' : '⚠'}</span>
                            <span><strong>{w.code}:</strong> {w.message}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Editable metadata */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wide text-muted">Metadata (editable)</h4>
                    <div className="space-y-3">
                        <label className="block">
                            <span className="text-xs font-semibold text-muted">Family Name</span>
                            <input value={editedFamily} onChange={e => setEditedFamily(e.target.value)}
                                className="w-full mt-1 px-3 py-2 rounded-xl border-2 border-foreground/12 bg-background text-foreground text-sm outline-none focus:border-accent transition-colors" />
                        </label>
                        <label className="block">
                            <span className="text-xs font-semibold text-muted">Description</span>
                            <textarea value={editedDesc} onChange={e => setEditedDesc(e.target.value)} rows={3}
                                className="w-full mt-1 px-3 py-2 rounded-xl border-2 border-foreground/12 bg-background text-foreground text-sm outline-none focus:border-accent transition-colors resize-none" />
                        </label>
                        <label className="block">
                            <span className="text-xs font-semibold text-muted">Designer</span>
                            <input value={editedDesigner} onChange={e => setEditedDesigner(e.target.value)}
                                className="w-full mt-1 px-3 py-2 rounded-xl border-2 border-foreground/12 bg-background text-foreground text-sm outline-none focus:border-accent transition-colors" />
                        </label>
                        {Object.keys(metadata).length > 0 && (
                            <div className="rounded-xl border border-foreground/8 bg-foreground/2 p-3 space-y-1.5">
                                <div className="text-xs font-bold text-muted uppercase mb-2">Extracted from binary</div>
                                {(['weight_class','width_class','glyph_count','category','version_string'] as const).map(k =>
                                    metadata[k] != null ? (
                                        <div key={k} className="flex items-center justify-between text-xs">
                                            <span className="text-muted">{k.replace(/_/g,' ')}</span>
                                            <span className="text-foreground font-mono">{String(metadata[k])}</span>
                                        </div>
                                    ) : null
                                )}
                                {Array.isArray(metadata.variable_axes) && (metadata.variable_axes as Array<{ tag: string }>).length > 0 && (
                                    <div className="flex items-start justify-between text-xs">
                                        <span className="text-muted">variable axes</span>
                                        <span className="text-foreground font-mono">{(metadata.variable_axes as Array<{ tag: string }>).map(a => a.tag).join(', ')}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* License evidence */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wide text-muted">License Evidence</h4>
                    <div className="rounded-xl border-2 border-foreground/10 bg-background p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted">Status</span>
                            <StatusBadge status={candidate.license_status} />
                        </div>
                        {candidate.license_name && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted">License</span>
                                <span className="text-sm font-bold text-foreground">{candidate.license_name}</span>
                            </div>
                        )}
                        {candidate.license_identifier && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted">SPDX ID</span>
                                <code className="text-xs bg-foreground/8 px-2 py-0.5 rounded">{candidate.license_identifier}</code>
                            </div>
                        )}
                        {candidate.license_text_url && (
                            <a href={candidate.license_text_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors">
                                <Shield size={12} />View license file<ExternalLink size={10} />
                            </a>
                        )}
                        {candidate.license_evidence && (
                            <div className="mt-2 p-3 rounded-lg bg-foreground/4 border border-foreground/8">
                                <div className="text-xs text-muted font-semibold mb-1">Evidence snippet</div>
                                <p className="text-xs text-foreground/70 font-mono leading-relaxed">{candidate.license_evidence}</p>
                            </div>
                        )}
                    </div>

                    {(candidate.duplicate_of_font_id || candidate.duplicate_of_candidate_id) && (
                        <div className="rounded-xl border-2 border-purple-500/30 bg-purple-500/[0.08] p-3">
                            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold mb-1"><Copy size={12} />Potential Duplicate Detected</div>
                            <p className="text-xs text-muted">
                                {candidate.duplicate_of_font_id ? `Matches published font ID: ${candidate.duplicate_of_font_id}` : `Matches candidate ID: ${candidate.duplicate_of_candidate_id}`}
                            </p>
                        </div>
                    )}

                    <div>
                        <button onClick={() => setShowManifest(v => !v)}
                            className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground transition-colors">
                            {showManifest ? <ChevronUp size={12} /> : <ChevronDown size={12} />}Font Files ({manifest.length})
                        </button>
                        <AnimatePresence>
                            {showManifest && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2 space-y-1.5">
                                    {manifest.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-foreground/4 border border-foreground/8">
                                            <code className="flex-1 truncate text-foreground/70">{f.path}</code>
                                            {f.format && <span className="text-muted">{f.format}</span>}
                                            {typeof f.size_bytes === 'number' && (
                                                <span className="text-muted">
                                                    {(f.size_bytes / 1024).toFixed(1)}KB
                                                </span>
                                            )}
                                            {f.commit_pinned_url && (
                                                <a href={f.commit_pinned_url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink size={10} className="text-muted hover:text-foreground" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Review notes */}
            <label className="block">
                <span className="text-xs font-semibold text-muted uppercase">Review Notes (optional)</span>
                <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={2} placeholder="Add a note visible in the audit log..."
                    className="w-full mt-1 px-3 py-2 rounded-xl border-2 border-foreground/12 bg-background text-foreground text-sm outline-none focus:border-accent transition-colors resize-none" />
            </label>

            {/* Action buttons */}
            {candidate.status === 'needs_review' && (
                <div className="flex flex-wrap gap-3 pt-2 border-t border-foreground/8">
                    <div className="flex gap-2 flex-1 min-w-48">
                        <input value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Rejection reason..."
                            className="flex-1 px-3 py-2 rounded-xl border-2 border-foreground/12 bg-background text-foreground text-sm outline-none focus:border-red-500/50 transition-colors" />
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => void doAction('reject')} disabled={processing}
                            className="px-4 py-2 rounded-xl border-2 border-red-500/40 bg-red-500/10 text-red-400 text-sm font-bold flex items-center gap-1.5 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                            <XCircle size={14} />Reject
                        </motion.button>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => void doAction('retry')} disabled={processing}
                        className="px-4 py-2 rounded-xl border-2 border-foreground/15 bg-background text-foreground text-sm font-bold flex items-center gap-1.5 hover:border-foreground/40 transition-colors disabled:opacity-50">
                        <RotateCcw size={14} />Retry Scan
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => void doAction('approve')} disabled={processing}
                        className="px-6 py-2 rounded-xl border-2 border-accent bg-accent text-black text-sm font-bold flex items-center gap-1.5 hover:opacity-85 transition-opacity disabled:opacity-50">
                        {processing ? <div className="animate-spin w-3 h-3 border-2 border-black/30 border-t-black rounded-full" /> : <CheckCircle2 size={14} />}
                        Approve &amp; Publish
                    </motion.button>
                </div>
            )}
            {candidate.status === 'approved' && (
                <div className="flex items-center gap-2 text-sm text-emerald-400 font-semibold p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20">
                    <CheckCircle2 size={16} />Approved and published
                </div>
            )}
            {candidate.status === 'rejected' && (
                <div className="flex items-center gap-2 text-sm text-red-400 font-semibold p-3 rounded-xl bg-red-500/[0.08] border border-red-500/20">
                    <XCircle size={16} />Rejected{candidate.rejection_reason ? `: ${candidate.rejection_reason}` : ''}
                </div>
            )}
            {candidate.status === 'scan_failed' && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => void doAction('retry')} disabled={processing}
                    className="px-6 py-2 rounded-xl border-2 border-orange-500/40 bg-orange-500/10 text-orange-400 font-bold flex items-center gap-2 hover:bg-orange-500/20 transition-colors disabled:opacity-50">
                    <RotateCcw size={14} />Retry Failed Scan
                </motion.button>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function GitHubDiscoveryTab() {
    const [subView, setSubView]             = useState<SubView>('health');
    const [selectedCandidate, setSelectedCandidate] = useState<FontCandidate | null>(null);
    const [queueRefreshKey, setQueueRefreshKey]     = useState(0);

    const handleRunNow = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discover-github-fonts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        });
        const result = await resp.json() as { error?: string; repositories_queued?: number };
        if (!resp.ok) {
            await Toast.show({ text: `Discovery failed: ${result.error ?? 'Unknown error'}`, duration: 'long' });
            throw new Error(result.error ?? 'Discovery failed');
        }
        await Toast.show({ text: `✅ Discovery started — ${result.repositories_queued ?? 0} repos queued`, duration: 'long' });
    }, []);

    return (
        <div className="space-y-6">
            {subView !== 'detail' && (
                <div className="flex gap-2 flex-wrap">
                    {(['health', 'queue'] as const).map(tab => (
                        <motion.button key={tab} whileTap={{ scale: 0.95 }} onClick={() => setSubView(tab)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                                subView === tab
                                    ? 'bg-foreground text-background border-foreground'
                                    : 'bg-transparent text-muted border-foreground/12 hover:border-foreground/40'
                            }`}>
                            {tab === 'health' ? 'Discovery Health' : 'Candidate Queue'}
                        </motion.button>
                    ))}
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.div key={subView + (selectedCandidate?.id ?? '')}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                    {subView === 'health' && <DiscoveryHealth onRunNow={handleRunNow} />}
                    {subView === 'queue' && (
                        <CandidateQueue key={queueRefreshKey} onSelectCandidate={c => { setSelectedCandidate(c); setSubView('detail'); }} />
                    )}
                    {subView === 'detail' && selectedCandidate && (
                        <CandidateDetail
                            candidate={selectedCandidate}
                            onBack={() => { setSelectedCandidate(null); setSubView('queue'); }}
                            onActionComplete={() => setQueueRefreshKey(k => k + 1)}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
