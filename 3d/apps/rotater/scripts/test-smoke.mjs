#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function assertFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) fail(`Missing file: ${relPath}`);
  pass(`Found ${relPath}`);
  return full;
}

function checkJson(relPath) {
  const full = assertFile(relPath);
  try {
    JSON.parse(fs.readFileSync(full, 'utf8'));
    pass(`Valid JSON: ${relPath}`);
  } catch (err) {
    fail(`Invalid JSON in ${relPath}: ${err.message}`);
  }
}

function checkNodeSyntax(relPath) {
  const full = assertFile(relPath);
  try {
    execFileSync(process.execPath, ['--check', full], { stdio: 'pipe' });
    pass(`Syntax OK: ${relPath}`);
  } catch (err) {
    const stderr = err?.stderr?.toString?.() || err.message;
    fail(`Syntax check failed for ${relPath}: ${stderr}`);
  }
}

function expectSubstring(relPath, needle) {
  const full = assertFile(relPath);
  const content = fs.readFileSync(full, 'utf8');
  if (!content.includes(needle)) fail(`Expected '${needle}' in ${relPath}`);
  pass(`Found '${needle}' in ${relPath}`);
}

console.log('Running Rotater smoke checks...');

assertFile('index.html');
assertFile('script.js');
assertFile('shade-system.js');
assertFile('style.css');

checkJson('color-rules.json');
checkJson('presets.json');

checkNodeSyntax('script.js');
checkNodeSyntax('shade-system.js');
checkNodeSyntax('scripts/bump-build.mjs');
checkNodeSyntax('scripts/setup-precommit-smoke.mjs');

expectSubstring('index.html', 'id="btnResetEverything"');
expectSubstring('index.html', 'id="btnLoadBenchy"');
expectSubstring('index.html', 'id="exportFormat"');
expectSubstring('script.js', 'function resetEverything()');
expectSubstring('script.js', 'function restoreSettings()');
expectSubstring('script.js', 'function saveSettings()');

console.log('All smoke checks passed.');
