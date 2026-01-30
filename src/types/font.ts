import type { Database } from './database.types';

export type Font = Database['public']['Tables']['fonts']['Row'] & {
  font_variants?: Database['public']['Tables']['font_variants']['Row'][];
};

export interface FontFilterParams {
  query?: string;
  categories?: string[];
  sortBy?: 'trending' | 'popular' | 'editor-picks' | 'featured' | 'newest' | 'alphabetical';
}
