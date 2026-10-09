# NoBadFonts AI Font Processing: Technical Audit and Implementation Plan

**Status:** Proposed; implementation not yet started  
**Scope:** Safe redesign of scripts/process-ai-fonts.js with Gemini-assisted classification  
**Decision record:** PRD v1.0 approved by the maintainer on 2026-10-09  
**Safety boundary:** This document-only change does not modify production data, Storage, queue statuses, or runtime workflows.

## 1. Approved decisions

- Extract technical metadata locally; call Gemini only for ambiguous grouping or classification.
- Flag unresolved cases for review rather than publishing guesses.
- Test with Fraunces, Mona Sans, and the saved seven-archive discovery report.
- Keep production uploads and database writes disabled until isolated publishing tests pass.
- Reuse the existing schema unless a proven requirement justifies a reviewed migration.

## 2. Read-only audit findings

### Existing processor: scripts/process-ai-fonts.js

The current processor reads font_processing_queue records with pending/error status, immediately changes each selected queue item to processing, downloads configured release ZIPs, extracts files using unzip, and groups files primarily by filename-derived variant names.

It keeps only the first encountered file for each extension in a variant group, attempts to generate WOFF2 when missing, uploads to the fonts Storage bucket with upsert enabled, inserts/updates font_variants rows, and finally changes the queue status to completed or completed_with_warnings.

**Risks to address:**

1. Filename heuristics are the primary classification source; reliable binary metadata is not used in this processor.
2. The first-file-per-extension rule can discard distinct assets from overlapping packages or directories.
3. Grouping solely by inferred variant label can merge unrelated files or split equivalent styles.
4. The processor performs Storage and database writes during processing; there is no dry-run boundary.
5. Queue state is changed before validation and upload completion.
6. ZIP failures can be skipped while processing continues, potentially creating partial results.
7. Storage uploads and database writes are separate operations. A failure can leave orphaned objects or partially persisted variants.
8. URL normalization and archive extraction paths need security review, explicit size/time limits, and safe subprocess argument handling.
9. Retries can repeat side effects; deterministic asset identities and explicit reconciliation are not currently established.
10. Existing output uses variant_name plus optional ttf_url, otf_url, woff_url, woff2_url, and per-format size fields. Preserve this contract unless tests demonstrate a necessary schema change.

### Read-only discovery: scripts/discover-font-assets.js

The discovery script provides a valuable foundation:

- Reads queue items and downloads configured archives.
- Validates ZIP entry paths before extraction.
- Inventories supported font extensions and calculates SHA-256 hashes.
- Records source paths, sizes, filename-based style guesses, and available OpenType metadata.
- Writes a report without changing queue status, inserting/updating font rows, or uploading assets.
- Uses opentype.js for formats it can parse; WOFF2 metadata parsing is currently disabled.

The report's filename style guesses are heuristic and must not be treated as authoritative. WOFF2 metadata support and variable-font axis coverage need separate investigation before being used for final classification.

**Documentation discrepancy:** docs/font-asset-discovery.md says the default archive cap is 150 MiB, while the current script's default is 700 MiB. Update the documentation in a separate reviewed change when appropriate.

### GitHub Actions: .github/workflows/process-ai-fonts.yml

- Runs on a ten-minute schedule and can be manually triggered.
- Installs Node.js 18, woff2, and unzip.
- Supplies the Supabase URL and service-role key to the production processor.
- Runs node scripts/process-ai-fonts.js without an explicit mode.

This workflow is a production-write path. It must not be repurposed for AI/dry-run development until mode enforcement is implemented and tested. The scheduled production path must remain unchanged during initial development.

### Frontend contract: src/components/fonts/VariantList.tsx

The UI reads each variant's variant_name and optional URLs for TTF, OTF, WOFF, and WOFF2. It renders a download action only when the corresponding URL exists. The processor must preserve that shape and avoid placing unrelated files into the same format field.

### Current Supabase schema (read-only inspection)

