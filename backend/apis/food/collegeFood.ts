import axios from "axios";
import * as cheerio from "cheerio";
import { withMemoryCache } from "../../cache";
import type { FoodLocation } from "./types";

export const collegeFoodSources = {
  renison: { name: "Renison Cafeteria", url: "https://uwaterloo.ca/renison-student-experience/menu" },
  united: { name: "Watson's Eatery", url: "https://uwaterloo.ca/united-college/food-services/hours" },
  grebel: { name: "Conrad Grebel Cafeteria", url: "https://uwaterloo.ca/grebel/dining" },
};
type College = keyof typeof collegeFoodSources;
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const clean = (text: string) => text.replace(/\s+/g, " ").trim();
const clock = "(\\d{1,2})(?::(\\d{2}))?\\s*([ap]m)?";

function timeRange(text: string): string | null {
  const match = [...text.replace(/\./g, "").matchAll(new RegExp(`${clock}\\s*(?:[-–—]|to)\\s*${clock}`, "gi"))].find((range) => range[6]);
  if (!match) return null;
  const startPeriod = match[3] ?? match[6];
  if (!startPeriod || !match[6]) return null;
  return `${Number(match[1])}:${match[2] ?? "00"}${startPeriod.toUpperCase()} - ${Number(match[4])}:${match[5] ?? "00"}${match[6].toUpperCase()}`;
}

function meals(text: string): string[] {
  return text.split("\n").flatMap((line) => {
    const range = timeRange(line);
    const label = line.match(/^\s*((?:Hot|Cold|Continental)\s+breakfast|Breakfast|Lunch|Dinner|Supper|Brunch)\b/i)?.[1];
    if (!range || !label) return [];
    return [`${label.replace(/\b\w/g, (c) => c.toUpperCase())} ${range}`];
  });
}

function torontoDate(now: Date): Date {
  const label = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return new Date(`${label}T12:00:00Z`);
}

// Ontario statutory holidays; published date-specific notices take precedence.
function statutoryHoliday(date: Date): boolean {
  const year = date.getUTCFullYear(), month = date.getUTCMonth() + 1, day = date.getUTCDate(), weekday = date.getUTCDay();
  if ([[1, 1], [7, 1], [12, 25], [12, 26]].some(([m, d]) => month === m && day === d)) return true;
  if (weekday === 1 && ((month === 2 && day >= 15 && day <= 21) || (month === 5 && day >= 18 && day <= 24) || (month === 9 && day <= 7) || (month === 10 && day >= 8 && day <= 14))) return true;
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const easter = new Date(Date.UTC(year, Math.floor((h + l - 7 * m + 114) / 31) - 1, (h + l - 7 * m + 114) % 31 + 1));
  easter.setUTCDate(easter.getUTCDate() - 2);
  return month === easter.getUTCMonth() + 1 && day === easter.getUTCDate();
}

