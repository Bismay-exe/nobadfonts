# Font processing production safety audit

Stage 4 safety hardening. Production publishing remains disabled pending Stage 5 isolated publishing tests.

## Risks found and addressed

- The production queue workflow previously ran every ten minutes with a service-role key. Its schedule is removed and the job is disabled pending approval of the publishing gate.
- Direct execution of `scripts/process-ai-fonts.js` now requires both `--apply` and `FONT_PROCESSING_ALLOW_WRITES=true`.
- Concurrent workers could claim the same pending/error item. Claims now conditionally update the observed status.
- Filename grouping silently discarded the second file for a guessed variant/format. Such collisions now fail closed before upload.
- Partial archive failures could publish only the successfully downloaded subset. Any archive failure now aborts before uploads.
- Queue status writes were unchecked. Status transitions now require the item to remain in `processing` and failures are surfaced.
- Partial processing now uses the documented `error` status instead of `completed_with_warnings`.

## Remaining release blockers for Stage 5

- Supabase Storage uploads and `font_variants` row writes are not transactional. Partial failures can leave uploaded objects without a matching database update; Stage 5 must validate staging, publication, rollback and reconciliation before enabling writes.
- Filename-derived grouping remains non-authoritative; isolated tests must validate the metadata-driven plan.
- There is no attempt counter/backoff/dead-letter policy. Automatic retries remain disabled until this is specified.
- No production database writes, Storage uploads, or Gemini requests were performed during this stage.
