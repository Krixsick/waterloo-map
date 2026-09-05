import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

import {
  addEventLayers,
  updateEventMarkers,
} from "../map/eventLayers";

import {
  getTimeRemaining,
  getTodaysLibraryHours,
} from "../utils/timeUtils";

import { mapEventsToCampus } from "../utils/eventLocations";

// APIs
import {
  useLibraryHours,
  useLibraryOccupancy,
} from "../api/libraryApi";

import { useWaterlooEvents } from "../api/events";

import {
  useTransitRoutes,
  useTransitRouteDetail,
  useTransitStops,
  useTransitVehicles,
} from "../api/transitApi";

import {
  useGymInfo,
  type GymApiResponse,
} from "../api/gymApi";

import {
  useFood,
  type FoodInfo,
} from "../api/foodApi";

// types
import type {
  BuildingCategory,
  BuildingFeature,
} from "../data/buildings";

import type {
  TransitRoute,
  TransitMode,
  TransitStatus,
  TransitSelection,
  TransitStop,
  TransitVehicle,
} from "../types/transit";

mapboxgl.accessToken =
  import.meta.env.VITE_MAPBOX_TOKEN;

const DEFAULT_CATEGORIES: BuildingCategory[] = [
  "academic",
  "library",
  "gym",
  "student-life",
  "residence",
];

const NO_TRANSIT_VEHICLES: TransitVehicle[] = [];
const NO_TRANSIT_STOPS: TransitStop[] = [];

const DEFAULT_TRANSIT_MODES: TransitMode[] = [
  "bus",
  "ion",
];

function getExpandedParentId(
  buildingId: string | null,
) {
  if (!buildingId) return null;

  const building = buildings.features.find(
    ({ properties }) =>
      properties.id === buildingId,
  );

  if (!building) return null;

  if (building.properties.parentId) {
    return building.properties.parentId;
  }

  const hasChildren = buildings.features.some(
    ({ properties }) =>
      properties.parentId === buildingId,
  );

  return hasChildren ? buildingId : null;
}

