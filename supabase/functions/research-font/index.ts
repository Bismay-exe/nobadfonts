// research-font — AI Font Research Pipeline
// Supabase Edge Function (Deno)
// Researches font provenance, licensing, and generates descriptions using
// embedded OpenType metadata + Gemini with Google Search grounding

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage, x-supabase-client-platform, x-supabase-client-version',
    'Access-Control-Allow-Methods':
        'GET, POST, PUT, PATCH, DELETE, OPTIONS',
}

// ─── Types ───────────────────────────────────────────────────────────

interface FontRecord {
    id: string
    name: string
    slug: string
    designer: string
    tags: string[] | null
    category: string
    license_type: string
    font_file_hash: string | null
    woff2_url: string
    ttf_url: string | null
    otf_url: string | null
}

interface SearchResult {
    title: string
    url: string
    snippet: string
    domain: string
}

interface GeminiSource {
    url: string
    supports: string[]
    evidence: string
    confidence: 'high' | 'medium' | 'low'
    source_type: string
}

interface GeminiAnalysis {
    creator: string | null
    foundry: string | null
    official_website: string | null
    official_font_page: string | null
    purchase_url: string | null
    free_download_url: string | null
    license_type: string | null
    license_status: string | null
    commercial_use: boolean | null
    personal_use: boolean | null
    license_url: string | null
    license_evidence: string | null
    sources: GeminiSource[]
    conflicts: { field: string; values: string[]; explanation: string }[]
}

interface GeminiDescription {
    description: string
    suggested_tags: string[]
}

interface FontSourceRecord {
    id?: string
    research_id?: string
    url: string
    domain: string | null
    title: string | null
    source_type: string
    source_tier: number
    supports: string[]
    evidence: string | null
    confidence: string
    fetched_at?: string
}

// ─── Constants ───────────────────────────────────────────────────────

// const GEMINI_MODEL = 'gemini-3.6-flash'

// Domain tier classification
const TIER_1_DOMAINS = [
    'github.com', 'gitlab.com', 'bitbucket.org',
]
const TIER_2_DOMAINS = [
    'fonts.google.com', 'fonts.adobe.com', 'fontshare.com',
    'fontsource.org', 'fontspring.com', 'myfonts.com',
    'typenetwork.com', 'typewolf.com',
]
const TIER_3_DOMAINS = [
    'behance.net', 'dribbble.com', 'medium.com',
    'creativeboom.com', 'typographica.org',
]
const TIER_4_DOMAINS = [
    'dafont.com', '1001fonts.com', 'fontspace.com',
    'fontsquirrel.com', 'freefonts.io',
]

function getSourceTier(domain: string): number {
    const d = domain.toLowerCase().replace(/^www\./, '')
    if (TIER_1_DOMAINS.some(t => d.includes(t))) return 1
    if (TIER_2_DOMAINS.some(t => d.includes(t))) return 2
    if (TIER_3_DOMAINS.some(t => d.includes(t))) return 3
    if (TIER_4_DOMAINS.some(t => d.includes(t))) return 4
    return 4 // Unknown domains default to Tier 4 (unverified)
}

function classifySourceType(domain: string, url: string): string {
    const d = domain.toLowerCase().replace(/^www\./, '')
    if (d.includes('github.com') || d.includes('gitlab.com')) return 'official_repo'
    if (d.includes('fonts.google.com')) return 'google_fonts'
    if (d.includes('fonts.adobe.com') || d.includes('fontshare.com') || d.includes('myfonts.com')) return 'font_library'
    if (d.includes('behance.net') || d.includes('dribbble.com')) return 'designer_portfolio'
    if (TIER_4_DOMAINS.some(t => d.includes(t))) return 'download_site'
    return 'other'
}

function getDomain(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '')
    } catch {
        return ''
    }
}

// ─── Gemini API ──────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-3.6-flash'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/interactions'

const GEMINI_POLL_INTERVAL_MS = 3000
const GEMINI_MAX_WAIT_MS = 90000

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function getInteractionText(data: any): string {
    return (data.steps || [])
        .filter((step: any) => step.type === 'model_output')
        .flatMap((step: any) => step.content || [])
        .filter((content: any) => content.type === 'text')
        .map((content: any) => content.text || '')
        .join('')
}

