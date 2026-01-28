import type { Database } from './database.types';

export type Font = Database['public']['Tables']['fonts']['Row'];

export interface FontFilterParams {
  query?: string;
  categories?: string[];
  sortBy?: 'trending' | 'popular' | 'newest' | 'alphabetical';
}
