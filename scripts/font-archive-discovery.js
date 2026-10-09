import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const FONT_EXTENSIONS = new Set(['.ttf', '.otf', '.woff', '.woff2']);

function normalizeSpaces(value) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Best-effort filename classification only. This deliberately does not claim
 * that filenames prove a font's actual family/style; binary metadata should
 * be used to confirm ambiguous cases in a later processing stage.
 */
export function classifyFontFilename(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  const lower = basename.toLowerCase();
  const tokens = lower.split(/[-_\s]+/).filter(Boolean);
  const styleTokens = new Set([
    'thin', 'extralight', 'ultralight', 'light', 'regular', 'book', 'normal',
    'medium', 'semibold', 'demibold', 'bold', 'extrabold', 'ultrabold',
    'black', 'heavy', 'italic', 'oblique', 'variable', 'vf'
  ]);

  let styleStart = -1;
  for (let i = 1; i < tokens.length; i++) {
    if (styleTokens.has(tokens[i])) {
      styleStart = i;
      break;
    }
  }

  // Preserve the old naming convention as a fallback when a filename is
  // clearly of the form Family-Style or Family_Style.
  const delimiterMatch = basename.match(/^(.+?)[-_](.+)$/);
  let familyHint = null;
  let variantHint = 'Unclassified';
  let confidence = 'low';

  if (styleStart > 0) {
    familyHint = tokens.slice(0, styleStart).join(' ');
    variantHint = normalizeSpaces(tokens.slice(styleStart).join(' '));
    confidence = 'medium';
  } else if (delimiterMatch) {
    familyHint = normalizeSpaces(delimiterMatch[1]) || null;
    variantHint = normalizeSpaces(delimiterMatch[2]) || 'Unclassified';
  } else {
    familyHint = basename || null;
  }

  const isVariableHint = /(^|[-_\s])(variable|vf)([-_\s]|$)/i.test(basename);
  const subsetHint = /(^|[-_\s])(latin|cyrillic|greek|vietnamese|devanagari|arabic|hebrew|subset)([-_\s]|$)/i.test(basename);

  return {
    filename: path.basename(filePath),
    family_hint: familyHint,
    variant_hint: variantHint,
    is_variable_hint: isVariableHint,
    subset_hint: subsetHint,
    classification_confidence: confidence,
  };
}

export function buildFontFileInventory(filePaths) {
  return filePaths
    .filter((filePath) => FONT_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
    .map((filePath) => {
      const stat = fs.statSync(filePath);
      const hash = createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
      return {
        relative_path: filePath,
        extension: path.extname(filePath).toLowerCase().slice(1),
        size_bytes: stat.size,
        sha256: hash,
        ...classifyFontFilename(filePath),
        warnings: [
          ...(stat.size === 0 ? ['empty_file'] : []),
          ...(path.basename(filePath).toLowerCase().includes('copy') ? ['possible_duplicate_copy'] : []),
        ],
      };
    });
}
