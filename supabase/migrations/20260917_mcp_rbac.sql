-- ============================================================
-- NoBadFonts MCP RBAC Migration
-- Created: 2026-09-17
-- Tables: storyboard_fonts, font_preferences, curated_collections
-- RLS: All new tables + font_revisions member scoping
-- ============================================================

-- TABLE 1: storyboard_fonts
CREATE TABLE IF NOT EXISTS storyboard_fonts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  font_id     UUID        NOT NULL REFERENCES fonts(id) ON DELETE CASCADE,
  note        TEXT,
  position    INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, font_id)
);

ALTER TABLE storyboard_fonts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "storyboard_fonts_select_own"
  ON storyboard_fonts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "storyboard_fonts_insert_own"
  ON storyboard_fonts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "storyboard_fonts_update_own"
  ON storyboard_fonts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "storyboard_fonts_delete_own"
  ON storyboard_fonts FOR DELETE
  USING (auth.uid() = user_id);

-- TABLE 2: font_preferences
CREATE TABLE IF NOT EXISTS font_preferences (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  font_id     UUID        NOT NULL REFERENCES fonts(id) ON DELETE CASCADE,
  preference  TEXT        NOT NULL CHECK (preference IN ('dislike')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, font_id)
);

ALTER TABLE font_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "font_preferences_select_own"
  ON font_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "font_preferences_insert_own"
  ON font_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "font_preferences_delete_own"
  ON font_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- TABLE 3: curated_collections
CREATE TABLE IF NOT EXISTS curated_collections (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  theme       TEXT,
  status      TEXT        DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  font_ids    UUID[]      DEFAULT '{}',
  created_by  UUID        REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE curated_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "curated_collections_select_published"
  ON curated_collections FOR SELECT
  USING (status = 'published');

CREATE POLICY "curated_collections_select_admin"
  ON curated_collections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "curated_collections_insert_admin"
  ON curated_collections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "curated_collections_update_admin"
  ON curated_collections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- RLS: font_revisions member scoping
ALTER TABLE font_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "font_revisions_select_authenticated"
  ON font_revisions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "font_revisions_insert_member_or_admin"
  ON font_revisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('member', 'admin')
    )
  );

CREATE POLICY "font_revisions_update_admin"
  ON font_revisions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Trigger: auto-update updated_at on curated_collections
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_curated_collections_updated_at
  BEFORE UPDATE ON curated_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
