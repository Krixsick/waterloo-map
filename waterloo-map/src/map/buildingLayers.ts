import type { Map as MapboxMap } from "mapbox-gl";
import { buildings } from "../data/buildings";

type BuildingsGeoJSON = typeof buildings;

export function addImportantBuildingLayers(
  map: MapboxMap,
  buildingData: BuildingsGeoJSON = buildings
) {
  map.addLayer({
    id: "3d-buildings",
    source: "composite",
    "source-layer": "building",
    filter: ["==", "extrude", "true"],
    type: "fill-extrusion",
    minzoom: 15,
    paint: {
      "fill-extrusion-color": "#cbd5e1",
      "fill-extrusion-height": ["*", ["coalesce", ["get", "height"], 10], 0.35],
      "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
      "fill-extrusion-opacity": 0.22,
    },
  });

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

  map.addLayer({
    id: "campus-building-hover",
    type: "circle",
    source: "important-buildings",
    filter: ["==", ["get", "id"], ""],
    paint: {
      "circle-radius": 6.5,
      "circle-color": "#22c55e",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 3,
      "circle-opacity": 1,
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

  if (!map.hasImage("hover-square")) {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;

    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.clearRect(0, 0, 32, 32);

      ctx.fillStyle = "#22c55e";
      ctx.fillRect(5, 5, 22, 22);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.strokeRect(5, 5, 22, 22);

      const imageData = ctx.getImageData(0, 0, 32, 32);
      map.addImage("hover-square", imageData);
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

  map.addLayer({
    id: "residence-building-hover",
    type: "symbol",
    source: "important-buildings",
    filter: ["==", ["get", "id"], ""],
    layout: {
      "icon-image": "hover-square",
      "icon-size": 0.7,
      "icon-allow-overlap": true,
    },
  });
}
