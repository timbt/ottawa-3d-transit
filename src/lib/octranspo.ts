import type { Feature, FeatureCollection, Point } from "geojson";

// OC Transpo's GTFS-RT Vehicle Positions feed. Buses only — OC Transpo
// doesn't publish realtime O-Train positions at all yet. JSON format, not
// the protobuf default — see https://nextrip-public-api.developer.azure-api.net/.
const VEHICLE_POSITIONS_URL =
  "https://nextrip-public-api.azure-api.net/octranspo/gtfs-rt-vp/beta/v1/VehiclePositions?format=json";

// The response is the .NET GTFS-RT bindings' JSON serialization of the
// protobuf schema — PascalCase, with a `Has<Field>` sibling boolean next to
// each optional field (a protobuf artifact: proto3 can't distinguish "unset"
// from "set to the zero value" without one). Once deserialized to JSON,
// those flags are redundant — a field we care about is either a real,
// present value or it's null/absent — so this type (and the parser below)
// checks values directly and ignores the Has* flags entirely. Only the
// fields this app actually reads are declared; the real payload has more
// (Odometer, CongestionLevel, OccupancyStatus, MultiCarriageDetails, ...).
interface RawVehiclePositionsResponse {
  Entity?: RawEntity[];
}

interface RawEntity {
  Vehicle?: {
    Vehicle?: { Id?: string | null } | null;
    Position?: {
      Latitude?: number | null;
      Longitude?: number | null;
      Bearing?: number | null;
      Speed?: number | null;
    } | null;
    Trip?: { RouteId?: string | null; TripId?: string | null } | null;
    Timestamp?: number | null;
  } | null;
}

export interface VehicleProperties {
  id: string;
  bearing: number | null;
  speed: number | null;
  routeId: string | null;
  tripId: string | null;
  timestamp: number | null;
}

export type VehiclePositionsCollection = FeatureCollection<Point, VehicleProperties>;

function isRawResponse(value: unknown): value is RawVehiclePositionsResponse {
  return typeof value === "object" && value !== null && Array.isArray((value as RawVehiclePositionsResponse).Entity);
}

// Pure — deliberately takes `unknown`, not RawVehiclePositionsResponse: this
// is untrusted external data, not something we get to assume is well-formed
// just because we wrote a type for it. Entities missing a usable position
// or vehicle id are silently skipped rather than throwing, since a handful
// of malformed entities in an otherwise-good feed shouldn't take down the
// whole map — see src/lib/octranspo.test.ts for the cases this handles.
export function parseVehiclePositions(raw: unknown): VehiclePositionsCollection {
  const entities = isRawResponse(raw) ? (raw.Entity ?? []) : [];
  const features: Feature<Point, VehicleProperties>[] = [];

  for (const entity of entities) {
    const vehicle = entity.Vehicle;
    const id = vehicle?.Vehicle?.Id;
    const lat = vehicle?.Position?.Latitude;
    const lon = vehicle?.Position?.Longitude;
    if (!vehicle || !id || typeof lat !== "number" || typeof lon !== "number") continue;

    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lon, lat] },
      properties: {
        id,
        bearing: vehicle.Position?.Bearing ?? null,
        speed: vehicle.Position?.Speed ?? null,
        routeId: vehicle.Trip?.RouteId ?? null,
        tripId: vehicle.Trip?.TripId ?? null,
        timestamp: vehicle.Timestamp ?? null,
      },
    });
  }

  return { type: "FeatureCollection", features };
}

// Impure — the network/env/auth side, kept separate from parseVehiclePositions
// so the parsing logic stays unit-testable without mocking fetch. Throws on
// any failure (missing key, network error, non-2xx, unparseable body) and
// leaves deciding what to do about that (retry, fall back to a stale cache,
// ...) to the caller — see the polling cache this feeds into.
export async function fetchVehiclePositions(): Promise<VehiclePositionsCollection> {
  const key = process.env.OCTRANSPO_API_PRIMARY_KEY;
  if (!key) throw new Error("OCTRANSPO_API_PRIMARY_KEY is not set");

  const response = await fetch(VEHICLE_POSITIONS_URL, {
    headers: { "Ocp-Apim-Subscription-Key": key },
  });
  if (!response.ok) {
    throw new Error(`OC Transpo Vehicle Positions request failed: ${response.status} ${response.statusText}`);
  }

  return parseVehiclePositions(await response.json());
}
