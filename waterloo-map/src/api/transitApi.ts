import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import type {
  TransitRoute,
  TransitRouteDetail,
  TransitAlert,
  TransitArrival,
  TransitDeparture,
  TransitItemResponse,
  TransitResponse,
  TransitStop,
  TransitTripDetail,
  TransitVehicle,
} from "../types/transit";

const API_URL = import.meta.env.VITE_API_URL;

async function getTransit<T>(
  path: string,
  params?: Record<string, string | number>,
) {
  const response = await axios.get<TransitResponse<T>>(
    `${API_URL}/transit/${path}`,
    { params },
  );
  return response.data;
}

async function getTransitItem<T>(
  path: string,
  params: Record<string, string | number>,
) {
  const response = await axios.get<TransitItemResponse<T>>(
    `${API_URL}/transit/${path}`,
    { params },
  );
  return response.data;
}

export function useTransitStops(enabled: boolean) {
  return useQuery({
    queryKey: ["transit", "stops", "uw-campus"],
    queryFn: () => getTransit<TransitStop>("stops"),
    enabled,
    staleTime: 6 * 60 * 60 * 1000,
  });
}

export function useTransitVehicles(enabled: boolean) {
  return useQuery({
    queryKey: ["transit", "vehicles"],
    queryFn: () => getTransit<TransitVehicle>("vehicles"),
    enabled,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useTransitDepartures(stopId: string | null, route?: TransitRoute | null) {
  return useQuery({
    queryKey: ["transit", "departures", stopId, route?.id],
    queryFn: () =>
      getTransit<TransitDeparture>("departures", { stopId: stopId!, ...(route ? { mode: route.mode, routeId: route.routeId } : {}) }),
    enabled: Boolean(stopId),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useTransitTripDetails(vehicle: TransitVehicle | null) {
  return useQuery({
    queryKey: [
      "transit",
      "trip",
      vehicle?.mode,
      vehicle?.tripId,
      vehicle?.currentStopSequence,
    ],
    queryFn: () =>
      getTransitItem<TransitTripDetail>("trip", {
        mode: vehicle!.mode,
        tripId: vehicle!.tripId!,
        ...(vehicle!.currentStopSequence === null
          ? {}
          : { currentStopSequence: vehicle!.currentStopSequence }),
        ...(vehicle!.stopId ? { currentStopId: vehicle!.stopId } : {}),
      }),
    enabled: Boolean(vehicle?.tripId),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useTransitArrivals(stopId: string | null) {
  return useQuery({
    queryKey: ["transit", "arrivals", stopId],
    queryFn: () => getTransit<TransitArrival>("arrivals", { stopId: stopId! }),
    enabled: Boolean(stopId),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useTransitAlerts(enabled = true) {
  return useQuery({
    queryKey: ["transit", "alerts"],
    queryFn: () => getTransit<TransitAlert>("alerts"),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useTransitRoutes(enabled: boolean) {
  return useQuery({
    queryKey: ["transit", "routes", "uw-campus"],
    queryFn: () => getTransit<TransitRoute>("routes"),
    enabled,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });
}

export function useTransitRouteDetail(route: TransitRoute | null) {
  return useQuery({
    queryKey: ["transit", "route", route?.mode, route?.routeId],
    queryFn: () => getTransitItem<TransitRouteDetail>("route", { mode: route!.mode, routeId: route!.routeId }),
    enabled: Boolean(route),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });
}
