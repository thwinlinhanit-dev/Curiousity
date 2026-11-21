import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 60_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  use: { baseURL: "http://localhost:5173", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "tablet", use: { ...devices["iPad (gen 7)"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
    { name: "mobile-320", use: { ...devices["iPhone 13"], viewport: { width: 320, height: 700 } } },
  ],
  webServer: { command: "npm run dev -- --host 127.0.0.1 --port 5173", url: "http://127.0.0.1:5173", reuseExistingServer: true, timeout: 180_000 },
});
