import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Search, Users, FileText, Star, TrendingUp, Shield, Check } from 'lucide-react';
import type { Database } from '../types/database.types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import SEO from '../components/shared/SEO';

type Profile = Database['public']['Tables']['profiles']['Row'];
type FontRow = Database['public']['Tables']['fonts']['Row'];

export default function AdminDashboard() {
    const { user, profile, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'files' | 'curation' | 'analytics'>('requests');

    // State for Requests
    const [pendingRequests, setPendingRequests] = useState<Profile[]>([]);

    // State for User Management
    const [allUsers, setAllUsers] = useState<Profile[]>([]);

    // State for Files/Storage
    const [allFonts, setAllFonts] = useState<FontRow[]>([]);

    // State for Analytics
    const [downloadStats, setDownloadStats] = useState<{ date: string, count: number }[]>([]);

    // Search States
    const [searchUsers, setSearchUsers] = useState('');
    const [searchFiles, setSearchFiles] = useState('');
    const [searchCuration, setSearchCuration] = useState('');

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.role !== 'admin') return;

        if (activeTab === 'requests') {
            fetchRequests();
        } else if (activeTab === 'users') {
            fetchAllUsers();
        } else if (activeTab === 'files' || activeTab === 'curation') {
            fetchFonts();
        } else if (activeTab === 'analytics') {
            fetchAnalytics();
        }
    }, [activeTab, profile]);

    const fetchRequests = async () => {
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
    };

    const fetchAllUsers = async () => {
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
    };

    const fetchFonts = async () => {
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
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

        // Fetch downloads
        const { data: downloads, error: downloadsError } = await supabase
            .from('downloads')
            .select('font_id, downloaded_at')
            .gte('downloaded_at', thirtyDaysAgoIso);

        if (downloadsError) console.error('Error fetching downloads analytics:', downloadsError);

        // --- Process Downloads ---
        if (downloads) {
            const dateMap = new Map<string, number>();
            // Initialize last 30 days with 0
            for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                dateMap.set(dateStr, 0);
            }

            downloads.forEach(d => {
                if (!d.downloaded_at) return;
                const dateStr = d.downloaded_at.split('T')[0];
                dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
            });

            const chartData = Array.from(dateMap.entries())
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));

            setDownloadStats(chartData);
        }

        setLoading(false);
    };

    const handleRequestAction = async (userId: string, action: 'approve' | 'reject') => {
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
            alert(`Failed to ${action} user.`);
        }
    };

    const handleRoleChange = async (userId: string, newRole: 'user' | 'member' | 'admin') => {
        const targetUser = allUsers.find(u => u.id === userId);

        // Security Check: Demoting an Admin
        if (targetUser?.role === 'admin' && newRole !== 'admin') {
            const code = window.prompt("⚠️ SECURITY CHECK: Enter the Admin Secret Code to remove this admin:");
            if (code !== "admin123") {
                alert("❌ Invalid Secret Code. Action cancelled.");
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
            alert('User role updated successfully.');

        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role.');
        }
    };

    const handleToggleCuration = async (fontId: string, field: 'is_featured' | 'is_trending' | 'is_editors_pick') => {
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
            alert('Failed to update status.');
        }
    };

    const formatBytes = (bytes: number | null) => {
        if (!bytes) return 'Unknown';
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Calculate Storage Stats
    const totalStorageSize = allFonts.reduce((acc, font: any) => {
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
    }, 0);
    const totalFonts = allFonts.length;
    // Format Counts
    const formatCounts = {
        woff2: allFonts.filter(f => f.woff2_url).length,
        woff: allFonts.filter(f => f.woff_url).length,
        ttf: allFonts.filter(f => f.ttf_url).length,
        otf: allFonts.filter(f => f.otf_url).length,
    };


    if (authLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    if (!user || profile?.role !== 'admin') return <Navigate to="/" replace />; // TODO: Create a proper 403 page

    const tabItems = [
        { id: 'requests', label: 'Requests', icon: Users, color: 'text-white' },
        { id: 'users', label: 'Users', icon: Shield, color: 'text-[#BDF522]' },
        { id: 'files', label: 'Files', icon: FileText, color: 'text-[#00C2FF]' },
        { id: 'curation', label: 'Curation', icon: Star, color: 'text-[#FF90E8]' },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'text-[#FFDE59]' }
    ];

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            <SEO title="Admin Dashboard" />

            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-black uppercase mb-2">Admin Dashboard</h1>
                    <p className="text-zinc-500">Manage users, contents, and system health.</p>
                </header>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 bg-zinc-900/50 p-2 rounded-2xl border border-white/10 w-fit">
                    {tabItems.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all",
                                activeTab === tab.id
                                    ? "bg-white text-black shadow-lg scale-100"
                                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon size={16} className={activeTab === tab.id ? "text-black" : tab.color} />
                            {tab.label}
                            {tab.id === 'requests' && pendingRequests.length > 0 && (
                                <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 min-h-[60vh]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full min-h-100">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'requests' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Users className="text-zinc-500" />
                                        Pending Member Requests
                                    </h2>
                                    {pendingRequests.length === 0 ? (
                                        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-black/20">
                                            <p className="text-zinc-500 font-bold">No pending requests</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {pendingRequests.map(request => (
                                                <div key={request.id} className="flex flex-col md:flex-row items-center justify-between p-6 bg-black/30 border border-white/10 rounded-2xl gap-6 hover:border-white/20 transition-colors">
                                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                                        <div className="w-12 h-12 bg-zinc-800 rounded-full overflow-hidden shrink-0 border border-white/10">
                                                            {request.avatar_url ? (
                                                                <img src={request.avatar_url} alt={request.full_name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center font-bold text-zinc-500">
                                                                    {request.full_name.charAt(0)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg text-white">{request.full_name}</h3>
                                                            <p className="text-sm text-zinc-500">{request.email}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 w-full md:w-auto">
                                                        <button
                                                            onClick={() => handleRequestAction(request.id, 'reject')}
                                                            className="flex-1 md:flex-none px-6 py-2 bg-red-500/10 text-red-500 font-bold rounded-xl border border-red-500/30 hover:bg-red-500/20 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            onClick={() => handleRequestAction(request.id, 'approve')}
                                                            className="flex-1 md:flex-none px-6 py-2 bg-[#BDF522] text-black font-bold rounded-xl hover:bg-[#a9db1e] transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <Shield className="text-zinc-500" />
                                            User Management
                                        </h2>
                                        <div className="relative w-full md:w-72">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search users..."
                                                value={searchUsers}
                                                onChange={(e) => setSearchUsers(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-white/30 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 text-xs uppercase text-zinc-500">
                                                <tr>
                                                    <th className="px-6 py-4 font-bold">User</th>
                                                    <th className="px-6 py-4 font-bold">Role</th>
                                                    <th className="px-6 py-4 font-bold">Joined</th>
                                                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-sm">
                                                {allUsers.filter(u =>
                                                    u.full_name.toLowerCase().includes(searchUsers.toLowerCase()) ||
                                                    u.email.toLowerCase().includes(searchUsers.toLowerCase())
                                                ).map(u => (
                                                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                                                                    {u.avatar_url && <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-white">{u.full_name}</div>
                                                                    <div className="text-xs text-zinc-500">{u.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={cn(
                                                                "px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider",
                                                                u.role === 'admin' ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
                                                                    u.role === 'member' ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                                                                        "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                                            )}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-zinc-500 font-mono text-xs">
                                                            {new Date(u.created_at || '').toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <select
                                                                value={u.role}
                                                                onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                                                                className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-white/30"
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
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-black/30 p-6 rounded-2xl border border-white/10">
                                            <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Total Fonts</p>
                                            <p className="text-3xl font-black text-white">{totalFonts}</p>
                                        </div>
                                        <div className="bg-black/30 p-6 rounded-2xl border border-white/10">
                                            <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Font Storage</p>
                                            <p className="text-3xl font-black text-[#00C2FF]">{formatBytes(totalStorageSize)}</p>
                                        </div>
                                        <div className="bg-black/30 p-6 rounded-2xl border border-white/10">
                                            <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Images Storage</p>
                                            <p className="text-3xl font-black text-[#FF90E8]">{formatBytes(allFonts.reduce((acc, font) => {
                                                const previewSize = font.file_size_image_preview || 0;
                                                const gallerySize = (font.gallery_image_sizes || []).reduce((a, b) => a + b, 0);
                                                return acc + previewSize + gallerySize;
                                            }, 0))}</p>
                                        </div>
                                        <div className="bg-black/30 p-6 rounded-2xl border border-white/10">
                                            <p className="text-xs text-zinc-500 font-bold uppercase mb-1">Format Distribution</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="text-xs bg-white/5 px-2 py-1 rounded text-zinc-300">W2: {formatCounts.woff2}</span>
                                                <span className="text-xs bg-white/5 px-2 py-1 rounded text-zinc-300">W: {formatCounts.woff}</span>
                                                <span className="text-xs bg-white/5 px-2 py-1 rounded text-zinc-300">T: {formatCounts.ttf}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search files..."
                                            value={searchFiles}
                                            onChange={(e) => setSearchFiles(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors mb-4"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        {allFonts.filter(f => f.name.toLowerCase().includes(searchFiles.toLowerCase())).map(font => (
                                            <div key={font.id} className="group bg-black/30 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                                                            {font.preview_image_url ? (
                                                                <img src={font.preview_image_url} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">Aa</div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white leading-tight">{font.name}</h4>
                                                            <div className="flex gap-2 mt-1">
                                                                {font.woff2_url && <span className="text-[10px] bg-green-500/10 text-green-500 px-1 rounded border border-green-500/20">WOFF2</span>}
                                                                {font.ttf_url && <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1 rounded border border-blue-500/20">TTF</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-mono text-zinc-500">{formatBytes(font.file_size_woff2 || font.file_size_ttf || 0)}</p>
                                                        <p className="text-[10px] text-zinc-700 mt-1">{new Date(font.created_at || '').toLocaleDateString()}</p>
                                                    </div>
                                                </div>

                                                {/* Variants */}
                                                {(font as any).font_variants?.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-white/5 pl-14">
                                                        <p className="text-[10px] text-zinc-600 font-bold uppercase mb-2">Variants</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {(font as any).font_variants.map((v: any) => (
                                                                <div key={v.id} className="flex justify-between items-center text-xs bg-white/5 p-2 rounded">
                                                                    <span className="text-zinc-400">{v.variant_name}</span>
                                                                    <span className="font-mono text-zinc-600">{formatBytes(v.file_size_woff2 || 0)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'curation' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <Star className="text-zinc-500" />
                                            Curation & Featuring
                                        </h2>
                                        <div className="relative w-full md:w-72">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search fonts..."
                                                value={searchCuration}
                                                onChange={(e) => setSearchCuration(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-white/30 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 text-xs uppercase text-zinc-500">
                                                <tr>
                                                    <th className="px-6 py-4 font-bold">Font</th>
                                                    <th className="px-6 py-4 font-bold text-center">Featured</th>
                                                    <th className="px-6 py-4 font-bold text-center">Trending</th>
                                                    <th className="px-6 py-4 font-bold text-center">Editor's Pick</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-sm">
                                                {allFonts.filter(f =>
                                                    f.name.toLowerCase().includes(searchCuration.toLowerCase())
                                                ).map(font => (
                                                    <tr key={font.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                                                                    {font.preview_image_url && <img src={font.preview_image_url} className="w-full h-full object-cover" />}
                                                                </div>
                                                                <div className="font-bold text-white">{font.name}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={() => handleToggleCuration(font.id, 'is_featured')}
                                                                className={cn("w-5 h-5 rounded border flex items-center justify-center mx-auto transition-all",
                                                                    font.is_featured ? "bg-[#BDF522] border-[#BDF522] text-black" : "border-zinc-700 bg-transparent text-transparent hover:border-zinc-500"
                                                                )}>
                                                                <Check size={12} strokeWidth={4} />
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={() => handleToggleCuration(font.id, 'is_trending')}
                                                                className={cn("w-5 h-5 rounded border flex items-center justify-center mx-auto transition-all",
                                                                    font.is_trending ? "bg-[#FF90E8] border-[#FF90E8] text-black" : "border-zinc-700 bg-transparent text-transparent hover:border-zinc-500"
                                                                )}>
                                                                <TrendingUp size={12} strokeWidth={4} />
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={() => handleToggleCuration(font.id, 'is_editors_pick')}
                                                                className={cn("w-5 h-5 rounded border flex items-center justify-center mx-auto transition-all",
                                                                    font.is_editors_pick ? "bg-[#00C2FF] border-[#00C2FF] text-black" : "border-zinc-700 bg-transparent text-transparent hover:border-zinc-500"
                                                                )}>
                                                                <Star size={12} strokeWidth={4} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'analytics' && (
                                <div className="space-y-8">
                                    <div className="h-75 w-full bg-black/30 border border-white/10 rounded-3xl p-6">
                                        <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4">Downloads (30 Days)</h3>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={downloadStats}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                                <XAxis
                                                    dataKey="date"
                                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                                                    stroke="#666"
                                                    fontSize={10}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Line type="monotone" dataKey="count" stroke="#BDF522" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#BDF522' }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
