-- Migration: Add OG Social Card columns to fonts table
-- Run this script in your Supabase SQL Editor

ALTER TABLE public.fonts 
ADD COLUMN IF NOT EXISTS og_image_url text,
ADD COLUMN IF NOT EXISTS og_image_variant_id text,
ADD COLUMN IF NOT EXISTS og_image_variant_count integer,
ADD COLUMN IF NOT EXISTS og_image_variant_signature text,
ADD COLUMN IF NOT EXISTS og_image_generated_at timestamptz;

-- Documentation comments
COMMENT ON COLUMN public.fonts.og_image_url IS 'Public CDN URL of custom generated 1200x630 OG social card';
COMMENT ON COLUMN public.fonts.og_image_variant_id IS 'ID of the font variant used to generate the card';
COMMENT ON COLUMN public.fonts.og_image_variant_count IS 'Snapshot of variant count when card was created (drift detection)';
COMMENT ON COLUMN public.fonts.og_image_variant_signature IS 'Cryptographic signature: variant_id::SHA256(binary)';
COMMENT ON COLUMN public.fonts.og_image_generated_at IS 'Timestamp of when the card was generated';
