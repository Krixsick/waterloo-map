import type { Expression, GeoJSONSource, Map } from "mapbox-gl";
import type { FeatureCollection, Point } from "geojson";

import type { TransitStop, TransitVehicle } from "../types/transit";

const STOP_SOURCE_ID = "transit-stops";
const STOP_MARKER_LAYER_ID = "transit-stop-markers";
const VEHICLE_SOURCE_ID = "transit-vehicles";
const MARKER_LAYER_ID = "transit-vehicle-markers";
const modeColor: Expression = [
  "match",
  ["get", "mode"],
  "bus",
  "#2563eb",
  "ion",
  "#db2777",
  "#475569",
];

type StopProperties = Pick<TransitStop, "id" | "stopId" | "mode" | "name"> & {
  routeIds: string;
};

type TransitLayerHandlers = {
  onSelectStop: (stop: TransitStop) => void;
  onSelectVehicle: (vehicle: TransitVehicle) => void;
};

function stopsToGeoJson(
  stops: TransitStop[],
): FeatureCollection<Point, StopProperties> {
  return {
    type: "FeatureCollection",
    features: stops.map(({ longitude, latitude, routeIds, ...properties }) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [longitude, latitude] },
      properties: { ...properties, routeIds: routeIds.join(", ") },
    })),
  };
}

function vehiclesToGeoJson(
  vehicles: TransitVehicle[],
): FeatureCollection<Point, TransitVehicle> {
  return {
    type: "FeatureCollection",
    features: vehicles.map(({ longitude, latitude, ...properties }) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [longitude, latitude] },
      properties: { ...properties, longitude, latitude },
    })),
  };
}

export function addTransitLayers(
  map: Map,
  handlers: TransitLayerHandlers,
) {
  map.addSource(STOP_SOURCE_ID, {
    type: "geojson",
    data: stopsToGeoJson([]),
  });

  map.addLayer({
    id: STOP_MARKER_LAYER_ID,
    type: "circle",
    source: STOP_SOURCE_ID,
    minzoom: 13,
    paint: {
      "circle-radius": ["match", ["get", "mode"], "ion", 8, 5],
      "circle-color": modeColor,
      "circle-opacity": 0.9,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  });

  map.addLayer({
    id: "transit-ion-station-labels",
    type: "symbol",
    source: STOP_SOURCE_ID,
    minzoom: 14,
    filter: ["==", ["get", "mode"], "ion"],
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Regular"],
      "text-size": 11,
      "text-offset": [0, 1.5],
    },
    paint: {
      "text-color": "#9d174d",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.5,
    },
  });

  map.addSource(VEHICLE_SOURCE_ID, {
    type: "geojson",
    data: vehiclesToGeoJson([]),
  });

  map.addLayer({
    id: "transit-vehicle-glow",
    type: "circle",
    source: VEHICLE_SOURCE_ID,
    paint: {
      "circle-radius": 18,
      "circle-color": modeColor,
      "circle-opacity": 0.2,
      "circle-blur": 0.7,
    },
  });

  map.addLayer({
    id: MARKER_LAYER_ID,
    type: "circle",
    source: VEHICLE_SOURCE_ID,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 10, 17, 13],
      "circle-color": modeColor,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  });

  map.addLayer({
    id: "transit-vehicle-labels",
    type: "symbol",
    source: VEHICLE_SOURCE_ID,
    layout: {
      "text-field": ["coalesce", ["get", "routeId"], ""],
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 9,
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#ffffff", "text-halo-color": modeColor },
  });

  map.on("mouseenter", STOP_MARKER_LAYER_ID, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", STOP_MARKER_LAYER_ID, () => {
    map.getCanvas().style.cursor = "";
  });
  map.on("click", STOP_MARKER_LAYER_ID, (event) => {
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== "Point") return;
    const [longitude, latitude] = feature.geometry.coordinates;
    const properties = feature.properties as StopProperties;

    handlers.onSelectStop({
      ...properties,
      latitude,
      longitude,
      routeIds: properties.routeIds ? properties.routeIds.split(", ") : [],
    });
  });

  map.on("mouseenter", MARKER_LAYER_ID, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", MARKER_LAYER_ID, () => {
    map.getCanvas().style.cursor = "";
  });
  map.on("click", MARKER_LAYER_ID, (event) => {
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== "Point") return;
    const [longitude, latitude] = feature.geometry.coordinates;

    handlers.onSelectVehicle({
      ...(feature.properties as TransitVehicle),
      latitude,
      longitude,
    });
  });
}

export function updateTransitStops(map: Map, stops: TransitStop[]) {
  const source = map.getSource(STOP_SOURCE_ID) as
    | GeoJSONSource
    | undefined;
  source?.setData(stopsToGeoJson(stops));
}

export function updateTransitVehicles(
  map: Map,
  vehicles: TransitVehicle[],
) {
  const source = map.getSource(VEHICLE_SOURCE_ID) as
    | GeoJSONSource
    | undefined;
  source?.setData(vehiclesToGeoJson(vehicles));
}
