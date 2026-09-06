import { formatDisplayTime } from "../utils/timeFormat";
import mapboxgl from "mapbox-gl";
import type { BuildingProperties } from "../data/buildings";
import type { GymApiResponse } from "../api/gymApi";
import { getActiveEventLayerIds } from "./eventLayers";

const HOVER_LAYERS = [
  "campus-building-circles",
  "residence-building-squares",
  "child-residence-building-squares",
];

const POPUP_CLASS = "uw-hover-popup";
const POPUP_STYLE_ID = "uw-hover-popup-styles";

function addPopupStyles() {
  if (document.getElementById(POPUP_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = POPUP_STYLE_ID;

  style.innerHTML = `
    .${POPUP_CLASS} .mapboxgl-popup-content {
      padding: 0;
      background: transparent;
      box-shadow: none;
      border-radius: 0;
    }

    .${POPUP_CLASS} .mapboxgl-popup-tip {
      border-top-color: rgba(255, 255, 255, 0.78) !important;
    }

    .uw-hover-card {
      width: 200px;
      padding: 12px 14px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.78);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
      color: #0f172a;
      font-family: "Figtree", sans-serif;
    }

    .uw-hover-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }

    .uw-hover-info {
      min-width: 0;
    }

    .uw-hover-name {
      color: #0f172a;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.25;
    }

    .uw-hover-abbreviation {
      margin-top: 2px;
      color: #64748b;
      font-size: 12px;
      font-weight: 500;
    }

    .uw-hover-status {
      flex-shrink: 0;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }

    .uw-hover-status-open {
      background: rgba(34, 197, 94, 0.12);
      color: #16a34a;
    }

    .uw-hover-status-closed {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
    }

    .uw-hover-hours {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(148, 163, 184, 0.2);
    }

    .uw-hover-meta-row {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .uw-hover-meta-row + .uw-hover-meta-row {
      margin-top: 2px;
    }

    .uw-hover-meta-icon {
      flex-shrink: 0;
      width: 13px;
      height: 13px;
      color: #64748b;
    }

    .uw-hover-meta-text {
      color: #475569;
      font-size: 11px;
      font-weight: 500;
      line-height: 1.35;
    }
  `;

  document.head.appendChild(style);
}

function clockIcon() {
  return `
    <svg
      class="uw-hover-meta-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9"></circle>
      <polyline points="12 7 12 12 15 14"></polyline>
    </svg>
  `;
}

function hourglassIcon() {
  return `
    <svg
      class="uw-hover-meta-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2h12"></path>
      <path d="M6 22h12"></path>
      <path d="M8 2v6a4 4 0 0 0 8 0V2"></path>
      <path d="M16 22v-6a4 4 0 0 0-8 0v6"></path>
    </svg>
  `;
}

function getOpenStatus(liveHours: string | null | undefined) {
  if (!liveHours) return null;

  const normalized = liveHours.trim().toLowerCase();

  if (normalized === "closed") {
    return {
      label: "Closed",
      className: "uw-hover-status uw-hover-status-closed",
    };
  }

  const times = liveHours.split(/\s*[–—-]\s*/);

  if (times.length !== 2) {
    return null;
  }

  const openMinutes = parseTimeToMinutes(times[0]);

  let closeMinutes = parseTimeToMinutes(times[1]);

  if (openMinutes === null || closeMinutes === null) {
    return null;
  }

  let now = getTorontoMinutesNow();

  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60;

    if (now < openMinutes) {
      now += 24 * 60;
    }
  }

  const isOpen = now >= openMinutes && now < closeMinutes;

  return {
    label: isOpen ? "Open" : "Closed",
    className: isOpen
      ? "uw-hover-status uw-hover-status-open"
      : "uw-hover-status uw-hover-status-closed",
  };
}

function getTorontoDayName() {
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    timeZone: "America/Toronto",
  }).format(new Date());
}

function getTorontoMinutesNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);

  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0,
  );

  return hour * 60 + minute;
}

function parseTimeToMinutes(value: string) {
  const match = value.trim().match(/(\d{1,2})(?::(\d{2}))?\s*([AP]M)/i);

  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const period = match[3].toUpperCase();

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  return hour * 60 + minute;
}

function getGymHoverInfo(
  properties: BuildingProperties,
  gymInfo?: GymApiResponse,
) {
  const abbreviation = properties.abbreviation;

  if (abbreviation !== "PAC" && abbreviation !== "CIF") {
    return null;
  }

  const gym = gymInfo?.[abbreviation];

  if (!gym) return null;

  const today = getTorontoDayName();
  const liveHours = gym.hours[today];

  if (!liveHours) return null;

  if (liveHours.trim().toLowerCase() === "closed") {
    return {
      liveHours: "Closed",
      timeRemaining: null,
      isOpen: false,
    };
  }

  const times = liveHours.split("-");

  if (times.length !== 2) {
    return {
      liveHours,
      timeRemaining: null,
      isOpen: null,
    };
  }

  const openMinutes = parseTimeToMinutes(times[0]);
  const closeMinutes = parseTimeToMinutes(times[1]);

  if (openMinutes === null || closeMinutes === null) {
    return {
      liveHours,
      timeRemaining: null,
      isOpen: null,
    };
  }

  const now = getTorontoMinutesNow();

  const isOpen = now >= openMinutes && now < closeMinutes;

  if (!isOpen) {
    return {
      liveHours,
      timeRemaining: null,
      isOpen: false,
    };
  }

  const remainingMinutes = closeMinutes - now;

  const hours = Math.floor(remainingMinutes / 60);

  const minutes = remainingMinutes % 60;

  const timeRemaining =
    hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;

  return {
    liveHours,
    timeRemaining,
    isOpen: true,
  };
}

