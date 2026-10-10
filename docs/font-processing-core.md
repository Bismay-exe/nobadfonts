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
- The initial saved Monaspace report contains 1,485 assets across seven archive packages. All 1,485 hashes are distinct in that report; at that point, 1,060 assets had parsed metadata and 425 WOFF2 assets were not parsed by the discovery script.
- The initial dry run routed 1,123 assets to review (698 family/weight naming ambiguities and 425 unparsed WOFF2 files). The remaining 362 assets formed 183 tentative variant groups, with 82 format conflicts flagged. These are historical baseline findings; see the fresh replay and audit findings below for the newer results.

## Fresh all-format archive replay results (2026-10-09)

The read-only replay workflow subsequently downloaded and parsed the original seven archive sources again, then compared the results against the saved report. The uploaded artifact `fresh-font-discovery-validation` recorded:

- 1,485 baseline font assets and 1,485 fresh parsed assets.
- 1,485/1,485 source/path matches with matching SHA-256 hashes; zero missing replay matches.
- All 425 baseline WOFF2 assets parsed successfully; zero font parse failures and zero failed archives.
- Extension counts remained stable: 420 OTF, 215 TTF, 425 WOFF, and 425 WOFF2.
- The deterministic summary changed from 637 to 635 planned variant groups. Reported format conflicts changed from 82 to zero, and binary-weight/filename disagreements changed from 345 to zero.
- The candidate-export manifest reported zero unresolved candidates for the replayed Monaspace report, so no Gemini request was needed. The exporter explicitly recorded no API calls, database writes, or uploads.

These are results from the saved archive replay and deterministic local grouping only. They do not prove that every grouping is semantically correct, approve the 635 groups for publication, or authorize production writes. Review the artifact and any future grouping changes before creating a separate publish plan.

## Explicit non-goals

- No Supabase client, uploads, database mutations, or queue status updates in the deterministic core or Gemini review mode.
- No Gemini API calls unless a user explicitly passes `--live` to the read-only report-review command.
- No filename-based guess is used to fill missing binary metadata.
- No static instances are synthesized from variable-font metadata.
- No automatic publishing is performed.

The read-only Gemini review is integrated with the existing processor entry point, but it is deliberately separate from the production queue-processing path. Any later publishing path must have its own isolated tests and explicit review.

## Gemini-assisted grouping review (read only)

The Gemini review is integrated with the existing processor entry point through a separate report-review mode. It does not enter the production queue-processing path and does not load the Supabase client.

Run deterministic validation without any Gemini API call:

```sh
node scripts/process-ai-fonts.js --review-report discovery-report.json gemini-review-report.json
```

To explicitly approve one live Gemini request for one queue item, pass its exact slug and `--live`:

```sh
GEMINI_API_KEY=your_key node scripts/process-ai-fonts.js --review-report discovery-report.json gemini-review-report.json --slug=font-slug --live
```

The live review is limited to one request of at most 50 candidates per invocation. Candidates beyond that limit remain review cases. The runner uses the existing cache and request/token safeguards. The report records deterministic grouping, audit findings, advisory decisions, and proposed grouping separately.

The review mode performs no Supabase reads or writes, no queue status changes, no font binary uploads, no metadata publishing, and no Storage operations. Its output always declares `publishable: false`, `database_writes_performed: false`, and `uploads_performed: false`. It refuses to overwrite an existing output file. Gemini suggestions are never treated as proof; decisions with missing labels, invalid relationships, or insufficient confidence remain review cases.

The normal production queue processor remains protected by the explicit write gate and the disabled production workflow. This read-only integration does not enable or authorize publishing.


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

A new cache starts with a **one-request hard budget**. This conservative default prevents repeated invocations from silently making unlimited requests. To allow more distinct uncached batches, explicitly set `GEMINI_MAX_REQUESTS` to the total request allowance for that cache file, for example `GEMINI_MAX_REQUESTS=3`. The persistent counters reserve requests and output tokens before network access, including failed requests, to prevent unlimited retries. The default total output-token allowance is 4,096; each request reserves its configured output cap (default 4,096), so additional uncached calls require an explicit increase to both the request allowance and token allowance. Set `GEMINI_MAX_TOTAL_OUTPUT_TOKENS` to raise the aggregate output-token budget and `GEMINI_MAX_OUTPUT_TOKENS` to adjust the per-request cap (maximum 4,096). This is a hard output-token budget, not an estimate of prompt tokens or dollar cost. Cache corruption or an unsupported cache version fails closed. The cache is local to the machine/workspace; do not commit it or share it publicly.

Example (after explicitly approving a live request):

```sh
GEMINI_MAX_REQUESTS=1 GEMINI_REVIEW_CACHE_FILE=.cache/font-processing/gemini-review-cache.json node scripts/font-processing/run-gemini-review.js ./tmp/gemini-review-input/fixture-font-ambiguous-001.json ./tmp/gemini-review-output-001.json
```

The API key belongs in the environment or a protected GitHub Actions secret, never in source files, candidate JSON, cache entries, logs, or output artifacts. Merely adding `GEMINI_API_KEY` to repository secrets does not call the API; no workflow in this branch automatically invokes the live Gemini runner.


## Optional manually approved Gemini smoke test

The workflow `.github/workflows/gemini-advisory-smoke-test.yml` is manual-only. It requires the `confirm_live_gemini_request` checkbox to be enabled at dispatch time, uses one synthetic candidate, caps the request at 512 output tokens, allows one request total, and never uploads fonts or writes to a database. It checks that `GEMINI_API_KEY` is configured without printing it. The workflow was added but has **not** been dispatched; no live Gemini request is made by this change.

