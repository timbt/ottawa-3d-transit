"use client";

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
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
      </button>
    </div>
  );
}
