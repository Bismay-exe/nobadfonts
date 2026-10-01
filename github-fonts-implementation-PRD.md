# PRD: Automated GitHub Font Discovery for NoBadFonts

**Status:** Proposed\
**Product:** NoBadFonts\
**Feature:** Automated GitHub Font Discovery and Admin Review\
**Version:** 1.0\
**Last updated:** 2026-10-01

------------------------------------------------------------------------

## 1. Overview

Build an automated pipeline that continuously discovers font-family
repositories on GitHub, scans them, extracts technical and descriptive
metadata, checks licensing evidence, detects duplicates, and adds
eligible results to a review queue in the NoBadFonts admin dashboard.

The system must run without manual repository submissions. The admin's
recurring responsibility is limited to reviewing candidates and
approving, editing, rejecting, or marking duplicates. Approved
candidates are published into the existing NoBadFonts catalog.

The system should discover as many relevant GitHub font projects as
practical. It must not promise that it can find literally every font on
GitHub: GitHub search has limits, repositories may be poorly tagged, and
some fonts are bundled inside unrelated projects.

## 2. Problem Statement

NoBadFonts needs a sustainable way to grow its catalog from GitHub
without manually finding repositories and importing fonts one by one. A
naive crawler would produce noisy results, duplicate existing families,
misread licenses, and potentially exceed serverless execution limits.

The feature must automate discovery and processing while preserving
human approval before publication.

## 3. Goals

-   Automatically discover new GitHub repositories that contain
    standalone font families.
-   Continue discovering repositories over time, rather than performing
    a one-time import.
-   Scan repositories in bounded, resumable batches.
-   Extract font metadata using deterministic parsing wherever possible.
-   Record license evidence and clearly flag uncertainty.
-   Detect duplicate repositories and font families before they reach
    the admin queue.
-   Show candidates and validation warnings in the existing admin
    dashboard.
-   Require explicit admin approval before publishing a candidate.
-   Retry transient failures and resume interrupted work.
-   Keep the existing public font catalog stable and avoid breaking
    existing features.

## 4. Non-Goals

-   Guaranteeing discovery of every font file or font repository on
    GitHub.
-   Automatically publishing discovered fonts without admin approval.
-   Treating every GitHub-hosted font as open-source or free to
    redistribute.
-   Using AI as the authority for license decisions.
-   Replacing the existing font catalog, font detail pages, CLI, OG
    generator, or other NoBadFonts features.
-   Automatically copying all font binaries into Supabase Storage before
    approval.
-   Crawling arbitrary websites beyond the sources and URLs required for
    repository research.
-   Building a complex distributed queue before volume requires it.

## 5. Users and Roles

### Admin

-   Views discovered candidates and scan status.
-   Inspects source repository, font preview, metadata, license
    evidence, and warnings.
-   Edits metadata and approves candidates.
-   Rejects unsuitable candidates or marks duplicates.
-   Retries failed scans when appropriate.
-   Views discovery-run health and errors.

### Automated system

-   Discovers repositories on a schedule.
-   Enqueues repository scans.
-   Extracts and validates metadata.
-   Detects duplicates and records candidates.
-   Retries transient errors and records terminal failures.
-   Never approves or publishes a candidate by itself.

## 6. Product Principles

1.  **Automation first:** no manual repository URL submission is
    required for normal discovery.
2.  **Human approval before publication:** the candidate queue is the
    boundary between discovery and the public catalog.
3.  **Evidence over assumptions:** store source URLs and license
    evidence, not just inferred labels.
4.  **Idempotency:** rerunning discovery or scanning must not create
    duplicate candidates.
5.  **Incremental processing:** each run continues from saved state and
    uses bounded batches.
6.  **Deterministic extraction first:** use parsers and repository
    metadata before optional AI.
7.  **Keep existing data safe:** inspect and reuse the current schema
    wherever possible.
8.  **Observable operation:** admins can see what ran, what was found,
    what failed, and why.

## 7. End-to-End Workflow

1.  Supabase Cron triggers the discovery Edge Function on a configurable
    schedule.
2.  The discovery function runs several GitHub repository searches using
    relevant terms and topics.
3.  It paginates through available results within a per-run budget and
    saves repository identifiers, URLs, default branches, and discovery
    metadata.
4.  It filters known repositories, forks where appropriate, archived
    repositories, and previously processed repositories that have not
    changed.
