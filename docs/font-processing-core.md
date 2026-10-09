# Deterministic font processing core

This module is an isolated first step toward the AI-assisted font processor. It is not connected to the production queue, Supabase Storage, or database writes.

## Current scope

- Normalize supported font extensions and locally extracted metadata.
- Derive grouping keys only from extracted family/subfamily/weight evidence.
- Deduplicate identical assets by SHA-256 while retaining all archive/path provenance.
- Preserve distinct hashes, even when filenames and extensions match.
- Report ambiguous assets for review and report conflicting assets when a variant has multiple distinct files for the same format.

## Explicit non-goals

- No network calls, Gemini calls, archive extraction, Supabase client, uploads, database mutations, or queue status updates.
- No filename-based guess is used to fill missing binary metadata.
- No static instances are synthesized from variable-font metadata.
- No automatic publishing is performed.

## Run tests

Use Node's built-in test runner:

```sh
node --test tests/font-processing-core.test.js
```

This core is intentionally not wired into the scheduled production workflow. The next step is to connect safe archive inventory and locally parsed metadata to these pure functions, then validate with Fraunces, Mona Sans, and the saved discovery report.
