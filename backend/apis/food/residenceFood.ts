import * as cheerio from "cheerio";
import express from "express";
import { withCache } from "../../cache";

const residence_food_router = express.Router();

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

type Day = (typeof DAYS)[number];

type ResidenceFoodConfig = {
  residenceId: string;
  searchName: string;
};

type ResidenceFoodInfo = {
  name: string;
  residenceId: string;
  location: string;
  description: string[];
  payment: string[];
  hours: Record<string, string>;
  exceptions: string[];
  url: string;
};

const RESIDENCE_FOOD_LOCATIONS: Record<
  string,
  ResidenceFoodConfig
> = {
  "Mudie’s - Village 1": {
    residenceId: "v1",
    searchName: "Mudie's - Residence Dining Hall",
  },

  "REVelation - Ron Eydt Village": {
    residenceId: "rev",
    searchName: "REVelation - Residence Dining Hall",
  },

  "The Market": {
    residenceId: "cmh",
    searchName: "The Market - Residence Dining Hall",
  },
};


function expandDayLabel(label: string): Day[] {
  const cleaned = label
    .replace(":", "")
    .trim();
  if (cleaned.includes(",")) {
    return cleaned
      .split(",")
      .map((day) => day.trim())
      .filter((day): day is Day =>
        DAYS.includes(day as Day),
      );
  }
  const rangeParts = cleaned
    .split(/\s*[-–—]\s*/)
    .map((day) => day.trim());

  if (rangeParts.length === 1) {
    const day = rangeParts[0] as Day;

    return DAYS.includes(day)
      ? [day]
      : [];
  }

  if (rangeParts.length !== 2) {
    return [];
  }

  const startDay =
    rangeParts[0] as Day;

  const endDay =
    rangeParts[1] as Day;

  const startIndex =
    DAYS.indexOf(startDay);

  let endIndex =
    DAYS.indexOf(endDay);

  if (
    startIndex === -1 ||
    endIndex === -1
  ) {
    return [];
  }

  if (endIndex < startIndex) {
    endIndex += DAYS.length;
  }

  const twoWeeks = [
    ...DAYS,
    ...DAYS,
  ];

  return twoWeeks.slice(
    startIndex,
    endIndex + 1,
  );
}

function getCleanLines(text: string) {
  return text
    .split("\n")
    .map((line) =>
      line.replace(/\s+/g, " ").trim(),
    )
    .filter(Boolean);
}

function findLocationContainer(
  $: cheerio.CheerioAPI,
  anchor: cheerio.Cheerio<any>,
) {
  let current =
    anchor.parent();

  for (let i = 0; i < 10; i++) {
    if (!current.length) break;

    const text =
      current.text();

    if (
      text.includes(
        "Hours of operation",
      )
    ) {
      return current;
    }

    current = current.parent();
  }

  return null;
}

/**
 * Parse regular weekly hours.
 */
function parseHours(
  lines: string[],
) {
  const hours: Record<
    string,
    string
  > = {};

  const hoursHeadingIndex =
    lines.findIndex(
      (line) =>
        line === "Hours of operation",
    );

  if (hoursHeadingIndex === -1) {
    return hours;
  }

  let index =
    hoursHeadingIndex + 1;

  while (index < lines.length) {
    const line = lines[index];

    if (
      line === "Exceptions" ||
      line === "Description"
    ) {
      break;
    }

    const days =
      expandDayLabel(line);

    if (days.length > 0) {
      const time =
        lines[index + 1];

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

function parseExceptions(
  lines: string[],
) {
  const exceptions: string[] = [];

  const exceptionsHeadingIndex =
    lines.findIndex(
      (line) => line === "Exceptions",
    );

  if (
    exceptionsHeadingIndex === -1
  ) {
    return exceptions;
  }

  let index =
    exceptionsHeadingIndex + 1;

  while (index < lines.length) {
    const line = lines[index];

    if (
      line === "Description" ||
      line === "Hours of operation"
    ) {
      break;
    }

    
    if (line.endsWith(":")) {
      const value =
        lines[index + 1];

      if (value) {
        exceptions.push(
          `${line} ${value}`,
        );

        index += 2;
        continue;
      }
    }

    index++;
  }

  return exceptions;
}


function parseDescription(
  lines: string[],
) {
  const descriptionIndex =
    lines.findIndex(
      (line) => line === "Description",
    );

  if (
    descriptionIndex === -1 ||
    !lines[descriptionIndex + 1]
  ) {
    return [];
  }

  return [
    lines[descriptionIndex + 1],
  ];
}

async function scrapeResidenceFood() {
  const $ =
    await cheerio.fromURL(
      FOOD_SERVICES_URL,
    );

  const response: Record<
    string,
    ResidenceFoodInfo
  > = {};

  for (
    const [
      displayName,
      config,
    ] of Object.entries(
      RESIDENCE_FOOD_LOCATIONS,
    )
  ) {
    
    const anchor = $("a")
      .filter((_, element) => {
        const text = $(element)
          .text()
          .replace(/\s+/g, " ")
          .trim();

        return text.includes(
          config.searchName,
        );
      })
      .first();

    if (!anchor.length) {
      console.warn(
        `Could not find residence food location: ${displayName}`,
      );

      response[displayName] = {
        name: displayName,
        residenceId:
          config.residenceId,
        location: "",
        description: [],
        payment: [],
        hours: {},
        exceptions: [],
        url: FOOD_SERVICES_URL,
      };

      continue;
    }

    const container =
      findLocationContainer(
        $,
        anchor,
      );

    if (!container) {
      console.warn(
        `Could not find content container for: ${displayName}`,
      );

      response[displayName] = {
        name: displayName,
        residenceId:
          config.residenceId,
        location: "",
        description: [],
        payment: [],
        hours: {},
        exceptions: [],
        url: FOOD_SERVICES_URL,
      };

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

    
    const location =
      config.residenceId === "v1"
        ? "Village 1 (V1)"
        : config.residenceId ===
            "rev"
          ? "Ron Eydt Village (REV)"
          : config.residenceId ===
              "cmh"
            ? "Claudette Millar Hall (CMH)"
            : "";

    response[displayName] = {
      name: displayName,
      residenceId:
        config.residenceId,
      location,
      description,
      payment: [],
      hours,
      exceptions,
      url: FOOD_SERVICES_URL,
    };
  }

  return response;
}

residence_food_router.get(
  "/",
  async (req, res) => {
    try {
      const response =
        await withCache(
          "residencefood:full-info:v3",
          60 * 5,
          scrapeResidenceFood,
        );

      res.json(response);
    } catch (error) {
      console.error(
        "Residence food scrape failed:",
        error,
      );

      res.status(500).json({
        error:
          "Failed to scrape residence food",
      });
    }
  },
);

export default residence_food_router;