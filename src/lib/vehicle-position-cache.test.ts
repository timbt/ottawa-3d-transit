import { beforeEach, describe, expect, it, vi } from "vitest";
import { getVehiclePositions, pollOnce } from "./vehicle-position-cache";
import type { VehiclePositionsCollection } from "./octranspo";

// getVehiclePositions()/pollOnce() share module-level state, so each test
// needs its own known starting point rather than inheriting whatever the
// previous test left behind.
async function resetToKnownState(): Promise<void> {
  const empty: VehiclePositionsCollection = { type: "FeatureCollection", features: [] };
  await pollOnce(() => Promise.resolve(empty));
}

describe("pollOnce", () => {
  beforeEach(resetToKnownState);

  it("updates the cache on a successful fetch", async () => {
    const data: VehiclePositionsCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [-75.7, 45.4] },
          properties: { id: "1", bearing: null, speed: null, routeId: null, tripId: null, timestamp: null },
        },
      ],
    };

    const before = Date.now();
    await pollOnce(() => Promise.resolve(data));
    const state = getVehiclePositions();

    expect(state.data).toEqual(data);
    expect(state.updatedAt).not.toBeNull();
    expect(state.updatedAt as number).toBeGreaterThanOrEqual(before);
  });

  it("keeps the previous data and logs, rather than throwing, when the fetch fails", async () => {
    const data: VehiclePositionsCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [-75.7, 45.4] },
          properties: { id: "1", bearing: null, speed: null, routeId: null, tripId: null, timestamp: null },
        },
      ],
    };
    await pollOnce(() => Promise.resolve(data));
    const stateBefore = getVehiclePositions();

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(pollOnce(() => Promise.reject(new Error("network down")))).resolves.toBeUndefined();

    expect(getVehiclePositions()).toEqual(stateBefore);
    expect(errorSpy).toHaveBeenCalledOnce();
    errorSpy.mockRestore();
  });
});
