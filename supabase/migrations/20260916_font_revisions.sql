-- ============================================================
-- NoBadFonts MCP — Phase 3: font_revisions Staging Table
-- Run in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS font_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    font_id UUID NOT NULL REFERENCES fonts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending_review',
    -- Lifecycle: 'draft', 'pending_review', 'approved', 'published', 'rejected', 'superseded'

    -- Explicit Delta vs Complete Candidate State
    proposed_changes JSONB NOT NULL DEFAULT '{}'::jsonb,
    proposed_taxonomy JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Revision Concurrency Protection
    -- Stores SHA-256 of canonical fonts.taxonomy at time of proposal creation.
    -- Phase 4 publishing verifies this hash before applying to prevent overwriting newer edits.
    base_taxonomy_hash TEXT NOT NULL,

    -- Provenance & Evidence Snapshot
    -- Field-level provenance: { [field]: { value, source, source_type, confidence } }
    source_snapshot JSONB DEFAULT '[]'::jsonb,

    -- Computed Diff & Automated Validation Result
    diff_summary JSONB DEFAULT '{}'::jsonb,
    validation_result JSONB DEFAULT '{}'::jsonb,

    -- Review & Proposal Rationale
    rationale TEXT,
    rejection_reason TEXT,

    -- Audit & Security Attribution
    created_by TEXT DEFAULT 'mcp',
    client_metadata JSONB DEFAULT '{}'::jsonb,
    reviewed_by TEXT,
    published_by TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ
);

-- Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_font_revisions_font_id ON font_revisions(font_id);
CREATE INDEX IF NOT EXISTS idx_font_revisions_status ON font_revisions(status);
CREATE INDEX IF NOT EXISTS idx_font_revisions_created_at ON font_revisions(created_at DESC);
