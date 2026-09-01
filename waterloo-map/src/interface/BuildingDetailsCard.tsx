import {
  Activity,
  Clock3,
  ExternalLink,
  Info,
  LocateFixed,
  MapPin,
  Navigation,
  X,
  type LucideIcon,
} from "lucide-react";

import type { BuildingFeature } from "../data/buildings";
import type {
  LibraryOccupancyLevel,
  LibraryOccupancyLocation,
  LibraryOccupancyZone,
} from "../types/library";
import { buildingCategoryDetails } from "./buildingCategoryDetails";

type BuildingDetailsCardProps = {
  building: BuildingFeature | null;
  libraryOccupancy: LibraryOccupancyLocation | null;
  libraryOccupancyLoading: boolean;
  libraryOccupancyError: boolean;
  libraryOccupancySource?: string;
  onClose: () => void;
  onRecenter: () => void;
};

const occupancyLabels: Record<LibraryOccupancyLevel, string> = {
  "not-busy": "Not busy",
  busy: "Busy",
  "very-busy": "Very busy",
  closed: "Closed",
  unavailable: "Unavailable",
};

const occupancyStyles: Record<LibraryOccupancyLevel, string> = {
  "not-busy": "bg-emerald-500",
  busy: "bg-amber-500",
  "very-busy": "bg-violet-600",
  closed: "bg-slate-400",
  unavailable: "bg-slate-300",
};

function zoneSummary(zone: LibraryOccupancyZone) {
  if (zone.level === "closed" || zone.level === "unavailable") {
    return occupancyLabels[zone.level];
  }
  return zone.percentage === null
    ? occupancyLabels[zone.level]
    : `${zone.percentage}% full`;
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
  libraryOccupancy,
  libraryOccupancyLoading,
  libraryOccupancyError,
  libraryOccupancySource = "https://waitz.io/waterloo",
  onClose,
  onRecenter,
}: BuildingDetailsCardProps) {
  if (!building) return null;

  const { properties, geometry } = building;
  const category = buildingCategoryDetails[properties.category];
  const CategoryIcon = category.icon;
  const [longitude, latitude] = geometry.coordinates;
  const isLibrary = properties.category === "library";
  const occupancyUnavailable =
    libraryOccupancyError ||
    !libraryOccupancy ||
    libraryOccupancy.level === "unavailable";

  function openDirections() {
    const destination = encodeURIComponent(`${latitude},${longitude}`);
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
              {properties.abbreviation} · {category.label}
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
            <dd className="text-ui-value mt-1 text-slate-800">
              {properties.liveHours ?? "Hours unavailable"}
            </dd>
            {properties.timeRemaining && (
              <p className="text-ui-meta mt-1 text-emerald-700">
                {properties.timeRemaining}
              </p>
            )}
          </div>
        </div>

        {isLibrary && (
          <div className="flex gap-4 py-4">
            <Activity className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <dt className="text-ui-label text-slate-500">
                Live occupancy
              </dt>

              {libraryOccupancyLoading ? (
                <dd className="text-ui-body mt-1 text-slate-600">
                  Checking how busy it is…
                </dd>
              ) : occupancyUnavailable ? (
                <dd className="mt-1">
                  <p className="text-ui-body text-slate-600">
                    Live occupancy is unavailable right now.
                  </p>
                  <a
                    href={libraryOccupancySource}
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
                      {occupancyLabels[libraryOccupancy.level]}
                    </span>
                    {libraryOccupancy.percentage !== null &&
                      libraryOccupancy.isOpen && (
                        <span className="text-ui-meta font-medium text-slate-500">
                          {libraryOccupancy.percentage}% full
                        </span>
                      )}
                  </div>

                  {libraryOccupancy.percentage !== null &&
                    libraryOccupancy.isOpen && (
                      <div
                        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-label={`${properties.name} occupancy`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={libraryOccupancy.percentage}
                      >
                        <div
                          className={`h-full rounded-full transition-[width] ${occupancyStyles[libraryOccupancy.level]}`}
                          style={{ width: `${libraryOccupancy.percentage}%` }}
                        />
                      </div>
                    )}

                  <p className="text-ui-meta mt-2 text-slate-500">
                    Estimated from anonymous device activity.
                  </p>

                  {libraryOccupancy.zones.length > 0 &&
                    libraryOccupancy.isOpen && (
                      <details className="mt-3 rounded-md border border-slate-200 bg-slate-50">
                        <summary className="text-ui-action cursor-pointer px-3 py-2 text-slate-700">
                          View floor details
                        </summary>
                        <div className="divide-y divide-slate-200 border-t border-slate-200 px-3">
                          {libraryOccupancy.zones.map((zone) => (
                            <div
                              key={zone.id}
                              className="flex items-center justify-between gap-3 py-2"
                            >
                              <span className="text-ui-meta text-slate-700">
                                {zone.name}
                              </span>
                              <span className="text-ui-meta shrink-0 font-medium text-slate-500">
                                {zoneSummary(zone)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                  <a
                    href={libraryOccupancySource}
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
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
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