export function parseCollegeFood(college: College, html: string, now = new Date()): FoodLocation {
  const $ = cheerio.load(html);
  $("br").replaceWith("\n");
  const date = torontoDate(now);
  const spring = date.getUTCMonth() >= 4 && date.getUTCMonth() <= 7;
  let weekday: string[] = [], weekend: string[] = [];
  const exceptions: string[] = [];
  let wednesdaySupper: string | null = null;

  if (college === "renison") {
    const heading = $("h2").filter((_, el) => /Hours of Operation/i.test($(el).text())).first();
    const paragraphs = heading.length ? heading.nextUntil("h2").filter("p") : $("p");
    paragraphs.each((_, el) => {
      const text = $(el).text();
      if (/Weekdays/i.test(text)) weekday = meals(text);
      if (/Weekends/i.test(text)) weekend = meals(text);
    });
  } else if (college === "grebel") {
    const heading = $("h3").filter((_, el) => spring ? /Spring Term/i.test($(el).text()) : /Fall and Winter Term/i.test($(el).text())).first();
    heading.nextUntil("h3,h2").filter("p").each((_, el) => {
      const text = $(el).text();
      if (/Monday through Friday/i.test(text)) {
        weekday = meals(text);
        wednesdaySupper = timeRange(text.match(/Wednesday supper[^\n]+/i)?.[0] ?? "");
      }
      if (/Weekends/i.test(text)) weekend = meals(text);
    });
  } else {
    const heading = $("h3").filter((_, el) => spring ? /Spring Term/i.test($(el).text()) : /Fall\/Winter Term/i.test($(el).text())).first();
    const table = heading.nextAll("table").first();
    let isWeekend = false;
    table.find("tr").each((_, row) => {
      const cells = $(row).find("td");
      if (/Weekends.*Holidays/i.test($(row).text())) { isWeekend = true; return; }
      let label = clean(cells.first().text());
      if (isWeekend && label === "Brunch") label = "Continental Brunch";
      else if (isWeekend && !label && /Hot Entrées/i.test(cells.eq(1).text())) label = "Hot Brunch";
      const range = timeRange(cells.last().text());
      if (!range || !/^(Breakfast|Lunch|Dinner|Continental Brunch|Hot Brunch)$/.test(label)) return;
      (isWeekend ? weekend : weekday).push(`${label} ${range}`);
    });
    const update = $("h2").filter((_, el) => /Hours Update/i.test($(el).text())).first();
    const year = update.text().match(/20\d{2}/)?.[0];
    if (update.length && (!year || Number(year) === date.getUTCFullYear())) {
      const blocks = update.nextUntil("h2,h3");
      blocks.filter("p").each((_, el) => {
        const text = clean($(el).text());
        const dateLabel = text.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:\s*[-–—]\s*(?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+)?\d{1,2})?/i)?.[0];
        if (!dateLabel) return;
        const label = dateLabel.replace(/\s*[-–—]\s*/g, " - ");
        if (/closed/i.test(text)) exceptions.push(`${label}: Closed`);
        else {
          const list = $(el).next("ul");
          const mealTimes = list.find("li").toArray().flatMap((li) => meals($(li).text()));
          const hours = mealTimes.length ? mealTimes.join(" · ") : timeRange(text);
          if (hours) exceptions.push(`${label}: ${hours}`);
        }
      });
    }
  }
  if (!weekday.length || !weekend.length) throw new Error(`Missing meal hours for ${college}`);
  const hours: Record<string, string> = Object.fromEntries(days.map((day) => [day, (day === "Sunday" || day === "Saturday" ? weekend : weekday).join(" · ")]));
  if (wednesdaySupper) hours.Wednesday = weekday.map((meal) => meal.startsWith("Supper ") ? `Supper (Grebel community only) ${wednesdaySupper}` : meal).join(" · ");
  if (statutoryHoliday(date)) hours[days[date.getUTCDay()]] = weekend.join(" · ");
  const source = collegeFoodSources[college];
  const menuUrl = college === "renison" ? source.url : college === "grebel" ? $("a").filter((_, el) => /weekly-menu/.test($(el).attr("href") ?? "")).first().attr("href") : undefined;
  return {
    id: `${college}-cafeteria`, name: source.name, buildingId: college, category: "dining-hall", hours, exceptions,
    description: college === "grebel" ? "Wednesday supper is a private event for the Grebel community. Weekend hours also apply on holidays." : "Weekend meal hours also apply on statutory holidays.",
    ...(college === "grebel" ? { payment: ["Debit", "Credit"] } : {}),
    ...(menuUrl ? { menu: { type: "weekly" as const, url: new URL(menuUrl, source.url).href } } : {}),
    url: source.url, source: { name: source.name, url: source.url },
  };
}

export async function getCollegeFood(): Promise<Record<string, FoodLocation>> {
  const entries = await Promise.all((Object.keys(collegeFoodSources) as College[]).map(async (college) => {
    try {
      const html = await withMemoryCache(`college-food:${college}`, 5 * 60, async () => {
        const response = await axios.get<string>(collegeFoodSources[college].url, { timeout: 15_000 });
        return response.data;
      });
      const food = parseCollegeFood(college, html);
      return [food.id, food] as const;
    } catch (error) {
      console.error(`Could not load ${college} food hours:`, error instanceof Error ? error.message : error);
      const source = collegeFoodSources[college];
      return [`${college}-cafeteria`, { id: `${college}-cafeteria`, name: source.name, buildingId: college, category: "dining-hall", source: { name: source.name, url: source.url }, url: source.url } satisfies FoodLocation] as const;
    }
  }));
  return Object.fromEntries(entries);
}
