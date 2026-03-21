import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAnalytics(activeTab: string, profile: any) {
    const [downloadStats, setDownloadStats] = useState<{ date: string, count: number }[]>([]);
    const [topDownloadedFonts, setTopDownloadedFonts] = useState<{ name: string, count: number }[]>([]);
    const [favoritesStats, setFavoritesStats] = useState<{ date: string, count: number }[]>([]);
    const [topFavoritedFonts, setTopFavoritedFonts] = useState<{ name: string, count: number }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.role !== 'admin' || activeTab !== 'analytics') return;

        const fetchAnalytics = async () => {
            setLoading(true);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

            // Fetch downloads and favorites in parallel
            const [downloadsRes, favoritesRes] = await Promise.all([
                supabase.from('downloads').select('font_id, downloaded_at').gte('downloaded_at', thirtyDaysAgoIso),
                supabase.from('favorites').select('font_id, created_at').gte('created_at', thirtyDaysAgoIso)
            ]);

            const downloads = downloadsRes.data;
            const favorites = favoritesRes.data;

            if (downloadsRes.error) console.error('Error fetching downloads:', downloadsRes.error);
            if (favoritesRes.error) console.error('Error fetching favorites:', favoritesRes.error);

            // Fetch ALL font names needed for top lists in one go to optimize
            const allFontIds = new Set<string>();
            if (downloads) downloads.forEach(d => allFontIds.add(d.font_id));
            if (favorites) favorites.forEach(f => allFontIds.add(f.font_id));

            let fontNamesMap = new Map<string, string>();
            if (allFontIds.size > 0) {
                const { data: fontNames } = await supabase
                    .from('fonts')
                    .select('id, name')
                    .in('id', Array.from(allFontIds));
                if (fontNames) {
                    fontNames.forEach(f => fontNamesMap.set(f.id, f.name));
                }
            }

            // --- Process Downloads ---
            if (downloads) {
                const dateMap = new Map<string, number>();
                for (let i = 0; i < 30; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    dateMap.set(d.toISOString().split('T')[0], 0);
                }
                downloads.forEach(d => {
                    const ds = d.downloaded_at?.split('T')[0];
                    if (ds && dateMap.has(ds)) dateMap.set(ds, (dateMap.get(ds) || 0) + 1);
                });
                setDownloadStats(Array.from(dateMap.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)));

                const fontCounts = new Map<string, number>();
                downloads.forEach(d => fontCounts.set(d.font_id, (fontCounts.get(d.font_id) || 0) + 1));
                setTopDownloadedFonts(Array.from(fontCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([id, count]) => ({ name: fontNamesMap.get(id) || 'Unknown Font', count }))
                );
            }

            // --- Process Favorites ---
            if (favorites) {
                const dateMap = new Map<string, number>();
                for (let i = 0; i < 30; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    dateMap.set(d.toISOString().split('T')[0], 0);
                }
                favorites.forEach(f => {
                    const ds = f.created_at?.split('T')[0];
                    if (ds && dateMap.has(ds)) dateMap.set(ds, (dateMap.get(ds) || 0) + 1);
                });
                setFavoritesStats(Array.from(dateMap.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)));

                const fontCounts = new Map<string, number>();
                favorites.forEach(f => fontCounts.set(f.font_id, (fontCounts.get(f.font_id) || 0) + 1));
                setTopFavoritedFonts(Array.from(fontCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([id, count]) => ({ name: fontNamesMap.get(id) || 'Unknown Font', count }))
                );
            }

            setLoading(false);
        };

        fetchAnalytics();
    }, [activeTab, profile]);

    return { downloadStats, topDownloadedFonts, favoritesStats, topFavoritedFonts, loading };
}
