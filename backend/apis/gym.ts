import express from "express";
import * as cheerio from "cheerio";
import type { GymOccupy, GymFullInfo } from "../types/gym";
import { withCache } from "../cache";

const gymRouter = express.Router();

// DATA SOURCES

const ATHLETICS_HOURS_URL =
  "https://athletics.uwaterloo.ca/sports/2010/7/21/Facility_Hours.aspx";

const GYM_BUSYNESS_URL =
  "https://warrior.uwaterloo.ca/FacilityOccupancy";

const FALLBACK_HOURS_URLS = {
  PAC: "https://warrior.uwaterloo.ca/Facility/GetFacility?facilityId=7c59cbfb-ea06-46e0-8ec7-06739ccaec45",
  CIF: "https://warrior.uwaterloo.ca/Facility/GetFacility?facilityId=b2d98ff8-e37a-42da-bf72-06b259ff1a2c",
};

const PAC_OCCUPANCY_FACILITIES = [
  "PAC - 1st Floor - Free Weights",
  "PAC - 1st Floor - Functional",
  "PAC - 2nd Floor - Cardio",
  "PAC - 2nd Floor - Weight Machines",
  "Warrior Zone",
];

const CIF_OCCUPANCY_FACILITY = "CIF Fitness Centre";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS: Record<string, number> = {
  JANUARY: 0,
  FEBRUARY: 1,
  MARCH: 2,
  APRIL: 3,
  MAY: 4,
  JUNE: 5,
  JULY: 6,
  AUGUST: 7,
  SEPTEMBER: 8,
  OCTOBER: 9,
  NOVEMBER: 10,
  DECEMBER: 11,
};

// DATE UTILITIES

function getTorontoDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());

  const year = Number(
    parts.find((part) => part.type === "year")?.value,
  );

  const month =
    Number(parts.find((part) => part.type === "month")?.value) - 1;

  const day = Number(
    parts.find((part) => part.type === "day")?.value,
  );

  return new Date(year, month, day);
}

function getTorontoDayName() {
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    timeZone: "America/Toronto",
  }).format(new Date());
}

function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDateRange(value: string) {
  const match = normalizeText(value).match(
    /([A-Z]+)\s+(\d{1,2})\s*-\s*([A-Z]+)\s+(\d{1,2})/i,
  );

  if (!match) return null;

  const startMonth = MONTHS[match[1].toUpperCase()];
  const startDay = Number(match[2]);

  const endMonth = MONTHS[match[3].toUpperCase()];
  const endDay = Number(match[4]);

  if (
    startMonth === undefined ||
    endMonth === undefined ||
    Number.isNaN(startDay) ||
    Number.isNaN(endDay)
  ) {
    return null;
  }

  return {
    startMonth,
    startDay,
    endMonth,
    endDay,
  };
}

function isTodayInRange(value: string) {
  const range = parseDateRange(value);

  if (!range) return false;

  const today = getTorontoDate();
  const currentYear = today.getFullYear();

  for (const baseYear of [
    currentYear - 1,
    currentYear,
    currentYear + 1,
  ]) {
    const start = new Date(
      baseYear,
      range.startMonth,
      range.startDay,
    );

    const crossesYear =
      range.endMonth < range.startMonth ||
      (range.endMonth === range.startMonth &&
        range.endDay < range.startDay);

    const end = new Date(
      crossesYear ? baseYear + 1 : baseYear,
      range.endMonth,
      range.endDay,
    );

    if (today >= start && today <= end) {
      return true;
    }
  }

  return false;
}

function isTodayExactDate(value: string) {
  const normalized = normalizeText(value);

  const match = normalized.match(
    /(?:SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)?\s*,?\s*([A-Z]+)\s+(\d{1,2})$/i,
  );

  if (!match) return false;

  const month = MONTHS[match[1].toUpperCase()];
  const day = Number(match[2]);

  if (month === undefined || Number.isNaN(day)) {
    return false;
  }

  const today = getTorontoDate();

  return today.getMonth() === month && today.getDate() === day;
}

// LIVE OCCUPANCY

