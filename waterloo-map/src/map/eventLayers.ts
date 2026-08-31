import mapboxgl from "mapbox-gl";
import type { FeatureCollection, Point } from "geojson";
import type { GeoJSONSource, Map } from "mapbox-gl";

import type { MappedWaterlooEvent } from "../types/events";

const EVENT_SOURCE_ID = "campus-events";
const EVENT_CLUSTER_GLOW_LAYER_ID = "event-cluster-glow";
export const EVENT_CLUSTER_LAYER_ID = "event-clusters";
const EVENT_CLUSTER_COUNT_LAYER_ID = "event-cluster-count";
export const EVENT_MARKER_LAYER_ID = "event-markers";
const EVENT_LABEL_LAYER_ID = "event-labels";
const EVENT_PIN_IMAGE_ID = "event-calendar-pin";

type EventProperties = {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
};

type EventLayerHandlers = {
  onSelectEvent: (eventId: number) => void;
  onClearSelection?: () => void;
};

function eventsToGeoJson(
  events: MappedWaterlooEvent[],
): FeatureCollection<Point, EventProperties> {
  return {
    type: "FeatureCollection",
    features: events.map((event) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [
          event.coordinates.longitude,
          event.coordinates.latitude,
        ],
      },
      properties: {
        id: event.id,
        name: event.name,
        date: event.date ?? "Date to be announced",
        time: event.time ?? "",
        location: event.location,
      },
    })),
  };
}

function addEventPinImage(map: Map) {
  if (map.hasImage(EVENT_PIN_IMAGE_ID)) return;

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 76;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.shadowColor = "rgba(15, 23, 42, 0.24)";
  context.shadowBlur = 8;
  context.shadowOffsetY = 4;
  context.beginPath();
  context.moveTo(32, 70);
  context.bezierCurveTo(26, 59, 9, 46, 9, 28);
  context.arc(32, 28, 23, Math.PI, 0);
  context.bezierCurveTo(55, 46, 38, 59, 32, 70);
  context.closePath();
  context.fillStyle = "#7c3aed";
  context.fill();

  context.shadowColor = "transparent";
  context.strokeStyle = "#ffffff";
  context.lineWidth = 4;
  context.stroke();

  context.strokeStyle = "#ffffff";
  context.lineWidth = 3;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeRect(21, 20, 22, 19);
  context.beginPath();
  context.moveTo(21, 26);
  context.lineTo(43, 26);
  context.moveTo(26, 17);
  context.lineTo(26, 22);
  context.moveTo(38, 17);
  context.lineTo(38, 22);
  context.stroke();

  map.addImage(EVENT_PIN_IMAGE_ID, context.getImageData(0, 0, 64, 76), {
    pixelRatio: 2,
  });
}

function createEventPreview(properties: EventProperties) {
  const preview = document.createElement("div");
  preview.className = "min-w-52 rounded-xl border border-violet-100 bg-white p-3 shadow-xl";

  const eyebrow = document.createElement("p");
  eyebrow.className = "text-[11px] font-semibold uppercase tracking-wide text-violet-600";
  eyebrow.textContent = "Campus event";

  const title = document.createElement("p");
  title.className = "mt-1 max-w-60 text-sm font-semibold leading-5 text-slate-900";
  title.textContent = properties.name;

  const details = document.createElement("p");
  details.className = "mt-1 text-xs text-slate-500";
  details.textContent = [properties.date, properties.time, properties.location]
    .filter(Boolean)
    .join(" · ");

  preview.append(eyebrow, title, details);
  return preview;
}

export function getActiveEventLayerIds(map: Map) {
  return [EVENT_CLUSTER_LAYER_ID, EVENT_MARKER_LAYER_ID].filter((layerId) =>
    Boolean(map.getLayer(layerId)),
  );
}

