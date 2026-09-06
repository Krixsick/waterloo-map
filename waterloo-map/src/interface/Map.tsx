import FoodFilters from "./FoodFilters";
import FoodDetailsCard from "./FoodDetailsCard";
import WalkingRoutes, { type DirectionsDestination } from "./WalkingRoutes";
import { FOOD_CATEGORY_DETAILS } from "../data/foodCategoryDetails";
import { FoodMarkers, foodIsOpen, foodMapKey } from "./FoodMap";
import {
  CalendarDays,
  UtensilsCrossed,
  BusFront,
  TrainFront,
  SquareParking,
} from "lucide-react";
import EventsPanel, { EventSummary } from "./EventsPanel";
import {
  filterEvents,
  upcomingEvents,
  type EventDateFilter,
} from "../utils/eventDiscovery";
import { matchBuilding } from "../utils/eventLocations";
import type { WaterlooEvent } from "../types/events";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// components
import { SearchBar } from "./searchbar/SearchBar";
import { LoadingScreen } from "./loading/LoadingScreen";
import BuildingDetailsCard from "./BuildingDetailsCard";
import EventDetailsCard from "./EventDetailsCard";
import TransitDetailsCard from "./TransitDetailsCard";
import { SideBar } from "./sidebar/Sidebar";
import MapFilters from "./MapFilters";
import MapControls from "./MapControls";
import ParkingMap from "./ParkingMap";
import { TransitRouteBar, TransitRouteCard } from "./TransitRoutes";

// utility functions
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
  updateTransitRoute,
} from "../map/transitLayers";

import { addEventLayers, updateEventMarkers } from "../map/eventLayers";

import { getTimeRemaining, getTodaysLibraryHours } from "../utils/timeUtils";

import { mapEventsToCampus } from "../utils/eventLocations";

// APIs
import { useLibraryHours, useLibraryOccupancy } from "../api/libraryApi";

import { useWaterlooEvents } from "../api/events";

import {
  useTransitRoutes,
  useTransitRouteDetail,
  useTransitStops,
  useTransitVehicles,
} from "../api/transitApi";

import { useGymInfo, type GymApiResponse } from "../api/gymApi";

import { useFood, type FoodInfo } from "../api/foodApi";

// types
import type { BuildingCategory, BuildingFeature } from "../data/buildings";

import type {
  TransitRoute,
  TransitMode,
  TransitStatus,
  TransitSelection,
  TransitStop,
  TransitVehicle,
} from "../types/transit";

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

const DEFAULT_TRANSIT_MODES: TransitMode[] = ["bus", "ion"];

function getExpandedParentId(buildingId: string | null) {
  if (!buildingId) return null;

  const building = buildings.features.find(
    ({ properties }) => properties.id === buildingId,
  );

  if (!building) return null;

  if (
    building.properties.category === "residence" &&
    building.properties.parentId
  ) {
    return building.properties.parentId;
  }

  const hasResidenceChildren = buildings.features.some(
    ({ properties }) =>
      properties.category === "residence" && properties.parentId === buildingId,
  );

  return hasResidenceChildren ? buildingId : null;
}