5.  New or changed repositories are placed in a scan queue.
6.  A worker claims queued repositories in bounded batches.
7.  The worker reads the repository tree and locates likely font files,
    README files, metadata files, and license files.
8.  A font parser extracts technical metadata from supported font
    binaries.
9.  The pipeline validates the repository and files, records license
    evidence, and compares the result with existing candidates and
    published fonts.
10. Each result becomes a candidate with a processing/review status and
    warnings.
11. The admin dashboard shows candidates awaiting review.
12. The admin reviews the source, metadata, license, preview, and
    warnings, then approves, edits and approves, rejects, or marks the
    candidate as a duplicate.
13. The publish function validates the admin action and writes the
    approved record to the existing catalog using an idempotent
    operation.
14. Future discovery runs continue from saved cursors/state and find
    newly created or changed repositories.
15. Failed jobs are retried within configured limits; persistent
    failures are visible to the admin.

## 8. Discovery Strategy

### 8.1 GitHub sources

Use the GitHub REST API as the primary discovery source. Search multiple
query families, for example: - Repository topics related to fonts and
typefaces. - Repository names and descriptions containing font/typeface
terms. - Known open-font ecosystems and organizations. - Curated search
terms for variable fonts, type design, and font families.

The query list must be configurable in code or database settings. Avoid
depending on one query such as `topic:fonts`.

### 8.2 Search limitations

GitHub search is not a complete index of all font files. Search results
are capped and rate-limited, and many results are unrelated. The product
should describe this as continuous best-effort discovery, not exhaustive
discovery.

### 8.3 Candidate repository filters

Configurable filters should include: - Exclude forks by default, unless
a fork contains meaningful independent changes or is explicitly
allowlisted. - Exclude archived repositories by default, but allow an
admin to include them if desired. - Ignore repositories already scanned
at the same commit SHA. - Ignore repositories with no likely font files
after tree inspection. - Avoid repositories that only bundle fonts
incidentally, where that can be determined reliably. - Retain
repositories with uncertain signals as low-confidence candidates rather
than silently discarding all of them.

### 8.4 Pagination and state

Persist per-query progress where supported and store: - Query
identifier. - Page/cursor or last processed result marker. - Last
successful run. - Last error. - Number of results seen and queued.

Because search results can shift between runs, do not rely on a single
page number as a permanent cursor. Periodically re-run
earlier/high-value queries and deduplicate by stable repository ID.

### 8.5 Repository identity

Use GitHub's stable numeric repository ID as the primary repository
identity. Store `owner/repo` and URLs as display/source data. Repository
renames should update the current name/URL without creating a new
logical repository candidate.

## 9. Architecture

### 9.1 Supabase Edge Functions

Use small Edge Functions for orchestration and privileged application
actions.

#### `discover-github-fonts`

-   Invoked by Supabase Cron and optionally by an admin-only "Run
    discovery" action.
-   Searches GitHub using configured queries.
-   Applies lightweight repository filters.
-   Upserts repository records and scan jobs.
-   Enforces a per-run request/job budget.
-   Records run summary, API usage, and errors.
-   Does not download and parse large batches of font binaries in one
    invocation.

#### `process-font-candidate` (optional thin coordinator)

-   Claims or schedules a bounded scan job, depending on the chosen
    worker architecture.
-   Coordinates status transitions and prevents duplicate concurrent
    processing.
-   Should not be responsible for CPU-heavy font parsing if it risks
    Edge Function limits.

#### `publish-font-candidate`

-   Admin-only operation.
-   Revalidates candidate status and required fields.
-   Verifies that the caller is authorized as an admin.
-   Publishes or updates the corresponding catalog record in a
    transaction or safe idempotent sequence.
-   Records reviewer, timestamp, and source candidate ID.
-   Does not trust client-supplied role claims from user-editable
    metadata.

### 9.2 Font scanning worker

Detailed binary parsing should run outside the Edge Function if it
requires Python FontTools or other native/binary-processing
dependencies.

Preferred approach: - A Python worker using FontTools runs on a hosted
runner such as GitHub Actions. - The worker claims queued jobs or is
triggered by a batch-dispatch mechanism. - It scans a bounded number of
repositories per run. - It writes results through a narrowly scoped,
authenticated ingestion endpoint or a server-side credential stored only
in the worker's secret store. - It reports completion and errors to
Supabase.

