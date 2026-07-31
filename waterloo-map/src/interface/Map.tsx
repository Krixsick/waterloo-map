import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

//components
import { SearchBar } from "./searchbar/SearchBar";
import { LoadingScreen } from "./loading/LoadingScreen";
import TransitDetailsCard from "./TransitDetailsCard";

//utility functions
import { buildings } from "../data/buildings";
import { createMap } from "../map/createMap";
import { hideDefaultLabels } from "../map/mapStyle";
import { addImportantBuildingLayers } from "../map/buildingLayers";
import { addBuildingHoverPopup } from "../map/buildingHover";
import { updateBuildingFilters } from "../map/buildingFilters";
import {
  addTransitLayers,
  updateTransitStops,
  updateTransitVehicles,
} from "../map/transitLayers";

//apis
import { useLibraryHours } from "../api/libraryApi";
import { useTransitStops, useTransitVehicles } from "../api/transitApi";

import type { BuildingCategory } from "../data/buildings";
import type {
  TransitStatus,
  TransitSelection,
  TransitStop,
  TransitVehicle,
} from "../types/transit";
import MapFilters from "./MapFilters";
import MapControls from "./MapControls";

import { getTimeRemaining } from "../utils/timeUtils";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const DEFAULT_CATEGORIES: BuildingCategory[] = [
  "academic",
  "library",
  "gym",
  "student-life",
  "residence",
];
const NO_TRANSIT_VEHICLES: TransitVehicle[] = [];
const NO_TRANSIT_STOPS: TransitStop[] = [];

function Map() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const userLocationRef = useRef<[number, number] | null>(null);

  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const [showTransit, setShowTransit] = useState(false);
  const [selectedTransit, setSelectedTransit] =
    useState<TransitSelection | null>(null);

  const { data: libraryHours = {} } = useLibraryHours();
  const {
    data: transitResponse,
    isError: isTransitError,
    isPending: isTransitPending,
  } = useTransitVehicles(showTransit);
  const {
    data: transitStopsResponse,
    isError: isTransitStopsError,
    isPending: isTransitStopsPending,
  } = useTransitStops(showTransit);
  const transitVehicles = transitResponse?.data ?? NO_TRANSIT_VEHICLES;
  const transitStops = transitStopsResponse?.data ?? NO_TRANSIT_STOPS;
  const hasTransitFeedProblem = [
    ...(transitResponse?.feeds ?? []),
    ...(transitStopsResponse?.feeds ?? []),
  ].some((feed) => feed.isStale || feed.error);
  const hasTransitData = transitStops.length > 0 || transitVehicles.length > 0;
  let transitStatus: TransitStatus = transitVehicles.length
    ? "live"
    : "scheduled";

  if (hasTransitFeedProblem || isTransitError || isTransitStopsError) {
    transitStatus = "partial";
  }
  if (!hasTransitData && (isTransitPending || isTransitStopsPending)) {
    transitStatus = "loading";
  }
  if (isTransitError && isTransitStopsError) transitStatus = "error";

  const currentTransitSelection =
    selectedTransit?.type === "vehicle"
      ? {
          type: "vehicle" as const,
          vehicle:
            transitVehicles.find(
              (vehicle) => vehicle.id === selectedTransit.vehicle.id,
            ) ?? selectedTransit.vehicle,
        }
      : selectedTransit;

  const [activeCategories, setActiveCategories] =
    useState<BuildingCategory[]>(DEFAULT_CATEGORIES);

  const buildingsWithBackendInfo = useMemo(() => {
    return {
      ...buildings,
      features: buildings.features.map((feature) => {
        const libraryInfo = libraryHours[feature.properties.name];
        const liveHours = libraryInfo?.[0]?.time ?? null;

        return {
          ...feature,
          properties: {
            ...feature.properties,
            liveHours,
            timeRemaining: getTimeRemaining(liveHours),
          },
        };
      }),
    };
  }, [libraryHours]);

  function toggleCategory(category: BuildingCategory) {
    setActiveCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  function resetFilters() {
    setActiveCategories(DEFAULT_CATEGORIES);
    setShowTransit(false);
    setSelectedTransit(null);
  }

  function toggleTransit() {
    if (showTransit) setSelectedTransit(null);
    setShowTransit((current) => !current);
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
    //checks to see if user has location or not
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
      },
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
      addTransitLayers(map, {
        onSelectStop: (stop) => setSelectedTransit({ type: "stop", stop }),
        onSelectVehicle: (vehicle) =>
          setSelectedTransit({ type: "vehicle", vehicle }),
      });
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
    if (!mapInstance || !isMapLoaded) return;

    const source = mapInstance.getSource("important-buildings") as
      | mapboxgl.GeoJSONSource
      | undefined;

    source?.setData(buildingsWithBackendInfo);
  }, [mapInstance, isMapLoaded, buildingsWithBackendInfo]);

  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return;
    updateTransitVehicles(mapInstance, showTransit ? transitVehicles : []);
  }, [mapInstance, isMapLoaded, showTransit, transitVehicles]);

  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return;
    updateTransitStops(mapInstance, showTransit ? transitStops : []);
  }, [mapInstance, isMapLoaded, showTransit, transitStops]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <LoadingScreen isComplete={isMapLoaded} />

      <SearchBar
        map={mapInstance}
        buildings={buildingsWithBackendInfo}
      />
      <TransitDetailsCard
        selection={currentTransitSelection}
        onClose={() => setSelectedTransit(null)}
      />
      <MapFilters
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        onResetFilters={resetFilters}
        showTransit={showTransit}
        onToggleTransit={toggleTransit}
        transitStopCount={transitStops.length}
        transitVehicleCount={transitVehicles.length}
        transitStatus={transitStatus}
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
