import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import "dotenv/config";

import { withMemoryCache } from "../cache";
import { fetchGrtBuffer } from "./grtClient";
import type {
  TransitAlert,
  TransitArrival,
  TransitFeedStatus,
  TransitMode,
  TransitResponse,
  TransitVehicle,
} from "../types/transit";

const STALE_AFTER_MS = 90_000;
const CACHE_SECONDS = 10;

const FEEDS = [
  {
    mode: "bus",
    vehicles:
      process.env.GRT_BUS_VEHICLES_URL ??
      "https://webapps.regionofwaterloo.ca/api/grt-routes/api/vehiclepositions",
    trips:
      process.env.GRT_BUS_TRIPS_URL ??
      "https://webapps.regionofwaterloo.ca/api/grt-routes/api/tripupdates",
  },
  {
    mode: "ion",
    vehicles:
      process.env.GRT_ION_VEHICLES_URL ??
      "https://webapps.regionofwaterloo.ca/api/grt-routes/api/vehiclepositions/2",
    trips:
      process.env.GRT_ION_TRIPS_URL ??
      "https://webapps.regionofwaterloo.ca/api/grt-routes/api/tripupdates/2",
  },
] as const;

const ALERTS_URL =
  process.env.GRT_ALERTS_URL ??
  "https://webapps.regionofwaterloo.ca/api/grt-routes/api/alerts";

type FeedMessage = ReturnType<
  typeof GtfsRealtimeBindings.transit_realtime.FeedMessage.decode
>;
type FeedEntity = FeedMessage["entity"][number];
type TranslatedString = NonNullable<
  NonNullable<FeedEntity["alert"]>["headerText"]
>;
type LoadedFeed = { mode: TransitMode; feed: FeedMessage };

const VEHICLE_STATUS = ["incoming", "stopped", "in-transit"];
const STOP_RELATIONSHIP = ["scheduled", "skipped", "no-data", "unscheduled"];
const ALERT_CAUSE = [
  null,
  "unknown",
  "other",
  "technical-problem",
  "strike",
  "demonstration",
  "accident",
  "holiday",
  "weather",
  "maintenance",
  "construction",
  "police-activity",
  "medical-emergency",
  "special-event",
];
const ALERT_EFFECT = [
  null,
  "no-service",
  "reduced-service",
  "significant-delays",
  "detour",
  "additional-service",
  "modified-service",
  "other",
  "unknown",
  "stop-moved",
  "no-effect",
  "accessibility-issue",
];
const ALERT_SEVERITY = [null, "unknown", "info", "warning", "severe"];

function fieldValue<T extends object, K extends keyof T>(
  object: T | null | undefined,
  key: K,
): T[K] | undefined {
  return object && Object.hasOwn(object, key) ? object[key] : undefined;
}

function numberValue(
  value: number | { toString(): string } | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : null;
}

