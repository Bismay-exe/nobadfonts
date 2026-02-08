-- ⚠️ WARNING: THIS SCRIPT WILL DELETE ALL FONTS AND RELATED DATA ⚠️
-- Run this in the Supabase Dashboard SQL Editor.

-- 1. Clear Storage Files (This deletes actual files in the 'fonts' bucket)
-- We target the 'storage.objects' table where the bucket_id matches 'fonts'.
DELETE FROM storage.objects 
WHERE bucket_id = 'fonts';

-- 2. Clear Database Tables
-- 'font_variants' depends on 'fonts', so we delete it first.
DELETE FROM public.font_variants;

-- 'fonts' depends on 'profiles' (users), but we are keeping profiles.
DELETE FROM public.fonts;

-- 3. (Optional) Verification
SELECT 'Storage Files Remaining' as check_type, count(*) as count FROM storage.objects WHERE bucket_id = 'fonts'
UNION ALL
SELECT 'Variants Remaining', count(*) FROM public.font_variants
UNION ALL
SELECT 'Fonts Remaining', count(*) FROM public.fonts;
