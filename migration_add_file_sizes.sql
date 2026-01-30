-- Add file size columns for other formats
ALTER TABLE public.fonts 
ADD COLUMN IF NOT EXISTS file_size_ttf bigint,
ADD COLUMN IF NOT EXISTS file_size_otf bigint,
ADD COLUMN IF NOT EXISTS file_size_woff bigint;

-- Optional: Comments to describe columns
COMMENT ON COLUMN public.fonts.file_size_ttf IS 'Size of the TTF file in bytes';
COMMENT ON COLUMN public.fonts.file_size_otf IS 'Size of the OTF file in bytes';
COMMENT ON COLUMN public.fonts.file_size_woff IS 'Size of the WOFF file in bytes';
