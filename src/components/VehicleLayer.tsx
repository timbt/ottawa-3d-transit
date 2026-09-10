"use client";

import { useEffect, useState } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import type { VehiclePositionsCollection } from "@/lib/octranspo";

const POLL_INTERVAL_MS = 20_000;
const EMPTY_COLLECTION: VehiclePositionsCollection = { type: "FeatureCollection", features: [] };

export default function VehicleLayer() {
  const [data, setData] = useState<VehiclePositionsCollection>(EMPTY_COLLECTION);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch("/api/vehicle-positions");
        const collection = (await response.json()) as VehiclePositionsCollection;
        if (!cancelled) setData(collection);
      } catch (error) {
        console.error("Failed to fetch vehicle positions", error);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Source id="vehicles" type="geojson" data={data}>
      <Layer
        id="vehicles-circles"
        type="circle"
        paint={{
          "circle-radius": 4,
          "circle-color": "#e63946",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        }}
      />
    </Source>
  );
}