const scrapeGymBusyness = async () => {
  const $ = await cheerio.fromURL(GYM_BUSYNESS_URL);

  const gymOccupancy: Record<string, GymOccupy> = {};

  $(".col[data-facilityid]").each((_, element) => {
    const gymCard = $(element);

    const name = gymCard
      .find("h2 strong")
      .first()
      .text()
      .trim();

    const canvas = gymCard
      .find("canvas.occupancy-chart")
      .first();

    if (!name || canvas.length === 0) return;

    const occupancyValue = Number(
      canvas.attr("data-occupancy"),
    );

    const remainingValue = Number(
      canvas.attr("data-remaining"),
    );

    const ratioValue = Number(
      canvas.attr("data-ratio"),
    );

    const maxOccupancyValue = Number(
      gymCard
        .find(".max-occupancy strong")
        .first()
        .text()
        .trim(),
    );

    if (Number.isNaN(occupancyValue)) return;

    const occupancy = occupancyValue;

    const remaining = Number.isNaN(remainingValue)
      ? 0
      : remainingValue;

    const maxOccupancy = Number.isNaN(maxOccupancyValue)
      ? 0
      : maxOccupancyValue;

    const ratio = Number.isNaN(ratioValue)
      ? maxOccupancy > 0
        ? occupancy / maxOccupancy
        : 0
      : ratioValue;

    gymOccupancy[name] = {
      name,
      occupancy,
      remaining,
      maxOccupancy,
      ratio,
      percent: Math.round(ratio * 100),
    };
  });

  return gymOccupancy;
};

function getPacFacilityOccupancy(
  occupancyData: Record<string, GymOccupy>,
) {
  return Object.fromEntries(
    PAC_OCCUPANCY_FACILITIES.map((name) => [
      name,
      occupancyData[name],
    ]).filter(
      (
        entry,
      ): entry is [string, GymOccupy] =>
        Boolean(entry[1]),
    ),
  );
}

function aggregatePacOccupancy(
  occupancyData: Record<string, GymOccupy>,
): GymOccupy | undefined {
  const facilities = PAC_OCCUPANCY_FACILITIES.map(
    (name) => occupancyData[name],
  ).filter(
    (facility): facility is GymOccupy =>
      Boolean(facility),
  );

  if (facilities.length === 0) {
    return undefined;
  }

  const occupancy = facilities.reduce(
    (total, facility) =>
      total + (facility.occupancy ?? 0),
    0,
  );

  const maxOccupancy = facilities.reduce(
    (total, facility) =>
      total + (facility.maxOccupancy ?? 0),
    0,
  );

  const remaining = facilities.reduce(
    (total, facility) =>
      total + (facility.remaining ?? 0),
    0,
  );

  const ratio =
    maxOccupancy > 0
      ? occupancy / maxOccupancy
      : 0;

  return {
    name: "PAC",
    occupancy,
    remaining,
    maxOccupancy,
    ratio,
    percent: Math.round(ratio * 100),
  };
}

// REGULAR WARRIOR HOURS

const scrapeOneGymHours = async (
  url: string,
): Promise<Record<string, string>> => {
  const $ = await cheerio.fromURL(url);
  const bodyText = $("body").text();

  const hours: Record<string, string> = {};

  for (const day of DAYS) {
    const regex = new RegExp(
      `${day}\\s*:?\\s*(Closed|\\d{1,2}:\\d{2}\\s*[AP]M\\s*[-–]\\s*\\d{1,2}:\\d{2}\\s*[AP]M)`,
      "i",
    );

    const match = bodyText.match(regex);

    hours[day] =
      match?.[1]
        ?.replace(/\s+/g, " ")
        .trim() ?? "Unknown";
  }

  return hours;
};

const scrapeFallbackHours = async () => {
  const [pacHours, cifHours] = await Promise.all([
    scrapeOneGymHours(FALLBACK_HOURS_URLS.PAC),
    scrapeOneGymHours(FALLBACK_HOURS_URLS.CIF),
  ]);

  return {
    PAC: pacHours,
    CIF: cifHours,
  };
};

// ATHLETICS HOURS

type BuildingHours = {
  PAC: Record<string, string>;
  CIF: Record<string, string>;
};

type SpecialHours = {
  date: string;
  PAC: string;
  CIF: string;
};

