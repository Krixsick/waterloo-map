import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { buildings } from "../data/buildings";
import { createMap } from "../map/createMap";
import { hideDefaultLabels } from "../map/mapStyle";
import { addImportantBuildingLayers } from "../map/buildingLayers";
import { addBuildingHoverPopup } from "../map/buildingHover";
import { updateBuildingFilters } from "../map/buildingFilters";

import { fetchCampusFood } from "../api/foodApi";
import { fetchLibraryHours } from "../api/libraryApi";
import { fetchGymInfo } from "../api/gymApi";

import type { BuildingCategory } from "../data/buildings";
import BuildingSearch from "./BuildingSearch";
import MapFilters from "./MapFilters";
import MapViewToggle from "./MapViewToggle";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function Map() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const [libraryHours, setLibraryHours] = useState<any>({});
  const [gymInfo, setGymInfo] = useState<any>({});
  const [foodInfo, setFoodInfo] = useState<any>({});

  const [activeCategories, setActiveCategories] = useState<BuildingCategory[]>([
    "academic",
    "library",
    "gym",
    "student-life",
    "residence",
  ]);

  function toggleCategory(category: BuildingCategory) {
    setActiveCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  function toggleView() {
    if (!mapInstance) return;

    mapInstance.easeTo({
      pitch: is3D ? 0 : 60,
      bearing: -26,
      duration: 1000,
    });

    setIs3D(!is3D);
  }

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = createMap(mapContainer.current);
    setMapInstance(map);

    map.on("load", () => {
      hideDefaultLabels(map);
      addImportantBuildingLayers(map);
      addBuildingHoverPopup(map);
      updateBuildingFilters(map, activeCategories);
      setIsMapLoaded(true);
    });

    return () => {
      map.remove();
      setMapInstance(null);
      setIsMapLoaded(false);
    };
  }, []);

  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return;

    updateBuildingFilters(mapInstance, activeCategories);
  }, [mapInstance, isMapLoaded, activeCategories]);

  useEffect(() => {
    async function loadBackendData() {
      try {
        const [libraries, gyms, food] = await Promise.all([
          fetchLibraryHours(),
          fetchGymInfo(),
          fetchCampusFood(),
        ]);

        setLibraryHours(libraries);
        setGymInfo(gyms);
        setFoodInfo(food);
      } catch (error) {
        console.error("Failed to load backend data:", error);
      }
    }

    loadBackendData();
  }, []);

  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return;

    const buildingsWithBackendInfo = {
      ...buildings,
      features: buildings.features.map((feature) => {
        const libraryInfo = libraryHours[feature.properties.name];

        return {
          ...feature,
          properties: {
            ...feature.properties,
            liveHours: libraryInfo?.[0]?.time ?? null,
          },
        };
      }),
    };

    const source = mapInstance.getSource(
      "important-buildings"
    ) as mapboxgl.GeoJSONSource | undefined;

    source?.setData(buildingsWithBackendInfo);
  }, [mapInstance, isMapLoaded, libraryHours]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <BuildingSearch map={mapInstance} />

      <MapFilters
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
      />

      <MapViewToggle is3D={is3D} onToggle={toggleView} />

      <div className="h-full w-full" ref={mapContainer} />
    </div>
  );
}

export default Map;