# NoBadFonts MCP — Robustness Overhaul (Revised)

Two improvements:
1. **JWT-based RBAC auth** — Replace static `?key=` with proper Supabase JWT auth so the MCP knows who is calling and enforces permissions per role
2. **Selective field tools** — Add tools to fetch and update only the specific fields/sections needed, instead of always working with the full 7-section JSON

Issue 3 (localStorage) is dropped — Supabase anon key is public by design, no change needed.

---

## How the Auth Flow Works

> [!NOTE]
> **The MCP cannot magically know who is logged in.** The server is stateless HTTP — it doesn't see your browser session. Every MCP request must carry the caller's identity in a header.
>
> **How this works in practice for your app:**
> - The user is already logged in to NoBadFonts in their browser — Supabase holds their `access_token` in memory
> - When an AI chat widget is **embedded inside the NoBadFonts app**, the frontend reads `supabase.auth.getSession()` and includes `Authorization: Bearer <access_token>` in every MCP HTTP request automatically
> - The user never manually pastes anything — it's seamless because the token comes from their existing session
> - For **external Claude.ai** MCP connector: the user pastes their token once in the Claude MCP settings (it auto-refreshes if you configure the connector to re-auth)

> [!IMPORTANT]
> The MCP URL becomes simply: `https://wcegdxhvgwbeskaidlxr.supabase.co/functions/v1/mcp`
> Auth header: `Authorization: Bearer <supabase_access_token>`
> No `?key=` in the URL anymore.

## User Review Required

> [!WARNING]
> **New tools for user/member roles** — The plan adds ~8 new MCP tools for user-tier and admin-tier features (font suggestions, liked fonts, storyboard, collections). The `storyboard` table doesn't exist yet in your DB — a new migration will create it. The `favorites` table already exists and will be reused for 
## Proposed Changes

---

### Component 1 — MCP Auth: Replace Static Key with JWT RBAC

#### [MODIFY] [index.ts](file:///c:/Users/bisma/OneDrive/Desktop/TimePass%20Projects/xyz/supabase/functions/mcp/index.ts)

**What changes:**
- Remove the static `MCP_API_KEY` env var guard that checks `?key=` or `Authorization: Bearer <static_key>`
- Add a new auth middleware that verifies the caller's Supabase JWT and reads their `profiles.role`
- All existing tools get role enforcement; new tools are added for each role tier

**New auth middleware (replaces the current static key check):**
```typescript
app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return next(); // allow CORS preflight

  const token = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return c.json({ error: 'Unauthorized: Pass your Supabase access_token as Authorization: Bearer <token>' }, 401);

  // Verify JWT using service role client (bypasses RLS to read profiles)
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error } = await adminClient.auth.getUser(token);
  if (error || !user) return c.json({ error: 'Unauthorized: Invalid or expired token. Get a fresh token from your session.' }, 401);

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, full_name, membership_status')
    .eq('id', user.id)
    .single();

  // Attach caller context for all downstream tool handlers
  c.set('caller', {
    user_id: user.id,
    email: user.email ?? '',
    role: profile?.role ?? 'user',           // 'user' | 'member' | 'admin'
    full_name: profile?.full_name ?? '',
    membership_status: profile?.membership_status ?? 'none'
  });
  await next();
});
```

**Role permission matrix for tools:**

| Tool | `user` | `member` | `admin` |
|---|---|---|---|
| `get_font` | ✅ | ✅ | ✅ |
| `search_fonts` | ✅ | ✅ | ✅ |
| `list_fonts_missing_metadata` | ✅ | ✅ | ✅ |
| `verify_font_sources` | ✅ | ✅ | ✅ |
| `research_font` | ✅ | ✅ | ✅ |
| `suggest_fonts` *(new)* | ✅ | ✅ | ✅ |
| `generate_font_pairing` *(new)* | ✅ | ✅ | ✅ |
| `like_font` / `dislike_font` *(new)* | ✅ | ✅ | ✅ |
| `save_to_storyboard` *(new)* | ✅ | ✅ | ✅ |
| `get_my_storyboard` *(new)* | ✅ | ✅ | ✅ |
| `propose_font_update` | ❌ | ✅ own fonts only | ✅ any font |
| `patch_font_fields` *(new)* | ❌ | ✅ own fonts only | ✅ any font |
| `get_font_sections` *(new)* | ✅ | ✅ | ✅ |
| `get_font_revision` | ❌ | ❌ | ✅ |
| `approve_font_revision` | ❌ | ❌ | ✅ |
| `reject_font_revision` | ❌ | ❌ | ✅ |
| `publish_font_revision` | ❌ | ❌ | ✅ |
| `rollback_font_revision` | ❌ | ❌ | ✅ |
| `create_collection` *(new)* | ❌ | ❌ | ✅ |
| `update_collection` *(new)* | ❌ | ❌ | ✅ |

**New user-tier tools (require `user` role):**

- **`suggest_fonts`** — Takes a natural language description of the user's need (e.g. "bold sans for a tech startup logo") and returns the best matching fonts from the database using category/tag search, plus AI-generated reasoning for each
- **`generate_font_pairing`** — Given a primary font slug, suggests 2-3 complementary pairing fonts with rationale
- **`like_font`** — Saves a font to the user's `favorites` table (existing table), or removes it if already liked (toggle)
- **`dislike_font`** — Saves a dislike preference to a new `font_preferences` table
- **`save_to_storyboard`** — Adds a font to the user's storyboard with optional note
- **`get_my_storyboard`** — Retrieves all fonts the user saved to their storyboard, including liked fonts and their personal notes

**New admin-tier tools (require `admin` role):**

