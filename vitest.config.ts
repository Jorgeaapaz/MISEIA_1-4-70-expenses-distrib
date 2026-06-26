import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'app/**/*.ts'],
      exclude: [
        'app/api/**',
        'node_modules/**',
        '**/*.d.ts',
        '__tests__/**',
      ],
      thresholds: {
        lines: 40,
        functions: 40,
      },
    },
  },
});
