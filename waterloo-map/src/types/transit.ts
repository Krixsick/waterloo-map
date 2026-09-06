export type TransitMode = "bus" | "ion";
export type TransitStatus =
  | "loading"
  | "live"
  | "partial"
  | "scheduled"
  | "error";

export type TransitFeedStatus = {
  mode: TransitMode | "all";
  updatedAt: string | null;
  isStale: boolean;
  error?: string;
};

export type TransitResponse<T> = {
  data: T[];
  generatedAt: string;
  feeds: TransitFeedStatus[];
};

export type TransitItemResponse<T> = {
  data: T | null;
  generatedAt: string;
  feeds: TransitFeedStatus[];
};

export type TransitVehicle = {
  id: string;
  mode: TransitMode;
  label: string | null;
  routeId: string | null;
  tripId: string | null;
  latitude: number;
  longitude: number;
  bearing: number | null;
  stopId: string | null;
  currentStopSequence: number | null;
  currentStatus: string | null;
  updatedAt: string | null;
};

export type TransitStop = {
  id: string;
  stopId: string;
  mode: TransitMode;
  name: string;
  latitude: number;
  longitude: number;
  routeIds: string[];
};

export type TransitArrival = {
  id: string;
  mode: TransitMode;
  routeId: string | null;
  tripId: string | null;
  vehicleId: string | null;
  stopId: string;
  stopSequence: number | null;
  arrivalAt: string | null;
  departureAt: string | null;
  arrivalDelaySeconds: number | null;
  departureDelaySeconds: number | null;
  scheduleRelationship: string | null;
  updatedAt: string | null;
};

export type TransitDeparture = {
  id: string;
  mode: TransitMode;
  routeId: string;
  tripId: string;
  stopId: string;
  headsign: string | null;
  scheduledAt: string | null;
  predictedAt: string | null;
  isRealtime: boolean;
};

export type TransitTripStop = {
  stopId: string;
  name: string;
  sequence: number;
  scheduledAt: string | null;
  predictedAt: string | null;
  isRealtime: boolean;
};

export type TransitTripDetail = {
  mode: TransitMode;
  routeId: string;
  tripId: string;
  headsign: string | null;
  directionId: number | null;
  nextStops: TransitTripStop[];
};

export type TransitSelection =
  | { type: "stop"; stop: TransitStop }
  | { type: "vehicle"; vehicle: TransitVehicle };

export type TransitAlert = {
  id: string;
  header: string;
  description: string | null;
  url: string | null;
  cause: string | null;
  effect: string | null;
  severity: string | null;
  activePeriods: { start: string | null; end: string | null }[];
  routeIds: string[];
  stopIds: string[];
};

export type TransitRoute = {
  id: string;
  mode: TransitMode;
  routeId: string;
  name: string;
  destinations: string[];
};

export type TransitRoutePattern = {
  id: string;
  headsign: string;
  directionId: number | null;
  coordinates: [number, number][];
  stops: TransitStop[];
  tripIds: string[];
};

export type TransitRouteDetail = TransitRoute & {
  patterns: TransitRoutePattern[];
};
