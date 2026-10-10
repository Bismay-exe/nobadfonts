import { assertProductionWriteEnabled } from './font-processing/write-gate.js';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { createWriteStream, mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import { createUnzip } from 'zlib';

try {
  assertProductionWriteEnabled();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

// Resolve the Supabase SDK only after the write gate, so a blocked invocation
// can exit without loading credentials, dependencies, or creating a client.
const { createClient } = await import('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateQueueStatus(id, status, errorMessage = null) {
  const { data, error } = await supabase.from('font_processing_queue')
    .update({ status, error_message: errorMessage }).eq('id', id).eq('status', 'processing')
    .select('id').maybeSingle();
  if (error) throw new Error(`Failed to update queue item ${id} to ${status}: ${error.message}`);
  if (!data) throw new Error(`Queue item ${id} was not in processing state; refusing transition to ${status}`);
}

// Font formats we keep
const FONT_EXTENSIONS = new Set(['.ttf', '.otf', '.woff', '.woff2']);

// Content types for Supabase storage
const CONTENT_TYPES = {
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
};

/**
 * Cleans URLs that may be markdown-wrapped [title](url) from AI output
 */
function cleanUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let url = raw.trim();
  if (!url || url === 'null') return null;

  // Extract from markdown link: [title](https://...)
  const mdMatch = url.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/);
  if (mdMatch) url = mdMatch[1].trim();

  // Strip stray wrapper characters
  url = url.replace(/^[<(\["'`]+|[>)\]"'`]+$/g, '').trim();
  url = url.replace(/[),;.]+$/, '').trim();
  if (!url) return null;

  if (!/^https?:\/\//i.test(url)) {
    url = url.startsWith('//') ? `https:${url}` : `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Downloads a file from a URL to a local path
 */
async function downloadFile(url, destPath) {
  const cleanedUrl = cleanUrl(url);
  if (!cleanedUrl) throw new Error(`Invalid URL: ${url}`);

  const res = await fetch(cleanedUrl, {
    headers: {
      'User-Agent': 'NoBadFonts-FontProcessor/1.0',
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for: ${cleanedUrl}`);

  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) mkdirSync(dir, { recursive: true });

  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
  const sizeKB = (arrayBuffer.byteLength / 1024).toFixed(1);
  console.log(`    ✓ Downloaded ${path.basename(destPath)} (${sizeKB} KB)`);
}

/**
 * Extracts a zip file to a directory using the system unzip command.
 * Returns array of extracted file paths.
 */
function extractZip(zipPath, destDir) {
  mkdirSync(destDir, { recursive: true });
  try {
    execFileSync('unzip', ['-o', '-q', zipPath, '-d', destDir], { stdio: 'pipe' });
  } catch (err) {
    // unzip exits non-zero even on warnings, check if files were extracted
    if (!fs.existsSync(destDir)) throw new Error(`Extraction failed: ${err.message}`);
  }
}

/**
 * Recursively scans a directory and returns all font files found.
 */
function scanFontFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (FONT_EXTENSIONS.has(ext)) {
          results.push(full);
        }
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * Extracts the variant name from a font filename.
 * e.g. "MonaSans-BoldItalic.ttf" -> "Bold Italic"
 *      "Cabinet_Grotesk_Variable.ttf" -> "Variable"
 *      "Gidole-Regular.ttf" -> "Regular"
 */
function extractVariantName(filename) {
  const base = path.basename(filename, path.extname(filename));

  // Try splitting on hyphen first: FontName-VariantName
  const hyphenIdx = base.indexOf('-');
  if (hyphenIdx !== -1) {
    const after = base.slice(hyphenIdx + 1);
    return after
      .replace(/([a-z])([A-Z])/g, '$1 $2') // CamelCase -> Camel Case
      .replace(/[_-]+/g, ' ')
      .trim() || 'Regular';
  }

  // Try underscore: Font_Name_Variant
  const parts = base.split('_');
  if (parts.length > 1) {
    return parts.slice(1).join(' ').trim() || 'Regular';
  }

  // Single word — treat as Regular
  return 'Regular';
}

/**
 * Groups font files by variant name and format.
 * Returns a Map: variantName -> { ttf?, otf?, woff?, woff2? }
 */
function groupFontFiles(fontFiles) {
  const groups = new Map();
  const conflicts = [];
  for (const filePath of fontFiles) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const variantName = extractVariantName(filePath);
    if (!groups.has(variantName)) groups.set(variantName, {});
    const group = groups.get(variantName);
    if (group[ext]) {
      conflicts.push({ variant_name: variantName, extension: ext, first_path: group[ext], conflicting_path: filePath });
      continue;
    }
    group[ext] = filePath;
  }
  return { groups, conflicts };
}

async function processQueue() {
  console.log('Checking for pending or failed (error) font downloads...\n');

  const { data: queueItems, error: fetchError } = await supabase
    .from('font_processing_queue')
    .select('*, fonts(uploaded_by)')
    .in('status', ['pending', 'error']);

  if (fetchError) throw new Error(`Failed to fetch queue items: ${fetchError.message}`);

  if (!queueItems || queueItems.length === 0) {
    console.log('No pending or error items found.');
    return;
  }

  console.log(`Found ${queueItems.length} item(s) to process (pending or error retry).\n`);

  for (const item of queueItems) {
    console.log(`${'='.repeat(60)}`);
    console.log(`Font: ${item.slug} (ID: ${item.id}) [Status: ${item.status}]`);
    console.log(`${'='.repeat(60)}`);

    const { data: claimed, error: claimError } = await supabase.from('font_processing_queue')
      .update({ status: 'processing', error_message: null }).eq('id', item.id).eq('status', item.status)
      .select('id').maybeSingle();
    if (claimError) throw new Error(`Failed to claim queue item ${item.id}: ${claimError.message}`);
    if (!claimed) {
      console.log(`Skipping ${item.slug}: another worker already claimed or changed its status.`);
      continue;
    }

    let userId = item.fonts?.uploaded_by;
    if (!userId) {
      // Attempt fallback to admin profile
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();

      if (adminProfile?.id) {
        userId = adminProfile.id;
      } else {
        console.error('  ❌ Cannot determine uploaded_by user_id');
        await updateQueueStatus(item.id, 'error', 'Could not determine uploaded_by user_id');
        continue;
      }
    }

    const releaseZips = item.download_urls; // Array of { url, label }
    if (!Array.isArray(releaseZips) || releaseZips.length === 0) {
      console.error('  ❌ No release zips found in download_urls');
      await updateQueueStatus(item.id, 'error', 'No release zips provided');
      continue;
    }

    if (typeof item.slug !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(item.slug) || item.slug.includes('..')) {
      await updateQueueStatus(item.id, 'error', 'Unsafe font slug; refusing filesystem or Storage writes');
      continue;
    }
    const tmpDir = path.join(process.cwd(), 'tmp_fonts', item.slug);
    mkdirSync(tmpDir, { recursive: true });
    let allFontFiles = [];
    const archiveErrors = [];

    // Step 1: Download and extract all zips, collect all font files
    for (const [zipIndex, zip] of releaseZips.entries()) {
      const zipUrl = cleanUrl(zip.url);
      const rawLabel = String(zip.label || 'zip');
      const label = `zip-${zipIndex + 1}-${rawLabel.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/\.\.+/g, '.').slice(0, 64)}`;
      if (!zipUrl) {
        archiveErrors.push(`Invalid URL for archive "${label}"`);
        continue;
      }
      const zipPath = path.join(tmpDir, `${label}.zip`);
      const extractDir = path.join(tmpDir, `extracted_${label}`);

      console.log(`\n  📦 Processing zip: ${label}`);
      console.log(`     URL: ${zipUrl}`);

      try {
        await downloadFile(zipUrl, zipPath);
        console.log(`     Extracting...`);
        extractZip(zipPath, extractDir);

        const found = scanFontFiles(extractDir);
        console.log(`     Found ${found.length} font file(s)`);
        allFontFiles = allFontFiles.concat(found);

        // Remove zip to save space
        fs.unlinkSync(zipPath);
      } catch (err) {
        archiveErrors.push(`Archive "${label}" failed: ${err.message}`);
        console.warn(`  ⚠️ Failed to process zip "${label}": ${err.message}`);
      }
    }

    if (archiveErrors.length) {
      await updateQueueStatus(item.id, 'error', `Archive preflight failed; no assets uploaded. ${archiveErrors.slice(0, 3).join('; ')}`.slice(0, 1000));
      fs.rmSync(tmpDir, { recursive: true, force: true });
      continue;
    }
    if (allFontFiles.length === 0) {
      console.error('  ❌ No font files found in any zip');
      await updateQueueStatus(item.id, 'error', 'No font files found in provided release zips');
      fs.rmSync(tmpDir, { recursive: true, force: true });
      continue;
    }

    console.log(`\n  Total font files found across all zips: ${allFontFiles.length}`);

    // Step 2: Group by variant name
    const { groups: variantGroups, conflicts } = groupFontFiles(allFontFiles);
    console.log(`  Identified ${variantGroups.size} tentative variant(s).\n`);
    if (conflicts.length) {
      const sample = conflicts.slice(0, 5).map(c => `${c.variant_name} .${c.extension}: ${path.basename(c.first_path)} vs ${path.basename(c.conflicting_path)}`).join('; ');
      const message = `Ambiguous filename grouping found ${conflicts.length} same-variant/same-format collisions. No assets uploaded. ${sample}`.slice(0, 1000);
      console.error(`  ❌ ${message}`);
      await updateQueueStatus(item.id, 'error', message);
      fs.rmSync(tmpDir, { recursive: true, force: true });
      continue;
    }

    let totalUploaded = 0;
    let hasErrors = false;

    // Step 3: Process each variant — independently (one failure doesn't stop others)
    for (const [variantName, formats] of variantGroups) {
      console.log(`  Variant: "${variantName}"`);

      // Generate WOFF2 if missing and we have TTF or OTF
      if (!formats.woff2 && (formats.ttf || formats.otf)) {
        const sourceFile = formats.ttf || formats.otf;
        const woff2Path = sourceFile.replace(/\.(ttf|otf)$/i, '.woff2');
        try {
          console.log(`    Generating WOFF2 from .${formats.ttf ? 'ttf' : 'otf'}...`);
          execFileSync('woff2_compress', [sourceFile], { stdio: 'pipe' });
          // woff2_compress outputs to same directory with .woff2 extension
          const expectedWoff2 = sourceFile.replace(/\.(ttf|otf)$/i, '.woff2');
          if (fs.existsSync(expectedWoff2)) {
            formats.woff2 = expectedWoff2;
            console.log(`    ✓ WOFF2 generated`);
          }
        } catch (err) {
          console.warn(`    ⚠️ WOFF2 generation failed: ${err.message?.split('\n')[0]}`);
        }
      }

      // Upload each format to Supabase Storage
      const variantData = {
        font_id: item.font_id,
        variant_name: variantName,
      };

      let anyUploaded = false;

      for (const [ext, filePath] of Object.entries(formats)) {
        if (!filePath || !fs.existsSync(filePath)) continue;

        const storageVariant = variantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'variant';
        const storagePath = `${userId}/${item.slug}/variants/${storageVariant}/${item.slug}-${storageVariant}.${ext}`;

        try {
          const fileBuffer = fs.readFileSync(filePath);
          const fileSize = fs.statSync(filePath).size;

          const { error: uploadError } = await supabase.storage
            .from('fonts')
            .upload(storagePath, fileBuffer, {
              upsert: true,
              contentType: CONTENT_TYPES[ext] || 'application/octet-stream',
            });

          if (uploadError) {
            console.warn(`    ⚠️ Storage upload failed .${ext}: ${uploadError.message}`);
            hasErrors = true;
            continue;
          }

          const { data: { publicUrl } } = supabase.storage.from('fonts').getPublicUrl(storagePath);
          variantData[`${ext}_url`] = publicUrl;
          variantData[`file_size_${ext}`] = fileSize;
          anyUploaded = true;
          console.log(`    ✓ Uploaded .${ext} (${(fileSize / 1024).toFixed(1)} KB)`);
        } catch (err) {
          console.warn(`    ⚠️ Upload error .${ext}: ${err.message}`);
          hasErrors = true;
        }
      }

      // Save to font_variants table
      if (anyUploaded) {
        const { data: existing } = await supabase
          .from('font_variants')
          .select('id')
          .eq('font_id', item.font_id)
          .eq('variant_name', variantName)
          .maybeSingle();

        const { error: dbError } = existing
          ? await supabase.from('font_variants').update(variantData).eq('id', existing.id)
          : await supabase.from('font_variants').insert([variantData]);

        if (dbError) {
          console.warn(`    ⚠️ DB save failed: ${dbError.message}`);
          hasErrors = true;
        } else {
          console.log(`    ✅ Saved to database`);
          totalUploaded++;
        }
      } else {
        console.warn(`    ⚠️ No files uploaded for "${variantName}", skipping DB insert`);
        hasErrors = true;
      }
    }

    // Cleanup
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}

    const finalStatus = hasErrors ? 'error' : 'completed';
    const finalError = hasErrors ? 'One or more variant uploads or database writes failed; inspect Storage and font_variants before retrying.' : null;
    await updateQueueStatus(item.id, finalStatus, finalError);

    console.log(`\n✅ Done: ${item.slug} — ${totalUploaded}/${variantGroups.size} variants saved [${finalStatus}]\n`);
  }
}

processQueue()
  .then(() => {
    console.log('Queue processing finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
