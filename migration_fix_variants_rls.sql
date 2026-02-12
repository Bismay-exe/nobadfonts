-- Enable Row Level Security on font_variants if not already enabled
ALTER TABLE public.font_variants ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies to ensure clean state
DROP POLICY IF EXISTS "Users can update their own font variants" ON public.font_variants;
DROP POLICY IF EXISTS "Users can insert their own font variants" ON public.font_variants;
DROP POLICY IF EXISTS "Users can delete their own font variants" ON public.font_variants;
DROP POLICY IF EXISTS "Anyone can view font variants" ON public.font_variants;

-- Policy 1: Allow everyone to VIEW font variants (publicly accessible)
CREATE POLICY "Anyone can view font variants"
ON public.font_variants
FOR SELECT
TO public
USING (true);

-- Policy 2: Allow Users to INSERT variants for their own fonts
CREATE POLICY "Users can insert their own font variants"
ON public.font_variants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fonts
    WHERE fonts.id = font_variants.font_id
    AND fonts.user_id = auth.uid()
  )
);

-- Policy 3: Allow Users to UPDATE variants for their own fonts
CREATE POLICY "Users can update their own font variants"
ON public.font_variants
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fonts
    WHERE fonts.id = font_variants.font_id
    AND fonts.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fonts
    WHERE fonts.id = font_variants.font_id
    AND fonts.user_id = auth.uid()
  )
);

-- Policy 4: Allow Users to DELETE variants for their own fonts
CREATE POLICY "Users can delete their own font variants"
ON public.font_variants
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fonts
    WHERE fonts.id = font_variants.font_id
    AND fonts.user_id = auth.uid()
  )
);

-- Note: This ensures that when the background process (running as the user) tries to update the woff2_url,
-- it will be allowed because the user owns the parent font.
