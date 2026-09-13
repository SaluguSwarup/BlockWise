import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * One test runner for the whole repo (R7): packages/**, backend/** and scripts/** run under
 * plain Node; src/** (the React frontend) runs under jsdom. See docs/workflow.md.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    environmentMatchGlobs: [['src/**', 'jsdom']],
    include: [
      'packages/**/test/**/*.test.js',
      'backend/**/test/**/*.test.js',
      'src/**/test/**/*.test.{js,jsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
