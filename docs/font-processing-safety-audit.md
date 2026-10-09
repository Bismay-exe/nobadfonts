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


## Stage 5: isolated publishing protocol

The new `scripts/font-processing/publishing-protocol.js` is dependency-injected and tested with in-memory adapters only. It validates asset bytes against SHA-256 and size before side effects, stages all assets under batch-specific keys, verifies staged hashes/sizes, and only then calls an idempotent publisher. Retries are bounded (default 3, maximum 5) with bounded exponential delay.

A staging failure cleans up only known keys from the current batch. Cleanup failure is recorded as `reconciliation_required`. After database publication starts, network failures can be ambiguous, so staging objects are retained pending idempotency-key reconciliation rather than risking deletion of referenced assets.

**Release blocker remains:** this is the tested protocol contract, not a production Supabase adapter. The legacy processor has not yet been migrated to deterministic metadata-driven rows, and no atomic transaction RPC is wired. The production workflow remains statically disabled. These tests do not authorize production writes, Storage uploads, or Gemini requests.


## Stage 5: concrete adapter and atomic transaction

Added a dependency-injected Supabase Storage adapter and a migration defining a durable publishing ledger plus `publish_font_processing_batch`. The RPC changes `font_variants` and marks the batch committed in one PostgreSQL transaction, validates idempotency key, manifest hash, staging prefix, public URL, font ID, format, and size, and rejects reusing a batch ID with a different manifest. Audit updates cannot downgrade a committed batch.

The adapter uploads with `upsert: false`, reads staged objects back to verify SHA-256 and size, then calls the atomic RPC. The migration is committed to this feature branch only and has not been applied to any Supabase project. CI adds a disposable PostgreSQL 17 integration job for successful commit, idempotent replay, and rollback on an invalid later row. Adapter behavior is tested with mocked Storage/RPC.

**Still not production-ready:** `process-ai-fonts.js` is not yet wired to this adapter or the deterministic metadata plan. Keep the production workflow disabled; do not apply the migration to production. An isolated Supabase staging-project test remains required before enabling publishing.


## Stage 5 follow-up: deterministic publish-plan runner

Added `scripts/font-processing/publish-plan.js` as a separate, opt-in path that converts a metadata manifest into the atomic publisher's rows using `deduplicateAssets` and `planVariantGroups`. It requires explicit `font_ids` mappings keyed by embedded family name, verifies each file's actual SHA-256 and byte size, deduplicates byte-identical assets, and blocks all writes if any asset needs review, a variant/format collision exists, or a family mapping is missing. It never guesses metadata from filenames.

Run it without `--apply` first; this is a local dry run and does not create a Supabase client. An apply run still requires both `--apply` and `FONT_PROCESSING_ALLOW_WRITES=true`, plus `FONT_PROCESSING_TARGET=staging`, `FONT_PROCESSING_STAGING_SUPABASE_URL`, and `FONT_PROCESSING_STAGING_SERVICE_ROLE_KEY`. The runner does not fall back to the production `VITE_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`; it uses the staged-object protocol and atomic publish RPC. Example manifest shape:

```json
{
  "batch_id": "reviewed-batch-001",
  "font_ids": {
    "Mona Sans": "11111111-1111-4111-8111-111111111111"
  },
  "assets": [
    {
      "file_path": "assets/mona-sans-regular.woff2",
      "metadata": {
        "family_name": "Mona Sans",
        "subfamily_name": "Regular",
        "weight_class": 400,
        "is_italic": false,
        "is_variable": false,
        "glyph_count": 500,
        "status": "parsed"
      }
    }
  ]
}
```

Command: `node scripts/font-processing/publish-plan.js ./manifest.json`

The runner is intentionally separate from the legacy live queue processor. It does not claim Stage 5 release completion: the production queue workflow remains statically disabled, the migration remains unapplied, and a real isolated Supabase staging-project test of Storage + RPC retries/reconciliation is still required. No production writes, uploads, or Gemini calls are authorized by these changes.
