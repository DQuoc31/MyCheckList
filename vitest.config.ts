import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@mychecklist/shared': path.resolve(__dirname, 'packages/shared/src/index.ts')
    }
  },
  test: {
    include: ['**/src/**/__tests__/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**']
  }
});
