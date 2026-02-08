import fetch from 'node-fetch';

const SUPABASE_URL = 'https://wcegdxhvgwbeskaidlxr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZWdkeGh2Z3diZXNrYWlkbHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MjI3OTQsImV4cCI6MjA4NTA5ODc5NH0.P_JY0RF6wVdPCDfWLlcor5l1CP3g4bLE5y4JWmZVOig';

async function debugFont() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/fonts?limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(error);
    }
}

debugFont();
