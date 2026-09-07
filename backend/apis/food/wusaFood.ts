import * as cheerio from "cheerio";

import { withCache } from "../../cache";

import type {
  FoodCategory,
  FoodLocation,
} from "./types";

type WusaFoodConfig = {
  id: string;
  name: string;
  buildingId: string;
  category: FoodCategory;
  url: string;
};

const WUSA_FOOD_LOCATIONS: WusaFoodConfig[] = [
  {
    id: "smarty-pants",
    name: "Smarty Pants",
    buildingId: "slc",
    category: "dessert",
    url: "https://wusa.ca/services/food-retail/smarty-pants/",
  },
  {
    id: "wok-stop",
    name: "Wok Stop",
    buildingId: "slc",
    category: "restaurant",
    url: "https://wusa.ca/services/food-retail/wok-stop/",
  },
  {
    id: "chaska",
    name: "Chaska",
    buildingId: "slc",
    category: "restaurant",
    url: "https://wusa.ca/services/food-retail/chaska/",
  },
  {
    id: "the-bomber",
    name: "The Bomber",
    buildingId: "slc",
    category: "restaurant",
    url: "https://wusa.ca/services/food-retail/the-bomber/",
  },
  {
    id: "flock-stop",
    name: "Flock Stop",
    buildingId: "slc",
    category: "convenience",
    url: "https://wusa.ca/services/food-retail/flock-stop/",
  },
];

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTime(value: string) {
  const cleaned = normalizeText(value);

  return cleaned.replace(
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi,
    (_match, hour, minutes, meridiem) =>
      `${hour}:${minutes ?? "00"} ${meridiem.toLowerCase()}`,
  );
}

function normalizeHoursRange(value: string) {
  return normalizeTime(value)
    .replace(/\s*-\s*/g, " - ")
    .trim();
}

function createHours(
  days: string[],
  value: string,
) {
  const hours: Record<string, string> = {};

  for (const day of days) {
    hours[day] = value;
  }

  return hours;
}

function parseStandardWusaHours(
  text: string,
) {
  const hours: Record<string, string> = {};

  const mondayThursdayMatch =
    text.match(
      /Monday\s*-\s*Thursday:\s*([^F]+?)(?=\s+Friday:)/i,
    );

  if (mondayThursdayMatch) {
    const value = normalizeHoursRange(
      mondayThursdayMatch[1],
    );

    for (const day of [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
    ]) {
      hours[day] = value;
    }
  }

  const fridayMatch =
    text.match(
      /Friday:\s*(.+?)(?=\s+(?:Closed:|Student Life Centre|Get Directions|Our Menu|Specials|Follow Us|$))/i,
    );

  if (fridayMatch) {
    hours.Friday =
      normalizeHoursRange(
        fridayMatch[1],
      );
  }

  /*
   * These WUSA restaurants only list
   * Monday-Friday hours.
   *
   * Treat omitted weekend days as closed.
   */
  if (
    Object.keys(hours).length > 0
  ) {
    hours.Saturday = "Closed";
    hours.Sunday = "Closed";
  }

  return hours;
}

function parseBomberHours(
  text: string,
) {
  const match = text.match(
    /Kitchen\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)),?\s*Monday to Friday/i,
  );

  if (!match) {
    return {};
  }

  const value =
    normalizeHoursRange(match[1]);

  return {
    ...createHours(
      WEEKDAYS,
      value,
    ),
    Saturday: "Closed",
    Sunday: "Closed",
  };
}

function parseFlockStopHours(
  text: string,
) {
  if (
    /Open 24\/7/i.test(text)
  ) {
    return createHours(
      ALL_DAYS,
      "Open 24 hours",
    );
  }

  return {};
}

function normalizeDateRange(
  value: string,
) {
  return normalizeText(value)
    .replace(
      /\s*-\s*/g,
      " - ",
    )
    .trim();
}

function parseStandardClosure(
  text: string,
) {
  const match = text.match(
    /Closed:\s*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\s*-\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)?\s*\d{1,2})/i,
  );

  if (!match) {
    return [];
  }

  return [
    `${normalizeDateRange(
      match[1],
    )}: Closed`,
  ];
}

