// Runs once when the server boots, before it handles any requests. Starts
// the OC Transpo vehicle-position poller — see
// src/lib/vehicle-position-cache.ts for the polling logic itself.
//
// register() can run in either the Node.js or Edge runtime; this app
// doesn't use Edge for anything, but the guard costs nothing.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startVehiclePositionPolling } = await import("@/lib/vehicle-position-cache");
    startVehiclePositionPolling();
  }
}
