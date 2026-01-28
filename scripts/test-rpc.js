
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

function loadEnv() {
    if (!fs.existsSync(envPath)) {
        console.error('.env.local file not found!');
        process.exit(1);
    }
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
    });
    return env;
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('Testing search_fonts RPC...');
    
    // Test 1: Minimal arguments (as used in useFonts)
    // filter_category deprecated, passed as undefined (so omitted in JSON)
    // filter_tags passed as undefined (so omitted)
    console.log('Test 1: Default args (no filters)');
    const { data: d1, error: e1 } = await supabase.rpc('search_fonts', {
        sort_by: 'trending',
        filter_category: undefined
    });
    
    if (e1) {
        console.error('Test 1 Failed:', e1);
    } else {
        console.log(`Test 1 Success. Got ${d1?.length} results.`);
        if (d1?.length > 0) console.log('Sample data:', d1[0]);
    }

    // Test 2: With tags
    console.log('\nTest 2: With tags filter (sans-serif)');
    const { data: d2, error: e2 } = await supabase.rpc('search_fonts', {
        sort_by: 'trending',
        filter_tags: ['sans-serif']
    });

    if (e2) {
        console.error('Test 2 Failed:', e2);
    } else {
        console.log(`Test 2 Success. Got ${d2?.length} results.`);
    }
}

run();
