
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

// Manual env parsing to avoid dotenv dependency
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
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY; // Ideally use SERVICE_ROLE_KEY for deletion if RLS blocks anon, but try anon first or ask user. 
// Note: Deleting usually requires higher privilege or specific RLS. 
// If anon key fails, we might need to ask user for service role key or use SQL.
// For now, let's try with what we have. If it fails, we output the IDs.

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUrl(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        return response.ok;
    } catch (e) {
        return false;
    }
}

async function run() {
    const deleteMode = process.argv.includes('--delete');
    
    console.log('Fetching fonts from database...');
    const { data: fonts, error } = await supabase.from('fonts').select('*');
    
    if (error) {
        console.error('Error fetching fonts:', error.message);
        process.exit(1);
    }

    if (fonts.length > 0) {
        console.log('Sample font keys:', Object.keys(fonts[0]));
        console.log('Sample font data:', fonts[0]);
    }

    console.log(`Found ${fonts.length} fonts. Checking availability...`);
    
    const brokenFonts = [];

    for (const font of fonts) {
        if (!font.file_url) {
            console.log(`[Broken] ${font.name} (ID: ${font.id}) - No URL`);
            brokenFonts.push(font);
            continue;
        }

        const isAvailable = await checkUrl(font.file_url);
        if (!isAvailable) {
            console.log(`[Broken] ${font.name} (ID: ${font.id}) - URL unreachable: ${font.file_url}`);
            brokenFonts.push(font);
        } else {
            // process.stdout.write('.');
        }
    }
    
    console.log('\n');

    if (brokenFonts.length === 0) {
        console.log('No broken fonts found.');
        return;
    }

    console.log(`Found ${brokenFonts.length} broken fonts.`);

    if (deleteMode) {
        console.log('Deleting broken fonts...');
        for (const font of brokenFonts) {
            const { data, error: delError } = await supabase.from('fonts').delete().eq('id', font.id).select();
            if (delError) {
                console.error(`Failed to delete ${font.name}: ${delError.message}`);
            } else if (data && data.length > 0) {
                console.log(`Deleted ${font.name}`);
            } else {
                console.log(`Failed to delete ${font.name} (RLS likely prevented deletion).`);
            }
        }
    } else {
        console.log('Run with --delete to remove them.');
        // Also output SQL for manual execution as backup
        console.log('\n--- SQL to delete manually ---');
        const ids = brokenFonts.map(f => `'${f.id}'`).join(', ');
        console.log(`DELETE FROM fonts WHERE id IN (${ids});`);
    }
}

run();
