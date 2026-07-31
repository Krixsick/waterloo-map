import mapboxgl from "mapbox-gl";
import type { FeatureCollection, Point } from "geojson";

import type { TransitVehicle } from "../types/transit";

const SOURCE_ID = "transit-vehicles";
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

function toGeoJson(
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
  map.addSource(SOURCE_ID, { type: "geojson", data: toGeoJson([]) });

  map.addLayer({
    id: "transit-vehicle-glow",
    type: "circle",
    source: SOURCE_ID,
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
    source: SOURCE_ID,
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
    source: SOURCE_ID,
    layout: {
      "text-field": ["coalesce", ["get", "routeId"], ""],
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 9,
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#ffffff", "text-halo-color": modeColor },
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

export function updateTransitVehicles(
  map: mapboxgl.Map,
  vehicles: TransitVehicle[],
) {
  const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  source?.setData(toGeoJson(vehicles));
}
