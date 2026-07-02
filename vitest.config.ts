import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

// Test runner config is kept separate from vite.config.ts so the production
// build stays free of test-only settings. Coverage thresholds encode the
// Assignment 4 quality gate: each critical module must keep >=30% line coverage.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/types.ts',
      ],
      // Critical modules: recognition matching and game logic.
      // Global numbers stay low because canvas/voice UI is hard to unit test;
      // the gate that matters is the per-file floor on critical logic.
      thresholds: {
        'src/utils.ts': { lines: 30 },
        'src/voice/engine.ts': { lines: 30 },
        'src/gameLogic.ts': { lines: 30 },
      },
    },
  },
});