function parseBomberExceptions(
  text: string,
) {
  const exceptions: string[] = [];

  const rangeMatch = text.match(
    /August 20\s*-\s*September 28:\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)),?\s*Monday to Friday/i,
  );

  if (rangeMatch) {
    exceptions.push(
      `August 20 - September 28: ${normalizeHoursRange(
        rangeMatch[1],
      )}`,
    );
  }

  const august31 =
    text.match(
      /August 31:\s*Closed/i,
    );

  if (august31) {
    exceptions.push(
      "August 31: Closed",
    );
  }

  const septemberRange =
    text.match(
      /September 1\s*-\s*September 4:\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
    );

  if (septemberRange) {
    exceptions.push(
      `September 1 - September 4: ${normalizeHoursRange(
        septemberRange[1],
      )}`,
    );
  }

  if (
    /September 7:\s*Closed/i.test(
      text,
    )
  ) {
    exceptions.push(
      "September 7: Closed",
    );
  }

  return exceptions;
}

function parseFlockStopExceptions(
  text: string,
) {
  const exceptions: string[] = [];

  const august21 = text.match(
    /August 21:\s*Closing at\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
  );

  if (august21) {
    /*
     * We know the location is normally
     * open 24 hours, but the source only
     * specifies its closing time.
     *
     * Keep the source wording instead of
     * inventing an opening time.
     */
    exceptions.push(
      `August 21: Closing at ${normalizeTime(
        august21[1],
      )}`,
    );
  }

  const august22To23 =
    text.match(
      /August 22\s*-\s*23:\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
    );

  if (august22To23) {
    exceptions.push(
      `August 22 - August 23: ${normalizeHoursRange(
        august22To23[1],
      )}`,
    );
  }

  const august24To28 =
    text.match(
      /August 24\s*-\s*28:\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
    );

  if (august24To28) {
    exceptions.push(
      `August 24 - August 28: ${normalizeHoursRange(
        august24To28[1],
      )}`,
    );
  }

  const august29To30 =
    text.match(
      /August 29\s*-\s*30:\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
    );

  if (august29To30) {
    exceptions.push(
      `August 29 - August 30: ${normalizeHoursRange(
        august29To30[1],
      )}`,
    );
  }

  if (
    /August 31\s*-\s*closed/i.test(
      text,
    )
  ) {
    exceptions.push(
      "August 31: Closed",
    );
  }

  const september1To4 =
    text.match(
      /September 1\s*-\s*4:\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
    );

  if (september1To4) {
    exceptions.push(
      `September 1 - September 4: ${normalizeHoursRange(
        september1To4[1],
      )}`,
    );
  }

  /*
   * September 5 says:
   * "Opening at 9am - Regular hours resume"
   *
   * Since regular hours are 24/7 afterward,
   * we represent that day's special opening.
   */
  const september5 =
    text.match(
      /September 5:\s*Opening at\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
    );

  if (september5) {
    exceptions.push(
      `September 5: Opening at ${normalizeTime(
        september5[1],
      )}`,
    );
  }

  return exceptions;
}

