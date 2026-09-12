import { describe, expect, it } from "vitest";
import { busFootprint } from "./bus-footprint";

const OTTAWA_LAT = 45.4215;
const OTTAWA_LON = -75.6972;
const METERS_PER_DEGREE_LAT = 111_320;

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
