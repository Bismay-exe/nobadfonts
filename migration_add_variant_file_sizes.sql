-- Add file size columns for font variants
ALTER TABLE public.font_variants 
ADD COLUMN IF NOT EXISTS file_size_ttf bigint,
ADD COLUMN IF NOT EXISTS file_size_otf bigint,
ADD COLUMN IF NOT EXISTS file_size_woff bigint,
ADD COLUMN IF NOT EXISTS file_size_woff2 bigint;

-- Optional: Comments to describe columns
COMMENT ON COLUMN public.font_variants.file_size_ttf IS 'Size of the TTF file in bytes';
COMMENT ON COLUMN public.font_variants.file_size_otf IS 'Size of the OTF file in bytes';
COMMENT ON COLUMN public.font_variants.file_size_woff IS 'Size of the WOFF file in bytes';
COMMENT ON COLUMN public.font_variants.file_size_woff2 IS 'Size of the WOFF2 file in bytes';
