import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import opentype from 'opentype.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const requestedQueueId = process.env.FONT_PROCESSING_QUEUE_ID?.trim() || null;
const outputDir = process.env.FONT_DISCOVERY_OUTPUT_DIR || 'font-discovery-reports';
const maxArchiveBytes = Number(process.env.FONT_DISCOVERY_MAX_ARCHIVE_BYTES || 700 * 1024 * 1024);

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const supportedExtensions = new Set(['.ttf', '.otf', '.woff', '.woff2']);
const report = {
  generated_at: new Date().toISOString(),
  mode: 'read-only-discovery',
  database_writes_performed: false,
  queue_items: [],
  warnings: [],
};

function cleanHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  let candidate = value.trim();
  const markdown = candidate.match(/\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/i);
  if (markdown) candidate = markdown[1];
  if (candidate.startsWith('//')) candidate = `https:${candidate}`;
  if (!/^https?:\/\//i.test(candidate)) return null;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function safeDisplayUrl(value) {
  const normalized = cleanHttpUrl(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    // Keep credentials and signed query parameters out of downloadable reports.
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function safeSegment(value) {
  return String(value || 'asset').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 100);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function guessVariant(filename) {
  const base = path.basename(filename, path.extname(filename));
  const normalized = base.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_]+/g, ' ').trim();
  const known = [
    ['Thin Italic', /(?:^|[\s-])(?:thin|hairline)(?:[\s-]+italic|italic)(?:$|[\s-])/i],
    ['Extra Light Italic', /(?:extra[\s-]?light|ultra[\s-]?light)[\s-]?italic/i],
    ['Semi Bold Italic', /(?:semi[\s-]?bold|demi[\s-]?bold)[\s-]?italic/i],
    ['Extra Bold Italic', /(?:extra[\s-]?bold|ultra[\s-]?bold)[\s-]?italic/i],
    ['Bold Italic', /bold[\s-]?italic|italic[\s-]?bold/i],
    ['Light Italic', /light[\s-]?italic/i],
    ['Medium Italic', /medium[\s-]?italic/i],
    ['Regular Italic', /regular[\s-]?italic|italic/i],
    ['Extra Light', /extra[\s-]?light|ultra[\s-]?light/i],
    ['Semi Bold', /semi[\s-]?bold|demi[\s-]?bold/i],
    ['Extra Bold', /extra[\s-]?bold|ultra[\s-]?bold/i],
    ['Black', /black|heavy/i],
    ['Bold', /bold/i],
    ['Medium', /medium/i],
    ['Light', /light/i],
    ['Thin', /thin|hairline/i],
    ['Variable', /variable|vf(?:$|[\s-])/i],
    ['Regular', /regular|roman|book/i],
  ];
  for (const [name, pattern] of known) {
    if (pattern.test(normalized)) return { guess: name, confidence: 'heuristic' };
  }
  return { guess: null, confidence: 'unknown' };
}

function parseMetadata(filePath, extension) {
  try {
    // Use the same name-table precedence for every font format. Different
    // parsers previously returned inconsistent family/subfamily metadata.
    const parserPath = path.join(process.cwd(), 'scripts', 'font-processing', 'parse-woff2-metadata.py');
    const output = execFileSync('python3', [parserPath, filePath], {
      encoding: 'utf8',
      timeout: 30_000,
      maxBuffer: 2 * 1024 * 1024,
    });
    return JSON.parse(output);
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return { status: 'parse_failed', reason: `Font metadata parser failed for ${extension}: ${details.slice(0, 500)}` };
  }
}

function scanFiles(root) {
  const found = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
        found.push(fullPath);
      }
    }
  };
  walk(root);
  return found;
}

async function downloadArchive(url, destination) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'NoBadFonts-FontDiscovery/1.0' },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > maxArchiveBytes) throw new Error(`Archive exceeds ${maxArchiveBytes} byte limit`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > maxArchiveBytes) throw new Error(`Archive exceeds ${maxArchiveBytes} byte limit`);
  fs.writeFileSync(destination, bytes, { flag: 'wx' });
  return { bytes: bytes.length, sha256: sha256(bytes) };
}