The exact worker trigger should be selected during implementation.
Options include: 1. Supabase discovery enqueues jobs and triggers a
GitHub Actions workflow for a batch. 2. A scheduled GitHub Actions
worker periodically claims queued jobs from Supabase. 3. For a very
small initial implementation, a local Python worker can validate the
parser, but it is not the production automation solution.

Do not expose a Supabase service-role key in the browser or in public
repository files. If a service-role key is used by a private CI worker,
store it as a protected secret and limit its use. Prefer a restricted
ingestion Edge Function with its own secret if feasible.

### 9.3 Why not do all parsing in Edge Functions?

Edge Functions are suitable for API orchestration and short operations.
Downloading many binaries and parsing them can exceed runtime, memory,
or execution limits. Keep the Edge Function bounded and move detailed
parsing to a worker.

### 9.4 Optional AI

AI is optional and should run only after deterministic extraction.
Potential uses: - Suggest a concise description. - Suggest
categories/tags. - Help identify designer/foundry from repository
documentation. - Summarize README information. - Identify metadata
inconsistencies for human review.

AI must: - Return structured output validated against a schema. - Store
suggestions separately from extracted/verified values. - Include
evidence URLs or quoted short evidence snippets where possible. - Never
make final license determinations. - Never publish or approve
candidates. - Be optional so pipeline operation does not depend on model
availability.

## 10. Data Model

Before adding tables, inspect the current Supabase schema, migrations,
RLS policies, and application types. Reuse existing columns and tables
where they serve the same purpose. The following is a logical model, not
an instruction to duplicate existing schema.

### 10.1 `github_font_repositories`

One record per GitHub repository.

Suggested fields: - `id` --- internal UUID. - `github_repo_id` ---
unique GitHub numeric repository ID. - `owner` - `repo_name` -
`full_name` - `html_url` - `default_branch` - `is_fork` -
`is_archived` - `stars_count` --- optional discovery metadata, not a
quality score. - `last_commit_sha` - `last_scanned_commit_sha` -
`last_scanned_at` - `discovery_query` - `first_discovered_at` -
`last_seen_at` - `scan_status` - `last_error` - `created_at` -
`updated_at`

Constraints: - Unique index on `github_repo_id`. - Index on
`scan_status`. - Index on `last_seen_at` if used for cleanup or
prioritization.

### 10.2 `font_candidates`

One record per candidate font family or importable family from a
repository. A repository can contain multiple families.

Suggested fields: - `id` - `repository_id` --- foreign key to
`github_font_repositories`. - `family_name` - `slug_candidate` -
`description_extracted` - `designer_name` - `foundry_name` -
`official_url` - `repository_path` - `font_metadata` --- JSONB for
extracted technical metadata. - `font_file_manifest` --- JSONB or
related file rows. - `license_name` - `license_identifier` -
`license_category` - `license_text_url` - `license_evidence` -
`license_status` --- `verified`, `uncertain`, `missing`, `conflicting`,
or `not_checked`. - `validation_status` - `validation_warnings` -
`duplicate_of_font_id` --- nullable reference to existing catalog
record. - `duplicate_of_candidate_id` --- nullable reference to another
candidate. - `status` - `reviewed_by` - `reviewed_at` - `review_notes` -
`rejection_reason` - `published_font_id` - `created_at` - `updated_at`

Suggested candidate status lifecycle:
`queued → scanning → needs_review → approved/rejected/duplicate`

Use a separate error status or error fields for failed scans. Retryable
scan failures should not be confused with admin rejection.

### 10.3 `font_discovery_runs`

One record per discovery run.

Suggested fields: - `id` - `trigger_type` --- `cron` or `admin`. -
`started_at` - `finished_at` - `status` - `queries_executed` -
`repositories_seen` - `repositories_added` - `repositories_queued` -
`repositories_skipped` - `candidates_created` - `errors_count` -
`summary` - `error_details`

### 10.4 `font_scan_jobs` (only if needed)

Add a durable job table if repository scanning is decoupled from
discovery and needs claim/retry semantics.

Suggested fields: - `id` - `repository_id` - `status` -
`attempt_count` - `max_attempts` - `available_at` - `claimed_at` -
`claimed_by` - `last_error` - `created_at` - `updated_at`

Avoid creating both a job table and redundant queue-like status systems
unless there is a clear need. The implementation should choose one
canonical source of job state.

