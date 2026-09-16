Absolutely. Based on everything we discussed, I would **not** use the earlier "separate Node MCP server at `mcp.nobadfonts.in`" architecture.

The final design should be a **remote, authenticated MCP server deployed as a Supabase Edge Function**, using the Supabase project's own stable URL. That keeps the MCP layer independent from whatever happens to your frontend domain later. Supabase currently documents this exact pattern and explicitly lists Claude and ChatGPT as MCP clients. ([Supabase][1])

Below is the PRD I'd give to your AI coding IDE.

# NoBadFonts MCP — Product Requirements Document

**Project:** NoBadFonts
**Feature:** NoBadFonts MCP Server
**Version:** 1.0
**Status:** Planned
**Primary purpose:** Allow AI clients such as Claude and ChatGPT to securely research, inspect, validate, propose changes to, and eventually update NoBadFonts font metadata through the Model Context Protocol.

---

## 1. Product Overview

NoBadFonts will expose its font database and research capabilities through a **remote MCP server**.

The MCP server will allow compatible AI clients to interact with NoBadFonts using natural language.

Example:

> "Research Offbit. Find the actual creator/foundry, license, official font page and official links. Compare the results with the existing NoBadFonts metadata and prepare an update."

The AI client will use MCP tools exposed by NoBadFonts to:

1. Find the font.
2. Retrieve its existing metadata.
3. Identify missing or questionable information.
4. Research the web.
5. Evaluate sources.
6. Distinguish official sources from aggregators.
7. Normalize the findings into the NoBadFonts taxonomy.
8. Validate the proposed data.
9. Create a proposed revision.
10. Optionally apply/publish the revision after authorization.

The MCP server must work independently of the NoBadFonts frontend domain.

---

# 2. Core Architectural Decision

## Do NOT use

```text
mcp.nobadfonts.in
```

The `nobadfonts.in` domain may eventually expire.

The MCP server must therefore **not depend on the website domain**.

## Use

```text
https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/mcp
```

Supabase's current MCP documentation uses this architecture and provides a remote Streamable HTTP endpoint for the deployed Edge Function. ([Supabase][1])

This means:

```text
Frontend domain
     │
     │ can change
     ▼
nobadfonts.in
     ↓
nobadfonts.vercel.app
     ↓
nobadfonts.xyz
     ↓
future domain
```

does not affect:

```text
MCP endpoint
     │
     ▼
Supabase project
     │
     ▼
NoBadFonts database
```

### Requirement

The MCP endpoint must be based on the Supabase project URL and must never depend on:

* `nobadfonts.in`
* `nobadfonts.vercel.app`
* `nobadfonts.xyz`
* any other frontend hostname

A custom MCP domain may be added in the future, but it is explicitly out of scope for v1.

---

# 3. Why Supabase Edge Functions

The existing NoBadFonts architecture already uses Supabase.

Therefore the MCP server should run as:

```text
Supabase Edge Function
        +
MCP protocol
        +
Supabase database
```

instead of introducing another standalone backend service.

Supabase currently provides an official guide for building MCP servers directly on Edge Functions and supports Streamable HTTP. ([Supabase][1])

Advantages:

* No separate server to maintain.
* No separate hosting platform.
* Direct access to Supabase.
* Same TypeScript ecosystem.
* Existing Supabase infrastructure can be reused.
* Deployment is independent of frontend hosting.
* Remote HTTPS endpoint works with web-based AI clients.
* Can later be connected to multiple MCP clients.

---

# 4. MCP Transport

The MCP server must use:

**Streamable HTTP**

Do not build the new implementation around the deprecated HTTP+SSE transport.

The current MCP specification defines `stdio` and **Streamable HTTP** as the standard transports, with Streamable HTTP replacing the older HTTP+SSE transport. ([Model Context Protocol][2])

The endpoint should therefore be:

```text
POST /functions/v1/mcp
GET  /functions/v1/mcp
```

or the equivalent routing required by the chosen Supabase MCP implementation.

---

# 5. Supported AI Clients

The server should be designed as a **client-agnostic MCP server**.

Initial target clients:

### Claude

Claude supports remote MCP custom connectors. Users can add a remote MCP server from:

```text
Claude
→ Settings
→ Connectors
→ Add custom connector
```

