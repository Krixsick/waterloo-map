import {
  BookOpen,
  Building2,
  Dumbbell,
  Home,
  Search,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapboxMap } from "mapbox-gl";
import type {
  BuildingCategory,
  buildings as buildingData,
} from "../../data/buildings";

type BuildingsGeoJSON = typeof buildingData;
type BuildingFeature = BuildingsGeoJSON["features"][number];

type SearchBarProps = {
  map: MapboxMap | null;
  buildings: BuildingsGeoJSON;
};

const categoryDetails: Record<
  BuildingCategory,
  { icon: LucideIcon; label: string; styles: string }
> = {
  academic: {
    icon: Building2,
    label: "Academic",
    styles: "bg-sky-100 text-sky-700",
  },
  library: {
    icon: BookOpen,
    label: "Library",
    styles: "bg-amber-100 text-amber-700",
  },
  gym: {
    icon: Dumbbell,
    label: "Gym",
    styles: "bg-rose-100 text-rose-700",
  },
  "student-life": {
    icon: Users,
    label: "Student life",
    styles: "bg-violet-100 text-violet-700",
  },
  residence: {
    icon: Home,
    label: "Residence",
    styles: "bg-emerald-100 text-emerald-700",
  },
};

export function SearchBar({ map, buildings }: SearchBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    const matches = search
      ? buildings.features.filter(({ properties }) =>
          [properties.name, properties.abbreviation, properties.category].some(
            (value) => value.toLowerCase().includes(search),
          ),
        )
      : buildings.features;

    return matches.slice(0, 6);
  }, [buildings, query]);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function selectBuilding(feature: BuildingFeature) {
    const [longitude, latitude] = feature.geometry.coordinates;

    map?.flyTo({
      center: [longitude, latitude],
      zoom: 17,
      pitch: 0,
      bearing: -26,
      essential: true,
    });

    setQuery(feature.properties.name);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  }

  function clearSearch() {
    setQuery("");
    setActiveIndex(-1);
    setIsOpen(true);
    inputRef.current?.focus();
  }

  function submitSearch() {
    const selectedResult =
      results[activeIndex] ?? (query.trim() ? results[0] : undefined);

    if (selectedResult) {
      selectBuilding(selectedResult);
      return;
    }

    setIsOpen(true);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (
      results.length &&
      (event.key === "ArrowDown" || event.key === "ArrowUp")
    ) {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        const next = current + direction;
        return (next + results.length) % results.length;
      });
      return;
    }

    if (event.key === "Enter" && results.length) {
      event.preventDefault();
      submitSearch();
    }
  }

  return (
    <div
      ref={containerRef}
      className="absolute left-3 right-3 top-3 z-1 sm:left-5 sm:right-auto sm:w-[25rem]"
    >
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.18)]">
        <form
          className="flex h-14 items-center"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
        >
          <button
            type="submit"
            aria-label="Search campus"
            className="flex size-14 shrink-0 cursor-pointer items-center justify-center text-slate-600 transition-colors hover:text-[#135f49]"
          >
            <Search className="size-5.5" strokeWidth={2.2} />
          </button>

          <input
            ref={inputRef}
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(-1);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search Waterloo campus"
            aria-label="Search Waterloo campus"
            aria-controls="campus-search-results"
            aria-expanded={isOpen}
            className="h-full min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-500"
          />

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="mr-1 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="size-5.5" />
            </button>
          )}
        </form>

        {isOpen && (
          <div
            id="campus-search-results"
            role="listbox"
            aria-label={query ? "Search results" : "Campus places"}
            className="max-h-[min(25rem,calc(100vh-6rem))] overflow-y-auto border-t border-slate-100 px-2 pb-2"
          >
            <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase text-slate-500">
              {query ? "Search results" : "Campus places"}
            </p>

            {results.map((feature, index) => {
              const category = categoryDetails[feature.properties.category];
              const Icon = category.icon;

              return (
                <button
                  key={feature.properties.id}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectBuilding(feature)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    activeIndex === index ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${category.styles}`}
                  >
                    <Icon className="size-5" strokeWidth={2} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {feature.properties.name}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {feature.properties.abbreviation} · {category.label}
                    </span>
                  </span>
                </button>
              );
            })}

            {query && !results.length && (
              <p className="px-3 py-6 text-center text-sm text-slate-500">
                No campus places found
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
