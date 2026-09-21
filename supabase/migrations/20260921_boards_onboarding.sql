-- ============================================================
-- NoBadFonts: Boards + Onboarding Migration
-- Date: 2026-09-21
-- Replaces: storyboard_fonts, font_preferences (from 20260917_mcp_rbac.sql)
-- New tables: boards, board_fonts
-- Modified tables: profiles (username UNIQUE, onboarding_completed)
-- ============================================================

-- ─── 0. Drop old storyboard tables (from previous migration) ───────────────
DROP TABLE IF EXISTS storyboard_fonts CASCADE;
DROP TABLE IF EXISTS font_preferences CASCADE;
-- Keep curated_collections as-is

-- ─── 1. Add onboarding_completed to profiles ───────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Mark existing users who already have a username as onboarding completed
UPDATE profiles
  SET onboarding_completed = true
  WHERE username IS NOT NULL AND username != '';

-- Add UNIQUE constraint on username (allow NULL for users mid-onboarding)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- ─── 2. boards table ───────────────────────────────────────────────────────
-- Each user can have multiple boards.
-- Boards can be public (visible to all) or private (hidden, only via share_token).
CREATE TABLE IF NOT EXISTS boards (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  slug          TEXT        NOT NULL,
  description   TEXT,
  visibility    TEXT        NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  share_token   TEXT        UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  font_count    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- Auto-update updated_at on boards
CREATE OR REPLACE FUNCTION boards_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_boards_updated_at ON boards;
CREATE TRIGGER trg_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION boards_set_updated_at();

-- RLS on boards
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- Public boards are visible to everyone
CREATE POLICY "boards_select_public"
  ON boards FOR SELECT
  USING (visibility = 'public');

-- Private boards visible only to owner (direct URL blocked; share_token used instead via API)
CREATE POLICY "boards_select_own"
  ON boards FOR SELECT
  USING (auth.uid() = user_id);

-- Only the owner can insert their own boards
CREATE POLICY "boards_insert_own"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only the owner can update their own boards
CREATE POLICY "boards_update_own"
  ON boards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only the owner can delete their own boards
CREATE POLICY "boards_delete_own"
  ON boards FOR DELETE
  USING (auth.uid() = user_id);

-- ─── 3. board_fonts table ──────────────────────────────────────────────────
-- Junction table: fonts saved to a board.
CREATE TABLE IF NOT EXISTS board_fonts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    UUID        NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  font_id     UUID        NOT NULL REFERENCES fonts(id) ON DELETE CASCADE,
  note        TEXT,
  position    INTEGER     NOT NULL DEFAULT 0,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(board_id, font_id)
);

ALTER TABLE board_fonts ENABLE ROW LEVEL SECURITY;

-- Users can view board_fonts for any board they can see (public boards or their own)
CREATE POLICY "board_fonts_select"
  ON board_fonts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards b
      WHERE b.id = board_id
        AND (b.visibility = 'public' OR b.user_id = auth.uid())
    )
  );

-- Users can insert into their own boards only
CREATE POLICY "board_fonts_insert_own"
  ON board_fonts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards b
      WHERE b.id = board_id AND b.user_id = auth.uid()
    )
  );

-- Users can update fonts in their own boards
CREATE POLICY "board_fonts_update_own"
  ON board_fonts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM boards b
      WHERE b.id = board_id AND b.user_id = auth.uid()
    )
  );

-- Users can delete fonts from their own boards
CREATE POLICY "board_fonts_delete_own"
  ON board_fonts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boards b
      WHERE b.id = board_id AND b.user_id = auth.uid()
    )
  );

-- ─── 4. Auto-update boards.font_count via trigger ─────────────────────────
CREATE OR REPLACE FUNCTION sync_board_font_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE boards SET font_count = font_count + 1 WHERE id = NEW.board_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE boards SET font_count = GREATEST(font_count - 1, 0) WHERE id = OLD.board_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_board_fonts_count ON board_fonts;
CREATE TRIGGER trg_board_fonts_count
  AFTER INSERT OR DELETE ON board_fonts
  FOR EACH ROW EXECUTE FUNCTION sync_board_font_count();

-- ─── 5. Helper function: get board by share_token (bypasses RLS) ───────────
-- This is called server-side (service role) to resolve private board share links.
-- It returns the board only if the share_token matches.
CREATE OR REPLACE FUNCTION get_board_by_share_token(p_share_token TEXT)
RETURNS TABLE (
  id            UUID,
  user_id       UUID,
  name          TEXT,
  slug          TEXT,
  description   TEXT,
  visibility    TEXT,
  font_count    INTEGER,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    id, user_id, name, slug, description, visibility, font_count, created_at, updated_at
  FROM boards
  WHERE share_token = p_share_token;
$$;

-- ─── 6. Supabase Storage: avatars bucket (idempotent) ─────────────────────
-- Creates the 'avatars' bucket if it doesn't exist.
-- You may also create this in the Supabase dashboard under Storage.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public reads
CREATE POLICY "avatars_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow users to update/delete their own avatars
CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
