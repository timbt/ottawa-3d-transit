import type {
  ExpressionSpecification,
  FillExtrusionLayerSpecification,
  LayerSpecification,
} from "@maplibre/maplibre-gl-style-spec";

// OSM-tagged building height in meters, from the "buildings" source-layer
// (see docs/map-tiles.md — decoded via a scratch MVT inspection, not every
// feature has one). Falls back to a flat 6m (~2 storeys) guess where it's
// missing, rather than leaving those buildings invisible at height 0.
export const BUILDING_HEIGHT: ExpressionSpecification = ["coalesce", ["get", "height"], 6];

/**
 * Swaps @protomaps/basemaps' flat, 50%-opacity "buildings" fill layer for a
 * fill-extrusion using the same filter/source — reusing the given color
 * (the theme's own GRAYSCALE.buildings, in practice) rather than a
 * hand-picked one. Every other layer passes through unchanged.
 */
export function toBuildingExtrusion(layer: LayerSpecification, buildingColor: string): LayerSpecification {
  if (layer.id !== "buildings" || layer.type !== "fill") return layer;
  const extrusion: FillExtrusionLayerSpecification = {
    id: layer.id,
    type: "fill-extrusion",
    source: layer.source,
    "source-layer": layer["source-layer"],
    filter: layer.filter,
    paint: {
      "fill-extrusion-color": buildingColor,
      "fill-extrusion-height": BUILDING_HEIGHT,
      "fill-extrusion-opacity": 0.8,
    },
  };
  return extrusion;
}

/**
 * Where the app fetches map tiles from — Cloudflare R2 once
 * NEXT_PUBLIC_TILES_BASE_URL is set (production, or a dev machine that's
 * gone through the R2 setup — see docs/map-tiles.md), falling back to the
 * file scripts/fetch-map-tiles.sh writes locally otherwise, so a fresh
 * clone can still run the app with just that script and no cloud
 * credentials at all.
 */
export function resolveTilesUrl(baseUrl: string | undefined): string {
  return baseUrl ? `${baseUrl}/ottawa.pmtiles` : "/tiles/ottawa.pmtiles";
}
