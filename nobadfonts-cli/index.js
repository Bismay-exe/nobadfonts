#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { fileURLToPath } from 'url';


import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const args = process.argv.slice(2);
const command = args[0];
const targetFonts = args.slice(1);

if (!command) {
    console.log(chalk.yellow('Usage: npx nobadfonts <command> <font-name> [font-name-2] ...'));
    console.log(chalk.yellow('Commands:'));
    console.log(chalk.yellow('  add <fonts...>       Import fonts via CSS (Lightweight)'));
    console.log(chalk.yellow('  download <fonts...>  Download font files locally'));
    console.log(chalk.yellow('  list                 List available fonts'));
    process.exit(1);
}

// Wrap main logic in async IIFE to use await
(async () => {
    if (command === 'add') {
        if (targetFonts.length === 0) {
            console.log(chalk.red('Please specify at least one font name. Example: npx nobadfonts add "Inter" "Roboto"'));
            process.exit(1);
        }
        for (const font of targetFonts) {
            await addFont(font);
        }
    } else if (command === 'download') {
        if (targetFonts.length === 0) {
            console.log(chalk.red('Please specify at least one font name. Example: npx nobadfonts download "Inter" "Roboto"'));
            process.exit(1);
        }
        for (const font of targetFonts) {
            await downloadFont(font);
        }
    } else if (command === 'list') {
        await listFonts();
    } else {
        console.log(chalk.red(`Unknown command: ${command}`));
        console.log(chalk.yellow('Available commands: add, download, list'));
        process.exit(1);
    }
})();

async function listFonts() {
    const spinner = ora('Fetching available fonts...').start();
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/fonts?select=name,category,tags&limit=50&order=downloads.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        spinner.stop();

        console.log(chalk.bold.cyan('\nAvailable Fonts (Top 50):'));
        data.forEach(f => {
            const categories = f.tags && f.tags.length > 0 ? f.tags.join(', ') : f.category;
            console.log(`${chalk.green('•')} ${chalk.white(f.name)} ${chalk.gray(`(${categories})`)}`);
        });
        console.log('\nTo install (CSS Import): ' + chalk.yellow('npx nobadfonts-cli add "Font Name"'));
        console.log('To download (Local Files): ' + chalk.yellow('npx nobadfonts-cli download "Font Name"'));

    } catch (e) {
        spinner.fail('Error fetching fonts: ' + e.message);
    }
}

async function getFontData(fontName, spinner) {
    // Search for font by name or slug (Exact case-insensitive match)
    const searchUrl = `${SUPABASE_URL}/rest/v1/fonts?or=(slug.ilike.${fontName},name.ilike.${fontName})&select=*,font_variants(*)&limit=1`;

    const response = await fetch(searchUrl, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch font data: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
        spinner.fail(chalk.red(`Font "${fontName}" not found.`));
        return null;
    }

    const font = data[0];
    spinner.succeed(chalk.green(`Found font: ${font.name}`));
    return font;
}

