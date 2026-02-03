import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, Download, Heart, TrendingUp, BarChart3, ArrowUpRight } from 'lucide-react';

interface FontStats {
    id: string;
    name: string;
    views: number;
    downloads: number;
    favorites_count: number;
    slug: string;
}

export default function AnalyticsDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<FontStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchStats = async () => {
            const { data, error } = await supabase
                .from('fonts')
                .select('id, name, views, downloads, favorites_count, slug')
                .eq('uploaded_by', user.id)
                .order('views', { ascending: false });

            if (error) console.error(error);
            else setStats(data || []);
            setLoading(false);
        };
        fetchStats();
    }, [user]);

    const totals = stats.reduce((acc, curr) => ({
        views: acc.views + (curr.views || 0),
        downloads: acc.downloads + (curr.downloads || 0),
        favorites: acc.favorites + (curr.favorites_count || 0)
    }), { views: 0, downloads: 0, favorites: 0 });

    if (loading) return <div className="p-8 text-center text-gray-500">Loading stats...</div>;

    if (stats.length === 0) return (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-gray-300 rounded-3xl">
            <BarChart3 className="text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900">No Data Yet</h3>
            <p className="text-gray-500">Upload your first font to start tracking analytics.</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black text-white p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                        <Eye size={48} />
                    </div>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Total Views</p>
                    <h3 className="text-5xl font-black">{totals.views.toLocaleString()}</h3>
                </div>

                <div className="bg-[#BDF522] text-black p-6 rounded-3xl border-2 border-black relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                        <Download size={48} />
                    </div>
                    <p className="text-gray-600 text-sm font-bold uppercase tracking-wider mb-1">Downloads</p>
                    <h3 className="text-5xl font-black">{totals.downloads.toLocaleString()}</h3>
                </div>

                <div className="bg-white text-black p-6 rounded-3xl border-2 border-black relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <Heart size={48} />
                    </div>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Favorites</p>
                    <h3 className="text-5xl font-black">{totals.favorites.toLocaleString()}</h3>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white border-2 border-black rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-black flex items-center gap-2">
                        <TrendingUp size={20} />
                        Font Performance
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-6 py-4 font-bold">Font Name</th>
                                <th className="px-6 py-4 font-bold text-right">Views</th>
                                <th className="px-6 py-4 font-bold text-right">Downloads</th>
                                <th className="px-6 py-4 font-bold text-right">Favorites</th>
                                <th className="px-6 py-4 font-bold text-right">Conversion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.map(font => {
                                const conversionRate = font.views > 0
                                    ? ((font.downloads / font.views) * 100).toFixed(1) + '%'
                                    : '0%';

                                return (
                                    <tr key={font.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold flex items-center gap-2">
                                            {font.name}
                                            <a href={`/font/${font.slug}`} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-black">
                                                <ArrowUpRight size={14} />
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono">{font.views.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-mono">{font.downloads.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-mono">{font.favorites_count.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-mono text-green-600 font-bold">{conversionRate}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
