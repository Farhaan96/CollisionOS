import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Only run E2E test files, not Jest unit/integration tests
  testMatch: ['**/tests/**/*.spec.js'],
  testIgnore: [
    '**/tests/unit/**',
    '**/tests/integration/**',
    '**/tests/performance/**',
    '**/tests/**/*.test.js',
    '**/tests/**/test*.js',
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run client',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
