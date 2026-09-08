import { expect, test } from "@playwright/test";

// Verifies the recenter button's actual effect on the camera, not just that
// it's clickable. Deliberately doesn't import DEFAULT_VIEW_STATE from
// Map.tsx (that module has browser-only side effects — a CSS import,
// setWorkerUrl — that don't survive being imported into Playwright's
// Node-based test runner) and instead reads the initial camera back from
// the live page, so this test doesn't need updating if the default view
// ever changes.
test("recenter button restores the default camera", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__mapLoaded === true, { timeout: 15_000 });

  const defaultView = await page.evaluate(() => {
    const map = window.__map!;
    const center = map.getCenter();
    return { lng: center.lng, lat: center.lat, zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() };
  });

  // Move the camera away from the default view directly via the map API,
  // not a simulated drag gesture — what's under test is the recenter
  // button's effect on the camera, not the mechanics of panning.
  await page.evaluate(() => {
    window.__map!.jumpTo({ center: [-75.5, 45.3], zoom: 12, pitch: 0, bearing: 0 });
  });

  const movedView = await page.evaluate(() => window.__map!.getCenter());
  expect(movedView.lng).not.toBeCloseTo(defaultView.lng, 2);

  await page.getByRole("button", { name: /recenter/i }).click();

  // flyTo is animated (values approach the target asymptotically while
  // moving), so wait for the animation to actually finish rather than
  // polling for numeric closeness — a probe run confirmed the camera lands
  // bit-exact on the target the instant isMoving() goes false, so this is
  // both simpler and more correct than a distance threshold would be.
  await page.waitForFunction(() => window.__map!.isMoving() === false, { timeout: 5_000 });

  const restoredView = await page.evaluate(() => {
    const map = window.__map!;
    const center = map.getCenter();
    return { lng: center.lng, lat: center.lat, zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() };
  });

  expect(restoredView.lng).toBeCloseTo(defaultView.lng, 4);
  expect(restoredView.lat).toBeCloseTo(defaultView.lat, 4);
  expect(restoredView.zoom).toBeCloseTo(defaultView.zoom, 3);
  expect(restoredView.pitch).toBeCloseTo(defaultView.pitch, 3);
  expect(restoredView.bearing).toBeCloseTo(defaultView.bearing, 3);
});
