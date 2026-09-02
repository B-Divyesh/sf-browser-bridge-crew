import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  ],
  webServer: [
    {
      command: 'PORT=8787 DB_PATH=:memory: node backend/server.mjs',
      url: 'http://127.0.0.1:8787/health',
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'VITE_REALTIME_URL=ws://127.0.0.1:8787 npm run build && npm run preview -- --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
