import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve(process.cwd(), 'node_modules', 'react'),
      'react-dom/client': path.resolve(process.cwd(), 'node_modules', 'react-dom', 'client.js'),
      'react-dom': path.resolve(process.cwd(), 'node_modules', 'react-dom'),
    },
  },
  test: {
    environment: 'node',
    // Include all test paths
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
