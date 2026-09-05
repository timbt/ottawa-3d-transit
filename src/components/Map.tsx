"use client";

import { Map as MapLibreMap } from "react-map-gl/maplibre";
import { addProtocol, setWorkerUrl } from "maplibre-gl";
import { Protocol } from "pmtiles";
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
  zoom: 11,
  pitch: 60,
  bearing: -20,
};

// Deliberately bare-bones proof-of-concept style: just enough layers to
// confirm the local pmtiles archive is actually being read and rendered,
// before layering a real theme (protomaps-themes-base) on top of it. Layer
// names ("earth", "water", "roads", ...) match the vector_layers reported by
// `pmtiles show --metadata public/tiles/ottawa.pmtiles` — see
// docs/map-tiles.md.
const MAP_STYLE = {
  version: 8 as const,
  sources: {
    basemap: {
      type: "vector" as const,
      url: "pmtiles:///tiles/ottawa.pmtiles",
    },
  },
  layers: [
    { id: "background", type: "background" as const, paint: { "background-color": "#f2f2f2" } },
    { id: "earth", type: "fill" as const, source: "basemap", "source-layer": "earth", paint: { "fill-color": "#e0e0e0" } },
    { id: "water", type: "fill" as const, source: "basemap", "source-layer": "water", paint: { "fill-color": "#a0c8f0" } },
    { id: "roads", type: "line" as const, source: "basemap", "source-layer": "roads", paint: { "line-color": "#999999", "line-width": 1 } },
  ],
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
