import { formatDisplayTime } from "../utils/timeFormat";
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

const EVENT_POPUP_CLASS = "uw-event-popup";
const EVENT_POPUP_STYLE_ID = "uw-event-popup-styles";

type EventProperties = {
  ids: string;
  count: number;
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
};

type EventLayerHandlers = {
  onSelectEvent: (eventId: number) => void;
  onSelectVenue: (ids: number[]) => void;
  onClearSelection?: () => void;
};

function eventsToGeoJson(
  events: MappedWaterlooEvent[],
): FeatureCollection<Point, EventProperties> {
  const groups = new globalThis.Map<string, MappedWaterlooEvent[]>();
  events.forEach(event => {
    const key = event.buildingId ?? `${event.coordinates.latitude.toFixed(5)}:${event.coordinates.longitude.toFixed(5)}`;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  });
  return {
    type: "FeatureCollection",
    features: [...groups.values()].map((group) => { const event = group[0]; return ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [
          event.coordinates.longitude,
          event.coordinates.latitude,
        ],
      },
      properties: {
        ids: JSON.stringify(group.map(item => item.id)),
        count: group.length,
        id: event.id,
        name: group.length > 1 ? `${group.length} events · ${event.location}` : event.name,
        date: event.date ?? "Date to be announced",
        time: group.length > 1 ? "Select to browse events here" : event.time ?? "",
        location: event.location,
      },
    }); }),
  };
}

