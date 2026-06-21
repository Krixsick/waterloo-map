import mapboxgl from "mapbox-gl";
import { buildings } from "../data/buildings";

type BuildingsGeoJSON = typeof buildings;

export function addImportantBuildingLayers(
  map: mapboxgl.Map,
  buildingData: BuildingsGeoJSON = buildings
) {
  // 3D building layer
  map.addLayer({
    id: "3d-buildings",
    source: "composite",
    "source-layer": "building",
    filter: ["==", "extrude", "true"],
    type: "fill-extrusion",
    minzoom: 15,
    paint: {
      "fill-extrusion-color": "#cbd5e1",
      "fill-extrusion-height": [
        "*",
        ["coalesce", ["get", "height"], 10],
        0.35,
      ],
      "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
      "fill-extrusion-opacity": 0.22,
    },
  });

  // Building data source
  map.addSource("important-buildings", {
    type: "geojson",
    data: buildingData,
  });

  map.addLayer({
    id: "campus-building-glow",
    type: "circle",
    source: "important-buildings",
    filter: ["!=", ["get", "category"], "residence"],
    paint: {
      "circle-radius": 14,
      "circle-color": "#22c55e",
      "circle-opacity": 0.22,
      "circle-blur": 0.8,
    },
  });

  map.addLayer({
    id: "campus-building-circles",
    type: "circle",
    source: "important-buildings",
    filter: ["!=", ["get", "category"], "residence"],
    paint: {
      "circle-radius": 6,
      "circle-color": "#22c55e",
      "circle-opacity": 0.95,
      "circle-stroke-color": "#86efac",
      "circle-stroke-width": 2,
    },
  });

  if (!map.hasImage("green-square")) {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;

    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(6, 6, 20, 20);

      ctx.strokeStyle = "#86efac";
      ctx.lineWidth = 3;
      ctx.strokeRect(6, 6, 20, 20);

      const imageData = ctx.getImageData(0, 0, 32, 32);
      map.addImage("green-square", imageData);
    }
  }

  map.addLayer({
    id: "residence-building-squares",
    type: "symbol",
    source: "important-buildings",
    filter: ["==", ["get", "category"], "residence"],
    layout: {
      "icon-image": "green-square",
      "icon-size": 0.7,
      "icon-allow-overlap": true,
    },
  });
}