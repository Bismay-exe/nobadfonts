import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type FontRow = Database['public']['Tables']['fonts']['Row'];

export default function AdminDashboard() {
    const { user, profile, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'files' | 'curation'>('requests');

    // State for Requests
    const [pendingRequests, setPendingRequests] = useState<Profile[]>([]);

    // State for User Management
    const [allUsers, setAllUsers] = useState<Profile[]>([]);

    // State for Files/Storage
    const [allFonts, setAllFonts] = useState<FontRow[]>([]);

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


    if (authLoading) return <div>Loading...</div>;
    if (!user || profile?.role !== 'admin') return <Navigate to="/" replace />;

    return (
        <div className="mx-auto px-4 py-8 bg-white/30 min-h-screen">
            <h1 className="text-4xl font-black uppercase mb-8">Admin Dashboard</h1>

            {/* Tabs */}
            <div className="flex flex-wrap gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-6 py-2 rounded-full font-bold border-2 border-black transition-all ${activeTab === 'requests' ? 'bg-[#BDF522] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'
                        }`}
                >
                    Requests
                    {pendingRequests.length > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-2 rounded-full font-bold border-2 border-black transition-all ${activeTab === 'users' ? 'bg-[#FF90E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'
                        }`}
                >
                    User Management
                </button>
                <button
                    onClick={() => setActiveTab('files')}
                    className={`px-6 py-2 rounded-full font-bold border-2 border-black transition-all ${activeTab === 'files' ? 'bg-[#04ff96] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'
                        }`}
                >
                    Storage & Files
                </button>
                <button
                    onClick={() => setActiveTab('curation')}
                    className={`px-6 py-2 rounded-full font-bold border-2 border-black transition-all ${activeTab === 'curation' ? 'bg-[#FFDE59] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'
                        }`}
                >
                    Site Curation
                </button>
            </div>

            <div className="bg-white border-2 border-black rounded-3xl p-8 min-h-[50vh]">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'requests' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                    Pending Member Requests
                                </h2>
                                {pendingRequests.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
                                        No pending requests
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingRequests.map(request => (
                                            <div key={request.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-gray-50 border-2 border-black rounded-2xl gap-4">
                                                <div className="flex items-center gap-4 w-full md:w-auto">
                                                    <div className="w-12 h-12 bg-gray-200 rounded-full border-2 border-black overflow-hidden shrink-0">
                                                        {request.avatar_url ? (
                                                            <img src={request.avatar_url} alt={request.full_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center font-black text-lg text-gray-400">
                                                                {request.full_name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg leading-tight">{request.full_name}</h3>
                                                        <p className="text-sm text-gray-500">{request.email}</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 w-full md:w-auto">
                                                    <button
                                                        onClick={() => handleRequestAction(request.id, 'reject')}
                                                        className="flex-1 md:flex-none px-6 py-2 bg-white text-red-500 font-bold uppercase rounded-xl border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleRequestAction(request.id, 'approve')}
                                                        className="flex-1 md:flex-none px-6 py-2 bg-[#BDF522] text-black font-bold uppercase rounded-xl border-2 border-black hover:bg-[#a9db1e] transition-colors"
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
                            <div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <h2 className="text-2xl font-bold">All Users</h2>
                                    <div className="relative w-full md:w-64">
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchUsers}
                                            onChange={(e) => setSearchUsers(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border-2 border-black rounded-full focus:outline-none focus:bg-gray-50 transition-all font-bold text-sm"
                                        />
                                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-black text-sm uppercase text-gray-500">
                                                <th className="py-4 px-4">User</th>
                                                <th className="py-4 px-4">Role</th>
                                                <th className="py-4 px-4">Joined</th>
                                                <th className="py-4 px-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {allUsers.filter(u =>
                                                u.full_name.toLowerCase().includes(searchUsers.toLowerCase()) ||
                                                u.email.toLowerCase().includes(searchUsers.toLowerCase())
                                            ).map(u => (
                                                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gray-200 rounded-full border border-black overflow-hidden shrink-0">
                                                                {u.avatar_url ? (
                                                                    <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center font-black text-sm text-gray-400">
                                                                        {u.full_name.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold">{u.full_name}</div>
                                                                <div className="text-sm text-gray-500">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`
                                                            inline-block px-3 py-1 rounded-full text-xs font-bold uppercase border border-black
                                                            ${u.role === 'admin' ? 'bg-[#FF90E8] text-black' :
                                                                u.role === 'member' ? 'bg-[#BDF522] text-black' :
                                                                    'bg-white text-gray-500'}
                                                        `}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-gray-600 font-mono">
                                                        {new Date(u.created_at || '').toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <select
                                                            value={u.role}
                                                            onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                                                            className="border-2 border-gray-300 rounded-lg px-2 py-1 text-sm font-bold focus:border-black focus:ring-0 cursor-pointer"
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
                                            className="w-full pl-10 pr-4 py-2 border-2 border-black rounded-full focus:outline-none focus:bg-gray-50 transition-all font-bold text-sm"
                                        />
                                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    </div>
                                </div>

                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-gray-50 rounded-2xl p-6 border-2 border-black">
                                        <h3 className="font-bold text-gray-500 uppercase text-sm mb-2">Total Fonts</h3>
                                        <p className="text-4xl font-black">{totalFonts}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-6 border-2 border-black">
                                        <h3 className="font-bold text-gray-500 uppercase text-sm mb-2">Total Storage Usage</h3>
                                        <p className="text-4xl font-black">{formatBytes(totalStorageSize)}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-6 border-2 border-black">
                                        <h3 className="font-bold text-gray-500 uppercase text-sm mb-2">Files Count</h3>
                                        <div className="flex flex-wrap gap-2 text-sm font-bold">
                                            <span className="px-2 py-1 bg-white border border-gray-300 rounded">WOFF2: {formatCounts.woff2}</span>
                                            <span className="px-2 py-1 bg-white border border-gray-300 rounded">WOFF: {formatCounts.woff}</span>
                                            <span className="px-2 py-1 bg-white border border-gray-300 rounded">TTF: {formatCounts.ttf}</span>
                                            <span className="px-2 py-1 bg-white border border-gray-300 rounded">OTF: {formatCounts.otf}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-black text-sm uppercase text-gray-500">
                                                <th className="py-4 px-4 rounded-tl-xl hover:bg-gray-100">Font</th>
                                                <th className="py-4 px-4 hover:bg-gray-100">Formats</th>
                                                <th className="py-4 px-4 hover:bg-gray-100">File Sizes</th>
                                                <th className="py-4 px-4 hover:bg-gray-100">Uploaded</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {allFonts.filter(f =>
                                                f.name.toLowerCase().includes(searchFiles.toLowerCase())
                                            ).map(font => (
                                                <tr key={font.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gray-100 rounded-lg border border-black overflow-hidden shrink-0">
                                                                {font.preview_image_url ? (
                                                                    <img src={font.preview_image_url} alt={font.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-gray-400">Aa</div>
                                                                )}
                                                            </div>
                                                            <Link to={`/fonts/${font.id}`} className="font-bold hover:underline">
                                                                {font.name}
                                                            </Link>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {font.woff2_url && <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold uppercase rounded border border-green-200">WOFF2</span>}
                                                            {font.woff_url && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase rounded border border-blue-200">WOFF</span>}
                                                            {font.ttf_url && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold uppercase rounded border border-purple-200">TTF</span>}
                                                            {font.otf_url && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold uppercase rounded border border-orange-200">OTF</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-xs font-mono space-y-1">
                                                        {font.file_size_woff2 && <div className="text-green-700">WOFF2: {formatBytes(font.file_size_woff2)}</div>}
                                                        {font.file_size_woff && <div className="text-blue-700">WOFF: {formatBytes(font.file_size_woff)}</div>}
                                                        {font.file_size_ttf && <div className="text-purple-700">TTF: {formatBytes(font.file_size_ttf)}</div>}
                                                        {font.file_size_otf && <div className="text-orange-700">OTF: {formatBytes(font.file_size_otf)}</div>}

                                                        {(font as any).font_variants?.length > 0 && (
                                                            <div className="mt-2 pt-1 border-t border-gray-200">
                                                                <div className="text-[10px] text-gray-500 italic mb-1">
                                                                    + {(font as any).font_variants.length} Variants
                                                                </div>
                                                                <div className="space-y-1 pl-1 border-l-2 border-gray-100">
                                                                    {(font as any).font_variants.map((v: any, idx: number) => (
                                                                        <div key={idx} className="bg-gray-50 p-1 rounded">
                                                                            <div className="font-bold text-[10px] text-black uppercase mb-0.5">{v.variant_name}</div>
                                                                            {v.file_size_woff2 && <div className="text-green-700 text-[9px] pl-1">WOFF2: {formatBytes(v.file_size_woff2)}</div>}
                                                                            {v.file_size_woff && <div className="text-blue-700 text-[9px] pl-1">WOFF: {formatBytes(v.file_size_woff)}</div>}
                                                                            {v.file_size_ttf && <div className="text-purple-700 text-[9px] pl-1">TTF: {formatBytes(v.file_size_ttf)}</div>}
                                                                            {v.file_size_otf && <div className="text-orange-700 text-[9px] pl-1">OTF: {formatBytes(v.file_size_otf)}</div>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!font.file_size_woff2 && !font.file_size_woff && !font.file_size_ttf && !font.file_size_otf && !(font as any).font_variants?.length && <span className="text-gray-400">-</span>}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-gray-500 font-mono">
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
                                            className="w-full pl-10 pr-4 py-2 border-2 border-black rounded-full focus:outline-none focus:bg-gray-50 transition-all font-bold text-sm"
                                        />
                                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl border-2 border-black overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 border-b-2 border-black">
                                            <tr>
                                                <th className="p-4 border-r-2 border-black w-2/3">Font</th>
                                                <th className="p-4 border-r-2 border-black text-center w-1/6">Statuses</th>
                                                <th className="p-4 text-center w-1/6">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y-2 divide-gray-100">
                                            {allFonts.filter(f =>
                                                f.name.toLowerCase().includes(searchCuration.toLowerCase()) ||
                                                f.designer.toLowerCase().includes(searchCuration.toLowerCase())
                                            ).map(font => (
                                                <tr key={font.id} className="hover:bg-gray-50">
                                                    <td className="p-4 border-r-2 border-gray-100">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-gray-200 border-2 border-black rounded-lg overflow-hidden shrink-0">
                                                                {font.preview_image_url ? (
                                                                    <img src={font.preview_image_url} alt={font.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">Aa</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-lg">{font.name}</div>
                                                                <div className="text-xs text-gray-500">by {font.designer}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 border-r-2 border-gray-100">
                                                        <div className="flex flex-col gap-2">
                                                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-100 transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={font.is_featured || false}
                                                                    onChange={() => handleToggleCuration(font.id, 'is_featured')}
                                                                    className="w-4 h-4 accent-black rounded border-2 border-black cursor-pointer"
                                                                />
                                                                <span className={`text-sm font-bold ${font.is_featured ? 'text-black' : 'text-gray-400'}`}>Featured</span>
                                                            </label>

                                                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-100 transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={font.is_trending || false}
                                                                    onChange={() => handleToggleCuration(font.id, 'is_trending')}
                                                                    className="w-4 h-4 accent-black rounded border-2 border-black cursor-pointer"
                                                                />
                                                                <span className={`text-sm font-bold ${font.is_trending ? 'text-black' : 'text-gray-400'}`}>Trending</span>
                                                            </label>

                                                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-100 transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={font.is_editors_pick || false}
                                                                    onChange={() => handleToggleCuration(font.id, 'is_editors_pick')}
                                                                    className="w-4 h-4 accent-black rounded border-2 border-black cursor-pointer"
                                                                />
                                                                <span className={`text-sm font-bold ${font.is_editors_pick ? 'text-black' : 'text-gray-400'}`}>Editor's Pick</span>
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <Link
                                                            to={`/fonts/${font.id}`}
                                                            className="inline-block px-4 py-2 bg-white border-2 border-black rounded-lg font-bold hover:bg-gray-100 text-sm"
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
                    </>
                )}
            </div>
        </div>
    );
}