function parseJsonObject(text: string): unknown {
    const cleaned = text
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')

    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')

    if (start < 0 || end < start) {
        throw new Error('Gemini did not return a JSON object')
    }

    return JSON.parse(cleaned.slice(start, end + 1))
}

async function startGeminiInteraction(
    apiKey: string,
    body: Record<string, unknown>,
    label: string
): Promise<any> {
    console.log(`[research-font] Gemini ${label}: starting`)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    let res: Response

    try {
        res = await fetch(GEMINI_API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        })
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            throw new Error(`Gemini ${label} request timed out after 30 seconds`)
        }
        throw new Error(`Gemini ${label} network error: ${error?.message || error}`)
    } finally {
        clearTimeout(timeout)
    }

    const raw = await res.text()

    console.log(`[research-font] Gemini ${label}: HTTP ${res.status}`)

    if (!res.ok) {
        throw new Error(`Gemini ${label} error ${res.status}: ${raw}`)
    }

    let data: any
    try {
        data = JSON.parse(raw)
    } catch {
        throw new Error(`Gemini ${label} returned invalid JSON`)
    }

    if (!data.id) {
        throw new Error(`Gemini ${label} response has no interaction ID`)
    }

    console.log(
        `[research-font] Gemini ${label}: interaction=${data.id}, status=${data.status}`
    )

    return data
}

async function getGeminiInteraction(
    apiKey: string,
    interactionId: string,
    label: string
): Promise<any> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    let res: Response

    try {
        res = await fetch(
            `${GEMINI_API_BASE}/${encodeURIComponent(interactionId)}`,
            {
                method: 'GET',
                headers: {
                    'x-goog-api-key': apiKey,
                },
                signal: controller.signal,
            }
        )
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            throw new Error(`Gemini ${label} status request timed out`)
        }
        throw new Error(
            `Gemini ${label} status network error: ${error?.message || error}`
        )
    } finally {
        clearTimeout(timeout)
    }

    const raw = await res.text()

    if (!res.ok) {
        throw new Error(`Gemini ${label} status error ${res.status}: ${raw}`)
    }

    try {
        return JSON.parse(raw)
    } catch {
        throw new Error(`Gemini ${label} status returned invalid JSON`)
    }
}

async function waitForGeminiInteraction(
    apiKey: string,
    initialData: any,
    label: string
): Promise<any> {
    let data = initialData

    if (data.status === 'completed' || data.status === 'incomplete') {
        console.log(
            `[research-font] Gemini ${label}: completed immediately (${data.status})`
        )
        return data
    }

    if (
        data.status === 'failed' ||
        data.status === 'cancelled' ||
        data.status === 'requires_action'
    ) {
        const message =
            data.errors?.map((e: any) => e.message).join('; ') ||
            `Interaction ended with status ${data.status}`
        throw new Error(`Gemini ${label} failed: ${message}`)
    }

    const startedAt = Date.now()

    while (Date.now() - startedAt < GEMINI_MAX_WAIT_MS) {
        await sleep(GEMINI_POLL_INTERVAL_MS)

        data = await getGeminiInteraction(apiKey, data.id, label)

        console.log(
            `[research-font] Gemini ${label}: status=${data.status}`
        )

        if (data.status === 'completed' || data.status === 'incomplete') {
            return data
        }

        if (
            data.status === 'failed' ||
            data.status === 'cancelled' ||
            data.status === 'requires_action'
        ) {
            const message =
                data.errors?.map((e: any) => e.message).join('; ') ||
                `Interaction ended with status ${data.status}`
            throw new Error(`Gemini ${label} failed: ${message}`)
        }
    }

    throw new Error(
        `Gemini ${label} did not finish within ${GEMINI_MAX_WAIT_MS / 1000} seconds`
    )
}

async function callGemini(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string
): Promise<string> {
    const interaction = await startGeminiInteraction(
        apiKey,
        {
            model: GEMINI_MODEL,
            system_instruction: systemPrompt,
            input: userPrompt,
            background: true,
            store: true,
        },
        'description'
    )

    const completed = await waitForGeminiInteraction(
        apiKey,
        interaction,
        'description'
    )

    const text = getInteractionText(completed)

    if (!text) {
        throw new Error('Gemini description returned no text')
    }

    return text
}

