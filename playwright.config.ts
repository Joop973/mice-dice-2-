import { defineConfig, devices } from '@playwright/test';

// E2E-Konfiguration. Startet den Vite-Dev-Server und prüft die App im echten
// Browser. Hinweis: Die Browser-Binärdateien müssen einmalig via
// `npx playwright install chromium` geladen werden (in Sandboxes ohne Zugriff auf
// cdn.playwright.dev nicht möglich — dann in CI/lokal ausführen).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
