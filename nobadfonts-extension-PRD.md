# NoBadFonts Extension — Stylebot Integration Instructions

## Context

I have already cloned the existing Stylebot repository into my local project folder named `nobadfonts-extension` using:

```bash
git clone https://github.com/ankit/stylebot.git nobadfonts-extension
```

The codebase is from:
https://github.com/ankit/stylebot

We are using **OpenCode with DeepSeek V4.1** to modify this existing project.

**This is an adaptation of an existing, working browser extension. Do not create a new extension from scratch.**

The purpose is to turn Stylebot into a NoBadFonts-powered live website typography editor while preserving Stylebot's existing functionality and interaction model.

## Main goal

Use fonts from my existing NoBadFonts project to let users change typography on live websites.

Users should be able to open the extension on any supported website, choose a font from the NoBadFonts catalog, apply it immediately, and save their typography preferences for that website.

The experience should retain the useful visual editing workflow of Stylebot. NoBadFonts supplies the font catalog and font assets; Stylebot supplies the existing browser-extension foundation and editing capabilities.

## Phase 1 — Inspect the existing repository

Start by inspecting the complete relevant codebase, including:

- README and development instructions
- package.json and lockfiles
- Extension manifest
- Existing UI components and styles
- Font selection and font-related UI
- Element picker and element highlighting
- CSS editor and style injection
- Undo, redo, save and reset functionality
- Saved styles, local storage and synchronization
- Background scripts, content scripts and extension messaging
- Build, test and packaging configuration

Determine the actual architecture and how the existing application works before making changes.

Do not assume the project uses React, Vite, Tailwind or any other framework. Use the framework and tooling already present in Stylebot.

Do not replace the UI framework or rewrite working features unnecessarily.

## Phase 2 — Inspect the NoBadFonts integration requirements

Find the real NoBadFonts project source if it is available in the workspace or through an explicitly configured Git remote. If it is not available locally, inspect the information already present in the workspace and identify what is still needed.

Determine:

- The actual font metadata API or data source
- The actual database schema, if relevant
- How font slugs or IDs are represented
- How font families and variants are represented
- Where usable font files are hosted
- Which font formats are available
- Whether the asset URLs are publicly accessible
- Whether browser cross-origin font loading is supported
- How font weights, styles and variable fonts are represented
- What licensing information is available

Do not invent API routes, database columns, font URLs or metadata fields.

Do not expose Supabase service-role keys, private credentials or administrative endpoints in the extension.

Prefer a public, read-only data source for catalog access. If the existing NoBadFonts project does not expose an appropriate source, propose the smallest justified change instead of implementing a guessed endpoint.

## Phase 3 — Integrate the NoBadFonts catalog

Modify Stylebot's existing font selection workflow rather than creating a disconnected font picker.

Requirements:

1. Search fonts from the actual NoBadFonts catalog.
2. Display font names and previews using the selected fonts where possible.
3. Show available font weights and styles.
4. Support searching by font family and filtering using categories that actually exist in the catalog.
5. Load results efficiently and handle loading, empty and error states.
6. Avoid loading the entire font catalog or downloading every font file at startup.
7. Load the selected font and the necessary variants on demand.
8. Cache only where beneficial and appropriate.
9. Handle unavailable assets, failed network requests and unsupported formats gracefully.
10. Use the existing Stylebot component and state architecture wherever practical.

Keep the font explorer visually consistent with Stylebot. Improve its UI only where necessary to deliver a polished NoBadFonts experience.

## Phase 4 — Apply fonts to live websites

Use Stylebot's existing CSS editing and injection mechanisms.

Users should be able to:

- Select an element using the existing element picker.
- Apply a NoBadFonts font to that element.
- Apply a font to the website's body text.
- Apply a font to headings.
- Apply a font to all appropriate page text.
- Change the font weight when the required variant exists.
- See changes without reloading the page.
- Undo or reset changes using existing Stylebot behavior.
- Save the resulting typography styles for future visits.

Important implementation details:

- Use valid CSS font-family declarations and correct font-face loading.
- Avoid injecting duplicate font-face definitions unnecessarily.
- Avoid broad CSS selectors that unintentionally overwrite unrelated styling.
- Avoid breaking icon fonts, icon glyphs, emoji, logos and specialized UI symbols where reasonably possible.
- Preserve original CSS behavior when the extension is disabled or a style is removed.
- Handle dynamically inserted page content using existing Stylebot mechanisms where possible.
- Avoid unnecessary DOM mutations and excessive observers.
- Handle cross-origin restrictions honestly.
- Do not claim support for inaccessible pages or unsupported iframe/shadow DOM cases without testing.

Prefer storing stable font identifiers and the necessary style configuration rather than relying only on a display name.

## Phase 5 — Preserve existing Stylebot features

Do not remove or regress existing functionality unless a specific change is necessary and justified.

Preserve:

- Existing editor and live styling experience
- Element selection and highlighting
- CSS editing
- Saved website-specific styles
- Existing style persistence
- Undo and redo, where supported
- Reset and disable behavior
- Existing keyboard interactions
- Existing browser compatibility
- Existing permission model wherever possible

Review all affected code paths before changing them.

Do not replace Stylebot's existing editor with a new application or an unrelated UI design.

## Phase 6 — UI and UX quality

The finished extension should feel like a polished typography tool rather than a generic settings popup.

Priorities:

- Clear visual hierarchy
- Good font specimen previews
- Fast font search
- Compact and useful controls
- Clear loading and error states
- Accessible keyboard navigation and visible focus indicators
- Responsive layout for the existing popup/editor dimensions
- Consistency with Stylebot's established design and interactions

Do not add unnecessary dashboards, marketing sections, decorative cards or unrelated features.

Keep the product focused on font exploration and applying NoBadFonts typography to websites.

## Phase 7 — Testing and validation

After implementation, run the real project scripts discovered in package.json and its documentation.

At minimum, verify:

1. The existing extension builds successfully.
2. The extension loads as an unpacked extension.
3. The actual NoBadFonts catalog can be accessed.
4. Font search works.
5. Selecting a font loads the real font asset.
6. The selected element changes typography immediately.
7. Weight selection works when variants exist.
8. Website styles can be saved and restored.
9. Reset removes the extension's changes correctly.
10. Failed font requests do not crash the extension.
11. Existing Stylebot editing functionality still works.
12. The extension does not leak secrets or require unnecessary permissions.

Run available unit tests, linting, type checks and builds. Add or update targeted tests for the new integration if the project supports them.

Do not report a test as passed unless you actually ran it and observed the result.

## Git and change management

- Inspect the current Git status before editing.
- Preserve the original Git history and existing project structure.
- Do not overwrite unrelated local changes.
- If the current branch is the upstream main branch, create a feature branch named `feat/nobadfonts-integration` before editing.
- Keep changes limited to the NoBadFonts integration and necessary fixes.
- Do not push to GitHub or publish a release without my explicit instruction.
- Do not make production database changes as part of this work.

## Execution instructions

Do not stop after producing a high-level plan.

First inspect the code and identify the relevant implementation points. Then proceed with the implementation in small, verifiable phases, beginning with the catalog integration.

If an essential detail is missing, identify the blocker and continue with work that does not depend on it. Do not invent missing information or silently use fake data.

Before finishing, provide:

- Summary of actual changes
- Files changed and why
- How to build and load the extension
- Tests and commands executed, with their actual results
- Any remaining blockers or known limitations

**The final deliverable is a modified Stylebot extension powered by the real NoBadFonts font catalog—not a new extension scaffold, a mockup, or a document-only plan.**