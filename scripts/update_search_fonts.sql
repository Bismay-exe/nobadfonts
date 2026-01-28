-- Drop the old function first to change return type
DROP FUNCTION IF EXISTS public.search_fonts(text, text, text, text[]);
DROP FUNCTION IF EXISTS public.search_fonts(text, text, text); -- Drop legacy signature just in case

-- Recreate returning SETOF fonts (cleaner and strongly typed)
CREATE OR REPLACE FUNCTION public.search_fonts(
  query text DEFAULT NULL,
  filter_category text DEFAULT NULL, -- Keeping legacy support but we will likely stop using it for filtering
  sort_by text DEFAULT 'trending',
  filter_tags text[] DEFAULT NULL -- New parameter for tags
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
    CASE WHEN sort_by = 'alphabetical' THEN f.name END ASC;
END;
$$ LANGUAGE plpgsql;
