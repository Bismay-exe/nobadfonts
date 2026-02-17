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
src
├── assets
├── components
│   ├── admin
│   │   └── FixWoff2Scanner.tsx
│   ├── font-pairing
│   │   ├── CustomizeSidebar.tsx
│   │   └── FontPickerSidebar.tsx
│   ├── fonts
│   │   ├── ContextPreview.tsx
│   │   ├── Filters.tsx
│   │   ├── FontCard.tsx
│   │   ├── FontPairingFilters.tsx
│   │   ├── FontTester.tsx
│   │   ├── GlyphMap.tsx
│   │   ├── LicenseInfo.tsx
│   │   ├── PreviewAccordion.tsx
│   │   ├── ShareModal.tsx
│   │   └── SocialShareCard.tsx
│   ├── home
│   │   ├── Hero
│   │   │   ├── 1.tsx
│   │   │   ├── 2.tsx
│   │   │   └── 4.tsx
│   │   ├── Land2.tsx
│   │   ├── Land3.tsx
│   │   ├── Land4.tsx
│   │   ├── Land5.tsx
│   │   ├── Land7.tsx
│   │   ├── Land8.tsx
│   │   └── Landing.tsx
│   ├── layout
│   │   ├── Footer.tsx
│   │   ├── Layout.tsx
│   │   ├── Navbar.tsx
│   │   └── ScrollRestoration.tsx
│   ├── profile
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── FontGrid.tsx
│   │   ├── ProfileHeader.tsx
│   │   └── SettingsForm.tsx
│   ├── shared
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── SEO.tsx
│   └── UploadProgressPopup.tsx
├── contexts
│   ├── AuthContext.tsx
│   └── UploadContext.tsx
├── hooks
│   ├── useFont.ts
│   ├── useFonts.ts
│   ├── useLenis.ts
│   ├── useMediaQuery.ts
│   └── useViewMode.ts
├── lib
│   └── supabase.ts
├── pages
│   ├── AdminDashboard.tsx
│   ├── Auth.tsx
│   ├── Cli.tsx
│   ├── DesignerFonts.tsx
│   ├── FontDetails.tsx
│   ├── FontPairing.tsx
│   ├── FontsCatalog.tsx
│   ├── Home.tsx
│   ├── MemberDetails.tsx
│   ├── Members.tsx
│   ├── Profile.tsx
│   └── Upload.tsx
├── types
│   ├── database.types.ts
│   └── font.ts
├── utils
│   ├── fontDescriptionGenerator.ts
│   └── woff2.ts
├── workers
├── App.tsx
├── fonts.css
├── index.css
├── main.tsx
└── vite-env.d.ts
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
