import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { createMap } from "../map/createMap";
import { hideDefaultLabels } from "../map/mapStyle";
import { addImportantBuildingLayers } from "../map/buildingLayers";
import { addBuildingHoverPopup } from "../map/buildingHover";

import { fetchCampusFood } from "../api/foodApi";
import { fetchLibraryHours } from "../api/libraryApi";
import { fetchGymInfo } from "../api/gymApi";

import BuildingSearch from "./BuildingSearch";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function Map() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = createMap(mapContainer.current);
    setMapInstance(map);

    map.on("load", () => {
      hideDefaultLabels(map);
      addImportantBuildingLayers(map);
      addBuildingHoverPopup(map);
    });

    return () => {
      map.remove();
      setMapInstance(null);
    };
  }, []);

  useEffect(() => {
    async function testApis() {
      try {
        console.log("FOOD");
        console.log(await fetchCampusFood());

        console.log("LIBRARY");
        console.log(await fetchLibraryHours());

        console.log("GYM");
        console.log(await fetchGymInfo());
      } catch (error) {
        console.error(error);
      }
    }

    testApis();
  }, []);

  return (
    <div className="relative h-screen w-screen">
      <BuildingSearch map={mapInstance} />
      <div className="h-full w-full" ref={mapContainer} />
    </div>
  );
}

export default Map;