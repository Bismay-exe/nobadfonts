-- ============================================================
-- NoBadFonts: saved_boards migration
-- Run this in your Supabase SQL Editor (or supabase db push)
-- ============================================================

-- 1. Create the saved_boards table
CREATE TABLE IF NOT EXISTS public.saved_boards (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  board_id   uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  saved_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, board_id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.saved_boards ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
--    Users can only see/manage their own saved boards
CREATE POLICY "saved_boards: select own"
  ON public.saved_boards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "saved_boards: insert own"
  ON public.saved_boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_boards: delete own"
  ON public.saved_boards FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Index for fast lookups
CREATE INDEX IF NOT EXISTS saved_boards_user_id_idx ON public.saved_boards (user_id);
CREATE INDEX IF NOT EXISTS saved_boards_board_id_idx ON public.saved_boards (board_id);