function Map() {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  const userLocationRef = useRef<[number, number] | null>(null);

  const gymInfoRef = useRef<GymApiResponse | undefined>(undefined);

  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const [is3D, setIs3D] = useState(true);

  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
    null,
  );

  const [activeCategories, setActiveCategories] =
    useState<BuildingCategory[]>(DEFAULT_CATEGORIES);

  const [selectedRoute, setSelectedRoute] = useState<TransitRoute | null>(null);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(
    null,
  );
  const fittedPatternRef = useRef<string | null>(null);
  const routeCardRef = useRef<HTMLElement | null>(null);

  const [showParking, setShowParking] = useState(false);

  const [showTransit, setShowTransit] = useState(false);

  const [eventDetailsExpanded, setEventDetailsExpanded] = useState(false);
  const [eventDateFilter, setEventDateFilter] =
    useState<EventDateFilter>("today");
  const [eventSearch, setEventSearch] = useState("");
  const [eventVenueIds, setEventVenueIds] = useState<number[] | null>(null);
  const [eventNow, setEventNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setEventNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const foodPreview =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("foodPreview") === "1";
  const [showFood, setShowFood] = useState(foodPreview);
  const [foodCategory, setFoodCategory] = useState("all");
  const [directionsMode, setDirectionsMode] = useState<"walk" | "transit">(
    "walk",
  );
  const [walkingMode, setWalkingMode] = useState(false);
  const [directionsRequest, setDirectionsRequest] = useState<{ id: number; destination: DirectionsDestination } | null>(null);
  const directionsRequestId = useRef(0);
  const [foodFocus, setFoodFocus] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(false);

  const [activeTransitModes, setActiveTransitModes] = useState<TransitMode[]>(
    DEFAULT_TRANSIT_MODES,
  );

  const [selectedTransit, setSelectedTransit] =
    useState<TransitSelection | null>(null);

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const expandedParentId = getExpandedParentId(selectedBuildingId);

  // --------------------
  // API DATA
  // --------------------

  const { data: libraryHours = {} } = useLibraryHours();

  const {
    data: gymInfo,
    isError: isGymError,
    isPending: isGymPending,
  } = useGymInfo();

  const {
    data: foodData = {},
    isPending: foodLoading,
    isError: foodError,
  } = useFood();

  useEffect(() => {
    gymInfoRef.current = gymInfo;
  }, [gymInfo]);

  const supportsLiveLibraryOccupancy =
    selectedBuildingId === "dp" || selectedBuildingId === "dc-library";

  const {
    data: libraryOccupancyResponse,
    isError: isLibraryOccupancyError,
    isPending: isLibraryOccupancyPending,
  } = useLibraryOccupancy(supportsLiveLibraryOccupancy);

  const {
    refetch: eventsQueryRetry,
    data: eventsResponse,
    isError: isEventsError,
    isPending: isEventsPending,
  } = useWaterlooEvents(true);

  const {
    data: transitResponse,
    isError: isTransitError,
    isPending: isTransitPending,
  } = useTransitVehicles(showTransit);

  const {
    data: transitStopsResponse,
    isError: isTransitStopsError,
    isPending: isTransitStopsPending,
  } = useTransitStops(true);

  const routesQuery = useTransitRoutes(true);
  const routeDetailQuery = useTransitRouteDetail(
    showTransit ? selectedRoute : null,
  );
  const routeDetail = routeDetailQuery.data?.data ?? null;
  const routePattern =
    routeDetail?.patterns.find((pattern) => pattern.id === selectedPatternId) ??
    routeDetail?.patterns[0] ??
    null;
  const availableRoutes = (routesQuery.data?.data ?? []).filter((route) =>
    activeTransitModes.includes(route.mode),
  );

  // --------------------
  // BUILDING DATA
  // --------------------

  const buildingsWithBackendInfo = useMemo(() => {
    return {
      ...buildings,

      features: buildings.features.map((feature) => {
        const libraryInfo = libraryHours[feature.properties.name];

        const liveHours = getTodaysLibraryHours(libraryInfo);

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

  const selectedBuilding = useMemo(
    () =>
      buildingsWithBackendInfo.features.find(
        ({ properties }) => properties.id === selectedBuildingId,
      ) ?? null,
    [buildingsWithBackendInfo, selectedBuildingId],
  );

  // --------------------
  // FOOD DATA
  // --------------------

  const [selectedOffCampus, setSelectedOffCampus] = useState<string | null>(null);
  const [foodOpenOnly, setFoodOpenOnly] = useState(true);
  const mappedFood = useMemo(
    () =>
      Object.values(foodData).filter((food) =>
        food.coordinates || buildings.features.some((b) => b.properties.id === food.buildingId),
      ),
    [foodData],
  );
  const openFoodCount = mappedFood.filter(foodIsOpen).length;
  const filteredFood = mappedFood.filter(
    (food) =>
      (foodPreview || !foodOpenOnly || foodIsOpen(food)) &&
      (foodCategory === "all" ||
        (foodCategory === "meals"
          ? (food.categories ?? [food.category]).some(category => !["cafe", "convenience", "dessert"].includes(category))
          : (food.categories ?? [food.category]).some(category => category === foodCategory))),
  );
  const selectFoodBuilding = useCallback((id: string) => {
    setShowParking(false);
    setSelectedOffCampus(id.startsWith("off-campus:") ? id : null);
    setSelectedBuildingId(id.startsWith("off-campus:") ? null : id);
    setSelectedEventId(null);
    setFoodFocus(id);
  }, []);
  function toggleFood() {
    setSelectedOffCampus(null);
    setShowParking(false);
    setShowFood((value) => !value);
    setShowEvents(false);
    setShowTransit(false);
    setSelectedBuildingId(null);
    setSelectedEventId(null);
    setSelectedTransit(null);
  }
  useEffect(() => {
    if (foodFocus && selectedBuildingId === foodFocus)
      document
        .getElementById("building-food-section")
        ?.scrollIntoView({ block: "nearest" });
  }, [foodFocus, selectedBuildingId]);

  const selectedBuildingFood = useMemo<FoodInfo[]>(() => {
    if (!selectedBuilding) {
      return [];
    }

    const buildingId = selectedBuilding.properties.id;

    const matchedFood = Object.values(foodData).filter(
      (food) => food.buildingId === buildingId,
    );

    console.log("selected building id:", buildingId);

    console.log("matched food:", matchedFood);

    return matchedFood.sort((a, b) => Number(foodIsOpen(b)) - Number(foodIsOpen(a)));
  }, [foodData, selectedBuilding]);

  // --------------------
  // LIBRARY OCCUPANCY
  // --------------------

  const selectedLibraryOccupancy = useMemo(() => {
    if (!selectedBuilding || !supportsLiveLibraryOccupancy) {
      return null;
    }

    return (
      libraryOccupancyResponse?.locations.find(
        ({ name }) => name === selectedBuilding.properties.name,
      ) ?? null
    );
  }, [
    libraryOccupancyResponse?.locations,
    selectedBuilding,
    supportsLiveLibraryOccupancy,
  ]);

  // --------------------
  // TRANSIT DATA
  // --------------------

  const transitVehicles = transitResponse?.data ?? NO_TRANSIT_VEHICLES;

  const transitStops = transitStopsResponse?.data ?? NO_TRANSIT_STOPS;

  const visibleTransitVehicles = useMemo(
    () =>
      transitVehicles.filter(
        (vehicle) =>
          activeTransitModes.includes(vehicle.mode) &&
          (!selectedRoute ||
            (vehicle.mode === selectedRoute.mode &&
              vehicle.routeId === selectedRoute.routeId)),
      ),
    [activeTransitModes, transitVehicles, selectedRoute],
  );

  const visibleTransitStops = useMemo(
    () =>
      (selectedRoute && routePattern
        ? routePattern.stops
        : transitStops
      ).filter(
        (stop) =>
          activeTransitModes.includes(stop.mode) &&
          (!selectedRoute ||
            (stop.mode === selectedRoute.mode &&
              stop.routeIds.includes(selectedRoute.routeId))),
      ),
    [activeTransitModes, transitStops, selectedRoute, routePattern],
  );

  const hasTransitFeedProblem = [
    ...(transitResponse?.feeds ?? []),
    ...(transitStopsResponse?.feeds ?? []),
  ].some((feed) => feed.isStale || feed.error);

  const hasTransitData =
    visibleTransitStops.length > 0 || visibleTransitVehicles.length > 0;

  let transitStatus: TransitStatus = visibleTransitVehicles.length
    ? "live"
    : "scheduled";

  if (hasTransitFeedProblem || isTransitError || isTransitStopsError) {
    transitStatus = "partial";
  }

  if (isTransitStopsPending || (!hasTransitData && isTransitPending)) {
    transitStatus = "loading";
  }

  if (isTransitError && isTransitStopsError) {
    transitStatus = "error";
  }

  const currentTransitSelection =
    selectedTransit?.type === "vehicle"
      ? {
          type: "vehicle" as const,
          vehicle:
            visibleTransitVehicles.find(
              (vehicle) => vehicle.id === selectedTransit.vehicle.id,
            ) ?? selectedTransit.vehicle,
        }
      : selectedTransit;

  // --------------------
  // EVENT DATA
  // --------------------

  const mappedEvents = useMemo(
    () => mapEventsToCampus(eventsResponse?.events ?? [], buildings),
    [eventsResponse?.events],
  );

  const filteredEvents = useMemo(
    () =>
      filterEvents(
        eventsResponse?.events ?? [],
        eventDateFilter,
        eventNow,
      ).filter((event) =>
        `${event.name} ${event.location}`
          .toLowerCase()
          .includes(eventSearch.toLowerCase()),
      ),
    [eventsResponse?.events, eventDateFilter, eventNow, eventSearch],
  );
  const visibleMappedEvents = useMemo(
    () =>
      mappedEvents.filter((event) =>
        filteredEvents.some((item) => item.id === event.id),
      ),
    [mappedEvents, filteredEvents],
  );
  const buildingEvents = useMemo(
    () =>
      upcomingEvents(eventsResponse?.events ?? [], eventNow).filter((event) => {
        const building = matchBuilding(event, buildings);
        return (
          building &&
          (building.properties.id === selectedBuildingId ||
            building.properties.parentId === selectedBuildingId)
        );
      }),
    [eventsResponse?.events, eventNow, selectedBuildingId],
  );
  const selectedEvent =
    eventsResponse?.events.find((event) => event.id === selectedEventId) ??
    null;
  function selectEvent(event: WaterlooEvent) {
    setShowParking(false);
    setEventDetailsExpanded(false);
    setSelectedBuildingId(null);
    setSelectedTransit(null);
    setSelectedEventId(event.id);
    const mapped = mappedEvents.find((item) => item.id === event.id);
    if (mapped) flyToEvent(mapped);
  }

  // --------------------
  // MAP ACTIONS
  // --------------------

  function flyToBuilding(building: BuildingFeature) {
    if (!mapInstance) return;

    const [longitude, latitude] = building.geometry.coordinates;

    mapInstance.flyTo({
      center: [longitude, latitude],
      zoom: 17,
      pitch: is3D ? 60 : 0,
      bearing: -26,
      duration: 1600,
      essential: true,
    });
  }

  function openDirections(destination: DirectionsDestination) {
    setDirectionsRequest({ id: ++directionsRequestId.current, destination });
    setDirectionsMode("walk");
    setWalkingMode(true);
    setShowParking(false);
    setShowFood(false);
    setShowEvents(false);
    setShowTransit(false);
    setSelectedBuildingId(null);
    setSelectedEventId(null);
    setSelectedTransit(null);
    setSelectedRoute(null);
    setSelectedPatternId(null);
    setIs3D(false);
    if (destination.coordinates) {
      mapInstance?.easeTo({ center: destination.coordinates, zoom: 16, pitch: 0, bearing: 0 });
    }
  }

  function selectBuilding(building: BuildingFeature) {
    setShowParking(false);
    setSelectedBuildingId(previous =>
      ["sju", "uwp"].includes(building.properties.id) && getExpandedParentId(previous) === building.properties.id ? null : building.properties.id,
    );

    setSelectedTransit(null);
    setSelectedEventId(null);

    flyToBuilding(building);
  }

  function flyToEvent(event: (typeof mappedEvents)[number]) {
    if (!mapInstance) return;

    mapInstance.flyTo({
      center: [event.coordinates.longitude, event.coordinates.latitude],
      zoom: Math.max(mapInstance.getZoom(), 17.25),
      pitch: is3D ? 48 : 0,
      bearing: -20,
      duration: 1200,
      essential: true,
    });
  }

  function toggleCategory(category: BuildingCategory) {
    setActiveCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  function resetFilters() {
    setShowParking(false);
    setWalkingMode(false);
    setShowFood(false);
    setFoodCategory("all");
    setActiveCategories(DEFAULT_CATEGORIES);

    setActiveTransitModes(DEFAULT_TRANSIT_MODES);

    setShowTransit(false);
    setSelectedRoute(null);
    setSelectedPatternId(null);
    setShowEvents(false);
    setSelectedBuildingId(null);
    setSelectedTransit(null);
    setSelectedEventId(null);
  }

  function toggleTransit() {
    setShowParking(false);
    setShowFood(false);
    setShowEvents(false);
    setSelectedTransit(null);
    setSelectedBuildingId(null);
    setSelectedEventId(null);
    setSelectedRoute(null);
    setSelectedPatternId(null);

    setShowTransit((current) => !current);
  }

  function toggleEvents() {
    setShowParking(false);
    setShowFood(false);
    setSelectedEventId(null);
    setSelectedBuildingId(null);
    setSelectedTransit(null);
    setShowTransit(false);
    setEventVenueIds(null);
    setShowEvents((current) => !current);
  }

  function toggleParking() {
    setWalkingMode(false);
    setShowParking((current) => !current);
    setShowTransit(false);
    setShowFood(false);
    setShowEvents(false);
    setSelectedRoute(null);
    setSelectedPatternId(null);
    setSelectedBuildingId(null);
    setSelectedTransit(null);
    setSelectedEventId(null);
    setIs3D(false);
  }

  function toggleTransitMode(mode: TransitMode) {
    if (selectedRoute?.mode === mode) {
      setSelectedRoute(null);
      setSelectedPatternId(null);
      setSelectedTransit(null);
    }
    const selectedMode =
      selectedTransit?.type === "vehicle"
        ? selectedTransit.vehicle.mode
        : selectedTransit?.type === "stop"
          ? selectedTransit.stop.mode
          : null;

    if (activeTransitModes.includes(mode) && selectedMode === mode) {
      setSelectedTransit(null);
    }

    setActiveTransitModes((current) =>
      current.includes(mode)
        ? current.filter((item) => item !== mode)
        : [...current, mode],
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
      },
    );
  }

  function selectRoute(route: TransitRoute | null) {
    setShowParking(false);
    setSelectedRoute(route);
    setSelectedPatternId(null);
    setSelectedTransit(null);
    setSelectedBuildingId(null);
    setSelectedEventId(null);
    setIs3D(false);
    if (!route)
      mapInstance?.easeTo({
        center: [-80.544, 43.471],
        zoom: 13.5,
        pitch: 0,
        bearing: 0,
        duration: 700,
      });
  }

  const fitSelectedRoute = useCallback(() => {
    if (!mapInstance || !routePattern) return;
    const coordinates =
      routePattern.coordinates.length > 1
        ? routePattern.coordinates
        : routePattern.stops.map((stop): [number, number] => [
            stop.longitude,
            stop.latitude,
          ]);
    if (!coordinates.length) return;
    const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
    coordinates.forEach((coordinate) => bounds.extend(coordinate));
    const width = mapInstance.getContainer().clientWidth;
    const height = mapInstance.getContainer().clientHeight;
    const wide = width >= 900;
    const cardBottom = routeCardRef.current
      ? routeCardRef.current.getBoundingClientRect().bottom -
        mapInstance.getContainer().getBoundingClientRect().top
      : 350;
    mapInstance.fitBounds(bounds, {
      padding: {
        top: wide ? 170 : Math.min(cardBottom + 16, height - 180),
        bottom: 85,
        left: wide ? 425 : 24,
        right: wide ? 90 : 76,
      },
      maxZoom: 15,
      pitch: 0,
      bearing: 0,
      retainPadding: false,
      duration: 900,
    });
  }, [mapInstance, routePattern]);

  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return;
    mapInstance.setMinZoom(walkingMode ? 5 : showTransit ? 9 : showParking ? 11 : 13);
    updateTransitRoute(
      mapInstance,
      showTransit ? selectedRoute : null,
      showTransit ? routePattern : null,
    );
    const key =
      showTransit && selectedRoute && routePattern
        ? `${selectedRoute.id}:${routePattern.id}`
        : null;
    if (key && key !== fittedPatternRef.current) fitSelectedRoute();
    fittedPatternRef.current = key;
  }, [
    mapInstance,
    isMapLoaded,
    showTransit,
    showParking,
    walkingMode,
    selectedRoute,
    routePattern,
    fitSelectedRoute,
  ]);

  // --------------------
  // INITIALIZE MAP
  // --------------------

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = createMap(mapContainer.current);

    setMapInstance(map);

    map.on("load", () => {
      hideDefaultLabels(map);

      addImportantBuildingLayers(map);

      addBuildingHoverPopup(
        map,
        ({ id }) => {
          if (!id) return;

          setSelectedBuildingId(previous =>
            ["sju", "uwp"].includes(id) && getExpandedParentId(previous) === id ? null : id,
          );
          setSelectedTransit(null);
          setSelectedEventId(null);
        },
        () => gymInfoRef.current,
      );

      addTransitLayers(map, {
        onSelectStop: (stop) => {
          setSelectedBuildingId(null);
          setSelectedEventId(null);

          setSelectedTransit({
            type: "stop",
            stop,
          });
        },

        onSelectVehicle: (vehicle) => {
          setSelectedBuildingId(null);
          setSelectedEventId(null);

          setSelectedTransit({
            type: "vehicle",
            vehicle,
          });
        },
      });

      addEventLayers(map, {
        onSelectVenue: (ids) => {
          setEventVenueIds(ids);
          setSelectedBuildingId(null);
          setSelectedTransit(null);
          setSelectedEventId(null);
          setShowEvents(true);
        },
        onSelectEvent: (eventId) => {
          setSelectedBuildingId(null);
          setSelectedTransit(null);
          setEventDetailsExpanded(false);
          setSelectedEventId(eventId);
        },

        onClearSelection: () => {
          setSelectedBuildingId(null);
          setSelectedTransit(null);
          setSelectedEventId(null);
        },
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

  // --------------------
  // BUILDING FILTERS
  // --------------------

  useEffect(() => {
    if (!mapInstance || !isMapLoaded) {
      return;
    }

    updateBuildingFilters(
      mapInstance,
      selectedRoute || showParking ? [] : activeCategories,
    );
  }, [mapInstance, isMapLoaded, activeCategories, selectedRoute, showParking]);

  // --------------------
  // UWP CHILDREN + GROUP HIGHLIGHT
  // --------------------

  useEffect(() => {
    if (!mapInstance || !isMapLoaded) {
      return;
    }

    const childFilter = expandedParentId
      ? [
          "all",
          ["==", ["get", "category"], "residence"],
          ["==", ["get", "parentId"], expandedParentId],
        ]
      : [
          "all",
          ["==", ["get", "category"], "residence"],
          ["==", ["get", "parentId"], ""],
        ];

    if (mapInstance.getLayer("child-residence-building-squares")) {
      mapInstance.setFilter("child-residence-building-squares", childFilter);
    }

    if (mapInstance.getLayer("child-residence-building-labels")) {
      mapInstance.setFilter("child-residence-building-labels", childFilter);
    }

    if (mapInstance.getLayer("selected-residence-group")) {
      const selectedGroupFilter = expandedParentId
        ? [
            "any",
            ["==", ["get", "id"], expandedParentId],
            [
              "all",
              ["==", ["get", "category"], "residence"],
              ["==", ["get", "parentId"], expandedParentId],
            ],
          ]
        : ["==", ["get", "id"], ""];

      mapInstance.setFilter("selected-residence-group", selectedGroupFilter);
    }
  }, [mapInstance, isMapLoaded, expandedParentId]);

  // --------------------
  // UPDATE BUILDING SOURCE
  // --------------------

  useEffect(() => {
    if (!mapInstance || !isMapLoaded) {
      return;
    }

    const source = mapInstance.getSource("important-buildings") as
      | mapboxgl.GeoJSONSource
      | undefined;

    source?.setData(buildingsWithBackendInfo);
  }, [mapInstance, isMapLoaded, buildingsWithBackendInfo]);

  // --------------------
  // UPDATE TRANSIT
  // --------------------

  useEffect(() => {
    if (!mapInstance || !isMapLoaded) {
      return;
    }

    updateTransitVehicles(
      mapInstance,
      showTransit ? visibleTransitVehicles : [],
    );
  }, [mapInstance, isMapLoaded, showTransit, visibleTransitVehicles]);

  useEffect(() => {
    if (!mapInstance || !isMapLoaded) {
      return;
    }

    updateTransitStops(
      mapInstance,
      showTransit ? visibleTransitStops : [],
      selectedRoute,
    );
  }, [
    mapInstance,
    isMapLoaded,
    showTransit,
    visibleTransitStops,
    selectedRoute,
  ]);

  // --------------------
  // UPDATE EVENTS
  // --------------------

  useEffect(() => {
    if (!mapInstance || !isMapLoaded) {
      return;
    }

    updateEventMarkers(mapInstance, showEvents ? visibleMappedEvents : []);
  }, [mapInstance, isMapLoaded, visibleMappedEvents, showEvents]);

  // --------------------
  // UI
  // --------------------

  return (
    <SideBar
      renderMenuPanel={(closeMenu) => (
        <MapFilters
          activeCategories={activeCategories}
          onToggleCategory={toggleCategory}
          onResetFilters={resetFilters}
          showParking={showParking}
          onToggleParking={toggleParking}
          showTransit={showTransit}
          onToggleTransit={toggleTransit}
          activeTransitModes={activeTransitModes}
          onToggleTransitMode={toggleTransitMode}
          transitStopCount={visibleTransitStops.length}
          transitVehicleCount={visibleTransitVehicles.length}
          transitStatus={transitStatus}
          showFood={showFood}
          onToggleFood={toggleFood}
          openFoodCount={openFoodCount}
          showEvents={showEvents}
          onToggleEvents={toggleEvents}
          eventCount={visibleMappedEvents.length}
          eventsLoading={showEvents && isEventsPending}
          eventsError={showEvents && isEventsError}
          onClose={closeMenu}
        />
      )}
    >
      <div className="relative h-svh w-full overflow-hidden">
        <LoadingScreen isComplete={isMapLoaded} />

        {mapInstance && isMapLoaded && (
          <WalkingRoutes
            key={`${directionsRequest?.id ?? "manual"}:${directionsMode}`}
            initialDestination={directionsRequest?.destination}
            onExplore={() => {
              setWalkingMode(false);
              setShowParking(false);
              setShowTransit(true);
            }}
            preferredMode={directionsMode}
            enabled={walkingMode}
            onEnabled={(value) => {
              setWalkingMode(value);
              if (value) {
                setShowParking(false);
                setShowFood(false);
                setShowEvents(false);
                setShowTransit(false);
                setSelectedEventId(null);
                setSelectedTransit(null);
              }
            }}
            onConsumeSelection={() => setSelectedBuildingId(null)}
            map={mapInstance}
            selectedId={selectedBuildingId}
          />
        )}
        <SearchBar
          items={[
            ...mappedFood.map((food) => ({
              id: `food:${food.id}`,
              name: food.name,
              icon: FOOD_CATEGORY_DETAILS[food.category].icon,
              iconStyles: "bg-emerald-50 text-[#13735a]",
              subtitle: `${FOOD_CATEGORY_DETAILS[food.category].label} · ${buildings.features.find((b) => b.properties.id === food.buildingId)?.properties.abbreviation ?? (food.buildingId?.toUpperCase() ?? "Off campus")}`,
              keywords: `${food.location ?? ""} ${food.description ?? ""} ${food.categories?.join(" ") ?? ""} ${food.categories?.includes("cafe") ? "coffee" : ""} ${food.category === "cafe" ? "coffee cafe café espresso tea" : ""} ${food.category === "convenience" ? "snacks convenience store" : "meals restaurant eat"}`,
              onSelect: () => {
                setShowFood(false);
                setShowTransit(false);
                setShowEvents(false);
                selectFoodBuilding(foodMapKey(food));
                const b = buildings.features.find(
                  (b) => b.properties.id === food.buildingId,
                );
                if (b || food.coordinates)
                  mapInstance?.flyTo({
                    center: food.coordinates ?? b!.geometry.coordinates as [number, number],
                    zoom: 17,
                  });
              },
            })),
            ...(routesQuery.data?.data ?? []).map((route) => ({
              id: `route:${route.id}`,
              icon: route.mode === "ion" ? TrainFront : BusFront,
              iconStyles:
                route.mode === "ion"
                  ? "bg-pink-50 text-pink-700"
                  : "bg-blue-50 text-blue-700",
              name: `${route.routeId} ${route.name}`,
              subtitle: `${route.mode === "ion" ? "ION light rail" : "Bus"} route`,
              keywords: `transit grt ${route.mode === "ion" || route.routeId === "301" ? "ion train light rail 301" : "bus"}`,
              onSelect: () => {
                setShowFood(false);
                setShowEvents(false);
                setShowParking(false);
                setShowTransit(true);
                setSelectedBuildingId(null);
                setSelectedEventId(null);
                selectRoute(route);
              },
            })),
            ...transitStops.map((stop) => ({
              id: `stop:${stop.id}`,
              icon: stop.mode === "ion" ? TrainFront : BusFront,
              iconStyles:
                stop.mode === "ion"
                  ? "bg-pink-50 text-pink-700"
                  : "bg-blue-50 text-blue-700",
              name: stop.name,
              subtitle: `${stop.mode === "ion" ? "ION station" : "Bus stop"} · ${stop.stopId}`,
              keywords: `transit stop station ${stop.routeIds.join(" ")}`,
              onSelect: () => {
                setShowFood(false);
                setShowEvents(false);
                setShowParking(false);
                setShowTransit(true);
                setSelectedBuildingId(null);
                setSelectedEventId(null);
                setSelectedRoute(null);
                setSelectedTransit({ type: "stop", stop });
                mapInstance?.flyTo({
                  center: [stop.longitude, stop.latitude],
                  zoom: 17,
                });
              },
            })),
            ...upcomingEvents(eventsResponse?.events ?? [], eventNow).map(
              (event) => ({
                id: `event:${event.id}`,
                icon: CalendarDays,
                iconStyles: "bg-violet-50 text-[#7c3aed]",
                name: event.name,
                subtitle: `Event · ${event.location ?? ""}`,
                keywords: `${event.organizer ?? ""} ${event.description ?? ""}`,
                onSelect: () => {
                  setShowFood(false);
                  setShowTransit(false);
                  setShowEvents(true);
                  selectEvent(event);
                },
              }),
            ),
          ]}
          buildings={buildingsWithBackendInfo}
          onSelectBuilding={selectBuilding}
        />

        {!showTransit && !walkingMode && (
          <div className="absolute left-3 right-3 top-20 z-20 flex items-center gap-2 overflow-x-auto pb-1 sm:left-5 lg:right-auto">
            <button
              type="button"
              onClick={() => {
                setWalkingMode(false);
                toggleTransit();
              }}
              className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm"
            >
              <BusFront size={18} />
              Transit
            </button>
            <button
              type="button"
              aria-pressed={showEvents}
              onClick={() => {
                setWalkingMode(false);
                toggleEvents();
              }}
              className={`flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium shadow-sm ${showEvents ? "border-violet-200 bg-violet-50 text-[#7c3aed]" : "border-slate-200 bg-white text-slate-700"}`}
            >
              <CalendarDays size={18} />
              Events
            </button>
            <button
              type="button"
              aria-pressed={showFood}
              onClick={() => {
                setWalkingMode(false);
                toggleFood();
              }}
              className={`flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium shadow-sm ${showFood ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700"}`}
            >
              <UtensilsCrossed size={18} />
              Food
            </button>
            <button
              type="button"
              aria-pressed={showParking}
              onClick={toggleParking}
              className={`flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium shadow-sm ${showParking ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700"}`}
            >
              <SquareParking size={18} />
              Parking
            </button>
          </div>
        )}
        {showParking && mapInstance && isMapLoaded && (
          <ParkingMap map={mapInstance} onClose={() => setShowParking(false)} />
        )}
        {selectedOffCampus && !showTransit && !showEvents && !showParking && !selectedBuildingId && (
          <section aria-label="Off-campus food details" className="absolute left-3 top-36 z-30 max-h-[calc(100%-10rem)] w-[380px] max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:left-5">
            <div className="mb-3 flex items-center justify-between"><div><h2 className="text-ui-title text-emerald-800">{mappedFood.filter(food => foodMapKey(food) === selectedOffCampus).length > 1 ? "Food at this location" : mappedFood.find(food => foodMapKey(food) === selectedOffCampus)?.name}</h2><span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-ui-meta text-emerald-700">Off campus</span></div><button aria-label="Close food details" className="cursor-pointer rounded-full px-3 py-1 text-xl" onClick={() => setSelectedOffCampus(null)}>×</button></div>
            <p className="mb-4 text-ui-meta text-slate-500">{mappedFood.find(food => foodMapKey(food) === selectedOffCampus)?.location?.replace(/, Unit[^,]*/i, "")}</p>
            {mappedFood.filter(food => foodMapKey(food) === selectedOffCampus).sort((a, b) => Number(foodIsOpen(b)) - Number(foodIsOpen(a))).map(food => <div key={food.id} className="mb-4">
              {food.location?.match(/Unit[^,]*/i) && <p className="mb-2 text-ui-meta text-slate-500">{food.location.match(/Unit[^,]*/i)?.[0]}</p>}
              <FoodDetailsCard food={food} defaultExpanded />
              <a className="mt-2 inline-block text-sm text-emerald-700 underline" href={food.url} target="_blank" rel="noreferrer">Visit website</a>
            </div>)}
          </section>
        )}
        {showFood && mapInstance && isMapLoaded && (
          <FoodMarkers
            preview={foodPreview}
            map={mapInstance}
            foods={filteredFood}
            allFoods={mappedFood}
            onSelect={selectFoodBuilding}
          />
        )}
        {showFood && !selectedBuildingId && !selectedOffCampus && (
          <div
            aria-label="Food map filters"
            className="absolute left-3 top-36 z-30 max-w-[calc(100%-1.5rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:left-5"
          >
            <FoodFilters openOnly={foodOpenOnly} onOpenOnly={setFoodOpenOnly} category={foodCategory} onCategory={setFoodCategory} />
            {foodLoading && (
              <p className="px-3 pt-2 text-xs text-slate-500">
                Loading food spots…
              </p>
            )}
            {foodError && (
              <p className="px-3 pt-2 text-xs text-red-600">
                Food information is unavailable. Please try again shortly.
              </p>
            )}
            {!foodLoading && !foodError && !filteredFood.length && (
              <p className="px-3 pb-1 pt-2 text-xs text-slate-500">
                No food spots match these filters.
              </p>
            )}
          </div>
        )}
        {showEvents && !selectedEvent && !selectedBuildingId && (
          <EventsPanel
            events={
              eventVenueIds
                ? filteredEvents.filter((event) =>
                    eventVenueIds.includes(event.id),
                  )
                : filteredEvents
            }
            filter={eventDateFilter}
            search={eventSearch}
            venue={Boolean(eventVenueIds)}
            loading={isEventsPending}
            error={isEventsError}
            partial={Boolean(eventsResponse?.hasMore)}
            onFilter={(value) => {
              setEventDateFilter(value);
              setEventVenueIds(null);
            }}
            onSearch={setEventSearch}
            onClearVenue={() => setEventVenueIds(null)}
            onSelect={selectEvent}
            onClose={toggleEvents}
            onRetry={() => {
              void eventsQueryRetry();
            }}
          />
        )}
        {showTransit && !selectedTransit && (
          <TransitRouteBar
            onPlanTrip={() => {
              setDirectionsRequest(null);
              setShowParking(false);
              setDirectionsMode("transit");
              setWalkingMode(true);
              setShowTransit(false);
              setSelectedBuildingId(null);
              setSelectedTransit(null);
              setSelectedEventId(null);
            }}
            enabled={showTransit}
            showHint={
              !selectedTransit && !selectedBuildingId && !selectedEventId
            }
            routes={availableRoutes}
            selectedRoute={selectedRoute}
            loading={routesQuery.isPending}
            error={routesQuery.isError}
            partial={Boolean(
              routesQuery.data?.feeds.some((feed) => feed.error),
            )}
            onToggle={toggleTransit}
            onSelect={selectRoute}
            onRetry={() => {
              void routesQuery.refetch();
            }}
          />
        )}
        {showTransit &&
          selectedRoute &&
          !selectedTransit &&
          !selectedBuildingId &&
          !selectedEventId && (
            <TransitRouteCard
              key={selectedRoute.id}
              route={selectedRoute}
              panelRef={routeCardRef}
              detail={routeDetail}
              pattern={routePattern}
              loading={routeDetailQuery.isPending}
              error={routeDetailQuery.isError}
              vehicles={visibleTransitVehicles.length}
              liveUnavailable={
                isTransitError ||
                isTransitPending ||
                Boolean(
                  transitResponse?.feeds.some(
                    (feed) =>
                      feed.mode === selectedRoute.mode &&
                      (feed.error || feed.isStale),
                  ),
                )
              }
              onPattern={(id) => {
                setSelectedPatternId(id);
                setSelectedTransit(null);
                setIs3D(false);
              }}
              onFit={() => {
                setIs3D(false);
                fitSelectedRoute();
              }}
              onClear={() => selectRoute(null)}
              onStop={(stop) => {
                setSelectedTransit({ type: "stop", stop });
                mapInstance?.easeTo({
                  center: [stop.longitude, stop.latitude],
                  zoom: 16,
                  padding: { top: 250, bottom: 50, left: 20, right: 20 },
                  retainPadding: false,
                  duration: 700,
                });
              }}
              onRetry={() => {
                void routeDetailQuery.refetch();
              }}
            />
          )}

        {!walkingMode && (
          <BuildingDetailsCard
            events={buildingEvents}
            eventsLoading={isEventsPending}
            eventsError={isEventsError}
            onSelectEvent={selectEvent}
            building={selectedBuilding}
            onDirections={() => {
              if (selectedBuilding) openDirections({
                name: selectedBuilding.properties.name,
                coordinates: selectedBuilding.geometry.coordinates as [number, number],
              });
            }}
            foodLocations={selectedBuildingFood}
            libraryOccupancy={selectedLibraryOccupancy}
            libraryOccupancyLoading={
              supportsLiveLibraryOccupancy && isLibraryOccupancyPending
            }
            libraryOccupancyError={isLibraryOccupancyError}
            libraryOccupancySource={libraryOccupancyResponse?.source}
            gymInfo={gymInfo}
            gymLoading={
              selectedBuilding?.properties.category === "gym" && isGymPending
            }
            gymError={isGymError}
            onClose={() => setSelectedBuildingId(null)}
            onRecenter={() => {
              if (selectedBuilding) {
                flyToBuilding(selectedBuilding);
              }
            }}
          />
        )}

        {selectedEvent && !eventDetailsExpanded && (
          <section
            aria-label="Selected event preview"
            className="absolute inset-x-3 top-36 z-30 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg sm:left-5 sm:right-auto sm:w-[22rem]"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-[#7c3aed]">
                Event preview
              </p>
              <button
                type="button"
                aria-label="Close event preview"
                onClick={() => setSelectedEventId(null)}
                className="px-2 py-1 text-sm text-slate-500"
              >
                Close
              </button>
            </div>
            <EventSummary
              event={selectedEvent}
              onSelect={() => setEventDetailsExpanded(true)}
            />
            <button
              type="button"
              onClick={() => setEventDetailsExpanded(true)}
              className="mt-3 w-full rounded-full bg-violet-50 py-2 text-sm font-medium text-[#7c3aed]"
            >
              View full details
            </button>
          </section>
        )}
        <EventDetailsCard
          canRecenter={mappedEvents.some(
            (event) => event.id === selectedEventId,
          )}
          event={eventDetailsExpanded ? selectedEvent : null}
          onDirections={() => {
            if (!selectedEvent) return;
            const mapped = mappedEvents.find((event) => event.id === selectedEvent.id);
            openDirections({
              name: selectedEvent.location || selectedEvent.name,
              coordinates: mapped ? [mapped.coordinates.longitude, mapped.coordinates.latitude] : undefined,
            });
          }}
          onClose={() => setSelectedEventId(null)}
          onRecenter={() => {
            const mapped = mappedEvents.find(
              (event) => event.id === selectedEventId,
            );
            if (mapped) flyToEvent(mapped);
          }}
        />

        <TransitDetailsCard
          route={selectedRoute}
          selection={currentTransitSelection}
          onClose={() => setSelectedTransit(null)}
        />

        <MapControls
          is3D={is3D}
          onReset={resetMap}
          onToggleView={toggleView}
          onFlyToMe={flyToMe}
        />

        <div className="h-full w-full" ref={mapContainer} />
      </div>
    </SideBar>
  );
}

export default Map;
