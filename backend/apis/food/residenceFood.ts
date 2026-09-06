import * as cheerio from "cheerio";

import { withCache } from "../../cache";

import {
  findLocationContainer,
  getCleanLines,
  parseDescription,
  parseExceptions,
  parseHours,
} from "./foodServicesUtils";

import type {
  FoodCategory,
  FoodLocation,
} from "./types";

const SOURCE_URL =
  "https://uwaterloo.ca/food-services/locations-and-hours";

type ResidenceFoodConfig = {
  id: string;
  buildingId: string;
  category: FoodCategory;
  searchName: string;
};

const RESIDENCE_FOOD_LOCATIONS: Record<
  string,
  ResidenceFoodConfig
> = {
  "Mudie’s - Village 1": {
    id: "mudies",
    buildingId: "v1",
    category: "dining-hall",
    searchName: "Mudie's",
  },

  "REVelation - Ron Eydt Village": {
    id: "revelation",
    buildingId: "rev",
    category: "dining-hall",
    searchName: "REVelation",
  },

  "The Market": {
    id: "the-market",
    buildingId: "cmh",
    category: "dining-hall",
    searchName: "The Market",
  },
};

async function scrapeResidenceFood(): Promise<
  Record<string, FoodLocation>
> {
  const response =
    await fetch(SOURCE_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch UW Food Services page: ${response.status}`,
    );
  }

  const html =
    await response.text();

  const $ = cheerio.load(html);

  const results: Record<
    string,
    FoodLocation
  > = {};

  for (
    const [
      displayName,
      config,
    ] of Object.entries(
      RESIDENCE_FOOD_LOCATIONS,
    )
  ) {
    const container =
      findLocationContainer(
        $,
        config.searchName,
      );

    if (!container) {
      console.warn(
        `Could not find residence food location: ${displayName}`,
      );

      continue;
    }

    const lines =
      getCleanLines(
        container.text(),
      );

    const hours =
      parseHours(lines);

    const exceptions =
      parseExceptions(lines);

    const description =
      parseDescription(lines);

      const foodLocation: FoodLocation = {
        id: config.id,
      
        name: displayName,
      
        buildingId: config.buildingId,
      
        category: config.category,
      
        description,
      
        hours,
      
        exceptions,
      
        menu: {
          type: "daily",
        },
      
        source: {
          name: "UW Food Services",
          url: SOURCE_URL,
        },
      
        url: SOURCE_URL,
      };

    results[config.id] =
      foodLocation;
  }

  return results;
}

export async function getResidenceFood() {
  return withCache(
    "residencefood:full-info:v6",
    60 * 5,
    scrapeResidenceFood,
  );
}
