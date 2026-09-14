export type FontFormat = 'ttf' | 'otf' | 'woff' | 'woff2';

export interface ValidationResult {
    valid: boolean;
    error?: string;
    detectedFormat?: string;
    glyphCount?: number;
    familyName?: string;
}

export type FontMetadata = Record<string, string>;

const MAX_FONT_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;  // 8 MB

/**
 * Checks the initial 4 bytes of a buffer against known font signatures.
 */
function checkFontMagicBytes(header: Uint8Array): { valid: boolean; detected?: FontFormat } {
    if (header.length < 4) return { valid: false };

    const tag = String.fromCharCode(header[0], header[1], header[2], header[3]);

    // WOFF 2.0
    if (tag === 'wOF2') return { valid: true, detected: 'woff2' };

    // WOFF 1.0
    if (tag === 'wOFF') return { valid: true, detected: 'woff' };

    // OpenType with CFF outlines
    if (tag === 'OTTO') return { valid: true, detected: 'otf' };

    // TrueType outlines (0x00010000 or 'true' on classic Mac)
    if (
        (header[0] === 0x00 && header[1] === 0x01 && header[2] === 0x00 && header[3] === 0x00) ||
        tag === 'true' ||
        tag === 'typ1'
    ) {
        return { valid: true, detected: 'ttf' };
    }

    return { valid: false };
}

/**
 * Extracts the provenance-related OpenType name records used by server-side
 * research. Metadata is a search hint only; it is never treated as proof.
 */
export async function extractFontMetadata(file: File): Promise<FontMetadata> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'ttf' && extension !== 'otf' && extension !== 'woff') return {};

    try {
        const opentype = await import('opentype.js');
        const parsedFont = opentype.parse(await file.arrayBuffer());
        const names = parsedFont.names || {};
        const fields: Record<string, unknown> = {
            family: names.fontFamily,
            full_name: names.fullName,
            designer: names.designer,
            manufacturer: names.manufacturer,
            manufacturer_url: names.manufacturerURL,
            designer_url: names.designerURL,
            copyright: names.copyright,
            trademark: names.trademark,
            version: names.version,
            description: names.description,
            license: names.license,
            license_url: names.licenseURL,
        };

        return Object.fromEntries(
            Object.entries(fields).flatMap(([key, value]) => {
                const localized = value && typeof value === 'object'
                    ? (value as Record<string, unknown>).en || Object.values(value as Record<string, unknown>)[0]
                    : value;
                const text = typeof localized === 'string' ? localized.trim().slice(0, 2_000) : '';
                return text ? [[key, text]] : [];
            })
        );
    } catch (error) {
        console.warn('Could not extract OpenType metadata:', error);
        return {};
    }
}

/**
 * Validates an uploaded font file for correct extension, size limits, binary signatures,
 * and parses internal OpenType tables if applicable.
 */
export async function validateFontFile(file: File, expectedFormat: FontFormat): Promise<ValidationResult> {
    // 1. File Size Check
    if (file.size > MAX_FONT_SIZE_BYTES) {
        return {
            valid: false,
            error: `File size exceeds the 30MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`
        };
    }

    if (file.size < 100) {
        return {
            valid: false,
            error: 'File is empty or too small to be a genuine font file.'
        };
    }

    // 2. Strict Extension Whitelist
    const fileName = file.name.toLowerCase();
    const hasCorrectExt = fileName.endsWith(`.${expectedFormat}`);
    if (!hasCorrectExt) {
        return {
            valid: false,
            error: `File extension does not match the expected format (.${expectedFormat}).`
        };
    }

    // 3. Binary Magic Byte Inspection
    try {
        const headerBuffer = await file.slice(0, 4).arrayBuffer();
        const headerBytes = new Uint8Array(headerBuffer);
        const { valid: hasValidMagic, detected } = checkFontMagicBytes(headerBytes);

        if (!hasValidMagic) {
            return {
                valid: false,
                error: `Security verification failed: File signature does not match a valid font file (detected spoofed or corrupted binary).`
            };
        }

        // 4. Detailed OpenType structure parsing for TTF & OTF
        if (expectedFormat === 'ttf' || expectedFormat === 'otf') {
            try {
                const fullBuffer = await file.arrayBuffer();
                const opentype = await import('opentype.js');
                const parsedFont = opentype.parse(fullBuffer);

                if (!parsedFont || !parsedFont.tables) {
                    return {
                        valid: false,
                        error: 'Unable to parse font table directory. The font file appears corrupted.'
                    };
                }

                const glyphCount = parsedFont.numGlyphs || 0;
                const familyName = parsedFont.names?.fontFamily?.en || parsedFont.names?.fullName?.en;

                return {
                    valid: true,
                    detectedFormat: detected,
                    glyphCount,
                    familyName
                };
            } catch (err: any) {
                return {
                    valid: false,
                    error: `Font parsing error: ${err.message || 'Corrupt font internal structure.'}`
                };
            }
        }

        // WOFF and WOFF2 validated through magic bytes
        return {
            valid: true,
            detectedFormat: detected
        };

    } catch (err: any) {
        return {
            valid: false,
            error: `Failed to read file: ${err.message}`
        };
    }
}

/**
 * Validates uploaded gallery/banner raster images.
 */
export async function validateImageFile(file: File): Promise<ValidationResult> {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return {
            valid: false,
            error: `Image exceeds 8MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`
        };
    }

    const name = file.name.toLowerCase();
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];
    const hasValidExt = validExtensions.some(ext => name.endsWith(ext));

    if (!hasValidExt) {
        return {
            valid: false,
            error: 'Unsupported image format. Please upload PNG, JPG, WebP, or AVIF.'
        };
    }

    try {
        const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());

        // PNG: 89 50 4E 47
        const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;

        // JPEG: FF D8 FF
        const isJpg = header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;

        // WebP: RIFF ... WEBP
        const isWebp =
            header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
            header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50;

        // AVIF: ftypavif (usually bytes 4-11: 66 74 79 70 61 76 69 66)
        const isAvif = name.endsWith('.avif');

        if (!isPng && !isJpg && !isWebp && !isAvif) {
            return {
                valid: false,
                error: 'Security error: File signature does not match a valid image format.'
            };
        }

        return { valid: true };
    } catch (e: any) {
        return {
            valid: false,
            error: `Failed to inspect image: ${e.message}`
        };
    }
}
