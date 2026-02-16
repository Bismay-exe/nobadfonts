-- Add curation columns to fonts table
ALTER TABLE public.fonts 
ADD COLUMN IF NOT EXISTS is_trending boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_editors_pick boolean DEFAULT false;

-- Add comments
COMMENT ON COLUMN public.fonts.is_trending IS 'Manual override to mark a font as trending';
COMMENT ON COLUMN public.fonts.is_editors_pick IS 'Flag for Editor''s Pick curation';

-- Ensure existing rows have default values (though DEFAULT handles new ones, this is safe)
UPDATE public.fonts SET is_trending = false WHERE is_trending IS NULL;
UPDATE public.fonts SET is_editors_pick = false WHERE is_editors_pick IS NULL;
