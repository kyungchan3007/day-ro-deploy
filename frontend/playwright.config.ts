import { defineConfig, devices } from "@playwright/test";

const e2eBaseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const reuseExistingServer = process.env.E2E_REUSE_SERVER === "1" && !process.env.CI;

export default defineConfig({
  testDir: "./src/e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
  },
  webServer: {
    command: "node src/e2e/support/dev-with-mock-backend.mjs",
    url: e2eBaseUrl,
    reuseExistingServer,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