To run it, open **Actions → Gemini Advisory Smoke Test (Manual Only) → Run workflow**, select the feature branch, and explicitly check the live-request confirmation. Review the generated advisory artifact manually. This is an API connectivity/response-validation test only, not a test of real font-family decisions.


## Offline variant-group audit

`scripts/font-processing/audit-variant-groups.js` produces a detailed review artifact from a saved discovery report. It records each deterministic group, the source paths and binary metadata behind each asset, the formats present, existing format conflicts, and disagreements in family/subfamily/weight/italic/variable metadata across assets assigned to one group.

Run it against a local saved report:

```sh
node scripts/font-processing/audit-variant-groups.js path/to/discovery-report.json audit-output.json
```

The output is explicitly marked non-publishable and read-only. Groups with observable metadata disagreement are flagged for human review. A group without flags is **not** considered semantically verified: matching embedded metadata cannot prove that font assets belong to the intended family. The tool does not call external APIs, upload files, mutate queues, or write to a database. Output files are created with exclusive-write mode so an existing report is not silently overwritten.

### Latest automated audit findings (2026-10-09)

The fresh replay workflow now runs the audit against its actual merged Monaspace report and includes `results/variant-group-audit.json` in the artifact. The latest completed run on commit `c13ffbaeb6bfe47ec5e55c455fd40442fd4781c6` is [Fresh Font Metadata Validation (Read Only)](https://github.com/Bismay-exe/nobadfonts/actions/runs/37958812323). It reported:

- 1,485 input assets, 1,485 unique binary hashes, and 635 deterministic planned groups.
- 72 groups flagged for human review; all 72 flags were `weight_class_disagreement`.
- All 72 disagreements share the same format pattern: WOFF and WOFF2 report weight class 400, while the matching OTF reports the expected non-400 class. This occurs across six named weights (ExtraLight, Light, Medium, SemiBold, Bold, and ExtraBold) and their italic variants. The raw WOFF/WOFF2 subfamily names still identify the named styles (for example, Bold and ExtraBold).
- Zero same-format binary conflicts and zero assets routed to the deterministic core's review queue in this replay.
- 563 groups had no automatic audit flags, which is not proof of semantic correctness.

The source report identifies the affected webfont assets as coming from the official Monaspace v1.400 release archive `https://github.com/githubnext/monaspace/releases/download/v1.400/monaspace-webfont-nerdfonts-v1.400.zip`. Inspection of the upstream `v1.400` release-preparation script (`scripts/prepare-release.sh`) shows that it packages the already-present `fonts/Web Fonts/NerdFonts Web Fonts` directory into a release ZIP; it does not perform the webfont conversion itself. This confirms that the mismatch exists in the checked-in upstream webfont binaries before release packaging, but does not identify which earlier build step introduced it. The parser reads the embedded OS/2 weight class. The audit now reports a separate `subfamily_weight_class_disagreement` flag whenever a recognizable named subfamily (for example, `Bold`) contradicts the embedded weight class (for example, `400` versus `700`). This is a review signal, not permission to rewrite the original metadata or automatically prefer another format.

The latest read-only replay, core tests, and real-font fixture validation completed successfully. Android APK builds are now manual-only (`workflow_dispatch`) and do not start on pushes or pull requests. No Gemini API calls, uploads, database writes, or queue updates were performed by the read-only validation.

The audit also preserves `weight_classes_by_format` for each group: each format's asset count, raw embedded weight-class values, and source paths are shown separately. This helps investigate cross-format metadata patterns without replacing the observed value or treating any format as automatically authoritative. A regression test covers an OTF Bold asset reporting 700 alongside WOFF/WOFF2 assets reporting 400; the audit flags the disagreement and preserves all three original values.

The audit's compact summary now includes counts per review flag and a focused list of groups with weight-class disagreements. Each listed group carries its per-format weight values and source paths, so reviewers can prioritize repeated patterns without parsing every asset record manually. These are evidence summaries only; no weight value is inferred or rewritten.


## Gemini runner regression coverage

The offline test suite includes mocked-fetch tests for validated-result caching, persistent request-budget enforcement, and fail-closed behavior when the cache is malformed. These tests use a fake API key and a local mocked response; they do not make live Gemini requests. Run them with `npm run test:font-processing`.


## Exporter and audit regression coverage

Offline tests verify that ambiguous candidates are split into bounded JSON batches, omit review-reason prose from model input, preserve only extracted metadata, refuse to overwrite existing output, and record that no API/database/storage side effects occurred. Named-weight audit tests cover common named weights and confirm that the Monaspace width label `SemiWide` is not mistaken for the weight `Bold`. All tests use synthetic fixtures and make no live API requests.


## Parent-family and subfamily records

The migration `supabase/migrations/20261010000001_font_family_hierarchy.sql` adds `family_role` and `parent_font_id` to `public.fonts`. It changes schema only; it does not create Monaspace records or apply itself to any database.

- `standalone`: an ordinary font record with no parent.
- `parent`: a family overview record with no parent and no requirement for a primary binary or ZIP URL.
- `subfamily`: a named design such as Monaspace Neon or Monaspace Krypton, linked to a parent record through `parent_font_id`. Its own `font_variants` rows remain attached to that subfamily's `font_id`.

The database trigger requires a subfamily to reference a record whose role is `parent`, and prevents changing a parent to another role while children still reference it. The frontend loads parent/child relationships on the font details route and renders a family overview for parent records. Parent records are excluded from ordinary font listings, selectors, and sitemap listings.

Do not apply the migration or create/publish Monaspace records until the schema and actual font assets have been reviewed. No production schema change, row creation, binary upload, or metadata publishing was performed as part of this implementation.
