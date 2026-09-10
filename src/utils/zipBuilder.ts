/**
 * Pure TypeScript, zero-dependency client-side ZIP archive builder.
 * Generates standard PKZip 2.0 archives compatible with Windows Explorer, macOS Finder, Linux, and mobile OSes.
 */

import type { Font } from '../types/font';

export interface ZipFileItem {
    name: string;
    data: Uint8Array;
}

// CRC-32 Lookup Table (IEEE 802.3 standard)
const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c >>> 0;
    }
    return table;
})();

/**
 * Computes the 32-bit CRC checksum for a byte array.
 */
export function computeCrc32(bytes: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
        crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Creates a standard .zip archive Blob from a list of files.
 */
export function buildZipBlob(files: ZipFileItem[]): Blob {
    const encoder = new TextEncoder();
    const now = new Date();
    
    // MS-DOS Date & Time representation
    const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (Math.floor(now.getSeconds() / 2))) & 0xFFFF;
    const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;

    const fileEntries: {
        nameBytes: Uint8Array;
        dataBytes: Uint8Array;
        crc: number;
        offset: number;
    }[] = [];

    const localParts: Uint8Array[] = [];
    let currentOffset = 0;

    for (const file of files) {
        const nameBytes = encoder.encode(file.name);
        const dataBytes = file.data;
        const crc = computeCrc32(dataBytes);
        const offset = currentOffset;

        // Local file header (30 bytes + name length)
        const localHeader = new Uint8Array(30 + nameBytes.length);
        const view = new DataView(localHeader.buffer);

        view.setUint32(0, 0x04034B50, true);       // Local file header signature
        view.setUint16(4, 20, true);               // Version needed (2.0)
        view.setUint16(6, 0x0800, true);           // General purpose bit flag (Bit 11: UTF-8)
        view.setUint16(8, 0, true);                // Compression method: 0 (Stored / uncompressed)
        view.setUint16(10, dosTime, true);         // File last modification time
        view.setUint16(12, dosDate, true);         // File last modification date
        view.setUint32(14, crc, true);             // CRC-32
        view.setUint32(18, dataBytes.length, true);// Compressed size
        view.setUint32(22, dataBytes.length, true);// Uncompressed size
        view.setUint16(26, nameBytes.length, true);// File name length
        view.setUint16(28, 0, true);               // Extra field length

        localHeader.set(nameBytes, 30);

        localParts.push(localHeader);
        localParts.push(dataBytes);

        currentOffset += localHeader.length + dataBytes.length;

        fileEntries.push({
            nameBytes,
            dataBytes,
            crc,
            offset,
        });
    }

    // Central Directory
    const centralDirectoryParts: Uint8Array[] = [];
    const centralDirOffset = currentOffset;
    let centralDirSize = 0;

    for (const entry of fileEntries) {
        // Central directory header (46 bytes + name length)
        const cdHeader = new Uint8Array(46 + entry.nameBytes.length);
        const view = new DataView(cdHeader.buffer);

        view.setUint32(0, 0x02014B50, true);            // Central directory header signature
        view.setUint16(4, 20, true);                    // Version made by (2.0)
        view.setUint16(6, 20, true);                    // Version needed to extract (2.0)
        view.setUint16(8, 0x0800, true);                // General purpose bit flag (Bit 11: UTF-8)
        view.setUint16(10, 0, true);                    // Compression method: 0
        view.setUint16(12, dosTime, true);              // File modification time
        view.setUint16(14, dosDate, true);              // File modification date
        view.setUint32(16, entry.crc, true);            // CRC-32
        view.setUint32(20, entry.dataBytes.length, true);// Compressed size
        view.setUint32(24, entry.dataBytes.length, true);// Uncompressed size
        view.setUint16(28, entry.nameBytes.length, true);// File name length
        view.setUint16(30, 0, true);                    // Extra field length
        view.setUint16(32, 0, true);                    // File comment length
        view.setUint16(34, 0, true);                    // Disk number where file starts
        view.setUint16(36, 0, true);                    // Internal file attributes
        view.setUint32(38, 0, true);                    // External file attributes
        view.setUint32(42, entry.offset, true);         // Relative offset of local header

        cdHeader.set(entry.nameBytes, 46);

        centralDirectoryParts.push(cdHeader);
        centralDirSize += cdHeader.length;
    }

    // End of Central Directory Record (22 bytes)
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);

    eocdView.setUint32(0, 0x06054B50, true);          // End of central directory signature
    eocdView.setUint16(4, 0, true);                   // Number of this disk
    eocdView.setUint16(6, 0, true);                   // Disk where central directory starts
    eocdView.setUint16(8, fileEntries.length, true);  // Number of central directory records on this disk
    eocdView.setUint16(10, fileEntries.length, true); // Total number of central directory records
    eocdView.setUint32(12, centralDirSize, true);     // Size of central directory
    eocdView.setUint32(16, centralDirOffset, true);   // Offset of start of central directory
    eocdView.setUint16(20, 0, true);                  // ZIP comment length

    // Cast to BlobPart[]: in TypeScript 5.7+, Uint8Array defaults to Uint8Array<ArrayBufferLike>
    // (which includes SharedArrayBuffer), whereas BlobPart requires Uint8Array<ArrayBuffer>.
    // All arrays generated here are backed by standard ArrayBuffers.
    const fullBlobParts: BlobPart[] = [
        ...localParts,
        ...centralDirectoryParts,
        eocd
    ] as unknown as BlobPart[];

    return new Blob(fullBlobParts, { type: 'application/zip' });
}

