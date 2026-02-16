-- Drop the old function first to ensure signature changes are handled cleanly
DROP FUNCTION IF EXISTS public.search_fonts(text, text, text, text[]);

-- Recreate with updated sorting logic
CREATE OR REPLACE FUNCTION public.search_fonts(
  query text DEFAULT NULL,
  filter_category text DEFAULT NULL,
  sort_by text DEFAULT 'trending',
  filter_tags text[] DEFAULT NULL
)
RETURNS SETOF fonts AS $$
BEGIN
  RETURN QUERY
  SELECT f.*
  FROM fonts f
  WHERE
    -- Search query match
    (
      query IS NULL 
      OR f.name ILIKE '%' || query || '%' 
      OR f.designer ILIKE '%' || query || '%'
    )
    AND
    (
      filter_tags IS NULL
      OR filter_tags = '{}'
      OR f.tags && filter_tags -- Checks if tags overlap
    )
  ORDER BY
    -- Sorting Logic
    CASE WHEN sort_by = 'newest' THEN f.created_at END DESC,
    CASE WHEN sort_by = 'popular' THEN f.downloads END DESC,
    
    -- Trending: Manual override first, then algorithmic (downloads_7d)
    CASE WHEN sort_by = 'trending' THEN f.is_trending END DESC,
    CASE WHEN sort_by = 'trending' THEN f.downloads_7d END DESC,
    
    -- Featured
    CASE WHEN sort_by = 'featured' THEN f.is_featured END DESC,
    
    -- Editor's Picks
    CASE WHEN sort_by = 'editor-picks' THEN f.is_editors_pick END DESC,
    
    -- Alpha
    CASE WHEN sort_by = 'alpha' THEN f.name END ASC,

    -- Fallback for stability
    f.created_at DESC;
END;
$$ LANGUAGE plpgsql;
