import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { buildings } from "../data/buildings";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function Map() {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-80.5440, 43.4710], 
      zoom: 15,
      minZoom: 13,
      maxZoom: 19,
      pitch: 0,
      bearing: -26,
    });

    map.on("load", () => {
      const layers = map.getStyle().layers;

      // Remove unnecessary symbols except road names
      layers?.forEach((layer) => {
        if (
          layer.type === "symbol" &&
          !layer.id.includes("road-label")
        ) {
          map.setLayoutProperty(layer.id, "visibility", "none");
        }
      });

      // Buildings customization
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
          "fill-extrusion-base": [
            "coalesce",
            ["get", "min_height"],
            0,
          ],
          "fill-extrusion-opacity": 0.22,
        },
      });

      // Adding important buildings markers
      map.addSource("important-buildings", {
        type: "geojson",
        data: buildings,
      });

      // Add glow to building markers
      map.addLayer({
        id: "important-building-glow",
        type: "circle",
        source: "important-buildings",
        paint: {
          "circle-radius": 14,
          "circle-color": [
            "match",
            ["get", "category"],
            "library",
            "#ef4444",
            "academic",
            "#22c55e",
            "gym",
            "#f97316",
            "residence",
            "#38bdf8",
            "#facc15"
          ],
          "circle-opacity": 0.22,
          "circle-blur": 0.8
        },
      });

      // Adding building markers
      map.addLayer({
        id: "important-building-circles",
        type: "circle",
        source: "important-buildings",
        paint: {
          "circle-radius": 6,
          "circle-color": [
            "match",
            ["get", "category"],
            "library",
            "#ef4444",
            "academic",
            "#22c55e",
            "gym",
            "#f97316",
            "residence",
            "#38bdf8",
            "#facc15"
          ],
          "circle-opacity": 0.9,
          "circle-stroke-color": [
            "match",
            ["get", "category"],
            "library",
            "#fca5a5",
            "academic",
            "#86efac",
            "gym",
            "#fdba74",
            "residence",
            "#7dd3fc",
            "#fde68a"
          ],
          "circle-stroke-width": 2,
          "circle-stroke-opacity": 0.9
        },
      });

      const hoverPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 14,
      });
      
      map.on("mouseenter", "important-building-circles", (e) => {
        map.getCanvas().style.cursor = "pointer";
      
        const feature = e.features?.[0];
        if (!feature) return;
      
        const coordinates = (
          feature.geometry as GeoJSON.Point
        ).coordinates.slice() as [number, number];
      
        const properties = feature.properties as {
          name?: string;
          abbreviation?: string;
          description?: string;
        };
      
        hoverPopup
          .setLngLat(coordinates)
          .setHTML(`
            <div style="min-width: 160px;">
              <strong>${properties.name ?? ""}</strong>
              <div style="font-size: 12px; opacity: 0.7;">
                ${properties.abbreviation ?? ""}
              </div>
            </div>
          `)
          .addTo(map);
      });
      
      map.on("mouseleave", "important-building-circles", () => {
        map.getCanvas().style.cursor = "";
        hoverPopup.remove();
      });
    });

    return () => map.remove();
  }, []);

  return <div className="h-screen w-screen" ref={mapContainer} />;
}

export default Map;