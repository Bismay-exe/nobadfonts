# NoBadFonts

> **Curated Typography for Modern Interfaces.**  
> A next-generation font discovery platform built for designers who demand quality, context, and performance.

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

</div>

---

## 💎 Mission

**NoBadFonts** isn't just a repository; it's a quality filter for the web. We believe that finding the right typeface shouldn't involve wading through thousands of low-quality options. By combining **algorithmic curation**, **real-world preview contexts**, and **cutting-edge web performance**, we provide a superior tooling experience for typography selection.

---

## ✨ Core Features & Engineering

### 1. Context-Aware Type Tester

Gone are the days of "The quick brown fox". Our type tester (`FontTester.tsx`) allows users to preview fonts in the exact environments they will be used:

- **UI Context**: Simulates a dashboard interface with tooltips, buttons, and data tables.
- **Editorial Context**: Renders dense, multi-column text to test readability.
- **Code Context**: syntax-highlighted blocks for testing monospace programming fonts.

### 2. ⚡ The Upload Pipeline

The heart of the platform is a robust, multi-stage upload pipeline located in `src/pages/Upload.tsx`.

1.  **Validation**: Enforces mandatory metadata (Designer, Category) and file presence.
2.  **Fingerprinting**: Generates unique slugs (e.g., `helvetica-now-display`) to prevent collisions.
3.  **Variant Management**:
    - Automatically maps uploaded files (`.ttf`, `.otf`, `.woff`, `.woff2`) to a unified `FontVariant` object.
    - Stores files in a structured storage layout: `{userId}/{fontSlug}/variants/{variantName}/{filename}`.