Claude's current documentation confirms remote MCP custom connectors. ([Claude Help Center][3])

### ChatGPT

ChatGPT supports remote MCP apps through Developer Mode/custom MCP functionality.

The current OpenAI documentation states that ChatGPT connects to remote MCP servers and requires a public HTTPS URL for this workflow. ([OpenAI Help Center][4])

The MCP implementation must therefore not contain Claude-specific or ChatGPT-specific logic.

---

# 6. Primary User Stories

## Story 1 — Inspect a font

User:

> "Show me the current NoBadFonts data for Offbit."

AI:

```text
get_font
```

returns the current record.

---

## Story 2 — Research missing metadata

User:

> "Research Offbit and find what's missing."

AI:

```text
get_font
        ↓
research_font
        ↓
verify_sources
```

returns the research findings.

---

## Story 3 — Verify official sources

User:

> "Find the official website for Offbit."

The system must prioritize:

```text
1. Font creator's official website
2. Foundry's official website
3. Official font page
4. Official repository
5. Official marketplace/distributor
```

The system must **not automatically classify aggregators as official sources**.

Examples of sites that should not automatically be considered official:

```text
Befonts
WhatFontIs
DaFont
1001Fonts
FontSpace
random font blogs
font download aggregators
```

These may be useful as secondary evidence but must not be marked as the official owner/foundry source without evidence.

---

# 7. Critical Research Principle

The MCP server must distinguish between:

### Source

A website containing information about the font.

### Official source

A source controlled by:

* the designer,
* foundry,
* publisher,
* official organization,
* official repository,
* or legitimate official distributor.

These are not equivalent.

Example:

```json
{
  "url": "https://example-font-aggregator.com/offbit",
  "source_type": "secondary",
  "is_official": false
}
```

versus:

```json
{
  "url": "https://creator.com/offbit",
  "source_type": "creator",
  "is_official": true
}
```

---

# 8. MCP Tool Architecture

The MCP server should expose a small number of **purpose-built tools**.

Do not expose arbitrary database operations.

Recommended tools:

```text
get_font
search_fonts
list_fonts_missing_metadata
research_font
verify_font_sources
propose_font_update
get_font_revision
publish_font_revision
```

Potential future tools:

```text
reject_font_revision
rollback_font_revision
batch_research_fonts
batch_propose_updates
```

---

# 9. `get_font`

### Purpose

Retrieve the complete current NoBadFonts record.

### Input

```json
{
  "slug": "offbit"
}
```

### Output

Should include:

```text
font identity
taxonomy
creator
classification
description
license
official links
variants
research information
metadata status
last updated information
```

The output should be structured JSON rather than an unstructured text blob whenever possible.

---

# 10. `search_fonts`

### Purpose

Find fonts by:

* name
* slug
* creator
* foundry
* category
* tags
* metadata status

Example:

```json
{
  "query": "offbit",
  "limit": 10
}
```

---

# 11. `list_fonts_missing_metadata`

### Purpose

Identify fonts that need research.

Example:

```json
{
  "filter": "missing_official_links",
  "limit": 25
}
```

Supported filters:

```text
missing_creator
missing_foundry
missing_license
missing_license_source
missing_official_website
missing_official_font_page
missing_purchase_link
conflicting_sources
stale_research
```

---

# 12. `research_font`

This is the most important tool.

### Purpose

Research a font using available web/search capabilities and return structured findings.

Input:

```json
{
  "font_id": "...",
  "research_targets": [
    "creator",
    "foundry",
    "license",
    "official_website",
    "official_font_page",
    "purchase_link"
  ]
}
```

### Output

Example:

```json
{
  "font": "Offbit",
  "confidence": "high",
  "findings": {
    "creator": {},
    "foundry": {},
    "license": {},
    "official_links": {}
  },
  "sources": [],
  "conflicts": [],
  "missing": []
}
```

---

# 13. Research Must Preserve Provenance

Every researched field should ideally have source information.

Example:

```json
{
  "creator": {
    "value": "Example Designer",
    "source": {
      "url": "https://example.com/offbit",
      "type": "official_creator",
      "is_official": true
    },
    "confidence": "high"
  }
}
```

Do not simply produce:

```json
{
  "creator": "Example Designer"
}
```

without knowing where that information came from.

