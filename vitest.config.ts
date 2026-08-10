import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function defaultCacheDir(): string {
  const dir = 'node_modules/.vite';
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    return dir;
  } catch {
    return '/tmp/vite-cache';
  }
}

export default defineConfig({
  plugins: [react()],
  cacheDir: process.env.VITE_CACHE_DIR ?? defaultCacheDir(),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './assets'),
      '@db': path.resolve(__dirname, './database'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    pool: 'forks',
    cache: process.env.CI ? false : undefined,
    fileParallelism: process.env.CI ? false : undefined,
  },
});
