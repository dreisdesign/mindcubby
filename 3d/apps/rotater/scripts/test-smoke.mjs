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
assertFile('modules/shade-system.js');
assertFile('style.css');
assertFile('modules/stl-parse-worker.js');
assertFile('modules/model-picker-floating.js');
assertFile('modules/model-edit-commit.js');
assertFile('modules/settings-url-sync.js');
assertFile('modules/upload-action-controller.js');
assertFile('modules/upload-choice-ui.js');
assertFile('modules/export-collapsed-confirm.js');
assertFile('modules/export-collapsed-summary.js');
assertFile('modules/export-labels.js');
assertFile('modules/export-workspace.js');
assertFile('modules/export-transparency-sync.js');
assertFile('modules/export-panel-state.js');
assertFile('modules/export-motion-labels.js');
assertFile('modules/export-estimate.js');
assertFile('modules/export-format-sync.js');
assertFile('modules/export-preview-details.js');
assertFile('modules/desktop-v2-rail-layout.js');
assertFile('modules/export-preview-activity.js');
assertFile('modules/export-preview-scene-state.js');
assertFile('modules/export-preview-timing.js');
assertFile('modules/export-preview-transparency.js');
assertFile('modules/export-preview-dimensions.js');
assertFile('modules/export-preview-camera.js');
assertFile('modules/export-preview-render-target.js');

checkJson('color-rules.json');
checkJson('presets.json');

checkNodeSyntax('script.js');
checkNodeSyntax('modules/shade-system.js');
checkNodeSyntax('modules/stl-parse-worker.js');
checkNodeSyntax('modules/model-picker-floating.js');
checkNodeSyntax('modules/model-edit-commit.js');
checkNodeSyntax('modules/settings-url-sync.js');
checkNodeSyntax('modules/upload-action-controller.js');
checkNodeSyntax('modules/upload-choice-ui.js');
checkNodeSyntax('modules/export-collapsed-confirm.js');
checkNodeSyntax('modules/export-collapsed-summary.js');
checkNodeSyntax('modules/export-labels.js');
checkNodeSyntax('modules/export-workspace.js');
checkNodeSyntax('modules/export-transparency-sync.js');
checkNodeSyntax('modules/export-panel-state.js');
checkNodeSyntax('modules/export-motion-labels.js');
checkNodeSyntax('modules/export-estimate.js');
checkNodeSyntax('modules/export-format-sync.js');
checkNodeSyntax('modules/export-preview-details.js');
checkNodeSyntax('modules/desktop-v2-rail-layout.js');
checkNodeSyntax('modules/export-preview-activity.js');
checkNodeSyntax('modules/export-preview-scene-state.js');
checkNodeSyntax('modules/export-preview-timing.js');
checkNodeSyntax('modules/export-preview-transparency.js');
checkNodeSyntax('modules/export-preview-dimensions.js');
checkNodeSyntax('modules/export-preview-camera.js');
checkNodeSyntax('modules/export-preview-render-target.js');
checkNodeSyntax('scripts/bump-build.mjs');
checkNodeSyntax('scripts/setup-precommit-smoke.mjs');
checkCompileSyntax('script.js');
checkCompileSyntax('modules/shade-system.js');
checkCompileSyntax('modules/model-edit-commit.js');
checkCompileSyntax('modules/settings-url-sync.js');
checkCompileSyntax('modules/upload-action-controller.js');
checkCompileSyntax('modules/upload-choice-ui.js');
checkCompileSyntax('modules/export-collapsed-confirm.js');
checkCompileSyntax('modules/export-collapsed-summary.js');
checkCompileSyntax('modules/export-labels.js');
checkCompileSyntax('modules/export-workspace.js');
checkCompileSyntax('modules/export-transparency-sync.js');
checkCompileSyntax('modules/export-panel-state.js');
checkCompileSyntax('modules/export-motion-labels.js');
checkCompileSyntax('modules/export-estimate.js');
checkCompileSyntax('modules/export-format-sync.js');
checkCompileSyntax('modules/export-preview-details.js');
checkCompileSyntax('modules/desktop-v2-rail-layout.js');
checkCompileSyntax('modules/export-preview-activity.js');
checkCompileSyntax('modules/export-preview-scene-state.js');
checkCompileSyntax('modules/export-preview-timing.js');
checkCompileSyntax('modules/export-preview-transparency.js');
checkCompileSyntax('modules/export-preview-dimensions.js');
checkCompileSyntax('modules/export-preview-camera.js');
checkCompileSyntax('modules/export-preview-render-target.js');

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
