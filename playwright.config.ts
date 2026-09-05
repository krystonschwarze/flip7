import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:3107", trace: "retain-on-failure" },
  projects: [
    {
      name: "iphone-webkit",
      use: { ...devices["iPhone 13"], browserName: "webkit" },
    },
    {
      name: "small-iphone-webkit",
      use: { ...devices["iPhone SE"], browserName: "webkit" },
    },
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: {
    command: "npm run start -- --listen 3107",
    port: 3107,
    reuseExistingServer: !process.env.CI,
  },
});