// New lightweight add command (CSS Import)
async function addFont(fontName) {
    const spinner = ora(`Searching for font: ${fontName}...`).start();

    try {
        const font = await getFontData(fontName, spinner);
        if (!font) return;

        const outputCssPath = path.join(process.cwd(), 'src', 'fonts.css');

        // Ensure fonts.css exists
        if (!(await fs.pathExists(outputCssPath))) {
            await fs.outputFile(outputCssPath, '');
        }

        let existingCss = await fs.readFile(outputCssPath, 'utf8');

        // Check if already imported
        if (existingCss.includes(`/css/${font.slug}`)) {
            spinner.info(chalk.yellow(`Font "${font.name}" is already imported in src/fonts.css`));
            return;
        }

        spinner.start('Updating src/fonts.css...');

        const importLine = `@import url("https://www.nobadfonts.in/css/${font.slug}");`;
        const themeBlock = `
@theme {
  --font-${font.slug}: "${font.name}", sans-serif;
}
`;
        // Prepend import, Append theme config (roughly)
        // Actually, to keep it valid (imports at top), we need to carefully insert.
        // Simple strategy: 
        // 1. Gather existing imports.
        // 2. Gather existing theme blocks or other CSS.
        // 3. Reconstruct.

        // OR simply prepend the import to the string and append the theme block?
        // But if there are other rules at top, prepending works for imports.
        // But we want to avoid putting import after @theme.

        // Let's just prepend the import line to the very top.
        // And append the theme block to the end.
        // This assumes the user hasn't put other non-import rules at the very top (like @tailwind).
        // If they have @tailwind at top, our import needs to be BEFORE it.

        const newContent = `${importLine}\n${existingCss}${themeBlock}`;

        await fs.outputFile(outputCssPath, newContent);

        spinner.succeed(chalk.green(`Imported "${font.name}" to src/fonts.css`));
        console.log(chalk.blue(`\nSuccess! To use the font:`));
        console.log(chalk.cyan(`1. In CSS: font-family: var(--font-${font.slug});`));
        console.log(chalk.cyan(`2. In Tailwind: class="font-${font.slug}"`));
        console.log(chalk.gray(`(Make sure './fonts.css' is imported in your main CSS file)`));

    } catch (error) {
        spinner.fail(chalk.red(`Error: ${error.message}`));
    }
}

