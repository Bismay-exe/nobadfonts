import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SUPPORTED_FONT_EXTENSIONS = new Set(['.ttf', '.otf', '.woff', '.woff2']);
const MAX_ARCHIVE_BYTES = Number(process.env.FONT_DISCOVERY_MAX_ARCHIVE_BYTES || 700 * 1024 * 1024);
const fetchTimeoutMs = 60_000;

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function safeLabel(value) {
  return String(value || 'source').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);
}

function assertSafeZipEntries(entries) {
  const unsafe = entries.find((entry) =>
    path.posix.isAbsolute(entry) ||
    entry.split('/').some((part) => part === '..') ||
    /^[a-zA-Z]:/.test(entry)
  );
  if (unsafe) throw new Error(`Archive contains an unsafe path: ${unsafe}`);
}

async function downloadArchive(url, destination) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'NoBadFonts-ReadOnly-WOFF2-Validation/1.0' },
    signal: AbortSignal.timeout(fetchTimeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX_ARCHIVE_BYTES) throw new Error(`Archive exceeds ${MAX_ARCHIVE_BYTES} byte limit`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_ARCHIVE_BYTES) throw new Error(`Archive exceeds ${MAX_ARCHIVE_BYTES} byte limit`);
  fs.writeFileSync(destination, bytes, { flag: 'wx' });
  return { bytes: bytes.length, sha256: sha256(bytes) };
}

function parseWoff2(parserPath, filePath) {
  try {
    const output = execFileSync('python3', [parserPath, filePath], {
      encoding: 'utf8',
      timeout: 30_000,
      maxBuffer: 2 * 1024 * 1024,
    });
    const result = JSON.parse(output);
    return { ...result, status: result.status || 'unknown' };
  } catch (error) {
    return {
      status: 'parse_failed',
      reason: (error instanceof Error ? error.message : String(error)).slice(0, 500),
    };
  }
}

