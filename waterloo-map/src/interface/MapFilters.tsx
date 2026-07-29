import { SlidersHorizontal, RotateCcw } from "lucide-react";
import type { BuildingCategory } from "../data/buildings";

type MapFiltersProps = {
  activeCategories: BuildingCategory[];
  onToggleCategory: (category: BuildingCategory) => void;
  onResetFilters: () => void;
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
}: MapFiltersProps) {
  return (
    <div className="group absolute right-3 top-20 z-20 sm:right-6 sm:top-4">
      <button
        type="button"
        className="relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-slate-50"
        aria-label="Map filters"
      >
        <SlidersHorizontal size={22} />

        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-[11px] font-bold text-white">
          {activeCategories.length}
        </span>
      </button>

      <div className="invisible absolute right-0 top-16 w-56 rounded-2xl border border-slate-200 bg-white/95 p-3 opacity-0 shadow-xl backdrop-blur transition-all duration-150 group-hover:visible group-hover:opacity-100">
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
        </div>
      </div>
    </div>
  );
}
