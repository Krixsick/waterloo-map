"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const express_1 = __importDefault(require("express"));
const cache_1 = require("../cache");
const eventRouter = express_1.default.Router();
const WAT2DO_API_URL = "https://api.wat2do.ca/api";
const WAT2DO_WEB_URL = "https://wat2do.ca";
const DEFAULT_SCHOOL = "University of Waterloo";
const DEFAULT_EVENT_LIMIT = 100;
const MAX_EVENT_LIMIT = 500;
const wat2doClient = axios_1.default.create({
    baseURL: WAT2DO_API_URL,
    timeout: 15_000,
    headers: {
        Accept: "application/json",
        "User-Agent": "waterloo-map/1.0",
    },
});
function getStringQuery(value) {
    if (Array.isArray(value))
        return getStringQuery(value[0]);
    if (typeof value !== "string")
        return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
}
function getBooleanQuery(value) {
    const text = getStringQuery(value)?.toLowerCase();
    if (!text)
        return undefined;
    if (["1", "true", "yes"].includes(text))
        return true;
    if (["0", "false", "no"].includes(text))
        return false;
    return undefined;
}
function getLimitQuery(value) {
    const raw = Number(getStringQuery(value));
    if (!Number.isFinite(raw) || raw <= 0)
        return DEFAULT_EVENT_LIMIT;
    return Math.min(Math.floor(raw), MAX_EVENT_LIMIT);
}
function buildWat2DoParams(query, cursor) {
    const params = {
        school: getStringQuery(query.school) ?? DEFAULT_SCHOOL,
    };
    const passthroughParams = [
        "search",
        "categories",
        "dtstart_utc",
        "added_at",
        "ids",
    ];
    for (const key of passthroughParams) {
        const value = getStringQuery(query[key]);
        if (value)
            params[key] = value;
    }
    const includeAll = getBooleanQuery(query.all);
    if (includeAll !== undefined)
        params.all = includeAll;
    if (cursor)
        params.cursor = cursor;
    return params;
}
function buildMapsQuery(event) {
    const location = event.location?.trim() ?? "";
    const school = event.school?.trim() || DEFAULT_SCHOOL;
    return [location, school].filter(Boolean).join(", ");
}
function isMappableLocation(location) {
    const normalized = location.toLowerCase();
    if (!normalized || normalized === "tbd")
        return false;
    return !["virtual", "zoom", "google meet", "online", "discord", "twitch"].some((marker) => normalized.includes(marker));
}
function formatDateTime(startUTC, endUTC) {
    if (!startUTC)
        return { date: null, time: null };
    const start = new Date(startUTC);
    if (Number.isNaN(start.getTime()))
        return { date: null, time: null };
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
    if (!endUTC)
        return { date: dateFormatter.format(start), time: startTime };
    const end = new Date(endUTC);
    if (Number.isNaN(end.getTime())) {
        return { date: dateFormatter.format(start), time: startTime };
    }
    return {
        date: dateFormatter.format(start),
        time: `${startTime} - ${timeFormatter.format(end)}`,
    };
}
function formatCost(price) {
    if (price === null || price === undefined)
        return null;
    if (price === 0)
        return "Free";
    return `$${price}`;
}
function normalizeEvent(event) {
    const firstOccurrence = event.occurrences?.[0];
    const startsAtUTC = event.dtstart_utc ?? firstOccurrence?.dtstart_utc ?? null;
    const endsAtUTC = event.dtend_utc ?? firstOccurrence?.dtend_utc ?? null;
    const location = event.location?.trim() ?? "";
    const locationQuery = buildMapsQuery(event);
    const mapURL = location && isMappableLocation(location)
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`
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
        food: event.food ?? null,
        registration: Boolean(event.registration),
        categories: event.categories ?? [],
        clubType: event.club_type ?? null,
        organizer: event.display_handle ?? null,
        school: event.school ?? DEFAULT_SCHOOL,
        imageURL: event.source_image_url ?? null,
        sourceURL: event.source_url ?? null,
        detailURL: `${WAT2DO_WEB_URL}/events/${event.id}`,
        mapURL,
        coordinates: null,
    };
}
async function fetchWat2DoEvents(query) {
    const limit = getLimitQuery(query.limit);
    const events = [];
    let cursor = getStringQuery(query.cursor);
    let nextCursor = null;
    let hasMore = false;
    let totalCount = null;
    do {
        const params = buildWat2DoParams(query, cursor);
        const response = await wat2doClient.get("/events/", {
            params,
        });
        const data = response.data;
        totalCount ??= data.totalCount ?? null;
        events.push(...data.results.map(normalizeEvent));
        nextCursor = data.nextCursor ?? null;
        hasMore = Boolean(data.nextCursor);
        cursor = nextCursor ?? undefined;
    } while (cursor && events.length < limit);
    const wasTruncatedInsideFetchedPage = events.length > limit;
    return {
        events: events.slice(0, limit),
        source: `${WAT2DO_WEB_URL}/events`,
        totalCount,
        fetchedCount: Math.min(events.length, limit),
        nextCursor: wasTruncatedInsideFetchedPage ? null : nextCursor,
        hasMore: wasTruncatedInsideFetchedPage || hasMore,
    };
}
/**
 * Scrapes Wat2Do event information from the same public API that powers
 * wat2do.ca, then adds a Google Maps URL for physical locations.
 */
eventRouter.get("/", async (req, res) => {
    try {
        const cacheKey = `wat2do:events:v1:${JSON.stringify(req.query)}`;
        const data = await (0, cache_1.withCache)(cacheKey, 60 * 5, () => fetchWat2DoEvents(req.query));
        res.json(data);
    }
    catch (error) {
        console.error("Wat2Do events scrape failed:", error);
        res.status(500).json({ error: "Failed to load Wat2Do events" });
    }
});
eventRouter.get("/:eventId", async (req, res) => {
    try {
        const { eventId } = req.params;
        const data = await (0, cache_1.withCache)(`wat2do:event:${eventId}:v1`, 60 * 5, async () => {
            const response = await wat2doClient.get(`/events/${eventId}/`);
            return normalizeEvent(response.data);
        });
        res.json(data);
    }
    catch (error) {
        console.error("Wat2Do event detail scrape failed:", error);
        res.status(500).json({ error: "Failed to load Wat2Do event" });
    }
});
exports.default = eventRouter;
