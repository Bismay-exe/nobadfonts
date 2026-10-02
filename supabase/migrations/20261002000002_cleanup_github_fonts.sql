-- Cleanup deprecated tables and functions from the automated GitHub discovery pipeline

DROP FUNCTION IF EXISTS publish_font_candidate_tx(UUID, UUID, TEXT);

DROP TABLE IF EXISTS font_scan_jobs CASCADE;
DROP TABLE IF EXISTS font_discovery_runs CASCADE;
DROP TABLE IF EXISTS font_candidates CASCADE;
DROP TABLE IF EXISTS github_font_repositories CASCADE;
