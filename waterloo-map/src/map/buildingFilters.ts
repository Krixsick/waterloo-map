import type { Map as MapboxMap } from "mapbox-gl";
import type { BuildingCategory } from "../data/buildings";

export function updateBuildingFilters(
  map: MapboxMap,
  activeCategories: BuildingCategory[],
) {
  const nonResidenceCategories = activeCategories.filter(
    (category) => category !== "residence",
  );

  map.setFilter("campus-building-circles", [
    "in",
    ["get", "category"],
    ["literal", nonResidenceCategories],
  ]);

  map.setFilter("campus-building-glow", [
    "in",
    ["get", "category"],
    ["literal", nonResidenceCategories],
  ]);

  map.setFilter("residence-building-squares", [
    "all",
    ["==", ["get", "category"], "residence"],
    ["in", ["get", "category"], ["literal", activeCategories]],
  ]);

  map.setFilter("campus-building-labels", [
    "in",
    ["get", "category"],
    ["literal", activeCategories],
  ]);
}
