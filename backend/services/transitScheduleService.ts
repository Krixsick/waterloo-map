import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";
import "dotenv/config";

import { withMemoryCache } from "../cache";
import type {
  TransitRoute,
  TransitRouteDetail,
  TransitRoutePattern,
  TransitDeparture,
  TransitFeedStatus,
  TransitItemResponse,
  TransitMode,
  TransitResponse,
  TransitStop,
  TransitTripDetail,
  TransitTripStop,
} from "../types/transit";
import { fetchGrtBuffer } from "./grtClient";

const STATIC_CACHE_SECONDS = 6 * 60 * 60;
const EARTH_RADIUS_METERS = 6_371_000;
const TIME_ZONE = "America/Toronto";

const STATIC_FEEDS = [
  {
    mode: "bus",
    url:
      process.env.GRT_BUS_STATIC_URL ??
      "https://webapps.regionofwaterloo.ca/api/grt-routes/api/staticfeeds/1",
  },
  {
    mode: "ion",
    url:
      process.env.GRT_ION_STATIC_URL ??
      "https://webapps.regionofwaterloo.ca/api/grt-routes/api/staticfeeds/2",
  },
] as const;

const localDateTime = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type StopRow = {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
};

type RouteRow = {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: string;
};

type TripRow = {
  route_id: string;
  service_id: string;
  trip_id: string;
  trip_headsign: string;
  direction_id: string;
  shape_id: string;
};

type StopTimeRow = {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: string;
};

type CalendarDateRow = {
  service_id: string;
  date: string;
  exception_type: string;
};

type ScheduledTrip = {
  routeId: string;
  tripId: string;
  shapeId: string;
  headsign: string | null;
  directionId: number | null;
  stops: TransitTripStop[];
};

type ScheduledNetwork = {
  mode: TransitMode;
  loadedAt: string;
  serviceDate: string;
  stops: TransitStop[];
  routes: TransitRouteDetail[];
  trips: Map<string, ScheduledTrip>;
  departuresByStop: Map<string, TransitDeparture[]>;
};

