import type { FoodLocation } from "./types";

// Locations supplied by the project owner; hours have not been confirmed.
export const engineeringFood: Record<string, FoodLocation> = Object.fromEntries(
  ["e7", "cph"].map(buildingId => {
    const id = `eng-cnd-${buildingId}`;
    return [id, {
      id, name: `Engineering C&D - ${buildingId.toUpperCase()}`,
      buildingId, category: "cafe", categories: ["cafe", "convenience"],
      location: buildingId.toUpperCase(),
      description: "Engineering Coffee & Donut shop. Hours have not been confirmed.",
      source: { name: "Location provided by project owner", url: "" },
    } satisfies FoodLocation];
  }),
);