- **`create_collection`** — Creates a curated font collection (featured, trending, seasonal, mood-based, wedding, holiday, editor's choice, etc.) with title, description, and theme
- **`update_collection`** — Adds/removes fonts from a collection, updates ordering, title, description, or status

---

### Component 2 — Selective Field Access & Updates

**Current problem:** To update just `description.description` or `official_links.purchase_url`, the AI has to:
1. Call `get_font` → gets the entire 7-section JSON
2. Submit the entire JSON in `changes` (or at least the whole section)
3. Even though `propose_font_update` deep-merges, the AI still has to deal with the full schema

**The fix — 2 new tools + improved clarity:**

#### [NEW] Tool: `get_font_sections`
Fetches **only the specific sections or fields** you need from a font, without returning the full taxonomy.

```
get_font_sections(slug: "oreon", sections: ["description", "license"])
→ Returns only those 2 sections from the canonical taxonomy

get_font_sections(slug: "oreon", fields: ["description.description", "official_links.purchase_url"])
→ Returns only those 2 specific field values
```

This is used BEFORE `patch_font_fields` — so the AI can see exactly what's currently stored for just the fields it needs to update.

#### [NEW] Tool: `patch_font_fields`
A lightweight, flat-key syntax for proposing targeted field updates. Under the hood it wraps `propose_font_update` but with a much simpler interface:

```
patch_font_fields(
  slug: "oreon",
  patches: {
    "description.description": "A bold geometric sans...",
    "official_links.purchase_url": "https://example.com/buy"
  },
  rationale: "Updated description based on verified research."
)
→ Internally creates a revision that ONLY touches those 2 fields.
   All other fields in the taxonomy are untouched.
```

The key difference from `propose_font_update`: you use dot-notation keys (`section.field`) instead of nested objects. Much easier for AI to generate for targeted edits.

#### [MODIFY] [tools.ts](file:///c:/Users/bisma/OneDrive/Desktop/TimePass%20Projects/xyz/supabase/functions/mcp/tools.ts)

New handlers to add:
- `handleGetFontSections` — fetches only the requested sections/fields from the canonical taxonomy
- `handlePatchFontFields` — converts flat dot-notation patches into a proper `propose_font_update` call
- `handleSuggestFonts` — searches fonts using category/tag matching
- `handleGenerateFontPairing` — returns complementary font suggestions
- `handleLikeFont` — upsert/delete from `favorites` table for the authenticated user
- `handleDislikeFont` — upsert/delete from `font_preferences` table
- `handleSaveToStoryboard` — insert into `storyboard_fonts` table
- `handleGetMyStoryboard` — fetch user's storyboard with joined font data
- `handleCreateCollection` — insert into `curated_collections` table (admin only)
- `handleUpdateCollection` — update collection metadata and font membership (admin only)

All handlers receive the `caller` object (with `user_id` and `role`) from the Hono context.

---

### Component 3 — New SQL Migration

#### [NEW] `supabase/migrations/20260917_mcp_rbac.sql`

Tables to create:

**`storyboard_fonts`** — user's saved font storyboard
```sql
CREATE TABLE storyboard_fonts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  font_id UUID NOT NULL REFERENCES fonts(id) ON DELETE CASCADE,
  note TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, font_id)
);
-- RLS: users can only read/write their own rows
```

**`font_preferences`** — user dislike tracking
```sql
CREATE TABLE font_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  font_id UUID NOT NULL REFERENCES fonts(id) ON DELETE CASCADE,
  preference TEXT CHECK (preference IN ('dislike')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, font_id)
);
```

**`curated_collections`** — admin site curation
```sql
CREATE TABLE curated_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT, -- 'featured', 'trending', 'seasonal', 'mood', 'wedding', 'holiday', etc.
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  font_ids UUID[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: readable by all, writable only by admin role
```

RLS policies for all new tables + RLS on `font_revisions` so members can only propose for fonts they uploaded.

---

## Verification Plan

### Deploy & Test
```bash
supabase functions deploy mcp
```

**Auth tests:**
- No token → `401 Unauthorized`
- Invalid/expired token → `401 Unauthorized`
- Valid user token + admin tool → `403 Forbidden`
- Valid admin token + admin tool → ✅ works

**Selective update test:**
```
get_font_sections("oreon", sections: ["description"])
→ Only description section returned

patch_font_fields("oreon", { "description.description": "Updated text" })
→ Creates revision touching only description.description
→ Other taxonomy fields untouched after publish
```

### Manual Verification
- Log in to NoBadFonts in browser
- Copy `access_token` from DevTools → Application → Local Storage → `sb-wcegdxhvgwbeskaidlxr-auth-token`
- Test MCP call: `curl -H "Authorization: Bearer <token>" https://wcegdxhvgwbeskaidlxr.supabase.co/functions/v1/mcp`
- Test role enforcement: user token rejected for `approve_font_revision`
your_access_token>` and verify role-gated tools behave correctly


---

## RESUME CONTEXT (added for future sessions)

- **Status: APPROVED BY USER, NOT YET EXECUTED**
- **Project:** `c:\Users\bisma\OneDrive\Desktop\TimePass Projects\xyz`
- **Supabase project ref:** `wcegdxhvgwbeskaidlxr`
- `profiles` table already has `role: 'user' | 'member' | 'admin'` and `membership_status` columns ?
- `favorites` table already exists (reused for like_font) ?
- `storyboard_fonts`, `font_preferences`, `curated_collections` tables do NOT exist yet � need migration ?
- Current MCP has 11 tools; target is 21 tools (11 existing + 10 new)
- `deepMerge` function already exists in `tools.ts` � `patch_font_fields` will use it ?
- Gemini gem research instructions are already embedded in `index.ts` as a resource ?
- When resuming, read this file + `supabase/functions/mcp/index.ts` + `supabase/functions/mcp/tools.ts` to get context

