import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Search, XCircle } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Toast } from '@capacitor/toast';
import { motion } from 'framer-motion';
import type { Database } from '../types/database.types';

import { useAnalytics } from '../hooks/useAnalytics';
import AnalyticsSection from '../components/admin/AnalyticsSection';
import FontResearchPanel from '../components/admin/FontResearchPanel';
import GitHubDiscoveryTab from '../components/admin/github/GitHubDiscoveryTab';
import SEO from '../components/shared/SEO';

type FontResearchRow = Database['public']['Tables']['font_research']['Row'];
type FontSourceRow = Database['public']['Tables']['font_sources']['Row'];
type ResearchJobRow = Database['public']['Tables']['research_jobs']['Row'];

type Profile = Database['public']['Tables']['profiles']['Row'];
type FontRow = Database['public']['Tables']['fonts']['Row'];

export default function AdminDashboard() {
    const { user, profile, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'files' | 'curation' | 'analytics' | 'research' | 'github'>('requests');

    // State for Requests
    const [pendingRequests, setPendingRequests] = useState<Profile[]>([]);

    // State for User Management
    const [allUsers, setAllUsers] = useState<Profile[]>([]);

    // State for Files/Storage
    const [allFonts, setAllFonts] = useState<FontRow[]>([]);

    // Use the custom hook for analytics
    const {
        downloadStats,
        topDownloadedFonts,
        favoritesStats,
        topFavoritedFonts,
        loading: analyticsLoading
    } = useAnalytics(activeTab, profile);

    // Search States
    const [searchUsers, setSearchUsers] = useState('');
    const [searchFiles, setSearchFiles] = useState('');
    const [searchCuration, setSearchCuration] = useState('');
    const [searchResearch, setSearchResearch] = useState('');
    const [researchFilter, setResearchFilter] = useState<'all' | 'unresearched' | 'verified' | 'needs_review' | 'failed'>('all');

    // AI Research State
    const [researchFonts, setResearchFonts] = useState<(FontRow & { research?: FontResearchRow | null; sources?: FontSourceRow[] })[]>([]);
    const [researchJobs, setResearchJobs] = useState<ResearchJobRow[]>([]);
    const [expandedResearchId, setExpandedResearchId] = useState<string | null>(null);
    const [activeResearchingFontId, setActiveResearchingFontId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.role !== 'admin') return;

        if (activeTab === 'requests') {
            fetchRequests();
        } else if (activeTab === 'users') {
            fetchAllUsers();
        } else if (activeTab === 'files' || activeTab === 'curation') {
            fetchFonts();
        } else if (activeTab === 'research') {
            fetchResearchData();
        }
    }, [activeTab, profile]);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('membership_status', 'pending');

        if (error) {
            console.error('Error fetching requests:', error);
        } else {
            setPendingRequests(data || []);
        }
        setLoading(false);
    }, []);

    const fetchAllUsers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
        } else {
            setAllUsers(data || []);
        }
        setLoading(false);
    }, []);

    const fetchFonts = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('fonts')
            .select(`
                *,
                font_variants (*)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching fonts:', error);
        } else {
            setAllFonts(data || []);
        }
        setLoading(false);
    }, []);



    const handleRequestAction = useCallback(async (userId: string, action: 'approve' | 'reject') => {
        try {
            const updates: any = {
                membership_status: action === 'approve' ? 'approved' : 'rejected'
            };

            if (action === 'approve') {
                updates.role = 'member';
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId);

            if (error) throw error;
            fetchRequests(); // Refresh
        } catch (error) {
            console.error(`Error ${action}ing user:`, error);
            await Toast.show({ text: `Failed to ${action} user.`, duration: 'short' });
        }
    }, [fetchRequests]);

    const handleRoleChange = useCallback(async (userId: string, newRole: 'user' | 'member' | 'admin') => {
        const targetUser = allUsers.find(u => u.id === userId);

        // Security Check: Demoting an Admin
        if (targetUser?.role === 'admin' && newRole !== 'admin') {
            const code = window.prompt("⚠️ SECURITY CHECK: Enter the Admin Secret Code to remove this admin:");
            if (code !== "admin123") {
                await Toast.show({ text: "❌ Invalid Secret Code. Action cancelled.", duration: 'short' });
                return;
            }
        }

        if (newRole === 'admin') {
            if (!window.confirm('WARNING: You are about to make this user an ADMIN. They will have full control over the platform. Are you sure?')) {
                return;
            }
        }

        try {
            const updates: any = { role: newRole };

            // Adjust membership status based on role
            if (newRole === 'member' || newRole === 'admin') {
                updates.membership_status = 'approved';
            } else if (newRole === 'user') {
                updates.membership_status = 'none';
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId);

            if (error) throw error;

            // Optimistic update
            setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
            await Toast.show({ text: 'User role updated successfully.', duration: 'short' });

        } catch (error) {
            console.error('Error updating role:', error);
            await Toast.show({ text: 'Failed to update role.', duration: 'short' });
        }
    }, [allUsers, user?.id]);

    const handleToggleCuration = useCallback(async (fontId: string, field: 'is_featured' | 'is_trending' | 'is_editors_pick') => {
        const font = allFonts.find(f => f.id === fontId);
        if (!font) return;

        const newValue = !font[field];

        try {
            // Optimistic Update
            setAllFonts(prev => prev.map(f => f.id === fontId ? { ...f, [field]: newValue } : f));

            const { error } = await supabase
                .from('fonts')
                .update({ [field]: newValue })
                .eq('id', fontId);

            if (error) throw error;
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            // Revert on error
            setAllFonts(prev => prev.map(f => f.id === fontId ? { ...f, [field]: !newValue } : f));
            await Toast.show({ text: 'Failed to update status.', duration: 'short' });
        }
    }, [allFonts]);

    // ─── AI Research Data Fetching ───────────────────────────────────
    const fetchResearchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all fonts with their research data
            const { data: fonts } = await supabase
                .from('fonts')
                .select('*')
                .order('created_at', { ascending: false });

            if (fonts) {
                // Fetch research for all fonts
                const { data: researchData } = await supabase
                    .from('font_research')
                    .select('*');

                const { data: sourcesData } = await supabase
                    .from('font_sources')
                    .select('*');

                const enrichedFonts = fonts.map(f => ({
                    ...f,
                    research: researchData?.find(r => r.font_id === f.id) || null,
                    sources: sourcesData?.filter(s => {
                        const research = researchData?.find(r => r.font_id === f.id);
                        return research ? s.research_id === research.id : false;
                    }) || [],
                }));

                setResearchFonts(enrichedFonts);
            }

            // Fetch recent jobs
            const { data: jobs } = await supabase
                .from('research_jobs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            setResearchJobs(jobs || []);
        } catch (err) {
            console.error('Error fetching research data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleClearStuckJobs = useCallback(async () => {
        try {
            const { error } = await supabase
                .from('research_jobs')
                .update({
                    status: 'cancelled',
                    completed_at: new Date().toISOString(),
                    error: 'Cleared manually by admin',
                })
                .in('status', ['queued', 'processing']);

            if (error) throw error;
            await Toast.show({ text: 'Active and stuck jobs cleared successfully.', duration: 'short' });
            fetchResearchData();
        } catch (err: any) {
            console.error('Failed to clear stuck jobs:', err);
            await Toast.show({ text: `Failed to clear jobs: ${err.message}`, duration: 'short' });
        }
    }, [fetchResearchData]);

    // Filtered research fonts
    const filteredResearchFonts = useMemo(() => {
        let fonts = researchFonts;
        if (researchFilter !== 'all') {
            fonts = fonts.filter(f => {
                const status = f.research?.research_status || 'unresearched';
                if (researchFilter === 'unresearched') {
                    return !f.research || status === 'unresearched' || status === 'pending';
                }
                return status === researchFilter;
            });
        }
        if (searchResearch.trim()) {
            const q = searchResearch.toLowerCase();
            fonts = fonts.filter(f =>
                f.name.toLowerCase().includes(q) ||
                f.designer.toLowerCase().includes(q)
            );
        }
        return fonts;
    }, [researchFonts, researchFilter, searchResearch]);

    // Research stats
    const researchStats = useMemo(() => ({
        total: researchFonts.length,
        unresearched: researchFonts.filter(f => !f.research || f.research.research_status === 'pending' || f.research.research_status === 'unresearched').length,
        verified: researchFonts.filter(f => f.research?.research_status === 'verified').length,
        needsReview: researchFonts.filter(f => f.research?.research_status === 'needs_review').length,
        failed: researchFonts.filter(f => f.research?.research_status === 'failed').length,
        activeJobs: researchJobs.filter(j => j.status === 'queued' || j.status === 'processing').length,
    }), [researchFonts, researchJobs]);

    const formatBytes = useCallback((bytes: number | null) => {
        if (!bytes) return 'Unknown';
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);

    // Calculate Storage Stats
    const totalStorageSize = useMemo(() => allFonts.reduce((acc, font: any) => {
        const fontTotal = (font.file_size_woff2 || 0) +
            (font.file_size_ttf || 0) +
            (font.file_size_otf || 0) +
            (font.file_size_woff || 0);

        const variantsTotal = font.font_variants?.reduce((vAcc: number, v: any) => {
            return vAcc +
                (v.file_size_woff2 || 0) +
                (v.file_size_ttf || 0) +
                (v.file_size_otf || 0) +
                (v.file_size_woff || 0);
        }, 0) || 0;

        return acc + fontTotal + variantsTotal;
    }, 0), [allFonts]);

    const totalFonts = allFonts.length;

    const formatCounts = useMemo(() => ({
        woff2: allFonts.filter(f => f.woff2_url).length,
        woff: allFonts.filter(f => f.woff_url).length,
        ttf: allFonts.filter(f => f.ttf_url).length,
        otf: allFonts.filter(f => f.otf_url).length,
    }), [allFonts]);


    if (authLoading) <div className="w-screen h-screen flex justify-center items-center bg-background text-foreground">Loading...</div>;
    if (!user || profile?.role !== 'admin') return <Navigate to="/" replace />;

    return (
        <div className="pt-24 mx-auto bg-transparent rounded-4xl">
            <SEO title="Admin Dashboard | NoBadFonts" noindex url="/admin" />
            <h1 className="text-4xl md:text-6xl text-center md:text-left font-inter-tight font-medium uppercase text-foreground pt-8 pb-4">Admin Dashboard</h1>

            {/* Tabs */}
            <div className=''>
                <div className="flex flex-wrap gap-4 px-1 py-4 justify-center md:justify-start">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                            await Haptics.impact({ style: ImpactStyle.Light });
                            setActiveTab('requests');
                        }}
                        className={`px-6 py-2 rounded-full font-bold border-2 border-foreground/15 transition-all ${activeTab === 'requests' ? 'bg-accent text-black shadow-[4px_4px_0px_0px_rgba(var(--color-foreground),1)]' : 'bg-card-background text-foreground hover:border-accent'
                            }`}
                    >
                        Requests
                        {pendingRequests.length > 0 && (
                            <span className="ml-2 bg-warning text-background text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                        )}
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                            await Haptics.impact({ style: ImpactStyle.Light });
                            setActiveTab('users');
                        }}
                        className={`px-6 py-2 rounded-full font-bold border-2 border-foreground/15 transition-all ${activeTab === 'users' ? 'bg-accent text-black shadow-[4px_4px_0px_0px_rgba(var(--color-foreground),1)]' : 'bg-card-background text-foreground hover:border-accent'
                            }`}
                    >
                        User Management
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                            await Haptics.impact({ style: ImpactStyle.Light });
                            setActiveTab('files');
                        }}
                        className={`px-6 py-2 rounded-full font-bold border-2 border-foreground/15 transition-all ${activeTab === 'files' ? 'bg-success text-black shadow-[4px_4px_0px_0px_rgba(var(--color-foreground),1)]' : 'bg-card-background text-foreground hover:border-success'
                            }`}
                    >
                        Storage & Files
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                            await Haptics.impact({ style: ImpactStyle.Light });
                            setActiveTab('curation');
                        }}
                        className={`px-6 py-2 rounded-full font-bold border-2 border-foreground/15 transition-all ${activeTab === 'curation' ? 'bg-warning text-black shadow-[4px_4px_0px_0px_rgba(var(--color-foreground),1)]' : 'bg-card-background text-foreground hover:border-warning'
                            }`}
                    >
                        Site Curation
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                            await Haptics.impact({ style: ImpactStyle.Light });
                            setActiveTab('analytics');
                        }}
                        className={`px-6 py-2 rounded-full font-bold border-2 border-foreground/15 transition-all ${activeTab === 'analytics' ? 'bg-accent text-black shadow-[4px_4px_0px_0px_rgba(var(--color-foreground),1)]' : 'bg-card-background text-foreground hover:border-accent'
                            }`}
                    >
                        Analytics
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                            await Haptics.impact({ style: ImpactStyle.Light });
                            setActiveTab('research');
                        }}
                        className={`px-6 py-2 rounded-full font-bold border-2 border-foreground/15 transition-all ${activeTab === 'research' ? 'bg-accent text-black shadow-[4px_4px_0px_0px_rgba(var(--color-foreground),1)]' : 'bg-card-background text-foreground hover:border-accent'
                            }`}
                    >
                        AI Research
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                            await Haptics.impact({ style: ImpactStyle.Light });
                            setActiveTab('github');
                        }}
                        className={`px-6 py-2 rounded-full font-bold border-2 border-foreground/15 transition-all ${activeTab === 'github' ? 'bg-foreground text-background shadow-[4px_4px_0px_0px_rgba(var(--color-foreground),1)]' : 'bg-card-background text-foreground hover:border-foreground/50'
                            }`}
                    >
                        GitHub Discovery
                    </motion.button>
                </div>
            </div>

            <div className="bg-card-background border-2 border-foreground/15 rounded-4xl px-4 md:px-8 pt-8 md:pt-8 pb-4 md:pb-8 min-h-[50vh]">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-foreground/15"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'requests' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                    Pending Member Requests
                                </h2>
                                {pendingRequests.length === 0 ? (
                                    <div className="text-center py-12 text-muted font-bold border-2 border-dashed border-foreground/10 rounded-2xl">
                                        No pending requests
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingRequests.map(request => (
                                            <div key={request.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-foreground/3 border-2 border-border rounded-2xl gap-4">
                                                <div className="flex items-center gap-4 w-full md:w-auto">
                                                    <div className="w-12 h-12 bg-foreground/10 rounded-full border-2 border-border overflow-hidden shrink-0">
                                                        {request.avatar_url ? (
                                                            <img src={request.avatar_url} alt={request.full_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center font-black text-lg text-muted">
                                                                {request.full_name?.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg leading-tight text-foreground">{request.full_name}</h3>
                                                        <p className="text-sm text-muted">{request.email}</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 w-full md:w-auto">
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={async () => {
                                                            await Haptics.impact({ style: ImpactStyle.Medium });
                                                            handleRequestAction(request.id, 'reject');
                                                        }}
                                                        className="flex-1 md:flex-none px-6 py-2 bg-transparent text-warning font-bold uppercase rounded-xl border-2 border-border hover:border-warning hover:bg-warning/10 transition-colors duration-300 ease-in-out"
                                                    >
                                                        Reject
                                                    </motion.button>
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={async () => {
                                                            await Haptics.impact({ style: ImpactStyle.Medium });
                                                            handleRequestAction(request.id, 'approve');
                                                        }}
                                                        className="flex-1 md:flex-none px-6 py-2 bg-accent text-background font-bold uppercase rounded-xl border-2 border-border hover:opacity-80 transition-colors duration-300 ease-in-out"
                                                    >
                                                        Approve
                                                    </motion.button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <h2 className="text-2xl font-bold">All Users</h2>
                                    <div className="relative w-full md:w-64">
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchUsers}
                                            onChange={(e) => setSearchUsers(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border-2 border-border rounded-full focus:outline-none focus:bg-foreground/3 transition-all font-bold text-sm bg-transparent text-foreground"
                                        />
                                        <Search className="absolute left-3 top-2.5 text-muted" size={18} />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-border text-sm uppercase text-muted">
                                                <th className="py-4 px-4">User</th>
                                                <th className="py-4 px-4">Role</th>
                                                <th className="py-4 px-4">Joined</th>
                                                <th className="py-4 px-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {allUsers.filter(u =>
                                                u.full_name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
                                                u.email?.toLowerCase().includes(searchUsers.toLowerCase())
                                            ).map(u => (
                                                <tr key={u.id} className="hover:bg-foreground/3 transition-colors duration-300 ease-in-out">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-foreground/10 rounded-full border border-border overflow-hidden shrink-0">
                                                                {u.avatar_url ? (
                                                                    <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center font-black text-sm text-muted">
                                                                        {u.full_name?.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-foreground">{u.full_name}</div>
                                                                <div className="text-sm text-muted">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`
                                                            inline-block px-3 py-1 rounded-full text-xs font-bold uppercase border border-border
                                                            ${u.role === 'admin' ? 'bg-accent text-background' :
                                                                u.role === 'member' ? 'bg-accent text-background' :
                                                                    'bg-card-background text-muted'}
                                                        `}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-muted font-mono">
                                                        {new Date(u.created_at || '').toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <select
                                                            value={u.role}
                                                            onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                                                            className="border-2 border-border bg-card-background text-foreground rounded-lg px-2 py-1 text-sm font-bold focus:border-accent focus:ring-0 cursor-pointer"
                                                            disabled={u.id === user?.id}
                                                        >
                                                            <option value="user">User</option>
                                                            <option value="member">Member</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'files' && (
                            <div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <h2 className="text-2xl font-bold">Storage & Files</h2>
                                    <div className="relative w-full md:w-64">
                                        <input
                                            type="text"
                                            placeholder="Search files..."
                                            value={searchFiles}
                                            onChange={(e) => setSearchFiles(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border-2 border-border rounded-full focus:outline-none focus:bg-foreground/3 transition-all font-bold text-sm bg-transparent text-foreground"
                                        />
                                        <Search className="absolute left-3 top-2.5 text-muted" size={18} />
                                    </div>
                                </div>

                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <div className="bg-foreground/3 rounded-2xl p-6 border-2 border-border">
                                        <h3 className="font-bold text-muted uppercase text-sm mb-2">Total Fonts</h3>
                                        <p className="text-4xl font-black text-foreground">{totalFonts}</p>
                                    </div>
                                    <div className="bg-foreground/3 rounded-2xl p-6 border-2 border-border">
                                        <h3 className="font-bold text-muted uppercase text-sm mb-2">Fonts Storage</h3>
                                        <p className="text-4xl font-black text-foreground">{formatBytes(totalStorageSize)}</p>
                                    </div>
                                    <div className="bg-foreground/3 rounded-2xl p-6 border-2 border-border">
                                        <h3 className="font-bold text-muted uppercase text-sm mb-2">Images Storage</h3>
                                        <p className="text-4xl font-black text-foreground">{formatBytes(allFonts.reduce((acc, font) => {
                                            const previewSize = font.file_size_image_preview || 0;
                                            const gallerySize = (font.gallery_image_sizes || []).reduce((a, b) => a + b, 0);
                                            return acc + previewSize + gallerySize;
                                        }, 0))}</p>
                                    </div>
                                    <div className="bg-foreground/3 rounded-2xl p-6 border-2 border-border">
                                        <h3 className="font-bold text-muted uppercase text-sm mb-2">Files Count</h3>
                                        <div className="flex flex-wrap gap-2 text-sm font-bold">
                                            <span className="px-2 py-1 bg-card-background border border-border rounded text-foreground">WOFF2: {formatCounts.woff2}</span>
                                            <span className="px-2 py-1 bg-card-background border border-border rounded text-foreground">WOFF: {formatCounts.woff}</span>
                                            <span className="px-2 py-1 bg-card-background border border-border rounded text-foreground">TTF: {formatCounts.ttf}</span>
                                            <span className="px-2 py-1 bg-card-background border border-border rounded text-foreground">OTF: {formatCounts.otf}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-border text-sm uppercase text-muted">
                                                <th className="py-4 px-4 rounded-tl-xl hover:bg-foreground/3">Font</th>
                                                <th className="py-4 px-4 hover:bg-foreground/3">Formats</th>
                                                <th className="py-4 px-4 hover:bg-foreground/3">File Sizes</th>
                                                <th className="py-4 px-4 hover:bg-foreground/3">Uploaded</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {allFonts.filter(f =>
                                                f.name?.toLowerCase().includes(searchFiles.toLowerCase())
                                            ).map(font => (
                                                <tr key={font.id} className="hover:bg-foreground/3 transition-colors duration-300 ease-in-out">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-foreground/5 rounded-lg border border-border overflow-hidden shrink-0">
                                                                {font.preview_image_url ? (
                                                                    <img src={font.preview_image_url} alt={font.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-muted">Aa</div>
                                                                )}
                                                            </div>
                                                            <Link to={`/fonts/${font.slug || font.id}`} className="font-bold text-foreground hover:underline">
                                                                {font.name}
                                                            </Link>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {font.woff2_url && <span className="px-1.5 py-0.5 bg-success/10 text-success text-[10px] font-bold uppercase rounded border border-success/20">WOFF2</span>}
                                                            {font.woff_url && <span className="px-1.5 py-0.5 bg-accent/10 text-accent text-[10px] font-bold uppercase rounded border border-accent/20">WOFF</span>}
                                                            {font.ttf_url && <span className="px-1.5 py-0.5 bg-accent/10 text-accent text-[10px] font-bold uppercase rounded border border-accent/20">TTF</span>}
                                                            {font.otf_url && <span className="px-1.5 py-0.5 bg-warning/10 text-warning text-[10px] font-bold uppercase rounded border border-warning/20">OTF</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-xs font-mono space-y-1">
                                                        {font.file_size_woff2 && <div className="text-success">WOFF2: {formatBytes(font.file_size_woff2)}</div>}
                                                        {font.file_size_woff && <div className="text-accent">WOFF: {formatBytes(font.file_size_woff)}</div>}
                                                        {font.file_size_ttf && <div className="text-accent">TTF: {formatBytes(font.file_size_ttf)}</div>}
                                                        {font.file_size_otf && <div className="text-warning">OTF: {formatBytes(font.file_size_otf)}</div>}

                                                        {(font as any).font_variants?.length > 0 && (
                                                            <div className="mt-2 pt-1 border-t border-border/20">
                                                                <div className="text-[10px] text-muted italic mb-1">
                                                                    + {(font as any).font_variants.length} Variants
                                                                </div>
                                                                <div className="space-y-1 pl-1 border-l-2 border-border/30">
                                                                    {(font as any).font_variants.map((v: any, idx: number) => (
                                                                        <div key={idx} className="bg-foreground/2 p-1 rounded">
                                                                            <div className="font-bold text-[10px] text-foreground uppercase mb-0.5">{v.variant_name}</div>
                                                                            {v.file_size_woff2 && <div className="text-success text-[9px] pl-1">WOFF2: {formatBytes(v.file_size_woff2)}</div>}
                                                                            {v.file_size_woff && <div className="text-accent text-[9px] pl-1">WOFF: {formatBytes(v.file_size_woff)}</div>}
                                                                            {v.file_size_ttf && <div className="text-accent text-[9px] pl-1">TTF: {formatBytes(v.file_size_ttf)}</div>}
                                                                            {v.file_size_otf && <div className="text-warning text-[9px] pl-1">OTF: {formatBytes(v.file_size_otf)}</div>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!font.file_size_woff2 && !font.file_size_woff && !font.file_size_ttf && !font.file_size_otf && !(font as any).font_variants?.length && <span className="text-muted">-</span>}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-muted font-mono">
                                                        {new Date(font.created_at || '').toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'curation' && (
                            <div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <h2 className="text-2xl font-bold flex items-center gap-3">
                                        Site Curation
                                    </h2>
                                    <div className="relative w-full md:w-64">
                                        <input
                                            type="text"
                                            placeholder="Search fonts..."
                                            value={searchCuration}
                                            onChange={(e) => setSearchCuration(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border-2 border-border rounded-full focus:outline-none focus:bg-foreground/3 transition-all font-bold text-sm bg-transparent text-foreground"
                                        />
                                        <Search className="absolute left-3 top-2.5 text-muted" size={18} />
                                    </div>
                                </div>
                                <div className="bg-card-background rounded-2xl border-2 border-border overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-foreground/3 border-b-2 border-border">
                                            <tr>
                                                <th className="p-4 border-r-2 border-border w-2/3 text-foreground">Font</th>
                                                <th className="p-4 border-r-2 border-border text-center w-1/6 text-foreground">Statuses</th>
                                                <th className="p-4 text-center w-1/6 text-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y-2 divide-border/10">
                                            {allFonts.filter(f =>
                                                f.name?.toLowerCase().includes(searchCuration.toLowerCase()) ||
                                                f.designer?.toLowerCase().includes(searchCuration.toLowerCase())
                                            ).map(font => (
                                                <tr key={font.id} className="hover:bg-foreground/3 transition-colors duration-300 ease-in-out">
                                                    <td className="p-4 border-r-2 border-border/50">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-foreground/10 border-2 border-border rounded-lg overflow-hidden shrink-0">
                                                                {font.preview_image_url ? (
                                                                    <img src={font.preview_image_url} alt={font.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center font-bold text-muted">Aa</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-lg text-foreground">{font.name}</div>
                                                                <div className="text-xs text-muted">by {font.designer}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 border-r-2 border-border/50">
                                                        <div className="flex flex-col gap-2">
                                                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-foreground/5 transition-colors duration-300 ease-in-out">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={font.is_featured || false}
                                                                    onChange={() => handleToggleCuration(font.id, 'is_featured')}
                                                                    className="w-4 h-4 accent-accent rounded border-2 border-border cursor-pointer"
                                                                />
                                                                <span className={`text-sm font-bold ${font.is_featured ? 'text-foreground' : 'text-muted'}`}>Featured</span>
                                                            </label>

                                                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-foreground/5 transition-colors duration-300 ease-in-out">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={font.is_trending || false}
                                                                    onChange={() => handleToggleCuration(font.id, 'is_trending')}
                                                                    className="w-4 h-4 accent-accent rounded border-2 border-border cursor-pointer"
                                                                />
                                                                <span className={`text-sm font-bold ${font.is_trending ? 'text-foreground' : 'text-muted'}`}>Trending</span>
                                                            </label>

                                                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-foreground/5 transition-colors duration-300 ease-in-out">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={font.is_editors_pick || false}
                                                                    onChange={() => handleToggleCuration(font.id, 'is_editors_pick')}
                                                                    className="w-4 h-4 accent-success rounded border-2 border-border cursor-pointer"
                                                                />
                                                                <span className={`text-sm font-bold ${font.is_editors_pick ? 'text-foreground' : 'text-muted'}`}>Editor's Pick</span>
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <Link
                                                            to={`/fonts/${font.slug || font.id}`}
                                                            className="inline-block px-4 py-2 bg-card-background border-2 border-border rounded-lg font-bold hover:bg-foreground/5 text-sm text-foreground"
                                                        >
                                                            View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'analytics' && (
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-3 mb-8">
                                    Analytics (Last 30 Days)
                                </h2>

                                {analyticsLoading && !downloadStats.length ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-foreground/10 border-t-[var(--color-foreground)]"></div>
                                    </div>
                                ) : (
                                    <>
                                        <AnalyticsSection
                                            title="Downloads Overview"
                                            type="downloads"
                                            data={downloadStats}
                                            topFonts={topDownloadedFonts}
                                        />
                                        <AnalyticsSection
                                            title="Favorites Overview"
                                            type="favorites"
                                            data={favoritesStats}
                                            topFonts={topFavoritedFonts}
                                            accentColor
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'research' && (
                            <div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-bold flex items-center gap-3">
                                            AI Font Research
                                        </h2>
                                        <span className="text-xs font-mono text-muted uppercase tracking-wider bg-foreground/5 px-2.5 py-1 rounded-full border border-foreground/8">
                                            Manual · 1 at a time
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {activeResearchingFontId ? (
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/25 text-xs font-bold text-foreground">
                                                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                                                <span>Research in progress (1 at a time)...</span>
                                            </div>
                                        ) : researchStats.activeJobs > 0 ? (
                                            <button
                                                onClick={handleClearStuckJobs}
                                                className="px-4 py-2 text-xs font-bold rounded-full bg-warning/10 hover:bg-warning/20 text-warning border border-warning/30 transition-colors duration-300 ease-in-out cursor-pointer flex items-center gap-1.5"
                                            >
                                                <XCircle size={14} /> Clear Stuck Jobs ({researchStats.activeJobs})
                                            </button>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                                    {[
                                        { label: 'Total', value: researchStats.total, color: 'var(--color-foreground)' },
                                        { label: 'Unresearched', value: researchStats.unresearched, color: 'var(--color-muted-foreground)' },
                                        { label: 'Verified', value: researchStats.verified, color: 'var(--color-highlight)' },
                                        { label: 'Review', value: researchStats.needsReview, color: 'var(--color-warning)' },
                                        { label: 'Failed', value: researchStats.failed, color: 'var(--color-destructive)' },
                                    ].map(s => (
                                        <div key={s.label} className="p-3 rounded-2xl bg-foreground/3 border border-foreground/5 text-center">
                                            <p className="text-2xl font-black" style={{ color: `rgb(${s.color})` }}>{s.value}</p>
                                            <p className="text-xs text-muted font-mono uppercase">{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Active Jobs Indicator */}
                                {researchStats.activeJobs > 0 && (
                                    <div className="mb-4 p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                                            <span className="text-xs font-bold text-foreground">
                                                {researchStats.activeJobs} job{researchStats.activeJobs !== 1 ? 's' : ''} active in background
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleClearStuckJobs}
                                            className="px-3 py-1 text-xs font-bold rounded-lg bg-foreground/8 hover:bg-foreground/15 text-foreground transition-colors duration-300 ease-in-out cursor-pointer"
                                        >
                                            Clear Stuck Jobs
                                        </button>
                                    </div>
                                )}

                                {/* Filters + Search */}
                                <div className="flex flex-col md:flex-row gap-3 mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search fonts..."
                                            value={searchResearch}
                                            onChange={(e) => setSearchResearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-background border-2 border-foreground/10 rounded-full text-sm focus:outline-none focus:border-foreground/15"
                                        />
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {(['all', 'unresearched', 'verified', 'needs_review', 'failed'] as const).map(filter => (
                                            <button
                                                key={filter}
                                                onClick={() => setResearchFilter(filter)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${researchFilter === filter
                                                        ? 'bg-foreground text-background border-foreground/15'
                                                        : 'bg-transparent text-foreground border-foreground/20 hover:border-foreground/50'
                                                    }`}
                                            >
                                                {filter === 'needs_review' ? 'Needs Review' : filter === 'unresearched' ? 'Unresearched' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Font List */}
                                {filteredResearchFonts.length === 0 ? (
                                    <div className="text-center py-12 text-muted font-bold border-2 border-dashed border-foreground/10 rounded-2xl">
                                        No fonts match your filter
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredResearchFonts.map(font => (
                                            <div key={font.id} className="border border-foreground/8 rounded-2xl overflow-hidden">
                                                {/* Row */}
                                                <div
                                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-foreground/2 transition-colors duration-300 ease-in-out"
                                                    onClick={() => setExpandedResearchId(expandedResearchId === font.id ? null : font.id)}
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm text-foreground truncate">{font.name}</p>
                                                            <p className="text-xs text-muted">{font.designer}</p>
                                                        </div>
                                                    </div>
                                                    <FontResearchPanel
                                                        fontId={font.id}
                                                        fontName={font.name}
                                                        research={font.research || null}
                                                        sources={font.sources || []}
                                                        compact
                                                        isAnyResearching={!!activeResearchingFontId}
                                                        activeResearchingFontId={activeResearchingFontId}
                                                        onResearchStart={(id) => setActiveResearchingFontId(id)}
                                                        onResearchEnd={() => setActiveResearchingFontId(null)}
                                                        onResearchComplete={fetchResearchData}
                                                    />
                                                </div>

                                                {/* Expanded Panel */}
                                                {expandedResearchId === font.id && (
                                                    <div className="border-t border-foreground/5 p-4">
                                                        <FontResearchPanel
                                                            fontId={font.id}
                                                            fontName={font.name}
                                                            research={font.research || null}
                                                            sources={font.sources || []}
                                                            isAnyResearching={!!activeResearchingFontId}
                                                            activeResearchingFontId={activeResearchingFontId}
                                                            onResearchStart={(id) => setActiveResearchingFontId(id)}
                                                            onResearchEnd={() => setActiveResearchingFontId(null)}
                                                            onResearchComplete={fetchResearchData}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'github' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">GitHub Font Discovery</h2>
                                <GitHubDiscoveryTab />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