/**
 * Generates tailored LICENSE.txt text for the downloaded font.
 */
export function generateFontLicense(font: Partial<Font>): string {
    const fontName = font.name || 'Untitled Font';
    const designer = font.designer || 'Unknown Designer';
    const licenseType = font.license_type || 'SIL Open Font License (OFL 1.1)';
    const year = new Date().getFullYear();
    const fontSlug = font.slug || (font.name ? font.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '') || font.id || '';

    if (licenseType.toLowerCase().includes('ofl') || licenseType.toLowerCase().includes('open font')) {
        return `--------------------------------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
--------------------------------------------------------------------------------

Font Name: ${fontName}
Copyright (c) ${year}, ${designer}.
Distributed via NoBadFonts (https://nobadfonts.in)

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide development
of collaborative font projects, to support the font creation efforts of academic
and linguistic communities, and to provide a free and open framework in which
fonts may be shared and improved in partnership with others.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining a copy
of the Font Software, to use, study, copy, merge, embed, modify, redistribute,
and sell modified and unmodified copies of the Font Software, subject to the
following conditions:

1) Neither the Font Software nor any of its individual components, in Original
or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy contains
the above copyright notice and this license.

3) No Modified Version of the Font Software may use the Reserved Font Name(s)
unless explicit written permission is granted by the corresponding Copyright
Holder. This restriction only applies to the primary font name as presented
to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font Software
shall not be used to promote, endorse or advertise any Modified Version,
except to acknowledge the contribution(s) of the Copyright Holder(s) and the
Author(s) or with their explicit written permission.

5) The Font Software, modified or unmodified, in part or in whole, must be
distributed entirely under this license, and must not be distributed under any
other license. The requirement for fonts to remain under this license does not
apply to any document created using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF COPYRIGHT, PATENT,
TRADEMARK, OR OTHER RIGHT.
`;
    }

    if (licenseType.toLowerCase().includes('personal')) {
        return `--------------------------------------------------------------------------------
PERSONAL USE ONLY LICENSE
--------------------------------------------------------------------------------

Font Name: ${fontName}
Designer: ${designer}
Distributed via NoBadFonts (https://nobadfonts.in)

TERMS & CONDITIONS:
1. This font is provided free of charge for PERSONAL, NON-COMMERCIAL purposes only.
2. You may use this font for private personal projects, school work, home crafting,
   and non-commercial portfolio demonstrations.
3. COMMERCIAL USE IS STRICTLY PROHIBITED without purchasing a commercial license
   from the original copyright holder (${designer}).
4. You may NOT resell, redistribute, sub-license, or repackage this font file.

If you wish to use this font commercially, please visit https://nobadfonts.in/fonts/${fontSlug}
to view the designer's website or contact details.
`;
    }

    if (licenseType.toLowerCase().includes('public domain') || licenseType.toLowerCase().includes('100% free')) {
        return `--------------------------------------------------------------------------------
100% FREE / PUBLIC DOMAIN (CC0)
--------------------------------------------------------------------------------

Font Name: ${fontName}
Designer: ${designer}
Distributed via NoBadFonts (https://nobadfonts.in)

To the extent possible under law, the creator has dedicated all copyright
and related and neighboring rights to this font to the public domain worldwide.

You can copy, modify, distribute and perform the work, even for commercial
purposes, all without asking permission.
`;
    }

    // Default Fallback
    return `--------------------------------------------------------------------------------
FONT LICENSE & TERMS OF USE
--------------------------------------------------------------------------------

Font Name: ${fontName}
Designer: ${designer}
License Category: ${licenseType}
Distributed via NoBadFonts (https://nobadfonts.in)

Please respect the rights of typography creators. For details regarding the specific
permissions and licensing terms of this font, refer to:
https://nobadfonts.in/fonts/${fontSlug}
`;
}

/**
 * Generates formatted README.txt for the downloaded font package.
 */