---

# 14. Source Confidence

Every important research finding should receive a confidence classification:

```text
high
medium
low
unknown
```

Example:

```json
{
  "license": {
    "value": "OFL-1.1",
    "confidence": "high",
    "source_count": 2
  }
}
```

Confidence must be based on evidence, not the model's subjective certainty alone.

---

# 15. Conflict Detection

If sources disagree, the system must **not silently choose one**.

Example:

```text
Source A:
Creator = X

Source B:
Creator = Y
```

The output should contain:

```json
{
  "conflicts": [
    {
      "field": "creator",
      "values": [
        "X",
        "Y"
      ],
      "status": "requires_review"
    }
  ]
}
```

The AI should tell the user that the field is disputed.

---

# 16. URL Sanitization

NoBadFonts already has a `cleanUrl` utility.

The MCP implementation should reuse the existing URL normalization/sanitization logic where compatible with the Edge Function environment.

Every URL entering the database must be normalized before persistence.

Examples of normalization:

```text
remove tracking parameters
normalize protocol
remove unnecessary fragments
normalize trailing slash where appropriate
validate URL structure
```

However:

**URL cleaning must never change the semantic destination.**

---

# 17. `verify_font_sources`

This tool exists separately from research.

### Purpose

Take discovered URLs and determine their role.

Example:

```json
{
  "font": "Offbit",
  "urls": [
    "...",
    "...",
    "..."
  ]
}
```

Return:

```json
{
  "sources": [
    {
      "url": "...",
      "classification": "official_creator",
      "is_official": true
    },
    {
      "url": "...",
      "classification": "secondary_aggregator",
      "is_official": false
    }
  ]
}
```

This separation is important because **finding a URL and determining whether it is official are different tasks**.

---

# 18. Do NOT immediately overwrite database data

This is one of the most important architectural decisions.

Do not make:

```text
research → UPDATE production
```

the default behavior.

Instead:

```text
research
   ↓
proposed changes
   ↓
validation
   ↓
revision
   ↓
approval
   ↓
publish
```

---

# 19. `propose_font_update`

### Purpose

Generate a proposed revision without modifying the canonical font record.

Input:

```json
{
  "font_id": "...",
  "changes": {
    "creator": {},
    "license": {},
    "official_links": {}
  },
  "sources": []
}
```

The server should:

1. Validate the structure.
2. Validate URLs.
3. Validate taxonomy.
4. Compare against current data.
5. Detect conflicts.
6. Store a revision.
7. Return a revision ID.

Example:

```json
{
  "revision_id": "rev_123",
  "status": "pending_review",
  "changes": {},
  "validation": {
    "valid": true,
    "warnings": []
  }
}
```

---

# 20. `publish_font_revision`

Only a validated and authorized revision can be published.

Input:

```json
{
  "revision_id": "rev_123"
}
```

Before publishing:

```text
Check authorization
        ↓
Check revision exists
        ↓
Check revision status
        ↓
Validate taxonomy
        ↓
Validate URLs
        ↓
Check conflicts
        ↓
Write database transaction
        ↓
Mark revision published
```

---

# 21. Database Design

The existing:

```text
fonts
```

table remains the canonical source for published font metadata.

Existing JSONB taxonomy should remain compatible with the current NoBadFonts schema.

Add/maintain a research table:

```text
font_research
```

Recommended additional table:

```text
font_revisions
```

### `font_revisions`

Suggested structure:

```text
id
font_id
status
proposed_taxonomy
proposed_research
source_snapshot
validation_result
created_by
created_at
reviewed_at
published_at
```

Possible statuses:

```text
draft
pending_review
approved
published
rejected
superseded
```

---

# 22. Research Source Storage

Research should not only store the final answer.

Store the evidence.

Example:

```json
{
  "sources": [
    {
      "url": "...",
      "title": "...",
      "source_type": "official_creator",
      "is_official": true,
      "accessed_at": "...",
      "supports": [
        "creator",
        "license"
      ]
    }
  ]
}
```

This makes later auditing possible.

---

# 23. Authentication

The MCP server will have **write access**, so production authentication is mandatory.

Do not expose:

```text
public MCP
   ↓
service role
   ↓
database writes
```

without authorization.