- public.fonts contains the main font records, including unique slug, name, designer, taxonomy, weights, has_italic, and legacy top-level format URL/size columns.
- public.font_variants references fonts.id and contains variant_name, optional format URLs, optional per-format file sizes, and order_index.
- public.font_processing_queue references fonts.id and contains download_urls, status, and error_message.
- The inspected schema does not expose a natural unique constraint on (font_id, variant_name); the current processor queries for an existing row and then inserts or updates. Concurrent runs could race without additional safeguards.
- No schema migration is proposed by this audit. First implement deterministic planning and validation against the existing contract; only propose a migration if a concrete requirement cannot be met safely.

No production database rows or Storage objects were changed during this audit.

## 3. Target architecture

Keep stages independently testable and make publishing a separate, explicitly gated boundary.

1. **Archive inventory:** safely download/extract archives; inventory every font file; preserve archive and relative-path provenance.
2. **File identity:** calculate SHA-256 and deduplicate byte-identical assets only. Different hashes remain separate inventory records even if names/extensions match.
3. **Local metadata:** extract family, subfamily, full/PostScript names, weight class, italic flags, width class where available, variable axes, glyph count, format, size, and parser status.
4. **Deterministic grouping:** use reliable metadata and documented rules first; retain conflicting evidence rather than silently resolving it.
5. **Gemini classification:** send compact structured metadata only for unresolved grouping/classification questions. Require JSON conforming to a versioned schema and references to known inventory IDs.
6. **Validation:** reject unknown IDs, unsupported values, duplicate mappings, conflicting format assignments, missing required metadata, and unresolved high-risk cases.
7. **Dry-run report:** show proposed family/variant groupings, assets per format, duplicates, warnings, skipped files, confidence/review status, and planned writes. No Storage or database writes.
8. **Publisher (later phase):** only after isolated tests pass, upload verified assets, upsert variant records safely, verify persisted URLs, reconcile partial failures, and update queue status last.

## 4. Gemini contract and controls

Gemini must not parse font binaries or invent technical facts. It should only resolve ambiguous grouping/classification from locally extracted evidence.

The request should include:
- A stable inventory ID and SHA-256 reference for each candidate file.
- Relative source path, extension, file size, and extracted metadata.
- The specific ambiguity requiring a decision.
- Allowed labels and a versioned JSON response schema.

The response should identify selected inventory IDs, proposed grouping/variant labels, evidence references, and uncertainty/review reasons. The local validator remains authoritative.

Controls:
- API key stored only in GitHub Actions secrets or an appropriate local environment variable.
- Bounded request size, timeout, retry count, and rate limits.
- Cache results by normalized input plus prompt/schema version.
- Retry transient failures only; malformed responses must be rejected.
- If Gemini is unavailable, retain safe deterministic results and mark unresolved cases for review.
- Never include secrets, signed query parameters, or unnecessary user data in reports.

## 5. Implementation phases

### Phase 1 — Read-only audit and test fixtures
- Preserve discovery reports and define a compact, sanitized fixture set.
- Document current DB/frontend contract and known failure modes.
- Confirm the active workflow, Node runtime, required system tools, and dependency availability.
- No runtime behavior changes or production writes.

### Phase 2 — Deterministic core
- Extract reusable inventory, hashing, metadata normalization, variant normalization, and validation modules.
- Ensure multiple files per extension are retained until proven identical or intentionally excluded.
- Add safe archive handling, configurable resource limits, and bounded downloads.
- Add unit tests for filename parsing, metadata precedence, variable fonts, deduplication, and invalid archives.

### Phase 3 — Gemini classifier
- Add a small provider module with explicit request/response schema.
- Add caching, timeouts, bounded retries, and uncertainty handling.
- Test with recorded metadata fixtures; no production credentials or writes required for unit tests.

### Phase 4 — Dry-run planner
- Add an explicit read-only mode that emits a machine-readable report and readable summary.
- Prove via tests that dry-run never invokes Storage upload, database insert/update, or queue-status update methods.
- Compare planned output with the existing discovery report and expected Fraunces/Mona Sans classifications.

