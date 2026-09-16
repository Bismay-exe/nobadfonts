-- ============================================================
-- NoBadFonts MCP — Phase 4: Publishing, Rollback & Audit Logs
-- Run in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Create audit_logs table for immutable tracking of all production mutations
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL, -- 'publish_font_revision', 'reject_font_revision', 'rollback_font_revision', 'approve_font_revision'
    font_id UUID NOT NULL REFERENCES fonts(id) ON DELETE CASCADE,
    revision_id UUID REFERENCES font_revisions(id) ON DELETE SET NULL,
    changed_fields TEXT[] NOT NULL DEFAULT '{}',
    before_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    after_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    before_state_hash TEXT,
    after_state_hash TEXT,
    reason TEXT,
    performed_by TEXT NOT NULL DEFAULT 'mcp',
    client_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_font_id ON audit_logs(font_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_revision_id ON audit_logs(revision_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable Row Level Security: audit_logs are internal to MCP / admins
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Add base_state_hash and after_state_hash to font_revisions
ALTER TABLE font_revisions ADD COLUMN IF NOT EXISTS base_state_hash TEXT;
ALTER TABLE font_revisions ADD COLUMN IF NOT EXISTS after_state_hash TEXT;

-- 3. Atomic Database Function: publish_font_revision_tx
-- Executes publication inside a single transaction with row-level locks
CREATE OR REPLACE FUNCTION publish_font_revision_tx(
    p_revision_id UUID,
    p_expected_base_hash TEXT,
    p_published_by TEXT DEFAULT 'mcp-authorized-reviewer',
    p_reason TEXT DEFAULT NULL,
    p_client_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rev RECORD;
    v_font RECORD;
    v_research RECORD;
    v_before_state JSONB;
    v_after_state JSONB;
    v_changed_fields TEXT[];
    v_new_tax JSONB;
    v_research_id UUID;
    v_source RECORD;
BEGIN
    -- 1. Lock and load revision
    SELECT * INTO v_rev
    FROM font_revisions
    WHERE id = p_revision_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Revision % not found.', p_revision_id;
    END IF;

    -- 2. Enforce Approval Gate: Must be 'approved'
    IF v_rev.status != 'approved' THEN
        RAISE EXCEPTION 'Revision % must be approved before publishing. Current status: %', p_revision_id, v_rev.status;
    END IF;

    -- 3. Lock target font row
    SELECT * INTO v_font
    FROM fonts
    WHERE id = v_rev.font_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target font % not found.', v_rev.font_id;
    END IF;

    -- 4. Concurrency Protection Check
    IF v_rev.base_state_hash IS NOT NULL AND p_expected_base_hash != v_rev.base_state_hash THEN
        RAISE EXCEPTION 'Concurrency conflict: Target font state has changed since proposal was generated. Publication blocked.';
    END IF;

    -- 5. Capture existing research
    SELECT * INTO v_research
    FROM font_research
    WHERE font_id = v_rev.font_id;

    -- 6. Build complete before_state snapshot across all affected tables
    v_before_state := jsonb_build_object(
        'font', row_to_json(v_font),
        'research', CASE WHEN v_research.id IS NOT NULL THEN row_to_json(v_research) ELSE NULL END,
        'sources', (
            SELECT COALESCE(jsonb_agg(row_to_json(s)), '[]'::jsonb)
            FROM font_sources s
            WHERE s.research_id = v_research.id
        )
    );

    v_new_tax := v_rev.proposed_taxonomy;

    -- 7. Update canonical fonts row
    UPDATE fonts
    SET
        name = COALESCE(v_new_tax->'identity'->>'name', name),
        designer = COALESCE(v_new_tax->'creator'->>'designer', designer),
        category = COALESCE(v_new_tax->'classification'->>'category', category),
        tags = CASE
            WHEN v_new_tax->'classification'->'tags' IS NOT NULL AND jsonb_typeof(v_new_tax->'classification'->'tags') = 'array'
            THEN (SELECT COALESCE(array_agg(x), '{}') FROM jsonb_array_elements_text(v_new_tax->'classification'->'tags') x)
            ELSE tags
        END,
        description = COALESCE(v_new_tax->'description'->>'description', description),
        license_type = COALESCE(v_new_tax->'license'->>'license_type', license_type),
        commercial_use = COALESCE((v_new_tax->'license'->>'commercial_use')::boolean, commercial_use),
        updated_at = now()
    WHERE id = v_rev.font_id;

    -- 8. Upsert font_research with verified attributes AND the full canonical taxonomy in font_metadata_extracted
    INSERT INTO font_research (
        font_id,
        foundry,
        designer_verified,
        official_website,
        official_font_page,
        purchase_url,
        free_download_url,
        license_url,
        license_type_verified,
        commercial_use_verified,
        personal_use_verified,
        license_evidence,
        ai_description,
        font_metadata_extracted,
        research_status,
        confidence,
        updated_at
    )
    VALUES (
        v_rev.font_id,
        v_new_tax->'creator'->>'foundry',
        v_new_tax->'creator'->>'designer',
        v_new_tax->'official_links'->>'official_website',
        v_new_tax->'official_links'->>'official_font_page',
        v_new_tax->'official_links'->>'purchase_url',
        v_new_tax->'official_links'->>'free_download_url',
        v_new_tax->'license'->>'license_url',
        v_new_tax->'license'->>'license_type',
        (v_new_tax->'license'->>'commercial_use')::boolean,
        (v_new_tax->'license'->>'personal_use')::boolean,
        v_new_tax->'license'->>'license_evidence',
        v_new_tax->'description'->>'description',
        jsonb_build_object('taxonomy', v_new_tax),
        'verified',
        'high',
        now()
    )
    ON CONFLICT (font_id) DO UPDATE SET
        foundry = EXCLUDED.foundry,
        designer_verified = EXCLUDED.designer_verified,
        official_website = EXCLUDED.official_website,
        official_font_page = EXCLUDED.official_font_page,
        purchase_url = EXCLUDED.purchase_url,
        free_download_url = EXCLUDED.free_download_url,
        license_url = EXCLUDED.license_url,
        license_type_verified = EXCLUDED.license_type_verified,
        commercial_use_verified = EXCLUDED.commercial_use_verified,
        personal_use_verified = EXCLUDED.personal_use_verified,
        license_evidence = EXCLUDED.license_evidence,
        ai_description = EXCLUDED.ai_description,
        font_metadata_extracted = EXCLUDED.font_metadata_extracted,
        research_status = 'verified',
        confidence = 'high',
        updated_at = now()
    RETURNING id INTO v_research_id;

    -- 9. Additive Upsert on font_sources (Preserves existing sources)
    IF v_rev.source_snapshot IS NOT NULL AND jsonb_array_length(v_rev.source_snapshot) > 0 THEN
        FOR v_source IN SELECT * FROM jsonb_to_recordset(v_rev.source_snapshot) AS x(
            url TEXT,
            source_type TEXT,
            confidence TEXT,
            is_official BOOLEAN,
            evidence TEXT,
            supports TEXT[]
        )
        LOOP
            IF v_source.url IS NOT NULL THEN
                -- Check if source URL already exists for this research_id
                IF EXISTS (SELECT 1 FROM font_sources WHERE research_id = v_research_id AND url = v_source.url) THEN
                    UPDATE font_sources
                    SET
                        source_type = COALESCE(v_source.source_type, source_type),
                        confidence = COALESCE(v_source.confidence, confidence),
                        evidence = COALESCE(v_source.evidence, evidence),
                        supports = COALESCE(v_source.supports, supports)
                    WHERE research_id = v_research_id AND url = v_source.url;
                ELSE
                    INSERT INTO font_sources (
                        research_id,
                        url,
                        source_type,
                        source_tier,
                        confidence,
                        evidence,
                        supports
                    )
                    VALUES (
                        v_research_id,
                        v_source.url,
                        COALESCE(v_source.source_type, 'secondary_source'),
                        CASE WHEN v_source.is_official THEN 2 ELSE 4 END,
                        COALESCE(v_source.confidence, 'medium'),
                        v_source.evidence,
                        COALESCE(v_source.supports, '{}'::text[])
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;

    -- 10. Extract changed fields from diff_summary
    v_changed_fields := ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(v_rev.diff_summary->'changed_fields', '[]'::jsonb))
    );

    -- 11. Build after_state snapshot
    SELECT * INTO v_font FROM fonts WHERE id = v_rev.font_id;
    SELECT * INTO v_research FROM font_research WHERE font_id = v_rev.font_id;

    v_after_state := jsonb_build_object(
        'font', row_to_json(v_font),
        'research', row_to_json(v_research),
        'sources', (
            SELECT COALESCE(jsonb_agg(row_to_json(s)), '[]'::jsonb)
            FROM font_sources s
            WHERE s.research_id = v_research_id
        )
    );

    -- 12. Mark current revision as 'published' and store after_state_hash
    UPDATE font_revisions
    SET
        status = 'published',
        published_at = now(),
        published_by = p_published_by,
        after_state_hash = md5(v_after_state::text)
    WHERE id = p_revision_id;

    -- 13. Mark conflicting pending revisions for this font as 'superseded'
    UPDATE font_revisions
    SET
        status = 'superseded',
        rejection_reason = 'Superseded by published revision ' || p_revision_id::text
    WHERE font_id = v_rev.font_id
      AND id != p_revision_id
      AND status IN ('pending_review', 'approved');

    -- 14. Write immutable audit log entry
    INSERT INTO audit_logs (
        action,
        font_id,
        revision_id,
        changed_fields,
        before_state,
        after_state,
        before_state_hash,
        after_state_hash,
        reason,
        performed_by,
        client_metadata
    )
    VALUES (
        'publish_font_revision',
        v_rev.font_id,
        p_revision_id,
        v_changed_fields,
        v_before_state,
        v_after_state,
        p_expected_base_hash,
        md5(v_after_state::text),
        p_reason,
        p_published_by,
        p_client_metadata
    );

    RETURN jsonb_build_object(
        'success', true,
        'revision_id', p_revision_id,
        'font_id', v_rev.font_id,
        'changed_fields', v_changed_fields,
        'after_state_hash', md5(v_after_state::text),
        'published_at', now()
    );
END;
$$;


-- 4. Atomic Database Function: rollback_font_revision_tx
-- Restores complete before_state snapshot with concurrency check
CREATE OR REPLACE FUNCTION rollback_font_revision_tx(
    p_revision_id UUID,
    p_performed_by TEXT DEFAULT 'mcp-authorized-reviewer',
    p_reason TEXT DEFAULT 'Rollback requested'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log RECORD;
    v_font RECORD;
    v_research RECORD;
    v_current_after_hash TEXT;
    v_before_font JSONB;
    v_before_research JSONB;
BEGIN
    -- 1. Find publish audit log for this revision
    SELECT * INTO v_log
    FROM audit_logs
    WHERE revision_id = p_revision_id
      AND action = 'publish_font_revision'
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No publish audit log found for revision %.', p_revision_id;
    END IF;

    -- 2. Lock target font row
    SELECT * INTO v_font
    FROM fonts
    WHERE id = v_log.font_id
    FOR UPDATE;

    SELECT * INTO v_research
    FROM font_research
    WHERE font_id = v_log.font_id;

    -- 3. Rollback Concurrency Check:
    -- Verify current live state matches the revision's after_state_hash.
    -- If a newer revision was published afterward, block rollback to avoid clobbering newer changes!
    v_current_after_hash := md5(
        jsonb_build_object(
            'font', row_to_json(v_font),
            'research', row_to_json(v_research),
            'sources', (
                SELECT COALESCE(jsonb_agg(row_to_json(s)), '[]'::jsonb)
                FROM font_sources s
                WHERE s.research_id = v_research.id
            )
        )::text
    );

    IF v_current_after_hash != v_log.after_state_hash THEN
        RAISE EXCEPTION 'Rollback blocked: Font state has been modified by a newer revision or edit since revision % was published. Cannot cleanly revert without overwriting newer data.', p_revision_id;
    END IF;

    -- 4. Restore complete before_state for fonts
    v_before_font := v_log.before_state->'font';
    IF v_before_font IS NOT NULL THEN
        UPDATE fonts
        SET
            name = v_before_font->>'name',
            designer = v_before_font->>'designer',
            category = v_before_font->>'category',
            tags = (SELECT array_agg(x) FROM jsonb_array_elements_text(COALESCE(v_before_font->'tags', '[]'::jsonb)) x),
            description = v_before_font->>'description',
            license_type = v_before_font->>'license_type',
            commercial_use = (v_before_font->>'commercial_use')::boolean,
            updated_at = now()
        WHERE id = v_log.font_id;
    END IF;

    -- 5. Restore complete before_state for font_research
    v_before_research := v_log.before_state->'research';
    IF v_before_research IS NOT NULL AND v_before_research != 'null'::jsonb THEN
        UPDATE font_research
        SET
            foundry = v_before_research->>'foundry',
            designer_verified = v_before_research->>'designer_verified',
            official_website = v_before_research->>'official_website',
            official_font_page = v_before_research->>'official_font_page',
            purchase_url = v_before_research->>'purchase_url',
            free_download_url = v_before_research->>'free_download_url',
            license_url = v_before_research->>'license_url',
            license_type_verified = v_before_research->>'license_type_verified',
            commercial_use_verified = (v_before_research->>'commercial_use_verified')::boolean,
            personal_use_verified = (v_before_research->>'personal_use_verified')::boolean,
            license_evidence = v_before_research->>'license_evidence',
            ai_description = v_before_research->>'ai_description',
            font_metadata_extracted = v_before_research->'font_metadata_extracted',
            research_status = COALESCE(v_before_research->>'research_status', 'pending'),
            confidence = COALESCE(v_before_research->>'confidence', 'medium'),
            updated_at = now()
        WHERE font_id = v_log.font_id;
    END IF;

    -- 6. Write rollback audit event
    INSERT INTO audit_logs (
        action,
        font_id,
        revision_id,
        changed_fields,
        before_state,
        after_state,
        before_state_hash,
        after_state_hash,
        reason,
        performed_by
    )
    VALUES (
        'rollback_font_revision',
        v_log.font_id,
        p_revision_id,
        v_log.changed_fields,
        v_log.after_state,
        v_log.before_state,
        v_log.after_state_hash,
        v_log.before_state_hash,
        p_reason,
        p_performed_by
    );

    RETURN jsonb_build_object(
        'success', true,
        'rolled_back_revision_id', p_revision_id,
        'font_id', v_log.font_id,
        'restored_at', now()
    );
END;
$$;