export function generateFontReadme(font: Partial<Font>): string {
    const fontName = font.name || 'Untitled Font';
    const designer = font.designer || 'Unknown Designer';
    const year = new Date().getFullYear();
    const fontSlug = font.slug || (font.name ? font.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '') || font.id || '';

    return `================================================================================
${fontName.toUpperCase()}
Created by ${designer}
Downloaded from NoBadFonts — https://nobadfonts.in/fonts/${fontSlug}
================================================================================

Thank you for downloading ${fontName}!
NoBadFonts is a curated digital typography archive dedicated to high-quality,
accessible, and beautifully crafted typefaces for creators worldwide.

---

PACKAGE CONTENTS:
• Font binary files (.ttf, .otf, and/or .woff2)
• LICENSE.txt — Terms and conditions of font usage
• README.txt — Instructions & font details

---

INSTALLATION INSTRUCTIONS:

▶ WINDOWS:
1. Extract the .zip archive to a folder of your choice.
2. Right-click on the font file (.ttf or .otf) and select "Install" or "Install for all users".
3. The font is now accessible in all applications (Adobe Creative Cloud, Figma, Word, etc.).

▶ MACOS:
1. Double-click the .zip file to extract its contents.
2. Double-click the font file (.ttf or .otf).
3. In the Font Book preview window that appears, click "Install Font".

▶ LINUX:
1. Extract the font files to ~/.local/share/fonts/ (for current user) or /usr/local/share/fonts/ (system-wide).
2. Refresh your system font cache by running:
   fc-cache -f -v

▶ WEB EMBEDDING (WOFF2):
If this package contains .woff2 files, you can use them in your CSS:
@font-face {
  font-family: '${fontName}';
  src: url('${fontName}.woff2') format('woff2');
  font-display: swap;
}

---

SUPPORT & COMMUNITY:
• Font Page & Updates: https://nobadfonts.in/fonts/${fontSlug}
• Discover more fonts: https://nobadfonts.in/fonts
• Font Pairings & Inspiration: https://nobadfonts.in/pairing
• Submit your own font: https://nobadfonts.in/upload
• Copyright / DMCA: dmca@nobadfonts.in

(C) ${year} NoBadFonts & ${designer}. All rights reserved.
`;
}

/**
 * Downloads a remote font binary as a Uint8Array.
 */
async function fetchBinary(url: string): Promise<Uint8Array | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
    } catch (err) {
        console.warn(`Failed to fetch binary from ${url}:`, err);
        return null;
    }
}

/**
 * Assembles and packages all font variants and documentation into a ZIP archive.
 */
export async function createFontZipPackage(
    font: Font,
    onProgress?: (msg: string) => void
): Promise<Blob> {
    const encoder = new TextEncoder();
    const items: ZipFileItem[] = [];

    onProgress?.('Fetching font files...');

    // Collect all candidate files
    const fileTargets: { name: string; url: string }[] = [];

    // Check primary font URLs
    const safeFontName = font.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (font.woff2_url) fileTargets.push({ name: `${safeFontName}.woff2`, url: font.woff2_url });
    if (font.ttf_url) fileTargets.push({ name: `${safeFontName}.ttf`, url: font.ttf_url });
    if (font.otf_url) fileTargets.push({ name: `${safeFontName}.otf`, url: font.otf_url });
    if (font.woff_url) fileTargets.push({ name: `${safeFontName}.woff`, url: font.woff_url });

    // Check variants
    if (font.font_variants && font.font_variants.length > 0) {
        for (const v of font.font_variants) {
            const vName = (v.variant_name || 'Regular').replace(/[^a-zA-Z0-9_-]/g, '_');
            if (v.woff2_url) fileTargets.push({ name: `${safeFontName}-${vName}.woff2`, url: v.woff2_url });
            if (v.ttf_url) fileTargets.push({ name: `${safeFontName}-${vName}.ttf`, url: v.ttf_url });
            if (v.otf_url) fileTargets.push({ name: `${safeFontName}-${vName}.otf`, url: v.otf_url });
            if (v.woff_url) fileTargets.push({ name: `${safeFontName}-${vName}.woff`, url: v.woff_url });
        }
    }

    // Deduplicate by URL and file name
    const seenUrls = new Set<string>();
    const seenNames = new Set<string>();
    const uniqueTargets = fileTargets.filter(t => {
        if (!t.url || seenUrls.has(t.url) || seenNames.has(t.name)) return false;
        seenUrls.add(t.url);
        seenNames.add(t.name);
        return true;
    });

    // Fetch all files
    for (let i = 0; i < uniqueTargets.length; i++) {
        const target = uniqueTargets[i];
        onProgress?.(`Downloading ${target.name} (${i + 1}/${uniqueTargets.length})...`);
        const bytes = await fetchBinary(target.url);
        if (bytes) {
            items.push({ name: target.name, data: bytes });
        }
    }

    onProgress?.('Generating documentation & license...');

    // Add LICENSE.txt
    const licenseText = generateFontLicense(font);
    items.push({
        name: 'LICENSE.txt',
        data: encoder.encode(licenseText),
    });

    // Add README.txt
    const readmeText = generateFontReadme(font);
    items.push({
        name: 'README.txt',
        data: encoder.encode(readmeText),
    });

    onProgress?.('Compressing ZIP archive...');
    return buildZipBlob(items);
}

/**
 * Triggers a client-side download for a given Blob.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}
