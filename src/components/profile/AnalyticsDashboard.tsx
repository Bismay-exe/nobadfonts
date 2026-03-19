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

    if (loading) return <div className="p-8 text-center text-[rgb(var(--color-muted-foreground))]">Loading stats...</div>;

    if (stats.length === 0) return (
        <div className="flex flex-col items-center justify-center py-16 bg-[rgb(var(--color-card))] border border-dashed border-[rgb(var(--color-border))] rounded-4xl">
            <BarChart3 className="text-[rgb(var(--color-muted-foreground)/0.3)]" size={48} />
            <h3 className="text-xl font-bold text-[rgb(var(--color-foreground))]">No Data Yet</h3>
            <p className="text-[rgb(var(--color-muted-foreground))]">Upload your first font to start tracking analytics.</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] p-6 rounded-4xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                        <Eye size={48} />
                    </div>
                    <p className="text-[rgb(var(--color-muted-foreground)/0.4)] text-sm font-bold uppercase tracking-wider mb-1">Total Views</p>
                    <h3 className="text-5xl font-black">{totals.views.toLocaleString()}</h3>
                </div>

                <div className="bg-[rgb(var(--color-highlight))] text-[rgb(var(--color-background))] p-6 rounded-4xl border-2 border-[rgb(var(--color-foreground))] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                        <Download size={48} />
                    </div>
                    <p className="text-[rgb(var(--color-muted-foreground)/0.6)] text-sm font-bold uppercase tracking-wider mb-1">Downloads</p>
                    <h3 className="text-5xl font-black">{totals.downloads.toLocaleString()}</h3>
                </div>

                <div className="bg-[rgb(var(--color-card))] text-[rgb(var(--color-foreground))] p-6 rounded-4xl border-2 border-[rgb(var(--color-foreground))] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <Heart size={48} />
                    </div>
                    <p className="text-[rgb(var(--color-muted-foreground))] text-sm font-bold uppercase tracking-wider mb-1">Favorites</p>
                    <h3 className="text-5xl font-black">{totals.favorites.toLocaleString()}</h3>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-[rgb(var(--color-card))] border-2 border-[rgb(var(--color-foreground))] rounded-4xl overflow-hidden">
                <div className="p-6 border-b border-[rgb(var(--color-border)/0.5)] flex items-center justify-between">
                    <h3 className="text-xl font-black flex items-center gap-2">
                        <TrendingUp size={20} />
                        Font Performance
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[rgb(var(--color-muted)/0.05)] text-xs uppercase text-[rgb(var(--color-muted-foreground))]">
                            <tr>
                                <th className="px-6 py-4 font-bold">Font Name</th>
                                <th className="px-6 py-4 font-bold text-right">Views</th>
                                <th className="px-6 py-4 font-bold text-right">Downloads</th>
                                <th className="px-6 py-4 font-bold text-right">Favorites</th>
                                <th className="px-6 py-4 font-bold text-right">Conversion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgb(var(--color-border)/0.5)]">
                            {stats.map(font => {
                                const conversionRate = font.views > 0
                                    ? ((font.downloads / font.views) * 100).toFixed(1) + '%'
                                    : '0%';

                                return (
                                    <tr key={font.id} className="hover:bg-[rgb(var(--color-muted)/0.05)] transition-colors">
                                        <td className="px-6 py-4 font-bold flex items-center gap-2">
                                            {font.name}
                                            <a href={`/font/${font.slug}`} target="_blank" rel="noreferrer" className="text-[rgb(var(--color-muted-foreground)/0.3)] hover:text-[rgb(var(--color-foreground))]">
                                                <ArrowUpRight size={14} />
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono">{font.views.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-mono">{font.downloads.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-mono">{font.favorites_count.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-mono text-[rgb(var(--color-highlight))] font-bold">{conversionRate}</td>
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
