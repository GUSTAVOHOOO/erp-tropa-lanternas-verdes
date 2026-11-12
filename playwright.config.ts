import { defineConfig } from '@playwright/test'

const baseURL = 'http://127.0.0.1:32123'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL, browserName: 'chromium', headless: true },
  webServer: {
    command: 'npm run start -- --hostname 127.0.0.1 --port 32123',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ...process.env, API_URL: 'http://127.0.0.1:32124' },
  },
})
