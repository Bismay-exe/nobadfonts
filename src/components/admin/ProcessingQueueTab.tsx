import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import {
    Search, RefreshCw, ExternalLink, Clock, CheckCircle2,
    AlertTriangle, FileArchive, RotateCcw, Copy, Check, Layers
} from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Toast } from '@capacitor/toast';

export interface DownloadUrlItem {
    url: string;
    label?: string;
}

export interface FontVariantSummary {
    id: string;
    variant_name?: string;
    format?: string;
    woff2_url?: string | null;
}

export interface QueueFontData {
    id: string;
    name: string;
    slug: string;
    designer: string | null;
    preview_image_url: string | null;
    is_published: boolean;
    category: string | null;
    font_variants?: FontVariantSummary[];
}

export interface QueueItem {
    id: string;
    font_id: string;
    slug: string;
    download_urls: DownloadUrlItem[] | null;
    source_1001fonts: string | null;
    status: 'pending' | 'processing' | 'completed' | 'error' | 'completed_with_warnings';
    error_message: string | null;
    created_at: string;
    updated_at: string;
    fonts?: QueueFontData | null;
}

interface ProcessingQueueTabProps {
    onPendingCountChange?: (count: number) => void;
}

export default function ProcessingQueueTab({ onPendingCountChange }: ProcessingQueueTabProps) {
    const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [retryingId, setRetryingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'error'>('all');
    const [sourceFilter, setSourceFilter] = useState<'all' | '1001fonts' | 'zip'>('all');

    const fetchQueue = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);

        try {
            const { data, error } = await supabase
                .from('font_processing_queue')
                .select(`
                    id,
                    font_id,
                    slug,
                    download_urls,
                    source_1001fonts,
                    status,
                    error_message,
                    created_at,
                    updated_at,
                    fonts (
                        id,
                        name,
                        slug,
                        designer,
                        preview_image_url,
                        is_published,
                        category,
                        font_variants (
                            id,
                            variant_name,
                            woff2_url
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching font processing queue:', error);
                await Toast.show({ text: `Failed to load queue: ${error.message}`, duration: 'short' });
            } else {
                const items = (data || []) as unknown as QueueItem[];
                setQueueItems(items);

                // Notify parent about pending items count
                const pendingCount = items.filter(i => i.status === 'pending' || i.status === 'processing').length;
                if (onPendingCountChange) {
                    onPendingCountChange(pendingCount);
                }
            }
        } catch (err: any) {
            console.error('Unexpected error fetching queue:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [onPendingCountChange]);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    const handleRetry = useCallback(async (itemId: string, fontSlug: string) => {
        setRetryingId(itemId);
        await Haptics.impact({ style: ImpactStyle.Medium });

        try {
            const { error } = await supabase
                .from('font_processing_queue')
                .update({
                    status: 'pending',
                    error_message: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', itemId);

            if (error) throw error;

            await Toast.show({ text: `Queued "${fontSlug}" for reprocessing.`, duration: 'short' });
            await fetchQueue(true);
        } catch (err: any) {
            console.error('Error retrying queue item:', err);
            await Toast.show({ text: `Failed to retry: ${err.message}`, duration: 'short' });
        } finally {
            setRetryingId(null);
        }
    }, [fetchQueue]);

    const handleCopyQueueId = useCallback(async (id: string) => {
        try {
            await navigator.clipboard.writeText(id);
            setCopiedId(id);
            await Haptics.impact({ style: ImpactStyle.Light });
            await Toast.show({ text: 'Queue ID copied to clipboard', duration: 'short' });
            setTimeout(() => setCopiedId(null), 2000);
        } catch (e) {
            console.error('Failed to copy ID:', e);
        }
    }, []);

    // Filtered queue items
    const filteredItems = useMemo(() => {
        return queueItems.filter(item => {
            // Status filter
            if (statusFilter !== 'all') {
                if (statusFilter === 'error' && (item.status === 'error')) {
                    // match
                } else if (item.status !== statusFilter) {
                    return false;
                }
            }

            // Source filter
            if (sourceFilter === '1001fonts' && !item.source_1001fonts) {
                return false;
            }
            if (sourceFilter === 'zip') {
                const hasZips = Array.isArray(item.download_urls) && item.download_urls.length > 0;
                if (!hasZips || item.source_1001fonts) {
                    return false;
                }
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const fontName = item.fonts?.name?.toLowerCase() || '';
                const slug = item.slug.toLowerCase();
                const designer = item.fonts?.designer?.toLowerCase() || '';
                const source = (item.source_1001fonts || '').toLowerCase();
                const zipUrls = (item.download_urls || []).map(u => u.url.toLowerCase()).join(' ');

                return fontName.includes(q) || slug.includes(q) || designer.includes(q) || source.includes(q) || zipUrls.includes(q);
            }

            return true;
        });
    }, [queueItems, statusFilter, sourceFilter, searchQuery]);

    // Summary statistics
    const stats = useMemo(() => {
        const total = queueItems.length;
        const pending = queueItems.filter(i => i.status === 'pending').length;
        const processing = queueItems.filter(i => i.status === 'processing').length;
        const completed = queueItems.filter(i => i.status === 'completed' || i.status === 'completed_with_warnings').length;
        const failed = queueItems.filter(i => i.status === 'error').length;
        const source1001 = queueItems.filter(i => !!i.source_1001fonts).length;
        const sourceZip = queueItems.filter(i => Array.isArray(i.download_urls) && i.download_urls.length > 0 && !i.source_1001fonts).length;

        return { total, pending, processing, completed, failed, source1001, sourceZip };
    }, [queueItems]);

    return (
        <div className="space-y-6">
            {/* Header with Title and Refresh */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        Font Import & Processing Queue
                    </h2>
                    <p className="text-xs text-muted mt-1">
                        Track fonts uploaded with 1001fonts page URLs or release ZIP links to see what is pending and what is processed.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchQueue(true)}
                        disabled={refreshing}
                        className="px-4 py-2 bg-foreground/5 hover:bg-foreground/10 text-foreground border-2 border-border rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl bg-foreground/3 border-2 border-border text-center">
                    <p className="text-3xl font-black text-foreground">{stats.total}</p>
                    <p className="text-[11px] text-muted font-mono uppercase font-bold mt-1">Total Queued</p>
                </div>
                <div className="p-4 rounded-2xl bg-warning/5 border-2 border-warning/30 text-center">
                    <p className="text-3xl font-black text-warning">{stats.pending}</p>
                    <p className="text-[11px] text-warning font-mono uppercase font-bold mt-1">Pending</p>
                </div>
                <div className="p-4 rounded-2xl bg-accent/5 border-2 border-accent/30 text-center">
                    <p className="text-3xl font-black text-accent">{stats.processing}</p>
                    <p className="text-[11px] text-accent font-mono uppercase font-bold mt-1">Processing</p>
                </div>
                <div className="p-4 rounded-2xl bg-success/5 border-2 border-success/30 text-center">
                    <p className="text-3xl font-black text-success">{stats.completed}</p>
                    <p className="text-[11px] text-success font-mono uppercase font-bold mt-1">Processed</p>
                </div>
                <div className="p-4 rounded-2xl bg-destructive/5 border-2 border-destructive/30 text-center">
                    <p className="text-3xl font-black text-destructive">{stats.failed}</p>
                    <p className="text-[11px] text-destructive font-mono uppercase font-bold mt-1">Failed</p>
                </div>
            </div>

            {/* Filters & Search Row */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Search by font name, slug, designer, or source URL..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-background border-2 border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:border-foreground"
                    />
                </div>

                {/* Status Pills */}
                <div className="flex gap-1.5 flex-wrap items-center">
                    <span className="text-[10px] uppercase font-mono text-muted mr-1 font-bold">Status:</span>
                    {(['all', 'pending', 'processing', 'completed', 'error'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                statusFilter === status
                                    ? 'bg-foreground text-background border-foreground'
                                    : 'bg-card-background text-foreground border-border hover:border-foreground/40'
                            }`}
                        >
                            {status === 'error' ? 'Failed' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Source Pills */}
                <div className="flex gap-1.5 flex-wrap items-center">
                    <span className="text-[10px] uppercase font-mono text-muted mr-1 font-bold">Source:</span>
                    {(['all', '1001fonts', 'zip'] as const).map(source => (
                        <button
                            key={source}
                            onClick={() => setSourceFilter(source)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                sourceFilter === source
                                    ? 'bg-foreground text-background border-foreground'
                                    : 'bg-card-background text-foreground border-border hover:border-foreground/40'
                            }`}
                        >
                            {source === '1001fonts' ? '1001Fonts' : source === 'zip' ? 'Release ZIPs' : 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Queue Table */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-foreground/30"></div>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-16 text-muted font-bold border-2 border-dashed border-border rounded-2xl">
                    <p className="text-base text-foreground font-bold">No queue items match your filter</p>
                    <p className="text-xs text-muted mt-1">Upload fonts on the /upload page with release ZIPs or 1001fonts URLs to see them here.</p>
                </div>
            ) : (
                <div className="overflow-x-auto border-2 border-border rounded-2xl bg-card-background">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b-2 border-border text-[11px] uppercase tracking-wider text-muted font-mono bg-foreground/2">
                                <th className="py-3.5 px-4">Font</th>
                                <th className="py-3.5 px-4">Import Source</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4">Variants Published</th>
                                <th className="py-3.5 px-4">Queued</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredItems.map(item => {
                                const isPending = item.status === 'pending';
                                const isProcessing = item.status === 'processing';
                                const isCompleted = item.status === 'completed' || item.status === 'completed_with_warnings';
                                const isError = item.status === 'error';
                                const variantCount = item.fonts?.font_variants?.length || 0;
                                const isExpanded = expandedItemId === item.id;

                                return (
                                    <tr key={item.id} className="hover:bg-foreground/2 transition-colors duration-200">
                                        {/* Font Info */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-foreground/5 border border-border overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-muted">
                                                    {item.fonts?.preview_image_url ? (
                                                        <img
                                                            src={item.fonts.preview_image_url}
                                                            alt={item.fonts.name || item.slug}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span>Aa</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground flex items-center gap-1.5">
                                                        <span>{item.fonts?.name || item.slug}</span>
                                                        {item.fonts?.is_published && (
                                                            <span className="text-[9px] px-1.5 py-0.2 bg-success/15 text-success border border-success/30 rounded font-mono uppercase">
                                                                Published
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-muted font-mono flex items-center gap-2">
                                                        <span>slug: {item.slug}</span>
                                                        {item.fonts?.designer && <span>· by {item.fonts.designer}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Import Source */}
                                        <td className="py-3.5 px-4">
                                            <div className="space-y-1 max-w-xs">
                                                {item.source_1001fonts && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="px-1.5 py-0.5 rounded bg-warning/15 text-warning border border-warning/30 text-[10px] font-bold uppercase shrink-0">
                                                            1001Fonts
                                                        </span>
                                                        <a
                                                            href={item.source_1001fonts}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-foreground hover:underline truncate max-w-[190px] font-mono text-[11px] flex items-center gap-1 inline-flex"
                                                            title={item.source_1001fonts}
                                                        >
                                                            <span className="truncate">{item.source_1001fonts.replace('https://www.1001fonts.com/', '')}</span>
                                                            <ExternalLink size={10} className="shrink-0 text-muted" />
                                                        </a>
                                                    </div>
                                                )}

                                                {Array.isArray(item.download_urls) && item.download_urls.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 text-[10px] font-bold uppercase shrink-0 flex items-center gap-1">
                                                                <FileArchive size={10} />
                                                                ZIP ({item.download_urls.length})
                                                            </span>
                                                            <span className="text-[10px] text-muted truncate max-w-[180px] font-mono">
                                                                {item.download_urls[0]?.label || 'download link'}
                                                            </span>
                                                        </div>
                                                        {item.download_urls.length > 1 && (
                                                            <button
                                                                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                                                className="text-[10px] text-muted hover:text-foreground font-mono underline text-left cursor-pointer"
                                                            >
                                                                {isExpanded ? 'Hide all URLs' : `+${item.download_urls.length - 1} more archive(s)`}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {!item.source_1001fonts && (!item.download_urls || item.download_urls.length === 0) && (
                                                    <span className="text-muted italic">No download URLs</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Status Badge */}
                                        <td className="py-3.5 px-4">
                                            {isPending && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-warning/15 text-warning border border-warning/30">
                                                    <Clock size={12} />
                                                    Pending
                                                </span>
                                            )}
                                            {isProcessing && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent/15 text-accent border border-accent/30 animate-pulse">
                                                    <RefreshCw size={12} className="animate-spin" />
                                                    Processing
                                                </span>
                                            )}
                                            {isCompleted && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-success/15 text-success border border-success/30">
                                                    <CheckCircle2 size={12} />
                                                    Processed
                                                </span>
                                            )}
                                            {isError && (
                                                <div>
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-destructive/15 text-destructive border border-destructive/30">
                                                        <AlertTriangle size={12} />
                                                        Failed
                                                    </span>
                                                    {item.error_message && (
                                                        <p className="text-[10px] text-destructive/80 font-mono mt-1 max-w-xs truncate" title={item.error_message}>
                                                            {item.error_message}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* Published Variants */}
                                        <td className="py-3.5 px-4 font-mono">
                                            {variantCount > 0 ? (
                                                <span className="inline-flex items-center gap-1 text-foreground font-bold">
                                                    <Layers size={13} className="text-success" />
                                                    {variantCount} variant{variantCount !== 1 ? 's' : ''}
                                                </span>
                                            ) : (
                                                <span className="text-muted">0 variants</span>
                                            )}
                                        </td>

                                        {/* Queued Date */}
                                        <td className="py-3.5 px-4 text-muted font-mono text-[11px]">
                                            {new Date(item.created_at).toLocaleDateString()}{' '}
                                            <span className="text-muted/60 text-[10px]">
                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Retry button for errors or stuck */}
                                                {(isError || isPending) && (
                                                    <button
                                                        onClick={() => handleRetry(item.id, item.slug)}
                                                        disabled={retryingId === item.id}
                                                        className="px-2.5 py-1 rounded-lg border border-border hover:border-warning hover:text-warning bg-card-background text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                        title="Retry processing this font"
                                                    >
                                                        <RotateCcw size={11} className={retryingId === item.id ? 'animate-spin' : ''} />
                                                        <span>Retry</span>
                                                    </button>
                                                )}

                                                {/* View Font link */}
                                                {item.fonts?.slug && (
                                                    <Link
                                                        to={`/fonts/${item.fonts.slug}`}
                                                        className="px-2.5 py-1 rounded-lg border border-border hover:border-foreground bg-card-background text-foreground text-[11px] font-bold transition-all"
                                                    >
                                                        View
                                                    </Link>
                                                )}

                                                {/* Copy Queue ID */}
                                                <button
                                                    onClick={() => handleCopyQueueId(item.id)}
                                                    className="p-1 rounded-lg border border-border hover:border-foreground text-muted hover:text-foreground transition-all cursor-pointer"
                                                    title={`Copy queue ID: ${item.id}`}
                                                >
                                                    {copiedId === item.id ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
