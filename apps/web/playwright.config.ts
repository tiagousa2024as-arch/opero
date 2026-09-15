import { existsSync } from "fs";
import { defineConfig, devices } from "@playwright/test";

// This repo pins a specific @playwright/test version; some sandboxed dev
// environments pre-install a Chromium build under a fixed path instead of
// letting `npx playwright install` fetch one matching that pin. When that
// path exists, use it directly (with --no-sandbox, since such environments
// commonly run as root) — everywhere else (CI, a contributor's machine)
// this stays undefined and Playwright resolves its own managed browser.
const sandboxChrome = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const launchOptions = existsSync(sandboxChrome)
  ? { executablePath: sandboxChrome, args: ["--no-sandbox"] }
  : undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "retain-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npx next start -p 3100",
        url: "http://localhost:3100",
        reuseExistingServer: true,
        timeout: 60_000,
      },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions } },
    { name: "mobile", use: { viewport: { width: 375, height: 812 }, launchOptions } },
  ],
});
