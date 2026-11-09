import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Separate from vite.config.ts on purpose: the build config sets `root: 'src'` for the renderer
 * bundle, but tests also cover `electron/` and live alongside their subjects, so the test root has
 * to be the repository root.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'electron/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}', 'electron/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/main.tsx', '**/*.{test,spec}.{ts,tsx}'],
    },
  },
});