async function scrapeAthleticsHours(): Promise<{
  schedule: BuildingHours | null;
  special: SpecialHours | null;
}> {
  const $ = await cheerio.fromURL(
    ATHLETICS_HOURS_URL,
  );

  let currentSection = "";
  let activeSchedule: BuildingHours | null = null;

  const specialRows: SpecialHours[] = [];

  $("h2, table").each((_, element) => {
    const node = $(element);
    const tagName = element.tagName.toLowerCase();

    if (tagName === "h2") {
      const heading = normalizeText(node.text());

      if (
        parseDateRange(heading) ||
        /SPECIAL HOURS\s*&\s*CLOSURES/i.test(
          heading,
        )
      ) {
        currentSection = heading;
      }

      return;
    }

    if (
      tagName !== "table" ||
      !currentSection
    ) {
      return;
    }

    const rows = node.find("tr");

    if (
      /SPECIAL HOURS\s*&\s*CLOSURES/i.test(
        currentSection,
      )
    ) {
      rows.each((_, row) => {
        const cells = $(row)
          .find("th, td")
          .map((_, cell) =>
            normalizeText($(cell).text()),
          )
          .get();

        if (cells.length < 3) return;

        const date = cells[0];
        const pac = cells[1];
        const cif = cells[2];

        if (
          !date ||
          /^DATE$/i.test(date) ||
          !pac ||
          !cif
        ) {
          return;
        }

        specialRows.push({
          date,
          PAC: pac,
          CIF: cif,
        });
      });

      return;
    }

    if (!isTodayInRange(currentSection)) {
      return;
    }

    const schedule: BuildingHours = {
      PAC: {},
      CIF: {},
    };

    rows.each((_, row) => {
      const cells = $(row)
        .find("th, td")
        .map((_, cell) =>
          normalizeText($(cell).text()),
        )
        .get();

      if (cells.length < 3) return;

      const day = DAYS.find(
        (item) =>
          item.toLowerCase() ===
          cells[0].toLowerCase(),
      );

      if (!day) return;

      schedule.PAC[day] = cells[1];
      schedule.CIF[day] = cells[2];
    });

    if (
      Object.keys(schedule.PAC).length > 0 &&
      Object.keys(schedule.CIF).length > 0
    ) {
      activeSchedule = schedule;
    }
  });

  const special =
    specialRows.find(
      (row) =>
        isTodayExactDate(row.date) ||
        isTodayInRange(row.date),
    ) ?? null;

  return {
    schedule: activeSchedule,
    special,
  };
}

async function resolveGymHours() {
  const fallbackHours =
    await scrapeFallbackHours();

  try {
    const athletics =
      await scrapeAthleticsHours();

    const resolvedHours: BuildingHours = {
      PAC:
        athletics.schedule &&
        Object.keys(athletics.schedule.PAC).length > 0
          ? { ...athletics.schedule.PAC }
          : { ...fallbackHours.PAC },

      CIF:
        athletics.schedule &&
        Object.keys(athletics.schedule.CIF).length > 0
          ? { ...athletics.schedule.CIF }
          : { ...fallbackHours.CIF },
    };

    if (athletics.special) {
      const today = getTorontoDayName();

      resolvedHours.PAC[today] =
        athletics.special.PAC;

      resolvedHours.CIF[today] =
        athletics.special.CIF;
    }

    return resolvedHours;
  } catch (error) {
    console.log(
      "Failed to load Athletics hours:",
      error,
    );

    return fallbackHours;
  }
}

// COMBINE GYM INFORMATION

const combineGymInformation = async (): Promise<
  Record<string, GymFullInfo>
> => {
  const [hoursData, occupancyData] =
    await Promise.all([
      resolveGymHours(),
      scrapeGymBusyness(),
    ]);

  const pacOverall =
    aggregatePacOccupancy(occupancyData);

  const pacFacilities =
    getPacFacilityOccupancy(occupancyData);

  const cifOccupancy =
    occupancyData[CIF_OCCUPANCY_FACILITY];

  const cifFacilities: Record<
    string,
    GymOccupy
  > = {};

  if (cifOccupancy) {
    cifFacilities[CIF_OCCUPANCY_FACILITY] =
      cifOccupancy;
  }

  return {
    PAC: {
      hours: hoursData.PAC,
      busyness: {
        overall: pacOverall,
        facilities: pacFacilities,
      },
    },

    CIF: {
      hours: hoursData.CIF,
      busyness: {
        overall: cifOccupancy,
        facilities: cifFacilities,
      },
    },
  };
};

// ROUTES

gymRouter.get("/", async (_req, res) => {
  try {
    const data = await withCache(
      "gym:full-info:v3",
      60 * 5,
      () => combineGymInformation(),
    );

    res.json(data);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Failed to load gym information",
    });
  }
});

export default gymRouter;