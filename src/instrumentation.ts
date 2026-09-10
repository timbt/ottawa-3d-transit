// Runs once when the server boots, before it handles any requests (see
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation,
// checked against this project's actual installed version rather than
// assumed). This is where the OC Transpo vehicle-position poller starts —
// see src/lib/vehicle-position-cache.ts for the actual polling logic.
//
// register() can technically run in either the Node.js or Edge runtime;
// this app doesn't use Edge for anything, but the guard is cheap and this
// is the pattern Next's own docs recommend for runtime-specific setup.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startVehiclePositionPolling } = await import("@/lib/vehicle-position-cache");
    startVehiclePositionPolling();
  }
}
