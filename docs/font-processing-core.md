# Deterministic font processing core

This module is an isolated first step toward the AI-assisted font processor. It is not connected to the production queue, Supabase Storage, or database writes.

## Current scope

- Normalize supported font extensions and locally extracted metadata.
- Derive grouping keys only from extracted family/subfamily/weight evidence.
- Deduplicate identical assets by SHA-256 while retaining all archive/path provenance.
- Preserve distinct hashes, even when filenames and extensions match.
- Route ambiguous family/weight naming, unreadable metadata, and missing metadata to review.
- Report conflicting assets when a variant has multiple distinct files for the same format.
- Validate discovery reports without changing their source data.

## Run unit tests

Use Node's built-in test runner:

```sh
npm run test:font-processing
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