function buildHoursSection(
  liveHours: string | null | undefined,
  timeRemaining: string | null | undefined,
) {
  if (!liveHours) return "";

  return `
    <div class="uw-hover-hours">
      <div class="uw-hover-meta-row">
        ${clockIcon()}

        <div class="uw-hover-meta-text">
          ${formatDisplayTime(liveHours)}
        </div>
      </div>

      ${
        timeRemaining
          ? `
            <div class="uw-hover-meta-row">
              ${hourglassIcon()}

              <div class="uw-hover-meta-text">
                ${timeRemaining}
              </div>
            </div>
          `
          : ""
      }
    </div>
  `;
}

function buildPopupHTML(
  properties: BuildingProperties,
  gymInfo?: GymApiResponse,
) {
  const gymHoverInfo = getGymHoverInfo(properties, gymInfo);

  const liveHours = gymHoverInfo?.liveHours ?? properties.liveHours;

  const timeRemaining = gymHoverInfo?.timeRemaining ?? properties.timeRemaining;

  let status;

  if (gymHoverInfo?.isOpen === true) {
    status = {
      label: "Open",
      className: "uw-hover-status uw-hover-status-open",
    };
  } else if (gymHoverInfo?.isOpen === false) {
    status = {
      label: "Closed",
      className: "uw-hover-status uw-hover-status-closed",
    };
  } else {
    status = getOpenStatus(liveHours);
  }

  return `
    <div class="uw-hover-card">
      <div class="uw-hover-header">
        <div class="uw-hover-info">
          <div class="uw-hover-name">
            ${properties.name ?? ""}
          </div>

          ${
            properties.abbreviation
              ? `
                <div class="uw-hover-abbreviation">
                  ${properties.abbreviation}
                </div>
              `
              : ""
          }
        </div>

        ${
          status
            ? `
              <div class="${status.className}">
                ${status.label}
              </div>
            `
            : ""
        }
      </div>

      ${buildHoursSection(liveHours, timeRemaining)}
    </div>
  `;
}

function clearBuildingHover(map: mapboxgl.Map) {
  if (map.getLayer("campus-building-hover")) {
    map.setFilter("campus-building-hover", ["==", ["get", "id"], ""]);
  }

  if (map.getLayer("residence-building-hover")) {
    map.setFilter("residence-building-hover", ["==", ["get", "id"], ""]);
  }
}

function setBuildingHover(
  map: mapboxgl.Map,
  layerId: string,
  buildingId: string,
) {
  if (
    layerId === "campus-building-circles" &&
    map.getLayer("campus-building-hover")
  ) {
    map.setFilter("campus-building-hover", ["==", ["get", "id"], buildingId]);
  }

  if (
    (layerId === "residence-building-squares" ||
      layerId === "child-residence-building-squares") &&
    map.getLayer("residence-building-hover")
  ) {
    map.setFilter("residence-building-hover", [
      "==",
      ["get", "id"],
      buildingId,
    ]);
  }
}

function isHoveringEvent(map: mapboxgl.Map, point: mapboxgl.PointLike) {
  if (map.getContainer().dataset.foodHover === "true") return true;
  const eventLayers = [
    ...getActiveEventLayerIds(map),
    ...[
      "journey-stops",
      "transit-stop-markers",
      "transit-vehicle-markers",
    ].filter((id) => map.getLayer(id)),
  ];

  if (!eventLayers.length) return false;

  return (
    map.queryRenderedFeatures(point, {
      layers: eventLayers,
    }).length > 0
  );
}

export function addBuildingHoverPopup(
  map: mapboxgl.Map,
  onBuildingClick?: (properties: BuildingProperties) => void,
  getGymInfo?: () => GymApiResponse | undefined,
) {
  addPopupStyles();

  const hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 18,
    className: POPUP_CLASS,
  });

  map.getContainer().addEventListener("food-preview-open", () => {
    hoverPopup.remove();
    clearBuildingHover(map);
  });

  HOVER_LAYERS.forEach((layerId) => {
    map.on("mouseenter", layerId, (event) => {
      if (isHoveringEvent(map, event.point)) return;

      const feature = event.features?.[0];

      if (!feature) return;

      const geometry = feature.geometry as GeoJSON.Point;

      const coordinates = geometry.coordinates.slice() as [number, number];

      const properties = feature.properties as BuildingProperties;

      map.getCanvas().style.cursor = "pointer";

      setBuildingHover(map, layerId, properties.id);

      hoverPopup
        .setLngLat(coordinates)
        .setHTML(buildPopupHTML(properties, getGymInfo?.()))
        .addTo(map);
    });

    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";

      clearBuildingHover(map);

      hoverPopup.remove();
    });

    map.on("click", layerId, (event) => {
      if (isHoveringEvent(map, event.point)) return;

      const feature = event.features?.[0];

      if (!feature) return;

      const properties = feature.properties as BuildingProperties;

      hoverPopup.remove();

      onBuildingClick?.(properties);
    });
  });
}
