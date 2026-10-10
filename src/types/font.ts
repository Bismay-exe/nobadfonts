import type { Database } from './database.types';

export type FontFamilyRole = 'standalone' | 'parent' | 'subfamily';

export type FontFamilySummary = Pick<
  Database['public']['Tables']['fonts']['Row'],
  'id' | 'name' | 'slug' | 'family_role' | 'parent_font_id'
>;

export type Font = Database['public']['Tables']['fonts']['Row'] & {
  font_variants?: Database['public']['Tables']['font_variants']['Row'][];
  parent_font?: FontFamilySummary | null;
  subfamilies?: FontFamilySummary[];
};

export interface FontFilterParams {
  query?: string;
  categories?: string[];
  sortBy?: 'trending' | 'popular' | 'editor-picks' | 'featured' | 'newest' | 'alphabetical' | 'alpha';
}
