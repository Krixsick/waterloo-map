import axios from "axios";
import express from "express";
import { withCache } from "../cache";
import { type Wat2DoEvent } from "../types/events";
import { type Wat2DoOccurrence } from "../types/events";
import { type Wat2DoEventsResponse } from "../types/events";
import { type WaterlooEvent } from "../types/events";

const eventRouter = express.Router();

const WAT2DO_WEB_URL = (
  process.env.WAT2DO_WEB_URL ?? "https://uwaterloo.wat2do.io"
).replace(/\/+$/, "");
const WAT2DO_API_URL = (
  process.env.WAT2DO_API_URL ?? `${WAT2DO_WEB_URL}/api`
).replace(/\/+$/, "");
const WAT2DO_SCHOOL_SLUG = "uwaterloo";
const DEFAULT_SCHOOL = "University of Waterloo";
const DEFAULT_EVENT_LIMIT = 100;
const MAX_EVENT_LIMIT = 500;
const MAX_UPSTREAM_PAGE_SIZE = 100;

const wat2doClient = axios.create({
  baseURL: WAT2DO_API_URL,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
    "User-Agent": "waterloo-map/1.0",
  },
});

function getStringQuery(value: unknown): string | undefined {
  if (Array.isArray(value)) return getStringQuery(value[0]);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function getLimitQuery(value: unknown): number {
  const raw = Number(getStringQuery(value));
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_EVENT_LIMIT;
  return Math.min(Math.floor(raw), MAX_EVENT_LIMIT);
}

function getPageQuery(value: unknown): number {
  const raw = Number(getStringQuery(value));
  if (!Number.isInteger(raw) || raw < 1) return 1;
  return raw;
}

function buildWat2DoParams(
  query: express.Request["query"],
  page: number,
  pageSize: number,
): Record<string, string | number> {
  const params: Record<string, string | number> = {
    school: WAT2DO_SCHOOL_SLUG,
    sort_by: "date",
    sort_order: "asc",
    page,
    page_size: pageSize,
  };

  const search = getStringQuery(query.search);
  if (search) params.search = search;

  return params;
}

function buildMapsQuery(event: Wat2DoEvent): string {
  const location = event.location?.trim() ?? "";
  return [location, DEFAULT_SCHOOL].filter(Boolean).join(", ");
}

function isMappableLocation(location: string): boolean {
  const normalized = location.toLowerCase();
  if (!normalized || normalized === "tbd") return false;

  return ![
    "virtual",
    "zoom",
    "google meet",
    "online",
    "discord",
    "twitch",
  ].some((marker) => normalized.includes(marker));
}

function formatDateTime(
  startUTC?: string | null,
  endUTC?: string | null,
): Pick<WaterlooEvent, "date" | "time"> {
  if (!startUTC) return { date: null, time: null };

  const start = new Date(startUTC);
  if (Number.isNaN(start.getTime())) return { date: null, time: null };

  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    hour: "numeric",
    minute: "2-digit",
  });

  const startTime = timeFormatter.format(start);
  if (!endUTC) return { date: dateFormatter.format(start), time: startTime };

  const end = new Date(endUTC);
  if (Number.isNaN(end.getTime())) {
    return { date: dateFormatter.format(start), time: startTime };
  }

  return {
    date: dateFormatter.format(start),
    time: `${startTime} - ${timeFormatter.format(end)}`,
  };
}

function formatCost(price?: number | null): string | null {
  if (price === null || price === undefined) return null;
  if (price === 0) return "Free";
  return `$${price}`;
}