function findMenuUrls(
    $: cheerio.CheerioAPI,
    pageUrl: string,
  ) {
    /*
     * 1. Prefer a real menu link.
     *
     * This is what The Bomber has, and it
     * already worked correctly before.
     */
    const menuAnchor = $("a")
      .filter((_, element) => {
        const text = normalizeText(
          $(element).text(),
        ).toLowerCase();
  
        return (
          text === "menu" ||
          text === "our menu" ||
          text === "view menu" ||
          text.includes("view menu")
        );
      })
      .first();
  
    const anchorHref =
      menuAnchor.attr("href");
  
    if (anchorHref) {
      try {
        return [
          new URL(
            anchorHref,
            pageUrl,
          ).toString(),
        ];
      } catch {
        return [anchorHref];
      }
    }
  
    /*
     * 2. If there is no real menu link,
     * fall back to embedded menu images.
     *
     * This handles Chaska, Wok Stop,
     * Smarty Pants, etc.
     */
    const urls: string[] = [];
  
    const menuImages = $("img").filter(
      (_, element) => {
        const alt = normalizeText(
          $(element).attr("alt") ?? "",
        ).toLowerCase();
  
        return alt.includes("menu");
      },
    );
  
    menuImages.each((_, element) => {
      const image = $(element);
  
      const srcset =
        image.attr("srcset");
  
      let imageUrl:
        | string
        | undefined;
  
      /*
       * Prefer largest image in srcset.
       */
      if (srcset) {
        const candidates = srcset
          .split(",")
          .map((candidate) =>
            candidate.trim(),
          )
          .map((candidate) => {
            const [url, width] =
              candidate.split(/\s+/);
  
            return {
              url,
              width: Number(
                width?.replace(
                  "w",
                  "",
                ),
              ),
            };
          })
          .filter(
            (candidate) =>
              candidate.url &&
              !Number.isNaN(
                candidate.width,
              ),
          )
          .sort(
            (a, b) =>
              b.width - a.width,
          );
  
        imageUrl =
          candidates[0]?.url;
      }
  
      if (!imageUrl) {
        imageUrl =
          image.attr("src");
      }
  
      if (!imageUrl) {
        return;
      }
  
      try {
        imageUrl = new URL(
          imageUrl,
          pageUrl,
        ).toString();
      } catch {
        // Keep original URL.
      }
  
      if (
        !urls.includes(imageUrl)
      ) {
        urls.push(imageUrl);
      }
    });
  
    return urls;
  }

function parseFoodData(
  config: WusaFoodConfig,
  $: cheerio.CheerioAPI,
) {
  const text = normalizeText(
    $("main").text(),
  );

  let hours: Record<
    string,
    string
  > = {};

  let exceptions: string[] =
    [];

  switch (config.id) {
    case "smarty-pants":
    case "wok-stop":
    case "chaska":
      hours =
        parseStandardWusaHours(
          text,
        );

      exceptions =
        parseStandardClosure(
          text,
        );

      break;

    case "the-bomber":
      hours =
        parseBomberHours(text);

      exceptions =
        parseBomberExceptions(
          text,
        );

      break;

    case "flock-stop":
      hours =
        parseFlockStopHours(
          text,
        );

      exceptions =
        parseFlockStopExceptions(
          text,
        );

      break;
  }

  return {
    hours,
    exceptions,
    menuUrls: findMenuUrls(
      $,
      config.url,
    ),
  };
}

async function scrapeWusaFood(): Promise<
  Record<string, FoodLocation>
> {
  const results: Record<
    string,
    FoodLocation
  > = {};

  for (const config of WUSA_FOOD_LOCATIONS) {
    try {
      const response =
        await fetch(config.url);

      if (!response.ok) {
        console.warn(
          `Failed to fetch WUSA food location: ${config.name}`,
        );

        continue;
      }

      const html =
        await response.text();

      const $ = cheerio.load(html);

      const {
        hours,
        exceptions,
        menuUrls,
      } = parseFoodData(
        config,
        $,
      );

      results[config.id] = {
        id: config.id,

        name: config.name,

        buildingId:
          config.buildingId,

        category:
          config.category,

        ...(config.id === "flock-stop" ? {
          location: "Student Life Centre (SLC)",
          description: "Student-run convenience store with affordable meals, coffee, snacks, drinks, and campus essentials. Offers hot grab-and-go food, salads, sandwiches, wraps, veggie bowls, baked goods, daily fresh Wasabi Sushi, Jamaican beef patties, and M&M Express Meals. Monthly deals and limited-time products are available. Contact: 519-888-4567 ext. 33371 or b2yeung@wusa.ca (Brandon Yeung).",
        } : {}),
        hours,

        exceptions,

        source: {
          name: "WUSA",
          url: config.url,
        },

        url: config.url,

        ...(menuUrls.length > 0
            ? {
                menu: {
                  type: "static",
                  urls: menuUrls,
                },
              }
            : {}),
      };
    } catch (error) {
      console.error(
        `Failed to scrape ${config.name}:`,
        error,
      );
    }
  }

  return results;
}

export async function getWusaFood() {
  return withCache(
    "wusafood:full-info:v6",
    60 * 5,
    scrapeWusaFood,
  );
}