import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";
import "dotenv/config";

import { withMemoryCache } from "../cache";
import type {
  TransitFeedStatus,
  TransitMode,
  TransitResponse,
  TransitStop,
} from "../types/transit";
import { fetchGrtBuffer } from "./grtClient";

const STATIC_CACHE_SECONDS = 6 * 60 * 60;
const EARTH_RADIUS_METERS = 6_371_000;

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

type StopRow = {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
};

type RouteRow = {
  route_id: string;
  route_short_name: string;
};

type TripRow = {
  route_id: string;
  trip_id: string;
};

type StopTimeRow = {
  trip_id: string;
  stop_id: string;
};

type ScheduledNetwork = {
  mode: TransitMode;
  loadedAt: string;
  stops: TransitStop[];
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

function routeSorter(left: string, right: string) {
  return left.localeCompare(right, undefined, { numeric: true });
}

function parseNetwork(buffer: Buffer, mode: TransitMode): ScheduledNetwork {
  const archive = new AdmZip(buffer);
  const routes = readRows<RouteRow>(archive, "routes.txt");
  const trips = readRows<TripRow>(archive, "trips.txt");

  const routeNames = new Map(
    routes.map((route) => [
      route.route_id,
      route.route_short_name || route.route_id,
    ]),
  );
  const tripRoutes = new Map(
    trips.map((trip) => [trip.trip_id, trip.route_id]),
  );
  const stopRoutes = new Map<string, Set<string>>();

  visitRows<StopTimeRow>(archive, "stop_times.txt", (stopTime) => {
    const routeId = tripRoutes.get(stopTime.trip_id);
    const routeName = routeId ? routeNames.get(routeId) : undefined;
    if (!routeName) return;

    const routesForStop = stopRoutes.get(stopTime.stop_id) ?? new Set<string>();
    routesForStop.add(routeName);
    stopRoutes.set(stopTime.stop_id, routesForStop);
  });

  const stops = readRows<StopRow>(archive, "stops.txt").flatMap((stop) => {
    const latitude = Number(stop.stop_lat);
    const longitude = Number(stop.stop_lon);
    const routeIds = [...(stopRoutes.get(stop.stop_id) ?? [])].sort(routeSorter);
    if (!stop.stop_id || !stop.stop_name || !routeIds.length) return [];
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];

    return [
      {
        id: `${mode}:${stop.stop_id}`,
        mode,
        name: stop.stop_name,
        latitude,
        longitude,
        routeIds,
      } satisfies TransitStop,
    ];
  });

  return { mode, stops, loadedAt: new Date().toISOString() };
}

function loadNetwork(mode: TransitMode, url: string) {
  return withMemoryCache(
    `grt:static:${mode}:v1`,
    STATIC_CACHE_SECONDS,
    async () => {
      const buffer = await fetchGrtBuffer(url, "application/zip");
      return parseNetwork(buffer, mode);
    },
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

export async function getTransitStops(
  latitude: number,
  longitude: number,
  radiusMeters: number,
): Promise<TransitResponse<TransitStop>> {
  const results = await Promise.allSettled(
    STATIC_FEEDS.map(({ mode, url }) => loadNetwork(mode, url)),
  );
  const stops: TransitStop[] = [];
  const feeds: TransitFeedStatus[] = [];

  results.forEach((result, index) => {
    const mode = STATIC_FEEDS[index].mode;
    if (result.status === "rejected") {
      feeds.push(feedStatus(mode, undefined, result.reason));
      return;
    }

    feeds.push(feedStatus(mode, result.value));
    stops.push(
      ...result.value.stops.filter(
        (stop) => distanceMeters(latitude, longitude, stop) <= radiusMeters,
      ),
    );
  });

  return { data: stops, feeds, generatedAt: new Date().toISOString() };
}
