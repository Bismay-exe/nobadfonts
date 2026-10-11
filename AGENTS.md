# AGENTS.md — NoBadFonts

This file provides compact, high-signal guidance for future OpenCode sessions. Not everything below will apply to every task — read what's relevant.

## Developer Commands (non-obvious)

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server at http://localhost:5173 |
| `npm run build` | Run sitemap generate + `tsc -b` + `vite build` — **includes type checking** |
| `npm run lint` | Run ESLint on all `.ts`/`.tsx` files |
| `npm run test:font-processing` | Run the font-processing regression test suite |
| `npx cap sync` | Sync web build into Capacitor native projects |
| `npx cap open android` | Open Android Studio for Capacitor Android project |
| `npx cap open ios` | Open iOS project (macOS + Xcode required) |
| `npm install -g nobadfonts-cli && npx nobadfonts add <font>` | Install fonts via CLI |
| `npx nobadfonts list` | List available fonts from CLI |

## Build / Test / Lint Order

**`lint -> typecheck -> test`** is the expected order (enforced in CI at `.github/workflows/font-processing-core-tests.yml:58-59`). The `npm run build` command already runs `tsc -b` (type-check) and `vite build`; run `npm run lint` first.

## Monorepo Structure

| Directory | Purpose |
|---|---|
| `src/` | Main web app — React 19 + TypeScript + Vite |
| `nobadfonts-cli/` | Standalone CLI package (`index.js`, `package.json`) |
| `scripts/font-processing/` | Font processing pipeline scripts (core logic, Gemini review, WOFF2 replay, etc.) |
| `supabase/` | DB migrations (`migrations/`) and edge functions (`functions/`) |
| `android/` | Capacitor Android native project |
| `tests/` | Jest/`node:test` test suites for font processing |

## Key Quirks & Gotchas

- **ESM only**: `"type": "module"` in `package.json` — no `.js` extensions allowed in imports; `verbatimModuleSyntax: true` in tsconfig.
- **Tailwind CSS v4 (Alpha)**: New API — class names and config may differ from v3 expectations.
- **Font processing scripts use `.js` not `.ts`**: The `scripts/font-processing/` directory contains pure ESM/JavaScript files (not TypeScript). Import paths like `../scripts/font-processing/core.js`.
- **WASM WOFF2 conversion**: Runs in-browser via `wawoff2.js` loaded dynamically. See `src/utils/woff2.ts`.
- **Environment variables**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set in `.env` (copy from `.env.example`). The CLI also reads a local `.env` for Supabase credentials.
- **`verbatimModuleSyntax: true`**: TypeScript will error if you import non-`.ts` extensions without the extension. Import paths must include extensions.
- **CI expects `npm run build` to succeed**: This runs `tsc -b` first; fix type errors before attempting a Vite build.

## Testing Quirks

- Font-processing core tests: `npm run test:font-processing` (runs ~15 test files under `tests/`)
- Tests use `import test from 'node:test'` + `import assert from 'node:assert/strict'`
- Some tests require Supabase (integration tests marked with `local-supabase` or `real-fixtures` in CI)
- Gemini-related tests disable `GEMINI_API_KEY` to avoid API calls
- Export/ambiguous-asset tests write to temporary directories — no side effects
- Type-check **must pass before** `vite build`; the build script runs `tsc -b` first

## Architecture Notes (not obvious from filenames)

- **Shared codebase**: 99% of code is shared between web, Android, and iOS (Capacitor). Native projects just bundle the web output.
- **Upload pipeline**: `src/pages/Upload.tsx` → WASM WOFF2 conversion in browser → Supabase Storage. See `src/utils/woff2.ts` and `src/contexts/UploadContext.tsx`.
- **Font description generator**: `src/utils/fontDescriptionGenerator.ts` — synthesizes font descriptions from tags using classification/style/tone dictionaries.
- **Admin tool**: `src/components/admin/FixWoff2Scanner.tsx` — admin moderation tool for scanning/fixing broken WOFF2 references.
- **Reactivity stack**: `Lenis + GSAP` for smooth scroll parallax; `Framer Motion` for micro-interactions; `react-ios-corners` for iOS-safe-area handling.
- **Supabase RLS**: Row-level security enforced at the database level, not just UI-level. See `supabase/migrations/` for RLS-relevant migrations.
- **Lazy-loaded routes**: Most pages are `React.lazy()`-loaded in `App.tsx` — routes dynamically import their components.

## Environment & Setup

1. `cp .env.example .env` (if `.env` doesn't exist)
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`
3. `npm install`
4. `npm run dev` to start development

The CLI (`nobadfonts-cli`) reads its own `.env` in `nobadfonts-cli/` for Supabase credentials (separate from the web app `.env`).