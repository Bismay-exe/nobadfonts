-- ============================================================
-- NoBadFonts — GitHub Font Discovery Pipeline
-- Phase 1: Database Foundation
-- Created: 2026-10-01
-- Tables:
--   github_font_repositories  — one record per GitHub repo
--   font_candidates           — one record per discovered font family
--   font_discovery_runs       — audit log per discovery cron/admin run
--   font_scan_jobs            — durable job queue for Python scanner worker
-- ============================================================

-- Note: update_updated_at_column() is already defined in 20260917_mcp_rbac.sql

-- ============================================================
-- TABLE 1: github_font_repositories
-- ============================================================

CREATE TABLE IF NOT EXISTS github_font_repositories (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- GitHub's stable numeric repo ID — canonical identity key
    github_repo_id          BIGINT      UNIQUE NOT NULL,
    owner                   TEXT        NOT NULL,
    repo_name               TEXT        NOT NULL,
    full_name               TEXT        NOT NULL,
    html_url                TEXT        NOT NULL,
    default_branch          TEXT        NOT NULL DEFAULT 'main',
    is_fork                 BOOLEAN     NOT NULL DEFAULT false,
    is_archived             BOOLEAN     NOT NULL DEFAULT false,
    stars_count             INT         DEFAULT 0,
    last_commit_sha         TEXT,
    last_scanned_commit_sha TEXT,
    last_scanned_at         TIMESTAMPTZ,
    discovery_query         TEXT,
    first_discovered_at     TIMESTAMPTZ DEFAULT now(),
    last_seen_at            TIMESTAMPTZ DEFAULT now(),
    scan_status             TEXT        NOT NULL DEFAULT 'queued'
        CHECK (scan_status IN ('queued', 'scanning', 'scanned', 'failed', 'skipped', 'no_fonts')),
    last_error              TEXT,
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gfr_scan_status    ON github_font_repositories(scan_status);
CREATE INDEX IF NOT EXISTS idx_gfr_last_seen_at   ON github_font_repositories(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_gfr_github_repo_id ON github_font_repositories(github_repo_id);

ALTER TABLE github_font_repositories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gfr_select_admin"
    ON github_font_repositories FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY "gfr_insert_admin"
    ON github_font_repositories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY "gfr_update_admin"
    ON github_font_repositories FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE TRIGGER set_gfr_updated_at
    BEFORE UPDATE ON github_font_repositories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE 2: font_candidates
-- One record per discovered font FAMILY (not per repository).
-- ============================================================

CREATE TABLE IF NOT EXISTS font_candidates (
    id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id             UUID        NOT NULL REFERENCES github_font_repositories(id) ON DELETE CASCADE,

    family_name               TEXT        NOT NULL,
    slug_candidate            TEXT,
    description_extracted     TEXT,
    designer_name             TEXT,
    foundry_name              TEXT,
    official_url              TEXT,
    repository_path           TEXT        DEFAULT '',
    font_metadata             JSONB       DEFAULT '{}'::jsonb,
    font_file_manifest        JSONB       DEFAULT '[]'::jsonb,

    license_name              TEXT,
    license_identifier        TEXT,
    license_category          TEXT        CHECK (license_category IN ('open', 'commercial', 'unknown', 'custom')),
    license_text_url          TEXT,
    license_evidence          TEXT,
    license_status            TEXT        NOT NULL DEFAULT 'not_checked'
        CHECK (license_status IN ('verified', 'uncertain', 'missing', 'conflicting', 'not_checked')),

    validation_status         TEXT        NOT NULL DEFAULT 'pending'
        CHECK (validation_status IN ('pending', 'passed', 'warnings', 'failed')),
    validation_warnings       JSONB       DEFAULT '[]'::jsonb,

    duplicate_of_font_id      UUID        REFERENCES fonts(id),
    duplicate_of_candidate_id UUID        REFERENCES font_candidates(id),

    status                    TEXT        NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'scanning', 'needs_review', 'approved', 'rejected', 'duplicate', 'scan_failed')),

    reviewed_by               UUID        REFERENCES profiles(id),
    reviewed_at               TIMESTAMPTZ,
    review_notes              TEXT,
    rejection_reason          TEXT,
    published_font_id         UUID        REFERENCES fonts(id),

    created_at                TIMESTAMPTZ DEFAULT now(),
    updated_at                TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fc_status         ON font_candidates(status);
CREATE INDEX IF NOT EXISTS idx_fc_license_status ON font_candidates(license_status);
CREATE INDEX IF NOT EXISTS idx_fc_repository_id  ON font_candidates(repository_id);
CREATE INDEX IF NOT EXISTS idx_fc_family_name    ON font_candidates(lower(family_name));

ALTER TABLE font_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fc_select_admin"
    ON font_candidates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY "fc_insert_admin"
    ON font_candidates FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY "fc_update_admin"
    ON font_candidates FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE TRIGGER set_fc_updated_at
    BEFORE UPDATE ON font_candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE 3: font_discovery_runs
-- ============================================================

CREATE TABLE IF NOT EXISTS font_discovery_runs (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_type          TEXT        NOT NULL DEFAULT 'cron'
        CHECK (trigger_type IN ('cron', 'admin')),
    triggered_by          UUID        REFERENCES profiles(id),
    started_at            TIMESTAMPTZ DEFAULT now(),
    finished_at           TIMESTAMPTZ,
    status                TEXT        NOT NULL DEFAULT 'running'
        CHECK (status IN ('running', 'completed', 'failed', 'partial')),
    queries_executed      INT         DEFAULT 0,
    repositories_seen     INT         DEFAULT 0,
    repositories_added    INT         DEFAULT 0,
    repositories_queued   INT         DEFAULT 0,
    repositories_skipped  INT         DEFAULT 0,
    candidates_created    INT         DEFAULT 0,
    errors_count          INT         DEFAULT 0,
    github_api_calls      INT         DEFAULT 0,
    rate_limit_remaining  INT,
    summary               TEXT,
    error_details         JSONB       DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fdr_status     ON font_discovery_runs(status);
CREATE INDEX IF NOT EXISTS idx_fdr_started_at ON font_discovery_runs(started_at DESC);

ALTER TABLE font_discovery_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fdr_select_admin"
    ON font_discovery_runs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

-- ============================================================
-- TABLE 4: font_scan_jobs
-- ============================================================

CREATE TABLE IF NOT EXISTS font_scan_jobs (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id    UUID        NOT NULL REFERENCES github_font_repositories(id) ON DELETE CASCADE,
    status           TEXT        NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'claimed', 'completed', 'failed', 'cancelled')),
    attempt_count    INT         NOT NULL DEFAULT 0,
    max_attempts     INT         NOT NULL DEFAULT 3,
    available_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    claimed_at       TIMESTAMPTZ,
    claimed_by       TEXT,
    lease_expires_at TIMESTAMPTZ,
    last_error       TEXT,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fsj_claim
    ON font_scan_jobs(status, available_at)
    WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS idx_fsj_repository_id ON font_scan_jobs(repository_id);

ALTER TABLE font_scan_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fsj_select_admin"
    ON font_scan_jobs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE TRIGGER set_fsj_updated_at
    BEFORE UPDATE ON font_scan_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCTION: claim_scan_jobs
-- Atomically claims a bounded batch of queued jobs.
-- Called by the Python worker via Supabase RPC.
-- ============================================================

CREATE OR REPLACE FUNCTION claim_scan_jobs(
    p_worker_id     TEXT,
    p_batch_size    INT DEFAULT 20,
    p_lease_minutes INT DEFAULT 30
)
RETURNS SETOF font_scan_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    UPDATE font_scan_jobs
    SET
        status           = 'claimed',
        claimed_at       = now(),
        claimed_by       = p_worker_id,
        lease_expires_at = now() + (p_lease_minutes || ' minutes')::INTERVAL,
        attempt_count    = attempt_count + 1,
        updated_at       = now()
    WHERE id IN (
        SELECT id FROM font_scan_jobs
        WHERE status = 'queued'
          AND available_at <= now()
        ORDER BY available_at ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
END;
$$;

-- ============================================================
-- FUNCTION: recover_stale_scan_jobs
-- Requeues jobs whose lease expired (worker crash/timeout).
-- ============================================================

CREATE OR REPLACE FUNCTION recover_stale_scan_jobs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT;
BEGIN
    -- Requeue retryable stale jobs with exponential backoff
    UPDATE font_scan_jobs
    SET
        status           = 'queued',
        claimed_at       = NULL,
        claimed_by       = NULL,
        lease_expires_at = NULL,
        available_at     = now() + LEAST(POWER(2, attempt_count), 240) * INTERVAL '1 minute',
        updated_at       = now()
    WHERE status = 'claimed'
      AND lease_expires_at < now()
      AND attempt_count < max_attempts;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Permanently fail jobs that exceeded max_attempts
    UPDATE font_scan_jobs
    SET
        status     = 'failed',
        last_error = 'Exceeded max_attempts after stale lease recovery',
        updated_at = now()
    WHERE status = 'claimed'
      AND lease_expires_at < now()
      AND attempt_count >= max_attempts;

    RETURN v_count;
END;
$$;

-- ============================================================
-- FUNCTION: publish_font_candidate_tx
-- Admin-only: idempotently publishes a candidate into fonts catalog.
-- ============================================================

CREATE OR REPLACE FUNCTION publish_font_candidate_tx(
    p_candidate_id UUID,
    p_published_by UUID,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cand       RECORD;
    v_profile    RECORD;
    v_font_id    UUID;
    v_slug       TEXT;
    v_is_new     BOOLEAN := false;
    v_manifest   JSONB;
    v_first_file JSONB;
BEGIN
    -- 1. Verify caller is admin
    SELECT * INTO v_profile FROM profiles WHERE id = p_published_by FOR SHARE;
    IF NOT FOUND OR v_profile.role != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: caller % is not an admin.', p_published_by;
    END IF;

    -- 2. Lock and load candidate
    SELECT * INTO v_cand FROM font_candidates WHERE id = p_candidate_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Candidate % not found.', p_candidate_id;
    END IF;

    -- 3. Idempotency check
    IF v_cand.published_font_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success',      true,
            'idempotent',   true,
            'font_id',      v_cand.published_font_id,
            'candidate_id', p_candidate_id
        );
    END IF;

    -- 4. Validate required fields
    IF v_cand.family_name IS NULL OR trim(v_cand.family_name) = '' THEN
        RAISE EXCEPTION 'Cannot publish: family_name is required.';
    END IF;
    IF v_cand.license_identifier IS NULL AND v_cand.license_name IS NULL THEN
        RAISE EXCEPTION 'Cannot publish: a license (license_identifier or license_name) is required.';
    END IF;

    -- 5. Build slug
    v_slug := COALESCE(
        v_cand.slug_candidate,
        lower(regexp_replace(trim(v_cand.family_name), '[^a-z0-9]+', '-', 'g'))
    );

    -- 6. Extract primary file URLs from manifest
    v_manifest   := v_cand.font_file_manifest;
    v_first_file := CASE
        WHEN jsonb_array_length(v_manifest) > 0 THEN v_manifest -> 0
        ELSE '{}'::jsonb
    END;

    -- 7. Insert into fonts
    INSERT INTO fonts (
        name, slug, description, designer, category,
        license_type, commercial_use,
        woff2_url, zip_url,
        is_published, research_status, uploaded_by,
        created_at, updated_at
    )
    VALUES (
        v_cand.family_name,
        v_slug,
        v_cand.description_extracted,
        COALESCE(v_cand.designer_name, 'Unknown'),
        COALESCE(v_cand.font_metadata->>'category', 'sans-serif'),
        COALESCE(v_cand.license_identifier, v_cand.license_name, 'Unknown'),
        CASE WHEN v_cand.license_category = 'open' THEN true ELSE false END,
        COALESCE(v_first_file->>'commit_pinned_url', v_first_file->>'raw_url', ''),
        COALESCE(v_first_file->>'commit_pinned_url', v_first_file->>'raw_url', ''),
        false,
        'github_import',
        p_published_by::text,
        now(), now()
    )
    ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description, updated_at = now()
    RETURNING id INTO v_font_id;

    IF v_font_id IS NULL THEN
        SELECT id INTO v_font_id FROM fonts WHERE slug = v_slug;
    ELSE
        v_is_new := true;
    END IF;

    -- 8. Upsert font_research with license evidence
    INSERT INTO font_research (
        font_id, foundry, designer_verified, official_website,
        license_url, license_type_verified, license_evidence,
        font_metadata_extracted, research_status, confidence, updated_at
    )
    VALUES (
        v_font_id, v_cand.foundry_name, v_cand.designer_name, v_cand.official_url,
        v_cand.license_text_url,
        COALESCE(v_cand.license_identifier, v_cand.license_name),
        v_cand.license_evidence, v_cand.font_metadata,
        'github_import', 'medium', now()
    )
    ON CONFLICT (font_id) DO UPDATE SET
        foundry               = EXCLUDED.foundry,
        designer_verified     = EXCLUDED.designer_verified,
        official_website      = EXCLUDED.official_website,
        license_url           = EXCLUDED.license_url,
        license_type_verified = EXCLUDED.license_type_verified,
        license_evidence      = EXCLUDED.license_evidence,
        font_metadata_extracted = EXCLUDED.font_metadata_extracted,
        updated_at            = now();

    -- 9. Mark candidate approved
    UPDATE font_candidates
    SET
        status            = 'approved',
        published_font_id = v_font_id,
        reviewed_by       = p_published_by,
        reviewed_at       = now(),
        review_notes      = p_review_notes,
        updated_at        = now()
    WHERE id = p_candidate_id;

    -- 10. Audit log
    INSERT INTO audit_logs (
        action, font_id, changed_fields, before_state, after_state, performed_by, client_metadata
    )
    VALUES (
        'publish_font_candidate',
        v_font_id,
        ARRAY['name', 'license_type', 'designer', 'category'],
        jsonb_build_object('candidate_id', p_candidate_id, 'status_before', 'needs_review'),
        jsonb_build_object('font_id', v_font_id, 'slug', v_slug, 'is_new_font', v_is_new),
        p_published_by::text,
        jsonb_build_object('source', 'github_discovery', 'repository_id', v_cand.repository_id)
    );

    RETURN jsonb_build_object(
        'success',      true,
        'idempotent',   false,
        'font_id',      v_font_id,
        'slug',         v_slug,
        'is_new_font',  v_is_new,
        'candidate_id', p_candidate_id
    );
END;
$$;
