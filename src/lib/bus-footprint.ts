import type { Polygon } from "geojson";

// Typical OC Transpo 40ft conventional bus. The API has no per-vehicle
// length/type data (see octranspo-api-research memory), so every vehicle
// gets this one approximation.
const BUS_LENGTH_METERS = 12.2;
const BUS_WIDTH_METERS = 2.6;

const METERS_PER_DEGREE_LAT = 111_320;
const DEG_TO_RAD = Math.PI / 180;

function metersPerDegreeLon(latitude: number): number {
  return METERS_PER_DEGREE_LAT * Math.cos(latitude * DEG_TO_RAD);
}

/**
 * Rectangular footprint for a bus centered on (longitude, latitude), sized
 * to a typical 40ft bus and rotated to face bearingDegrees (compass degrees
 * clockwise from north, matching GTFS-RT's Position.bearing). Converts
 * metre offsets to degrees via a flat equirectangular approximation --
 * accurate at the scale of one vehicle, not meant for anything geodesic.
 */
export function busFootprint(longitude: number, latitude: number, bearingDegrees: number): Polygon {
  const halfLength = BUS_LENGTH_METERS / 2;
  const halfWidth = BUS_WIDTH_METERS / 2;

  // East/north metre offsets of each corner before rotation, i.e. as if the
  // bus were facing north (bearing 0).
  const corners: [number, number][] = [
    [-halfWidth, -halfLength],
    [halfWidth, -halfLength],
    [halfWidth, halfLength],
    [-halfWidth, halfLength],
  ];

  const bearingRad = bearingDegrees * DEG_TO_RAD;
  const sin = Math.sin(bearingRad);
  const cos = Math.cos(bearingRad);
  const lonScale = metersPerDegreeLon(latitude);

  const ring = corners.map(([east, north]) => {
    // Clockwise rotation from north (compass bearing convention), not the
    // counterclockwise-from-east convention standard rotation matrices use.
    const rotatedEast = east * cos + north * sin;
    const rotatedNorth = -east * sin + north * cos;
    return [longitude + rotatedEast / lonScale, latitude + rotatedNorth / METERS_PER_DEGREE_LAT];
  });
  ring.push(ring[0]);

  return { type: "Polygon", coordinates: [ring] };
}