### Phase 5 — Isolated publisher
- Use a non-production Supabase environment or isolated test bucket/schema.
- Add stable asset paths, idempotent upserts, post-write verification, and recovery for partial failures.
- Evaluate whether database uniqueness or a transaction/RPC is required; propose any migration separately with rationale.
- Test repeated runs and injected failures.

### Phase 6 — Controlled production rollout
- Submit implementation through a separate reviewable PR after tests pass.
- Preserve the existing scheduled workflow until the new implementation is approved.
- Introduce an explicit publishing gate and verify manual and scheduled workflow behavior.
- Enable production only after isolated publish tests and maintainer review.

## 6. Test matrix and acceptance criteria

| Scenario | Expected result |
|---|---|
| Same bytes in overlapping archives | One canonical asset identity; all source paths retained |
| Same extension, different hashes | Both assets remain in inventory; no silent first-file discard |
| Filename conflicts with binary metadata | Binary evidence wins for technical fields; conflict is reported |
| Variable font | Axes/ranges preserved; not automatically expanded into static variants |
| WOFF2 metadata parser unavailable | File remains inventoried; technical fields remain unknown rather than guessed |
| Gemini malformed JSON or unknown asset ID | Response rejected; affected classification marked for review |
| Gemini quota/network failure | Bounded retries, then safe fallback or review status |
| Archive traversal or oversized archive | Rejected before unsafe extraction/resource exhaustion |
| One archive download fails | Job is not presented as fully successful; missing coverage is explicit |
| Storage upload fails | Queue is not marked complete; retry/reconciliation is possible |
| Database write fails after upload | Partial state is detectable and recoverable |
| Same queue item processed twice | No duplicate variants/assets or inconsistent state |
| Dry run | Zero Storage writes, DB mutations, and queue-status updates |
| Frontend rendering | Existing variant download UI still sees the expected fields |
| Secrets in logs/artifacts | None |

Test sequence:
1. Unit tests for deterministic utilities and validators.
2. Regression fixtures from the saved seven-archive discovery report.
3. Fraunces test focused on weight/style disagreements such as Fraunces144pt-BlackItalic.otf.
4. Mona Sans family/style and package-overlap test.
5. Fault-injection tests for parser, Gemini, network, upload, and database failures.
6. Isolated publish test and retry test.
7. Final workflow/security review before any production rollout.

The seven-archive report previously inventoried 1,485 font files. Archive overlap means this is an inventory count, not an expected count of unique final assets.

## 7. Risks and decisions still to verify

- Whether opentype.js adequately handles required metadata across TTF/OTF/WOFF and which additional library/tool is needed for WOFF2 and variable axes.
- Whether generated WOFF2 files are required or should be a separately tested, opt-in conversion.
- Whether a database unique constraint or server-side transaction is needed for concurrent queue workers.
- Whether the existing queue schema has status values or trigger behavior not visible from table columns alone.
- How the saved discovery artifact should be made available to regression tests without committing a large report or exposing signed URLs.
- Whether all archive downloads can be bounded and verified before extraction.

Answer these with fixtures and read-only inspection before schema changes or production writes.

## 8. Definition of done

- Technical facts are extracted locally wherever possible.
- Gemini is called only for unresolved classification/grouping decisions.
- Uncertain outputs require review.
- No valid distinct file is discarded because of extension collision.
- Dry-run is proven side-effect-free.
- Fraunces, Mona Sans, and saved discovery fixtures pass regression tests.
- Existing frontend and database contracts remain compatible or any required migration is separately justified and reviewed.
- Isolated publishing, retries, and partial-failure recovery pass before production is enabled.
- Secrets never appear in source, logs, or artifacts.
- Production writes remain disabled until explicit release approval.

## 9. Immediate next task

Implement Phase 2's deterministic core and tests on a dedicated branch, without modifying the production workflow or Supabase data. Integrate Gemini only after local metadata/grouping tests establish a trustworthy baseline.
