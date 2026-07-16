#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const removeMode = process.argv.includes('--remove');

function log(msg) {
  console.log(msg);
}

function getRepoRoot() {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function resolveRotaterPath(repoRoot) {
  const candidates = [
    path.join(repoRoot, '3d/apps/rotater'),
    path.join(repoRoot, 'rotater'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
  }
  throw new Error('Could not locate rotater/package.json from repo root.');
}

function installHook(repoRoot, rotaterPath) {
  const hooksDir = path.join(repoRoot, '.git', 'hooks');
  const hookPath = path.join(hooksDir, 'pre-commit');
  const relRotater = path.relative(repoRoot, rotaterPath).replaceAll('\\\\', '/');

  fs.mkdirSync(hooksDir, { recursive: true });
  const script = `#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"

# Only run checks if rotater files are staged
if ! git diff --cached --name-only | grep -q '^3d/apps/rotater/'; then
  exit 0
fi

cd "$ROOT/${relRotater}"
echo "[pre-commit] Rotater smoke checks"
npm run -s test:smoke
`;

  fs.writeFileSync(hookPath, script, 'utf8');
  fs.chmodSync(hookPath, 0o755);
  log(`Installed pre-commit hook at ${hookPath}`);
  log('This hook only runs fast Rotater smoke checks.');
}

function removeHook(repoRoot) {
  const hookPath = path.join(repoRoot, '.git', 'hooks', 'pre-commit');
  if (!fs.existsSync(hookPath)) {
    log('No pre-commit hook found. Nothing to remove.');
    return;
  }
  fs.unlinkSync(hookPath);
  log(`Removed pre-commit hook at ${hookPath}`);
}

try {
  const repoRoot = getRepoRoot();
  if (removeMode) {
    removeHook(repoRoot);
    process.exit(0);
  }

  const rotaterPath = resolveRotaterPath(repoRoot);
  installHook(repoRoot, rotaterPath);
} catch (err) {
  console.error(`Failed to configure pre-commit smoke hook: ${err.message}`);
  process.exit(1);
}
