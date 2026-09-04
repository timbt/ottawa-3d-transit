"use client";

import { Map as MapLibreMap } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// maplibre-gl locates its own tile-parsing worker relative to its internal
// `import.meta.url`, which isn't a real fetchable URL under Turbopack, so it
// silently falls back to "" and the Worker ends up loading the current page
// instead (blank map, blocked "text/html" worker load). Point it at a copy
// of the worker served untouched from public/ — see
// scripts/copy-maplibre-worker.mjs for why it can't just be bundled.
setWorkerUrl("/maplibre-gl/maplibre-gl-worker.mjs");

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

// Free demo vector style, no API key required. Swap for a MapTiler/Stadia/etc.
// style once you need custom styling or higher usage limits.
const MAP_STYLE = "https://demotiles.maplibre.org/style.json";

export default function Map() {
  return (
    <MapLibreMap
      initialViewState={INITIAL_VIEW_STATE}
      mapStyle={MAP_STYLE}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
