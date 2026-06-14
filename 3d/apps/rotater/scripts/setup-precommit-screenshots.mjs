#!/usr/bin/env node
/**
 * Setup pre-commit hook for screenshots
 * Usage: node scripts/setup-precommit-screenshots.mjs [--remove]
 * 
 * This creates a git pre-commit hook that runs responsive screenshots
 * before each commit (when UI files change).
 */

import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { chmod } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = join(__dirname, '..');
const gitHooksDir = join(appDir, '.git', 'hooks');
const preCommitHook = join(gitHooksDir, 'pre-commit');

const hookContent = `#!/bin/bash
# Rotater pre-commit hook - capture responsive screenshots on UI changes

# Check if any CSS or HTML files were modified
CHANGED_FILES=\$(git diff --cached --name-only)
HAS_UI_CHANGES=\$(echo "\$CHANGED_FILES" | grep -E '\\.(css|html|js)$' || true)

if [ -z "\$HAS_UI_CHANGES" ]; then
  exit 0
fi

# Run screenshot capture with app states
echo "📸 Capturing responsive screenshots..."
node scripts/screenshots.mjs --states

if [ \$? -ne 0 ]; then
  echo "⚠️  Screenshot capture failed (non-blocking)"
fi

exit 0
`;

async function setup() {
  const remove = process.argv.includes('--remove');
  
  try {
    if (remove) {
      try {
        await fs.unlink(preCommitHook);
        console.log('✓ Pre-commit hook removed');
      } catch (_) {
        console.log('ℹ️  Hook not found (already removed)');
      }
      return;
    }

    // Ensure .git/hooks directory exists
    try {
      await fs.mkdir(gitHooksDir, { recursive: true });
    } catch (_) {}

    // Write the hook
    await fs.writeFile(preCommitHook, hookContent, 'utf8');
    
    // Make it executable
    await chmod(preCommitHook, 0o755);
    
    console.log('✓ Pre-commit hook installed');
    console.log('  Runs: npm run shots -- --states');
    console.log('  Triggers on: .css, .html, .js changes');
    console.log('  Remove with: npm run remove:precommit-screenshots');
  } catch (error) {
    console.error('✗ Failed to setup pre-commit hook:', error.message);
    process.exit(1);
  }
}

setup();
