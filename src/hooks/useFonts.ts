import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Font, FontFilterParams } from '../types/font';

export function useFonts({ query, categories, sortBy = 'trending' }: FontFilterParams) {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFonts() {
      setLoading(true);
      setError(null);
      try {
        const rpcParams = {
          query: query || undefined,
          sort_by: sortBy,
          filter_tags: categories && categories.length > 0 ? categories : undefined
        };
        console.log('Fetching fonts with params:', rpcParams);

        const { data, error } = await supabase.rpc('search_fonts', rpcParams);

        if (error) throw error;

        // Manually fetch variants for these fonts since RPC doesn't include them
        let fontsWithVariants = (data || []).filter((f: any) => f && typeof f === 'object');
        
        if (fontsWithVariants.length > 0) {
            const fontIds = fontsWithVariants.map((f: any) => f.id);
            const { data: variantsData } = await supabase
                .from('font_variants')
                .select('*')
                .in('font_id', fontIds);
            
            if (variantsData) {
                // Attach variants to their respective fonts
                fontsWithVariants = fontsWithVariants.map((f: any) => ({
                    ...f,
                    font_variants: variantsData.filter(v => v.font_id === f.id)
                }));
            }
        }
        
        setFonts(fontsWithVariants);
        
      } catch (err: any) {
        console.error('Error fetching fonts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    // Debounce the fetch if query is present to avoid too many requests
    const timeoutId = setTimeout(() => {
        fetchFonts();
    }, query ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [query, categories, sortBy]);

  return { fonts, loading, error };
}
