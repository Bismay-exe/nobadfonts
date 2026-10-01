/**
 * discover-github-fonts
 * =====================
 * Supabase Edge Function — Phase 2: GitHub Font Discovery
 *
 * Triggered by:
 *   - Supabase Cron (daily at 02:00 UTC)
 *   - Admin "Run Now" action (POST with Authorization header)
 *
 * Responsibilities:
 *   1. Recover stale scan jobs from previous runs
 *   2. Create a font_discovery_runs record
 *   3. Search GitHub using configured query families
 *   4. Upsert github_font_repositories by stable github_repo_id
 *   5. Queue font_scan_jobs for new/changed repositories
 *   6. Finalize the discovery run record with summary stats
 *
 * Environment variables required (set in Supabase Secrets):
 *   SUPABASE_URL          — project URL
 *   SUPABASE_SERVICE_KEY  — service-role key (server-side only, never in browser)
 *   GITHUB_TOKEN          — fine-grained PAT with public repo read access
 *   CRON_SECRET           — shared secret for cron caller verification
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Maximum GitHub repositories to process per discovery run */
const MAX_REPOS_PER_RUN = 200;

/** Maximum GitHub API search results pages per query */
const MAX_PAGES_PER_QUERY = 5;

/** Results per page (GitHub max is 100) */
const RESULTS_PER_PAGE = 100;

/** Worker lease duration in minutes */
const LEASE_MINUTES = 30;

/**
 * Search query families.
 * Each entry produces one or more GitHub REST search calls.
 * Keep this list configurable — add/remove queries here.
 */
const SEARCH_QUERIES: Array<{ q: string; label: string }> = [
  { q: 'topic:font',                    label: 'topic:font' },
  { q: 'topic:fonts',                   label: 'topic:fonts' },
  { q: 'topic:typeface',                label: 'topic:typeface' },
  { q: 'topic:typography',              label: 'topic:typography' },
  { q: 'topic:open-font-license',       label: 'topic:open-font-license' },
  { q: 'topic:variable-font',           label: 'topic:variable-font' },
  { q: '"font family" in:name',         label: 'name:font-family' },
  { q: '"typeface" in:name',            label: 'name:typeface' },
  { q: '"variable font" in:description', label: 'desc:variable-font' },
  { q: '"OFL" "font" in:description',   label: 'desc:OFL-font' },
  { q: 'METADATA.pb in:path',           label: 'path:METADATA.pb' },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  html_url: string;
  default_branch: string;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
}

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

