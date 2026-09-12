"use client";

import { useEffect, useMemo, useState } from "react";
import { Layer, Popup, Source, useMap } from "react-map-gl/maplibre";
import type { MapLayerMouseEvent } from "maplibre-gl";
import type { VehiclePositionsCollection, VehiclePositionsResponse } from "@/lib/octranspo";
import {
  BUS_HEIGHT_METERS,
  toVehicleDots,
  toVehicleFootprints,
  type PositionedVehicleProperties,
} from "@/lib/bus-footprint";

const POLL_INTERVAL_MS = 20_000;
const EMPTY_COLLECTION: VehiclePositionsCollection = { type: "FeatureCollection", features: [] };

// Below this zoom, a realistically-sized bus box is only a few pixels
// across and reads as noise rather than a bus -- show the old flat dot
// instead. Above it, show the 3D box. Picked by eye; adjust freely.
const BOX_MIN_ZOOM = 16;
const BOX_LAYER_ID = "vehicle-boxes";
const DOT_LAYER_ID = "vehicle-dots";

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
  const footprints = useMemo(() => toVehicleFootprints(data), [data]);
  const dots = useMemo(() => toVehicleDots(data), [data]);

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
      if (!feature) return;
      const { longitude, latitude, routeId } = feature.properties as PositionedVehicleProperties;
      setSelected({ longitude, latitude, routeId });
    }

    function handleMouseEnter() {
      mapInstance.getCanvas().style.cursor = "pointer";
    }

    function handleMouseLeave() {
      mapInstance.getCanvas().style.cursor = "";
    }

    // Both layers show the same vehicles at different zoom ranges, so both
    // get the same click/hover handling.
    for (const layerId of [BOX_LAYER_ID, DOT_LAYER_ID]) {
      mapInstance.on("click", layerId, handleClick);
      mapInstance.on("mouseenter", layerId, handleMouseEnter);
      mapInstance.on("mouseleave", layerId, handleMouseLeave);
    }

    return () => {
      for (const layerId of [BOX_LAYER_ID, DOT_LAYER_ID]) {
        mapInstance.off("click", layerId, handleClick);
        mapInstance.off("mouseenter", layerId, handleMouseEnter);
        mapInstance.off("mouseleave", layerId, handleMouseLeave);
      }
    };
  }, [map]);

  return (
    <>
      <Source id="vehicle-boxes" type="geojson" data={footprints}>
        <Layer
          id={BOX_LAYER_ID}
          type="fill-extrusion"
          minzoom={BOX_MIN_ZOOM}
          paint={{
            "fill-extrusion-color": "#e63946",
            "fill-extrusion-height": BUS_HEIGHT_METERS,
            "fill-extrusion-opacity": 0.9,
          }}
        />
      </Source>
      <Source id="vehicle-dots" type="geojson" data={dots}>
        <Layer
          id={DOT_LAYER_ID}
          type="circle"
          maxzoom={BOX_MIN_ZOOM}
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
