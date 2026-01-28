-- Drop the strict check constraint on the category column
-- This allows us to store 'other' or the first tag as a fallback without validation errors
ALTER TABLE public.fonts DROP CONSTRAINT IF EXISTS fonts_category_check;
