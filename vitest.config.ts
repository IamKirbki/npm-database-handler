import tsConfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsConfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/__tests__/**/*.test.ts'],
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
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './packages/core/src'),
    }
  }
});
