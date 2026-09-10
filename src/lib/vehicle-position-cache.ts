import { fetchVehiclePositions, type VehiclePositionsCollection } from "./octranspo";

const EMPTY_COLLECTION: VehiclePositionsCollection = { type: "FeatureCollection", features: [] };

// Rate at which to re-poll OC Transpo for API updates
const POLL_INTERVAL_MS = 20_000;

export interface VehicleCacheState {
  data: VehiclePositionsCollection;
  // null until the very first successful poll completes.
  updatedAt: number | null;
}

let state: VehicleCacheState = { data: EMPTY_COLLECTION, updatedAt: null };
let started = false;

export function getVehiclePositions(): VehicleCacheState {
  return state;
}

// One refresh attempt. `fetch` is injectable (defaulting to the real
// network call) purely so this is unit-testable without mocking modules —
// see vehicle-position-cache.test.ts.
export async function pollOnce(
  fetch: () => Promise<VehiclePositionsCollection> = fetchVehiclePositions,
): Promise<void> {
  try {
    const data = await fetch();
    state = { data, updatedAt: Date.now() };
  } catch (error) {
    console.error("Failed to refresh OC Transpo vehicle positions; keeping last known data.", error);
  }
}

// Called once from instrumentation.ts's register() hook when the server
// boots. Guarded against being started twice — belt-and-suspenders in case
// register() ever fires more than once in some environment.
export function startVehiclePositionPolling(): void {
  if (started) return;
  started = true;

  void pollOnce(); // fire immediately so the cache isn't empty for a full interval after boot
  setInterval(pollOnce, POLL_INTERVAL_MS);
}
