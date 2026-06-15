import { SlidersHorizontal } from "lucide-react";
import type { BuildingCategory } from "../data/buildings";

type MapFiltersProps = {
  activeCategories: BuildingCategory[];
  onToggleCategory: (category: BuildingCategory) => void;
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
}: MapFiltersProps) {
  return (
    <div className="group absolute right-6 top-4 z-20">
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

      <div className="invisible absolute right-0 top-14 w-48 rounded-2xl border border-slate-200 bg-white/95 p-2 opacity-0 shadow-xl backdrop-blur transition-all duration-150 group-hover:visible group-hover:opacity-100">
        <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Show
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
                    className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] font-bold ${
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