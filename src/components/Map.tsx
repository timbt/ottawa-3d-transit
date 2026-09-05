"use client";

import { Map as MapLibreMap } from "react-map-gl/maplibre";
import { addProtocol, setWorkerUrl } from "maplibre-gl";
import { Protocol } from "pmtiles";
import { GRAYSCALE, layers } from "@protomaps/basemaps";
import type {
  ExpressionSpecification,
  FillExtrusionLayerSpecification,
  LayerSpecification,
} from "@maplibre/maplibre-gl-style-spec";
import "maplibre-gl/dist/maplibre-gl.css";

// maplibre-gl locates its own tile-parsing worker relative to its internal
// `import.meta.url`, which isn't a real fetchable URL under Turbopack, so it
// silently falls back to "" and the Worker ends up loading the current page
// instead (blank map, blocked "text/html" worker load). Point it at a copy
// of the worker served untouched from public/ — see
// scripts/copy-maplibre-worker.mjs for why it can't just be bundled.
setWorkerUrl("/maplibre-gl/maplibre-gl-worker.mjs");

// Registers the "pmtiles://" URL scheme so style sources can reference our
// local archive directly (see docs/map-tiles.md for how that file gets
// there). Must happen once, before the style loads.
addProtocol("pmtiles", new Protocol().tile);

// Ottawa, ON. Non-zero pitch/bearing just so it's visually obvious on load
// that the 3D camera is doing something, ahead of any building data existing
// to look at. Pitch/bearing are also draggable at runtime by default
// (right-click-drag, or ctrl-drag, or two-finger drag on trackpad/touch) —
// nothing extra needed to enable that interaction.
const INITIAL_VIEW_STATE = {
  longitude: -75.6972,
  latitude: 45.4215,
  zoom: 15,
  pitch: 60,
  bearing: -20,
};

// @protomaps/basemaps' GRAYSCALE flavor generates the full set of
// fill/line/background layers matching the minitokyo3d-style greyscale look
// (source-layer names — "earth", "water", "roads", ... — line up with the
// vector_layers reported by `pmtiles show --metadata
// public/tiles/ottawa.pmtiles`; see docs/map-tiles.md). Deliberately no
// labels yet — that needs a glyphs (font) source, which is its own step.
const SOURCE_NAME = "basemap";

// OSM-tagged building height in meters, from the "buildings" source-layer
// (see docs — decoded via a scratch MVT inspection, not every feature has
// one). Falls back to a flat 6m (~2 storeys) guess where it's missing,
// rather than leaving those buildings invisible at height 0.
const BUILDING_HEIGHT: ExpressionSpecification = ["coalesce", ["get", "height"], 6];

// Start from the theme's own layer set, then swap its flat, 50%-opacity
// "buildings" fill for a fill-extrusion — reusing the theme's own building
// color (GRAYSCALE.buildings) rather than duplicating it, and leaving
// everything else the theme draws (roads, water, boundaries, ...) untouched.
const MAP_STYLE = {
  version: 8 as const,
  sources: {
    [SOURCE_NAME]: {
      type: "vector" as const,
      url: "pmtiles:///tiles/ottawa.pmtiles",
    },
  },
  layers: layers(SOURCE_NAME, GRAYSCALE).map((layer): LayerSpecification => {
    if (layer.id !== "buildings" || layer.type !== "fill") return layer;
    const extrusion: FillExtrusionLayerSpecification = {
      id: layer.id,
      type: "fill-extrusion",
      source: layer.source,
      "source-layer": layer["source-layer"],
      filter: layer.filter,
      paint: {
        "fill-extrusion-color": GRAYSCALE.buildings,
        "fill-extrusion-height": BUILDING_HEIGHT,
        "fill-extrusion-opacity": 0.8,
      },
    };
    return extrusion;
  }),
};

export default function Map() {
  return (
    <MapLibreMap
      initialViewState={INITIAL_VIEW_STATE}
      mapStyle={MAP_STYLE}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
