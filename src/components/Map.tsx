"use client";

import type { Ref } from "react";
import { Map as MapLibreMap, type MapRef } from "react-map-gl/maplibre";
import { addProtocol, setWorkerUrl } from "maplibre-gl";
import { Protocol } from "pmtiles";
import { GRAYSCALE, layers } from "@protomaps/basemaps";
import { resolveTilesUrl, toBuildingExtrusion } from "@/lib/map-style";
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
export const DEFAULT_VIEW_STATE = {
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

const TILES_URL = resolveTilesUrl(process.env.NEXT_PUBLIC_TILES_BASE_URL);

// Start from the theme's own layer set, then swap its flat, 50%-opacity
// "buildings" fill for a fill-extrusion (see src/lib/map-style.ts), leaving
// everything else the theme draws (roads, water, boundaries, ...) untouched.
const MAP_STYLE = {
  version: 8 as const,
  sources: {
    [SOURCE_NAME]: {
      type: "vector" as const,
      url: `pmtiles://${TILES_URL}`,
    },
  },
  layers: layers(SOURCE_NAME, GRAYSCALE).map((layer) => toBuildingExtrusion(layer, GRAYSCALE.buildings)),
};

export default function Map({ ref }: { ref?: Ref<MapRef> }) {
  return (
    <MapLibreMap
      ref={ref}
      initialViewState={DEFAULT_VIEW_STATE}
      mapStyle={MAP_STYLE}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