### 10.5 Existing catalog integration

Use the existing `fonts` table and related source/file tables. Do not
create a second public font catalog. Link the published record to its
source/candidate so future imports remain traceable.

## 11. Metadata Extraction

### 11.1 Repository-level extraction

-   Repository owner/name and URLs.
-   README and documentation links.
-   Default branch and commit SHA.
-   License file paths and content.
-   Font-file paths.
-   Metadata files such as `METADATA.pb`, `package.json`, `fonts.json`,
    or project-specific manifests where present.

### 11.2 Font-file extraction

Use FontTools or a suitable equivalent to extract, when available: -
Family and typographic family names. - Subfamily/style names. - Full
name and PostScript name. - Version string. -
Designer/manufacturer/vendor fields. - Weight and width classes. -
Variable axes, such as `wght`, `wdth`, `slnt`, and `opsz`. - Glyph count
and Unicode coverage. - Supported file formats and file sizes.

Not every font contains complete or accurate metadata. Preserve raw
extracted values and flag missing/conflicting fields instead of
inventing values.

### 11.3 Metadata precedence

Use this order as a default: 1. Font binary metadata. 2. Official
project metadata files. 3. Repository README and official project
documentation. 4. Verified official designer/foundry website. 5.
Optional AI suggestion, clearly marked as unverified.

If sources conflict, preserve evidence and flag the field for review
rather than silently choosing a value.

## 12. License Handling

License handling is a high-risk part of the pipeline.

-   Inspect the actual license file and its location in the repository.
-   Record the license text URL and the path to the license file.
-   Do not rely solely on GitHub's repository-level license detection.
-   Determine whether the license applies to the specific font
    files/family, especially in monorepositories.
-   Flag repositories with no license, conflicting license files,
    unclear scope, or custom terms.
-   Do not label an unknown license as open-source or free.
-   Do not assume that "free download" means permission for commercial
    use or redistribution.
-   Preserve license-specific requirements, such as attribution or
    Reserved Font Name provisions, where applicable.
-   Any allowlist should be a triage aid, not an automatic legal
    approval system.
-   The admin must see the evidence and make the publication decision.

Suggested statuses: - `verified` --- evidence was found and scope
appears clear. - `uncertain` --- a license exists but its scope or
meaning is unclear. - `missing` --- no applicable license was found. -
`conflicting` --- multiple sources disagree. - `not_checked` ---
processing has not completed.

A candidate with uncertain, missing, or conflicting license evidence
must display a prominent warning. NoBadFonts should define its own
publication policy for these candidates before launch.

## 13. Duplicate Detection

Run duplicate checks before creating a new review item.

Use multiple signals: 1. Stable GitHub repository ID. 2. Repository URL
after canonicalization. 3. Family name normalized for case, whitespace,
and common punctuation. 4. Existing official source URLs and
distribution identifiers. 5. Font binary hashes when binaries are safely
available. 6. PostScript names and font version metadata as supporting
signals.

Duplicate outcomes: - Exact repository already known: update last-seen
data and skip redundant work unless the commit changed. - Same family
already published: attach the new source to the existing font where
appropriate, or flag for admin review. - Same family appears in multiple
repositories: group or flag candidates rather than automatically
treating all as identical. - Hash matches: treat as strong evidence of
identical files, but not necessarily identical licensing or source
provenance.

Do not automatically merge records solely because family names match.

## 14. Candidate Review Dashboard

### 14.1 Queue view

Show: - Font family name. - Preview/specimen when available. -
Repository owner/name and link. - Discovery date. - License status and
license name. - Validation status. - Duplicate warning. - Missing
metadata indicators. - Candidate status.

Provide filters for: - Status. - License status. - Source/repository. -
Discovery date. - Validation warnings. - Duplicate candidates.

Provide sorting by newest discovery, oldest pending, and scan status.
Repository stars may be displayed as context but must not be treated as
proof of quality or licensing.

### 14.2 Candidate detail view

Show: - Font preview using a safe preview strategy. - Extracted metadata
and editable fields. - Repository README/source link. - Detected font
file paths and formats. - License name, license file, source URL, and
relevant evidence. - Validation results and errors. - Duplicate matches
with links to existing records. - AI suggestions, if enabled, separated
from verified data. - Commit SHA used for the scan. - Scan history and
last scan time.

### 14.3 Admin actions

