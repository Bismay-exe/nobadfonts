# Deterministic font processing core

This module is an isolated first step toward the AI-assisted font processor. It is not connected to the production queue, Supabase Storage, or database writes.

## Current scope

- Normalize supported font extensions and locally extracted metadata.
- Derive grouping keys only from extracted family/subfamily/weight evidence.
- Deduplicate identical assets by SHA-256 while retaining all archive/path provenance.
- Preserve distinct hashes, even when filenames and extensions match.
- Route ambiguous family/weight naming, unreadable metadata, and missing metadata to review.
- Extract WOFF2 metadata locally with fontTools, including variable axes; parser failures remain review cases.
- Report conflicting assets when a variant has multiple distinct files for the same format.
- Validate discovery reports without changing their source data.

## Run unit tests

Use Node's built-in test runner:

```sh
npm run test:font-processing
```

## Parse WOFF2 metadata locally

The discovery script uses `scripts/font-processing/parse-woff2-metadata.py` for `.woff2` files. The read-only discovery workflow installs Python `fonttools` and `brotli`; parsing runs locally on the downloaded archive file and makes no network calls. It extracts family/subfamily names, weight class, italic/variable flags, glyph count, and variation axes. A parse failure is preserved as a failure, not replaced with filename guesses.

To run it manually, install `fonttools` and `brotli`, then run:

```sh
python3 scripts/font-processing/parse-woff2-metadata.py path/to/font.woff2
```

## Validate real font binaries and the saved Monaspace report

The read-only workflow `.github/workflows/font-processing-real-fixtures.yml` downloads one official Fraunces OTF and one official Mona Sans variable TTF, then downloads the saved seven-archive Monaspace discovery artifact. It produces a `font-processing-validation-results` artifact containing parsed metadata and a dry-run grouping/review summary.

To validate a local discovery report yourself:

```sh
node scripts/font-processing/validate-discovery-report.js path/to/font-discovery-report.json
```

To inspect local font files with the same parser and grouping rules:

```sh
node scripts/font-processing/validate-font-fixtures.js path/to/font.otf path/to/variable-font.ttf
```

## Validation findings (2026-10-09)

- Fraunces' `Fraunces144pt-BlackItalic.otf` has binary metadata `family_name = Fraunces 144pt Black`, `subfamily_name = Italic`, and weight class `900`. The processor now routes this to review instead of incorrectly treating “Black” as part of the family and “Italic” as the complete variant.
- Mona Sans' variable TTF parsed successfully as a variable font and formed one unambiguous dry-run group.
- The saved Monaspace report contains 1,485 assets across seven archive packages. All 1,485 hashes are distinct in this report; 1,060 assets have parsed metadata and 425 WOFF2 assets are not parsed by the discovery script.
- In the dry run, 1,123 Monaspace assets are routed to review (698 family/weight naming ambiguities and 425 unparsed WOFF2 files). The remaining 362 assets form 183 tentative variant groups, with 82 format conflicts flagged. These are review findings, not approval to publish.

## Explicit non-goals

- No Gemini calls, Supabase client, uploads, database mutations, or queue status updates.
- No filename-based guess is used to fill missing binary metadata.
- No static instances are synthesized from variable-font metadata.
- No automatic publishing is performed.

This core is intentionally not wired into the scheduled production workflow. Any later publishing path must have its own isolated tests and explicit review.


## Gemini advisory review (isolated)

The Gemini stage is deliberately separate from deterministic parsing and grouping. It accepts only a bounded JSON list of ambiguous candidates and sends extracted metadata—not font binaries or Supabase credentials—to the Gemini API. It requires `GEMINI_API_KEY`; `GEMINI_MODEL` can override the default `gemini-2.5-flash`.

Create an input JSON array containing candidate objects with `asset_id`, `relative_path`, and a `metadata` object, then run:

```sh
GEMINI_API_KEY=your_key node scripts/font-processing/run-gemini-review.js ambiguous-assets.json gemini-review.json
```

The output is advisory only. It is marked `publishable: false`; no database or Storage writes are performed. Invalid IDs, duplicate decisions, malformed responses, and invalid confidence values are rejected. Low-confidence or omitted candidates are sent to human review. The runner does not update queue statuses or connect to the scheduled production processor.

Do not pass service-role credentials to this script. The API key should be provided through the environment and must never be committed to the repository. Review Gemini's output before using any suggestion; model output is not authoritative evidence for licensing, official links, or factual font metadata.


## Export only unresolved candidates for Gemini

After generating a saved discovery report, export only assets that the deterministic grouping core already routed to manual review:

```sh
node scripts/font-processing/export-ambiguous-assets.js path/to/font-discovery-report.json ./tmp/gemini-review-input
```

The exporter deduplicates byte-identical assets by SHA-256, runs the deterministic grouping rules, and writes numbered JSON batches of at most 50 candidates plus a manifest. Each candidate contains bounded binary metadata and a stable hash ID; filename guesses and review-reason text are not passed into the model request. The exporter makes no API calls, uploads, or database writes. It refuses to overwrite existing files, so use a fresh output directory for each export.

To review a single batch, provide that batch file to the advisory runner:

```sh
GEMINI_API_KEY=your_key node scripts/font-processing/run-gemini-review.js ./tmp/gemini-review-input/fixture-font-ambiguous-001.json ./tmp/gemini-review-output-001.json
```

Run batches deliberately and inspect their outputs. Gemini responses remain advisory, confidence-gated, non-publishable, and subject to human review. This workflow does not apply model decisions to the saved discovery report or production data.


## Gemini response cache and request budget

The command-line runner uses a local persistent cache at `.cache/font-processing/gemini-review-cache.json` by default. Override it with `GEMINI_REVIEW_CACHE_FILE`. The cache key hashes the model, confidence threshold, system instruction, response schema, and sanitized candidate inputs. Only validated, non-publishable advisory results are cached; API keys are never stored. Cache hits do not require an API key or consume another request.

A new cache starts with a **one-request hard budget**. This conservative default prevents repeated invocations from silently making unlimited requests. To allow more distinct uncached batches, explicitly set `GEMINI_MAX_REQUESTS` to the total request allowance for that cache file, for example `GEMINI_MAX_REQUESTS=3`. The persistent counter records attempts before network access, including failed requests, to prevent unlimited retries. Cache corruption or an unsupported cache version fails closed. The cache is local to the machine/workspace; do not commit it or share it publicly.

Example (after explicitly approving a live request):

```sh
GEMINI_MAX_REQUESTS=1 GEMINI_REVIEW_CACHE_FILE=.cache/font-processing/gemini-review-cache.json node scripts/font-processing/run-gemini-review.js ./tmp/gemini-review-input/fixture-font-ambiguous-001.json ./tmp/gemini-review-output-001.json
```

The API key belongs in the environment or a protected GitHub Actions secret, never in source files, candidate JSON, cache entries, logs, or output artifacts. Merely adding `GEMINI_API_KEY` to repository secrets does not call the API; no workflow in this branch automatically invokes the live Gemini runner.
