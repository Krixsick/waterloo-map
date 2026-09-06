import GraduateHouseInfo, { graduateHouseHours } from "./GraduateHouseInfo";
import { useState } from "react";
import { EventSummary } from "./EventsPanel";
import type { WaterlooEvent } from "../types/events";
import { formatDisplayTime } from "../utils/timeFormat";
import {
  Activity,
  CalendarDays,
  Clock3,
  ExternalLink,
  Info,
  LocateFixed,
  MapPin,
  Navigation,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";

import type { GymApiResponse } from "../api/gymApi";
import type { FoodInfo } from "../api/foodApi";
import type { BuildingFeature } from "../data/buildings";

import type {
  LibraryOccupancyLevel,
  LibraryOccupancyLocation,
  LibraryOccupancyZone,
} from "../types/library";

import { buildingCategoryDetails } from "./buildingCategoryDetails";
import FoodDetailsCard from "./FoodDetailsCard";

type BuildingDetailsCardProps = {
  events?: WaterlooEvent[];
  eventsLoading?: boolean;
  eventsError?: boolean;
  onSelectEvent: (event: WaterlooEvent) => void;
  building: BuildingFeature | null;
  foodLocations?: FoodInfo[];
  libraryOccupancy: LibraryOccupancyLocation | null;
  libraryOccupancyLoading: boolean;
  libraryOccupancyError: boolean;
  libraryOccupancySource?: string;
  gymInfo?: GymApiResponse;
  gymLoading: boolean;
  gymError: boolean;
  onClose: () => void;
  onRecenter: () => void;
};

const occupancyLabels: Record<
  LibraryOccupancyLevel,
  string
> = {
  "not-busy": "Not busy",
  busy: "Busy",
  "very-busy": "Very busy",
  closed: "Closed",
  unavailable: "Unavailable",
};

const occupancyStyles: Record<
  LibraryOccupancyLevel,
  string
> = {
  "not-busy": "bg-emerald-500",
  busy: "bg-amber-500",
  "very-busy": "bg-violet-600",
  closed: "bg-slate-400",
  unavailable: "bg-slate-300",
};

function zoneSummary(
  zone: LibraryOccupancyZone,
) {
  if (
    zone.level === "closed" ||
    zone.level === "unavailable"
  ) {
    return occupancyLabels[zone.level];
  }

  return zone.percentage === null
    ? occupancyLabels[zone.level]
    : `${zone.percentage}% full`;
}

function getToday() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      weekday: "long",
      timeZone: "America/Toronto",
    },
  ).format(new Date());
}

function getGymOccupancyLabel(
  percent: number,
) {
  if (percent < 30) {
    return "Not busy";
  }

  if (percent < 60) {
    return "Moderately busy";
  }

  if (percent < 80) {
    return "Busy";
  }

  return "Very busy";
}

function getGymOccupancyStyle(
  percent: number,
) {
  if (percent < 30) {
    return "bg-emerald-500";
  }

  if (percent < 60) {
    return "bg-amber-400";
  }

  if (percent < 80) {
    return "bg-orange-500";
  }

  return "bg-violet-600";
}

function getGymFacilityName(
  name: string,
) {
  return name
    .replace(/^PAC - /, "")
    .replace(
      "CIF Fitness Centre",
      "Fitness Centre",
    );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-ui-action flex min-w-20 cursor-pointer flex-col items-center gap-1.5 rounded-md px-3 py-2 text-[#135f49] transition-colors hover:bg-emerald-50"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-emerald-100">
        <Icon className="size-5" />
      </span>

      {label}
    </button>
  );
}

