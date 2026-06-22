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
import MapControls from "./MapControls";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const DEFAULT_CATEGORIES: BuildingCategory[] = [
  "academic",
  "library",
  "gym",
  "student-life",
  "residence",
];

function Map() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const userLocationRef = useRef<[number, number] | null>(null);

  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [is3D, setIs3D] = useState(true);

  const [libraryHours, setLibraryHours] = useState<any>({});
  const [, setGymInfo] = useState<any>({});
  const [, setFoodInfo] = useState<any>({});

  const [activeCategories, setActiveCategories] =
    useState<BuildingCategory[]>(DEFAULT_CATEGORIES);

  function toggleCategory(category: BuildingCategory) {
    setActiveCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  function resetFilters() {
    setActiveCategories(DEFAULT_CATEGORIES);
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

  function resetMap() {
    if (!mapInstance) return;

    mapInstance.easeTo({
      center: [-80.544, 43.471],
      zoom: 15,
      pitch: 60,
      bearing: -26,
      duration: 1000,
    });

    setIs3D(true);
    resetFilters();
  }

  function flyToMe() {
    if (!mapInstance) return;

    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    if (userLocationRef.current) {
      mapInstance.flyTo({
        center: userLocationRef.current,
        zoom: 16,
        pitch: is3D ? 60 : 0,
        bearing: -26,
        duration: 2000,
      });

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocationRef.current = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        mapInstance.flyTo({
          center: userLocationRef.current,
          zoom: 16,
          pitch: is3D ? 60 : 0,
          bearing: -26,
          duration: 2000,
        });
      },
      () => {
        console.warn("Geolocation permission denied.");
      }
    );
  }

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = createMap(mapContainer.current);
    setMapInstance(map);

    map.on("load", () => {
      hideDefaultLabels(map);
      addImportantBuildingLayers(map);
      addBuildingHoverPopup(map);
      updateBuildingFilters(map, DEFAULT_CATEGORIES);
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
        onResetFilters={resetFilters}
      />

      <MapControls
        is3D={is3D}
        onReset={resetMap}
        onToggleView={toggleView}
        onFlyToMe={flyToMe}
      />

      <div className="h-full w-full" ref={mapContainer} />
    </div>
  );
}

export default Map;