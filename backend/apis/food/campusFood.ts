import * as cheerio from "cheerio";
import express from "express";
import type {
  CampusFoodConfig,
  CampusFoodResponse,
  Day,
} from "../../types/food";
import { withCache } from "../../cache";

const campus_food_router = express.Router();

const FOOD_SERVICES_URL =
  "https://uwaterloo.ca/food-services/locations-and-hours";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const CAMPUS_FOOD_LOCATIONS: Record<string, CampusFoodConfig> = {
  "Brubakers Food Court": {
    buildingId: "slc",
    searchName: "Brubakers Food Court Student Life Centre (SLC)",
  },

  "Starbucks - STC": {
    buildingId: "stc",
    searchName: "Starbucks Science Teaching Complex (STC)",
  },

  "Tim Hortons - DC": {
    buildingId: "dc-building",
    searchName: "Tim Hortons Davis Centre (DC)",
  },

  "Tim Hortons SLC": {
    buildingId: "slc",
    searchName: "Tim Hortons Student Life Centre (SLC)",
  },

  "Browsers Cafe": {
    buildingId: "dp",
    searchName: "Browsers Café Dana Porter Library (DPL)",
  },

  "CEIT Cafe": {
    buildingId: "eit",
    searchName:
      "CEIT Café Centre for Environmental & Information Technology (EIT)",
  },

  "Ev3rgreen Cafe": {
    buildingId: "ev3",
    searchName: "Ev3rgreen Café Environment 3 (EV3)",
  },

  "Liquid Assets Cafe": {
    buildingId: "hh",
    searchName: "Liquid Assets Café Hagey Hall (HH)",
  },

  "ML’s Diner": {
    buildingId: "ml",
    searchName: "ML's Diner Modern Languages (ML)",
  },

  "Rolltation HLTH": {
    buildingId: "exp",
    searchName: "Rolltation Health Expansion (EXP)",
  },

  "South Side Marketplace": {
    buildingId: "sch",
    searchName: "South Side Marketplace South Campus Hall (SCH)",
  },

  "Starbucks - HLTH": {
    buildingId: "exp",
    searchName: "Starbucks Health Expansion (EXP)",
  },

  "Tim Hortons - ML": {
    buildingId: "ml",
    searchName: "Tim Hortons Modern Languages (ML)",
  },

  "Tim Hortons - EC5": {
    buildingId: "ec5",
    searchName: "Tim Hortons East Campus 5 (EC5)",
  },

  "Tim Hortons - SCH": {
    buildingId: "sch",
    searchName: "Tim Hortons South Campus Hall (SCH)",
  },
};

function expandDayLabel(label: string): Day[] {
  const cleaned = label.replace(":", "").trim();

  if (cleaned.includes(",")) {
    return cleaned
      .split(",")
      .map((day) => day.trim())
      .filter((day): day is Day => DAYS.includes(day as Day));
  }

  const rangeParts = cleaned.split(/\s*[-–—]\s*/).map((day) => day.trim());

  if (rangeParts.length === 1) {
    const day = rangeParts[0] as Day;

    return DAYS.includes(day) ? [day] : [];
  }

  if (rangeParts.length !== 2) {
    return [];
  }

  const startDay = rangeParts[0] as Day;

  const endDay = rangeParts[1] as Day;

  const startIndex = DAYS.indexOf(startDay);

  let endIndex = DAYS.indexOf(endDay);

  if (startIndex === -1 || endIndex === -1) {
    return [];
  }

  if (endIndex < startIndex) {
    endIndex += DAYS.length;
  }

  const twoWeeks = [...DAYS, ...DAYS];

  return twoWeeks.slice(startIndex, endIndex + 1);
}

function getCleanLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function findLocationContainer(
  $: cheerio.CheerioAPI,
  anchor: cheerio.Cheerio<any>,
) {
  let current = anchor.parent();

  for (let i = 0; i < 10; i++) {
    if (!current.length) break;

    const text = current.text();

    if (text.includes("Hours of operation")) {
      return current;
    }

    current = current.parent();
  }

  return null;
}

function parseHours(lines: string[]) {
  const hours: Record<string, string> = {};

  const hoursHeadingIndex = lines.findIndex(
    (line) => line === "Hours of operation",
  );

  if (hoursHeadingIndex === -1) {
    return hours;
  }

  let index = hoursHeadingIndex + 1;

  while (index < lines.length) {
    const line = lines[index];

    if (line === "Exceptions" || line === "Description") {
      break;
    }

    const days = expandDayLabel(line);

    if (days.length > 0) {
      const time = lines[index + 1];

      if (time) {
        for (const day of days) {
          hours[day] = time;
        }

        index += 2;
        continue;
      }
    }

    index++;
  }

  return hours;
}

function parseExceptions(lines: string[]) {
  const exceptions: string[] = [];

  const exceptionsHeadingIndex = lines.findIndex(
    (line) => line === "Exceptions",
  );

  if (exceptionsHeadingIndex === -1) {
    return exceptions;
  }

  let index = exceptionsHeadingIndex + 1;

  while (index < lines.length) {
    const line = lines[index];

    if (line === "Description" || line === "Hours of operation") {
      break;
    }

    if (line.endsWith(":")) {
      const value = lines[index + 1];

      if (value) {
        exceptions.push(`${line} ${value}`);

        index += 2;
        continue;
      }
    }

    index++;
  }

  return exceptions;
}

function parseDescription(lines: string[]) {
  const descriptionIndex = lines.findIndex((line) => line === "Description");

  if (descriptionIndex === -1 || !lines[descriptionIndex + 1]) {
    return "";
  }

  return lines[descriptionIndex + 1];
}

async function scrapeCampusFood() {
  const $ = await cheerio.fromURL(FOOD_SERVICES_URL);

  const response: Record<string, CampusFoodResponse> = {};

  for (const [displayName, config] of Object.entries(CAMPUS_FOOD_LOCATIONS)) {
    const anchor = $("a")
      .filter((_, element) => {
        const text = $(element).text().replace(/\s+/g, " ").trim();

        return text.toLowerCase() === config.searchName.toLowerCase();
      })
      .first();

    if (!anchor.length) {
      console.warn(`Could not find campus food location: ${displayName}`);

      response[displayName] = {
        name: displayName,
        buildingId: config.buildingId,
        location: "",
        description: "",
        paymentMethods: [],
        hours: {},
        exceptions: [],
        url: FOOD_SERVICES_URL,
      };

      continue;
    }

    const container = findLocationContainer($, anchor);

    if (!container) {
      console.warn(`Could not find content container for: ${displayName}`);

      response[displayName] = {
        name: displayName,
        buildingId: config.buildingId,
        location: "",
        description: "",
        paymentMethods: [],
        hours: {},
        exceptions: [],
        url: FOOD_SERVICES_URL,
      };

      continue;
    }

    const lines = getCleanLines(container.text());

    const hours = parseHours(lines);

    const exceptions = parseExceptions(lines);

    const description = parseDescription(lines);

    response[displayName] = {
      name: displayName,
      buildingId: config.buildingId,
      location: "",
      description,
      paymentMethods: [],
      hours,
      exceptions,
      url: FOOD_SERVICES_URL,
    };
  }

  return response;
}

campus_food_router.get("/", async (req, res) => {
  try {
    const response = await withCache(
      "campusfood:full-info:v3",
      60 * 5,
      scrapeCampusFood,
    );

    res.json(response);
  } catch (error) {
    console.error("Campus food scrape failed:", error);

    res.status(500).json({
      error: "Failed to scrape campus food",
    });
  }
});

export default campus_food_router;
