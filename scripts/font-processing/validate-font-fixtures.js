import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';
import { normalizeFontMetadata, planVariantGroups, sha256Buffer } from './core.js';

function getName(font, key) {
  const value = font.names?.[key];
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.en || Object.values(value).find((entry) => typeof entry === 'string') || null;
}

export function inspectFontFile(filePath) {
  const bytes = fs.readFileSync(filePath);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const font = opentype.parse(arrayBuffer);
  const subfamily = getName(font, 'fontSubfamily');
  const metadata = normalizeFontMetadata({
    family_name: getName(font, 'fontFamily'),
    subfamily_name: subfamily,
    full_name: getName(font, 'fullName'),
    postscript_name: getName(font, 'postScriptName'),
    weight_class: font.tables?.os2?.usWeightClass ?? null,
    is_italic: Boolean(
      (font.tables?.os2?.fsSelection && (font.tables.os2.fsSelection & 1)) ||
      (font.tables?.head?.macStyle && (font.tables.head.macStyle & 2)) ||
      /italic|oblique/i.test(subfamily || ''),
    ),
    is_variable: Boolean(font.tables?.fvar),
    glyph_count: font.numGlyphs ?? null,
    file_path: filePath,
    status: 'parsed',
  });
  return {
    asset_id: sha256Buffer(bytes),
    sha256: sha256Buffer(bytes),
    relative_path: path.basename(filePath),
    size_bytes: bytes.length,
    metadata,
  };
}

export function validateFontFiles(filePaths) {
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    throw new TypeError('Pass one or more local font file paths');
  }
  const assets = filePaths.map(inspectFontFile);
  const plan = planVariantGroups(assets);
  return {
    mode: 'local-font-fixture-validation',
    database_writes_performed: false,
    uploads_performed: false,
    assets: assets.map((asset) => ({
      file: asset.relative_path,
      sha256: asset.sha256,
      size_bytes: asset.size_bytes,
      metadata: asset.metadata,
    })),
    planned_variant_group_count: plan.groups.length,
    groups: plan.groups.map((group) => ({
      family_name: group.family_name,
      variant_name: group.variant_name,
      asset_count: group.assets.length,
      conflicts: group.conflicts,
    })),
    review: plan.review,
  };
}

if (process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href) {
  try {
    const result = validateFontFiles(process.argv.slice(2));
    process.stdout.write(JSON.stringify(result, null, 2) + '\\n');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
