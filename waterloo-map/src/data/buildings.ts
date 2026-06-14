import type { FeatureCollection, Point } from "geojson";

export const buildings: FeatureCollection<
  Point,
  {
    id: string;
    name: string;
    abbreviation: string;
    category: string;
    description: string;
  }
> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "dc",
        name: "Davis Centre",
        abbreviation: "DC",
        category: "library",
        description: "Library, study spaces, computer labs.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5429, 43.4724],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "mc",
        name: "Mathematics and Computer Building",
        abbreviation: "MC",
        category: "academic",
        description: "Math and computer science building.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5431, 43.4729],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "e7",
        name: "Engineering 7",
        abbreviation: "E7",
        category: "academic",
        description: "Engineering building with study spaces.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.54, 43.4727],
      },
    },
  ],
};