Supabase's current MCP guidance supports authenticated MCP servers using Supabase Auth and RLS. ([Supabase][1])

The production architecture should therefore be:

```text
Claude / ChatGPT
       ↓
MCP Authorization
       ↓
Supabase Edge Function
       ↓
authorized tool
       ↓
Supabase
```

---

# 24. Supabase Secrets

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
```

or equivalent secret credentials to:

* Claude
* ChatGPT
* browser
* frontend
* MCP tool arguments
* GitHub
* public environment variables

Secrets must remain server-side.

Where possible, use the authenticated user's Supabase identity and RLS rather than giving the MCP server unrestricted database access.

---

# 25. Permission Model

Tools should have explicit permission categories.

### Read

```text
get_font
search_fonts
list_fonts_missing_metadata
get_font_revision
```

### Research

```text
research_font
verify_font_sources
```

### Write / mutation

```text
propose_font_update
publish_font_revision
```

Potential future destructive operations should require stronger authorization.

---

# 26. Important MCP Security Requirements

The MCP specification recommends proper authentication and requires servers implementing Streamable HTTP to validate the `Origin` header to protect against DNS rebinding attacks. ([Model Context Protocol][2])

The implementation must therefore:

* Validate `Origin`.
* Implement authentication.
* Validate every tool input.
* Never trust model-generated IDs blindly.
* Restrict database operations.
* Prevent arbitrary SQL.
* Rate-limit where appropriate.
* Log tool execution.
* Never expose secrets.
* Return safe error messages.
* Avoid arbitrary URL fetching unless explicitly required.
* Validate external URLs before storing them.

---

# 27. No Arbitrary Database Tool

Do **not** expose something like:

```text
execute_sql(sql)
```

to Claude or ChatGPT.

The MCP server should provide domain-specific tools.

Bad:

```text
run_sql("UPDATE fonts SET ...")
```

Good:

```text
publish_font_revision({
  revision_id: "..."
})
```

This dramatically reduces the blast radius of a bad AI decision.

---

# 28. Taxonomy Validation

The MCP server must validate all proposed metadata against the NoBadFonts taxonomy schema.

If the taxonomy requires:

```text
identity
creator
classification
description
license
official_links
```

the MCP server should enforce those rules.

AI output should never directly become trusted database data.

Pipeline:

```text
AI output
   ↓
JSON schema validation
   ↓
business validation
   ↓
source validation
   ↓
URL validation
   ↓
revision
```

---

# 29. Research vs Database Truth

The system must clearly distinguish:

```text
Research result
```

from:

```text
Canonical NoBadFonts data
```

For example:

```text
research:
creator = "X"

canonical:
creator = "Y"
```

until a revision is approved.

Never silently replace canonical data merely because a model generated different information.

---

# 30. Example End-to-End Workflow

User asks:

> Research Offbit and update its NoBadFonts metadata.

### Step 1

```text
get_font("offbit")
```

### Step 2

Analyze:

```text
Missing:
✓ creator
✓ official website

Existing:
✓ classification
✓ description

Potentially outdated:
license
```

### Step 3

```text
research_font("offbit")
```

### Step 4

Research sources.

### Step 5

```text
verify_font_sources(...)
```

### Step 6

Compare new evidence with current database.

### Step 7

Create:

```text
propose_font_update(...)
```

### Step 8

Validation:

```text
✓ taxonomy valid
✓ URLs valid
✓ official creator verified
✓ license source found
✓ no unresolved conflicts
```

### Step 9

Create revision:

```text
revision_id = rev_123
```

### Step 10

User/authorized AI approves:

```text
publish_font_revision(rev_123)
```

### Step 11

Database transaction updates:

```text
fonts
font_research
font_revisions
```

---

# 31. Natural Language Experience

The user should never need to know the underlying MCP tool names.

They should be able to say:

> "What do we know about Cabinet Grotesk?"

or:

> "Find missing official information for Cabinet Grotesk."

or:

> "Research the license and verify it."

or:

> "Prepare an update but don't publish anything."

or:

> "Apply the verified changes."

The MCP descriptions should be written clearly enough that the AI can select the appropriate tool.

---

# 32. Batch Research

Future feature.

User:

> "Find all fonts missing official websites."

MCP:

```text
list_fonts_missing_metadata
        ↓
