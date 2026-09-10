import { fetchVehiclePositions, type VehiclePositionsCollection } from "./octranspo";

const EMPTY_COLLECTION: VehiclePositionsCollection = { type: "FeatureCollection", features: [] };

// Rate at which to re-poll OC Transpo for API updates
const POLL_INTERVAL_MS = 20_000;

export interface VehicleCacheState {
  data: VehiclePositionsCollection;
  // null until the very first successful poll completes.
  updatedAt: number | null;
}

// Next.js can compile this module into more than one separately-bundled
// copy (e.g. one reached from instrumentation.ts's poller, another from a
// route handler's own bundle), each with its own independent module scope.
// State lives on globalThis, not a module-level variable, so every copy
// shares the same underlying cache — same pattern as `window.__mapLoaded`
// in Map.tsx, on the server side instead of the browser.
declare global {
  var __vehiclePositionCache: VehicleCacheState | undefined;
  var __vehiclePositionPollingStarted: boolean | undefined;
}

function getState(): VehicleCacheState {
  globalThis.__vehiclePositionCache ??= { data: EMPTY_COLLECTION, updatedAt: null };
  return globalThis.__vehiclePositionCache;
}

export function getVehiclePositions(): VehicleCacheState {
  return getState();
}

// One refresh attempt. `fetch` is injectable (defaulting to the real
// network call) purely so this is unit-testable without mocking modules —
// see vehicle-position-cache.test.ts.
export async function pollOnce(
  fetch: () => Promise<VehiclePositionsCollection> = fetchVehiclePositions,
): Promise<void> {
  try {
    const data = await fetch();
    globalThis.__vehiclePositionCache = { data, updatedAt: Date.now() };
  } catch (error) {
    console.error("Failed to refresh OC Transpo vehicle positions; keeping last known data.", error);
  }
}

// Called once from instrumentation.ts's register() hook when the server
// boots. Guarded against being started twice — belt-and-suspenders in case
// register() ever fires more than once in some environment.
export function startVehiclePositionPolling(): void {
  if (globalThis.__vehiclePositionPollingStarted) return;
  globalThis.__vehiclePositionPollingStarted = true;

  // Without a key, every poll would fail identically forever — rather than
  // schedule an interval guaranteed to keep failing (and log an error every
  // 20s indefinitely), log once and leave the cache at its empty default.
  // Expected in CI and on a fresh clone without OC Transpo credentials
  // configured — mirrors how the R2 tile URL falls back gracefully rather
  // than erroring when unset.
  if (!process.env.OCTRANSPO_API_PRIMARY_KEY) {
    console.warn("OCTRANSPO_API_PRIMARY_KEY is not set — vehicle position polling disabled; the map will show no live buses.");
    return;
  }

  void pollOnce(); // fire immediately so the cache isn't empty for a full interval after boot
  setInterval(pollOnce, POLL_INTERVAL_MS);
}