export function addEventLayers(map: Map, handlers: EventLayerHandlers) {
  addEventPinImage(map);

  map.addSource(EVENT_SOURCE_ID, {
    type: "geojson",
    data: eventsToGeoJson([]),
    cluster: true,
    clusterMaxZoom: 16,
    clusterRadius: 46,
  });

  map.addLayer({
    id: EVENT_CLUSTER_GLOW_LAYER_ID,
    type: "circle",
    source: EVENT_SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-radius": ["step", ["get", "point_count"], 24, 10, 30, 30, 36],
      "circle-color": "#8b5cf6",
      "circle-opacity": 0.2,
      "circle-blur": 0.65,
    },
  });

  map.addLayer({
    id: EVENT_CLUSTER_LAYER_ID,
    type: "circle",
    source: EVENT_SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-radius": ["step", ["get", "point_count"], 17, 10, 21, 30, 25],
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#8b5cf6",
        10,
        "#7c3aed",
        30,
        "#6d28d9",
      ],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2.5,
    },
  });

  map.addLayer({
    id: EVENT_CLUSTER_COUNT_LAYER_ID,
    type: "symbol",
    source: EVENT_SOURCE_ID,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#ffffff" },
  });

  map.addLayer({
    id: EVENT_MARKER_LAYER_ID,
    type: "symbol",
    source: EVENT_SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": EVENT_PIN_IMAGE_ID,
      "icon-size": ["interpolate", ["linear"], ["zoom"], 13, 0.78, 18, 1],
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });

  map.addLayer({
    id: EVENT_LABEL_LAYER_ID,
    type: "symbol",
    source: EVENT_SOURCE_ID,
    minzoom: 16.5,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Regular"],
      "text-size": 11,
      "text-max-width": 16,
      "text-variable-anchor": ["top", "left", "right"],
      "text-radial-offset": 2.5,
      "text-justify": "auto",
      "text-padding": 4,
      "text-optional": true,
    },
    paint: {
      "text-color": "#4c1d95",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.75,
      "text-halo-blur": 0.5,
    },
  });

  const previewPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: [0, -34],
    className: "uw-event-popup",
  });

  map.on("mouseenter", EVENT_MARKER_LAYER_ID, (event) => {
    map.getCanvas().style.cursor = "pointer";
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== "Point") return;

    previewPopup
      .setLngLat(feature.geometry.coordinates as [number, number])
      .setDOMContent(createEventPreview(feature.properties as EventProperties))
      .addTo(map);
  });
  map.on("mouseleave", EVENT_MARKER_LAYER_ID, () => {
    map.getCanvas().style.cursor = "";
    previewPopup.remove();
  });
  map.on("click", EVENT_MARKER_LAYER_ID, (event) => {
    const feature = event.features?.[0];
    const eventId = Number(feature?.properties?.id);
    if (!Number.isFinite(eventId)) return;
    previewPopup.remove();
    handlers.onSelectEvent(eventId);
  });

  map.on("mouseenter", EVENT_CLUSTER_LAYER_ID, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", EVENT_CLUSTER_LAYER_ID, () => {
    map.getCanvas().style.cursor = "";
  });
  map.on("click", EVENT_CLUSTER_LAYER_ID, (event) => {
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== "Point") return;
    const clusterId = Number(feature.properties?.cluster_id);
    if (!Number.isFinite(clusterId)) return;
    const coordinates = feature.geometry.coordinates as [number, number];
    handlers.onClearSelection?.();

    const source = map.getSource(EVENT_SOURCE_ID) as GeoJSONSource | undefined;
    source?.getClusterExpansionZoom(clusterId, (error, zoom) => {
      if (error || zoom === null || zoom === undefined) return;
      map.easeTo({
        center: coordinates,
        zoom,
        duration: 700,
      });
    });
  });
}

export function updateEventMarkers(map: Map, events: MappedWaterlooEvent[]) {
  const source = map.getSource(EVENT_SOURCE_ID) as GeoJSONSource | undefined;
  source?.setData(eventsToGeoJson(events));
}
