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

- No Gemini calls, Supabase client, uploads, database mutations, or queue status updates.
- No filename-based guess is used to fill missing binary metadata.
- No static instances are synthesized from variable-font metadata.
- No automatic publishing is performed.

This core is intentionally not wired into the scheduled production workflow. Any later publishing path must have its own isolated tests and explicit review.


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

The live review is limited to one request of at most 50 candidates per invocation. Candidates beyond that limit remain review cases. The runner uses the existing cache and request/token safeguards. The report records the deterministic grouping, audit findings, advisory decisions, and proposed grouping separately.

The review mode performs no Supabase reads or writes, no queue status changes, no font binary uploads, no metadata publishing, and no Storage operations. Its output always declares `publishable: false`, `database_writes_performed: false`, and `uploads_performed: false`. It refuses to overwrite an existing output file. Gemini suggestions are never treated as proof; decisions with missing labels, invalid relationships, or insufficient confidence remain review cases.

The normal production queue processor remains protected by the explicit write gate and the disabled production workflow. This read-only integration does not enable or authorize publishing.

