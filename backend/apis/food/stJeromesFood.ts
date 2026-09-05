import axios from "axios";
import * as cheerio from "cheerio";

import { withCache } from "../../cache";

import type { FoodLocation } from "./types";

const ST_JEROMES_FOOD_URL =
  "https://uwaterloo.ca/st-jeromes/student-life/residence-and-food-services/food-services";

function normalizeText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim();
}

function getCurrentTerm() {
  const formatter = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Toronto",
      month: "numeric",
    },
  );

  const month = Number(
    formatter.format(new Date()),
  );

  // September-April = Fall/Winter
  // May-August = Spring
  return month >= 5 && month <= 8
    ? "spring"
    : "fall-winter";
}

function getSectionText(
  $: cheerio.CheerioAPI,
  headingText: string,
) {
  const heading = $("h2")
    .filter((_, element) =>
      normalizeText($(element).text())
        .toLowerCase()
        .includes(
          headingText.toLowerCase(),
        ),
    )
    .first();

  if (!heading.length) {
    return "";
  }

  return normalizeText(
    heading
      .nextUntil("h2")
      .text(),
  );
}

function parseDougLetsonHours(
    $: cheerio.CheerioAPI,
  ) {
    const text = getSectionText(
      $,
      "Doug Letson Community Centre",
    );
  
    if (!text) {
      return {};
    }
  
    const term = getCurrentTerm();
  
    const weekdayHours =
      term === "spring"
        ? "Breakfast 7:30AM - 9:30AM · Lunch 11:00AM - 1:30PM · Dinner 5:00PM - 6:30PM"
        : "Breakfast 7:30AM - 9:30AM · Lunch 11:00AM - 2:00PM · Dinner 5:00PM - 7:00PM";
  
    const weekendHours =
      term === "spring"
        ? "Continental Breakfast 9:00AM - 10:00AM · Brunch 10:00AM - 1:00PM · Dinner 5:00PM - 6:30PM"
        : "Continental Breakfast 9:00AM - 10:00AM · Brunch 10:00AM - 1:00PM · Dinner 5:00PM - 7:00PM";
  
    return {
      Monday: weekdayHours,
      Tuesday: weekdayHours,
      Wednesday: weekdayHours,
      Thursday: weekdayHours,
      Friday: weekdayHours,
      Saturday: weekendHours,
      Sunday: weekendHours,
    };
  }

  function parseFunckenCafeHours(
    $: cheerio.CheerioAPI,
  ) {
    const text = getSectionText(
      $,
      "Funcken Café",
    );
  
    if (!text) {
      return {};
    }
  
    const term = getCurrentTerm();
  
    const weekdayHours =
      term === "spring"
        ? "9:00AM - 3:00PM"
        : "8:30AM - 5:00PM";
  
    return {
      Monday: weekdayHours,
      Tuesday: weekdayHours,
      Wednesday: weekdayHours,
      Thursday: weekdayHours,
      Friday: weekdayHours,
      Saturday: "Closed",
      Sunday: "Closed",
    };
  }
export async function scrapeStJeromesFood(): Promise<
  Record<string, FoodLocation>
> {
  const response = await axios.get(
    ST_JEROMES_FOOD_URL,
  );

  const $ = cheerio.load(
    response.data,
  );

  const dougLetsonHours =
    parseDougLetsonHours($);

  const funckenHours =
    parseFunckenCafeHours($);

  return {
    "doug-letson-community-centre": {
      id: "doug-letson-community-centre",

      name: "Doug Letson Community Centre",

      buildingId: "sju",

      category: "dining-hall",

      description:
        "Dining hall serving freshly prepared meals seven days a week at St. Jerome's University.",

      payment: [
        "Debit",
        "Credit",
      ],

      hours: dougLetsonHours,

      menu: {
        type: "daily",
        url: "https://stjeromes.icaneat.ca/menu/",
      },

      url: ST_JEROMES_FOOD_URL,

      source: {
        name:
          "St. Jerome's University",
        url:
          ST_JEROMES_FOOD_URL,
      },
    },

    "funcken-cafe": {
      id: "funcken-cafe",

      name: "Funcken Café",

      buildingId: "sju",

      category: "cafe",

      description:
        "Campus café serving sandwiches, fair-trade organic coffee, specialty drinks, and other grab-and-go options.",

      hours: funckenHours,

      menu: {
        type: "daily",
        url: "https://thefunckencafe.com/",
      },

      url: ST_JEROMES_FOOD_URL,

      source: {
        name:
          "St. Jerome's University",
        url:
          ST_JEROMES_FOOD_URL,
      },
    },
  };
}

export async function getStJeromesFood() {
  return withCache(
    "stjeromesfood:full-info:v5",
    60 * 5,
    scrapeStJeromesFood,
  );
}