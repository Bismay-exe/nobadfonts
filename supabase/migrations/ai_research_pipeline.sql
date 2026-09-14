-- ============================================================
-- NoBadFonts AI Research Pipeline — Database Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. font_research — Stores verified AI research results
-- One-to-one with fonts (linked by font_id)
CREATE TABLE IF NOT EXISTS font_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    font_id UUID NOT NULL REFERENCES fonts(id) ON DELETE CASCADE UNIQUE,

    -- Identity
    foundry TEXT,
    designer_verified TEXT,

    -- Official presence
    official_website TEXT,
    official_font_page TEXT,
    purchase_url TEXT,
    free_download_url TEXT,

    -- Licensing (evidence-backed)
    license_type_verified TEXT,
    license_status TEXT DEFAULT 'unknown',
    commercial_use_verified BOOLEAN,
    personal_use_verified BOOLEAN,
    license_url TEXT,
    license_evidence TEXT,

    -- AI output
    ai_description TEXT,
    ai_tags TEXT[],

    -- Quality metrics
    confidence TEXT DEFAULT 'none',
    ownership_score INT,
    license_score INT,

    -- Status
    research_status TEXT DEFAULT 'pending',
    has_conflicts BOOLEAN DEFAULT false,
    conflict_details TEXT,

    -- Metadata
    google_fonts_match BOOLEAN DEFAULT false,
    font_metadata_extracted JSONB,
    researched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_font_research_font_id ON font_research(font_id);
CREATE INDEX IF NOT EXISTS idx_font_research_status ON font_research(research_status);


-- 2. font_sources — Evidence audit trail
-- Many-to-one with font_research
CREATE TABLE IF NOT EXISTS font_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_id UUID NOT NULL REFERENCES font_research(id) ON DELETE CASCADE,

    url TEXT NOT NULL,
    domain TEXT,
    title TEXT,

    -- Classification
    source_type TEXT NOT NULL,
    source_tier INT NOT NULL DEFAULT 4,

    -- What this source proves
    supports TEXT[] NOT NULL DEFAULT '{}',
    evidence TEXT,
    confidence TEXT DEFAULT 'medium',

    fetched_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_font_sources_research_id ON font_sources(research_id);


-- 3. research_jobs — Reliable job queue
CREATE TABLE IF NOT EXISTS research_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    font_id UUID NOT NULL REFERENCES fonts(id) ON DELETE CASCADE,

    status TEXT DEFAULT 'queued',
    trigger_type TEXT DEFAULT 'upload',
    triggered_by UUID,

    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_research_jobs_status ON research_jobs(status);
CREATE INDEX IF NOT EXISTS idx_research_jobs_font_id ON research_jobs(font_id);

-- Prevent duplicate active jobs for the same font
CREATE UNIQUE INDEX IF NOT EXISTS idx_research_jobs_active
    ON research_jobs(font_id)
    WHERE status IN ('queued', 'processing');


-- 4. Add minimal columns to fonts table
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS research_status TEXT DEFAULT 'pending';
ALTER TABLE fonts ADD COLUMN IF NOT EXISTS font_file_hash TEXT;
