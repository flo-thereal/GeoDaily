import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/api/**/*.test.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 15000,
    // These tests require the server to be running
    // Run with: npm run test:api (after starting the server)
  },
});
