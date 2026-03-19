import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Toast } from '@capacitor/toast';
import { motion } from 'framer-motion';
import type { Database } from '../types/database.types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    const [topDownloadedFonts, setTopDownloadedFonts] = useState<{ name: string, count: number }[]>([]);

    // State for Favorites Analytics
    const [favoritesStats, setFavoritesStats] = useState<{ date: string, count: number }[]>([]);
    const [topFavoritedFonts, setTopFavoritedFonts] = useState<{ name: string, count: number }[]>([]);

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

        // Fetch favorites
        const { data: favorites, error: favoritesError } = await supabase
            .from('favorites')
            .select('font_id, created_at')
            .gte('created_at', thirtyDaysAgoIso);

        if (downloadsError) console.error('Error fetching downloads analytics:', downloadsError);
        if (favoritesError) console.error('Error fetching favorites analytics:', favoritesError);

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

            // Top Downloaded Fonts
            const fontCounts = new Map<string, number>();
            downloads.forEach(d => {
                fontCounts.set(d.font_id, (fontCounts.get(d.font_id) || 0) + 1);
            });

            const topIds = Array.from(fontCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            if (topIds.length > 0) {
                // We will fetch names later in a batch if needed, or individually here
                // Note: To optimize, we could combine IDs from downloads and favorites
                const { data: fontNames } = await supabase
                    .from('fonts')
                    .select('id, name')
                    .in('id', topIds.map(t => t[0]));

                if (fontNames) {
                    const topFontsData = topIds.map(([id, count]) => {
                        const font = fontNames.find(f => f.id === id);
                        return { name: font?.name || 'Unknown Font', count };
                    });
                    setTopDownloadedFonts(topFontsData);
                }
            } else {
                setTopDownloadedFonts([]);
            }
        }

        // --- Process Favorites ---
        if (favorites) {
            const dateMap = new Map<string, number>();
            // Initialize last 30 days with 0
            for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                dateMap.set(dateStr, 0);
            }

            favorites.forEach(f => {
                if (!f.created_at) return;
                const dateStr = f.created_at.split('T')[0];
                dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
            });

            const chartData = Array.from(dateMap.entries())
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));

            setFavoritesStats(chartData);

            // Top Favorited Fonts
            const fontCounts = new Map<string, number>();
            favorites.forEach(f => {
                fontCounts.set(f.font_id, (fontCounts.get(f.font_id) || 0) + 1);
            });

            const topIds = Array.from(fontCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            if (topIds.length > 0) {
                const { data: fontNames } = await supabase
                    .from('fonts')
                    .select('id, name')
                    .in('id', topIds.map(t => t[0]));

                if (fontNames) {
                    const topFontsData = topIds.map(([id, count]) => {
                        const font = fontNames.find(f => f.id === id);
                        return { name: font?.name || 'Unknown Font', count };
                    });
                    setTopFavoritedFonts(topFontsData);
                }
            } else {
                setTopFavoritedFonts([]);
            }
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
            await Toast.show({ text: `Failed to ${action} user.`, duration: 'short' });
        }
    };

    const handleRoleChange = async (userId: string, newRole: 'user' | 'member' | 'admin') => {
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
            await Toast.show({ text: 'Failed to update status.', duration: 'short' });
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


    if (authLoading) return <div>Loading...</div>;
    if (!user || profile?.role !== 'admin') return <Navigate to="/" replace />;

    return (
        <div className="mx-auto bg-transparent rounded-4xl">
            <div className="bg-[rgb(var(--color-foreground))] rounded-4xl p-8 border-y border-[rgb(var(--color-border))]">
                <h1 className="text-4xl text-center md:text-left font-black uppercase text-[rgb(var(--color-background))]">Admin Dashboard</h1>
            </div>

            {/* Tabs */}
            <div className='bg-[rgb(var(--color-card))] rounded-4xl p-2 border-y border-[rgb(var(--color-border))] my-4 shadow-sm'>
                <div className="flex flex-wrap gap-4 px-1 py-4 justify-center md:justify-start">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                            await Haptics.impact({ style: ImpactStyle.Light });
                            setActiveTab('requests');
                        }}
                        className={`px-6 py-2 rounded-full font-bold border-2 border-[rgb(var(--color-foreground))] transition-all ${activeTab === 'requests' ? 'bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))] shadow-[4px_4px_0px_0px_rgba(var(--color-foreground),1)]' : 'bg-[rgb(var(--color-card))] text-[rgb(var(--color-foreground))] hover:border-[rgb(var(--color-highlight))]'
                            }`}
                    >
                        Requests
                        {pendingRequests.length > 0 && (
                            <span className="ml-2 bg-[rgb(var(--color-destructive))] text-[rgb(var(--color-background))] text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                        )}
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                            await Haptics.impact({ style: ImpactStyle.Light });
                            setActiveTab('users');
                        }}
                        className={`px-6 py-2 rounded-full font-bold border-2 border-[rgb(var(--color-foreground))] transition-all ${activeTab === 'users' ? 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-background))] shadow-[4px_4px_0px_0px_rgba(var(--color-foreground),1)]' : 'bg-[rgb(var(--color-card))] text-[rgb(var(--color-foreground))] hover:border-[rgb(var(--color-accent))]'
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
                        className={`px-6 py-2 rounded-full font-bold border-2 border-[rgb(var(--color-foreground))] transition-all ${activeTab === 'files' ? 'bg-[rgb(var(--color-success,var(--color-highlight)))] text-[rgb(var(--color-background))] shadow-[4px_4px_0px_0px_rgba(var(--color-foreground),1)]' : 'bg-[rgb(var(--color-card))] text-[rgb(var(--color-foreground))] hover:border-[rgb(var(--color-success,var(--color-highlight)))]'
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
                        className={`px-6 py-2 rounded-full font-bold border-2 border-[rgb(var(--color-foreground))] transition-all ${activeTab === 'curation' ? 'bg-[rgb(var(--color-warning))] text-[rgb(var(--color-background))] shadow-[4px_4px_0px_0px_rgba(var(--color-foreground),1)]' : 'bg-[rgb(var(--color-card))] text-[rgb(var(--color-foreground))] hover:border-[rgb(var(--color-warning))]'
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
                        className={`px-6 py-2 rounded-full font-bold border-2 border-[rgb(var(--color-foreground))] transition-all ${activeTab === 'analytics' ? 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-background))] shadow-[4px_4px_0px_0px_rgba(var(--color-foreground),1)]' : 'bg-[rgb(var(--color-card))] text-[rgb(var(--color-foreground))] hover:border-[rgb(var(--color-accent))]'
                            }`}
                    >
                        Analytics
                    </motion.button>
                </div>
            </div>

            <div className="bg-[rgb(var(--color-card))] border-2 border-[rgb(var(--color-foreground))] rounded-4xl px-4 md:px-8 pt-8 md:pt-8 pb-4 md:pb-8 min-h-[50vh]">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[rgb(var(--color-foreground))]"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'requests' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                    Pending Member Requests
                                </h2>
                                {pendingRequests.length === 0 ? (
                                    <div className="text-center py-12 text-[rgb(var(--color-muted-foreground))] font-bold border-2 border-dashed border-[rgb(var(--color-foreground)/0.1)] rounded-2xl">
                                        No pending requests
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingRequests.map(request => (
                                            <div key={request.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-[rgb(var(--color-foreground)/0.03)] border-2 border-[rgb(var(--color-border))] rounded-2xl gap-4">
                                                <div className="flex items-center gap-4 w-full md:w-auto">
                                                    <div className="w-12 h-12 bg-[rgb(var(--color-foreground)/0.1)] rounded-full border-2 border-[rgb(var(--color-border))] overflow-hidden shrink-0">
                                                        {request.avatar_url ? (
                                                            <img src={request.avatar_url} alt={request.full_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center font-black text-lg text-[rgb(var(--color-muted-foreground))]">
                                                                {request.full_name?.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg leading-tight text-[rgb(var(--color-foreground))]">{request.full_name}</h3>
                                                        <p className="text-sm text-[rgb(var(--color-muted-foreground))]">{request.email}</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 w-full md:w-auto">
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={async () => {
                                                            await Haptics.impact({ style: ImpactStyle.Medium });
                                                            handleRequestAction(request.id, 'reject');
                                                        }}
                                                        className="flex-1 md:flex-none px-6 py-2 bg-transparent text-[rgb(var(--color-destructive))] font-bold uppercase rounded-xl border-2 border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-destructive))] hover:bg-[rgb(var(--color-destructive)/0.1)] transition-colors"
                                                    >
                                                        Reject
                                                    </motion.button>
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={async () => {
                                                            await Haptics.impact({ style: ImpactStyle.Medium });
                                                            handleRequestAction(request.id, 'approve');
                                                        }}
                                                        className="flex-1 md:flex-none px-6 py-2 bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))] font-bold uppercase rounded-xl border-2 border-[rgb(var(--color-border))] hover:opacity-80 transition-colors"
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
                                            className="w-full pl-10 pr-4 py-2 border-2 border-[rgb(var(--color-border))] rounded-full focus:outline-none focus:bg-[rgb(var(--color-foreground)/0.03)] transition-all font-bold text-sm bg-transparent text-[rgb(var(--color-foreground))]"
                                        />
                                        <Search className="absolute left-3 top-2.5 text-[rgb(var(--color-muted-foreground))]" size={18} />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-[rgb(var(--color-border))] text-sm uppercase text-[rgb(var(--color-muted-foreground))]">
                                                <th className="py-4 px-4">User</th>
                                                <th className="py-4 px-4">Role</th>
                                                <th className="py-4 px-4">Joined</th>
                                                <th className="py-4 px-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[rgb(var(--color-border)/0.5)]">
                                            {allUsers.filter(u =>
                                                u.full_name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
                                                u.email?.toLowerCase().includes(searchUsers.toLowerCase())
                                            ).map(u => (
                                                <tr key={u.id} className="hover:bg-[rgb(var(--color-foreground)/0.03)] transition-colors">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-[rgb(var(--color-foreground)/0.1)] rounded-full border border-[rgb(var(--color-border))] overflow-hidden shrink-0">
                                                                {u.avatar_url ? (
                                                                    <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center font-black text-sm text-[rgb(var(--color-muted-foreground))]">
                                                                        {u.full_name?.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-[rgb(var(--color-foreground))]">{u.full_name}</div>
                                                                <div className="text-sm text-[rgb(var(--color-muted-foreground))]">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`
                                                            inline-block px-3 py-1 rounded-full text-xs font-bold uppercase border border-[rgb(var(--color-border))]
                                                            ${u.role === 'admin' ? 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-background))]' :
                                                                u.role === 'member' ? 'bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))]' :
                                                                    'bg-[rgb(var(--color-card))] text-[rgb(var(--color-muted-foreground))]'}
                                                        `}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-[rgb(var(--color-muted-foreground))] font-mono">
                                                        {new Date(u.created_at || '').toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <select
                                                            value={u.role}
                                                            onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                                                            className="border-2 border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] text-[rgb(var(--color-foreground))] rounded-lg px-2 py-1 text-sm font-bold focus:border-[rgb(var(--color-highlight))] focus:ring-0 cursor-pointer"
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
                                            className="w-full pl-10 pr-4 py-2 border-2 border-[rgb(var(--color-border))] rounded-full focus:outline-none focus:bg-[rgb(var(--color-foreground)/0.03)] transition-all font-bold text-sm bg-transparent text-[rgb(var(--color-foreground))]"
                                        />
                                        <Search className="absolute left-3 top-2.5 text-[rgb(var(--color-muted-foreground))]" size={18} />
                                    </div>
                                </div>

                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <div className="bg-[rgb(var(--color-foreground)/0.03)] rounded-2xl p-6 border-2 border-[rgb(var(--color-border))]">
                                        <h3 className="font-bold text-[rgb(var(--color-muted-foreground))] uppercase text-sm mb-2">Total Fonts</h3>
                                        <p className="text-4xl font-black text-[rgb(var(--color-foreground))]">{totalFonts}</p>
                                    </div>
                                    <div className="bg-[rgb(var(--color-foreground)/0.03)] rounded-2xl p-6 border-2 border-[rgb(var(--color-border))]">
                                        <h3 className="font-bold text-[rgb(var(--color-muted-foreground))] uppercase text-sm mb-2">Fonts Storage</h3>
                                        <p className="text-4xl font-black text-[rgb(var(--color-foreground))]">{formatBytes(totalStorageSize)}</p>
                                    </div>
                                    <div className="bg-[rgb(var(--color-foreground)/0.03)] rounded-2xl p-6 border-2 border-[rgb(var(--color-border))]">
                                        <h3 className="font-bold text-[rgb(var(--color-muted-foreground))] uppercase text-sm mb-2">Images Storage</h3>
                                        <p className="text-4xl font-black text-[rgb(var(--color-foreground))]">{formatBytes(allFonts.reduce((acc, font) => {
                                            const previewSize = font.file_size_image_preview || 0;
                                            const gallerySize = (font.gallery_image_sizes || []).reduce((a, b) => a + b, 0);
                                            return acc + previewSize + gallerySize;
                                        }, 0))}</p>
                                    </div>
                                    <div className="bg-[rgb(var(--color-foreground)/0.03)] rounded-2xl p-6 border-2 border-[rgb(var(--color-border))]">
                                        <h3 className="font-bold text-[rgb(var(--color-muted-foreground))] uppercase text-sm mb-2">Files Count</h3>
                                        <div className="flex flex-wrap gap-2 text-sm font-bold">
                                            <span className="px-2 py-1 bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded text-[rgb(var(--color-foreground))]">WOFF2: {formatCounts.woff2}</span>
                                            <span className="px-2 py-1 bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded text-[rgb(var(--color-foreground))]">WOFF: {formatCounts.woff}</span>
                                            <span className="px-2 py-1 bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded text-[rgb(var(--color-foreground))]">TTF: {formatCounts.ttf}</span>
                                            <span className="px-2 py-1 bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded text-[rgb(var(--color-foreground))]">OTF: {formatCounts.otf}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-[rgb(var(--color-border))] text-sm uppercase text-[rgb(var(--color-muted-foreground))]">
                                                <th className="py-4 px-4 rounded-tl-xl hover:bg-[rgb(var(--color-foreground)/0.03)]">Font</th>
                                                <th className="py-4 px-4 hover:bg-[rgb(var(--color-foreground)/0.03)]">Formats</th>
                                                <th className="py-4 px-4 hover:bg-[rgb(var(--color-foreground)/0.03)]">File Sizes</th>
                                                <th className="py-4 px-4 hover:bg-[rgb(var(--color-foreground)/0.03)]">Uploaded</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[rgb(var(--color-border)/0.5)]">
                                            {allFonts.filter(f =>
                                                f.name?.toLowerCase().includes(searchFiles.toLowerCase())
                                            ).map(font => (
                                                <tr key={font.id} className="hover:bg-[rgb(var(--color-foreground)/0.03)] transition-colors">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-[rgb(var(--color-foreground)/0.05)] rounded-lg border border-[rgb(var(--color-border))] overflow-hidden shrink-0">
                                                                {font.preview_image_url ? (
                                                                    <img src={font.preview_image_url} alt={font.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[rgb(var(--color-muted-foreground))]">Aa</div>
                                                                )}
                                                            </div>
                                                            <Link to={`/fonts/${font.slug || font.id}`} className="font-bold text-[rgb(var(--color-foreground))] hover:underline">
                                                                {font.name}
                                                            </Link>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {font.woff2_url && <span className="px-1.5 py-0.5 bg-[rgb(var(--color-success)/0.1)] text-[rgb(var(--color-success))] text-[10px] font-bold uppercase rounded border border-[rgb(var(--color-success)/0.2)]">WOFF2</span>}
                                                            {font.woff_url && <span className="px-1.5 py-0.5 bg-[rgb(var(--color-accent)/0.1)] text-[rgb(var(--color-accent))] text-[10px] font-bold uppercase rounded border border-[rgb(var(--color-accent)/0.2)]">WOFF</span>}
                                                            {font.ttf_url && <span className="px-1.5 py-0.5 bg-[rgb(var(--color-highlight)/0.1)] text-[rgb(var(--color-highlight))] text-[10px] font-bold uppercase rounded border border-[rgb(var(--color-highlight)/0.2)]">TTF</span>}
                                                            {font.otf_url && <span className="px-1.5 py-0.5 bg-[rgb(var(--color-warning)/0.1)] text-[rgb(var(--color-warning))] text-[10px] font-bold uppercase rounded border border-[rgb(var(--color-warning)/0.2)]">OTF</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-xs font-mono space-y-1">
                                                        {font.file_size_woff2 && <div className="text-[rgb(var(--color-success))]">WOFF2: {formatBytes(font.file_size_woff2)}</div>}
                                                        {font.file_size_woff && <div className="text-[rgb(var(--color-accent))]">WOFF: {formatBytes(font.file_size_woff)}</div>}
                                                        {font.file_size_ttf && <div className="text-[rgb(var(--color-highlight))]">TTF: {formatBytes(font.file_size_ttf)}</div>}
                                                        {font.file_size_otf && <div className="text-[rgb(var(--color-warning))]">OTF: {formatBytes(font.file_size_otf)}</div>}

                                                        {(font as any).font_variants?.length > 0 && (
                                                            <div className="mt-2 pt-1 border-t border-[rgb(var(--color-border)/0.2)]">
                                                                <div className="text-[10px] text-[rgb(var(--color-muted-foreground))] italic mb-1">
                                                                    + {(font as any).font_variants.length} Variants
                                                                </div>
                                                                <div className="space-y-1 pl-1 border-l-2 border-[rgb(var(--color-border)/0.3)]">
                                                                    {(font as any).font_variants.map((v: any, idx: number) => (
                                                                        <div key={idx} className="bg-[rgb(var(--color-foreground)/0.02)] p-1 rounded">
                                                                            <div className="font-bold text-[10px] text-[rgb(var(--color-foreground))] uppercase mb-0.5">{v.variant_name}</div>
                                                                            {v.file_size_woff2 && <div className="text-[rgb(var(--color-success))] text-[9px] pl-1">WOFF2: {formatBytes(v.file_size_woff2)}</div>}
                                                                            {v.file_size_woff && <div className="text-[rgb(var(--color-accent))] text-[9px] pl-1">WOFF: {formatBytes(v.file_size_woff)}</div>}
                                                                            {v.file_size_ttf && <div className="text-[rgb(var(--color-highlight))] text-[9px] pl-1">TTF: {formatBytes(v.file_size_ttf)}</div>}
                                                                            {v.file_size_otf && <div className="text-[rgb(var(--color-warning))] text-[9px] pl-1">OTF: {formatBytes(v.file_size_otf)}</div>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!font.file_size_woff2 && !font.file_size_woff && !font.file_size_ttf && !font.file_size_otf && !(font as any).font_variants?.length && <span className="text-[rgb(var(--color-muted-foreground))]">-</span>}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-[rgb(var(--color-muted-foreground))] font-mono">
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
                                            className="w-full pl-10 pr-4 py-2 border-2 border-[rgb(var(--color-border))] rounded-full focus:outline-none focus:bg-[rgb(var(--color-foreground)/0.03)] transition-all font-bold text-sm bg-transparent text-[rgb(var(--color-foreground))]"
                                        />
                                        <Search className="absolute left-3 top-2.5 text-[rgb(var(--color-muted-foreground))]" size={18} />
                                    </div>
                                </div>
                                <div className="bg-[rgb(var(--color-card))] rounded-2xl border-2 border-[rgb(var(--color-border))] overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[rgb(var(--color-foreground)/0.03)] border-b-2 border-[rgb(var(--color-border))]">
                                            <tr>
                                                <th className="p-4 border-r-2 border-[rgb(var(--color-border))] w-2/3 text-[rgb(var(--color-foreground))]">Font</th>
                                                <th className="p-4 border-r-2 border-[rgb(var(--color-border))] text-center w-1/6 text-[rgb(var(--color-foreground))]">Statuses</th>
                                                <th className="p-4 text-center w-1/6 text-[rgb(var(--color-foreground))]">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y-2 divide-[rgb(var(--color-border)/0.1)]">
                                            {allFonts.filter(f =>
                                                f.name?.toLowerCase().includes(searchCuration.toLowerCase()) ||
                                                f.designer?.toLowerCase().includes(searchCuration.toLowerCase())
                                            ).map(font => (
                                                <tr key={font.id} className="hover:bg-[rgb(var(--color-foreground)/0.03)] transition-colors">
                                                    <td className="p-4 border-r-2 border-[rgb(var(--color-border)/0.5)]">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-[rgb(var(--color-foreground)/0.1)] border-2 border-[rgb(var(--color-border))] rounded-lg overflow-hidden shrink-0">
                                                                {font.preview_image_url ? (
                                                                    <img src={font.preview_image_url} alt={font.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center font-bold text-[rgb(var(--color-muted-foreground))]">Aa</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-lg text-[rgb(var(--color-foreground))]">{font.name}</div>
                                                                <div className="text-xs text-[rgb(var(--color-muted-foreground))]">by {font.designer}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 border-r-2 border-[rgb(var(--color-border)/0.5)]">
                                                        <div className="flex flex-col gap-2">
                                                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-[rgb(var(--color-foreground)/0.05)] transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={font.is_featured || false}
                                                                    onChange={() => handleToggleCuration(font.id, 'is_featured')}
                                                                    className="w-4 h-4 accent-[rgb(var(--color-highlight))] rounded border-2 border-[rgb(var(--color-border))] cursor-pointer"
                                                                />
                                                                <span className={`text-sm font-bold ${font.is_featured ? 'text-[rgb(var(--color-foreground))]' : 'text-[rgb(var(--color-muted-foreground))]'}`}>Featured</span>
                                                            </label>

                                                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-[rgb(var(--color-foreground)/0.05)] transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={font.is_trending || false}
                                                                    onChange={() => handleToggleCuration(font.id, 'is_trending')}
                                                                    className="w-4 h-4 accent-[rgb(var(--color-accent))] rounded border-2 border-[rgb(var(--color-border))] cursor-pointer"
                                                                />
                                                                <span className={`text-sm font-bold ${font.is_trending ? 'text-[rgb(var(--color-foreground))]' : 'text-[rgb(var(--color-muted-foreground))]'}`}>Trending</span>
                                                            </label>

                                                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-[rgb(var(--color-foreground)/0.05)] transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={font.is_editors_pick || false}
                                                                    onChange={() => handleToggleCuration(font.id, 'is_editors_pick')}
                                                                    className="w-4 h-4 accent-[rgb(var(--color-success,var(--color-highlight)))] rounded border-2 border-[rgb(var(--color-border))] cursor-pointer"
                                                                />
                                                                <span className={`text-sm font-bold ${font.is_editors_pick ? 'text-[rgb(var(--color-foreground))]' : 'text-[rgb(var(--color-muted-foreground))]'}`}>Editor's Pick</span>
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <Link
                                                            to={`/fonts/${font.slug || font.id}`}
                                                            className="inline-block px-4 py-2 bg-[rgb(var(--color-card))] border-2 border-[rgb(var(--color-border))] rounded-lg font-bold hover:bg-[rgb(var(--color-foreground)/0.05)] text-sm text-[rgb(var(--color-foreground))]"
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

                                {/* Downloads Section */}
                                <div className="mb-12">
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-[rgb(var(--color-foreground))]">
                                        <div className="w-3 h-8 bg-[rgb(var(--color-foreground))] rounded-full"></div>
                                        Downloads Overview
                                    </h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Chart */}
                                        <div className="flex flex-col justify-between bg-[rgb(var(--color-card))] p-6 rounded-4xl border-2 border-[rgb(var(--color-border))] shadow-[4px_4px_0px_0px_rgba(var(--color-border),1)]">
                                            <h3 className="font-bold text-lg mb-6 text-[rgb(var(--color-foreground))]">Downloads Trend</h3>
                                            <div className="h-64 w-full -translate-x-5 md:-translate-x-8">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={downloadStats}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis
                                                            dataKey="date"
                                                            tickFormatter={(str) => {
                                                                const date = new Date(str);
                                                                return `${date.getMonth() + 1}/${date.getDate()}`;
                                                            }}
                                                            tick={{ fontSize: 12, fill: 'rgb(var(--color-muted-foreground))' }}
                                                            interval={4}
                                                        />
                                                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'rgb(var(--color-muted-foreground))' }} />
                                                        <Tooltip
                                                            contentStyle={{ borderRadius: '12px', border: '2px solid rgb(var(--color-border))', fontWeight: 'bold', backgroundColor: 'rgb(var(--color-card))' }}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="count"
                                                            stroke="rgb(var(--color-foreground))"
                                                            strokeWidth={3}
                                                            dot={{ r: 4, fill: 'rgb(var(--color-foreground))' }}
                                                            activeDot={{ r: 6, fill: 'rgb(var(--color-accent))' }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Top Fonts */}
                                        <div className="bg-[rgb(var(--color-card))] p-6 rounded-4xl border-2 border-[rgb(var(--color-border))] shadow-[4px_4px_0px_0px_rgba(var(--color-border),1)]">
                                            <h3 className="font-bold text-lg mb-6 text-[rgb(var(--color-foreground))]">Top Downloaded Fonts</h3>
                                            <div className='overflow-y-auto h-65'>
                                                {topDownloadedFonts.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {topDownloadedFonts.map((font, idx) => (
                                                            <div key={idx} className="flex justify-between items-center p-3 bg-[rgb(var(--color-foreground)/0.03)] rounded-xl border border-[rgb(var(--color-border))]">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="w-6 h-6 flex items-center justify-center bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] rounded-full text-xs font-bold">
                                                                        {idx + 1}
                                                                    </span>
                                                                    <span className="font-bold text-[rgb(var(--color-foreground))]">{font.name}</span>
                                                                </div>
                                                                <span className="font-mono font-bold text-[rgb(var(--color-highlight))]">{font.count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-[rgb(var(--color-muted-foreground))] py-8">No data available</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Favorites Section */}
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-[rgb(var(--color-foreground))]">
                                        <div className="w-3 h-8 bg-[rgb(var(--color-accent))] rounded-full"></div>
                                        Favorites Overview
                                    </h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Chart */}
                                        <div className="flex flex-col justify-between bg-[rgb(var(--color-card))] p-6 rounded-4xl border-2 border-[rgb(var(--color-border))] shadow-[4px_4px_0px_0px_rgba(var(--color-border),1)]">
                                            <h3 className="font-bold text-lg mb-6 text-[rgb(var(--color-accent))]">Favorites Trend</h3>
                                            <div className="h-64 w-full -translate-x-5 md:-translate-x-8">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={favoritesStats}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis
                                                            dataKey="date"
                                                            tickFormatter={(str) => {
                                                                const date = new Date(str);
                                                                return `${date.getMonth() + 1}/${date.getDate()}`;
                                                            }}
                                                            tick={{ fontSize: 12, fill: 'rgb(var(--color-muted-foreground))' }}
                                                            interval={4}
                                                        />
                                                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'rgb(var(--color-muted-foreground))' }} />
                                                        <Tooltip
                                                            contentStyle={{ borderRadius: '12px', border: '2px solid rgb(var(--color-border))', fontWeight: 'bold', borderColor: 'rgb(var(--color-accent))', backgroundColor: 'rgb(var(--color-card))' }}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="count"
                                                            stroke="rgb(var(--color-accent))"
                                                            strokeWidth={3}
                                                            dot={{ r: 4, fill: 'rgb(var(--color-accent))' }}
                                                            activeDot={{ r: 6, fill: 'rgb(var(--color-foreground))' }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Top Fonts */}
                                        <div className="bg-[rgb(var(--color-card))] p-6 rounded-4xl border-2 border-[rgb(var(--color-border))] shadow-[4px_4px_0px_0px_rgba(var(--color-border),1)]">
                                            <h3 className="font-bold text-lg mb-6 text-[rgb(var(--color-accent))]">Top Favorited Fonts</h3>
                                            <div className='overflow-y-auto h-80'>
                                                {topFavoritedFonts.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {topFavoritedFonts.map((font, idx) => (
                                                            <div key={idx} className="flex justify-between items-center p-3 bg-[rgb(var(--color-accent)/0.05)] rounded-xl border border-[rgb(var(--color-accent)/0.1)]">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="w-6 h-6 flex items-center justify-center bg-[rgb(var(--color-accent))] text-[rgb(var(--color-background))] rounded-full text-xs font-bold">
                                                                        {idx + 1}
                                                                    </span>
                                                                    <span className="font-bold text-[rgb(var(--color-foreground))]">{font.name}</span>
                                                                </div>
                                                                <span className="font-mono font-bold text-[rgb(var(--color-accent))]">{font.count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-[rgb(var(--color-muted-foreground))] py-8">No data available</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
