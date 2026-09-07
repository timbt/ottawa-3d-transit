import { describe, expect, it } from "vitest";
import type { FillLayerSpecification, LineLayerSpecification } from "@maplibre/maplibre-gl-style-spec";
import { BUILDING_HEIGHT, resolveTilesUrl, toBuildingExtrusion } from "./map-style";

describe("toBuildingExtrusion", () => {
  const buildingsFillLayer: FillLayerSpecification = {
    id: "buildings",
    type: "fill",
    source: "basemap",
    "source-layer": "buildings",
    filter: ["in", "kind", "building", "building_part"],
    paint: { "fill-color": "#e0e0e0", "fill-opacity": 0.5 },
  };

  it("swaps the buildings fill layer for a fill-extrusion, preserving source/source-layer/filter", () => {
    const result = toBuildingExtrusion(buildingsFillLayer, "#abcdef");

    expect(result).toEqual({
      id: "buildings",
      type: "fill-extrusion",
      source: "basemap",
      "source-layer": "buildings",
      filter: ["in", "kind", "building", "building_part"],
      paint: {
        "fill-extrusion-color": "#abcdef",
        "fill-extrusion-height": BUILDING_HEIGHT,
        "fill-extrusion-opacity": 0.8,
      },
    });
  });

  it("leaves other fill layers unchanged", () => {
    const waterLayer: FillLayerSpecification = {
      id: "water",
      type: "fill",
      source: "basemap",
      "source-layer": "water",
      paint: { "fill-color": "#a3a3a3" },
    };

    expect(toBuildingExtrusion(waterLayer, "#abcdef")).toBe(waterLayer);
  });

  it("leaves a non-fill layer named 'buildings' unchanged", () => {
    // Guards against a hypothetical future theme layer sharing the id but
    // not actually being the fill layer this transform is meant to replace.
    const buildingsLineLayer: LineLayerSpecification = {
      id: "buildings",
      type: "line",
      source: "basemap",
      "source-layer": "buildings",
      paint: { "line-color": "#000000" },
    };

    expect(toBuildingExtrusion(buildingsLineLayer, "#abcdef")).toBe(buildingsLineLayer);
  });
});

describe("resolveTilesUrl", () => {
  it("builds a pmtiles URL under the given base when set", () => {
    expect(resolveTilesUrl("https://pub-example.r2.dev")).toBe("https://pub-example.r2.dev/ottawa.pmtiles");
  });

  it("falls back to the local path when unset", () => {
    expect(resolveTilesUrl(undefined)).toBe("/tiles/ottawa.pmtiles");
  });

  it("falls back to the local path for an empty string, not an empty base URL", () => {
    expect(resolveTilesUrl("")).toBe("/tiles/ottawa.pmtiles");
  });
});