-   **Approve & Publish:** approve a candidate whose required checks are
    satisfied and publish it.
-   **Edit & Approve:** edit metadata, then publish.
-   **Reject:** mark as rejected with an optional reason.
-   **Mark Duplicate:** associate with an existing font/candidate.
-   **Retry Scan:** enqueue a retry for a failed or stale scan.
-   **Review Later:** leave the candidate pending.
-   **Rescan Repository:** request a scan at the latest commit.

All actions must provide clear success/failure feedback. Publishing must
be idempotent.

### 14.4 Batch review

Allow selecting multiple candidates for review actions only where safe.
Bulk rejection or duplicate marking can be supported. Bulk publishing
should be optional and must not bypass required license/validation
warnings; it is not required for the initial release.

## 15. Font Preview and File Hosting

The first version should avoid automatically copying every discovered
font binary into Supabase Storage.

Preview options: - Use a source URL pinned to a specific commit where
practical. - Prefer a trusted, stable source URL and validate that the
file is actually a font. - Treat third-party CDN availability as
best-effort; files can disappear. - Do not proxy arbitrary URLs without
SSRF protections. - Do not load arbitrary remote CSS/HTML from
repositories into the admin page.

Before hosting or redistributing files, verify that the applicable
license permits it and determine any obligations. A public GitHub URL or
CDN URL is not, by itself, permission to redistribute.

The final product decision---link to source versus mirror files into
Supabase Storage---should be configurable and documented. Do not block
discovery on this decision; candidates can be reviewed with repository
links and metadata first.

## 16. Security Requirements

-   Keep GitHub tokens in Supabase Secrets or protected CI secrets,
    never in frontend code.
-   Use a fine-grained GitHub token with the minimum required read
    permissions. Public repository search may work without a token but
    authenticated access helps with rate limits.
-   Never expose Supabase service-role credentials to the browser.
-   Protect admin-only Edge Functions with server-verified
    authorization.
-   Do not use user-editable profile metadata as the authority for admin
    authorization.
-   Enable RLS on exposed tables and write policies for the actual
    access model.
-   Restrict candidate mutation and publishing to admins or trusted
    server-side workers.
-   Validate all inputs and cap repository count, response sizes, and
    file sizes.
-   Protect against SSRF, path traversal, decompression bombs, malformed
    fonts, and oversized archives/files.
-   Treat README content, repository names, metadata, and AI output as
    untrusted input.
-   Render repository text safely; never execute repository scripts.
-   Do not run build scripts from discovered repositories.
-   Log operational identifiers and error summaries, but never log
    secrets or tokens.
-   Verify worker-to-Supabase requests and prevent arbitrary public
    candidate injection.

## 17. Reliability and Rate Limits

-   Set explicit per-run limits for queries, repositories, files,
    download bytes, and processing time.
-   Respect GitHub rate-limit headers and `Retry-After`.
-   Use exponential backoff with jitter for transient errors.
-   Do not retry permanent errors indefinitely.
-   Use a maximum attempt count and a delayed retry schedule.
-   Persist job state before processing so a crash does not lose the
    work.
-   Use leases or atomic claims to prevent two workers from processing
    the same job concurrently.
-   Mark stale `scanning` jobs as recoverable after their lease expires.
-   Make every stage safe to run more than once.
-   Keep discovery and scan batches small enough for the selected
    runtime.
-   If the backlog grows, reduce discovery intake or increase worker
    capacity without dropping jobs.

## 18. Scheduling and Operations

### Initial schedule

-   Run discovery daily by default, configurable after observing API
    usage and queue volume.
-   Process queued scan jobs in bounded batches.
-   Retry transient failures on a delayed schedule.
-   Periodically re-run high-value searches because GitHub search
    results shift.
-   Rescan repositories when their default-branch commit changes, not on
    every run.

The exact schedule and batch size must be configurable. Start
conservatively and tune using actual runtime, API limits, and queue
growth.

### Admin operations panel

Display: - Last successful discovery run. - Current run status. -
Repositories discovered and queued. - Candidates created. - Jobs
waiting, scanning, failed, or needing review. - Recent errors and retry
counts. - GitHub API rate-limit state when available. - Oldest pending
candidate age.

Provide a manual "Run discovery now" action for admins. This
supplements, but does not replace, automatic scheduling.

## 19. Observability

