import { expect, test } from "@playwright/test";

// Checks the map genuinely renders — not just that a canvas element exists,
// which could be true on a fully blank map. MapLibre's own "load" event
// (surfaced here as window.__mapLoaded, set by Map.tsx's onLoad — see
// there) only fires once the style and the initial viewport's tiles have
// actually loaded, which is what every real bug in this project so far
// (the Turbopack worker issue, the R2 CORS misconfiguration) would have
// broken. Runs against e2e/fixtures/test-tile.pmtiles, not real Ottawa
// data or R2 — see playwright.config.ts and scripts/setup-e2e-fixture.mjs.
test("map loads without errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await page.goto("/");

  await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();

  await page.waitForFunction(() => window.__mapLoaded === true, { timeout: 15_000 });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
