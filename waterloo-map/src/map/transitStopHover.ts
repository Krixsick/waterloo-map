import { Popup, type Map, type MapMouseEvent } from "mapbox-gl";
import type { TransitStop } from "../types/transit";
import { transitRouteColor } from "../utils/transitRoutes";
import { getActiveEventLayerIds } from "./eventLayers";

// Feed text is assigned as textContent, never interpreted as HTML.
function stopCard(stop: TransitStop, onSelect: () => void) {
  const card = document.createElement("section");
  card.className = "transit-stop-preview";
  card.setAttribute("aria-label", `${stop.name} stop preview`);

  const meta = document.createElement("p");
  meta.className = "transit-stop-preview-meta";
  meta.textContent = `${stop.mode === "ion" ? "ION station" : "Bus stop"} · Stop ${stop.stopId}`;
  const title = document.createElement("h3");
  title.className = "transit-stop-preview-title";
  title.textContent = stop.name;
  card.append(meta, title);

  const label = document.createElement("p");
  label.className = "transit-stop-preview-label";
  label.textContent = "Routes serving this stop";
  const routes = document.createElement("div");
  routes.className = "transit-stop-preview-routes";
  const routeIds = [...new Set(stop.routeIds)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  for (const routeId of routeIds) {
    const badge = document.createElement("span");
    badge.className = "transit-stop-preview-route";
    badge.style.backgroundColor = transitRouteColor(stop.mode, routeId);
    badge.textContent = routeId;
    routes.append(badge);
  }
  if (!routeIds.length) routes.textContent = "Route information unavailable";
  card.append(label, routes);

  const action = document.createElement("button");
  action.type = "button";
  action.className = "transit-stop-preview-action";
  action.textContent = "View departures →";
  action.setAttribute("aria-label", `View departures from ${stop.name}`);
  action.addEventListener("click", onSelect);
  card.append(action);
  return card;
}

export function transitStopFromFeature(feature: GeoJSON.Feature): TransitStop | null {
  if (feature.geometry.type !== "Point" || !feature.properties) return null;
  const [longitude, latitude] = feature.geometry.coordinates;
  const properties = feature.properties;
  return {
    id: properties.id,
    stopId: properties.stopId,
    mode: properties.mode,
    name: properties.name,
    latitude,
    longitude,
    routeIds: typeof properties.routeIds === "string" && properties.routeIds
      ? properties.routeIds.split(", ") : [],
  };
}

export function addTransitStopHover(
  map: Map,
  targetLayer: string,
  highlightLayer: string,
  vehicleLayer: string,
  onSelect: (stop: TransitStop) => void,
) {
  const popup = new Popup({
    closeButton: false,
    closeOnClick: false,
    focusAfterOpen: false,
    offset: 16,
    maxWidth: "260px",
    className: "transit-stop-popup",
  });
  let hoveredId: string | null = null;
  let dismissedId: string | null = null;
  let leaveTimer: ReturnType<typeof setTimeout> | undefined;

  function cancelLeave() {
    clearTimeout(leaveTimer);
  }
  function clear() {
    cancelLeave();
    hoveredId = null;
    popup.remove();
    if (map.getLayer(highlightLayer)) map.setFilter(highlightLayer, ["==", ["get", "id"], ""]);
    map.getCanvas().style.cursor = "";
  }
  function scheduleLeave() {
    cancelLeave();
    leaveTimer = setTimeout(clear, 160);
  }
  function show(event: MapMouseEvent & { features?: GeoJSON.Feature[] }) {
    if (!window.matchMedia("(hover: hover)").matches || map.isMoving()) return;
    const overlays = [vehicleLayer, ...getActiveEventLayerIds(map)].filter((id) => map.getLayer(id));
    if (overlays.length && map.queryRenderedFeatures(event.point, { layers: overlays }).length) {
      clear();
      return;
    }
    const feature = event.features?.[0];
    const stop = feature ? transitStopFromFeature(feature) : null;
    if (!stop || stop.id === dismissedId) return;
    cancelLeave();
    map.getCanvas().style.cursor = "pointer";
    if (hoveredId === stop.id) return;
    hoveredId = stop.id;
    map.setFilter(highlightLayer, ["==", ["get", "id"], stop.id]);
    const card = stopCard(stop, () => { clear(); onSelect(stop); });
    card.addEventListener("mouseenter", cancelLeave);
    card.addEventListener("mouseleave", scheduleLeave);
    card.addEventListener("focusin", cancelLeave);
    card.addEventListener("focusout", (focusEvent) => {
      if (!card.contains(focusEvent.relatedTarget as Node | null)) scheduleLeave();
    });
    popup.setLngLat([stop.longitude, stop.latitude]).setDOMContent(card).addTo(map);
  }
  function leave() {
    dismissedId = null;
    scheduleLeave();
  }
  function dismiss(event: KeyboardEvent) {
    if (event.key !== "Escape" || !hoveredId) return;
    dismissedId = hoveredId;
    clear();
  }
  map.on("mousemove", targetLayer, show);
  map.on("mouseleave", targetLayer, leave);
  map.on("movestart", clear);
  map.on("click", clear);
  document.addEventListener("keydown", dismiss);
  map.on("remove", () => {
    cancelLeave();
    popup.remove();
    document.removeEventListener("keydown", dismiss);
  });
  return clear;
}