function textValue(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function isoTime(
  value: number | { toString(): string } | null | undefined,
): string | null {
  const seconds = numberValue(value);
  return seconds === null ? null : new Date(seconds * 1000).toISOString();
}

function enumValue(
  values: readonly (string | null)[],
  value: number | null | undefined,
): string | null {
  return value === null || value === undefined ? null : (values[value] ?? null);
}

function translatedText(value: TranslatedString | null | undefined) {
  const translations = value?.translation ?? [];
  const english = translations.find((item) =>
    item.language?.toLowerCase().startsWith("en"),
  );
  return textValue(english?.text ?? translations[0]?.text);
}

function unique(values: (string | null)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

async function fetchFeed(url: string): Promise<FeedMessage> {
  const bytes = await fetchGrtBuffer(url, "application/x-protobuf");
  return GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(bytes);
}

function feedStatus(
  mode: TransitMode | "all",
  feed?: FeedMessage,
  error?: unknown,
): TransitFeedStatus {
  const updatedAt = feed
    ? isoTime(fieldValue(feed.header, "timestamp"))
    : null;
  const isStale = updatedAt
    ? Date.now() - new Date(updatedAt).getTime() > STALE_AFTER_MS
    : true;

  return {
    mode,
    updatedAt,
    isStale,
    ...(error
      ? { error: error instanceof Error ? error.message : "Unknown feed error" }
      : {}),
  };
}

async function loadModeFeeds(kind: "vehicles" | "trips") {
  const results = await Promise.allSettled(
    FEEDS.map(async ({ mode, [kind]: url }) => ({
      mode,
      feed: await fetchFeed(url),
    })),
  );

  const loaded: LoadedFeed[] = [];
  const statuses: TransitFeedStatus[] = [];

  results.forEach((result, index) => {
    const mode = FEEDS[index].mode;
    if (result.status === "fulfilled") {
      loaded.push(result.value);
      statuses.push(feedStatus(mode, result.value.feed));
    } else {
      statuses.push(feedStatus(mode, undefined, result.reason));
    }
  });

  return { loaded, statuses };
}

function normalizeVehicle(
  entity: FeedEntity,
  mode: TransitMode,
): TransitVehicle | null {
  const vehicle = entity.vehicle;
  const position = vehicle?.position;
  const latitude = numberValue(position?.latitude);
  const longitude = numberValue(position?.longitude);
  if (latitude === null || longitude === null) return null;

  return {
    id: `${mode}:${textValue(vehicle?.vehicle?.id) ?? entity.id}`,
    mode,
    label: textValue(vehicle?.vehicle?.label),
    routeId: textValue(vehicle?.trip?.routeId),
    tripId: textValue(vehicle?.trip?.tripId),
    latitude,
    longitude,
    bearing: numberValue(fieldValue(position, "bearing")),
    stopId: textValue(vehicle?.stopId),
    currentStatus: enumValue(
      VEHICLE_STATUS,
      fieldValue(vehicle, "currentStatus"),
    ),
    updatedAt: isoTime(fieldValue(vehicle, "timestamp")),
  };
}

function normalizeArrivals(
  entity: FeedEntity,
  mode: TransitMode,
  stopId: string,
): TransitArrival[] {
  const update = entity.tripUpdate;
  if (!update) return [];

  return (update.stopTimeUpdate ?? [])
    .filter((stop) => stop.stopId === stopId)
    .map((stop) => ({
      id: `${mode}:${entity.id}:${stop.stopId}`,
      mode,
      routeId: textValue(update.trip.routeId),
      tripId: textValue(update.trip.tripId),
      vehicleId: textValue(update.vehicle?.id),
      stopId,
      arrivalAt: isoTime(fieldValue(stop.arrival, "time")),
      departureAt: isoTime(fieldValue(stop.departure, "time")),
      arrivalDelaySeconds: numberValue(fieldValue(stop.arrival, "delay")),
      departureDelaySeconds: numberValue(fieldValue(stop.departure, "delay")),
      scheduleRelationship: enumValue(
        STOP_RELATIONSHIP,
        fieldValue(stop, "scheduleRelationship"),
      ),
      updatedAt: isoTime(fieldValue(update, "timestamp")),
    }));
}

function normalizeAlert(entity: FeedEntity): TransitAlert | null {
  const alert = entity.alert;
  const header = translatedText(alert?.headerText);
  if (!alert || !header) return null;

  return {
    id: entity.id,
    header,
    description: translatedText(alert.descriptionText),
    url: translatedText(alert.url),
    cause: enumValue(ALERT_CAUSE, fieldValue(alert, "cause")),
    effect: enumValue(ALERT_EFFECT, fieldValue(alert, "effect")),
    severity: enumValue(
      ALERT_SEVERITY,
      fieldValue(alert, "severityLevel"),
    ),
    activePeriods: (alert.activePeriod ?? []).map((period) => ({
      start: isoTime(fieldValue(period, "start")),
      end: isoTime(fieldValue(period, "end")),
    })),
    routeIds: unique(
      (alert.informedEntity ?? []).map((item) => textValue(item.routeId)),
    ),
    stopIds: unique(
      (alert.informedEntity ?? []).map((item) => textValue(item.stopId)),
    ),
  };
}

function result<T>(data: T[], feeds: TransitFeedStatus[]): TransitResponse<T> {
  return { data, feeds, generatedAt: new Date().toISOString() };
}

export function hasAvailableFeed<T>(response: TransitResponse<T>) {
  return response.feeds.some((feed) => !feed.error);
}

export function getTransitVehicles() {
  return withMemoryCache("grt:vehicles:v1", CACHE_SECONDS, async () => {
    const { loaded, statuses } = await loadModeFeeds("vehicles");
    const vehicles = loaded
      .filter(({ mode, feed }) => !feedStatus(mode, feed).isStale)
      .flatMap(({ mode, feed }) =>
        feed.entity.flatMap((entity) => {
          const vehicle = normalizeVehicle(entity, mode);
          return vehicle ? [vehicle] : [];
        }),
      );

    return result(vehicles, statuses);
  });
}

export function getTransitArrivals(stopId: string) {
  return withMemoryCache(`grt:arrivals:${stopId}:v1`, CACHE_SECONDS, async () => {
    const { loaded, statuses } = await loadModeFeeds("trips");
    const arrivals = loaded
      .filter(({ mode, feed }) => !feedStatus(mode, feed).isStale)
      .flatMap(({ mode, feed }) =>
        feed.entity.flatMap((entity) =>
          normalizeArrivals(entity, mode, stopId),
        ),
      )
      .sort((left, right) =>
        (left.arrivalAt ?? left.departureAt ?? "").localeCompare(
          right.arrivalAt ?? right.departureAt ?? "",
        ),
      );

    return result(arrivals, statuses);
  });
}

export function getTransitAlerts() {
  return withMemoryCache("grt:alerts:v1", 30, async () => {
    try {
      const feed = await fetchFeed(ALERTS_URL);
      const alerts = feed.entity.flatMap((entity) => {
        const alert = normalizeAlert(entity);
        return alert ? [alert] : [];
      });

      return result(alerts, [feedStatus("all", feed)]);
    } catch (error) {
      return result<TransitAlert>([], [feedStatus("all", undefined, error)]);
    }
  });
}
