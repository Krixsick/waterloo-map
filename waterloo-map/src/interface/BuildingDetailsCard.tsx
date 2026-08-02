import {
  Clock3,
  Info,
  LocateFixed,
  MapPin,
  Navigation,
  X,
  type LucideIcon,
} from "lucide-react";

import type { BuildingFeature } from "../data/buildings";
import { buildingCategoryDetails } from "./buildingCategoryDetails";

type BuildingDetailsCardProps = {
  building: BuildingFeature | null;
  onClose: () => void;
  onRecenter: () => void;
};

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
      className="flex min-w-20 cursor-pointer flex-col items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-[#135f49] transition-colors hover:bg-emerald-50"
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
  onClose,
  onRecenter,
}: BuildingDetailsCardProps) {
  if (!building) return null;

  const { properties, geometry } = building;
  const category = buildingCategoryDetails[properties.category];
  const CategoryIcon = category.icon;
  const [longitude, latitude] = geometry.coordinates;

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
            <h2 className="font-heading text-xl font-semibold text-slate-950">
              {properties.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
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

        <p className="mt-4 text-sm leading-6 text-slate-600">
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
            <dt className="text-xs font-medium uppercase text-slate-500">
              Today's hours
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-800">
              {properties.liveHours ?? "Hours unavailable"}
            </dd>
            {properties.timeRemaining && (
              <p className="mt-1 text-xs text-emerald-700">
                {properties.timeRemaining}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-4 py-4">
          <MapPin className="mt-0.5 size-5 shrink-0 text-[#13735a]" />
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">
              Location
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              University of Waterloo campus
            </dd>
            <p className="mt-1 text-xs text-slate-500">
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          </div>
        </div>

        <div className="flex gap-4 py-4">
          <Info className="mt-0.5 size-5 shrink-0 text-[#13735a]" />
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">
              Place type
            </dt>
            <dd className="mt-1 text-sm text-slate-800">{category.label}</dd>
          </div>
        </div>
      </dl>
    </section>
  );
}
