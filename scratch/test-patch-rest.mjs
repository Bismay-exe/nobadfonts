import fs from 'fs';

let env = {};
if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).forEach(l => {
    const idx = l.indexOf('=');
    if (idx > -1) {
      const k = l.slice(0, idx).trim();
      const v = l.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (k) env[k] = v;
    }
  });
}

const url = env.VITE_SUPABASE_URL || 'https://wcegdxhvgwbeskaidlxr.supabase.co';
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || env.VITE_SUPABASE_ANON_KEY;

console.log('Testing PATCH fonts with key prefix:', key.slice(0, 10));

const res = await fetch(`${url}/rest/v1/fonts?slug=eq.nobulina`, {
  method: 'PATCH',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  },
  body: JSON.stringify({
    description: 'Test description update'
  })
});

console.log('Status:', res.status);
const text = await res.text();
console.log('Body:', text);