async function main() {
  const query = supabase
    .from('font_processing_queue')
    .select('id, font_id, slug, download_urls, status, created_at')
    .in('status', ['pending', 'error'])
    .order('created_at', { ascending: true });

  const { data: queueItems, error } = requestedQueueId
    ? await supabase.from('font_processing_queue')
        .select('id, font_id, slug, download_urls, status, created_at')
        .eq('id', requestedQueueId)
        .limit(1)
    : await query;

  if (error) throw new Error(`Queue read failed: ${error.message}`);
  if (!queueItems?.length) {
    report.warnings.push(requestedQueueId
      ? `No queue row found for requested id: ${requestedQueueId}`
      : 'No pending or error queue items were found.');
  }

  const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nobadfonts-discovery-'));
  try {
    for (const item of queueItems || []) {
      const itemReport = {
        queue_id: item.id,
        font_id: item.font_id,
        slug: item.slug,
        queue_status_at_scan: item.status,
        download_sources: [],
        assets: [],
        warnings: [],
      };
      report.queue_items.push(itemReport);

      if (!Array.isArray(item.download_urls) || item.download_urls.length === 0) {
        itemReport.warnings.push('download_urls is empty or is not an array.');
        continue;
      }

      for (let index = 0; index < item.download_urls.length; index++) {
        const source = item.download_urls[index];
        const url = cleanHttpUrl(source?.url);
        const label = String(source?.label || `source-${index + 1}`);
        const sourceReport = {
          label,
          original_url: safeDisplayUrl(source?.url),
          normalized_url: safeDisplayUrl(url),
          outcome: 'pending',
          archive_bytes: null,
          archive_sha256: null,
          font_files_found: 0,
          error: null,
        };
        itemReport.download_sources.push(sourceReport);

        if (!url) {
          sourceReport.outcome = 'skipped_invalid_url';
          sourceReport.error = 'Expected a valid HTTP(S) URL in source.url.';
          continue;
        }

        const sourceDir = path.join(workRoot, safeSegment(item.slug), `${index}-${safeSegment(label)}`);
        const archivePath = `${sourceDir}.zip`;
        const extractDir = `${sourceDir}-extracted`;
        fs.mkdirSync(path.dirname(sourceDir), { recursive: true });

        try {
          const downloadInfo = await downloadArchive(url, archivePath);
          sourceReport.archive_bytes = downloadInfo.bytes;
          sourceReport.archive_sha256 = downloadInfo.sha256;

          // Validate archive contents before extraction to avoid unsafe archive paths.
          const listing = execFileSync('unzip', ['-Z1', archivePath], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
          const entries = listing.split(/\r?\n/).filter(Boolean);
          const unsafeEntry = entries.find((entry) =>
            path.posix.isAbsolute(entry) ||
            entry.split('/').some((part) => part === '..') ||
            /^[a-zA-Z]:/.test(entry)
          );
          if (unsafeEntry) throw new Error(`Archive contains an unsafe path: ${unsafeEntry}`);

          execFileSync('unzip', ['-o', '-q', archivePath, '-d', extractDir], { stdio: 'pipe' });
          const fontFiles = scanFiles(extractDir);
          sourceReport.font_files_found = fontFiles.length;
          sourceReport.outcome = 'scanned';

          for (const filePath of fontFiles) {
            const extension = path.extname(filePath).toLowerCase();
            const relativePath = path.relative(extractDir, filePath).split(path.sep).join('/');
            const stats = fs.statSync(filePath);
            const variant = guessVariant(path.basename(filePath));
            itemReport.assets.push({
              source_label: label,
              source_url: safeDisplayUrl(url),
              archive_sha256: downloadInfo.sha256,
              relative_path: relativePath,
              filename: path.basename(filePath),
              extension: extension.slice(1),
              size_bytes: stats.size,
              sha256: sha256(fs.readFileSync(filePath)),
              variant_name_guess: variant.guess,
              variant_guess_confidence: variant.confidence,
              metadata: parseMetadata(filePath, extension),
            });
          }
        } catch (error) {
          sourceReport.outcome = 'error';
          sourceReport.error = error instanceof Error ? error.message : String(error);
          itemReport.warnings.push(`Source "${label}" could not be scanned: ${sourceReport.error}`);
        } finally {
          fs.rmSync(archivePath, { force: true });
          fs.rmSync(extractDir, { recursive: true, force: true });
        }
      }
      itemReport.assets.sort((a, b) =>
        a.relative_path.localeCompare(b.relative_path) || a.extension.localeCompare(b.extension)
      );
    }
  } finally {
    fs.rmSync(workRoot, { recursive: true, force: true });
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `font-discovery-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const reportPath = path.join(outputDir, filename);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });

  const assetCount = report.queue_items.reduce((sum, item) => sum + item.assets.length, 0);
  console.log(`Discovery report written: ${reportPath}`);
  console.log(`Queue items: ${report.queue_items.length}; font assets inventoried: ${assetCount}`);
  console.log('Read-only guarantee: this script does not upload assets, write database rows, or change queue statuses.');
  if (report.queue_items.some((item) => item.warnings.length > 0) || report.warnings.length > 0) {
    console.warn('Discovery completed with warnings; inspect the JSON report before using the results.');
  }
}

main().catch((error) => {
  console.error('Font asset discovery failed:', error);
  process.exitCode = 1;
});
