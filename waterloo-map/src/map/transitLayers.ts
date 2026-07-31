import mapboxgl from "mapbox-gl";
import type { FeatureCollection, Point } from "geojson";

import type { TransitStop, TransitVehicle } from "../types/transit";

const STOP_SOURCE_ID = "transit-stops";
const STOP_MARKER_LAYER_ID = "transit-stop-markers";
const VEHICLE_SOURCE_ID = "transit-vehicles";
const MARKER_LAYER_ID = "transit-vehicle-markers";
const modeColor: mapboxgl.Expression = [
  "match",
  ["get", "mode"],
  "bus",
  "#2563eb",
  "ion",
  "#db2777",
  "#475569",
];

type StopProperties = Pick<TransitStop, "id" | "mode" | "name"> & {
  routeIds: string;
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

function stopPopupContent(stop: StopProperties) {
  const content = document.createElement("div");
  content.className = "min-w-48 p-3 text-slate-800";

  const title = document.createElement("strong");
  title.className = "block pr-5 text-sm font-semibold";
  title.textContent = stop.name;

  const details = document.createElement("p");
  details.className = "mt-1 text-xs text-slate-500";
  const transitType = stop.mode === "ion" ? "ION station" : "Bus stop";
  const routes = stop.mode === "ion" ? `ION ${stop.routeIds}` : `Routes ${stop.routeIds}`;
  details.textContent = stop.routeIds
    ? `${transitType} · ${routes}`
    : transitType;

  content.append(title, details);
  return content;
}

function popupContent(vehicle: TransitVehicle) {
  const content = document.createElement("div");
  content.className = "min-w-48 p-3 text-slate-800";

  const title = document.createElement("strong");
  title.className = "block pr-5 text-sm font-semibold";
  title.textContent = vehicle.routeId
    ? `${vehicle.mode === "ion" ? "ION" : "Bus"} route ${vehicle.routeId}`
    : vehicle.mode === "ion"
      ? "ION vehicle"
      : "GRT bus";

  const details = document.createElement("p");
  details.className = "mt-1 text-xs capitalize text-slate-500";
  details.textContent = vehicle.currentStatus?.replaceAll("-", " ") ?? "Live vehicle";

  content.append(title, details);
  return content;
}

export function addTransitLayers(map: mapboxgl.Map) {
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

    new mapboxgl.Popup({ offset: 12, className: "transit-popup" })
      .setLngLat(feature.geometry.coordinates as [number, number])
      .setDOMContent(stopPopupContent(feature.properties as StopProperties))
      .addTo(map);
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

    new mapboxgl.Popup({ offset: 18, className: "transit-popup" })
      .setLngLat(feature.geometry.coordinates as [number, number])
      .setDOMContent(popupContent(feature.properties as TransitVehicle))
      .addTo(map);
  });
}

export function updateTransitStops(map: mapboxgl.Map, stops: TransitStop[]) {
  const source = map.getSource(STOP_SOURCE_ID) as
    | mapboxgl.GeoJSONSource
    | undefined;
  source?.setData(stopsToGeoJson(stops));
}

export function updateTransitVehicles(
  map: mapboxgl.Map,
  vehicles: TransitVehicle[],
) {
  const source = map.getSource(VEHICLE_SOURCE_ID) as
    | mapboxgl.GeoJSONSource
    | undefined;
  source?.setData(vehiclesToGeoJson(vehicles));
}
