import {
  BookOpen,
  UtensilsCrossed,
  BusFront,
  CalendarDays,
  Check,
  Dumbbell,
  GraduationCap,
  House,
  RotateCcw,
  TrainFront,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import type { BuildingCategory } from "../data/buildings";
import type { TransitMode, TransitStatus } from "../types/transit";

type MapFiltersProps = {
  activeCategories: BuildingCategory[];
  onToggleCategory: (category: BuildingCategory) => void;
  onResetFilters: () => void;
  showTransit: boolean;
  onToggleTransit: () => void;
  activeTransitModes: TransitMode[];
  onToggleTransitMode: (mode: TransitMode) => void;
  transitStopCount: number;
  transitVehicleCount: number;
  transitStatus: TransitStatus;
  showFood: boolean;
  onToggleFood: () => void;
  openFoodCount: number;
  showEvents: boolean;
  onToggleEvents: () => void;
  eventCount: number;
  eventsLoading: boolean;
  eventsError: boolean;
  onClose: () => void;
};

const filters: {
  label: string;
  value: BuildingCategory;
  icon: LucideIcon;
  activeClass: string;
  checkClass: string;
}[] = [
  {
    label: "Academic",
    value: "academic",
    icon: GraduationCap,
    activeClass: "bg-sky-50 text-sky-800",
    checkClass: "border-sky-600 bg-sky-600",
  },
  {
    label: "Student Life",
    value: "student-life",
    icon: Users,
    activeClass: "bg-teal-50 text-teal-800",
    checkClass: "border-teal-600 bg-teal-600",
  },
  {
    label: "Libraries",
    value: "library",
    icon: BookOpen,
    activeClass: "bg-amber-50 text-amber-800",
    checkClass: "border-amber-600 bg-amber-600",
  },
  {
    label: "Gyms",
    value: "gym",
    icon: Dumbbell,
    activeClass: "bg-indigo-50 text-indigo-800",
    checkClass: "border-indigo-600 bg-indigo-600",
  },
  {
    label: "Residences",
    value: "residence",
    icon: House,
    activeClass: "bg-emerald-50 text-emerald-800",
    checkClass: "border-emerald-600 bg-emerald-600",
  },
];

const transitModes: {
  label: string;
  value: TransitMode;
  icon: LucideIcon;
  activeClass: string;
}[] = [
  {
    label: "Bus",
    value: "bus",
    icon: BusFront,
    activeClass: "border-blue-200 bg-blue-50 text-blue-800",
  },
  {
    label: "ION",
    value: "ion",
    icon: TrainFront,
    activeClass: "border-pink-200 bg-pink-50 text-pink-800",
  },
];

export default function MapFilters({
  activeCategories,
  onToggleCategory,
  onResetFilters,
  showTransit,
  onToggleTransit,
  activeTransitModes,
  onToggleTransitMode,
  transitStopCount,
  transitVehicleCount,
  transitStatus,
  showFood, onToggleFood, openFoodCount,
  showEvents,
  onToggleEvents,
  eventCount,
  eventsLoading,
  eventsError,
  onClose,
}: MapFiltersProps) {
  const transitMessage =
    transitStatus === "error"
      ? "Unavailable"
      : transitStatus === "loading"
        ? "Loading"
        : transitStatus === "scheduled"
          ? `${transitStopCount} stops`
          : `${transitStopCount} stops · ${transitVehicleCount} live`;

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-title text-base font-semibold text-slate-900">
            Map filters
          </h2>
          <p className="text-ui-meta mt-0.5 text-slate-500">
            Show or hide map items
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onResetFilters}
            className="flex size-9 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Reset filters"
            title="Reset filters"
          >
            <RotateCcw size={17} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close map filters"
            title="Close filters"
          >
            <X size={19} />
          </button>
        </div>
      </div>

      <section className="py-5">
        <h3 className="text-ui-label mb-2 px-2 text-slate-500">
          Places
        </h3>
        <div className="space-y-1">
          {filters.map(
            ({ label, value, icon: Icon, activeClass, checkClass }) => {
              const isActive = activeCategories.includes(value);

              return (
                <label
                  key={value}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 outline-none transition focus-within:ring-2 focus-within:ring-slate-500/30 ${
                    isActive
                      ? activeClass
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => onToggleCategory(value)}
                    className="sr-only"
                  />
                  <Icon size={20} aria-hidden="true" />
                  <span className="font-title min-w-0 flex-1 text-sm font-medium">
                    {label}
                  </span>
                  <span
                    className={`flex size-5 items-center justify-center rounded border ${
                      isActive
                        ? `${checkClass} text-white`
                        : "border-slate-300 bg-white text-transparent"
                    }`}
                    aria-hidden="true"
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                </label>
              );
            },
          )}
        </div>
      </section>

      <section className="border-t border-slate-200 py-5">
        <h3 className="text-ui-label mb-2 px-2 text-slate-500">
          Explore
        </h3>
        <label className={`mb-1 flex min-h-14 cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 focus-within:ring-2 focus-within:ring-emerald-600 ${showFood ? "bg-emerald-50 text-emerald-800" : "text-slate-700 hover:bg-slate-50"}`}>
          <input type="checkbox" checked={showFood} onChange={onToggleFood} className="sr-only" />
          <UtensilsCrossed size={20} aria-hidden="true" /><span className="flex-1"><span className="block text-sm font-medium">Food spots</span><span className="text-ui-meta block text-slate-500">{openFoodCount} spots open now</span></span>
          <span aria-hidden="true" className={`flex size-5 items-center justify-center rounded border ${showFood ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-transparent"}`}><Check size={14} /></span>
        </label>
        <label
          className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 outline-none transition focus-within:ring-2 focus-within:ring-violet-600/40 ${
            showEvents
              ? "bg-violet-50 text-violet-800"
              : "text-slate-700 hover:bg-slate-50"
          }`}
        >
          <input
            type="checkbox"
            checked={showEvents}
            onChange={onToggleEvents}
            className="sr-only"
          />
          <CalendarDays size={20} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="font-title block text-sm font-medium">Campus events</span>
            <span
              className={`text-ui-meta block ${
                eventsError ? "text-red-600" : "text-slate-500"
              }`}
            >
              {!showEvents
                ? "Upcoming events at Waterloo"
                : eventsLoading
                  ? "Loading events"
                  : eventsError
                    ? "Events unavailable"
                    : `${eventCount} ${eventCount === 1 ? "event" : "events"} on map`}
            </span>
          </span>
          <span
            className={`flex size-5 items-center justify-center rounded border ${
              showEvents
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-slate-300 bg-white text-transparent"
            }`}
            aria-hidden="true"
          >
            <Check size={14} strokeWidth={3} />
          </span>
        </label>
      </section>

      <section className="border-t border-slate-200 pt-5">
        <h3 className="text-ui-label mb-2 px-2 text-slate-500">
          Transportation
        </h3>
        <label
          className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 outline-none transition focus-within:ring-2 focus-within:ring-blue-600/40 ${
            showTransit
              ? "bg-blue-50 text-blue-800"
              : "text-slate-700 hover:bg-slate-50"
          }`}
        >
          <input
            type="checkbox"
            checked={showTransit}
            onChange={onToggleTransit}
            className="sr-only"
          />
          <BusFront size={20} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="font-title block text-sm font-medium">Transit routes</span>
            <span
              className={`text-ui-meta block ${
                transitStatus === "error"
                  ? "text-red-600"
                  : transitStatus === "partial"
                    ? "text-amber-600"
                    : "text-slate-500"
              }`}
            >
              {showTransit ? transitMessage : "Routes, stops and live vehicles"}
            </span>
          </span>
          <span
            className={`flex size-5 items-center justify-center rounded border ${
              showTransit
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-300 bg-white text-transparent"
            }`}
            aria-hidden="true"
          >
            <Check size={14} strokeWidth={3} />
          </span>
        </label>

        {showTransit && (
          <fieldset className="mt-3 px-2">
            <legend className="text-ui-label mb-2 text-slate-500">
              Transit modes
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {transitModes.map(
                ({ label, value, icon: Icon, activeClass }) => {
                  const isActive = activeTransitModes.includes(value);

                  return (
                    <label
                      key={value}
                      className={`font-title flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-sm font-medium outline-none transition focus-within:ring-2 focus-within:ring-slate-500/30 ${
                        isActive
                          ? activeClass
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => onToggleTransitMode(value)}
                        className="sr-only"
                      />
                      <Icon size={17} aria-hidden="true" />
                      <span className="flex-1">{label}</span>
                      {isActive && <Check size={14} aria-hidden="true" />}
                    </label>
                  );
                },
              )}
            </div>
          </fieldset>
        )}
      </section>
    </div>
  );
}