interface RunStats {
  queriesExecuted: number;
  repositoriesSeen: number;
  repositoriesAdded: number;
  repositoriesQueued: number;
  repositoriesSkipped: number;
  errorsCount: number;
  apiCalls: number;
  rateLimitRemaining: number | null;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // Allow OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // ---------------------------------------------------------------------------
  // Auth: Accept cron secret OR valid admin JWT
  // ---------------------------------------------------------------------------
  const triggerType = await resolveTriggerType(req);
  if (!triggerType) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_KEY')!,
  );

  const githubToken = Deno.env.get('GITHUB_TOKEN') ?? '';
  const startedAt  = new Date();

  // ---------------------------------------------------------------------------
  // Step 0: Recover stale scan jobs from crashed workers
  // ---------------------------------------------------------------------------
  try {
    await supabase.rpc('recover_stale_scan_jobs');
  } catch (_e) {
    // Non-fatal — log and continue
    console.warn('recover_stale_scan_jobs failed:', _e);
  }

  // ---------------------------------------------------------------------------
  // Step 1: Create discovery run record
  // ---------------------------------------------------------------------------
  const { data: runRow, error: runErr } = await supabase
    .from('font_discovery_runs')
    .insert({ trigger_type: triggerType, status: 'running', started_at: startedAt.toISOString() })
    .select('id')
    .single();

  if (runErr || !runRow) {
    console.error('Failed to create discovery run:', runErr);
    return json({ error: 'Failed to create discovery run' }, 500);
  }

  const runId = runRow.id as string;

  const stats: RunStats = {
    queriesExecuted:      0,
    repositoriesSeen:     0,
    repositoriesAdded:    0,
    repositoriesQueued:   0,
    repositoriesSkipped:  0,
    errorsCount:          0,
    apiCalls:             0,
    rateLimitRemaining:   null,
  };

  const errorDetails: Record<string, string> = {};

  // ---------------------------------------------------------------------------
  // Step 2: Fetch already-known github_repo_ids to skip duplicates quickly
  // ---------------------------------------------------------------------------
  const { data: knownRows } = await supabase
    .from('github_font_repositories')
    .select('github_repo_id, last_commit_sha, last_scanned_commit_sha, scan_status');

  const knownRepos = new Map<number, {
    last_commit_sha: string | null;
    last_scanned_commit_sha: string | null;
    scan_status: string;
  }>(
    (knownRows ?? []).map((r: {
      github_repo_id: number;
      last_commit_sha: string | null;
      last_scanned_commit_sha: string | null;
      scan_status: string;
    }) => [r.github_repo_id, r])
  );

  // ---------------------------------------------------------------------------
  // Step 3: Search GitHub and process results
  // ---------------------------------------------------------------------------

  let totalReposProcessed = 0;

  for (const query of SEARCH_QUERIES) {
    if (totalReposProcessed >= MAX_REPOS_PER_RUN) break;

    for (let page = 1; page <= MAX_PAGES_PER_QUERY; page++) {
      if (totalReposProcessed >= MAX_REPOS_PER_RUN) break;

      let searchData: GitHubSearchResponse;
      let rateLimitRemaining: number | null = null;

      try {
        const url = new URL('https://api.github.com/search/repositories');
        url.searchParams.set('q', `${query.q} NOT mirror NOT fork`);
        url.searchParams.set('per_page', String(RESULTS_PER_PAGE));
        url.searchParams.set('page', String(page));
        url.searchParams.set('sort', 'updated');
        url.searchParams.set('order', 'desc');

        const headers: Record<string, string> = {
          'Accept':     'application/vnd.github+json',
          'User-Agent': 'NoBadFonts-Discovery/1.0',
          'X-GitHub-Api-Version': '2022-11-28',
        };
        if (githubToken) headers['Authorization'] = `Bearer ${githubToken}`;

        const resp = await fetchWithRetry(url.toString(), { headers });
        stats.apiCalls++;

        rateLimitRemaining = Number(resp.headers.get('X-RateLimit-Remaining') ?? null) || null;
        if (rateLimitRemaining !== null) stats.rateLimitRemaining = rateLimitRemaining;

        if (!resp.ok) {
          console.warn(`GitHub search failed: ${resp.status} for query "${query.label}" page ${page}`);
          stats.errorsCount++;
          errorDetails[`${query.label}_p${page}`] = `HTTP ${resp.status}`;
          break;
        }

        searchData = await resp.json() as GitHubSearchResponse;
      } catch (err) {
        console.error(`GitHub search error: ${query.label}`, err);
        stats.errorsCount++;
        errorDetails[`${query.label}_p${page}`] = String(err);
        break;
      }

      stats.queriesExecuted++;

      const items = searchData.items ?? [];
      if (items.length === 0) break; // No more results for this query

      for (const repo of items) {
        if (totalReposProcessed >= MAX_REPOS_PER_RUN) break;
        stats.repositoriesSeen++;

        // Filter: skip forks and archived repos
        if (repo.fork || repo.archived) {
          stats.repositoriesSkipped++;
          continue;
        }

        const known = knownRepos.get(repo.id);
        const alreadyScanned =
          known &&
          known.last_scanned_commit_sha &&
          known.last_scanned_commit_sha === known.last_commit_sha &&
          known.scan_status === 'scanned';

        if (alreadyScanned) {
          // Update last_seen_at but don't re-queue
          await supabase
            .from('github_font_repositories')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('github_repo_id', repo.id);
          stats.repositoriesSkipped++;
          continue;
        }

        // Upsert the repository record
        const { data: repoRow, error: upsertErr } = await supabase
          .from('github_font_repositories')
          .upsert(
            {
              github_repo_id:  repo.id,
              owner:           repo.owner.login,
              repo_name:       repo.name,
              full_name:       repo.full_name,
              html_url:        repo.html_url,
              default_branch:  repo.default_branch,
              is_fork:         repo.fork,
              is_archived:     repo.archived,
              stars_count:     repo.stargazers_count,
              last_seen_at:    new Date().toISOString(),
              discovery_query: query.label,
              scan_status:     known ? known.scan_status : 'queued',
              updated_at:      new Date().toISOString(),
            },
            { onConflict: 'github_repo_id', ignoreDuplicates: false }
          )
          .select('id, scan_status')
          .single();

        if (upsertErr || !repoRow) {
          console.error('Upsert error for repo:', repo.full_name, upsertErr);
          stats.errorsCount++;
          continue;
        }

        const isNew = !known;
        if (isNew) stats.repositoriesAdded++;

        // Queue a scan job if this repo is new or commit has changed
        const shouldQueue =
          isNew ||
          (known && known.last_commit_sha !== known.last_scanned_commit_sha);

        if (shouldQueue) {
          // Idempotent insert — skip if already queued/claimed for this repo
          const { error: jobErr } = await supabase
            .from('font_scan_jobs')
            .upsert(
              {
                repository_id: repoRow.id,
                status:        'queued',
                attempt_count: 0,
                available_at:  new Date().toISOString(),
              },
              {
                onConflict:      'repository_id',
                ignoreDuplicates: true,   // don't overwrite claimed/in-progress jobs
              }
            );

          if (!jobErr) {
            stats.repositoriesQueued++;
            // Also update repo scan_status to 'queued'
            await supabase
              .from('github_font_repositories')
              .update({ scan_status: 'queued', updated_at: new Date().toISOString() })
              .eq('id', repoRow.id);
          }
        }

        knownRepos.set(repo.id, {
          last_commit_sha:         known?.last_commit_sha ?? null,
          last_scanned_commit_sha: known?.last_scanned_commit_sha ?? null,
          scan_status:             repoRow.scan_status,
        });

        totalReposProcessed++;
      }

      // Stop paginating if we got fewer results than a full page
      if (items.length < RESULTS_PER_PAGE) break;

      // Respect rate limits: pause briefly between pages
      await sleep(500);
    }

    // Brief pause between query families
    await sleep(300);
  }

  // ---------------------------------------------------------------------------
  // Step 4: Finalize discovery run
  // ---------------------------------------------------------------------------
  const finishedAt  = new Date();
  const duration    = (finishedAt.getTime() - startedAt.getTime()) / 1000;
  const runStatus   = stats.errorsCount > 0 && stats.repositoriesQueued === 0
    ? 'failed' : stats.errorsCount > 0 ? 'partial' : 'completed';

  await supabase
    .from('font_discovery_runs')
    .update({
      finished_at:           finishedAt.toISOString(),
      status:                runStatus,
      queries_executed:      stats.queriesExecuted,
      repositories_seen:     stats.repositoriesSeen,
      repositories_added:    stats.repositoriesAdded,
      repositories_queued:   stats.repositoriesQueued,
      repositories_skipped:  stats.repositoriesSkipped,
      errors_count:          stats.errorsCount,
      github_api_calls:      stats.apiCalls,
      rate_limit_remaining:  stats.rateLimitRemaining,
      summary:               `Completed in ${duration.toFixed(1)}s. Seen: ${stats.repositoriesSeen}, Added: ${stats.repositoriesAdded}, Queued: ${stats.repositoriesQueued}.`,
      error_details:         errorDetails,
    })
    .eq('id', runId);

  const result = {
    run_id:               runId,
    status:               runStatus,
    duration_seconds:     duration,
    queries_executed:     stats.queriesExecuted,
    repositories_seen:    stats.repositoriesSeen,
    repositories_added:   stats.repositoriesAdded,
    repositories_queued:  stats.repositoriesQueued,
    repositories_skipped: stats.repositoriesSkipped,
    errors_count:         stats.errorsCount,
  };

  console.log('Discovery run complete:', result);
  return json(result, 200);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function resolveTriggerType(
  req: Request
): Promise<'cron' | 'admin' | null> {
  const cronSecret  = Deno.env.get('CRON_SECRET') ?? '';
  const authHeader  = req.headers.get('Authorization') ?? '';

  // Cron secret check
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return 'cron';
  }

  // Admin JWT check — verify via Supabase anon client
  if (authHeader.startsWith('Bearer ')) {
    const token    = authHeader.slice(7);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_KEY')!,
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile?.role === 'admin') return 'admin';
    }
  }

  return null;
}

/**
 * Fetch with exponential backoff and jitter on 429/5xx.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const resp = await fetch(url, options);

    if (resp.status === 429 || resp.status >= 500) {
      const retryAfter = Number(resp.headers.get('Retry-After') ?? 0);
      const backoff    = retryAfter > 0
        ? retryAfter * 1000
        : Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 30_000);

      if (attempt < maxRetries) {
        console.warn(`Rate-limited or server error (${resp.status}), retrying in ${backoff}ms`);
        await sleep(backoff);
        continue;
      }
    }

    return resp;
  }
  throw new Error(`fetchWithRetry: exhausted retries for ${url}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