interface GroundedGeminiResponse {
    text: string
    citations: SearchResult[]
}

async function callGroundedGemini(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string
): Promise<GroundedGeminiResponse> {
    const interaction = await startGeminiInteraction(
        apiKey,
        {
            model: GEMINI_MODEL,
            system_instruction: systemPrompt,
            input: userPrompt,
            tools: [{ type: 'google_search' }],
            background: true,
            store: true,
        },
        'grounded research'
    )

    const completed = await waitForGeminiInteraction(
        apiKey,
        interaction,
        'grounded research'
    )

    const citations = new Map<string, SearchResult>()

    for (const step of completed.steps || []) {
        if (step.type === 'model_output') {
            for (const content of step.content || []) {
                for (const annotation of content.annotations || []) {
                    const url = annotation.url || annotation.uri

                    if (!url) continue
                    if (
                        annotation.type &&
                        annotation.type !== 'url_citation'
                    ) {
                        continue
                    }

                    citations.set(url, {
                        title: annotation.title || getDomain(url),
                        url,
                        snippet:
                            content.text?.slice(
                                annotation.start_index ??
                                    annotation.startIndex ??
                                    0,
                                annotation.end_index ??
                                    annotation.endIndex
                            ) || '',
                        domain: getDomain(url),
                    })
                }
            }
        }
    }

    const text = getInteractionText(completed)

    if (!text) {
        throw new Error(
            'Gemini grounded research completed but returned no analysis text'
        )
    }

    console.log(
        `[research-font] Gemini grounded research complete: ${citations.size} citations`
    )

    return {
        text,
        citations: [...citations.values()],
    }
}

// ─── Gemini Call #1: Evidence Analysis ───────────────────────────────

const ANALYSIS_SYSTEM_PROMPT = `You are a font research analyst for NoBadFonts. Your job is to analyze evidence about a font and extract verified facts.

CRITICAL RULES:
1. You MUST only return URLs that Gemini cited from Google Search. NEVER construct, guess, or extrapolate a URL.
2. "Free download" does NOT mean "free for commercial use." These are separate claims requiring separate evidence.
3. If you cannot find clear evidence for a claim, return null.
4. If sources conflict (e.g., Source A says "John Doe designed it" but Source B says "Jane Smith"), report BOTH in the conflicts array and set the primary value to null.
5. Rank sources by authority:
   Tier 1: Official foundry/designer site, official GitHub repo, official license file
   Tier 2: Google Fonts, Adobe Fonts, Fontshare, reputable font libraries
   Tier 3: Designer portfolio, Behance, Dribbble, articles
   Tier 4: DaFont, 1001Fonts, FontSpace, random download sites
   Tier 4 can help DISCOVER a font. It should NEVER establish ownership or licensing.
6. For license_status, use ONLY these values: "free_commercial", "free_personal_only", "open_source", "free_trial", "paid", "unknown"
7. For source_type, use ONLY: "official_foundry", "official_repo", "google_fonts", "font_library", "designer_portfolio", "download_site", "article", "other"

Return a JSON object with this exact structure:
{
  "creator": "string or null",
  "foundry": "string or null",
  "official_website": "URL string or null",
  "official_font_page": "URL string or null",
  "purchase_url": "URL string or null",
  "free_download_url": "URL string or null",
  "license_type": "string or null (e.g. 'SIL Open Font License 1.1')",
  "license_status": "one of the allowed values or null",
  "commercial_use": "boolean or null",
  "personal_use": "boolean or null",
  "license_url": "URL string or null",
  "license_evidence": "exact quote from evidence or null",
  "sources": [
    {
      "url": "string",
      "supports": ["creator", "license", etc.],
      "evidence": "exact quote",
      "confidence": "high/medium/low",
      "source_type": "one of the allowed values"
    }
  ],
  "conflicts": [
    {
      "field": "creator",
      "values": ["John Doe", "Jane Smith"],
      "explanation": "Source A says X, Source B says Y"
    }
  ]
}`

