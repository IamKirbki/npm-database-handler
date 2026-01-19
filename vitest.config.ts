import tsConfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsConfigPaths()],
  test: {
    ui: true,
    globals: true,
    environment: 'node',
    include: [
      './packages/**/src/__tests__/**/*.test.ts',
      './packages/**/__tests__/**/*.test.ts',
      './__tests__/**/*.test.ts',
    ],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        './packages/core/src/index.ts',
        '**/*.d.ts',
        'dist/**',
        'node_modules/**',
      ],
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './packages/core/src'),
    },
  },
});
