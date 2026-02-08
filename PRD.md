# NoBadFonts – Advanced Font Delivery Architecture

## Variable Fonts, Subsets, and Performance Optimization

This document extends the base font import system with support for:

* Variable fonts
* Language subsets
* Performance optimization similar to Google Fonts
* Scalable delivery architecture

---

# Goals

Allow developers to load fonts like:

```html
<link rel="stylesheet" href="https://nobadfonts.com/css/satoshi.css">
```

Or with options:

```html
<link rel="stylesheet" href="https://nobadfonts.com/css/satoshi.css?weights=400,700&subset=latin">
```

---

# Architecture Overview

```
Upload Font
    ↓
Normalize metadata
    ↓
Convert to WOFF2
    ↓
Generate subsets (optional)
    ↓
Store in Supabase Storage
    ↓
CSS endpoint generates @font-face
    ↓
User imports via URL
```

---

# Variable Fonts

Variable fonts allow multiple weights in a single file.

Example CSS:

```css
@font-face {
  font-family: "Satoshi Variable";
  src: url("https://cdn.nobadfonts.com/fonts/satoshi/variable.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
}
```

Advantages:

* Smaller downloads
* Smooth weight interpolation
* Fewer requests

Recommended:
Prefer variable fonts whenever available.

---

# Detecting Variable Fonts

Use FontTools:

```bash
ttx -l font.ttf
```

Look for:

```
fvar table
```

If present, it is a variable font.

---

# Subset Generation

Subsets reduce file size by removing unused glyphs.

Examples:

* latin
* latin-ext
* cyrillic
* devanagari

---

# Creating Subsets

Using FontTools:

```bash
pyftsubset font.ttf \
  --flavor=woff2 \
  --unicodes="U+0000-00FF" \
  --output-file=font-latin.woff2
```

Example subsets:

| Subset    | Unicode Range |
| --------- | ------------- |
| latin     | U+0000-00FF   |
| latin-ext | U+0100-024F   |
| cyrillic  | U+0400-04FF   |

---

# Storage Structure

```
/fonts
  /satoshi
    /variable
      variable.woff2
    /static
      400.woff2
      700.woff2
    /subsets
      latin-400.woff2
      latin-700.woff2
```

---

# CSS Endpoint Design

Route:

```
/css/{font}.css
```

Parameters:

| Parameter | Example | Purpose               |
| --------- | ------- | --------------------- |
| weights   | 400,700 | Load specific weights |
| subset    | latin   | Load subset           |
| variable  | true    | Prefer variable font  |

---

# Example Request

```
/css/satoshi.css?weights=400,700&subset=latin
```

---

# Example CSS Response

```css
@font-face {
  font-family: "Satoshi";
  src: url("https://cdn.nobadfonts.com/fonts/satoshi/subsets/latin-400.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Satoshi";
  src: url("https://cdn.nobadfonts.com/fonts/satoshi/subsets/latin-700.woff2") format("woff2");
  font-weight: 700;
  font-display: swap;
}
```

---

# Fallback Strategy

Serve formats in priority order:

1. WOFF2
2. WOFF (optional fallback)

Avoid:

* Serving TTF or OTF directly to browsers

---

# Performance Optimization

## Caching

Set headers:

```
Cache-Control: public, max-age=31536000, immutable
```

Fonts rarely change and should be cached aggressively.

---

## Preload (Optional)

Developers may preload:

```html
<link rel="preload" as="font" type="font/woff2" crossorigin href="...">
```

---

# API Logic Flow

```
Request CSS
    ↓
Parse query parameters
    ↓
Check available font files
    ↓
Generate @font-face rules
    ↓
Return CSS
```

---

# Metadata Table (Recommended)

Fonts table:

| Field       | Description       |
| ----------- | ----------------- |
| id          | unique id         |
| family_name | Font family       |
| weights     | available weights |
| variable    | boolean           |
| subsets     | available subsets |
| file_paths  | storage paths     |

---

# Suggested Backend Structure

```
/api
  /css
    [font].ts
```

Steps:

1. Read font metadata
2. Parse query
3. Generate CSS dynamically
4. Return with caching headers

---

# CDN Strategy

Recommended:

* Supabase Storage public bucket
* Optional CDN layer

Benefits:

* Global caching
* Fast downloads

---

# Future Improvements

Possible advanced features:

1. Unicode-range CSS generation
2. Automatic subset detection
3. Preview text API
4. Font versioning
5. CLI integration

---

# Final Scalable Architecture

```
Upload Font
    ↓
Normalize metadata
    ↓
Convert to WOFF2
    ↓
Generate subsets
    ↓
Store in CDN
    ↓
CSS endpoint generates rules
    ↓
User imports fonts
```

---

End of Document