async function analyzeWithGemini(
    apiKey: string,
    font: FontRecord,
    fontMetadata: Record<string, string>
): Promise<{ analysis: GeminiAnalysis; citations: SearchResult[] }> {
    let prompt = `# Font Research Task\n\n`
    prompt += `## Font Information (from database)\n`
    prompt += `- Name: ${font.name}\n`
    prompt += `- Designer (uploader-provided): ${font.designer}\n`
    prompt += `- Category: ${font.category}\n`
    prompt += `- Tags: ${font.tags?.join(', ') || 'none'}\n`
    prompt += `- Uploader-selected license: ${font.license_type}\n\n`

    if (Object.keys(fontMetadata).length > 0) {
        prompt += `## Embedded Font Metadata (extracted from the font file)\n`
        for (const [key, value] of Object.entries(fontMetadata)) {
            if (value) prompt += `- ${key}: ${value}\n`
        }
        prompt += `\n`
    }

    prompt += `\n## Your Task\n`
    prompt += `Use Google Search to research this font. Embedded metadata and uploader fields are leads only, never proof. Prefer the creator's/foundry's own website, a verified official repository, and the actual license file. Do not rely on download aggregators to establish ownership or licensing.\n`
    prompt += `Analyze ALL the evidence above and determine:\n`
    prompt += `1. Who created this font? (designer/creator)\n`
    prompt += `2. What foundry published it?\n`
    prompt += `3. What is the official website/font page?\n`
    prompt += `4. What license does it have? Is commercial use allowed?\n`
    prompt += `5. Where can it be legitimately downloaded for free (if applicable)?\n`
    prompt += `6. Are there any purchase links?\n`
    prompt += `7. Do any sources conflict with each other?\n`
    prompt += `\nReturn your analysis as the specified JSON structure.`

    const grounded = await callGroundedGemini(apiKey, ANALYSIS_SYSTEM_PROMPT, prompt)

    try {
        return { analysis: parseJsonObject(grounded.text) as GeminiAnalysis, citations: grounded.citations }
    } catch (e) {
        console.error('Failed to parse Gemini analysis:', grounded.text)
        throw new Error('Failed to parse Gemini analysis response')
    }
}

// ─── Gemini Call #2: Description Generation ──────────────────────────

const DESCRIPTION_SYSTEM_PROMPT = `You are a typography copywriter for NoBadFonts, a curated font library. Write a concise, factual, professional description for a font based on verified information.

Rules:
1. Write 2-3 sentences max. Be concise and informative.
2. Only state facts that are provided — never invent history or claims.
3. Mention the designer/foundry if known.
4. Mention the license type naturally if relevant (e.g., "available under the SIL Open Font License").
5. Describe the font's visual character and recommended use cases based on its category and tags.
6. Do NOT use marketing superlatives or vague praise.
7. Also suggest up to 5 relevant tags for this font.

Return JSON: { "description": "...", "suggested_tags": ["tag1", "tag2"] }`

async function generateDescriptionWithGemini(
    apiKey: string,
    font: FontRecord,
    analysis: GeminiAnalysis
): Promise<GeminiDescription> {
    const prompt = `Generate a description for this font:

Font: ${font.name}
Designer: ${analysis.creator || font.designer || 'Unknown'}
Foundry: ${analysis.foundry || 'Unknown'}
Category: ${font.category}
Tags: ${font.tags?.join(', ') || 'none'}
License: ${analysis.license_type || font.license_type}
License Status: ${analysis.license_status || 'unknown'}
Commercial Use: ${analysis.commercial_use === true ? 'Yes' : analysis.commercial_use === false ? 'No' : 'Unknown'}`

    const raw = await callGemini(apiKey, DESCRIPTION_SYSTEM_PROMPT, prompt)

    try {
        return parseJsonObject(raw) as GeminiDescription
    } catch {
        return { description: '', suggested_tags: [] }
    }
}

// ─── Backend Validation ──────────────────────────────────────────────

