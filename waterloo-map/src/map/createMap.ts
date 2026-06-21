import mapboxgl from "mapbox-gl";

export function createMap(container: HTMLDivElement) {
  return new mapboxgl.Map({
    container,
    style: "mapbox://styles/mapbox/streets-v12",
    center: [-80.544, 43.471],
    zoom: 15,
    minZoom: 13,
    maxZoom: 19,
    pitch: 60,
    bearing: -26,
  });
}