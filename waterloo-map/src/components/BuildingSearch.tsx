import { useMemo, useState } from "react";
import type mapboxgl from "mapbox-gl";
import { Search } from "lucide-react";
import { buildings } from "../data/buildings";

type BuildingSearchProps = {
  map: mapboxgl.Map | null;
};

export default function BuildingSearch({ map }: BuildingSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    const search = query.toLowerCase().trim();
    if (!search) return [];

    return buildings.features.filter((feature) => {
      const { name, abbreviation, category } = feature.properties;

      return (
        name.toLowerCase().includes(search) ||
        abbreviation.toLowerCase().includes(search) ||
        category.toLowerCase().includes(search)
      );
    });
  }, [query]);

  function flyToBuilding(feature: (typeof buildings.features)[number]) {
    if (!map) return;

    map.flyTo({
      center: feature.geometry.coordinates,
      zoom: 17,
      pitch: 0,
      bearing: -26,
      essential: true,
    });

    setQuery("");
    setIsOpen(false);
  }

  return (
    <div
      className="absolute left-4 top-4 z-10"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        if (!query) setIsOpen(false);
      }}
    >
      <div className="relative">
        <div
          className={`
            h-14 overflow-hidden rounded-full border border-slate-200 bg-white/95 shadow-lg backdrop-blur
            transition-all duration-300 ease-out
            ${isOpen ? "w-80" : "w-14"}
          `}
        >
          <div className="relative flex h-14 items-center">
            <Search
              size={22}
              className="absolute left-4 text-slate-600"
            />

            <input
              value={query}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search buildings..."
              className={`
                h-full w-full bg-transparent py-3 pl-13 pr-4 text-sm text-slate-800 outline-none
                placeholder:text-slate-400 transition-opacity duration-200
                ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}
              `}
            />
          </div>
        </div>

        {isOpen && results.length > 0 && (
          <div className="absolute left-0 top-16 max-h-80 w-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
            {results.map((feature) => (
              <button
                key={feature.properties.id}
                onClick={() => flyToBuilding(feature)}
                className="block w-full border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-green-50"
              >
                <div className="font-medium text-slate-900">
                  {feature.properties.abbreviation} —{" "}
                  {feature.properties.name}
                </div>

                <div className="text-xs capitalize text-slate-500">
                  {feature.properties.category}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}