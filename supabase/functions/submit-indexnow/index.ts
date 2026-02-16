
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const INDEXNOW_KEY = Deno.env.get('INDEXNOW_KEY')
const HOST = 'nobadfonts.in'
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`

console.log(`Function "submit-indexnow" up and running!`)

serve(async (req: Request) => {
    try {
        const payload = await req.json()
        const { record, type, table, schema } = payload

        // Check if it's an insert or update on the fonts table
        if (table !== 'fonts' || schema !== 'public') {
            return new Response("Ignored: Not fonts table", { status: 200 })
        }

        // Only process if published
        if (!record || !record.is_published) {
            return new Response("Skipped: Not published", { status: 200 })
        }

        // If update, check if slug or is_published changed? 
        // For simplicity, just submit on any change to published font.

        const url = `https://${HOST}/fonts/${record.slug || record.id}`

        if (!INDEXNOW_KEY) {
            console.error("INDEXNOW_KEY not set")
            return new Response("Error: INDEXNOW_KEY not set", { status: 500 })
        }

        console.log(`[${type}] Submitting ${url} to IndexNow...`)

        const response = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                host: HOST,
                key: INDEXNOW_KEY,
                keyLocation: KEY_LOCATION,
                urlList: [url]
            })
        })

        if (response.ok) {
            console.log(`Success: Submitted ${url}`)
            return new Response(`Submitted ${url}`, { status: 200 })
        } else {
            const text = await response.text()
            console.error(`IndexNow Error: ${text}`)
            return new Response(`IndexNow Error: ${text}`, { status: response.status })
        }

    } catch (error: any) {
        console.error(error)
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(message, { status: 500 })
    }
})
