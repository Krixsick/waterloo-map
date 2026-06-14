import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { createMap } from "../map/createMap";
import { hideDefaultLabels } from "../map/mapStyle";
import { addImportantBuildingLayers } from "../map/buildingLayers";
import { addBuildingHoverPopup } from "../map/buildingHover";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function Map() {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = createMap(mapContainer.current);

    map.on("load", () => {
      hideDefaultLabels(map);
      addImportantBuildingLayers(map);
      addBuildingHoverPopup(map);
    });

    return () => map.remove();
  }, []);

  return <div className="h-screen w-screen" ref={mapContainer} />;
}

export default Map;