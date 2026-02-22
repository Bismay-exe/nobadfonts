-- Drop the old function first to cleanly add limit and offset
DROP FUNCTION IF EXISTS public.search_fonts(text, text, text, text[]);
DROP FUNCTION IF EXISTS public.search_fonts(text, text, text);

-- Recreate returning SETOF fonts with pagination support
CREATE OR REPLACE FUNCTION public.search_fonts(
  query text DEFAULT NULL,
  filter_category text DEFAULT NULL,
  sort_by text DEFAULT 'trending',
  filter_tags text[] DEFAULT NULL,
  limit_val int DEFAULT 16,
  offset_val int DEFAULT 0
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
    CASE WHEN sort_by = 'newest' THEN f.created_at END DESC,
    CASE WHEN sort_by = 'popular' THEN f.downloads END DESC,
    CASE WHEN sort_by = 'trending' THEN f.downloads_7d END DESC,
    CASE WHEN sort_by = 'alphabetical' THEN f.name END ASC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;