Every run should produce a summary containing: - Run ID and trigger. -
Start/end time and duration. - Queries executed. - API requests and
rate-limit information. - Repositories found, new, skipped, or queued. -
Candidates created or updated. - Jobs failed and retry decisions. -
Error categories.

Use structured logs and avoid logging complete font binaries or secrets.
Admins should be able to diagnose failures without reading raw server
logs for every run.

## 20. Functional Requirements

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-01                   Automatically run       Must
                          GitHub discovery on a   
                          schedule                

  FR-02                   Search multiple         Must
                          configurable repository 
                          queries/topics          

  FR-03                   Persist repository      Must
                          identity and discovery  
                          state                   

  FR-04                   Queue new and changed   Must
                          repositories for        
                          scanning                

  FR-05                   Scan repositories in    Must
                          bounded, resumable      
                          batches                 

  FR-06                   Detect supported font   Must
                          files and metadata      
                          files                   

  FR-07                   Extract font metadata   Must
                          using a deterministic   
                          parser                  

  FR-08                   Store license evidence  Must
                          and uncertainty status  

  FR-09                   Detect duplicates       Must
                          against candidates and  
                          published fonts         

  FR-10                   Create review           Must
                          candidates without      
                          publishing them         

  FR-11                   Show candidate details  Must
                          and warnings in the     
                          admin dashboard         

  FR-12                   Support approve,        Must
                          edit-and-approve,       
                          reject, duplicate, and  
                          retry actions           

  FR-13                   Publish approved        Must
                          candidates idempotently 

  FR-14                   Enforce admin           Must
                          authorization and       
                          database access         
                          policies                

  FR-15                   Retry transient         Must
                          failures and record     
                          terminal errors         

  FR-16                   Display discovery and   Should
                          processing health       

  FR-17                   Add optional AI         Could
                          metadata suggestions    

  FR-18                   Support configurable    Could
                          source/file mirroring   
                          after license review    

  FR-19                   Support safe bulk       Could
                          review actions          

  FR-20                   Add more discovery      Later
                          sources beyond GitHub   
  -----------------------------------------------------------------------

## 21. Non-Functional Requirements

-   **Reliability:** interrupted jobs can resume without losing
    candidates.
-   **Security:** no privileged keys in client code; strict admin
    authorization and RLS.
-   **Performance:** each Edge Function invocation remains within
    current platform limits.
-   **Scalability:** discovery intake and scan processing can be tuned
    independently.
-   **Auditability:** every candidate retains source repository, commit,
    evidence, and review history.
-   **Maintainability:** query lists, schedules, batch sizes, and retry
    limits are configurable.
-   **Data integrity:** publishing is idempotent and does not create
    duplicate catalog records.
-   **Transparency:** unknown or conflicting metadata is shown as
    unknown/conflicting, not invented.

## 22. Acceptance Criteria

The feature is ready for an initial production release when:

1.  A scheduled run starts without manual intervention.
2.  Multiple GitHub search queries are executed and paginated within
    configured limits.
3.  New repositories are stored once using stable GitHub repository IDs.
4.  A changed repository can be queued for a new scan.
5.  The worker detects supported font files in a test set of
    repositories.
6.  The parser extracts available metadata and records missing fields
    without crashing.
7.  Missing or conflicting license evidence is visibly flagged.
8.  Duplicate repositories are not repeatedly added to the candidate
    queue.
9.  Candidate records are created without altering the public catalog.
10. An unauthorized user cannot approve or publish a candidate.
11. An admin can inspect evidence and approve, edit, reject, or mark
    duplicates.
12. Publishing the same candidate twice does not create duplicate font
    records.
13. A transient GitHub or worker failure is retried and does not lose
    job state.
14. A permanently failing job becomes visible with an error summary.
15. The admin can see the last run and basic discovery/processing
    counts.
16. No GitHub token or Supabase service-role key is exposed to the
    browser or public logs.

## 23. Testing Plan

### Unit tests

-   Repository query parsing and result normalization.
-   Font metadata extraction from known sample files.
-   License status classification.
-   Duplicate matching and normalization.
-   Candidate state transitions.
-   Idempotent publish logic.
-   Input and file-size validation.

### Integration tests

-   GitHub API pagination and rate-limit handling.
-   Repository tree scanning.
-   Worker-to-Supabase ingestion.
-   RLS and admin authorization.
-   Candidate creation and review.
-   Publish transaction and duplicate prevention.
-   Retry behavior after transient failures.

