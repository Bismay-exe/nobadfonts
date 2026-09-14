-- Migration: Fix font_research Row Level Security (RLS)
-- Enables public read and allows authenticated admins/users to insert and update font_research records

-- Option A: Disable RLS on font_research (matching fonts and font_variants configuration)
ALTER TABLE public.font_research DISABLE ROW LEVEL SECURITY;

-- If you prefer to keep RLS enabled with policies instead, use these policies:
-- ALTER TABLE public.font_research ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Public read access for font_research" ON public.font_research;
-- DROP POLICY IF EXISTS "Authenticated users can insert font_research" ON public.font_research;
-- DROP POLICY IF EXISTS "Authenticated users can update font_research" ON public.font_research;

-- CREATE POLICY "Public read access for font_research"
-- ON public.font_research FOR SELECT USING (true);

-- CREATE POLICY "Authenticated users can insert font_research"
-- ON public.font_research FOR INSERT TO authenticated WITH CHECK (true);

-- CREATE POLICY "Authenticated users can update font_research"
-- ON public.font_research FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