// Renamed original addFont to downloadFont
async function downloadFont(fontName) {
    const spinner = ora(`Searching for font: ${fontName}...`).start();

    try {
        const font = await getFontData(fontName, spinner);
        if (!font) return;

        // download files
        const downloadDir = path.join(process.cwd(), 'public', 'fonts', font.slug);
        await fs.ensureDir(downloadDir);

        const cssContent = [];
        // const cssPath = path.join(process.cwd(), 'src', 'index.css'); 
        let imports = '';

        // Function to download file
        const downloadFile = async (url, filename) => {
            if (!url) return null;
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Failed to download ${url}`);
                const buffer = await res.buffer();
                const filePath = path.join(downloadDir, filename);
                await fs.writeFile(filePath, buffer);
                return filePath;
            } catch (e) {
                console.error(chalk.red(`Error downloading ${filename}: ${e.message}`));
                return null;
            }
        };

        spinner.start('Downloading font files...');

        // Download Main Font
        // We prefer woff2 -> woff -> ttf -> otf
        const mainFiles = [
            { url: font.woff2_url, name: `${font.slug}.woff2`, format: 'woff2' },
            { url: font.woff_url, name: `${font.slug}.woff`, format: 'woff' },
            { url: font.ttf_url, name: `${font.slug}.ttf`, format: 'truetype' },
            { url: font.otf_url, name: `${font.slug}.otf`, format: 'opentype' }
        ];

        let mainFileDownloaded = false;
        let mainCssSrc = [];

        // Prioritize formats for main font
        for (const f of mainFiles) {
            if (f.url) {
                await downloadFile(f.url, f.name);
                mainCssSrc.push(`url('/fonts/${font.slug}/${f.name}') format('${f.format}')`);
                mainFileDownloaded = true;
            }
        }

        if (mainFileDownloaded) {
            // Only add main variant if "regular" is NOT present in variants to avoid duplicates
            const hasRegular = font.font_variants && font.font_variants.some(v => v.variant_name.toLowerCase().includes('regular'));
            if (!hasRegular) {
                cssContent.push(`
@font-face {
  font-family: '${font.name}';
  src: ${mainCssSrc.join(',\n       ')};
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
        `);
            }
        }

        // Download Variants
        if (font.font_variants && font.font_variants.length > 0) {
            // Sort variants by weight
            const sortedVariants = font.font_variants.sort((a, b) => {
                const getWeight = (name) => {
                    const n = name.toLowerCase();
                    if (n.includes('thin')) return 100;
                    if (n.includes('extra light') || n.includes('extralight')) return 200;
                    if (n.includes('light')) return 300;
                    if (n.includes('regular')) return 400;
                    if (n.includes('medium')) return 500;
                    if (n.includes('semi bold') || n.includes('semibold')) return 600;
                    if (n.includes('extra bold') || n.includes('extrabold')) return 800;
                    if (n.includes('bold')) return 700;
                    if (n.includes('black')) return 900;
                    return 400; // default
                };
                return getWeight(a.variant_name) - getWeight(b.variant_name);
            });

            for (const variant of sortedVariants) {
                const vFiles = [
                    { url: variant.woff2_url, name: `${font.slug}-${variant.variant_name}.woff2`, format: 'woff2' },
                    { url: variant.woff_url, name: `${font.slug}-${variant.variant_name}.woff`, format: 'woff' },
                    { url: variant.ttf_url, name: `${font.slug}-${variant.variant_name}.ttf`, format: 'truetype' },
                    { url: variant.otf_url, name: `${font.slug}-${variant.variant_name}.otf`, format: 'opentype' }
                ];

                let vCssSrc = [];
                // Determine weight/style from name (simple heuristic)
                let weight = 400;
                let style = 'normal';
                const nameLower = variant.variant_name.toLowerCase();

                if (nameLower.includes('thin')) weight = 100;
                else if (nameLower.includes('extra light') || nameLower.includes('extralight')) weight = 200;
                else if (nameLower.includes('light')) weight = 300;
                else if (nameLower.includes('regular')) weight = 400;
                else if (nameLower.includes('medium')) weight = 500;
                else if (nameLower.includes('semi bold') || nameLower.includes('semibold')) weight = 600;
                else if (nameLower.includes('extra bold') || nameLower.includes('extrabold')) weight = 800;
                else if (nameLower.includes('bold')) weight = 700;
                else if (nameLower.includes('black')) weight = 900;

                if (nameLower.includes('italic')) style = 'italic';

                for (const f of vFiles) {
                    if (f.url) {
                        await downloadFile(f.url, f.name);
                        vCssSrc.push(`url('/fonts/${font.slug}/${f.name}') format('${f.format}')`);
                    }
                }

                if (vCssSrc.length > 0) {
                    cssContent.push(`
@font-face {
  font-family: '${font.name}';
  src: ${vCssSrc.join(',\n       ')};
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}
                `);
                }
            }
        }

        spinner.succeed('Files downloaded successfully.');

        // Write CSS
        // Create specific CSS file
        const outputCssPath = path.join(process.cwd(), 'src', 'fonts.css');

        spinner.start('Updating CSS...');

        let existingCss = '';
        if (await fs.pathExists(outputCssPath)) {
            existingCss = await fs.readFile(outputCssPath, 'utf8');
        }

        const newCssBlock = ` 
/* Font: ${font.name} (Added via NoBadFonts CLI) */
${cssContent.join('\n')}

@theme {
  --font-${font.slug}: "${font.name}", sans-serif;
}
    `;

        if (!existingCss.includes(`Font: ${font.name}`)) {
            await fs.outputFile(outputCssPath, existingCss + newCssBlock);
            spinner.succeed(chalk.green(`Updated src/fonts.css with @font-face definitions and @theme variable.`));
            console.log(chalk.blue(`\nSuccess! To use the font:`));
            console.log(chalk.cyan(`1. In CSS: font-family: var(--font-${font.slug});`));
            console.log(chalk.cyan(`2. In Tailwind: class="font-${font.slug}"`));
            console.log(chalk.gray(`(Make sure to import './fonts.css' in your src/index.css or main execution file)`));
        } else {
            spinner.info(chalk.yellow(`Font ${font.name} definitions already exist in src/fonts.css`));
        }

    } catch (error) {
        spinner.fail(chalk.red(`Error: ${error.message}`));
    }
}
