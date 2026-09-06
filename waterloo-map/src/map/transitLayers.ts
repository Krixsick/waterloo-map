import type { Expression, GeoJSONSource, Map } from "mapbox-gl";
import type { FeatureCollection, Point, LineString } from "geojson";

import type { TransitStop, TransitVehicle, TransitRoute, TransitRoutePattern } from "../types/transit";
import { transitRouteColor } from "../utils/transitRoutes";
import { addTransitStopHover, transitStopFromFeature } from "./transitStopHover";
import { getActiveEventLayerIds } from "./eventLayers";

const STOP_SOURCE_ID = "transit-stops";
const STOP_MARKER_LAYER_ID = "transit-stop-markers";
const STOP_TARGET_LAYER_ID = "transit-stop-targets";
const STOP_HIGHLIGHT_LAYER_ID = "transit-stop-highlight";
const clearStopHovers = new WeakMap<Map, () => void>();
const VEHICLE_SOURCE_ID = "transit-vehicles";
const MARKER_LAYER_ID = "transit-vehicle-markers";
const modeColor: Expression = ["coalesce", ["get", "color"], "#475569"];
const ROUTE_SOURCE_ID = "transit-route-path";

type StopProperties = Pick<TransitStop, "id" | "stopId" | "mode" | "name"> & {
  routeIds: string;
};

type TransitLayerHandlers = {
  onSelectStop: (stop: TransitStop) => void;
  onSelectVehicle: (vehicle: TransitVehicle) => void;
};

function isEventOverlayAtPoint(map: Map, point: [number, number]) {
  const eventLayers = getActiveEventLayerIds(map);
  return (
    eventLayers.length > 0 &&
    map.queryRenderedFeatures(point, { layers: eventLayers }).length > 0
  );
}

function stopsToGeoJson(
  stops: TransitStop[],
  route?: TransitRoute | null,
): FeatureCollection<Point, StopProperties & { color: string }> {
  return {
    type: "FeatureCollection",
    features: stops.map(({ longitude, latitude, routeIds, ...properties }) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [longitude, latitude] },
      properties: { ...properties, routeIds: routeIds.join(", "), color: route ? transitRouteColor(route.mode, route.routeId) : "#64748b" },
    })),
  };
}

function vehiclesToGeoJson(
  vehicles: TransitVehicle[],
): FeatureCollection<Point, TransitVehicle & { color: string }> {
  return {
    type: "FeatureCollection",
    features: vehicles.map(({ longitude, latitude, ...properties }) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [longitude, latitude] },
      properties: { ...properties, longitude, latitude, color: transitRouteColor(properties.mode, properties.routeId) },
    })),
  };
}

export function addTransitLayers(
  map: Map,
  handlers: TransitLayerHandlers,
) {
  map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addLayer({
    id: "transit-route-casing", type: "line", source: ROUTE_SOURCE_ID,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#ffffff", "line-width": 9, "line-opacity": 0.95 },
  });
  map.addLayer({
    id: "transit-route-line", type: "line", source: ROUTE_SOURCE_ID,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": ["get", "color"], "line-width": 5 },
  });
  map.addLayer({
    id: "transit-route-numbers", type: "symbol", source: ROUTE_SOURCE_ID,
    layout: {
      "symbol-placement": "line", "symbol-spacing": 220,
      "text-field": ["get", "routeId"], "text-size": 13,
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
    },
    paint: { "text-color": ["get", "color"], "text-halo-color": "#ffffff", "text-halo-width": 3 },
  });

  map.addSource(STOP_SOURCE_ID, {
    type: "geojson",
    data: stopsToGeoJson([]),
  });

  map.addLayer({
    id: STOP_MARKER_LAYER_ID,
    type: "circle",
    source: STOP_SOURCE_ID,
    minzoom: 9,
    paint: {
      "circle-radius": ["match", ["get", "mode"], "ion", 8, 5],
      "circle-color": modeColor,
      "circle-opacity": 0.9,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  });

  map.addLayer({
    id: STOP_HIGHLIGHT_LAYER_ID,
    type: "circle",
    source: STOP_SOURCE_ID,
    filter: ["==", ["get", "id"], ""],
    paint: {
      "circle-radius": ["match", ["get", "mode"], "ion", 12, 9],
      "circle-color": "#ffffff",
      "circle-opacity": 0.2,
      "circle-stroke-color": modeColor,
      "circle-stroke-width": 2,
    },
  });
  map.addLayer({
    id: STOP_TARGET_LAYER_ID,
    type: "circle",
    source: STOP_SOURCE_ID,
    minzoom: 9,
    paint: { "circle-radius": 12, "circle-opacity": 0 },
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
      "text-size": 11,
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#ffffff", "text-halo-color": modeColor },
  });

  clearStopHovers.set(map, addTransitStopHover(
    map, STOP_TARGET_LAYER_ID, STOP_HIGHLIGHT_LAYER_ID, MARKER_LAYER_ID, handlers.onSelectStop,
  ));
  map.on("remove", () => clearStopHovers.delete(map));
  map.on("click", STOP_TARGET_LAYER_ID, (event) => {
    if (isEventOverlayAtPoint(map, [event.point.x, event.point.y])) return;
    if (map.queryRenderedFeatures(event.point, { layers: [MARKER_LAYER_ID] }).length) return;
    const feature = event.features?.[0];
    const stop = feature ? transitStopFromFeature(feature) : null;
    if (stop) handlers.onSelectStop(stop);
  });

  map.on("mouseenter", MARKER_LAYER_ID, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", MARKER_LAYER_ID, () => {
    map.getCanvas().style.cursor = "";
  });
  map.on("click", MARKER_LAYER_ID, (event) => {
    if (isEventOverlayAtPoint(map, [event.point.x, event.point.y])) return;
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

export function updateTransitStops(map: Map, stops: TransitStop[], route?: TransitRoute | null) {
  clearStopHovers.get(map)?.();
  const source = map.getSource(STOP_SOURCE_ID) as
    | GeoJSONSource
    | undefined;
  source?.setData(stopsToGeoJson(stops, route));
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

export function updateTransitRoute(map: Map, route: TransitRoute | null, pattern: TransitRoutePattern | null) {
  const data: FeatureCollection<LineString> = {
    type: "FeatureCollection",
    features: route && pattern && pattern.coordinates.length > 1 ? [{
      type: "Feature",
      properties: { routeId: route.routeId, color: transitRouteColor(route.mode, route.routeId) },
      geometry: { type: "LineString", coordinates: pattern.coordinates },
    }] : [],
  };
  (map.getSource(ROUTE_SOURCE_ID) as GeoJSONSource | undefined)?.setData(data);
}
