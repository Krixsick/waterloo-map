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
        coordinates: [-80.5420, 43.4724],
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
        coordinates: [-80.5439, 43.4721],
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
        coordinates: [-80.5398, 43.4728],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "cmh",
        name: "Claudette Millar Hall",
        abbreviation: "CMH",
        category: "residence",
        description: "Student residence.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5359, 43.47026],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "rev",
        name: "Ron Eydt Village",
        abbreviation: "REV",
        category: "residence",
        description: "Student residence.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5535, 43.4705],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "v1",
        name: "Village 1",
        abbreviation: "V1",
        category: "residence",
        description: "First-year student residence.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.550028, 43.471639],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "uwp",
        name: "UW Place",
        abbreviation: "UWP",
        category: "residence",
        description: "Suite-style student residence.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.535889, 43.471056],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "mkv",
        name: "Mackenzie King Village",
        abbreviation: "MKV",
        category: "residence",
        description: "Suite-style student residence.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.552638, 43.471627],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "clv",
        name: "Columbia Lake Village",
        abbreviation: "CLV",
        category: "residence",
        description: "Upper-year student residence apartments.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.562757, 43.471563],
      },
    },
  ],
};
