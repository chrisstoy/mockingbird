import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';

import { workspaceRoot } from '@nx/devkit';

const baseURL = process.env['PLAYWRIGHT_BASE_URL'] || 'http://localhost:3000';
const isRemote = !!process.env['PLAYWRIGHT_BASE_URL'];

// Prevent real emails from being sent during tests.
// Resend treats keys starting with "re_test_" as test mode (accepted but not delivered).
process.env['RESEND_API_KEY'] = 're_test_mockingbird_playwright';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  // Only start the local dev server when not targeting a remote URL
  webServer: isRemote
    ? undefined
    : {
        command: 'npx nx dev mockingbird',
        url: 'http://localhost:3000/api/health',
        reuseExistingServer: true,
        cwd: workspaceRoot,
        env: { RESEND_API_KEY: 're_test_mockingbird_playwright' },
      },
  projects: [
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});