12 fonts
        ↓
research_font × 12
        ↓
verify sources
        ↓
create revisions
```

Do not automatically publish the results.

---

# 33. Stale Research

Research should have timestamps.

Example:

```json
{
  "researched_at": "2026-09-16T...",
  "research_version": 1
}
```

Future tool:

```text
refresh_stale_research
```

could identify information that hasn't been verified for a defined period.

---

# 34. Audit Log

Every mutation should be auditable.

Record:

```text
who
what
when
before
after
sources
revision
client
```

Example:

```json
{
  "action": "publish_font_revision",
  "font_id": "...",
  "revision_id": "...",
  "client": "claude",
  "timestamp": "...",
  "changed_fields": [
    "creator",
    "license",
    "official_links"
  ]
}
```

---

# 35. AI Client Identification

Where available, log the MCP client information:

```text
claude
chatgpt
cursor
other
```

This is useful for debugging and audit purposes.

Do not make business logic depend on a specific client.

---

# 36. ChatGPT Integration

The MCP server must provide a public HTTPS endpoint.

Example:

```text
https://PROJECT_REF.supabase.co/functions/v1/mcp
```

ChatGPT's current documentation states that custom MCP apps connect to remote MCP servers, and its current full MCP/write support is rolling out to Business, Enterprise, and Edu; Pro currently has read/fetch MCP access in Developer Mode. ([OpenAI Help Center][4])

Therefore:

**Build the MCP server to support write operations regardless of current ChatGPT plan availability.**

The server should not be redesigned around today's ChatGPT plan limitations.

---

# 37. Claude Integration

Claude supports remote MCP custom connectors.

Connection:

```text
Claude
→ Settings
→ Connectors
→ Add custom connector
→ NoBadFonts MCP URL
```

Claude's current documentation confirms custom connectors can connect to remote MCP servers. ([Claude Help Center][3])

---

# 38. Frontend Independence

The MCP system must have **zero dependency on the frontend deployment**.

This means the MCP server must not import frontend-only code such as:

```text
React components
browser utilities
window
document
Vite-only environment variables
```

Shared utilities should be extracted into backend-compatible modules.

Example:

```text
src/
   shared/
      taxonomy/
      url/
      validation/

supabase/
   functions/
      mcp/
```

If an existing frontend utility cannot run in Deno, create a backend-compatible equivalent rather than coupling the MCP server to the frontend build.

---

# 39. Recommended Project Structure

A possible final structure:

```text
NoBadFonts/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   │
│   └── shared/
│       ├── taxonomy/
│       ├── validation/
│       └── url/
│
├── supabase/
│   ├── functions/
│   │
│   ├── mcp/
│   │
│   └── migrations/
│
│       ├── ...
│
└── ...
```

Or, preferably, keep the MCP function entirely under:

```text
supabase/functions/mcp/
```

because it is deployed as an Edge Function.

Supabase's current MCP examples use this deployment model. ([Supabase][1])

---

# 40. Technology Stack

### MCP

Official MCP TypeScript SDK or a lightweight MCP framework compatible with Supabase Edge Functions.

Supabase currently documents both the official SDK and `mcp-lite` approach. ([Supabase][5])

### Runtime

```text
Supabase Edge Runtime / Deno
```

### Database

```text
Supabase PostgreSQL
```

### Validation

```text
Zod
+
NoBadFonts taxonomy schema
```

### Transport

```text
MCP Streamable HTTP
```

### Authentication

```text
Supabase Auth
+
MCP authorization
+
RLS where appropriate
```

---

# 41. Research Engine

The MCP server itself should **not necessarily be responsible for doing every piece of web research directly**.

Instead, create a clean abstraction:

```text
MCP
 ↓
Research Service
 ↓
Search Provider(s)
 ↓
Source Extraction
 ↓
Source Verification
 ↓
