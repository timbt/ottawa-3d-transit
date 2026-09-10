import { getVehiclePositions } from "@/lib/vehicle-position-cache";
import type { VehiclePositionsResponse } from "@/lib/octranspo";

// Serves whatever's currently in the in-memory cache (see
// src/lib/vehicle-position-cache.ts) — never calls OC Transpo itself, so
// this responds instantly regardless of upstream latency. `updatedAt` is
// spread in as an extra top-level field alongside GeoJSON's own `type`/
// `features` — RFC 7946 explicitly allows foreign members like this, and
// MapLibre's GeoJSON source ignores anything it doesn't recognize, so the
// response is directly usable as source data with no unwrapping, while
// still carrying staleness info (null until the first successful poll).
export async function GET() {
  const { data, updatedAt } = getVehiclePositions();
  const response: VehiclePositionsResponse = { ...data, updatedAt };
  return Response.json(response, { headers: { "Cache-Control": "no-store" } });
}
