import { useState, useCallback } from 'react';
import type { SearchFilters, LicenseFilter, SourceFilter } from '@/features/search/search.types';

const EMPTY_FILTERS: SearchFilters = {
  license: [],
  source: [],
  tags: [],
  moods: [],
};

/**
 * useSearchFilters — manages all active filter state.
 * Tags/moods are reflected as chips; license/source are separate toggles.
 */
export function useSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);

  const toggleLicense = useCallback((val: LicenseFilter) => {
    setFilters((prev) => ({
      ...prev,
      license: prev.license.includes(val)
        ? prev.license.filter((v) => v !== val)
        : [...prev.license, val],
    }));
  }, []);

  const toggleSource = useCallback((val: SourceFilter) => {
    setFilters((prev) => ({
      ...prev,
      source: prev.source.includes(val)
        ? prev.source.filter((v) => v !== val)
        : [...prev.source, val],
    }));
  }, []);

  const clearAll = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const hasActiveFilters =
    filters.license.length > 0 ||
    filters.source.length > 0 ||
    filters.tags.length > 0 ||
    filters.moods.length > 0;

  return { filters, toggleLicense, toggleSource, clearAll, hasActiveFilters };
}
