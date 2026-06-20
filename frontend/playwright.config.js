import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  use: {
    baseURL: 'http://localhost:5173',
    headless: true, // Run in headless mode for faster execution and compatibility
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  // Automatically start the Vite development server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 30 * 1000, // 30 seconds timeout to start
  }
});