Structured Result
```

This allows the underlying research provider to change later.

For example:

```text
Gemini Grounded Search
```

could remain one research backend.

Later:

```text
another search API
```

could replace it without changing the MCP interface.

---

# 42. Research Provider Independence

Do not make the MCP API expose:

```text
gemini_search()
```

Instead expose:

```text
research_font()
```

The MCP consumer shouldn't care whether NoBadFonts uses:

* Gemini
* Google Search
* another search provider
* internal crawlers
* multiple providers

That is an implementation detail.

---

# 43. Error Handling

Errors must be structured.

Example:

```json
{
  "success": false,
  "error": {
    "code": "SOURCE_CONFLICT",
    "message": "Multiple credible sources disagree about the creator.",
    "requires_review": true
  }
}
```

Suggested error codes:

```text
FONT_NOT_FOUND
INVALID_FONT_ID
INVALID_TAXONOMY
SOURCE_NOT_FOUND
SOURCE_CONFLICT
OFFICIAL_SOURCE_UNVERIFIED
LICENSE_UNVERIFIED
INVALID_URL
REVISION_NOT_FOUND
REVISION_ALREADY_PUBLISHED
UNAUTHORIZED
FORBIDDEN
RESEARCH_FAILED
DATABASE_ERROR
```

---

# 44. Safety Rules for AI Updates

The MCP server must enforce:

### Never

* Invent creator information.
* Invent license information.
* Mark an aggregator as official without evidence.
* Replace verified information with lower-confidence information.
* Publish unresolved conflicts.
* Accept arbitrary SQL.
* expose secrets.
* silently delete metadata.

### Always

* Preserve source provenance.
* Validate URLs.
* Validate taxonomy.
* Detect conflicts.
* preserve revision history.
* authenticate write operations.
* log mutations.

---

# 45. Versioning

The MCP server should have its own version:

```text
1.0.0
```

Tool schemas should be treated as API contracts.

Changes that break existing clients should result in a versioned change rather than silently changing tool behavior.

---

# 46. Testing Requirements

Before production:

### Unit tests

Test:

```text
taxonomy validation
URL cleaning
source classification
conflict detection
revision generation
authorization
```

### MCP tests

Test:

```text
initialize
tools/list
tools/call
```

### Integration tests

Test:

```text
Claude → MCP → Supabase
ChatGPT → MCP → Supabase
MCP → research service
MCP → revision creation
MCP → publication
```

The official MCP Inspector should be used during development. Supabase's current MCP deployment documentation recommends the MCP Inspector for testing the server and tools. ([Supabase][1])

---

# 47. Development Phases

## Phase 1 — MCP Foundation

Build:

```text
MCP Edge Function
Streamable HTTP
authentication
basic health endpoint
```

Tools:

```text
get_font
search_fonts
```

---

## Phase 2 — Research

Add:

```text
research_font
verify_font_sources
list_fonts_missing_metadata
```

Integrate the existing NoBadFonts research logic.

---

## Phase 3 — Revision System

Add:

```text
propose_font_update
get_font_revision
```

Create:

```text
font_revisions
```

table.

---

## Phase 4 — Publishing

Add:

```text
publish_font_revision
```

with strong authorization.

---

## Phase 5 — Claude

Connect:

```text
Claude Custom Connector
```

Test complete workflow.

---

## Phase 6 — ChatGPT

Connect the same endpoint through ChatGPT's supported custom MCP/developer-mode flow.

Test read operations first, then write operations where the account/workspace supports them. OpenAI's current documentation says full MCP/write functionality is still rolling out. ([OpenAI Help Center][4])

---

## Phase 7 — Batch Operations

Add:

```text
batch research
missing metadata reports
stale research detection
```

---

# 48. Future NoBadFonts AI Admin

Eventually the MCP system could become the backend interface for an AI-powered NoBadFonts administration workflow:

```text
                  NoBadFonts
                       │
              ┌────────┴────────┐
              │                 │
           Website             MCP
              │                 │
              │          ┌──────┼──────┐
              │          │      │      │
              │       Claude ChatGPT Cursor
              │
              ▼
           Supabase
