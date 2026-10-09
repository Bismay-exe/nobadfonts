# Font asset discovery (read-only)

This workflow inventories assets from queued release ZIPs without modifying the production pipeline.

## Run it

1. Open **Actions → Font Asset Discovery (Read Only)**.
2. Select **Run workflow**.
3. Optionally provide one `font_processing_queue` UUID. Leave it blank to scan queue items with status `pending` or `error`.
4. Download the `font-asset-discovery-report` artifact from the workflow run.

## Safety properties

- Uses the service role only for SELECT queries against `font_processing_queue`.
- Does not update queue statuses, insert/update font rows, or upload font files.
- Downloads are capped at 150 MiB per archive by default; override with `FONT_DISCOVERY_MAX_ARCHIVE_BYTES`.
- Rejects ZIP entries with absolute paths or parent-directory traversal before extraction.
- Reports per-file relative path, format, size, SHA-256, a heuristic style guess, and OpenType metadata where parsing is supported.
- WOFF2 files are inventoried and hashed, but this initial version does not parse their OpenType metadata.
- Heuristic style guesses are not authoritative. Review the report before designing any production write path.

The script uses `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from repository Actions secrets.
