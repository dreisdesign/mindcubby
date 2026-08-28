#!/usr/bin/env node

/**
 * Update build timestamp in spooler index.html
 * Generates timestamp in format: "Fri Aug 28 09:55 AM"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
minute: '2-digit',
    hour12: true
}).replace(',', '');

const filePath = path.join(__dirname, 'index.html');

// Read the HTML file
let content = fs.readFileSync(filePath, 'utf-8');

// Replace the build-date meta tag content
content = content.replace(
    /(<meta name="build-date" id="buildDate" content=")([^"]*)(">)/,
    `$1${date}$3`
);

// Write back
fs.writeFileSync(filePath, content, 'utf-8');

console.log(`✓ Timestamp updated: ${date}`);
