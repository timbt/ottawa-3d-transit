import { describe, expect, it } from "vitest";
import { parseVehiclePositions } from "./octranspo";

describe("parseVehiclePositions", () => {
  it("maps a normal, fully-populated entity to a GeoJSON Point feature", () => {
    const raw = {
      Entity: [
        {
          Vehicle: {
            Vehicle: { Id: "4850" },
            Position: { Latitude: 45.42987, Longitude: -75.62203, Bearing: 60, Speed: 2.68224 },
            Trip: { RouteId: "41", TripId: "1482040" },
            Timestamp: 1788977229,
          },
        },
      ],
    };

    expect(parseVehiclePositions(raw)).toEqual({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [-75.62203, 45.42987] },
          properties: {
            id: "4850",
            bearing: 60,
            speed: 2.68224,
            routeId: "41",
            tripId: "1482040",
            timestamp: 1788977229,
          },
        },
      ],
    });
  });

  it("fills route/trip fields with null for a vehicle with no trip assigned", () => {
    // A real, observed case (~29% of vehicles in one live pull) — a bus
    // broadcasting a position with no trip yet (deadheading, off-route,
    // pulling out of the garage, ...), not a malformed entity to discard.
    const raw = {
      Entity: [
        {
          Vehicle: {
            Vehicle: { Id: "1234" },
            Position: { Latitude: 45.4, Longitude: -75.7 },
            Trip: null,
            Timestamp: 1788977229,
          },
        },
      ],
    };

    const result = parseVehiclePositions(raw);
    expect(result.features).toHaveLength(1);
    expect(result.features[0]?.properties).toEqual({
      id: "1234",
      bearing: null,
      speed: null,
      routeId: null,
      tripId: null,
      timestamp: 1788977229,
    });
  });

  it("skips an entity with no usable position", () => {
    const raw = {
      Entity: [
        { Vehicle: { Vehicle: { Id: "1" }, Position: null, Trip: null, Timestamp: 1 } },
        { Vehicle: { Vehicle: { Id: "2" }, Position: { Latitude: null, Longitude: -75.7 }, Trip: null, Timestamp: 1 } },
      ],
    };

    expect(parseVehiclePositions(raw).features).toEqual([]);
  });

  it("skips an entity with no vehicle id", () => {
    const raw = {
      Entity: [
        { Vehicle: { Vehicle: { Id: "" }, Position: { Latitude: 45.4, Longitude: -75.7 }, Trip: null, Timestamp: 1 } },
        { Vehicle: { Vehicle: {}, Position: { Latitude: 45.4, Longitude: -75.7 }, Trip: null, Timestamp: 1 } },
      ],
    };

    expect(parseVehiclePositions(raw).features).toEqual([]);
  });

  it("returns an empty collection for malformed or unexpected input, rather than throwing", () => {
    expect(parseVehiclePositions(null)).toEqual({ type: "FeatureCollection", features: [] });
    expect(parseVehiclePositions(undefined)).toEqual({ type: "FeatureCollection", features: [] });
    expect(parseVehiclePositions({})).toEqual({ type: "FeatureCollection", features: [] });
    expect(parseVehiclePositions({ Entity: "not an array" })).toEqual({ type: "FeatureCollection", features: [] });
    expect(parseVehiclePositions("a string, not the expected object")).toEqual({
      type: "FeatureCollection",
      features: [],
    });
  });
});
