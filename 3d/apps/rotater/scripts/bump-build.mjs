#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const indexPath = path.join(ROOT, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('index.html not found in current directory. Run this from 3d/apps/rotater.');
  process.exit(1);
}

const argVersion = process.argv[2];
const now = new Date();
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const computedDate = `${monthNames[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')}, ${now.getFullYear()}`;

const file = fs.readFileSync(indexPath, 'utf8');
const match = file.match(/const ROTATER_BUILD = '([0-9]+\.[0-9]+\.[0-9]+)'/);
if (!match && !argVersion) {
  console.error('Could not detect current ROTATER_BUILD and no version argument was provided.');
  process.exit(1);
}

const nextVersion = argVersion || match[1];

let updated = file;
updated = updated.replace(/const ROTATER_BUILD = '[0-9]+\.[0-9]+\.[0-9]+';/, `const ROTATER_BUILD = '${nextVersion}';`);
updated = updated.replace(/const ROTATER_BUILD_DATE = '[^']+';/, `const ROTATER_BUILD_DATE = '${computedDate}';`);
updated = updated.replace(/<span id="infoBuildVersion">Build [^<]+<\/span>/, `<span id="infoBuildVersion">Build ${nextVersion}</span>`);
updated = updated.replace(/<span id="infoBuildDate">Updated [^<]+<\/span>/, `<span id="infoBuildDate">Updated ${computedDate}</span>`);

if (updated === file) {
  console.error('No changes made. Check index.html format.');
  process.exit(1);
}

fs.writeFileSync(indexPath, updated, 'utf8');
console.log(`Updated build metadata: ${nextVersion} (${computedDate})`);
console.log('Next: update CHANGELOG, then commit and push.');
