import { defineConfig } from "@playwright/test";

// Runs against the built site in test mode (no Supabase, canned coaching reply). Start: npm run build first.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:8788",
    launchOptions: { executablePath: process.env.PW_EXE || "/opt/pw-browsers/chromium" },
    viewport: { width: 1366, height: 900 },
  },
  webServer: {
    command: "npx wrangler pages dev dist --port 8788 --binding AUTH_MODE=test --binding COACH_FAKE=1",
    url: "http://localhost:8788/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
