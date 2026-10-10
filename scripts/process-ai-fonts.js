import { assertProductionWriteEnabled } from './font-processing/write-gate.js';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { createHash } from 'node:crypto';
import { createWriteStream, mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import { createUnzip } from 'zlib';

const REPORT_ONLY = process.argv.includes('--report-only');

if (!REPORT_ONLY) {
  try {
    assertProductionWriteEnabled();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
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
 * Derive a logical variant from embedded metadata. Full-name suffixes retain
 * optical-size and softness distinctions that a filename split would lose.
 * Variable fonts are identified from their fvar axes, not a guessed filename.
 */
function deriveVariantName(metadata, filename) {
  if (metadata?.is_variable && metadata.variation_axes?.length) {
    const axes = metadata.variation_axes.map((axis) => axis.tag).filter(Boolean);
    if (axes.length) return `Variable (${axes.join(', ')})`;
  }

  const family = String(metadata?.family_name || '').trim();
  const fullName = String(metadata?.full_name || '').trim();
  if (family && fullName && fullName.toLocaleLowerCase('en-US').startsWith(family.toLocaleLowerCase('en-US'))) {
    const suffix = fullName.slice(family.length).replace(/^[\\s_-]+/, '').trim();
    if (suffix) return suffix.replace(/\\s+/g, ' ');
  }

  const subfamily = String(metadata?.subfamily_name || '').trim();
  if (subfamily) return subfamily.replace(/\\s+/g, ' ');

  // Filename fallback is for the inventory report only; missing metadata is
  // separately flagged and blocks publishing rather than being silently trusted.
  const base = path.basename(filename, path.extname(filename));
  const suffix = base.includes('-') ? base.slice(base.indexOf('-') + 1) : base;
  return suffix.replace(/[._-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim() || 'Unknown';
}

/**
 * Parse the actual font binaries with FontTools, then group by embedded family
 * and the most specific available style name. Byte-identical copies of the
 * same variant/format are deduplicated; distinct collisions are retained in
 * the report and block uploads rather than silently dropping an asset.
 */
function inspectFontFiles(fontFiles) {
  const python = process.platform === 'win32' ? 'python' : (process.env.PYTHON || 'python3');
  const helperPath = path.join(process.cwd(), 'scripts', 'font-processing', 'extract-font-metadata.py');
  const stdout = execFileSync(python, [helperPath], {
    input: JSON.stringify(fontFiles.map((file) => path.resolve(file))),
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return JSON.parse(stdout);
}

function groupFontFiles(fontFiles, metadataByPath) {
  const groups = new Map();
  const conflicts = [];
  const review = [];
  const duplicateAssets = [];
  const hashes = new Map();

  for (const filePath of fontFiles) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const absolutePath = path.resolve(filePath);
    const metadata = metadataByPath[absolutePath];
    const bytes = fs.readFileSync(filePath);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const variantName = deriveVariantName(metadata, filePath);
    const familyName = String(metadata?.family_name || '').trim();

    if (!metadata || metadata.parser_status !== 'parsed' || !familyName || variantName === 'Unknown') {
      review.push({
        path: filePath,
        sha256,
        reason: metadata?.parser_error || metadata?.parser_status || 'missing_embedded_family_or_variant',
        family_name: familyName || null,
        variant_name: variantName,
        metadata: metadata || null,
      });
      continue;
    }

    const key = JSON.stringify([familyName.toLocaleLowerCase('en-US'), variantName.toLocaleLowerCase('en-US')]);
    if (!groups.has(key)) {
      groups.set(key, {
        family_name: familyName,
        variant_name: variantName,
        is_variable: metadata.is_variable === true,
        variation_axes: metadata.variation_axes || [],
        formats: {},
        assets: [],
      });
    }
    const group = groups.get(key);
    const existing = group.formats[ext];
    if (existing) {
      if (existing.sha256 === sha256) {
        existing.duplicate_paths.push(filePath);
        duplicateAssets.push({ variant_name: variantName, extension: ext, sha256, kept_path: existing.path, duplicate_path: filePath });
        continue;
      }
      conflicts.push({
        family_name: familyName,
        variant_name: variantName,
        extension: ext,
        first_path: existing.path,
        conflicting_path: filePath,
        first_sha256: existing.sha256,
        conflicting_sha256: sha256,
        reason: 'multiple_distinct_assets_for_same_variant_and_format',
      });
      group.assets.push({ path: filePath, extension: ext, sha256, metadata });
      continue;
    }

    group.formats[ext] = { path: filePath, sha256, metadata, duplicate_paths: [] };
    group.assets.push({ path: filePath, extension: ext, sha256, metadata });
    hashes.set(sha256, (hashes.get(sha256) || 0) + 1);
  }

  return { groups: [...groups.values()], conflicts, review, duplicateAssets };
}

function writeInventoryReport(item, fontFiles, metadataByPath, grouped, archiveErrors = []) {
  const reportDir = path.join(process.cwd(), 'font-processing-reports');
  mkdirSync(reportDir, { recursive: true });
  const assets = fontFiles.map((filePath) => {
    const metadata = metadataByPath[path.resolve(filePath)] || null;
    const bytes = fs.readFileSync(filePath);
    return {
      path: path.relative(process.cwd(), filePath).split(path.sep).join('/'),
      extension: path.extname(filePath).toLowerCase(),
      size_bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      metadata,
    };
  });
  const report = {
    generated_at: new Date().toISOString(),
    mode: 'report-only',
    database_writes_performed: false,
    storage_uploads_performed: false,
    queue_item: { id: item.id, slug: item.slug, font_id: item.font_id, original_status: item.status },
    archive_errors: archiveErrors,
    asset_count: assets.length,
    variant_count: grouped.groups.length,
    review_count: grouped.review.length,
    conflict_count: grouped.conflicts.length,
    duplicate_count: grouped.duplicateAssets.length,
    assets,
    variants: grouped.groups.map((group) => ({
      family_name: group.family_name,
      variant_name: group.variant_name,
      is_variable: group.is_variable,
      variation_axes: group.variation_axes,
      formats: Object.fromEntries(Object.entries(group.formats).map(([ext, entry]) => [ext, {
        path: path.relative(process.cwd(), entry.path).split(path.sep).join('/'),
        sha256: entry.sha256,
        duplicate_paths: entry.duplicate_paths.map((value) => path.relative(process.cwd(), value).split(path.sep).join('/')),
      }])),
    })),
    review: grouped.review,
    conflicts: grouped.conflicts,
    duplicates: grouped.duplicateAssets,
  };
  const outputPath = path.join(reportDir, `${String(item.slug).replace(/[^a-zA-Z0-9._-]/g, '-')}-${String(item.id).replace(/[^a-zA-Z0-9._-]/g, '-')}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\\n');
  console.log(`  Inventory report saved: ${outputPath}`);
  console.log(`  Inventory summary: ${assets.length} assets, ${grouped.groups.length} variants, ${grouped.review.length} review item(s), ${grouped.conflicts.length} collision(s), ${grouped.duplicateAssets.length} duplicate(s)`);
  return outputPath;
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

    if (!REPORT_ONLY) {
      const { data: claimed, error: claimError } = await supabase.from('font_processing_queue')
        .update({ status: 'processing', error_message: null }).eq('id', item.id).eq('status', item.status)
        .select('id').maybeSingle();
      if (claimError) throw new Error(`Failed to claim queue item ${item.id}: ${claimError.message}`);
      if (!claimed) {
        console.log(`Skipping ${item.slug}: another worker already claimed or changed its status.`);
        continue;
      }
    } else {
      console.log('  Report-only mode: queue item will not be claimed or updated.');
    }

    let userId = item.fonts?.uploaded_by;
    if (!REPORT_ONLY && !userId) {
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
      if (!REPORT_ONLY) await updateQueueStatus(item.id, 'error', 'No release zips provided');
      continue;
    }

    if (typeof item.slug !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(item.slug) || item.slug.includes('..')) {
      if (!REPORT_ONLY) await updateQueueStatus(item.id, 'error', 'Unsafe font slug; refusing filesystem or Storage writes');
      console.error('  ❌ Unsafe font slug; refusing filesystem or Storage writes');
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

    if (archiveErrors.length && !REPORT_ONLY) {
      await updateQueueStatus(item.id, 'error', `Archive preflight failed; no assets uploaded. ${archiveErrors.slice(0, 3).join('; ')}`.slice(0, 1000));
      fs.rmSync(tmpDir, { recursive: true, force: true });
      continue;
    }
    if (allFontFiles.length === 0) {
      console.error('  ❌ No font files found in any zip');
      if (!REPORT_ONLY) await updateQueueStatus(item.id, 'error', 'No font files found in provided release zips');
      fs.rmSync(tmpDir, { recursive: true, force: true });
      continue;
    }

    console.log(`\n  Total font files found across all zips: ${allFontFiles.length}`);

    // Step 2: Parse binary metadata and preserve the most specific logical variant names.
    let metadataByPath;
    try {
      metadataByPath = inspectFontFiles(allFontFiles);
    } catch (error) {
      const message = `Local font metadata extraction failed; no assets uploaded: ${error.message}`.slice(0, 1000);
      console.error(`  ❌ ${message}`);
      if (!REPORT_ONLY) await updateQueueStatus(item.id, 'error', message);
      fs.rmSync(tmpDir, { recursive: true, force: true });
      continue;
    }

    const grouped = groupFontFiles(allFontFiles, metadataByPath);
    const variantGroups = grouped.groups;
    console.log(`  Identified ${variantGroups.length} metadata-derived variant(s).\\n`);

    if (REPORT_ONLY) {
      writeInventoryReport(item, allFontFiles, metadataByPath, grouped, archiveErrors);
      fs.rmSync(tmpDir, { recursive: true, force: true });
      continue;
    }

    if (grouped.review.length || grouped.conflicts.length) {
      const reviewSample = grouped.review.slice(0, 3).map((entry) => `${path.basename(entry.path)}: ${entry.reason}`).join('; ');
      const conflictSample = grouped.conflicts.slice(0, 3).map((entry) => `${entry.variant_name} .${entry.extension}: ${path.basename(entry.first_path)} vs ${path.basename(entry.conflicting_path)}`).join('; ');
      const message = `Metadata preflight blocked all uploads. Review items: ${grouped.review.length}; distinct format collisions: ${grouped.conflicts.length}. ${[reviewSample, conflictSample].filter(Boolean).join('; ')}. Run with --report-only to inspect the full inventory.`.slice(0, 1000);
      console.error(`  ❌ ${message}`);
      await updateQueueStatus(item.id, 'error', message);
      fs.rmSync(tmpDir, { recursive: true, force: true });
      continue;
    }

    let totalUploaded = 0;
    let hasErrors = false;

    // Step 3: Process each variant — independently (one failure doesn't stop others)
    for (const group of variantGroups) {
      const variantName = group.variant_name;
      const formats = Object.fromEntries(Object.entries(group.formats).map(([ext, entry]) => [ext, entry.path]));
      console.log(`  Family: "${group.family_name}" — variant: "${variantName}"`);

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
