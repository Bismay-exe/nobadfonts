-- RESTORE POINT: 2024-01-29
-- Run this script to restore the table structure and RESET permissions/RLS for the fonts system.
-- This does NOT restore data, only the schema and security configuration to a clean state.

-- 1. Reset RLS Policies (Drop everything to unlock access if you get locked out)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.fonts;
DROP POLICY IF EXISTS "Enable insert for members and admins" ON public.fonts;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.fonts;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.fonts;
-- Add any other policies you experimented with here manually if needed

ALTER TABLE public.fonts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.font_variants DISABLE ROW LEVEL SECURITY;

-- 2. Ensure Table Structure Exists (Idempotent)
CREATE TABLE IF NOT EXISTS public.fonts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    name text NOT NULL,
    slug text NOT NULL,
    designer text NOT NULL,
    description text,
    category text NOT NULL,
    tags text[],
    weights text[],
    has_italic boolean DEFAULT false,
    ttf_url text,
    otf_url text,
    woff_url text,
    woff2_url text,
    zip_url text,
    preview_image_url text,
    license_type text NOT NULL,
    commercial_use boolean DEFAULT false,
    downloads integer DEFAULT 0,
    downloads_7d integer DEFAULT 0,
    favorites_count integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    is_published boolean DEFAULT true,
    user_id uuid, -- legacy owner column
    gallery_images text[],
    uploaded_by uuid -- New column for strict ownership tracking
);

CREATE TABLE IF NOT EXISTS public.font_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    font_id uuid NOT NULL REFERENCES public.fonts(id) ON DELETE CASCADE,
    variant_name text NOT NULL,
    ttf_url text,
    otf_url text,
    woff_url text,
    woff2_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Note
-- RLS has been disabled by this script. You can now access your data freely.
