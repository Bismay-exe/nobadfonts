# Fraunces WOFF batch preparation

This is a **manual-only, read-only preparation workflow** for the 12 Fraunces variants that currently have TTF source objects and lack WOFF URLs.

## Run it

In GitHub, open **Actions → Prepare Fraunces WOFF Batch → Run workflow**. The job downloads the known public TTF objects, checks each source against its recorded byte size, converts it to WOFF with FontTools, reopens the generated WOFF to check its font names, and writes a manifest containing SHA-256 hashes for both source and output bytes.

The workflow uploads `fraunces-woff-batch` as a downloadable Actions artifact. The artifact includes source TTFs, generated WOFFs, `manifest.json`, `SHA256SUMS`, and a README.

## Safety boundary

- This workflow has no Supabase credentials and performs no database or Storage writes.
- It does not change variant rows or publish new URLs.
- A successful run means the batch was prepared, **not** published.
- Review the manifest and source hashes before implementing or running any separate publisher.
- No APK build is involved; this workflow is independent of `build-android.yml`.
