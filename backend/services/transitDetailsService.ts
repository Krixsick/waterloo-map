import type {
  TransitArrival,
  TransitDeparture,
  TransitItemResponse,
  TransitMode,
  TransitResponse,
  TransitTripDetail,
} from "../types/transit";
import {
  getTransitArrivals,
  getTransitTripArrivals,
} from "./transitService";
import {
  getScheduledDepartures,
  getScheduledTripDetail,
} from "./transitScheduleService";

function arrivalTime(arrival: TransitArrival) {
  return arrival.arrivalAt ?? arrival.departureAt;
}

function tripKey(mode: TransitMode, tripId: string | null) {
  return tripId ? `${mode}:${tripId}` : null;
}

export async function getTransitDepartures(
  stopId: string,
  limit: number,
  route?: { mode: TransitMode; routeId: string },
): Promise<TransitResponse<TransitDeparture>> {
  const [scheduled, realtime] = await Promise.all([
    getScheduledDepartures(stopId, limit * 2, route),
    getTransitArrivals(stopId),
  ]);
  const liveByTrip = new Map(
    realtime.data.flatMap((arrival) => {
      const key = tripKey(arrival.mode, arrival.tripId);
      return key ? [[key, arrival] as const] : [];
    }),
  );
  const scheduledTrips = new Set(
    scheduled.data.map((departure) =>
      tripKey(departure.mode, departure.tripId),
    ),
  );
  const departures = scheduled.data.map((departure) => {
    const live = liveByTrip.get(tripKey(departure.mode, departure.tripId) ?? "");
    const predictedAt = live ? arrivalTime(live) : null;

    return {
      ...departure,
      predictedAt,
      isRealtime: Boolean(predictedAt),
    };
  });

  realtime.data.forEach((arrival) => {
    if (route && (arrival.mode !== route.mode || arrival.routeId !== route.routeId)) return;
    const key = tripKey(arrival.mode, arrival.tripId);
    const predictedAt = arrivalTime(arrival);
    if (!key || !predictedAt || scheduledTrips.has(key)) return;
    if (!arrival.routeId || !arrival.tripId) return;

    departures.push({
      id: `${key}:${stopId}`,
      mode: arrival.mode,
      routeId: arrival.routeId,
      tripId: arrival.tripId,
      stopId,
      headsign: null,
      scheduledAt: null,
      predictedAt,
      isRealtime: true,
    });
  });

  departures.sort((left, right) =>
    (left.predictedAt ?? left.scheduledAt ?? "").localeCompare(
      right.predictedAt ?? right.scheduledAt ?? "",
    ),
  );

  return {
    data: departures.slice(0, limit),
    feeds: [...scheduled.feeds, ...realtime.feeds],
    generatedAt: new Date().toISOString(),
  };
}

export async function getTransitTripDetail(
  mode: TransitMode,
  tripId: string,
  currentStopSequence: number | null,
  currentStopId: string | null,
): Promise<TransitItemResponse<TransitTripDetail>> {
  const [scheduled, realtime] = await Promise.all([
    getScheduledTripDetail(mode, tripId, currentStopSequence, currentStopId),
    getTransitTripArrivals(mode, tripId),
  ]);
  if (!scheduled.data) {
    return {
      ...scheduled,
      feeds: [...scheduled.feeds, ...realtime.feeds],
    };
  }

  const predictions = new Map(
    realtime.data.map((arrival) => [
      arrival.stopId,
      arrivalTime(arrival),
    ]),
  );
  const nextStops = scheduled.data.nextStops.map((stop) => {
    const predictedAt = predictions.get(stop.stopId) ?? null;

    return {
      ...stop,
      predictedAt,
      isRealtime: Boolean(predictedAt),
    };
  });

  return {
    data: { ...scheduled.data, nextStops },
    feeds: [...scheduled.feeds, ...realtime.feeds],
    generatedAt: new Date().toISOString(),
  };
}