export async function validateWoff2FromDiscoveryReport(report, options = {}) {
  if (!report || !Array.isArray(report.queue_items)) {
    throw new TypeError('Expected discovery report with queue_items array');
  }
  const parserPath = options.parserPath || path.resolve('scripts/font-processing/parse-woff2-metadata.py');
  const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nbf-woff2-replay-'));
  const result = {
    generated_at: new Date().toISOString(),
    mode: 'read-only-offline-discovery-replay',
    database_writes_performed: false,
    baseline_generated_at: report.generated_at || null,
    queue_items: [],
    warnings: [],
  };
  try {
    for (const item of report.queue_items) {
      const itemResult = {
        slug: item.slug || null,
        baseline_asset_count: Array.isArray(item.assets) ? item.assets.length : 0,
        source_count: Array.isArray(item.download_sources) ? item.download_sources.length : 0,
        archives: [],
        font_asset_count_in_baseline: 0,
        font_results: [],
        woff2_asset_count_in_baseline: 0,
        baseline_woff2_status_counts: {},
        fresh_woff2_status_counts: {},
        woff2_results: [],
      };
      const baselineFontAssets = (item.assets || []).filter((asset) => {
        const ext = String(asset.extension || path.extname(asset.relative_path || '')).toLowerCase();
        return SUPPORTED_FONT_EXTENSIONS.has(ext.startsWith('.') ? ext : `.${ext}`);
      });
      const baselineWoff2 = baselineFontAssets.filter((asset) =>
        String(asset.extension || path.extname(asset.relative_path || '')).toLowerCase().replace(/^\./, '') === 'woff2'
      );
      itemResult.font_asset_count_in_baseline = baselineFontAssets.length;
      itemResult.woff2_asset_count_in_baseline = baselineWoff2.length;
      for (const asset of baselineWoff2) {
        const status = asset.metadata?.status || 'unknown';
        itemResult.baseline_woff2_status_counts[status] = (itemResult.baseline_woff2_status_counts[status] || 0) + 1;
      }
      const fontSourceLabels = new Set(baselineFontAssets.map((asset) => asset.source_label).filter(Boolean));
      const sources = (item.download_sources || []).filter((source) =>
        fontSourceLabels.has(source.label) &&
        source.outcome === 'scanned' && /^https?:\/\//i.test(source.original_url || source.normalized_url || '')
      );
      for (const source of sources) {
        const url = source.original_url || source.normalized_url;
        const label = source.label || 'source';
        const archivePath = path.join(workRoot, `${safeLabel(label)}.zip`);
        const extractDir = path.join(workRoot, `${safeLabel(label)}-extracted`);
        const archiveResult = { label, url, status: 'pending', archive_bytes: null, archive_sha256: null, baseline_archive_sha256: null, font_files_found: 0, woff2_files_found: 0, error: null };
        itemResult.archives.push(archiveResult);
        try {
          const downloaded = await downloadArchive(url, archivePath);
          archiveResult.archive_bytes = downloaded.bytes;
          archiveResult.archive_sha256 = downloaded.sha256;
          archiveResult.baseline_archive_sha256 = source.archive_sha256 || null;
          if (source.archive_sha256 && source.archive_sha256 !== downloaded.sha256) {
            archiveResult.archive_hash_changed = true;
            itemResult.warnings = itemResult.warnings || [];
            itemResult.warnings.push(`Archive hash changed for source "${label}"; fresh font metadata was parsed from the current archive.`);
          } else {
            archiveResult.archive_hash_changed = false;
          }
          const listing = execFileSync('unzip', ['-Z1', archivePath], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
          const entries = listing.split(/\r?\n/).filter(Boolean);
          assertSafeZipEntries(entries);
          fs.mkdirSync(extractDir, { recursive: true });
          execFileSync('unzip', ['-o', '-q', archivePath, '-d', extractDir], { stdio: 'pipe' });
          const fontPaths = [];
          const walk = (dir) => {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
              const fullPath = path.join(dir, entry.name);
              if (entry.isDirectory()) walk(fullPath);
              else if (entry.isFile() && SUPPORTED_FONT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) fontPaths.push(fullPath);
            }
          };
          walk(extractDir);
          archiveResult.font_files_found = fontPaths.length;
          archiveResult.woff2_files_found = fontPaths.filter((filePath) => path.extname(filePath).toLowerCase() === '.woff2').length;
          archiveResult.status = 'scanned';
          for (const filePath of fontPaths) {
            const relativePath = path.relative(extractDir, filePath).split(path.sep).join('/');
            const metadata = parseWoff2(parserPath, filePath);
            const baselineAsset = baselineFontAssets.find((asset) =>
              asset.source_label === label && asset.relative_path === relativePath
            );
            const record = {
              source_label: label,
              relative_path: relativePath,
              extension: path.extname(filePath).toLowerCase().slice(1),
              sha256: sha256(fs.readFileSync(filePath)),
              size_bytes: fs.statSync(filePath).size,
              metadata_status: metadata.status,
              family_name: metadata.family_name || null,
              subfamily_name: metadata.subfamily_name || null,
              weight_class: metadata.weight_class ?? null,
              is_italic: metadata.is_italic ?? null,
              is_variable: metadata.is_variable ?? null,
              glyph_count: metadata.glyph_count ?? null,
              variation_axes: Array.isArray(metadata.variation_axes) ? metadata.variation_axes : [],
              baseline_metadata_status: baselineAsset?.metadata?.status || 'asset_not_in_baseline',
              baseline_sha256: baselineAsset?.sha256 || null,
              hash_matches_baseline: baselineAsset ? baselineAsset.sha256 === sha256(fs.readFileSync(filePath)) : null,
              error: metadata.status === 'parse_failed' ? metadata.reason || null : null,
            };
            itemResult.font_results.push(record);
            if (record.extension === 'woff2') {
              itemResult.woff2_results.push(record);
              itemResult.fresh_woff2_status_counts[metadata.status] = (itemResult.fresh_woff2_status_counts[metadata.status] || 0) + 1;
            }
          }
        } catch (error) {
          archiveResult.status = 'error';
          archiveResult.error = error instanceof Error ? error.message : String(error);
          result.warnings.push(`Source "${label}" failed: ${archiveResult.error}`);
        } finally {
          fs.rmSync(archivePath, { force: true });
          fs.rmSync(extractDir, { recursive: true, force: true });
        }
      }
      itemResult.font_results.sort((a, b) => a.source_label.localeCompare(b.source_label) || a.relative_path.localeCompare(b.relative_path));
      itemResult.woff2_results.sort((a, b) => a.source_label.localeCompare(b.source_label) || a.relative_path.localeCompare(b.relative_path));
      itemResult.font_fresh_parse_success_count = itemResult.font_results.filter((asset) => asset.metadata_status === 'parsed').length;
      itemResult.font_parse_failed_count = itemResult.font_results.filter((asset) => asset.metadata_status !== 'parsed').length;
      itemResult.font_matching_baseline_hash_count = itemResult.font_results.filter((asset) => asset.hash_matches_baseline === true).length;
      itemResult.font_hash_mismatch_count = itemResult.font_results.filter((asset) => asset.hash_matches_baseline === false).length;
      itemResult.woff2_fresh_parse_success_count = itemResult.woff2_results.filter((asset) => asset.metadata_status === 'parsed').length;
      itemResult.woff2_parse_failed_count = itemResult.woff2_results.filter((asset) => asset.metadata_status !== 'parsed').length;
      itemResult.woff2_matching_baseline_hash_count = itemResult.woff2_results.filter((asset) => asset.hash_matches_baseline === true).length;
      itemResult.woff2_hash_mismatch_count = itemResult.woff2_results.filter((asset) => asset.hash_matches_baseline === false).length;
      result.queue_items.push(itemResult);
    }
  } finally {
    fs.rmSync(workRoot, { recursive: true, force: true });
  }
  return result;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [reportPath, outputPath] = process.argv.slice(2);
  if (!reportPath) {
    console.error('Usage: node scripts/font-processing/replay-woff2-discovery.js <saved-discovery-report.json> [output.json]');
    process.exitCode = 2;
  } else {
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      const result = await validateWoff2FromDiscoveryReport(report);
      const output = JSON.stringify(result, null, 2) + '\n';
      if (outputPath) fs.writeFileSync(outputPath, output, { flag: 'wx' });
      else process.stdout.write(output);
      const summary = result.queue_items.map((item) => ({
        slug: item.slug,
        baseline_font_asset_count: item.font_asset_count_in_baseline,
        font_fresh_parse_success_count: item.font_fresh_parse_success_count,
        font_parse_failed_count: item.font_parse_failed_count,
        font_matching_baseline_hash_count: item.font_matching_baseline_hash_count,
        font_hash_mismatch_count: item.font_hash_mismatch_count,
        baseline_woff2_asset_count: item.woff2_asset_count_in_baseline,
        fresh_woff2_status_counts: item.fresh_woff2_status_counts,
        fresh_parse_success_count: item.woff2_fresh_parse_success_count,
        parse_failed_count: item.woff2_parse_failed_count,
        matching_baseline_hash_count: item.woff2_matching_baseline_hash_count,
        hash_mismatch_count: item.woff2_hash_mismatch_count,
      }));
      console.log(JSON.stringify({ summary, warnings: result.warnings }, null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.stack || error.message : String(error));
      process.exitCode = 1;
    }
  }
}
