import { buildCanonicalTaxonomy } from '../scripts/mcp-server.js';
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

// Fetch nobulina
const res = await fetch(`${url}/rest/v1/fonts?slug=eq.nobulina&select=*,font_variants(*),font_research(*)`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` }
});
const fonts = await res.json();
const nobulina = fonts[0];

const canonical = buildCanonicalTaxonomy(nobulina, null);

console.log('--- TEST CANONICAL TAXONOMY FOR NOBULINA ---');
console.log('release_year:', canonical.identity.release_year);
console.log('glyph_count:', canonical.technical.glyph_count);
console.log('version:', canonical.identity.version);
console.log('formats:', canonical.technical.formats);
console.log('weights:', canonical.technical.weights);
console.log('styles:', canonical.technical.styles);
console.log('languages:', canonical.technical.languages);
console.log('recommended_uses:', canonical.classification.recommended_uses);
console.log('license_type:', canonical.license.license_type);

if (canonical.identity.release_year === null && canonical.technical.glyph_count === null) {
  console.log('\nSUCCESS: release_year and glyph_count are null! No fallbacks/hallucinations.');
} else {
  console.error('\nFAILURE: Fallback detected!');
}