function parseDate(value?: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRelevantOccurrence(event: Wat2DoEvent): Wat2DoOccurrence | undefined {
  const occurrences = [...(event.occurrences ?? [])]
    .filter((occurrence) => parseDate(occurrence.dtstart_utc) !== null)
    .sort(
      (left, right) =>
        (parseDate(left.dtstart_utc) ?? 0) -
        (parseDate(right.dtstart_utc) ?? 0),
    );

  const now = Date.now();
  return (
    occurrences.find((occurrence) => {
      const endOrStart =
        parseDate(occurrence.dtend_utc) ?? parseDate(occurrence.dtstart_utc);
      return endOrStart !== null && endOrStart >= now;
    }) ?? occurrences[occurrences.length - 1]
  );
}

function formatFood(food: Wat2DoEvent["food"]): string | null {
  if (Array.isArray(food)) {
    const items = food.map((item) => item.trim()).filter(Boolean);
    return items.length > 0 ? items.join(", ") : null;
  }

  return food?.trim() || null;
}

function normalizeEvent(event: Wat2DoEvent): WaterlooEvent {
  const occurrence = getRelevantOccurrence(event);
  const startsAtUTC = occurrence?.dtstart_utc ?? null;
  const endsAtUTC = occurrence?.dtend_utc ?? null;
  const location = event.location?.trim() ?? "";
  const locationQuery = buildMapsQuery(event);
  const mapURL =
    location && isMappableLocation(location)
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          locationQuery,
        )}`
      : null;
  const { date, time } = formatDateTime(startsAtUTC, endsAtUTC);

  return {
    id: event.id,
    name: event.title,
    description: event.description ?? null,
    date,
    time,
    startsAtUTC,
    endsAtUTC,
    location,
    locationQuery,
    cost: formatCost(event.price),
    food: formatFood(event.food),
    registration: Boolean(event.registration),
    categories: event.category?.trim() ? [event.category.trim()] : [],
    clubType: event.organization_type?.trim() || null,
    organizer:
      event.organization?.trim() || event.ig_handle?.trim() || null,
    school:
      event.school === WAT2DO_SCHOOL_SLUG
        ? DEFAULT_SCHOOL
        : event.school?.trim() || DEFAULT_SCHOOL,
    imageURL: event.source_image_url ?? null,
    sourceURL: event.source_url ?? null,
    detailURL: `${WAT2DO_WEB_URL}/events/${event.id}`,
    mapURL,
    coordinates: null,
  };
}

async function fetchWat2DoEvents(query: express.Request["query"]): Promise<{
  events: WaterlooEvent[];
  source: string;
  totalCount: number | null;
  fetchedCount: number;
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const limit = getLimitQuery(query.limit);
  const pageSize = Math.min(limit, MAX_UPSTREAM_PAGE_SIZE);
  const events: WaterlooEvent[] = [];
  let page = getPageQuery(query.cursor);
  let lastFetchedPage = page - 1;
  let totalPages = page - 1;
  let totalCount: number | null = null;

  do {
    const params = buildWat2DoParams(query, page, pageSize);
    const response = await wat2doClient.get<Wat2DoEventsResponse>("/events/", {
      params,
    });
    const data = response.data;

    const responsePage = Number.isInteger(data.page) ? data.page : page;
    const results = Array.isArray(data.items) ? data.items : [];
    totalCount = typeof data.total === "number" ? data.total : totalCount;
    totalPages = Number.isInteger(data.total_pages)
      ? data.total_pages
      : responsePage;
    lastFetchedPage = responsePage;
    events.push(
      ...results.filter((event) => !event.cancelled).map(normalizeEvent),
    );
    page = responsePage + 1;

    if (results.length === 0) break;
  } while (lastFetchedPage < totalPages && events.length < limit);

  const wasTruncatedInsideFetchedPage = events.length > limit;
  const hasMore = wasTruncatedInsideFetchedPage || lastFetchedPage < totalPages;

  return {
    events: events.slice(0, limit),
    source: `${WAT2DO_WEB_URL}/events`,
    totalCount,
    fetchedCount: Math.min(events.length, limit),
    nextCursor:
      hasMore && !wasTruncatedInsideFetchedPage
        ? String(lastFetchedPage + 1)
        : null,
    hasMore,
  };
}

/**
 * Loads Waterloo events from the public Wat2Do API and adds a Google Maps
 * URL for physical locations.
 */
eventRouter.get("/", async (req, res) => {
  try {
    const cacheKey = `wat2do:events:v2:${JSON.stringify(req.query)}`;
    const data = await withCache(cacheKey, 60 * 5, () =>
      fetchWat2DoEvents(req.query),
    );

    res.json(data);
  } catch (error) {
    console.error("Wat2Do events request failed:", error);
    res.status(500).json({ error: "Failed to load Wat2Do events" });
  }
});

eventRouter.get("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const data = await withCache(
      `wat2do:event:${eventId}:v2`,
      60 * 5,
      async () => {
        const response = await wat2doClient.get<Wat2DoEvent>(
          `/events/${eventId}`,
        );
        return normalizeEvent(response.data);
      },
    );

    res.json(data);
  } catch (error) {
    console.error("Wat2Do event detail request failed:", error);
    res.status(500).json({ error: "Failed to load Wat2Do event" });
  }
});

export default eventRouter;
