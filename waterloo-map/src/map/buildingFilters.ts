import type { Map as MapboxMap } from "mapbox-gl";
import type { BuildingCategory } from "../data/buildings";

export function updateBuildingFilters(
  map: MapboxMap,
  activeCategories: BuildingCategory[],
) {
  const nonResidenceCategories = activeCategories.filter(
    (category) => category !== "residence",
  );

  const residencesActive =
    activeCategories.includes("residence");

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
    ["!", ["has", "parentId"]],
    residencesActive,
  ]);

  map.setFilter("campus-building-labels", [
    "all",
    [
      "in",
      ["get", "category"],
      ["literal", activeCategories],
    ],
    [
      "!",
      [
        "all",
        ["==", ["get", "category"], "residence"],
        ["has", "parentId"],
      ],
    ],
  ]);
}