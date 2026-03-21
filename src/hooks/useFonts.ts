import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Font, FontFilterParams } from '../types/font';

export function useFonts({ query, categories, sortBy = 'trending' }: FontFilterParams, initialLimit = 16) {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchFonts = useCallback(async (isLoadMore = false, currentOffset = 0) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setHasMore(true);
    }
    setError(null);

    try {
      const rpcParams = {
        query: query || undefined,
        sort_by: sortBy,
        filter_tags: categories && categories.length > 0 ? categories : undefined,
        limit_val: initialLimit,
        offset_val: currentOffset
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

      if (isLoadMore) {
        setFonts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newFonts = fontsWithVariants.filter((f: any) => !existingIds.has(f.id));
          return [...prev, ...newFonts];
        });
      } else {
        setFonts(fontsWithVariants);
      }

      setHasMore(fontsWithVariants.length === initialLimit);
      setOffset(currentOffset + fontsWithVariants.length);

    } catch (err: any) {
      console.error('Error fetching fonts:', err);
      setError(err.message);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [query, categories, sortBy, initialLimit]);

  useEffect(() => {
    // Debounce the fetch if query is present to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchFonts(false, 0);
    }, query ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [fetchFonts, query]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchFonts(true, offset);
    }
  }, [loadingMore, hasMore, fetchFonts, offset]);

  return { fonts, loading, loadingMore, error, hasMore, loadMore };
}
