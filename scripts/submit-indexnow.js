
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

dotenv.config();
dotenv.config({ path: '.env.local' });

const DOMAIN = 'https://nobadfonts.in';
const KEY = process.env.INDEXNOW_KEY || 'your-indexnow-key'; // User needs to generate this
const KEY_LOCATION = process.env.INDEXNOW_KEY_LOCATION || ''; // e.g., https://nobadfonts.in/your-indexnow-key.txt

// Simple script to ping IndexNow.
// Ideally, this runs after a sitemap generation or content update.

async function submitToIndexNow() {
    console.log('Submitting to IndexNow...');

    // Read sitemap to get URLs (naïve parsing)
    const sitemapPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sitemap.xml');

    if (!fs.existsSync(sitemapPath)) {
        console.error('Sitemap not found. Generate it first.');
        return;
    }

    const xml = fs.readFileSync(sitemapPath, 'utf-8');
    const regex = /<loc>(.*?)<\/loc>/g;
    let match;
    const urls = [];

    while ((match = regex.exec(xml)) !== null) {
        urls.push(match[1]);
    }

    // IndexNow limits (e.g. 10,000 URLs). We'll take top 100 for this script demo.
    const urlsToSubmit = urls.slice(0, 100);

    if (urlsToSubmit.length === 0) {
        console.log('No URLs to submit.');
        return;
    }

    const payload = {
        host: 'nobadfonts.in',
        key: KEY,
        keyLocation: KEY_LOCATION || `https://nobadfonts.in/${KEY}.txt`,
        urlList: urlsToSubmit
    };

    try {
        await axios.post('https://api.indexnow.org/indexnow', payload, {
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
        console.log(`Successfully submitted ${urlsToSubmit.length} URLs to IndexNow.`);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('IndexNow Error:', error.response?.data || error.message);
        } else {
            console.error('IndexNow Error:', error);
        }
    }
}

submitToIndexNow();
