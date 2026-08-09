import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
  },
  webServer: [
    {
      command: 'npm start',
      url: 'http://localhost:4200',
      reuseExistingServer: !process.env['CI'],
      timeout: 60_000,
    },
    {
      command: 'npm run start:dev',
      cwd: '../back',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env['CI'],
      timeout: 60_000,
    },
  ],
});
