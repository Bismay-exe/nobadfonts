import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Font } from '../types/font';

export function useFont(id: string | undefined) {
  const [font, setFont] = useState<Font | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    async function fetchFontAndFavoriteStatus() {
      if (!id) return;

      setLoading(true);
      setError(null);
      try {
        // Determine column
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const column = isUuid ? 'id' : 'slug';

        // Fetch font data
        const { data: fontData, error: fontError } = await supabase
          .from('fonts')
          .select('*, font_variants(*)')
          .eq(column, id)
          .order('id', { foreignTable: 'font_variants', ascending: true })
          .single();

        if (fontError) throw fontError;
        setFont(fontData);

        // Check favorite status if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: favData, error: favError } = await supabase
            .from('favorites')
            .select('id')
            .eq('font_id', fontData.id)
            .eq('user_id', session.user.id)
            .single();

          // .single() returns error if no row found, which means not favorited
          if (!favError && favData) {
            setIsFavorited(true);
          } else {
            setIsFavorited(false);
          }
        }
      } catch (err: any) {
        console.error('Error fetching font:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchFontAndFavoriteStatus();
  }, [id]);

  return { font, loading, error, isFavorited, setIsFavorited };
}
