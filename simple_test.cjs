
const url = "https://wcegdxhvgwbeskaidlxr.supabase.co/functions/v1/import-font";
const body = JSON.stringify({ url: "https://www.1001fonts.com/dotmatrix-font.html" });

console.log("Fetching:", url);

async function run() {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}` // Need key? Actually function handles CORS but usually needs key for invocation if not public. 
                // Wait, I disabled Verify JWT for the function deployment (`--no-verify-jwt`), so it shouldn't need a key for auth, but the function logic might.
                // The function code creates a Supabase client but doesn't check req auth.
                // The browser sends the anon key. I should send it too to be like the browser.
            },
            body: body
        });

        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Raw Response Body:\n", text);
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

// Load env vars roughly (or just hardcode for this simple test if needed, but I'll try to use the one from .env.local via regex since I don't want to install dotenv again if I can avoid it, or just assume the user environment has it? Test_func used dotenv. I'll just require it.)
require('dotenv').config({ path: '.env.local' });
run();