### End-to-end test

Use 5--10 known repositories covering: - A single-family font
repository. - A repository containing multiple families. - A variable
font. - A repository with an explicit open license. - A repository with
a missing or ambiguous license. - A fork or mirror. - A repository with
no font files. - A repository with malformed or unsupported font
files. - A repository already represented in the NoBadFonts catalog.

Verify the full path from automatic discovery through admin review to
publication.

## 24. Implementation Phases

### Phase 0 --- Inspect existing project

-   Inspect Supabase tables, migrations, RLS policies, Edge Functions,
    admin authorization, and existing font publishing flow.
-   Map the current schema to this PRD.
-   Identify reusable tables and code.
-   Do not create duplicate tables or rename existing columns without a
    migration plan.

### Phase 1 --- Database and discovery foundation

-   Add only the missing repository, candidate, run, and job
    fields/tables.
-   Add uniqueness constraints and indexes.
-   Configure secrets and access policies.
-   Implement discovery runs and repository upserts.

### Phase 2 --- Automated scanning worker

-   Implement the Python FontTools scanner.
-   Add bounded batch processing, leases/claims, retries, and result
    ingestion.
-   Test against the initial repository set.
-   Confirm the worker can run without the developer's laptop.

### Phase 3 --- Candidate validation

-   Add license evidence collection.
-   Add duplicate detection and validation warnings.
-   Add candidate state transitions and structured logs.

### Phase 4 --- Admin review

-   Add the candidate queue and candidate detail view.
-   Implement preview, evidence display, editing, approval, rejection,
    duplicate marking, and retry.
-   Use existing NoBadFonts UI conventions.

### Phase 5 --- Publishing

-   Implement the admin-only publish function.
-   Map candidate metadata to the existing catalog schema.
-   Ensure publishing is transactional or otherwise safely idempotent.
-   Test that existing frontend, CLI, OG generator, and related features
    continue to work.

### Phase 6 --- Automation and rollout

-   Enable the scheduled discovery run at a conservative frequency.
-   Monitor API usage, processing time, queue volume, and error rate.
-   Tune batch sizes and retry policies.
-   Add optional AI enrichment only after deterministic extraction is
    reliable.
-   Expand query coverage gradually.

## 25. Risks and Mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Search misses repositories          Use multiple queries, repeat
                                      high-value searches, and state that
                                      discovery is best-effort

  Too many irrelevant repositories    Apply lightweight filters and
                                      refine queries using observed
                                      results

  GitHub rate limits                  Authenticate, respect headers, use
                                      bounded batches, and back off

  Edge Function timeouts              Keep functions thin and move binary
                                      parsing to a worker

  Incorrect license assumptions       Store evidence, flag uncertainty,
                                      and require admin review

  Duplicate families across sources   Combine repository IDs, URLs,
                                      names, metadata, and file hashes

  Malformed or malicious files        Enforce size limits, validate
                                      formats, isolate parsing, and never
                                      execute repository code

  Worker interruption                 Persist job state, use leases, and
                                      retry safely

  Catalog regressions                 Reuse existing schema and test all
                                      downstream consumers

  CDN or source URLs disappear        Preserve source provenance and
                                      optionally mirror files only when
                                      permitted

  AI hallucinations                   Keep AI optional, store suggestions
                                      separately, and require
                                      evidence/review
  -----------------------------------------------------------------------

## 26. Open Decisions

Resolve these during implementation planning: 1. Which existing tables
and columns can be reused? 2. Should the Python worker be triggered by a
Supabase Edge Function or poll queued jobs on a schedule? 3. What
initial discovery schedule and per-run repository limit fit current
API/runtime budgets? 4. Should candidates with missing licenses be
reviewable, hidden, or automatically rejected? 5. Should published fonts
link to the source or be copied to Supabase Storage when permitted? 6.
What exact metadata fields are required before a candidate can be
approved? 7. Should repositories that contain multiple font families
create one candidate per family? 8. Which admin authorization mechanism
is already used by NoBadFonts?

## 27. Final Product Definition

NoBadFonts continuously discovers GitHub font repositories, processes
them automatically, and accumulates review-ready candidates in Supabase.
The admin does not need to find or submit repositories manually. The
admin only reviews the queue from time to time and decides which
candidates become part of the public catalog.

The system is automated for discovery and preparation, but
human-controlled for publication.
