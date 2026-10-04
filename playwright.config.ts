import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the browser-level end-to-end suite.
 *
 * Quick start (the dependency and its browser are installed on demand):
 *   npm install -D @playwright/test
 *   npx playwright install chromium
 *   npm run test:e2e            # or: npm run test:e2e:ui
 *
 * The suite boots the Vite dev server itself; set `E2E_BASE_URL` to run the
 * specs against an already deployed preview/production URL instead.
 */

const PORT = 5173;
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 7_500 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${PORT} --host 127.0.0.1 --strictPort`,
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
