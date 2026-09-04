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

type CampusFoodConfig = {
  id: string;
  buildingId: string;
  category: FoodCategory;
  searchName: string;
};

const CAMPUS_FOOD_LOCATIONS: Record<
  string,
  CampusFoodConfig
> = {
  "Brubakers Food Court": {
    id: "brubakers",
    buildingId: "slc",
    category: "food-court",
    searchName:
      "Brubakers Food Court Student Life Centre (SLC)",
  },

  "Starbucks - STC": {
    id: "starbucks-stc",
    buildingId: "stc",
    category: "cafe",
    searchName:
      "Starbucks Science Teaching Complex (STC)",
  },

  "Tim Hortons - DC": {
    id: "tim-hortons-dc",
    buildingId: "dc-building",
    category: "cafe",
    searchName:
      "Tim Hortons Davis Centre (DC)",
  },

  "Tim Hortons SLC": {
    id: "tim-hortons-slc",
    buildingId: "slc",
    category: "cafe",
    searchName:
      "Tim Hortons Student Life Centre (SLC)",
  },

  "Browsers Cafe": {
    id: "browsers-cafe",
    buildingId: "dp",
    category: "cafe",
    searchName:
      "Browsers Café Dana Porter Library (DPL)",
  },

  "CEIT Cafe": {
    id: "ceit-cafe",
    buildingId: "eit",
    category: "cafe",
    searchName:
      "CEIT Café Centre for Environmental & Information Technology (EIT)",
  },

  "Ev3rgreen Cafe": {
    id: "ev3rgreen-cafe",
    buildingId: "ev3",
    category: "cafe",
    searchName:
      "Ev3rgreen Café Environment 3 (EV3)",
  },

  "Liquid Assets Cafe": {
    id: "liquid-assets-cafe",
    buildingId: "hh",
    category: "cafe",
    searchName:
      "Liquid Assets Café Hagey Hall (HH)",
  },

  "ML’s Diner": {
    id: "mls-diner",
    buildingId: "ml",
    category: "restaurant",
    searchName:
      "ML's Diner Modern Languages (ML)",
  },

  "Rolltation HLTH": {
    id: "rolltation-hlth",
    buildingId: "exp",
    category: "restaurant",
    searchName:
      "Rolltation Health Expansion (EXP)",
  },

  "South Side Marketplace": {
    id: "south-side-marketplace",
    buildingId: "sch",
    category: "food-court",
    searchName:
      "South Side Marketplace South Campus Hall (SCH)",
  },

  "Starbucks - HLTH": {
    id: "starbucks-hlth",
    buildingId: "exp",
    category: "cafe",
    searchName:
      "Starbucks Health Expansion (EXP)",
  },

  "Tim Hortons - ML": {
    id: "tim-hortons-ml",
    buildingId: "ml",
    category: "cafe",
    searchName:
      "Tim Hortons Modern Languages (ML)",
  },

  "Tim Hortons - EC5": {
    id: "tim-hortons-ec5",
    buildingId: "ec5",
    category: "cafe",
    searchName:
      "Tim Hortons East Campus 5 (EC5)",
  },

  "Tim Hortons-SCH": {
    id: "tim-hortons-sch",
    buildingId: "sch",
    category: "cafe",
    searchName:
      "Tim Hortons South Campus Hall (SCH)",
  },
};

async function scrapeCampusFood(): Promise<
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
      CAMPUS_FOOD_LOCATIONS,
    )
  ) {
    const container =
      findLocationContainer(
        $,
        config.searchName,
      );

    if (!container) {
      console.warn(
        `Could not find food location: ${displayName}`,
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

    const foodLocation: FoodLocation =
      {
        id: config.id,

        name: displayName,

        buildingId:
          config.buildingId,

        category:
          config.category,

        description,

        hours,

        exceptions,

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

export async function getCampusFood() {
  return withCache(
    "campusfood:full-info:v6",
    60 * 5,
    scrapeCampusFood,
  );
}
