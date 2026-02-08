
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    console.log('Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/clear-supabase.js');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearStorage(bucketName) {
    console.log(`\n🗑️  Clearing storage bucket: ${bucketName}...`);

    let { data: files, error } = await supabase.storage.from(bucketName).list('', { limit: 100, offset: 0 });

    if (error) {
        console.error(`Error listing files in ${bucketName}:`, error.message);
        return;
    }

    if (!files || files.length === 0) {
        console.log(`Bucket ${bucketName} is already empty.`);
        return;
    }

    // Recursive deletion for folders is tricky with list(), but we can try to delete paths found.
    // Actually, list('') only lists top level. We might need a recursive listing or just delete known folders.
    // For 'fonts', structure is usually 'userId/slug/...'.
    // Let's list recursively or just delete top level items if they are files. 
    // For folders, we need to iterate.

    // Better approach: list everything and delete.
    // Since list() is not recursive by default without options? standard supabase-js list is flat if it's a folder? 
    // No, list accepts a path.

    // Let's implement a simple recursive delete.
    async function deleteAll(path) {
        const { data, error } = await supabase.storage.from(bucketName).list(path);
        if (error) throw error;

        if (!data || data.length === 0) return;

        const filesToDelete = data.filter(item => item.id !== null).map(x => `${path ? path + '/' : ''}${x.name}`);
        const folders = data.filter(item => item.id === null); // Folders have no ID in some implementations, or we check metadata

        if (filesToDelete.length > 0) {
            const { error: delError } = await supabase.storage.from(bucketName).remove(filesToDelete);
            if (delError) console.error('Error deleting files:', delError);
            else console.log(`Deleted ${filesToDelete.length} files from ${path || 'root'}`);
        }

        for (const folder of folders) {
            await deleteAll(`${path ? path + '/' : ''}${folder.name}`);
        }
    }

    // Actually, the Supabase storage API `remove` behaves differently depending on backend.
    // But a simpler way for many files? 
    // If we just want to wipe the bucket and we have service role, maybe `emptyBucket` exists?
    // No, `emptyBucket` is a dashboard feature.

    // Let's try to just list root and assume standard structure involved.
    // Actually, `list` returns folders too.

    try {
        // A slightly more robust recursive delete
        const deleteRecursive = async (path = '') => {
            const { data, error } = await supabase.storage.from(bucketName).list(path);
            if (error) {
                console.warn(`Could not list ${path}: ${error.message}`);
                return;
            }

            const files = [];
            for (const item of data) {
                const fullPath = path ? `${path}/${item.name}` : item.name;
                if (item.id) {
                    // It's a file
                    files.push(fullPath);
                } else {
                    // It's a folder, recurse
                    await deleteRecursive(fullPath);
                }
            }

            if (files.length > 0) {
                const { error: removeError } = await supabase.storage.from(bucketName).remove(files);
                if (removeError) console.error(`Failed to remove files in ${path}:`, removeError);
                else console.log(`Removed ${files.length} files from ${path || 'root'}`);
            }
        };

        await deleteRecursive();
        console.log(`✅ Bucket ${bucketName} cleared.`);
    } catch (e) {
        console.error("Error clearing storage:", e);
    }
}

async function clearTable(tableName) {
    console.log(`\n🗑️  Clearing table: ${tableName}...`);
    const { error } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete not equal to nil UUID (effectively all)

    if (error) {
        console.error(`Error clearing ${tableName}:`, error.message);
    } else {
        console.log(`✅ Table ${tableName} cleared.`);
    }
}

async function main() {
    console.log('⚠️  WARNING: This will wipe data from Supabase. ⚠️');
    console.log('Target: fonts bucket, font_variants table, fonts table.');
    console.log('Preserving: profiles table.\n');

    // Clear Storage
    await clearStorage('fonts');

    // Clear Tables (Order matters due to foreign keys)
    await clearTable('font_variants'); // Link to fonts
    await clearTable('fonts');         // Main table

    console.log('\n✨ Cleanup complete.');
}

main();
