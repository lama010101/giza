import { execSync } from 'node:child_process';
import process from 'node:process';

const PROTECTED = [
  /^docs\/specs\/GIZA - 0\d.*\.md$/,
  /^docs\/specs\/GIZA - 10.*\.txt$/,
  /^docs\/specs\/GIZA - 11.*\.md$/,
  /^docs\/specs\/GIZA - 16.*\.md$/,
  /^docs\/specs\/GIZA - 17.*\.md$/,
  /^docs\/specs\/GIZA - 99.*\.md$/,
];

function isProtected(file) {
  return PROTECTED.some((pattern) => pattern.test(file));
}

const base = process.env.CI ? 'origin/master' : 'master';

let changed;
try {
  changed = execSync(`git diff --name-only ${base}...HEAD`, { encoding: 'utf-8', stdio: 'pipe' })
    .trim()
    .split('\n')
    .filter(Boolean);
} catch {
  // If there is no base branch yet (first commits), diff against the index.
  changed = execSync('git diff --name-only --cached', { encoding: 'utf-8', stdio: 'pipe' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

if (changed.length === 0) {
  console.log('governance-smoke: no changed files');
  process.exit(0);
}

const violations = changed.filter(isProtected);

if (violations.length > 0) {
  console.error('governance-smoke: the following protected specification files are modified:');
  for (const file of violations) {
    console.error(`  - ${file}`);
  }
  console.error('Numbered specifications may not be modified by a PR unless explicitly instructed.');
  process.exit(1);
}

console.log('governance-smoke: no protected specification files modified');
process.exit(0);