export default function BuildingDetailsCard({
  building,
  events = [], eventsLoading, eventsError, onSelectEvent,
  foodLocations = [],
  libraryOccupancy,
  libraryOccupancyLoading,
  libraryOccupancyError,
  libraryOccupancySource = "https://waitz.io/waterloo",
  gymInfo,
  gymLoading,
  gymError,
  onClose,
  onRecenter,
}: BuildingDetailsCardProps) {
  const [expandedEventsFor, setExpandedEventsFor] = useState<string | null>(null);
  if (!building) return null;

  const {
    properties,
    geometry,
  } = building;

  const category =
    buildingCategoryDetails[
      properties.category
    ];

  const CategoryIcon =
    category.icon;

  const [longitude, latitude] =
    geometry.coordinates;

  const isLibrary =
    properties.category ===
    "library";

  const isGym =
    properties.category ===
    "gym";

  const occupancyUnavailable =
    libraryOccupancyError ||
    !libraryOccupancy ||
    libraryOccupancy.level ===
      "unavailable";

  const today = getToday();

  const abbreviation =
    properties.abbreviation?.toUpperCase();

    const supportsLiveLibraryOccupancy =
    isLibrary &&
    (properties.id === "dp" ||
      properties.id === "dc-library");

  const gymKey =
    abbreviation === "PAC"
      ? "PAC"
      : abbreviation === "CIF"
        ? "CIF"
        : null;

  const gym =
    isGym &&
    gymKey &&
    gymInfo
      ? gymInfo[gymKey]
      : null;

  const gymHours =
    gym?.hours[today];

  const gymOccupancy =
    gym?.busyness.overall;

  const gymFacilities =
    gym
      ? Object.values(
          gym.busyness.facilities,
        )
      : [];

  const displayHours =
    properties.id === "gh" ? graduateHouseHours() : isGym
      ? gymHours ??
        "Hours unavailable"
      : properties.liveHours ??
        "Hours unavailable";

  function openDirections() {
    const destination =
      encodeURIComponent(
        `${latitude},${longitude}`,
      );

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <section
      aria-label={`${properties.name} details`}
      className="absolute inset-x-3 top-20 z-30 max-h-[calc(100svh-5.75rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl sm:left-5 sm:right-auto sm:w-[25rem]"
    >
      <header className="border-b border-slate-200 p-5">
        <div className="flex items-start gap-4">
          <span
            className={`flex size-12 shrink-0 items-center justify-center rounded-full ${category.styles}`}
          >
            <CategoryIcon className="size-6" />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="text-ui-title text-slate-950">
              {properties.name}
            </h2>

            <p className="text-ui-subtitle mt-1 text-slate-500">
              {properties.abbreviation} ·{" "}
              {category.label}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close building details"
            title="Close"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="size-5" />
          </button>
        </div>

        <p className="text-ui-body mt-4 text-slate-600">
          {properties.description}
        </p>
      </header>

      <div className="flex justify-center gap-5 border-b border-slate-200 px-4 py-3">
        <ActionButton
          icon={Navigation}
          label="Directions"
          onClick={openDirections}
        />

        <ActionButton
          icon={LocateFixed}
          label="Recenter"
          onClick={onRecenter}
        />
      </div>

      <dl className="divide-y divide-slate-100 px-5">
        <div className="flex gap-4 py-4">
          <Clock3 className="mt-0.5 size-5 shrink-0 text-[#13735a]" />

          <div>
            <dt className="text-ui-label text-slate-500">
              Today's hours
            </dt>

            {isGym &&
            gymLoading ? (
              <dd className="text-ui-value mt-1 text-slate-600">
                Loading hours…
              </dd>
            ) : isGym &&
              gymError ? (
              <dd className="text-ui-value mt-1 text-slate-600">
                Hours unavailable
              </dd>
            ) : (
              <dd className="text-ui-value mt-1 text-slate-800">
                {formatDisplayTime(displayHours)}
              </dd>
            )}

            {!isGym &&
              properties.timeRemaining && (
                <p className="text-ui-meta mt-1 text-emerald-700">
                  {
                    properties.timeRemaining
                  }
                </p>
              )}
          </div>
        </div>

        {properties.id === "gh" && <GraduateHouseInfo />}

        {supportsLiveLibraryOccupancy && (
          <div className="flex gap-4 py-4">
            <Activity className="mt-0.5 size-5 shrink-0 text-amber-600" />

            <div className="min-w-0 flex-1">
              <dt className="text-ui-label text-slate-500">
                Live occupancy
              </dt>

              {libraryOccupancyLoading ? (
                <dd className="text-ui-value mt-1 text-slate-600">
                  Checking how busy it is…
                </dd>
              ) : occupancyUnavailable ? (
                <dd className="mt-1">
                  <p className="text-ui-value text-slate-600">
                    Live occupancy is unavailable right now.
                  </p>

                  <a
                    href={
                      libraryOccupancySource
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-ui-action mt-3 inline-flex items-center gap-1 text-amber-700 hover:text-amber-900"
                  >
                    Check Waterloo occupancy
                    <ExternalLink className="size-3.5" />
                  </a>
                </dd>
              ) : (
                <dd className="mt-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-ui-value text-slate-900">
                      {
                        occupancyLabels[
                          libraryOccupancy
                            .level
                        ]
                      }
                    </span>

                    {libraryOccupancy.percentage !==
                      null &&
                      libraryOccupancy.isOpen && (
                        <span className="text-ui-meta font-medium text-slate-500">
                          {
                            libraryOccupancy.percentage
                          }
                          % full
                        </span>
                      )}
                  </div>

                  {libraryOccupancy.percentage !==
                    null &&
                    libraryOccupancy.isOpen && (
                      <div
                        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-label={`${properties.name} occupancy`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={
                          libraryOccupancy.percentage
                        }
                      >
                        <div
                          className={`h-full rounded-full transition-[width] ${
                            occupancyStyles[
                              libraryOccupancy
                                .level
                            ]
                          }`}
                          style={{
                            width: `${libraryOccupancy.percentage}%`,
                          }}
                        />
                      </div>
                    )}

                  <p className="text-ui-meta mt-2 text-slate-500">
                    Estimated from anonymous device activity.
                  </p>

                  {libraryOccupancy
                    .zones.length >
                    0 &&
                    libraryOccupancy.isOpen && (
                      <details className="mt-3 rounded-md border border-slate-200 bg-slate-50">
                        <summary className="text-ui-action cursor-pointer px-3 py-2 text-slate-700">
                          View floor details
                        </summary>

                        <div className="divide-y divide-slate-200 border-t border-slate-200 px-3">
                          {libraryOccupancy.zones.map(
                            (zone) => (
                              <div
                                key={
                                  zone.id
                                }
                                className="flex items-center justify-between gap-3 py-2"
                              >
                                <span className="text-ui-meta text-slate-700">
                                  {
                                    zone.name
                                  }
                                </span>

                                <span className="text-ui-meta shrink-0 font-medium text-slate-500">
                                  {zoneSummary(
                                    zone,
                                  )}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </details>
                    )}

                  <a
                    href={
                      libraryOccupancySource
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-ui-action mt-3 inline-flex items-center gap-1 text-amber-700 hover:text-amber-900"
                  >
                    Live data by Waitz
                    <ExternalLink className="size-3.5" />
                  </a>
                </dd>
              )}
            </div>
          </div>
        )}

        {isGym && (
          <div className="flex gap-4 py-4">
            <Activity className="mt-0.5 size-5 shrink-0 text-amber-600" />

            <div className="min-w-0 flex-1">
              <dt className="text-ui-label text-slate-500">
                Live occupancy
              </dt>

              {gymLoading ? (
                <dd className="text-ui-value mt-1 text-slate-600">
                  Checking how busy it is…
                </dd>
              ) : gymError ||
                !gym ? (
                <dd className="text-ui-value mt-1 text-slate-600">
                  Live occupancy is unavailable right now.
                </dd>
              ) : !gymOccupancy ? (
                <dd className="text-ui-value mt-1 text-slate-600">
                  Live occupancy is unavailable right now.
                </dd>
              ) : (
                <dd className="mt-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-ui-value text-slate-900">
                      {getGymOccupancyLabel(
                        gymOccupancy.percent,
                      )}
                    </span>

                    <span className="text-ui-meta font-medium text-slate-500">
                      {
                        gymOccupancy.percent
                      }
                      % full
                    </span>
                  </div>

                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label={`${properties.name} occupancy`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={
                      gymOccupancy.percent
                    }
                  >
                    <div
                      className={`h-full rounded-full transition-[width] ${getGymOccupancyStyle(
                        gymOccupancy.percent,
                      )}`}
                      style={{
                        width: `${Math.min(
                          gymOccupancy.percent,
                          100,
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    {gymOccupancy.occupancy !==
                      undefined && (
                      <span className="text-ui-meta text-slate-500">
                        {
                          gymOccupancy.occupancy
                        }{" "}
                        inside
                      </span>
                    )}

                    {gymOccupancy.remaining !==
                      undefined && (
                      <span className="text-ui-meta text-slate-500">
                        {
                          gymOccupancy.remaining
                        }{" "}
                        spots available
                      </span>
                    )}
                  </div>

                  {gymKey ===
                    "PAC" &&
                    gymFacilities.length >
                      0 && (
                      <details className="mt-3 rounded-md border border-slate-200 bg-slate-50">
                        <summary className="text-ui-action cursor-pointer px-3 py-2 text-slate-700">
                          View area details
                        </summary>

                        <div className="divide-y divide-slate-200 border-t border-slate-200 px-3">
                          {gymFacilities.map(
                            (facility) => (
                              <div
                                key={
                                  facility.name
                                }
                                className="py-2.5"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-ui-meta text-slate-700">
                                    {getGymFacilityName(
                                      facility.name,
                                    )}
                                  </span>

                                  <span className="text-ui-meta shrink-0 font-medium text-slate-500">
                                    {
                                      facility.percent
                                    }
                                    % full
                                  </span>
                                </div>

                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                  <div
                                    className={`h-full rounded-full ${getGymOccupancyStyle(
                                      facility.percent,
                                    )}`}
                                    style={{
                                      width: `${Math.min(
                                        facility.percent,
                                        100,
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </details>
                    )}
                </dd>
              )}
            </div>
          </div>
        )}

        {foodLocations.length > 0 && (
          <div id="building-food-section" className="flex gap-4 py-4">
            <UtensilsCrossed className="mt-0.5 size-5 shrink-0 text-[#13735a]" />

            <div className="min-w-0 flex-1">
              <dt className="text-ui-label text-slate-500">
                Food & drink
              </dt>

              <dd className="mt-3">
                <div className="space-y-2">
                  {foodLocations.map(
                    (food) => (
                      <FoodDetailsCard
                        key={food.name}
                        food={food}
                      />
                    ),
                  )}
                </div>
              </dd>
            </div>
          </div>
        )}

        <div className="py-4">
          <dt className="text-ui-label flex items-center gap-3 text-slate-500"><CalendarDays aria-hidden="true" className="size-5 shrink-0 text-[#7c3aed]" />Upcoming events</dt>
          <dd className="mt-3 space-y-2">
            {eventsLoading ? <p className="text-sm text-slate-500">Loading events…</p> : eventsError ? <p className="text-sm text-slate-500">Events unavailable.</p> : !events.length ? <p className="text-sm text-slate-500">No upcoming events listed.</p> : <>{(expandedEventsFor === building.properties.id ? events : events.slice(0,3)).map(event => <EventSummary key={event.id} event={event} onSelect={onSelectEvent}/>)}{events.length > 3 && <button className="text-sm text-[#7c3aed] underline" onClick={() => setExpandedEventsFor(expandedEventsFor === building.properties.id ? null : building.properties.id)}>{expandedEventsFor === building.properties.id ? "Show fewer" : `View all ${events.length} events`}</button>}</>}
          </dd>
        </div>
        <div className="flex gap-4 py-4">
          <MapPin className="mt-0.5 size-5 shrink-0 text-[#13735a]" />

          <div>
            <dt className="text-ui-label text-slate-500">
              Location
            </dt>

            <dd className="text-ui-value mt-1 text-slate-800">
              University of Waterloo campus
            </dd>

            <p className="text-ui-meta mt-1 text-slate-500">
              {latitude.toFixed(5)},{" "}
              {longitude.toFixed(5)}
            </p>
          </div>
        </div>

        <div className="flex gap-4 py-4">
          <Info className="mt-0.5 size-5 shrink-0 text-[#13735a]" />

          <div>
            <dt className="text-ui-label text-slate-500">
              Location type
            </dt>

            <dd className="text-ui-value mt-1 text-slate-800">
              {category.label}
            </dd>
          </div>
        </div>
      </dl>
    </section>
  );
}
