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

function stripEsmSyntaxForCompile(source) {
  return source
    .replace(/^\s*import\s+[^;]+;\s*$/gm, '')
    .replace(/\bimport\.meta\b/g, '({})')
    .replace(/^\s*export\s+default\s+/gm, '')
    .replace(/^\s*export\s+(?=(async\s+)?function|const\s+|let\s+|var\s+|class\s+)/gm, '')
    .replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, '');
}

function checkCompileSyntax(relPath) {
  const full = assertFile(relPath);
  try {
    const source = fs.readFileSync(full, 'utf8');
    const compileSource = stripEsmSyntaxForCompile(source);
    // Compile only; do not execute. This catches malformed token structure reliably.
    new Function(compileSource);
    pass(`Compile syntax OK: ${relPath}`);
  } catch (err) {
    fail(`Compile syntax failed for ${relPath}: ${err.message}`);
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
assertFile('modules/stl-parse-worker.js');
assertFile('modules/model-picker-floating.js');

checkJson('color-rules.json');
checkJson('presets.json');

checkNodeSyntax('script.js');
checkNodeSyntax('shade-system.js');
checkNodeSyntax('modules/stl-parse-worker.js');
checkNodeSyntax('modules/model-picker-floating.js');
checkNodeSyntax('scripts/bump-build.mjs');
checkNodeSyntax('scripts/setup-precommit-smoke.mjs');
checkCompileSyntax('script.js');
checkCompileSyntax('shade-system.js');

expectSubstring('index.html', 'id="btnResetEverything"');
expectSubstring('index.html', 'id="btnClearBuildPlate"');
expectSubstring('index.html', 'id="btnLoadBenchy"');
expectSubstring('index.html', 'id="exportFormat"');
expectSubstring('index.html', 'data-copy-link-label');
expectSubstring('script.js', 'function resetEverything()');
expectSubstring('script.js', 'async function clearBuildPlateModels()');
expectSubstring('script.js', 'function restoreSettings()');
expectSubstring('script.js', 'function saveSettings()');
expectSubstring('script.js', 'const IMPORT_STL_LIMITS = {');
expectSubstring('script.js', 'const EXPORT_GUARD_LIMITS = {');
expectSubstring('script.js', 'maxCompressionRatio');
expectSubstring('script.js', 'function validateExportWorkload(');
expectSubstring('script.js', 'function getExportCapabilityMultiplier(');
expectSubstring('script.js', 'async function parseStlItemsWithWorker(');
expectSubstring('script.js', 'async function parseSingleStlGeometry(');
expectSubstring('script.js', 'async function parseMultipartStlGeometries(');

console.log('All smoke checks passed.');
