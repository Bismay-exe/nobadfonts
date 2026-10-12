import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const SUPPORTED_EXTENSIONS = new Set(['.ttf', '.otf', '.woff', '.woff2']);
const DEFAULT_MAX_ARCHIVE_BYTES = Number(process.env.FONT_DISCOVERY_MAX_ARCHIVE_BYTES || 700 * 1024 * 1024);

export function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function cleanHttpUrl(value) {
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

export function safeDisplayUrl(value) {
  const normalized = cleanHttpUrl(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

export function safeSegment(value) {
  return String(value || 'asset').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 100);
}

function scanFiles(root) {
  const found = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        found.push(fullPath);
      }
    }
  };
  walk(root);
  return found;
}

async function downloadArchive(url, destination, maxArchiveBytes) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'NoBadFonts-FontProcessing/1.0' },
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

export function parseMetadata(filePath, extension) {
  try {
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

/**
 * Download every release ZIP for a queue item, validate archive paths, extract,
 * and return the inventory of font files with bytes + metadata. Local filesystem
 * only; no database or Storage writes. `readBytes:true` loads each font file into
 * memory (needed by the publisher); omit it for read-only discovery.
 */
export async function extractQueueItemAssets(item, options = {}) {
  const maxArchiveBytes = options.maxArchiveBytes ?? DEFAULT_MAX_ARCHIVE_BYTES;
  const readBytes = options.readBytes === true;
  const sources = [];
  const assets = [];
  const warnings = [];

  if (!Array.isArray(item.download_urls) || item.download_urls.length === 0) {
    return { assets, sources, warnings: ['download_urls is empty or is not an array.'] };
  }

  const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nobadfonts-extract-'));
  try {
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
      sources.push(sourceReport);

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
        const downloadInfo = await downloadArchive(url, archivePath, maxArchiveBytes);
        sourceReport.archive_bytes = downloadInfo.bytes;
        sourceReport.archive_sha256 = downloadInfo.sha256;

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
          const bytes = fs.readFileSync(filePath);
          assets.push({
            source_label: label,
            source_url: safeDisplayUrl(url),
            archive_sha256: downloadInfo.sha256,
            relative_path: relativePath,
            filename: path.basename(filePath),
            extension: extension.slice(1),
            size_bytes: bytes.length,
            sha256: sha256(bytes),
            metadata: parseMetadata(filePath, extension),
            ...(readBytes ? { bytes } : {}),
          });
        }
      } catch (error) {
        sourceReport.outcome = 'error';
        sourceReport.error = error instanceof Error ? error.message : String(error);
        warnings.push(`Source "${label}" could not be scanned: ${sourceReport.error}`);
      } finally {
        fs.rmSync(archivePath, { force: true });
        fs.rmSync(extractDir, { recursive: true, force: true });
      }
    }
    assets.sort((a, b) =>
      a.relative_path.localeCompare(b.relative_path) || a.extension.localeCompare(b.extension));
  } finally {
    fs.rmSync(workRoot, { recursive: true, force: true });
  }

  return { assets, sources, warnings };
}

export { SUPPORTED_EXTENSIONS };
