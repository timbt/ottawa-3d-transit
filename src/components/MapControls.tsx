"use client";

import { LocateFixed } from "lucide-react";
import type { RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { DEFAULT_VIEW_STATE } from "./Map";

// Overlay for map UI controls, positioned over the map canvas rather than
// flowing in the page layout. Meant to grow — layer visibility toggles, an
// about link, route search, etc. all land here alongside the recenter
// button, not as one-off positioned elements scattered elsewhere.
export default function MapControls({ mapRef }: { mapRef: RefObject<MapRef | null> }) {
  function recenter() {
    mapRef.current?.flyTo({
      center: [DEFAULT_VIEW_STATE.longitude, DEFAULT_VIEW_STATE.latitude],
      zoom: DEFAULT_VIEW_STATE.zoom,
      pitch: DEFAULT_VIEW_STATE.pitch,
      bearing: DEFAULT_VIEW_STATE.bearing,
    });
  }

  return (
    <div className="absolute top-3 right-3 flex flex-col gap-2">
      <button
        type="button"
        onClick={recenter}
        aria-label="Recenter map on downtown Ottawa"
        title="Recenter on downtown Ottawa"
        className="rounded-md bg-white/90 p-2 text-zinc-800 shadow-md backdrop-blur transition-colors hover:bg-white"
      >
        <LocateFixed size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
