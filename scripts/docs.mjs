import { execSync } from 'node:child_process';

console.log('Generating documentation...');

try {
  execSync('npx typedoc --out docs/api src --exclude "**/*.test.ts" --exclude "**/*.test.tsx"', {
    stdio: 'inherit',
  });
} catch (error) {
  console.error('Documentation generation failed:', error.message);
  process.exit(1);
}

console.log('Documentation generated in docs/api');
