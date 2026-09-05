import { Search, X, MapPin, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  BuildingFeature,
  BuildingsGeoJSON,
} from "../../data/buildings";
import { buildingCategoryDetails } from "../buildingCategoryDetails";

export type SearchItem = { icon?: LucideIcon; iconStyles?: string; id: string; name: string; subtitle: string; keywords: string; onSelect: () => void };

type SearchBarProps = {
  items?: SearchItem[];
  buildings: BuildingsGeoJSON;
  onSelectBuilding: (building: BuildingFeature) => void;
};

export function SearchBar({ buildings, onSelectBuilding, items = [] }: SearchBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const results = useMemo(() => {
    const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const search = normalize(query);
    const all: SearchItem[] = [...buildings.features.map(feature => ({
      icon: buildingCategoryDetails[feature.properties.category].icon, iconStyles: buildingCategoryDetails[feature.properties.category].styles,
      id: `building:${feature.properties.id}`, name: feature.properties.name,
      subtitle: `${feature.properties.abbreviation} · ${buildingCategoryDetails[feature.properties.category].label}`,
      keywords: `${feature.properties.abbreviation} ${feature.properties.category} ${feature.properties.description ?? ""}`,
      onSelect: () => onSelectBuilding(feature),
    })), ...items];
    if (!search) return all.slice(0, 6);
    return all.filter(item => search.split(" ").every(word => normalize(`${item.name} ${item.subtitle} ${item.keywords}`).includes(word)))
      .sort((a,b) => Number(normalize(b.name) === search) - Number(normalize(a.name) === search) || Number(normalize(b.name).startsWith(search)) - Number(normalize(a.name).startsWith(search)));
  }, [buildings, query, items, onSelectBuilding]);

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

  function selectBuilding(feature: SearchItem) {
    feature.onSelect();
    setQuery(feature.name);
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
      className="absolute left-3 right-3 top-3 z-40 sm:left-5 sm:right-auto sm:w-[25rem]"
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
            placeholder="Search places, food, transit…"
            aria-label="Search Waterloo campus"
            aria-controls="campus-search-results"
            aria-expanded={isOpen}
            className="font-title h-full min-w-0 flex-1 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-500"
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
            <p className="text-ui-label px-3 pb-1 pt-3 text-slate-500">
              {query ? "Search results" : "Campus places"}
            </p>

            {results.map((feature, index) => {
              const Icon = feature.icon ?? MapPin;

              return (
                <button
                  key={feature.id}
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
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${feature.iconStyles ?? "bg-slate-100 text-slate-600"}`}
                  >
                    <Icon className="size-5" strokeWidth={2} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="font-title block truncate text-sm font-semibold text-slate-900">
                      {feature.name}
                    </span>
                    <span className="text-ui-meta block truncate text-slate-500">
                      {feature.subtitle}
                    </span>
                  </span>
                </button>
              );
            })}

            {query && !results.length && (
              <p className="font-title px-3 py-6 text-center text-sm text-slate-500">
                No matching places, food, routes, stops, or events
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
