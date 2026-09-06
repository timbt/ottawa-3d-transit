"use client";

import { useRef } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import Map from "./Map";
import MapControls from "./MapControls";

// Owns the ref shared between the map canvas and its overlay controls, so
// page.tsx itself stays a plain server component.
export default function MapView() {
  const mapRef = useRef<MapRef>(null);

  return (
    <div className="relative h-full w-full">
      <Map ref={mapRef} />
      <MapControls mapRef={mapRef} />
    </div>
  );
}
