export interface WaterlooEvent {
  id: number;
  name: string;
  description: string | null;
  date: string | null;
  time: string | null;
  startsAtUTC: string | null;
  endsAtUTC: string | null;
  location: string;
  locationQuery: string;
  cost: string | null;
  food: string | null;
  registration: boolean;
  categories: string[];
  clubType: string | null;
  organizer: string | null;
  school: string;
  imageURL: string | null;
  sourceURL: string | null;
  detailURL: string;
  mapURL: string | null;
  coordinates: { latitude: number; longitude: number } | null;
}

export interface WaterlooEventsResponse {
  events: WaterlooEvent[];
  source: string;
  totalCount: number | null;
  fetchedCount: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export type MappedWaterlooEvent = WaterlooEvent & {
  coordinates: { latitude: number; longitude: number };
};
