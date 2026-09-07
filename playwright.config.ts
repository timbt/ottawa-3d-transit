import { defineConfig, devices } from "@playwright/test";

// Deliberately production-mode (build + start), not `next dev` — Next's own
// testing guide recommends this ("more closely resemble how your
// application will behave"), and it's what Render actually runs.
//
// NEXT_PUBLIC_TILES_BASE_URL is explicitly forced empty for the *build*
// step (not just left unset) so this reliably uses the local fallback
// path/fixture regardless of what's in a developer's own .env.local (e.g.
// pointing at real R2) — an explicit shell env var wins over .env.local in
// Next's load order. It's a client-side var inlined at build time, so
// `next start` doesn't need it repeated — nothing reads it at runtime.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node scripts/setup-e2e-fixture.mjs && NEXT_PUBLIC_TILES_BASE_URL= pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
