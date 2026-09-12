import { describe, expect, it } from "vitest";
import { busFootprint, toVehicleDots, toVehicleFootprints } from "./bus-footprint";
import type { VehiclePositionsCollection } from "./octranspo";

const OTTAWA_LAT = 45.4215;
const OTTAWA_LON = -75.6972;
const METERS_PER_DEGREE_LAT = 111_320;

const SAMPLE_COLLECTION: VehiclePositionsCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [OTTAWA_LON, OTTAWA_LAT] },
      properties: { id: "1", bearing: 45, speed: 10, routeId: "95", tripId: "trip-1", timestamp: 1000 },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [OTTAWA_LON, OTTAWA_LAT] },
      properties: { id: "2", bearing: null, speed: null, routeId: null, tripId: null, timestamp: null },
    },
  ],
};

function metersPerDegreeLon(latitude: number): number {
  return METERS_PER_DEGREE_LAT * Math.cos((latitude * Math.PI) / 180);
}

describe("busFootprint", () => {
  it("returns a closed ring", () => {
    const [ring] = busFootprint(OTTAWA_LON, OTTAWA_LAT, 0).coordinates;
    expect(ring).toHaveLength(5);
    expect(ring[0]).toEqual(ring[4]);
  });

  it("centers the footprint on the given coordinates", () => {
    const [ring] = busFootprint(OTTAWA_LON, OTTAWA_LAT, 37).coordinates;
    const corners = ring.slice(0, 4);
    const centroidLon = corners.reduce((sum, [lon]) => sum + lon, 0) / 4;
    const centroidLat = corners.reduce((sum, [, lat]) => sum + lat, 0) / 4;
    expect(centroidLon).toBeCloseTo(OTTAWA_LON, 9);
    expect(centroidLat).toBeCloseTo(OTTAWA_LAT, 9);
  });

  it("orients the long axis north-south when bearing is 0", () => {
    const [ring] = busFootprint(OTTAWA_LON, OTTAWA_LAT, 0).coordinates;
    const corners = ring.slice(0, 4);
    const latSpreadMeters =
      (Math.max(...corners.map(([, lat]) => lat)) - Math.min(...corners.map(([, lat]) => lat))) *
      METERS_PER_DEGREE_LAT;
    const lonSpreadMeters =
      (Math.max(...corners.map(([lon]) => lon)) - Math.min(...corners.map(([lon]) => lon))) *
      metersPerDegreeLon(OTTAWA_LAT);

    expect(latSpreadMeters).toBeCloseTo(12.2, 1);
    expect(lonSpreadMeters).toBeCloseTo(2.6, 1);
  });

  it("orients the long axis east-west when bearing is 90", () => {
    const [ring] = busFootprint(OTTAWA_LON, OTTAWA_LAT, 90).coordinates;
    const corners = ring.slice(0, 4);
    const latSpreadMeters =
      (Math.max(...corners.map(([, lat]) => lat)) - Math.min(...corners.map(([, lat]) => lat))) *
      METERS_PER_DEGREE_LAT;
    const lonSpreadMeters =
      (Math.max(...corners.map(([lon]) => lon)) - Math.min(...corners.map(([lon]) => lon))) *
      metersPerDegreeLon(OTTAWA_LAT);

    expect(latSpreadMeters).toBeCloseTo(2.6, 1);
    expect(lonSpreadMeters).toBeCloseTo(12.2, 1);
  });
});

describe("toVehicleFootprints", () => {
  it("keeps original properties and adds the vehicle's coordinates", () => {
    const [feature] = toVehicleFootprints(SAMPLE_COLLECTION).features;
    expect(feature.properties).toMatchObject({ id: "1", routeId: "95", longitude: OTTAWA_LON, latitude: OTTAWA_LAT });
    expect(feature.geometry.type).toBe("Polygon");
  });

  it("defaults to facing north when bearing is null", () => {
    const [, feature] = toVehicleFootprints(SAMPLE_COLLECTION).features;
    const expected = busFootprint(OTTAWA_LON, OTTAWA_LAT, 0);
    expect(feature.geometry).toEqual(expected);
  });
});

describe("toVehicleDots", () => {
  it("keeps Point geometry and adds the vehicle's coordinates to properties", () => {
    const [feature] = toVehicleDots(SAMPLE_COLLECTION).features;
    expect(feature.geometry).toEqual({ type: "Point", coordinates: [OTTAWA_LON, OTTAWA_LAT] });
    expect(feature.properties).toMatchObject({ id: "1", routeId: "95", longitude: OTTAWA_LON, latitude: OTTAWA_LAT });
  });
});
