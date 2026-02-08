#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { fileURLToPath } from 'url';

const SUPABASE_URL = 'https://wcegdxhvgwbeskaidlxr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZWdkeGh2Z3diZXNrYWlkbHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MjI3OTQsImV4cCI6MjA4NTA5ODc5NH0.P_JY0RF6wVdPCDfWLlcor5l1CP3g4bLE5y4JWmZVOig';

const args = process.argv.slice(2);
const command = args[0];
const targetFont = args[1];

if (!command) {
    console.log(chalk.yellow('Usage: npx nobadfonts add <font-name>'));
    process.exit(1);
}

if (command === 'add') {
    if (!targetFont) {
        console.log(chalk.red('Please specify a font name. Example: npx nobadfonts add "Inter"'));
        process.exit(1);
    }
    addFont(targetFont);
} else if (command === 'list') {
    listFonts();
} else {
    console.log(chalk.red(`Unknown command: ${command}`));
    console.log(chalk.yellow('Available commands: add <font>, list'));
    process.exit(1);
}

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
        console.log('\nTo install: ' + chalk.yellow('npx nobadfonts-cli add "Font Name"'));

    } catch (e) {
        spinner.fail('Error fetching fonts: ' + e.message);
    }
}

async function addFont(fontName) {
    const spinner = ora(`Searching for font: ${fontName}...`).start();

    try {
        // Search for font by name or slug
        const searchUrl = `${SUPABASE_URL}/rest/v1/fonts?or=(name.ilike.*${fontName}*,slug.ilike.*${fontName}*)&select=*,font_variants(*)&limit=1`;

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
            return;
        }

        const font = data[0];
        spinner.succeed(chalk.green(`Found font: ${font.name}`));

        // download files
        const downloadDir = path.join(process.cwd(), 'public', 'fonts', font.slug);
        await fs.ensureDir(downloadDir);

        const cssContent = [];
        const cssPath = path.join(process.cwd(), 'src', 'index.css'); // Default assumption, maybe configure later? Or creates dedicated file.
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

        // Check if file exists to append or create
        // If we append, we check if font-family is already defined to avoid duplicates?
        // For simplicity, just append.

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
