"use client";

import { useEffect, useState } from "react";
import { Layer, Popup, Source, useMap } from "react-map-gl/maplibre";
import type { MapLayerMouseEvent } from "maplibre-gl";
import type { VehiclePositionsCollection, VehiclePositionsResponse, VehicleProperties } from "@/lib/octranspo";

const POLL_INTERVAL_MS = 20_000;
const EMPTY_COLLECTION: VehiclePositionsCollection = { type: "FeatureCollection", features: [] };
const LAYER_ID = "vehicles-circles";

interface SelectedVehicle {
  longitude: number;
  latitude: number;
  routeId: string | null;
}

export default function VehicleLayer() {
  const [data, setData] = useState<VehiclePositionsCollection>(EMPTY_COLLECTION);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [selected, setSelected] = useState<SelectedVehicle | null>(null);
  const { current: map } = useMap();

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch("/api/vehicle-positions");
        const { updatedAt: fetchedAt, ...collection } = (await response.json()) as VehiclePositionsResponse;
        if (!cancelled) {
          setData(collection);
          setUpdatedAt(fetchedAt);
        }
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

  useEffect(() => {
    if (!map) return;
    const mapInstance = map.getMap();

    function handleClick(e: MapLayerMouseEvent) {
      const feature = e.features?.[0];
      if (!feature || feature.geometry.type !== "Point") return;
      const [longitude, latitude] = feature.geometry.coordinates;
      setSelected({ longitude, latitude, routeId: (feature.properties as VehicleProperties).routeId });
    }

    function handleMouseEnter() {
      mapInstance.getCanvas().style.cursor = "pointer";
    }

    function handleMouseLeave() {
      mapInstance.getCanvas().style.cursor = "";
    }

    mapInstance.on("click", LAYER_ID, handleClick);
    mapInstance.on("mouseenter", LAYER_ID, handleMouseEnter);
    mapInstance.on("mouseleave", LAYER_ID, handleMouseLeave);

    return () => {
      mapInstance.off("click", LAYER_ID, handleClick);
      mapInstance.off("mouseenter", LAYER_ID, handleMouseEnter);
      mapInstance.off("mouseleave", LAYER_ID, handleMouseLeave);
    };
  }, [map]);

  return (
    <>
      <Source id="vehicles" type="geojson" data={data}>
        <Layer
          id={LAYER_ID}
          type="circle"
          paint={{
            "circle-radius": 4,
            "circle-color": "#e63946",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
          }}
        />
      </Source>
      {selected && (
        <Popup longitude={selected.longitude} latitude={selected.latitude} onClose={() => setSelected(null)}>
          <div className="text-zinc-800">
            <div>Route {selected.routeId ?? "unknown"}</div>
            <div>{updatedAt ? `Updated at ${new Date(updatedAt).toLocaleTimeString()}` : "No data yet"}</div>
          </div>
        </Popup>
      )}
    </>
  );
}
