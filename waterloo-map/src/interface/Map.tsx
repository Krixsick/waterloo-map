import {
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

  if (
    building.properties.category === "residence" &&
    building.properties.parentId
  ) {
    return building.properties.parentId;
  }

  const hasResidenceChildren =
    buildings.features.some(
      ({ properties }) =>
        properties.category === "residence" &&
        properties.parentId === buildingId,
    );

  return hasResidenceChildren
    ? buildingId
    : null;
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

  gymInfoRef.current = gymInfo;

  const selectedBuildingCategory =
    buildings.features.find(
      ({ properties }) =>
        properties.id ===
        selectedBuildingId,
    )?.properties.category;
  
    const supportsLiveLibraryOccupancy =
    selectedBuildingId === "dp" ||
    selectedBuildingId === "dc-library";

  const {
    data: libraryOccupancyResponse,
    isError: isLibraryOccupancyError,
    isPending:
      isLibraryOccupancyPending,
    } = useLibraryOccupancy(
      supportsLiveLibraryOccupancy,
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

    const matchedFood =
      Object.values(foodData).filter(
        (food) =>
          food.buildingId ===
          buildingId,
      );

    console.log(
      "selected building id:",
      buildingId,
    );

    console.log(
      "matched food:",
      matchedFood,
    );

    return matchedFood;
  }, [
    foodData,
    selectedBuilding,
  ]);

  // --------------------
  // LIBRARY OCCUPANCY
  // --------------------

  const selectedLibraryOccupancy =
  useMemo(() => {
    if (
      !selectedBuilding ||
      !supportsLiveLibraryOccupancy
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
    supportsLiveLibraryOccupancy,
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
            activeTransitModes.includes(
              vehicle.mode,
            ),
        ),
      [
        activeTransitModes,
        transitVehicles,
      ],
    );

  const visibleTransitStops =
    useMemo(
      () =>
        transitStops.filter(
          (stop) =>
            activeTransitModes.includes(
              stop.mode,
            ),
        ),
      [
        activeTransitModes,
        transitStops,
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
    setShowEvents(false);
    setSelectedBuildingId(null);
    setSelectedTransit(null);
    setSelectedEventId(null);
  }

  function toggleTransit() {
    if (showTransit) {
      setSelectedTransit(null);
    }

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
      activeCategories,
    );
  }, [
    mapInstance,
    isMapLoaded,
    activeCategories,
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
        "all",
        ["==", ["get", "category"], "residence"],
        [
          "==",
          ["get", "parentId"],
          expandedParentId,
        ],
      ]
    : [
        "all",
        ["==", ["get", "category"], "residence"],
        ["==", ["get", "parentId"], ""],
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
          "all",
          ["==", ["get", "category"], "residence"],
          [
            "==",
            ["get", "parentId"],
            expandedParentId,
          ],
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
    );
  }, [
    mapInstance,
    isMapLoaded,
    showTransit,
    visibleTransitStops,
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
      <div className="relative h-screen w-full overflow-hidden">
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
            supportsLiveLibraryOccupancy &&
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
