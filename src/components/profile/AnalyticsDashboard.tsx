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

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-zinc-900 rounded-3xl border border-white/5" />
            ))}
        </div>
    );

    if (stats.length === 0) return (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900 border border-dashed border-white/10 rounded-3xl text-center">
            <BarChart3 className="text-zinc-700 mb-4" size={48} />
            <h3 className="text-xl font-bold text-white">No Data Yet</h3>
            <p className="text-zinc-500 mt-2">Upload your first font to start tracking analytics.</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 text-white p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-zinc-800 opacity-20 group-hover:scale-110 transition-transform group-hover:text-white">
                        <Eye size={64} />
                    </div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Total Views</p>
                    <h3 className="text-5xl font-black tracking-tighter">{totals.views.toLocaleString()}</h3>
                </div>

                <div className="bg-[#BDF522] text-black p-8 rounded-3xl border border-[#BDF522] relative overflow-hidden group shadow-[0_0_30px_rgba(189,245,34,0.2)]">
                    <div className="absolute top-0 right-0 p-8 text-black opacity-10 group-hover:scale-110 transition-transform">
                        <Download size={64} />
                    </div>
                    <p className="text-black/60 text-xs font-bold uppercase tracking-widest mb-2">Downloads</p>
                    <h3 className="text-5xl font-black tracking-tighter">{totals.downloads.toLocaleString()}</h3>
                </div>

                <div className="bg-white text-black p-8 rounded-3xl border border-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-black opacity-5 group-hover:scale-110 transition-transform">
                        <Heart size={64} />
                    </div>
                    <p className="text-black/60 text-xs font-bold uppercase tracking-widest mb-2">Favorites</p>
                    <h3 className="text-5xl font-black tracking-tighter">{totals.favorites.toLocaleString()}</h3>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp size={20} className="text-[#BDF522]" />
                        Font Performance
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-xs uppercase text-zinc-500">
                            <tr>
                                <th className="px-6 py-4 font-bold">Font Name</th>
                                <th className="px-6 py-4 font-bold text-right">Views</th>
                                <th className="px-6 py-4 font-bold text-right">Downloads</th>
                                <th className="px-6 py-4 font-bold text-right">Favorites</th>
                                <th className="px-6 py-4 font-bold text-right">Conversion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-zinc-300 text-sm font-medium">
                            {stats.map(font => {
                                const conversionRate = font.views > 0
                                    ? ((font.downloads / font.views) * 100).toFixed(1) + '%'
                                    : '0%';

                                return (
                                    <tr key={font.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                                            {font.name}
                                            <a href={`/fonts/${font.slug}`} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-[#BDF522] transition-colors">
                                                <ArrowUpRight size={14} />
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono">{font.views.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-mono">{font.downloads.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-mono">{font.favorites_count.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-mono text-[#BDF522] font-bold">{conversionRate}</td>
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
