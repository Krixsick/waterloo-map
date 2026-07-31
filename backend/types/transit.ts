export type TransitMode = "bus" | "ion";

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
  currentStatus: string | null;
  updatedAt: string | null;
};

export type TransitStop = {
  id: string;
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
  arrivalAt: string | null;
  departureAt: string | null;
  arrivalDelaySeconds: number | null;
  departureDelaySeconds: number | null;
  scheduleRelationship: string | null;
  updatedAt: string | null;
};

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
