import { useState } from "react";
import { BusFront, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { BuildingCategory } from "../data/buildings";

type MapFiltersProps = {
  activeCategories: BuildingCategory[];
  onToggleCategory: (category: BuildingCategory) => void;
  onResetFilters: () => void;
  showTransit: boolean;
  onToggleTransit: () => void;
  transitVehicleCount: number;
  transitStatus: "loading" | "live" | "stale" | "error";
};

const filters: { label: string; value: BuildingCategory }[] = [
  { label: "Academic", value: "academic" },
  { label: "Libraries", value: "library" },
  { label: "Gyms", value: "gym" },
  { label: "Student Life", value: "student-life" },
  { label: "Residences", value: "residence" },
];

export default function MapFilters({
  activeCategories,
  onToggleCategory,
  onResetFilters,
  showTransit,
  onToggleTransit,
  transitVehicleCount,
  transitStatus,
}: MapFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = activeCategories.length + Number(showTransit);
  const transitMessage =
    transitStatus === "error"
      ? "Unavailable"
      : transitStatus === "loading"
        ? "Loading"
        : transitStatus === "stale"
          ? `${transitVehicleCount} last known`
          : `${transitVehicleCount} live`;

  return (
    <div className="group absolute right-3 top-20 z-20 sm:right-6 sm:top-4">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-slate-50"
        aria-label="Map filters"
        aria-expanded={isOpen}
      >
        <SlidersHorizontal size={22} />

        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-[11px] font-bold text-white">
          {activeCount}
        </span>
      </button>

      <div
        className={`absolute right-0 top-16 w-56 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur transition-all duration-150 group-hover:visible group-hover:opacity-100 ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            Filters
          </span>

          <button
            type="button"
            onClick={onResetFilters}
            className="group/reset relative rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Reset filters"
          >
            <RotateCcw size={16} />

            <span className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 shadow-md transition-opacity duration-150 group-hover/reset:opacity-100">
              Reset filters
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {filters.map((filter) => {
            const isActive = activeCategories.includes(filter.value);

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => onToggleCategory(filter.value)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                  isActive
                    ? "bg-green-50 text-green-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border text-[11px] font-bold transition ${
                    isActive
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                >
                  ✓
                </span>

                {filter.label}
              </button>
            );
          })}

          <div className="my-1 border-t border-slate-200" />

          <button
            type="button"
            onClick={onToggleTransit}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition ${
              showTransit
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                showTransit
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 bg-white text-slate-500"
              }`}
            >
              <BusFront size={13} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium">Live transit</span>
              {showTransit && (
                <span
                  className={`block text-[10px] ${
                    transitStatus === "error"
                      ? "text-red-600"
                      : transitStatus === "stale"
                        ? "text-amber-600"
                        : "text-slate-500"
                  }`}
                >
                  {transitMessage}
                </span>
              )}
            </span>

            <span className="flex gap-1" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              <span className="h-2.5 w-2.5 rounded-full bg-pink-600" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