function validateAndScore(
    analysis: GeminiAnalysis,
    collectedUrls: Set<string>,
    googleFontsMatch: boolean
): {
    validatedAnalysis: GeminiAnalysis
    ownershipScore: number
    licenseScore: number
    hasConflicts: boolean
    conflictDetails: string | null
    confidence: 'high' | 'medium' | 'low'
    researchStatus: string
} {
    // 1. Validate all URLs — strip any URL not returned as a Gemini citation.
    const urlFields: (keyof GeminiAnalysis)[] = [
        'official_website', 'official_font_page', 'purchase_url',
        'free_download_url', 'license_url'
    ]

    for (const field of urlFields) {
        const value = analysis[field] as string | null
        if (value && !collectedUrls.has(value)) {
            console.warn(`Rejecting uncited URL for ${field}: ${value}`)
                ; (analysis as any)[field] = null
        }
    }

    // Validate source URLs too; a matching domain is not enough evidence.
    analysis.sources = (analysis.sources || []).filter(s => {
        if (!collectedUrls.has(s.url)) {
            console.warn(`Rejecting uncited source URL: ${s.url}`)
            return false
        }
        return true
    })

    // 2. Calculate ownership score
    let ownershipScore = 0
    const creatorSources = analysis.sources.filter(s => s.supports.includes('creator'))
    if (creatorSources.length >= 2) ownershipScore += 40  // Multiple sources agree
    else if (creatorSources.length === 1) ownershipScore += 25
    if (analysis.creator) ownershipScore += 10
    if (analysis.foundry) ownershipScore += 10
    if (analysis.official_website) ownershipScore += 20
    if (googleFontsMatch) ownershipScore += 20
    // High-tier sources boost
    const highTierCreator = creatorSources.some(s => {
        const tier = getSourceTier(getDomain(s.url))
        return tier <= 2
    })
    if (highTierCreator) ownershipScore += 10
    ownershipScore = Math.min(100, ownershipScore)

    // 3. Calculate license score
    let licenseScore = 0
    const licenseSources = analysis.sources.filter(s =>
        s.supports.includes('license') || s.supports.includes('commercial_use')
    )
    if (licenseSources.length >= 2) licenseScore += 30
    else if (licenseSources.length === 1) licenseScore += 20
    if (analysis.license_type) licenseScore += 15
    if (analysis.license_evidence) licenseScore += 20
    if (analysis.license_url) licenseScore += 15
    if (googleFontsMatch) licenseScore += 20  // Google Fonts = OFL almost always
    // High-tier license source
    const highTierLicense = licenseSources.some(s => {
        const tier = getSourceTier(getDomain(s.url))
        return tier <= 2
    })
    if (highTierLicense) licenseScore += 10
    licenseScore = Math.min(100, licenseScore)

    // 4. Check for conflicts
    const hasConflicts = (analysis.conflicts || []).length > 0
    const conflictDetails = hasConflicts
        ? analysis.conflicts.map(c => `${c.field}: ${c.explanation}`).join('; ')
        : null

    // 5. Determine confidence and status
    const avgScore = (ownershipScore + licenseScore) / 2
    let confidence: 'high' | 'medium' | 'low' = 'low'
    if (avgScore >= 90) confidence = 'high'
    else if (avgScore >= 70) confidence = 'medium'

    // Determine research_status with strict conditions
    let researchStatus = 'needs_review'
    if (
        ownershipScore >= 80 &&
        licenseScore >= 80 &&
        !hasConflicts &&
        (analysis.creator || googleFontsMatch)
    ) {
        researchStatus = 'verified'
    }

    return {
        validatedAnalysis: analysis,
        ownershipScore,
        licenseScore,
        hasConflicts,
        conflictDetails,
        confidence,
        researchStatus,
    }
}

// ─── Main Pipeline ───────────────────────────────────────────────────

