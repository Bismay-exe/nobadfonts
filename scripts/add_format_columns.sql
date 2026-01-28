-- Add missing columns for other font formats
ALTER TABLE public.fonts 
ADD COLUMN IF NOT EXISTS ttf_url text,
ADD COLUMN IF NOT EXISTS otf_url text,
ADD COLUMN IF NOT EXISTS woff_url text;

-- Optional: Update comment
COMMENT ON COLUMN public.fonts.ttf_url IS 'URL for TrueType font file';
COMMENT ON COLUMN public.fonts.otf_url IS 'URL for OpenType font file';
COMMENT ON COLUMN public.fonts.woff_url IS 'URL for Web Open Font Format file';