function Map() {
  const mapContainer =
    useRef<HTMLDivElement | null>(null);

  const userLocationRef =
    useRef<[number, number] | null>(null);

  const gymInfoRef =
    useRef<GymApiResponse | undefined>(undefined);

  const [mapInstance, setMapInstance] =
    useState<mapboxgl.Map | null>(null);

  const [isMapLoaded, setIsMapLoaded] =
    useState(false);

  const [is3D, setIs3D] =
    useState(true);

  const [
    selectedBuildingId,
    setSelectedBuildingId,
  ] = useState<string | null>(null);

  const [
    activeCategories,
    setActiveCategories,
  ] = useState<BuildingCategory[]>(
    DEFAULT_CATEGORIES,
  );

  const [selectedRoute, setSelectedRoute] = useState<TransitRoute | null>(null);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const fittedPatternRef = useRef<string | null>(null);
  const routeCardRef = useRef<HTMLElement | null>(null);

  const [showTransit, setShowTransit] =
    useState(false);

  const [showEvents, setShowEvents] =
    useState(false);

  const [
    activeTransitModes,
    setActiveTransitModes,
  ] = useState<TransitMode[]>(
    DEFAULT_TRANSIT_MODES,
  );

  const [
    selectedTransit,
    setSelectedTransit,
  ] = useState<TransitSelection | null>(
    null,
  );

  const [
    selectedEventId,
    setSelectedEventId,
  ] = useState<number | null>(null);

  const expandedParentId =
    getExpandedParentId(
      selectedBuildingId,
    );

  // --------------------
  // API DATA
  // --------------------

  const { data: libraryHours = {} } =
    useLibraryHours();

  const {
    data: gymInfo,
    isError: isGymError,
    isPending: isGymPending,
  } = useGymInfo();

  const {
    data: foodData = {},
  } = useFood();

  useEffect(() => {
    gymInfoRef.current = gymInfo;
  }, [gymInfo]);

  const selectedBuildingCategory =
    buildings.features.find(
      ({ properties }) =>
        properties.id ===
        selectedBuildingId,
    )?.properties.category;

  const {
    data: libraryOccupancyResponse,
    isError: isLibraryOccupancyError,
    isPending:
      isLibraryOccupancyPending,
  } = useLibraryOccupancy(
    selectedBuildingCategory === "library",
  );

  const {
    data: eventsResponse,
    isError: isEventsError,
    isPending: isEventsPending,
  } = useWaterlooEvents(showEvents);

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

  const routesQuery = useTransitRoutes(showTransit);
  const routeDetailQuery = useTransitRouteDetail(showTransit ? selectedRoute : null);
  const routeDetail = routeDetailQuery.data?.data ?? null;
  const routePattern = routeDetail?.patterns.find((pattern) => pattern.id === selectedPatternId)
    ?? routeDetail?.patterns[0] ?? null;
  const availableRoutes = (routesQuery.data?.data ?? []).filter((route) => activeTransitModes.includes(route.mode));


  // --------------------
  // BUILDING DATA
  // --------------------

  const buildingsWithBackendInfo =
    useMemo(() => {
      return {
        ...buildings,

        features: buildings.features.map(
          (feature) => {
            const libraryInfo =
              libraryHours[
                feature.properties.name
              ];

            const liveHours =
              getTodaysLibraryHours(
                libraryInfo,
              );

            return {
              ...feature,

              properties: {
                ...feature.properties,
                liveHours,
                timeRemaining:
                  getTimeRemaining(
                    liveHours,
                  ),
              },
            };
          },
        ),
      };
    }, [libraryHours]);

  const selectedBuilding = useMemo(
    () =>
      buildingsWithBackendInfo.features.find(
        ({ properties }) =>
          properties.id ===
          selectedBuildingId,
      ) ?? null,
    [
      buildingsWithBackendInfo,
      selectedBuildingId,
    ],
  );

  // --------------------
  // FOOD DATA
  // --------------------

  const selectedBuildingFood =
  useMemo<FoodInfo[]>(() => {
    if (!selectedBuilding) {
      return [];
    }

    const buildingId =
      selectedBuilding.properties.id;

    return Object.values(
      foodData,
    ).filter(
      (food) =>
        food.buildingId === buildingId,
    );
  }, [
    foodData,
    selectedBuilding,
  ]);

  console.log("FOOD DATA", foodData);
console.log(
  "SELECTED BUILDING",
  selectedBuilding?.properties.id,
);
console.log(
  "SELECTED BUILDING FOOD",
  selectedBuildingFood,
);

  // --------------------
  // LIBRARY OCCUPANCY
  // --------------------

  const selectedLibraryOccupancy =
    useMemo(() => {
      if (
        selectedBuilding?.properties
          .category !== "library"
      ) {
        return null;
      }

      return (
        libraryOccupancyResponse?.locations.find(
          ({ name }) =>
            name ===
            selectedBuilding.properties.name,
        ) ?? null
      );
    }, [
      libraryOccupancyResponse?.locations,
      selectedBuilding,
    ]);

  // --------------------
  // TRANSIT DATA
  // --------------------

  const transitVehicles =
    transitResponse?.data ??
    NO_TRANSIT_VEHICLES;

  const transitStops =
    transitStopsResponse?.data ??
    NO_TRANSIT_STOPS;

  const visibleTransitVehicles =
    useMemo(
      () =>
        transitVehicles.filter(
          (vehicle) =>
            activeTransitModes.includes(vehicle.mode) &&
            (!selectedRoute || (vehicle.mode === selectedRoute.mode && vehicle.routeId === selectedRoute.routeId)),
        ),
      [
        activeTransitModes,
        transitVehicles,
        selectedRoute,
      ],
    );

  const visibleTransitStops =
    useMemo(
      () =>
        (selectedRoute && routePattern ? routePattern.stops : transitStops).filter(
          (stop) => activeTransitModes.includes(stop.mode) &&
            (!selectedRoute || (stop.mode === selectedRoute.mode && stop.routeIds.includes(selectedRoute.routeId))),
        ),
      [
        activeTransitModes,
        transitStops,
        selectedRoute,
        routePattern,
      ],
    );

  const hasTransitFeedProblem = [
    ...(transitResponse?.feeds ?? []),
    ...(transitStopsResponse?.feeds ??
      []),
  ].some(
    (feed) =>
      feed.isStale || feed.error,
  );

  const hasTransitData =
    visibleTransitStops.length > 0 ||
    visibleTransitVehicles.length > 0;

  let transitStatus: TransitStatus =
    visibleTransitVehicles.length
      ? "live"
      : "scheduled";

  if (
    hasTransitFeedProblem ||
    isTransitError ||
    isTransitStopsError
  ) {
    transitStatus = "partial";
  }

  if (
    isTransitStopsPending ||
    (!hasTransitData &&
      isTransitPending)
  ) {
    transitStatus = "loading";
  }

  if (
    isTransitError &&
    isTransitStopsError
  ) {
    transitStatus = "error";
  }

  const currentTransitSelection =
    selectedTransit?.type === "vehicle"
      ? {
          type: "vehicle" as const,
          vehicle:
            visibleTransitVehicles.find(
              (vehicle) =>
                vehicle.id ===
                selectedTransit.vehicle.id,
            ) ??
            selectedTransit.vehicle,
        }
      : selectedTransit;

  // --------------------
  // EVENT DATA
  // --------------------

  const mappedEvents = useMemo(
    () =>
      mapEventsToCampus(
        eventsResponse?.events ?? [],
        buildings,
      ),
    [eventsResponse?.events],
  );

  const selectedEvent = useMemo(
    () =>
      mappedEvents.find(
        (event) =>
          event.id ===
          selectedEventId,
      ) ?? null,
    [
      mappedEvents,
      selectedEventId,
    ],
  );

  // --------------------
  // MAP ACTIONS
  // --------------------

  function flyToBuilding(
    building: BuildingFeature,
  ) {
    if (!mapInstance) return;

    const [longitude, latitude] =
      building.geometry.coordinates;

    mapInstance.flyTo({
      center: [
        longitude,
        latitude,
      ],
      zoom: 17,
      pitch: is3D ? 60 : 0,
      bearing: -26,
      duration: 1600,
      essential: true,
    });
  }

  function selectBuilding(
    building: BuildingFeature,
  ) {
    setSelectedBuildingId(
      building.properties.id,
    );

    setSelectedTransit(null);
    setSelectedEventId(null);

    flyToBuilding(building);
  }

  function flyToEvent(
    event: (typeof mappedEvents)[number],
  ) {
    if (!mapInstance) return;

    mapInstance.flyTo({
      center: [
        event.coordinates.longitude,
        event.coordinates.latitude,
      ],
      zoom: Math.max(
        mapInstance.getZoom(),
        17.25,
      ),
      pitch: is3D ? 48 : 0,
      bearing: -20,
      duration: 1200,
      essential: true,
    });
  }

  function toggleCategory(
    category: BuildingCategory,
  ) {
    setActiveCategories((current) =>
      current.includes(category)
        ? current.filter(
            (item) =>
              item !== category,
          )
        : [
            ...current,
            category,
          ],
    );
  }

  function resetFilters() {
    setActiveCategories(
      DEFAULT_CATEGORIES,
    );

    setActiveTransitModes(
      DEFAULT_TRANSIT_MODES,
    );

    setShowTransit(false);
    setSelectedRoute(null);
    setSelectedPatternId(null);
    setShowEvents(false);
    setSelectedBuildingId(null);
    setSelectedTransit(null);
    setSelectedEventId(null);
  }

  function toggleTransit() {
    setSelectedTransit(null);
    setSelectedBuildingId(null);
    setSelectedEventId(null);
    setSelectedRoute(null);
    setSelectedPatternId(null);

    setShowTransit(
      (current) => !current,
    );
  }

  function toggleEvents() {
    if (showEvents) {
      setSelectedEventId(null);
    }

    setShowEvents(
      (current) => !current,
    );
  }

  function toggleTransitMode(
    mode: TransitMode,
  ) {
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

    if (
      activeTransitModes.includes(
        mode,
      ) &&
      selectedMode === mode
    ) {
      setSelectedTransit(null);
    }

    setActiveTransitModes(
      (current) =>
        current.includes(mode)
          ? current.filter(
              (item) =>
                item !== mode,
            )
          : [
              ...current,
              mode,
            ],
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
      center: [
        -80.544,
        43.471,
      ],
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
      console.warn(
        "Geolocation is not supported by this browser.",
      );

      return;
    }

    if (userLocationRef.current) {
      mapInstance.flyTo({
        center:
          userLocationRef.current,
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
          center:
            userLocationRef.current,
          zoom: 16,
          pitch: is3D ? 60 : 0,
          bearing: -26,
          duration: 2000,
        });
      },
      () => {
        console.warn(
          "Geolocation permission denied.",
        );
      },
    );
  }

  function selectRoute(route: TransitRoute | null) {
    setSelectedRoute(route);
    setSelectedPatternId(null);
    setSelectedTransit(null);
    setSelectedBuildingId(null);
    setSelectedEventId(null);
    setIs3D(false);
    if (!route) mapInstance?.easeTo({ center: [-80.544, 43.471], zoom: 13.5, pitch: 0, bearing: 0, duration: 700 });
  }

  const fitSelectedRoute = useCallback(() => {
    if (!mapInstance || !routePattern) return;
    const coordinates = routePattern.coordinates.length > 1
      ? routePattern.coordinates
      : routePattern.stops.map((stop): [number, number] => [stop.longitude, stop.latitude]);
    if (!coordinates.length) return;
    const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
    coordinates.forEach((coordinate) => bounds.extend(coordinate));
    const width = mapInstance.getContainer().clientWidth;
    const height = mapInstance.getContainer().clientHeight;
    const wide = width >= 900;
    const cardBottom = routeCardRef.current
      ? routeCardRef.current.getBoundingClientRect().bottom - mapInstance.getContainer().getBoundingClientRect().top
      : 350;
    mapInstance.fitBounds(bounds, {
      padding: { top: wide ? 170 : Math.min(cardBottom + 16, height - 180), bottom: 85, left: wide ? 425 : 24, right: wide ? 90 : 76 },
      maxZoom: 15, pitch: 0, bearing: 0, retainPadding: false, duration: 900,
    });
  }, [mapInstance, routePattern]);

  useEffect(() => {
    if (!mapInstance || !isMapLoaded) return;
    mapInstance.setMinZoom(showTransit ? 9 : 13);
    updateTransitRoute(mapInstance, showTransit ? selectedRoute : null, showTransit ? routePattern : null);
    const key = showTransit && selectedRoute && routePattern ? `${selectedRoute.id}:${routePattern.id}` : null;
    if (key && key !== fittedPatternRef.current) fitSelectedRoute();
    fittedPatternRef.current = key;
  }, [mapInstance, isMapLoaded, showTransit, selectedRoute, routePattern, fitSelectedRoute]);

  // --------------------
  // INITIALIZE MAP
  // --------------------

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = createMap(
      mapContainer.current,
    );

    setMapInstance(map);

    map.on("load", () => {
      hideDefaultLabels(map);

      addImportantBuildingLayers(
        map,
      );

      addBuildingHoverPopup(
        map,
        ({ id }) => {
          if (!id) return;

          setSelectedBuildingId(id);
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

        onSelectVehicle: (
          vehicle,
        ) => {
          setSelectedBuildingId(null);
          setSelectedEventId(null);

          setSelectedTransit({
            type: "vehicle",
            vehicle,
          });
        },
      });

      addEventLayers(map, {
        onSelectEvent: (
          eventId,
        ) => {
          setSelectedBuildingId(null);
          setSelectedTransit(null);
          setSelectedEventId(eventId);
        },

        onClearSelection: () => {
          setSelectedBuildingId(null);
          setSelectedTransit(null);
          setSelectedEventId(null);
        },
      });

      updateBuildingFilters(
        map,
        DEFAULT_CATEGORIES,
      );

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
    if (
      !mapInstance ||
      !isMapLoaded
    ) {
      return;
    }

    updateBuildingFilters(
      mapInstance,
      selectedRoute ? [] : activeCategories,
    );
  }, [
    mapInstance,
    isMapLoaded,
    activeCategories,
    selectedRoute,
  ]);

  // --------------------
  // UWP CHILDREN + GROUP HIGHLIGHT
  // --------------------

  useEffect(() => {
    if (
      !mapInstance ||
      !isMapLoaded
    ) {
      return;
    }

    const childFilter =
      expandedParentId
        ? [
            "==",
            ["get", "parentId"],
            expandedParentId,
          ]
        : [
            "==",
            ["get", "parentId"],
            "",
          ];

    if (
      mapInstance.getLayer(
        "child-residence-building-squares",
      )
    ) {
      mapInstance.setFilter(
        "child-residence-building-squares",
        childFilter,
      );
    }

    if (
      mapInstance.getLayer(
        "child-residence-building-labels",
      )
    ) {
      mapInstance.setFilter(
        "child-residence-building-labels",
        childFilter,
      );
    }

    if (
      mapInstance.getLayer(
        "selected-residence-group",
      )
    ) {
      const selectedGroupFilter =
        expandedParentId
          ? [
              "any",
              [
                "==",
                ["get", "id"],
                expandedParentId,
              ],
              [
                "==",
                [
                  "get",
                  "parentId",
                ],
                expandedParentId,
              ],
            ]
          : [
              "==",
              ["get", "id"],
              "",
            ];

      mapInstance.setFilter(
        "selected-residence-group",
        selectedGroupFilter,
      );
    }
  }, [
    mapInstance,
    isMapLoaded,
    expandedParentId,
  ]);

  // --------------------
  // UPDATE BUILDING SOURCE
  // --------------------

  useEffect(() => {
    if (
      !mapInstance ||
      !isMapLoaded
    ) {
      return;
    }

    const source =
      mapInstance.getSource(
        "important-buildings",
      ) as
        | mapboxgl.GeoJSONSource
        | undefined;

    source?.setData(
      buildingsWithBackendInfo,
    );
  }, [
    mapInstance,
    isMapLoaded,
    buildingsWithBackendInfo,
  ]);

  // --------------------
  // UPDATE TRANSIT
  // --------------------

  useEffect(() => {
    if (
      !mapInstance ||
      !isMapLoaded
    ) {
      return;
    }

    updateTransitVehicles(
      mapInstance,
      showTransit
        ? visibleTransitVehicles
        : [],
    );
  }, [
    mapInstance,
    isMapLoaded,
    showTransit,
    visibleTransitVehicles,
  ]);

  useEffect(() => {
    if (
      !mapInstance ||
      !isMapLoaded
    ) {
      return;
    }

    updateTransitStops(
      mapInstance,
      showTransit
        ? visibleTransitStops
        : [],
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
    if (
      !mapInstance ||
      !isMapLoaded
    ) {
      return;
    }

    updateEventMarkers(
      mapInstance,
      showEvents
        ? mappedEvents
        : [],
    );
  }, [
    mapInstance,
    isMapLoaded,
    mappedEvents,
    showEvents,
  ]);

  // --------------------
  // UI
  // --------------------

  return (
    <SideBar
      renderMenuPanel={(
        closeMenu,
      ) => (
        <MapFilters
          activeCategories={
            activeCategories
          }
          onToggleCategory={
            toggleCategory
          }
          onResetFilters={
            resetFilters
          }
          showTransit={
            showTransit
          }
          onToggleTransit={
            toggleTransit
          }
          activeTransitModes={
            activeTransitModes
          }
          onToggleTransitMode={
            toggleTransitMode
          }
          transitStopCount={
            visibleTransitStops.length
          }
          transitVehicleCount={
            visibleTransitVehicles.length
          }
          transitStatus={
            transitStatus
          }
          showEvents={
            showEvents
          }
          onToggleEvents={
            toggleEvents
          }
          eventCount={
            mappedEvents.length
          }
          eventsLoading={
            showEvents &&
            isEventsPending
          }
          eventsError={
            showEvents &&
            isEventsError
          }
          onClose={closeMenu}
        />
      )}
    >
      <div className="relative h-svh w-full overflow-hidden">
        <LoadingScreen
          isComplete={
            isMapLoaded
          }
        />

        <SearchBar
          buildings={
            buildingsWithBackendInfo
          }
          onSelectBuilding={
            selectBuilding
          }
        />

        <TransitRouteBar
          enabled={showTransit}
          showHint={!selectedTransit && !selectedBuildingId && !selectedEventId}
          routes={availableRoutes}
          selectedRoute={selectedRoute}
          loading={routesQuery.isPending}
          error={routesQuery.isError}
          partial={Boolean(routesQuery.data?.feeds.some((feed) => feed.error))}
          onToggle={toggleTransit}
          onSelect={selectRoute}
          onRetry={() => { void routesQuery.refetch(); }}
        />
        {showTransit && selectedRoute && !selectedTransit && !selectedBuildingId && !selectedEventId && (
          <TransitRouteCard
            key={selectedRoute.id}
            route={selectedRoute}
            panelRef={routeCardRef}
            detail={routeDetail}
            pattern={routePattern}
            loading={routeDetailQuery.isPending}
            error={routeDetailQuery.isError}
            vehicles={visibleTransitVehicles.length}
            liveUnavailable={isTransitError || isTransitPending || Boolean(transitResponse?.feeds.some((feed) => feed.mode === selectedRoute.mode && (feed.error || feed.isStale)))}
            onPattern={(id) => { setSelectedPatternId(id); setSelectedTransit(null); setIs3D(false); }}
            onFit={() => { setIs3D(false); fitSelectedRoute(); }}
            onClear={() => selectRoute(null)}
            onStop={(stop) => {
              setSelectedTransit({ type: "stop", stop });
              mapInstance?.easeTo({ center: [stop.longitude, stop.latitude], zoom: 16, padding: { top: 250, bottom: 50, left: 20, right: 20 }, retainPadding: false, duration: 700 });
            }}
            onRetry={() => { void routeDetailQuery.refetch(); }}
          />
        )}

        <BuildingDetailsCard
          building={
            selectedBuilding
          }
          foodLocations={
            selectedBuildingFood
          }
          libraryOccupancy={
            selectedLibraryOccupancy
          }
          libraryOccupancyLoading={
            selectedBuilding
              ?.properties.category ===
              "library" &&
            isLibraryOccupancyPending
          }
          libraryOccupancyError={
            isLibraryOccupancyError
          }
          libraryOccupancySource={
            libraryOccupancyResponse?.source
          }
          gymInfo={gymInfo}
          gymLoading={
            selectedBuilding
              ?.properties.category ===
              "gym" &&
            isGymPending
          }
          gymError={
            isGymError
          }
          onClose={() =>
            setSelectedBuildingId(
              null,
            )
          }
          onRecenter={() => {
            if (
              selectedBuilding
            ) {
              flyToBuilding(
                selectedBuilding,
              );
            }
          }}
        />

        <EventDetailsCard
          event={selectedEvent}
          onClose={() =>
            setSelectedEventId(
              null,
            )
          }
          onRecenter={() => {
            if (selectedEvent) {
              flyToEvent(
                selectedEvent,
              );
            }
          }}
        />

        <TransitDetailsCard
          route={selectedRoute}
          selection={
            currentTransitSelection
          }
          onClose={() =>
            setSelectedTransit(
              null,
            )
          }
        />

        <MapControls
          is3D={is3D}
          onReset={resetMap}
          onToggleView={
            toggleView
          }
          onFlyToMe={
            flyToMe
          }
        />

        <div
          className="h-full w-full"
          ref={mapContainer}
        />
      </div>
    </SideBar>
  );
}

export default Map;