async function researchFont(fontId: string, jobId: string) {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''

    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')

    // ── Step 1: Update job status ──
    const { data: currentJob } = await supabase
        .from('research_jobs')
        .select('attempts, max_attempts')
        .eq('id', jobId)
        .single()

    const currentAttempts = currentJob?.attempts || 0

    await supabase.from('research_jobs').update({
        status: 'processing',
        started_at: new Date().toISOString(),
        error: null,
        next_retry_at: null,
        attempts: Math.max(1, currentAttempts),
    }).eq('id', jobId)

    await supabase.from('fonts').update({
        research_status: 'researching',
    }).eq('id', fontId)

    // ── Step 2: Fetch font record ──
    const { data: font, error: fontError } = await supabase
        .from('fonts')
        .select('*')
        .eq('id', fontId)
        .single()

    if (fontError || !font) throw new Error(`Font not found: ${fontId}`)

    console.log(`[research-font] Starting research for "${font.name}" (${fontId})`)

    // ── Step 3: Deduplication check ──
    // Check if another font with the same name already has research
    const { data: existingResearch } = await supabase
        .from('font_research')
        .select('*, fonts!inner(name)')
        .neq('font_id', fontId)
        .in('research_status', ['verified', 'needs_review'])

    const familyMatch = existingResearch?.find((r: any) =>
        r.fonts?.name?.toLowerCase() === font.name.toLowerCase()
    )

    if (familyMatch) {
        console.log(`[research-font] Found existing research for family "${font.name}", cloning...`)
        // Clone the research data
        const { id: _id, font_id: _fid, created_at: _ca, updated_at: _ua, ...cloneData } = familyMatch
        await supabase.from('font_research').upsert({
            ...cloneData,
            font_id: fontId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, { onConflict: 'font_id' })

        // Clone sources
        const { data: existingSources } = await supabase
            .from('font_sources')
            .select('*')
            .eq('research_id', familyMatch.id)

        if (existingSources && existingSources.length > 0) {
            const { data: newResearch } = await supabase
                .from('font_research')
                .select('id')
                .eq('font_id', fontId)
                .single()

            if (newResearch) {
                const clonedSources = existingSources.map((s: FontSourceRecord) => ({
                    research_id: newResearch.id,
                    url: s.url,
                    domain: s.domain,
                    title: s.title,
                    source_type: s.source_type,
                    source_tier: s.source_tier,
                    supports: s.supports,
                    evidence: s.evidence,
                    confidence: s.confidence,
                }))
                await supabase.from('font_sources').insert(clonedSources)
            }
        }

        await supabase.from('fonts').update({
            research_status: cloneData.research_status,
        }).eq('id', fontId)

        await supabase.from('research_jobs').update({
            status: 'completed',
            completed_at: new Date().toISOString(),
        }).eq('id', jobId)

        return { status: 'cloned', source: familyMatch.font_id }
    }

    // ── Step 4: Extract font metadata ──
    // We use what's already in the DB (designer, tags, category)
    // OpenType metadata extraction happens at upload time on the client
    const fontMetadata: Record<string, string> = {}
    if (font.designer && font.designer !== 'Unknown') fontMetadata['designer'] = font.designer
    // If metadata was extracted at upload and stored, use it
    const { data: existingFR } = await supabase
        .from('font_research')
        .select('font_metadata_extracted')
        .eq('font_id', fontId)
        .maybeSingle()

    if (existingFR?.font_metadata_extracted) {
        const meta = existingFR.font_metadata_extracted as Record<string, string>
        Object.assign(fontMetadata, meta)
    }

    // ── Step 5: Gemini grounded research ──
    const groundedResearch = await analyzeWithGemini(GEMINI_API_KEY, font as FontRecord, fontMetadata)
    const analysis = groundedResearch.analysis
    const allSearchResults = groundedResearch.citations
    const collectedUrls = new Set(allSearchResults.map(result => result.url))
    const googleFontsMatch = allSearchResults.some(result => result.domain === 'fonts.google.com')

    console.log(`[research-font] Gemini analysis complete. Creator: ${analysis.creator}, License: ${analysis.license_status}`)

    // ── Step 10: Backend Validation ──
    const validation = validateAndScore(analysis, collectedUrls, googleFontsMatch)
    console.log(`[research-font] Scores — Ownership: ${validation.ownershipScore}, License: ${validation.licenseScore}, Status: ${validation.researchStatus}`)

    // ── Step 11: Gemini Call #2 — Description ──
    const descResult = await generateDescriptionWithGemini(GEMINI_API_KEY, font as FontRecord, analysis)

    // ── Step 12: Save Results ──
    // Upsert font_research
    const { data: researchRecord, error: researchError } = await supabase
        .from('font_research')
        .upsert({
            font_id: fontId,
            foundry: analysis.foundry,
            designer_verified: analysis.creator,
            official_website: analysis.official_website,
            official_font_page: analysis.official_font_page,
            purchase_url: analysis.purchase_url,
            free_download_url: analysis.free_download_url,
            license_type_verified: analysis.license_type,
            license_status: analysis.license_status || 'unknown',
            commercial_use_verified: analysis.commercial_use,
            personal_use_verified: analysis.personal_use,
            license_url: analysis.license_url,
            license_evidence: analysis.license_evidence,
            ai_description: descResult.description || null,
            ai_tags: descResult.suggested_tags?.length > 0 ? descResult.suggested_tags : null,
            confidence: validation.confidence,
            ownership_score: validation.ownershipScore,
            license_score: validation.licenseScore,
            research_status: validation.researchStatus,
            has_conflicts: validation.hasConflicts,
            conflict_details: validation.conflictDetails,
            google_fonts_match: googleFontsMatch,
            font_metadata_extracted: fontMetadata,
            researched_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, { onConflict: 'font_id' })
        .select('id')
        .single()

    if (researchError) {
        console.error('Failed to save research:', researchError)
        throw researchError
    }

    // Save font_sources
    if (researchRecord && allSearchResults.length > 0) {
        // Delete old sources first (in case of re-research)
        await supabase.from('font_sources').delete().eq('research_id', researchRecord.id)

        const sourcesToInsert = allSearchResults.map(result => {
            const analysisSource = analysis.sources?.find(source => source.url === result.url)
            return {
                research_id: researchRecord.id,
                url: result.url,
                domain: result.domain,
                title: result.title || null,
                source_type: analysisSource?.source_type || classifySourceType(result.domain, result.url),
                source_tier: getSourceTier(result.domain),
                supports: analysisSource?.supports || [],
                evidence: analysisSource?.evidence || result.snippet || null,
                confidence: analysisSource?.confidence || 'medium',
            }
        })

        await supabase.from('font_sources').insert(sourcesToInsert)
    }

    // Update fonts.research_status
    await supabase.from('fonts').update({
        research_status: validation.researchStatus,
    }).eq('id', fontId)

    // Update job status
    await supabase.from('research_jobs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
    }).eq('id', jobId)

    console.log(`[research-font] ✓ Research complete for "${font.name}" — Status: ${validation.researchStatus}`)

    return {
        status: validation.researchStatus,
        confidence: validation.confidence,
        ownershipScore: validation.ownershipScore,
        licenseScore: validation.licenseScore,
    }
}

// ─── HTTP Handler ────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()

        // Support both direct call { font_id, job_id } and DB webhook payload
        let fontId: string
        let jobId: string

        if (body.font_id && body.job_id) {
            // Direct invocation (from admin UI)
            fontId = body.font_id
            jobId = body.job_id
        } else if (body.record && body.table === 'research_jobs') {
            // Supabase Database Webhook trigger
            fontId = body.record.font_id
            jobId = body.record.id
            // Only process queued jobs
            if (body.record.status !== 'queued') {
                return new Response(JSON.stringify({ status: 'skipped', reason: 'not queued' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
        } else {
            return new Response(JSON.stringify({ error: 'Missing font_id and job_id' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const result = await researchFont(fontId, jobId)

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error('[research-font] Pipeline error:', error)

        // Try to mark the job as failed
        try {
            const body = await req.clone().json().catch(() => null)
            const jobId = body?.job_id || body?.record?.id
            const fontId = body?.font_id || body?.record?.font_id

            if (jobId) {
                const supabase = createClient(
                    Deno.env.get('SUPABASE_URL') ?? '',
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                )

                // Check attempts
                const { data: job } = await supabase
                    .from('research_jobs')
                    .select('attempts, max_attempts')
                    .eq('id', jobId)
                    .single()

                const attempts = (job?.attempts || 0) + 1
                const maxAttempts = job?.max_attempts || 3

                await supabase.from('research_jobs').update({
                    status: 'failed',
                    error: error.message,
                    attempts,
                    completed_at: new Date().toISOString(),
                }).eq('id', jobId)

                if (fontId) {
                    await supabase.from('fonts').update({
                        research_status: 'failed',
                    }).eq('id', fontId)
                }
            }
        } catch (e) {
            console.error('[research-font] Failed to update job status:', e)
        }

        return new Response(JSON.stringify({
            error: error.message || 'Research pipeline failed',
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