function readRows<T>(archive: AdmZip, filename: string): T[] {
  return parse<T>(archive.readAsText(filename), {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function visitRows<T>(
  archive: AdmZip,
  filename: string,
  visitor: (row: T) => void,
) {
  parse<never, T>(archive.readAsText(filename), {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    on_record(row) {
      visitor(row);
      return null;
    },
  });
}

function dateTimeParts(date: Date) {
  const parts = localDateTime.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function currentServiceDate(date = new Date()) {
  const { year, month, day } = dateTimeParts(date);
  return `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
}

function timeZoneOffsetMs(date: Date) {
  const parts = dateTimeParts(date);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return localAsUtc - date.getTime();
}

function gtfsTimeSeconds(value: string) {
  const [hours, minutes, seconds] = value.split(":").map(Number);
  if (![hours, minutes, seconds].every(Number.isFinite)) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

function scheduledTime(serviceDate: string, gtfsTime: string) {
  const seconds = gtfsTimeSeconds(gtfsTime);
  if (seconds === null) return null;

  const year = Number(serviceDate.slice(0, 4));
  const month = Number(serviceDate.slice(4, 6));
  const day = Number(serviceDate.slice(6, 8));
  const wallTime = Date.UTC(year, month - 1, day) + seconds * 1000;
  const firstOffset = timeZoneOffsetMs(new Date(wallTime));
  let instant = wallTime - firstOffset;
  const correctedOffset = timeZoneOffsetMs(new Date(instant));
  if (correctedOffset !== firstOffset) instant = wallTime - correctedOffset;

  return new Date(instant).toISOString();
}

function routeSorter(left: string, right: string) {
  return left.localeCompare(right, undefined, { numeric: true });
}

export function parseNetwork(
  buffer: Buffer,
  mode: TransitMode,
  serviceDate: string,
): ScheduledNetwork {
  const archive = new AdmZip(buffer);
  const stopRows = readRows<StopRow>(archive, "stops.txt");
  const stopsById = new Map(stopRows.map((stop) => [stop.stop_id, stop]));
  const activeServices = new Set<string>();

  readRows<CalendarDateRow>(archive, "calendar_dates.txt").forEach((date) => {
    if (date.date !== serviceDate) return;
    if (date.exception_type === "1") activeServices.add(date.service_id);
    if (date.exception_type === "2") activeServices.delete(date.service_id);
  });

  const routeRows = readRows<RouteRow>(archive, "routes.txt");
  const routeNames = new Map(
    routeRows.map((route) => [
      route.route_id,
      route.route_short_name || route.route_id,
    ]),
  );
  const routeTypes = new Map(routeRows.map((route) => [route.route_id, route.route_type]));
  const trips = new Map<string, ScheduledTrip>();

  readRows<TripRow>(archive, "trips.txt").forEach((trip) => {
    if (!activeServices.has(trip.service_id)) return;
    // GRT's bus archive also contains ION; the dedicated rail feed supplies it.
    if (mode === "bus" && ["0", "1", "2"].includes(routeTypes.get(trip.route_id) ?? "")) return;
    const routeId = routeNames.get(trip.route_id) ?? trip.route_id;

    trips.set(trip.trip_id, {
      routeId,
      tripId: trip.trip_id,
      shapeId: trip.shape_id || "",
      headsign: trip.trip_headsign || null,
      directionId: trip.direction_id !== "" && Number.isFinite(Number(trip.direction_id))
        ? Number(trip.direction_id)
        : null,
      stops: [],
    });
  });

  const stopRoutes = new Map<string, Set<string>>();
  const departuresByStop = new Map<string, TransitDeparture[]>();

  visitRows<StopTimeRow>(archive, "stop_times.txt", (stopTime) => {
    const trip = trips.get(stopTime.trip_id);
    const stop = stopsById.get(stopTime.stop_id);
    const sequence = Number(stopTime.stop_sequence);
    if (!trip || !stop || !Number.isFinite(sequence)) return;

    const scheduledAt = scheduledTime(
      serviceDate,
      stopTime.departure_time || stopTime.arrival_time,
    );
    trip.stops.push({
      stopId: stopTime.stop_id,
      name: stop.stop_name,
      sequence,
      scheduledAt,
      predictedAt: null,
      isRealtime: false,
    });

    const routes = stopRoutes.get(stopTime.stop_id) ?? new Set<string>();
    routes.add(trip.routeId);
    stopRoutes.set(stopTime.stop_id, routes);

    const departures = departuresByStop.get(stopTime.stop_id) ?? [];
    departures.push({
      id: `${mode}:${trip.tripId}:${stopTime.stop_id}:${sequence}`,
      mode,
      routeId: trip.routeId,
      tripId: trip.tripId,
      stopId: stopTime.stop_id,
      headsign: trip.headsign,
      scheduledAt,
      predictedAt: null,
      isRealtime: false,
    });
    departuresByStop.set(stopTime.stop_id, departures);
  });

  trips.forEach((trip) => {
    trip.stops.sort((left, right) => left.sequence - right.sequence);
    trip.headsign ??= trip.stops.at(-1)?.name ?? null;
  });
  departuresByStop.forEach((departures) => {
    departures.forEach((departure) => {
      departure.headsign = trips.get(departure.tripId)?.headsign ?? null;
    });
    departures.sort((left, right) =>
      (left.scheduledAt ?? "").localeCompare(right.scheduledAt ?? ""),
    );
  });

  const stops = stopRows.flatMap((stop) => {
    const latitude = Number(stop.stop_lat);
    const longitude = Number(stop.stop_lon);
    const routeIds = [...(stopRoutes.get(stop.stop_id) ?? [])].sort(routeSorter);
    if (!stop.stop_id || !stop.stop_name || !routeIds.length) return [];
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];

    return [
      {
        id: `${mode}:${stop.stop_id}`,
        stopId: stop.stop_id,
        mode,
        name: stop.stop_name,
        latitude,
        longitude,
        routeIds,
      } satisfies TransitStop,
    ];
  });

  // Only keep shapes used by today's service. Never infer road geometry from stops.
  const usedShapes = new Set([...trips.values()].map((trip) => trip.shapeId));
  const shapePoints = new Map<string, { sequence: number; coordinate: [number, number] }[]>();
  if (archive.getEntry("shapes.txt")) {
    visitRows<{ shape_id: string; shape_pt_sequence: string; shape_pt_lat: string; shape_pt_lon: string }>(
      archive, "shapes.txt", (row) => {
        if (!usedShapes.has(row.shape_id)) return;
        const latitude = Number(row.shape_pt_lat);
        const longitude = Number(row.shape_pt_lon);
        const sequence = Number(row.shape_pt_sequence);
        if (!row.shape_pt_lat || !row.shape_pt_lon || !Number.isFinite(sequence) ||
            !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
            Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;
        const points = shapePoints.get(row.shape_id) ?? [];
        points.push({ sequence, coordinate: [longitude, latitude] });
        shapePoints.set(row.shape_id, points);
      },
    );
  }
  const shapes = new Map([...shapePoints].map(([id, points]) => [
    id, points.sort((a, b) => a.sequence - b.sequence).map((point) => point.coordinate),
  ]));
  const publicStops = new Map(stops.map((stop) => [stop.stopId, stop]));
  const patternsByRoute = new Map<string, Map<string, TransitRoutePattern>>();
  trips.forEach((trip) => {
    const routePatterns = patternsByRoute.get(trip.routeId) ?? new Map<string, TransitRoutePattern>();
    const patternId = JSON.stringify([trip.shapeId, trip.directionId, trip.headsign, trip.stops.map((stop) => stop.stopId)]);
    const existing = routePatterns.get(patternId);
    if (existing) {
      existing.tripIds.push(trip.tripId);
      return;
    }
    routePatterns.set(patternId, {
      id: trip.tripId,
      headsign: trip.headsign ?? "Destination unavailable",
      directionId: trip.directionId,
      coordinates: shapes.get(trip.shapeId) ?? [],
      stops: trip.stops.flatMap((stop) => {
        const publicStop = publicStops.get(stop.stopId);
        return publicStop ? [publicStop] : [];
      }),
      tripIds: [trip.tripId],
    });
    patternsByRoute.set(trip.routeId, routePatterns);
  });
  const routes = routeRows.flatMap((route) => {
    const routeId = routeNames.get(route.route_id) ?? route.route_id;
    const patterns = [...(patternsByRoute.get(routeId)?.values() ?? [])]
      .sort((a, b) => b.tripIds.length - a.tripIds.length || a.headsign.localeCompare(b.headsign));
    if (!patterns.length) return [];
    return [{
      id: `${mode}:${routeId}`, mode, routeId,
      name: route.route_long_name || `Route ${routeId}`,
      destinations: [...new Set(patterns.map((pattern) => pattern.headsign))],
      patterns,
    } satisfies TransitRouteDetail];
  });

  return {
    mode,
    stops,
    routes,
    trips,
    departuresByStop,
    serviceDate,
    loadedAt: new Date().toISOString(),
  };
}

function loadNetwork(mode: TransitMode, url: string, serviceDate: string) {
  return withMemoryCache(
    `grt:static:${mode}:${serviceDate}:v2`,
    STATIC_CACHE_SECONDS,
    async () => {
      const buffer = await fetchGrtBuffer(url, "application/zip");
      return parseNetwork(buffer, mode, serviceDate);
    },
  );
}

function loadNetworks() {
  const serviceDate = currentServiceDate();
  return Promise.allSettled(
    STATIC_FEEDS.map(({ mode, url }) => loadNetwork(mode, url, serviceDate)),
  );
}

function radians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function distanceMeters(
  latitude: number,
  longitude: number,
  stop: TransitStop,
) {
  const latitudeDelta = radians(stop.latitude - latitude);
  const longitudeDelta = radians(stop.longitude - longitude);
  const startLatitude = radians(latitude);
  const stopLatitude = radians(stop.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(stopLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

function feedStatus(
  mode: TransitMode,
  network?: ScheduledNetwork,
  error?: unknown,
): TransitFeedStatus {
  return {
    mode,
    updatedAt: network?.loadedAt ?? null,
    isStale: false,
    ...(error
      ? { error: error instanceof Error ? error.message : "Unknown feed error" }
      : {}),
  };
}

function collectNetworks(results: PromiseSettledResult<ScheduledNetwork>[]) {
  const networks: ScheduledNetwork[] = [];
  const feeds: TransitFeedStatus[] = [];

  results.forEach((result, index) => {
    const mode = STATIC_FEEDS[index].mode;
    if (result.status === "rejected") {
      feeds.push(feedStatus(mode, undefined, result.reason));
      return;
    }

    networks.push(result.value);
    feeds.push(feedStatus(mode, result.value));
  });

  return { networks, feeds };
}

export async function getTransitStops(
  latitude: number,
  longitude: number,
  radiusMeters: number,
): Promise<TransitResponse<TransitStop>> {
  const { networks, feeds } = collectNetworks(await loadNetworks());
  const stops = networks.flatMap((network) =>
    network.stops.filter(
      (stop) => distanceMeters(latitude, longitude, stop) <= radiusMeters,
    ),
  );

  return { data: stops, feeds, generatedAt: new Date().toISOString() };
}

export async function getScheduledDepartures(
  stopId: string,
  limit: number,
  route?: { mode: TransitMode; routeId: string },
): Promise<TransitResponse<TransitDeparture>> {
  const { networks, feeds } = collectNetworks(await loadNetworks());
  const earliestDeparture = Date.now() - 60_000;
  const departures = networks
    .flatMap((network) => network.departuresByStop.get(stopId) ?? [])
    .filter((departure) => !route || (departure.mode === route.mode && departure.routeId === route.routeId))
    .filter(
      (departure) =>
        departure.scheduledAt &&
        new Date(departure.scheduledAt).getTime() >= earliestDeparture,
    )
    .sort((left, right) =>
      (left.scheduledAt ?? "").localeCompare(right.scheduledAt ?? ""),
    )
    .slice(0, limit);

  return { data: departures, feeds, generatedAt: new Date().toISOString() };
}

export async function getScheduledTripDetail(
  mode: TransitMode,
  tripId: string,
  currentStopSequence: number | null,
  currentStopId: string | null,
): Promise<TransitItemResponse<TransitTripDetail>> {
  const feed = STATIC_FEEDS.find((item) => item.mode === mode);
  if (!feed) return { data: null, feeds: [], generatedAt: new Date().toISOString() };

  try {
    const network = await loadNetwork(mode, feed.url, currentServiceDate());
    const trip = network.trips.get(tripId);
    if (!trip) {
      return {
        data: null,
        feeds: [feedStatus(mode, network)],
        generatedAt: new Date().toISOString(),
      };
    }

    let startIndex = currentStopSequence === null
      ? -1
      : trip.stops.findIndex((stop) => stop.sequence >= currentStopSequence);
    if (startIndex < 0 && currentStopId) {
      startIndex = trip.stops.findIndex((stop) => stop.stopId === currentStopId);
    }
    if (startIndex < 0) {
      const now = Date.now() - 60_000;
      startIndex = trip.stops.findIndex(
        (stop) => stop.scheduledAt && new Date(stop.scheduledAt).getTime() >= now,
      );
    }
    if (startIndex < 0) startIndex = 0;

    return {
      data: {
        mode,
        routeId: trip.routeId,
        tripId,
        headsign: trip.headsign,
        directionId: trip.directionId,
        nextStops: trip.stops.slice(startIndex, startIndex + 3),
      },
      feeds: [feedStatus(mode, network)],
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      data: null,
      feeds: [feedStatus(mode, undefined, error)],
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function getTransitRoutes(): Promise<TransitResponse<TransitRoute>> {
  const { networks, feeds } = collectNetworks(await loadNetworks());
  const data = networks.flatMap((network) => {
    const nearbyRoutes = new Set(network.stops
      .filter((stop) => distanceMeters(43.471, -80.544, stop) <= 3_000)
      .flatMap((stop) => stop.routeIds));
    return network.routes.filter((route) => nearbyRoutes.has(route.routeId))
      .map(({ patterns: _patterns, ...route }) => route);
  }).sort((a, b) => routeSorter(a.routeId, b.routeId) || a.mode.localeCompare(b.mode));
  return { data, feeds, generatedAt: new Date().toISOString() };
}

export async function getTransitRouteDetail(
  mode: TransitMode, routeId: string,
): Promise<TransitItemResponse<TransitRouteDetail>> {
  const feed = STATIC_FEEDS.find((item) => item.mode === mode)!;
  try {
    const network = await loadNetwork(mode, feed.url, currentServiceDate());
    return {
      data: network.routes.find((route) => route.routeId === routeId) ?? null,
      feeds: [feedStatus(mode, network)], generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return { data: null, feeds: [feedStatus(mode, undefined, error)], generatedAt: new Date().toISOString() };
  }
}
