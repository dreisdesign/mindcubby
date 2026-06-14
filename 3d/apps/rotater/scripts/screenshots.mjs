#!/usr/bin/env node
/**
 * Take responsive screenshots at multiple viewports and states
 * Usage: node scripts/screenshots.mjs [--baseUrl http://localhost:8000] [--states]
 * 
 * States captured:
 * - default (sidebar visible)
 * - export-open (export panel visible)
 * - sidebar-collapsed (settings panel collapsed)
 * - crop-mode (crop overlay active)
 * 
 * Output: .screenshots/ directory with timestamped folders
 */

import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = join(__dirname, '..');
const screenshotsDir = join(appDir, '.screenshots');

const baseUrl = process.argv.find(arg => arg.startsWith('--baseUrl='))?.split('=')[1] || 'http://localhost:8000';
const captureStates = process.argv.includes('--states');

const viewports = [
  { name: 'mobile-375', width: 375, height: 812, label: 'Mobile (375px)' },
  { name: 'tablet-768', width: 768, height: 1024, label: 'Tablet (768px)' },
  { name: 'desktop-1440', width: 1440, height: 900, label: 'Desktop (1440px)' },
];

const states = [
  { name: 'default', label: 'Default', prepare: null },
  { name: 'export-open', label: 'Export Panel Open', prepare: async (page) => {
    await page.click('button:has-text("Export")').catch(() => {});
    await page.waitForTimeout(300);
  }},
  { name: 'sidebar-collapsed', label: 'Sidebar Collapsed', prepare: async (page) => {
    // Look for collapse/toggle button - adjust selector based on your UI
    await page.click('[class*="collapse"], [class*="toggle"]').catch(() => {});
    await page.waitForTimeout(300);
  }},
];

async function takeScreenshots() {
  // Create timestamped directory
  const timestamp = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const shotDir = join(screenshotsDir, `${timestamp}-${time}`);
  
  try {
    await fs.mkdir(shotDir, { recursive: true });
  } catch (e) {
    console.error('Failed to create directory:', e);
    process.exit(1);
  }

  console.log(`📸 Taking responsive screenshots at ${baseUrl}`);
  if (captureStates) console.log(`📋 Capturing app states: default, export, sidebar`);
  console.log(`💾 Output: ${shotDir}\n`);

  const browser = await chromium.launch();
  let success = 0;

  const statesToCapture = captureStates ? states : [states[0]]; // default only if not --states

  try {
    for (const state of statesToCapture) {
      console.log(`\n🔄 State: ${state.label}`);
      
      for (const viewport of viewports) {
        try {
          const page = await browser.newPage({ viewport });
          
          // Load the page
          await page.goto(baseUrl, { waitUntil: 'networkidle' });
          await page.waitForTimeout(500);
          
          // Apply state changes if needed
          if (state.prepare) {
            await state.prepare(page);
          }
          
          const filename = `${state.name}--${viewport.name}.png`;
          const filepath = join(shotDir, filename);
          await page.screenshot({ path: filepath, fullPage: false });
          
          console.log(`  ✓ ${viewport.label} → ${filename}`);
          success++;
          
          await page.close();
        } catch (error) {
          console.error(`  ✗ ${viewport.name} failed:`, error.message);
        }
      }
    }
  } finally {
    await browser.close();
  }

  const totalExpected = statesToCapture.length * viewports.length;
  console.log(`\n✅ Captured ${success}/${totalExpected} screenshots`);
  console.log(`📁 Open: open "${shotDir}"\n`);

  // Create an index file for quick comparison
  const stateGroups = statesToCapture.map(state => {
    const rows = viewports.map(vp => {
      const filename = `${state.name}--${vp.name}.png`;
      return `
    <div class="shot">
      <img src="${filename}" alt="${state.label} - ${vp.label}">
      <div class="shot-label">${vp.label}</div>
    </div>
      `;
    }).join('');
    return `
    <div class="state-group">
      <h2>${state.label}</h2>
      <div class="shots">
        ${rows}
      </div>
    </div>
    `;
  }).join('');

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rotater Screenshots - ${timestamp}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
      margin: 20px; 
      background: #f5f5f5; 
      color: #333;
    }
    h1 { color: #1f2937; margin-bottom: 8px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
    h2 { 
      font-size: 18px; 
      margin-top: 32px; 
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .state-group { margin-bottom: 40px; }
    .shots { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); 
      gap: 16px; 
    }
    .shot { 
      background: white; 
      border-radius: 8px; 
      overflow: hidden; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .shot:hover { transform: scale(1.02); }
    .shot img { width: 100%; display: block; }
    .shot-label { 
      padding: 12px; 
      font-size: 13px; 
      color: #666; 
      font-weight: 500; 
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>🎬 Rotater Responsive Screenshots</h1>
  <div class="meta">
    <strong>Captured:</strong> ${new Date().toLocaleString()}
    ${captureStates ? '<br><strong>States:</strong> Multiple' : '<br><strong>State:</strong> Default'}
  </div>
  ${stateGroups}
</body>
</html>`;

  await fs.writeFile(join(shotDir, 'index.html'), indexHtml);
  console.log(`📖 View: open "${join(shotDir, 'index.html')}"`);
}

takeScreenshots().catch(err => {
  console.error('Screenshot failed:', err);
  process.exit(1);
});