function addEventPopupStyles() {
  if (document.getElementById(EVENT_POPUP_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = EVENT_POPUP_STYLE_ID;

  style.innerHTML = `
    .${EVENT_POPUP_CLASS} .mapboxgl-popup-content {
      padding: 0;
      background: transparent;
      box-shadow: none;
      border-radius: 0;
    }

    .${EVENT_POPUP_CLASS} .mapboxgl-popup-tip {
      border-top-color: rgba(255, 255, 255, 0.82) !important;
    }

    .uw-event-preview {
      width: 240px;
      padding: 14px 16px;
      border: 1px solid rgba(221, 214, 254, 0.8);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.82);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
      color: #0f172a;
      font-family: "Figtree", sans-serif;
    }

    .uw-event-preview-label {
      margin: 0;
      color: #7c3aed;
      font-family: "JetBrains Mono", monospace;
      font-size: 11px;
      font-weight: 600;
      line-height: 1.4;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .uw-event-preview-title {
      margin: 6px 0 0;
      color: #0f172a;
      font-family: "Figtree", sans-serif;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.3;
      letter-spacing: -0.01em;
    }

    .uw-event-preview-details {
      margin: 6px 0 0;
      color: #64748b;
      font-family: "Figtree", sans-serif;
      font-size: 12px;
      font-weight: 500;
      line-height: 1.5;
    }
  `;

  document.head.appendChild(style);
}

function addEventPinImage(map: Map) {
  if (map.hasImage(EVENT_PIN_IMAGE_ID)) return;

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.beginPath();
  context.arc(32, 32, 23, 0, Math.PI * 2);
  context.fillStyle = "#ffffff";
  context.fill();
  context.strokeStyle = "#7c3aed";
  context.lineWidth = 3;
  context.stroke();
  context.strokeStyle = "#7c3aed";
  context.lineWidth = 2.5;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.roundRect(22, 23, 20, 19, 3);
  context.moveTo(22, 29); context.lineTo(42, 29);
  context.moveTo(27, 20); context.lineTo(27, 25);
  context.moveTo(37, 20); context.lineTo(37, 25);
  context.stroke();
  map.addImage(EVENT_PIN_IMAGE_ID, context.getImageData(0, 0, 64, 64), {pixelRatio: 2});
}

function createEventPreview(properties: EventProperties) {
  const preview = document.createElement("div");
  preview.className = "uw-event-preview";

  const label = document.createElement("p");
  label.className = "uw-event-preview-label";
  label.textContent = "Campus event";

  const title = document.createElement("p");
  title.className = "uw-event-preview-title";
  title.textContent = properties.name;

  const details = document.createElement("p");
  details.className = "uw-event-preview-details";

  details.textContent = [
    properties.date,
    formatDisplayTime(properties.time),
    properties.location,
  ]
    .filter(Boolean)
    .join(" · ");

  preview.append(label, title, details);

  return preview;
}

export function getActiveEventLayerIds(map: Map) {
  return [
    EVENT_CLUSTER_LAYER_ID,
    EVENT_MARKER_LAYER_ID,
  ].filter((layerId) => Boolean(map.getLayer(layerId)));
}

export function addEventLayers(
  map: Map,
  handlers: EventLayerHandlers,
) {
  addEventPopupStyles();
  addEventPinImage(map);

  map.addSource(EVENT_SOURCE_ID, {
    type: "geojson",
    data: eventsToGeoJson([]),
    cluster: true,
    clusterProperties: { eventCount: ["+", ["get", "count"]] },
    clusterMaxZoom: 16,
    clusterRadius: 46,
  });

  map.addLayer({
    id: EVENT_CLUSTER_GLOW_LAYER_ID,
    type: "circle",
    source: EVENT_SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-radius": [
        "step",
        ["get", "point_count"],
        24,
        10,
        30,
        30,
        36,
      ],
      "circle-color": "#7c3aed",
      "circle-opacity": 0.08,
      "circle-blur": 0.65,
    },
  });

  map.addLayer({
    id: EVENT_CLUSTER_LAYER_ID,
    type: "circle",
    source: EVENT_SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-radius": [
        "step",
        ["get", "point_count"],
        17,
        10,
        21,
        30,
        25,
      ],
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#7c3aed",
        10,
        "#7c3aed",
        30,
        "#7c3aed",
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
      "text-field": ["get", "eventCount"],
      "text-font": [
        "DIN Offc Pro Medium",
        "Arial Unicode MS Bold",
      ],
      "text-size": 12,
      "text-allow-overlap": true,
    },
    paint: {
      "text-color": "#ffffff",
    },
  });

  map.addLayer({
    id: EVENT_MARKER_LAYER_ID,
    type: "symbol",
    source: EVENT_SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": EVENT_PIN_IMAGE_ID,
      "icon-size": [
        "interpolate",
        ["linear"],
        ["zoom"],
        13,
        0.78,
        18,
        1,
      ],
      "icon-anchor": "center",
      "text-field": ["case", [">", ["get", "count"], 1], ["to-string", ["get", "count"]], ""],
      "text-size": 12,
      "text-offset": [1.1, -1.1],
      "text-allow-overlap": true,
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
      "text-field": "",
      "text-font": [
        "DIN Offc Pro Medium",
        "Arial Unicode MS Regular",
      ],
      "text-size": 11,
      "text-max-width": 16,
      "text-variable-anchor": [
        "top",
        "left",
        "right",
      ],
      "text-radial-offset": 2.5,
      "text-justify": "auto",
      "text-padding": 4,
      "text-optional": true,
    },
    paint: {
      "text-color": "#7c3aed",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.75,
      "text-halo-blur": 0.5,
    },
  });

  const previewPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: [0, -34],
    className: EVENT_POPUP_CLASS,
  });

  map.on(
    "mouseenter",
    EVENT_MARKER_LAYER_ID,
    (event) => {
      map.getCanvas().style.cursor = "pointer";

      const feature = event.features?.[0];

      if (
        !feature ||
        feature.geometry.type !== "Point"
      ) {
        return;
      }

      previewPopup
        .setLngLat(
          feature.geometry.coordinates as [
            number,
            number,
          ],
        )
        .setDOMContent(
          createEventPreview(
            feature.properties as EventProperties,
          ),
        )
        .addTo(map);
    },
  );

  map.on(
    "mouseleave",
    EVENT_MARKER_LAYER_ID,
    () => {
      map.getCanvas().style.cursor = "";
      previewPopup.remove();
    },
  );

  map.on(
    "click",
    EVENT_MARKER_LAYER_ID,
    (event) => {
      const feature = event.features?.[0];
      const eventId = Number(
        feature?.properties?.id,
      );

      if (!Number.isFinite(eventId)) return;

      previewPopup.remove();

      const ids: number[] = JSON.parse(feature?.properties?.ids ?? "[]");
      if (ids.length > 1) handlers.onSelectVenue(ids);
      else handlers.onSelectEvent(eventId);
    },
  );

  map.on(
    "mouseenter",
    EVENT_CLUSTER_LAYER_ID,
    () => {
      map.getCanvas().style.cursor = "pointer";
    },
  );

  map.on(
    "mouseleave",
    EVENT_CLUSTER_LAYER_ID,
    () => {
      map.getCanvas().style.cursor = "";
    },
  );

  map.on(
    "click",
    EVENT_CLUSTER_LAYER_ID,
    (event) => {
      const feature = event.features?.[0];

      if (
        !feature ||
        feature.geometry.type !== "Point"
      ) {
        return;
      }

      const clusterId = Number(
        feature.properties?.cluster_id,
      );

      if (!Number.isFinite(clusterId)) return;

      const coordinates =
        feature.geometry.coordinates as [
          number,
          number,
        ];

      handlers.onClearSelection?.();

      const source = map.getSource(
        EVENT_SOURCE_ID,
      ) as GeoJSONSource | undefined;

      source?.getClusterExpansionZoom(
        clusterId,
        (error, zoom) => {
          if (
            error ||
            zoom === null ||
            zoom === undefined
          ) {
            return;
          }

          map.easeTo({
            center: coordinates,
            zoom,
            duration: 700,
          });
        },
      );
    },
  );
}

export function updateEventMarkers(
  map: Map,
  events: MappedWaterlooEvent[],
) {
  const source = map.getSource(
    EVENT_SOURCE_ID,
  ) as GeoJSONSource | undefined;

  source?.setData(eventsToGeoJson(events));
}