4.  **WASM Optimization**:
    - Integrates **`wawoff2`** (WebAssembly port of Google's woff2) directly in the browser.
    - If a user uploads a standard `.ttf`, the client converts it to a compressed `.woff2` _before_ upload, saving server bandwidth and improving end-user load times.

### 3. 🧠 Algorithmic Descriptions

We don't rely on generic placeholder text. The **Algorithmic Description Engine** (`src/utils/fontDescriptionGenerator.ts`) analyzes a font's tags and metadata to synthesize human-readable descriptions.

- _Input_: `['sans', 'geometric', 'modern', 'bold']`
- _Output_: "A geometric sans-serif with a modern character. Its bold weight makes it ideal for headlines and branding."

### 4. 📱 Native Mobile Ecosystem

The project is built with a "Web Native" philosophy using **Capacitor**.

- **Shared Codebase**: 99% of code is shared between Web, Android, and iOS.
- **Native Plugins**: Uses native File System and Haptics plugins for a premium mobile feel.
- **Touch Optimized**: Custom gesture handling ensures the app feels native, not like a website wrapped in a WebView.

---

## 🏗️ Technical Architecture

### Frontend Core

- **Framework**: [React 19](https://react.dev/) (Release Candidate features utilized).
- **Build Tool**: [Vite](https://vitejs.dev/) for instant HMR and optimized production builds.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Alpha/Beta) using the new execution engine for sub-millisecond compile times.

### Animation & Interaction

- **Lenis**: A specialized smooth-scroll library (`useLenis.ts`) mapped to **GSAP** ScrollTrigger for buttery smooth parallax effects.
- **Framer Motion**: Handles micro-interactions and layout transitions (e.g., expanding cards, modal popups).

### State Management

- **AuthContext**: Wraps Supabase Auth to provide reactive `user`, `session`, and `profile` states across the app.
- **UploadContext**: specific provider that manages the background queue for WOFF2 conversion tasks, ensuring the UI remains responsive during heavy processing.

### Backend (Supabase)

The backend is fully serverless, relying on Supabase for:

- **PostgreSQL**: The relational source of truth.
- **RLS (Row Level Security)**: Strict policies ensure users can only edit their own uploads, while admins have global curation rights.
- **Storage**: Buckets for arbitrary font file storage and image galleries.
- **Edge Functions**: (Future) Server-side generation of `fonts.css` for remote embedding.

---

## 💾 Database Schema

The core data is structured around three primary tables:

### `profiles`

| Column       | Type   | Description             |
| :----------- | :----- | :---------------------- |
| `id`         | `uuid` | References `auth.users` |
| `username`   | `text` | Public display name     |
| `role`       | `enum` | `'member'` or `'admin'` |
| `avatar_url` | `text` | Profile picture         |

### `fonts`

| Column         | Type     | Description                          |
| :------------- | :------- | :----------------------------------- |
| `id`           | `uuid`   | Primary Key                          |
| `slug`         | `text`   | Unique URL-friendly identifier       |
| `name`         | `text`   | Display name of the typeface         |
| `user_id`      | `uuid`   | Uploader reference                   |
| `tags`         | `text[]` | Array of descriptive tags for search |
| `is_published` | `bool`   | Visibility toggle                    |

### `font_variants`

| Column            | Type     | Description                 |
| :---------------- | :------- | :-------------------------- |
| `id`              | `uuid`   | Primary Key                 |
| `font_id`         | `uuid`   | FK to `fonts`               |
| `variant_name`    | `text`   | e.g., "Bold Italic"         |
| `file_size_woff2` | `bigint` | Size in bytes for analytics |
| `woff2_url`       | `text`   | Direct CDN link             |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/your-username/nobadfonts.git
    cd nobadfonts
    ```

2.  **Install dependencies**

    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory:

    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

### Building for Production

**Web**

```bash
npm run build
```

**Android (Capacitor)**

```bash
npx cap sync
npx cap open android
```

---

## 📂 Project Structure

```
nobadfonts
├── .github
│   └── workflows
│       └── build-android.yml
├── android
│   ├── .gradle
│   │   ├── 8.14.3
│   │   │   ├── checksums
│   │   │   │   ├── checksums.lock
│   │   │   │   ├── md5-checksums.bin
│   │   │   │   └── sha1-checksums.bin
│   │   │   ├── executionHistory
│   │   │   │   └── executionHistory.lock
│   │   │   ├── expanded
│   │   │   ├── fileChanges
│   │   │   │   └── last-build.bin
│   │   │   ├── fileHashes
│   │   │   │   └── fileHashes.lock
│   │   │   ├── vcsMetadata
│   │   │   └── gc.properties
│   │   ├── buildOutputCleanup
│   │   │   ├── buildOutputCleanup.lock
│   │   │   └── cache.properties
│   │   └── vcs-1
│   │       └── gc.properties
│   ├── app
│   │   ├── src
│   │   │   ├── androidTest
│   │   │   │   └── java
│   │   │   │       └── com
│   │   │   │           └── getcapacitor
│   │   │   │               └── myapp
│   │   │   │                   └── ExampleInstrumentedTest.java
│   │   │   ├── main
│   │   │   │   ├── assets
│   │   │   │   │   ├── public
│   │   │   │   │   │   ├── assets
│   │   │   │   │   │   │   ├── AdminDashboard-DmPL1kEc.js
│   │   │   │   │   │   │   ├── Auth-DqRv3Tkk.js
│   │   │   │   │   │   │   ├── Cli-DXN-Fc_r.js
│   │   │   │   │   │   │   ├── DesignerFonts-DjaI7E4v.js
│   │   │   │   │   │   │   ├── EmptyState-CYnyzSJv.js
│   │   │   │   │   │   │   ├── Filters-B_jU_mMI.js
│   │   │   │   │   │   │   ├── FontCard-DwfMx0aH.js
│   │   │   │   │   │   │   ├── FontDetails-0w40ZwAt.js
│   │   │   │   │   │   │   ├── FontPairing-fjkZ5UQu.js
│   │   │   │   │   │   │   ├── FontsCatalog-DOlYLVvq.js
│   │   │   │   │   │   │   ├── MemberDetails-B9zmiLSt.js
│   │   │   │   │   │   │   ├── Members-CC88bgiK.js
│   │   │   │   │   │   │   ├── PreviewAccordion-CEtkpNog.js
│   │   │   │   │   │   │   ├── Profile-CWlTsKS-.js
│   │   │   │   │   │   │   ├── Upload-D4R51C_G.js
│   │   │   │   │   │   │   ├── arrow-left-DNKjoIYR.js
│   │   │   │   │   │   │   ├── download-CTh_iG8R.js
│   │   │   │   │   │   │   ├── image-D_ySQGiA.js
│   │   │   │   │   │   │   ├── index-DC891gYz.js
│   │   │   │   │   │   │   ├── index-Dz56ZgjA.css
│   │   │   │   │   │   │   ├── instagram-JJsbIgPX.js
│   │   │   │   │   │   │   ├── palette-XyfrB5UD.js
│   │   │   │   │   │   │   ├── search-DIsudHEu.js
│   │   │   │   │   │   │   ├── settings-DvWJ8CMK.js
│   │   │   │   │   │   │   ├── text-align-start-DWkUTthT.js
│   │   │   │   │   │   │   ├── trending-up-DLAJ3mVJ.js
│   │   │   │   │   │   │   ├── twitter-7uxH_d08.js
│   │   │   │   │   │   │   ├── upload-0Sbsl4gb.js
│   │   │   │   │   │   │   ├── useFonts-Bu2AUl_2.js
│   │   │   │   │   │   │   └── zap-DEDM_F07.js
│   │   │   │   │   │   ├── banner
│   │   │   │   │   │   │   └── banner.png
│   │   │   │   │   │   ├── fonts
│   │   │   │   │   │   │   ├── cimo-nsgk
│   │   │   │   │   │   │   │   ├── cimo-nsgk-Italic.otf
│   │   │   │   │   │   │   │   ├── cimo-nsgk-Italic.ttf
│   │   │   │   │   │   │   │   ├── cimo-nsgk-Italic.woff
│   │   │   │   │   │   │   │   ├── cimo-nsgk-Italic.woff2
│   │   │   │   │   │   │   │   ├── cimo-nsgk-Regular.otf
│   │   │   │   │   │   │   │   ├── cimo-nsgk-Regular.ttf
│   │   │   │   │   │   │   │   ├── cimo-nsgk-Regular.woff
│   │   │   │   │   │   │   │   ├── cimo-nsgk-Regular.woff2
│   │   │   │   │   │   │   │   ├── cimo-nsgk.otf
│   │   │   │   │   │   │   │   ├── cimo-nsgk.ttf
│   │   │   │   │   │   │   │   ├── cimo-nsgk.woff
│   │   │   │   │   │   │   │   └── cimo-nsgk.woff2
│   │   │   │   │   │   │   ├── Baleron.ttf
│   │   │   │   │   │   │   ├── BigShoulders.ttf
│   │   │   │   │   │   │   ├── Western Highland.otf
│   │   │   │   │   │   │   ├── aestera-personal-use.regular.ttf
│   │   │   │   │   │   │   ├── ahganirya.personal-use.otf
│   │   │   │   │   │   │   ├── aspect-range-demo.regular.otf
│   │   │   │   │   │   │   ├── authen-chastro-demo.regular.ttf
│   │   │   │   │   │   │   ├── categories-elegant-demo.regular.otf
│   │   │   │   │   │   │   ├── la-gagliane.personal-use.otf
│   │   │   │   │   │   │   ├── marvella-typeface.regular.otf
│   │   │   │   │   │   │   ├── moldin-demo.regular.otf
│   │   │   │   │   │   │   ├── mosca-laroke.regular.otf
│   │   │   │   │   │   │   ├── ruigslay.regular.otf
│   │   │   │   │   │   │   └── the-last-trunks.regular.ttf
│   │   │   │   │   │   ├── images
│   │   │   │   │   │   │   ├── bg.avif
│   │   │   │   │   │   │   └── fg.png
│   │   │   │   │   │   ├── logo
│   │   │   │   │   │   │   ├── logo-black.png
│   │   │   │   │   │   │   └── logo-white.png
│   │   │   │   │   │   ├── profile
│   │   │   │   │   │   │   └── profile.png
│   │   │   │   │   │   ├── avif_enc.wasm
│   │   │   │   │   │   ├── cordova.js
│   │   │   │   │   │   ├── cordova_plugins.js
│   │   │   │   │   │   ├── index.html
│   │   │   │   │   │   └── wawoff2.js
│   │   │   │   │   ├── capacitor.config.json
│   │   │   │   │   └── capacitor.plugins.json
│   │   │   │   ├── java
│   │   │   │   │   └── com
│   │   │   │   │       └── nobadfonts
│   │   │   │   │           └── app
│   │   │   │   │               └── MainActivity.java
│   │   │   │   ├── res
│   │   │   │   │   ├── drawable
│   │   │   │   │   │   ├── ic_launcher_background.xml
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-hdpi
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-mdpi
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-xhdpi
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-xxhdpi
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-land-xxxhdpi
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-hdpi
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-mdpi
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-xhdpi
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-xxhdpi
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-port-xxxhdpi
│   │   │   │   │   │   └── splash.png
│   │   │   │   │   ├── drawable-v24
│   │   │   │   │   │   └── ic_launcher_foreground.xml
│   │   │   │   │   ├── layout
│   │   │   │   │   │   └── activity_main.xml
│   │   │   │   │   ├── mipmap-anydpi-v26
│   │   │   │   │   │   ├── ic_launcher.xml
│   │   │   │   │   │   └── ic_launcher_round.xml
│   │   │   │   │   ├── mipmap-hdpi
│   │   │   │   │   │   ├── ic_launcher.png
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   └── ic_launcher_round.png
│   │   │   │   │   ├── mipmap-mdpi
│   │   │   │   │   │   ├── ic_launcher.png
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   └── ic_launcher_round.png
│   │   │   │   │   ├── mipmap-xhdpi
│   │   │   │   │   │   ├── ic_launcher.png
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   └── ic_launcher_round.png
│   │   │   │   │   ├── mipmap-xxhdpi
│   │   │   │   │   │   ├── ic_launcher.png
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   └── ic_launcher_round.png
│   │   │   │   │   ├── mipmap-xxxhdpi
│   │   │   │   │   │   ├── ic_launcher.png
│   │   │   │   │   │   ├── ic_launcher_foreground.png
│   │   │   │   │   │   └── ic_launcher_round.png
│   │   │   │   │   ├── values
│   │   │   │   │   │   ├── ic_launcher_background.xml
│   │   │   │   │   │   ├── strings.xml
│   │   │   │   │   │   └── styles.xml
│   │   │   │   │   └── xml
│   │   │   │   │       ├── config.xml
│   │   │   │   │       └── file_paths.xml
│   │   │   │   └── AndroidManifest.xml
│   │   │   └── test
│   │   │       └── java
│   │   │           └── com
│   │   │               └── getcapacitor
│   │   │                   └── myapp
│   │   │                       └── ExampleUnitTest.java
│   │   ├── .gitignore
│   │   ├── build.gradle
│   │   ├── capacitor.build.gradle
│   │   └── proguard-rules.pro
│   ├── capacitor-cordova-android-plugins
│   │   ├── src
│   │   │   └── main
│   │   │       ├── java
│   │   │       │   └── .gitkeep
│   │   │       ├── res
│   │   │       │   └── .gitkeep
│   │   │       └── AndroidManifest.xml
│   │   ├── build.gradle
│   │   └── cordova.variables.gradle
│   ├── gradle
│   │   └── wrapper
│   │       ├── gradle-wrapper.jar
│   │       └── gradle-wrapper.properties
│   ├── .gitignore
│   ├── build.gradle
│   ├── capacitor.settings.gradle
│   ├── gradle.properties
│   ├── gradlew
│   ├── gradlew.bat
│   ├── settings.gradle
│   └── variables.gradle
├── nobadfonts-cli
│   ├── .npmignore
│   ├── PUBLISHING.md
│   ├── README.md
│   ├── debug_fonts.js
│   ├── index.js
│   ├── nobadfonts-cli-1.1.0.tgz
│   ├── package-lock.json
│   ├── package.json
│   └── test_list.js
├── public
│   ├── banner
│   │   └── banner.png
│   ├── fonts
│   │   ├── cimo-nsgk
│   │   │   ├── cimo-nsgk-Italic.otf
│   │   │   ├── cimo-nsgk-Italic.ttf
│   │   │   ├── cimo-nsgk-Italic.woff
│   │   │   ├── cimo-nsgk-Italic.woff2
│   │   │   ├── cimo-nsgk-Regular.otf
│   │   │   ├── cimo-nsgk-Regular.ttf
│   │   │   ├── cimo-nsgk-Regular.woff
│   │   │   ├── cimo-nsgk-Regular.woff2
│   │   │   ├── cimo-nsgk.otf
│   │   │   ├── cimo-nsgk.ttf
│   │   │   ├── cimo-nsgk.woff
│   │   │   └── cimo-nsgk.woff2
│   │   ├── Baleron.ttf
│   │   ├── BigShoulders.ttf
│   │   ├── Western Highland.otf
│   │   ├── aestera-personal-use.regular.ttf
│   │   ├── ahganirya.personal-use.otf
│   │   ├── aspect-range-demo.regular.otf
│   │   ├── authen-chastro-demo.regular.ttf
│   │   ├── categories-elegant-demo.regular.otf
│   │   ├── la-gagliane.personal-use.otf
│   │   ├── marvella-typeface.regular.otf
│   │   ├── moldin-demo.regular.otf
│   │   ├── mosca-laroke.regular.otf
│   │   ├── ruigslay.regular.otf
│   │   └── the-last-trunks.regular.ttf
│   ├── images
│   │   ├── bg.avif
│   │   └── fg.png
│   ├── logo
│   │   ├── logo-black.png
│   │   └── logo-white.png
│   ├── profile
│   │   └── profile.png
│   ├── avif_enc.wasm
│   └── wawoff2.js
├── scripts
│   ├── add_format_columns.sql
│   ├── cleanup-fonts.js
│   ├── cleanup.sql
│   ├── clear-supabase.js
│   ├── delete_broken_fonts.sql
│   ├── remove_constraint.sql
│   ├── test-rpc.js
│   └── update_search_fonts.sql
├── src
│   ├── assets
│   ├── components
│   │   ├── admin
│   │   │   └── FixWoff2Scanner.tsx
│   │   ├── font-pairing
│   │   │   ├── CustomizeSidebar.tsx
│   │   │   └── FontPickerSidebar.tsx
│   │   ├── fonts
│   │   │   ├── ContextPreview.tsx
│   │   │   ├── Filters.tsx
│   │   │   ├── FontCard.tsx
│   │   │   ├── FontPairingFilters.tsx
│   │   │   ├── FontTester.tsx
│   │   │   ├── GlyphMap.tsx
│   │   │   ├── LicenseInfo.tsx
│   │   │   ├── PreviewAccordion.tsx
│   │   │   ├── ShareModal.tsx
│   │   │   └── SocialShareCard.tsx
│   │   ├── home
│   │   │   ├── Hero
│   │   │   │   ├── 1.tsx
│   │   │   │   ├── 2.tsx
│   │   │   │   └── 4.tsx
│   │   │   ├── Land2.tsx
│   │   │   ├── Land3.tsx
│   │   │   ├── Land4.tsx
│   │   │   ├── Land5.tsx
│   │   │   ├── Land7.tsx
│   │   │   ├── Land8.tsx
│   │   │   └── Landing.tsx
│   │   ├── layout
│   │   │   ├── Footer.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── ScrollRestoration.tsx
│   │   ├── profile
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── FontGrid.tsx
│   │   │   ├── ProfileHeader.tsx
│   │   │   └── SettingsForm.tsx
│   │   ├── shared
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── UploadProgressPopup.tsx
│   ├── contexts
│   │   ├── AuthContext.tsx
│   │   └── UploadContext.tsx
│   ├── hooks
│   │   ├── useFont.ts
│   │   ├── useFonts.ts
│   │   ├── useLenis.ts
│   │   ├── useMediaQuery.ts
│   │   └── useViewMode.ts
│   ├── lib
│   │   └── supabase.ts
│   ├── pages
│   │   ├── AdminDashboard.tsx
│   │   ├── Auth.tsx
│   │   ├── Cli.tsx
│   │   ├── DesignerFonts.tsx
│   │   ├── FontDetails.tsx
│   │   ├── FontPairing.tsx
│   │   ├── FontsCatalog.tsx
│   │   ├── Home.tsx
│   │   ├── MemberDetails.tsx
│   │   ├── Members.tsx
│   │   ├── Profile.tsx
│   │   └── Upload.tsx
│   ├── types
│   │   ├── database.types.ts
│   │   └── font.ts
│   ├── utils
│   │   ├── fontDescriptionGenerator.ts
│   │   └── woff2.ts
│   ├── workers
│   ├── App.tsx
│   ├── fonts.css
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── supabase
│   ├── .temp
│   │   └── cli-latest
│   └── functions
│       ├── import-font
│       └── serve-css
│           └── index.ts
├── .gitignore
├── LandingPagePRD.md
├── README.md
├── capacitor.config.ts
├── eslint.config.js
├── index.html
├── migration_add_curation_columns.sql
├── migration_add_file_sizes.sql
├── migration_add_membership_status.sql
├── migration_add_username.sql
├── migration_add_variant_file_sizes.sql
├── migration_fix_admin_rls.sql
├── migration_fix_profile_trigger.sql
├── migration_fix_variants_rls.sql
├── migration_force_profile_trigger.sql
├── migration_update_search_fonts_curation.sql
├── package-lock.json
├── package.json
├── replace_script.py
├── response.json
├── restore_point_2024_01_29.sql
├── simple_test.cjs
├── supabase_setup.sql
├── test_payload.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
└── vite.config.ts
```

---

## 🔌 CLI Companion

For developers who prefer the terminal, this project is paired with **`nobadfonts-cli`**.

**Install globally:**

```bash
npm install nobadfonts-cli
```

**Usage:**

```bash
npx nobadfonts-cli add helvetica
```

> See [`nobadfonts-cli/README.md`](./nobadfonts-cli/README.md) for full documentation.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1.  Fork the repo.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
