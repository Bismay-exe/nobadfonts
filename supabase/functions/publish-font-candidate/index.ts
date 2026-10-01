/**
 * publish-font-candidate
 * ======================
 * Supabase Edge Function — Phase 5: Admin Font Publishing
 *
 * Called by the Admin UI when an admin approves a font_candidate.
 *
 * Request:
 *   POST /functions/v1/publish-font-candidate
 *   Authorization: Bearer <admin-jwt>
 *   Body: { candidate_id: uuid, review_notes?: string }
 *
 * Responsibilities:
 *   1. Verify caller is an admin
 *   2. Load the font_candidate record
 *   3. Validate it is in 'needs_review' status
 *   4. Call publish_font_candidate_tx() — the atomic DB transaction that:
 *      - Creates the font record
 *      - Creates font_variants for each file in the manifest
 *      - Marks candidate as approved
 *      - Writes an audit log entry
 *   5. Optionally copy font files to Supabase Storage
 *   6. Return the new font ID
 *
 * Environment variables:
 *   SUPABASE_URL         — project URL
 *   SUPABASE_SERVICE_KEY — service-role key
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PublishRequest {
    candidate_id: string;
    review_notes?: string;
}

interface FontCandidate {
    id: string;
    repository_id: string;
    family_name: string;
    slug_candidate: string | null;
    description_extracted: string | null;
    designer_name: string | null;
    foundry_name: string | null;
    official_url: string | null;
    font_metadata: Record<string, unknown> | null;
    font_file_manifest: Array<Record<string, unknown>>;
    license_name: string | null;
    license_identifier: string | null;
    license_category: string | null;
    license_text_url: string | null;
    license_evidence: string | null;
    license_status: string;
    validation_status: string;
    duplicate_of_font_id: string | null;
    status: string;
    github_font_repositories?: {
        html_url: string;
        full_name: string;
        owner: string;
        default_branch: string;
    };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (req.method !== 'POST') {
        return json({ error: 'Method not allowed' }, 405);
    }

    // ---------------------------------------------------------------------------
    // Auth — admin only
    // ---------------------------------------------------------------------------

    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
        return json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_KEY')!,
    );

    const token = authHeader.slice(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return json({ error: 'Forbidden: admin role required' }, 403);
    }

    // ---------------------------------------------------------------------------
    // Parse request body
    // ---------------------------------------------------------------------------

    let body: PublishRequest;
    try {
        body = await req.json() as PublishRequest;
    } catch {
        return json({ error: 'Invalid JSON body' }, 400);
    }

    const { candidate_id, review_notes } = body;
    if (!candidate_id) {
        return json({ error: 'candidate_id is required' }, 400);
    }

    // ---------------------------------------------------------------------------
    // Load candidate
    // ---------------------------------------------------------------------------

    const { data: candidate, error: candidateErr } = await supabase
        .from('font_candidates')
        .select(`
            *,
            github_font_repositories (
                html_url, full_name, owner, default_branch
            )
        `)
        .eq('id', candidate_id)
        .single();

    if (candidateErr || !candidate) {
        return json({ error: 'Candidate not found' }, 404);
    }

    const c = candidate as FontCandidate;

    if (c.status !== 'needs_review') {
        return json({
            error: `Cannot publish candidate with status '${c.status}'. Only 'needs_review' candidates can be published.`,
        }, 422);
    }

    if (c.duplicate_of_font_id) {
        return json({
            error: 'Candidate is marked as a duplicate. Review and clear the duplicate flag before publishing.',
        }, 422);
    }

    // ---------------------------------------------------------------------------
    // Prepare font data for the atomic transaction
    // ---------------------------------------------------------------------------

    const manifest = c.font_file_manifest ?? [];
    const metadata = (c.font_metadata ?? {}) as Record<string, unknown>;

    // Build font variants from manifest
    // Phase 5: Link source URLs from GitHub (not yet copied to Storage)
    const variants = manifest
        .filter((f) => f.commit_pinned_url || f.raw_url)
        .map((f) => {
            const format  = (f.format as string ?? '').toLowerCase();
            const srcUrl  = (f.commit_pinned_url ?? f.raw_url) as string;
            return {
                format,
                source_url:   srcUrl,
                weight:       _weightFromMetadata(metadata, format, f),
                style:        _styleFromMetadata(metadata, f),
                file_size:    f.size_bytes as number | null ?? null,
                file_hash:    f.file_hash as string | null ?? null,
            };
        });

    // Build slug — prefer the candidate's slug_candidate, fall back to generating one
    const slug = c.slug_candidate
        ?? c.family_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Build source URL from GitHub repository
    const sourceUrl = c.github_font_repositories?.html_url ?? null;

    // ---------------------------------------------------------------------------
    // Call the atomic DB transaction
    // ---------------------------------------------------------------------------

    const { data: txResult, error: txErr } = await supabase.rpc(
        'publish_font_candidate_tx',
        {
            p_candidate_id:   candidate_id,
            p_family_name:    c.family_name,
            p_slug:           slug,
            p_description:    c.description_extracted ?? null,
            p_designer:       c.designer_name ?? null,
            p_foundry:        c.foundry_name ?? null,
            p_license_name:   c.license_name ?? null,
            p_license_spdx:   c.license_identifier ?? null,
            p_source_url:     sourceUrl,
            p_variants:       JSON.stringify(variants),
            p_admin_id:       user.id,
            p_review_notes:   review_notes ?? null,
        }
    );

    if (txErr || !txResult) {
        console.error('publish_font_candidate_tx error:', txErr);

        // Handle unique slug conflict gracefully
        if (txErr?.message?.includes('font_slug_key') || txErr?.message?.includes('unique')) {
            return json({
                error: `A font with slug '${slug}' already exists. Edit the family name or slug before publishing.`,
            }, 409);
        }

        return json({ error: `Publish transaction failed: ${txErr?.message ?? 'Unknown error'}` }, 500);
    }

    const fontId = typeof txResult === 'string' ? txResult : (txResult as { font_id?: string })?.font_id;

    console.log(`Font candidate ${candidate_id} published as font ${fontId} by admin ${user.id}`);

    return json({
        success: true,
        font_id:       fontId,
        family_name:   c.family_name,
        slug,
        variants_count: variants.length,
        message: `Font '${c.family_name}' published successfully.`,
    }, 200);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _weightFromMetadata(
    metadata: Record<string, unknown>,
    format: string,
    fileEntry: Record<string, unknown>,
): number {
    // Use OS/2 usWeightClass if available
    const wc = metadata.weight_class;
    if (typeof wc === 'number' && wc >= 100 && wc <= 900) return wc;

    // Infer from filename
    const path = String(fileEntry.path ?? '').toLowerCase();
    if (path.includes('thin'))        return 100;
    if (path.includes('extralight') || path.includes('ultralight')) return 200;
    if (path.includes('light'))       return 300;
    if (path.includes('medium'))      return 500;
    if (path.includes('semibold') || path.includes('demibold')) return 600;
    if (path.includes('extrabold') || path.includes('ultrabold')) return 800;
    if (path.includes('black') || path.includes('heavy')) return 900;
    if (path.includes('bold'))        return 700;

    return 400; // Regular fallback
}

function _styleFromMetadata(
    metadata: Record<string, unknown>,
    fileEntry: Record<string, unknown>,
): 'normal' | 'italic' | 'oblique' {
    if (metadata.is_italic === true) return 'italic';

    const path = String(fileEntry.path ?? '').toLowerCase();
    if (path.includes('italic')) return 'italic';
    if (path.includes('oblique')) return 'oblique';

    return 'normal';
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