```

The same canonical database is used everywhere.

---

# 49. Domain Strategy

### Current frontend

```text
nobadfonts.in
```

### Future possibilities

```text
nobadfonts.vercel.app
nobadfonts.xyz
another domain
```

### MCP

Always:

```text
https://PROJECT_REF.supabase.co/functions/v1/mcp
```

unless a custom MCP domain is intentionally introduced later.

This is a hard architectural requirement.

---

# 50. Non-Goals for v1

Do **not** build:

* A custom MCP domain.
* A separate Node backend.
* Arbitrary SQL execution.
* Automatic mass publishing.
* Automatic deletion.
* Full autonomous database administration.
* MCP UI inside ChatGPT.
* MCP UI inside Claude.
* Multiple research providers initially.
* Complex batch operations initially.

First make the core research/update pipeline reliable.

---

# 51. Definition of Done

The feature is considered complete when all of the following are true:

### Infrastructure

* [ ] MCP server runs as Supabase Edge Function.
* [ ] Uses Streamable HTTP.
* [ ] Production endpoint uses Supabase project URL.
* [ ] No dependency on `nobadfonts.in`.
* [ ] No dependency on future frontend domain.

### Security

* [ ] MCP authentication implemented.
* [ ] Write operations authorized.
* [ ] Secrets remain server-side.
* [ ] Input validation implemented.
* [ ] Origin/security protections implemented.
* [ ] No arbitrary SQL tool exists.

### Data

* [ ] Existing font records can be read.
* [ ] Research results preserve sources.
* [ ] Official vs secondary sources are distinguished.
* [ ] Conflicts are detected.
* [ ] Taxonomy is validated.
* [ ] URLs are sanitized.
* [ ] Revisions are stored.
* [ ] Published changes are auditable.

### AI interaction

* [ ] Claude can connect.
* [ ] Claude can inspect fonts.
* [ ] Claude can research fonts.
* [ ] Claude can create proposed revisions.
* [ ] Authorized clients can publish revisions.
* [ ] ChatGPT can connect where the user's account/workspace supports custom MCP.
* [ ] Same MCP server works across clients.

---

# 52. Final Architecture

This is the architecture I would actually build:

```text
                         ┌───────────────────┐
                         │      Claude       │
                         └─────────┬─────────┘
                                   │
                                   │ Remote MCP
                                   │
                         ┌─────────▼─────────┐
                         │                   │
                         │   NoBadFonts MCP  │
                         │   Supabase Edge   │
                         │     Function      │
                         │                   │
                         │ Streamable HTTP   │
                         └─────────┬─────────┘
                                   │
                   ┌───────────────┼────────────────┐
                   │               │                │
                   ▼               ▼                ▼
             Font Tools       Research         Validation
                   │               │                │
                   └───────────────┼────────────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │     Supabase      │
                         │                   │
                         │ fonts             │
                         │ font_research     │
                         │ font_revisions    │
                         │ audit logs        │
                         └───────────────────┘
                                   ▲
                                   │
                         ┌─────────┴─────────┐
                         │                   │
                    NoBadFonts           ChatGPT
                     Website           Custom MCP
```

The crucial design decision is:

> **The website is a client of NoBadFonts' backend. The MCP server is also a client interface to the same backend. Neither should depend on the other.**

That means if `nobadfonts.in` disappears, **your MCP doesn't disappear with it**.

And if someday you change:

```text
Vercel → Cloudflare
React → Next.js
nobadfonts.in → nobadfonts.xyz
```

the MCP architecture doesn't need to change.

The Supabase project becomes the stable backend identity, while **MCP becomes a reusable AI interface on top of it**. Supabase's current documentation explicitly supports this Edge Function + remote MCP architecture and lists Claude, ChatGPT, Cursor, and VS Code as clients. ([Supabase][1])

**One final implementation note:** I would give this PRD to your AI IDE and tell it to **implement Phase 1 only first**, verify the MCP endpoint with MCP Inspector, and only then proceed to research and database-write tools. Trying to build authentication + research + source verification + revisions + publishing all at once is exactly how you'll end up debugging five systems simultaneously.

[1]: https://supabase.com/docs/guides/ai-tools/byo-mcp?utm_source=chatgpt.com "Deploy MCP servers | Supabase Docs"
[2]: https://modelcontextprotocol.io/specification/2025-11-25/basic/transports?utm_source=chatgpt.com "Transports - Model Context Protocol"
[3]: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp?utm_source=chatgpt.com "Get started with custom connectors using remote MCP | Claude Help Center"
[4]: https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt?utm_source=chatgpt.com "Developer mode and MCP apps in ChatGPT | OpenAI Help Center"
[5]: https://supabase.com/docs/guides/functions/examples/mcp-server-mcp-lite?utm_source=chatgpt.com "Building an MCP Server with mcp-lite | Supabase Docs"
