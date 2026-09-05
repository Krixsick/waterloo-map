import axios from "axios";
import * as cheerio from "cheerio";
import { withMemoryCache } from "../cache";
import type { TimeSlot } from "../types/library";

export const collegeLibrarySources: Record<string, string> = {
  "St. Jerome's University Library": "https://uwaterloo.ca/st-jeromes/library-hours-and-contacts",
  "Lusi Wong Library": "https://uwaterloo.ca/renison/lusi-wong-library",
  "Milton Good Library": "https://uwaterloo.ca/grebel/milton-good-library/hours-access",
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const clean = (value: string) => value.replace(/\s+/g, " ").trim();

function datesIn(text: string, year: number): Date[] {
  const explicitYear = text.match(/\b(20\d{2})\b/);
  const resolvedYear = explicitYear ? Number(explicitYear[1]) : year;
  const pattern = new RegExp(`(${months.join("|")})\\s+(\\d{1,2})(?:st|nd|rd|th)?`, "gi");
  return [...text.matchAll(pattern)].map((match) => new Date(Date.UTC(
    resolvedYear, months.findIndex((month) => month.toLowerCase() === match[1].toLowerCase()), Number(match[2]),
  )));
}

function normalizeHours(text: string): string | null {
  if (/\bclosed\b/i.test(text)) return "Closed";
  const times = [...text.replace(/\./g, "").matchAll(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi)];
  if (times.length !== 2) return null;
  const minutes = times.map((match) => (Number(match[1]) % 12 + (match[3].toLowerCase() === "pm" ? 12 : 0)) * 60 + Number(match[2] ?? 0));
  if (times.some((match) => Number(match[1]) < 1 || Number(match[1]) > 12 || Number(match[2] ?? 0) > 59) || minutes[1] <= minutes[0]) return "Hours unavailable";
  return times.map((match) => `${Number(match[1])}:${match[2] ?? "00"}${match[3].toLowerCase()}`).join(" – ");
}

export function parseCollegeLibraryHours(html: string, now = new Date()): TimeSlot[] {
  const $ = cheerio.load(html);
  const today = new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(now)}T00:00:00Z`);
  const year = today.getUTCFullYear();
  const schedules: { start?: Date; days: Record<string, string> }[] = [];
  const exceptions: { start: Date; end: Date; hours?: string; closing?: string }[] = [];

  // Weekly tables and dated holiday overrides.
  $("table").each((_, table) => {
    const days: Record<string, string> = {};
    $(table).find("tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 2) return;
      const label = clean(cells.eq(0).text());
      const hours = normalizeHours(clean(cells.eq(1).text()));
      if (!hours) return;
      const dates = datesIn(label, year);
      if (dates.length) {
        exceptions.push({ start: dates[0], end: dates.at(-1)!, hours });
        return;
      }
      const names = weekdays.filter((day) => label.includes(day));
      if (names.length === 2 && /[-–—]|\bto\b/i.test(label)) {
        const first = weekdays.indexOf(label.match(/Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday/)![0]);
        const last = weekdays.indexOf(names.find((name) => name !== weekdays[first])!);
        for (let i = first; ; i = (i + 1) % 7) {
          days[weekdays[i]] = hours;
          if (i === last) break;
        }
      } else names.forEach((name) => { days[name] = hours; });
    });
    if (!Object.keys(days).length) return;
    const heading = $(table).prevAll("h2,h3").first().text();
    const introduction = $(table).prevAll("p").map((_, p) => $(p).text()).get().find((p) => /hours.*(?:resume|begin|start)/i.test(p)) ?? "";
    const startText = /begin|start|resume/i.test(heading) ? heading : introduction;
    schedules.push({ start: datesIn(startText, year)[0], days });
  });

  // Closure notices and temporary early closing times outside tables.
  $("p").each((_, paragraph) => {
    const text = clean($(paragraph).text());
    if (!/\bclos(?:ed|ure|e at)\b/i.test(text)) return;
    const dates = datesIn(text, year);
    if (!dates.length) return;
    if (/\bclosed\b|\bclosure\b/i.test(text)) {
      exceptions.push({ start: dates[0], end: dates.at(-1)!, hours: "Closed" });
    } else {
      const closing = text.replace(/\./g, "").match(/close at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i)?.[1];
      if (closing) exceptions.push({ start: dates[0], end: dates.at(-1)!, closing });
    }
  });
  if (!schedules.length) throw new Error("No library hours table found");

  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today.getTime() + offset * 86_400_000);
    const eligible = schedules.filter((schedule) => !schedule.start || schedule.start <= date);
    const schedule = eligible.at(-1);
    let hours = schedule?.days[weekdays[date.getUTCDay()]] ?? "Hours unavailable";
    for (const exception of exceptions) {
      if (date < exception.start || date > exception.end) continue;
      if (exception.hours) hours = exception.hours;
      else if (exception.closing) {
        hours = normalizeHours(`${hours.split(" – ")[0]} – ${exception.closing}`) ?? "Hours unavailable";
      }
    }
    return {
      date: new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", month: "short", day: "2-digit" }).format(date),
      time: hours,
    };
  });
}

export async function loadCollegeLibraryHours(): Promise<Record<string, TimeSlot[]>> {
  const entries = await Promise.all(Object.entries(collegeLibrarySources).map(async ([name, url]) => {
    try {
      const html = await withMemoryCache(`college-library:${url}`, 30 * 60, async () => {
        const response = await axios.get<string>(url, { timeout: 15_000 });
        return response.data;
      });
      return [name, parseCollegeLibraryHours(html)] as const;
    } catch (error) {
      console.error(`Could not load hours for ${name}:`, error instanceof Error ? error.message : error);
      return [name, []] as const;
    }
  }));
  return Object.fromEntries(entries);
}
