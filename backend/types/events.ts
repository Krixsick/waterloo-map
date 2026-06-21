export interface Wat2DoEvent {
  id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  dtstart_utc?: string | null;
  dtend_utc?: string | null;
  price?: number | null;
  food?: string | null;
  registration?: boolean | null;
  source_image_url?: string | null;
  school?: string | null;
  source_url?: string | null;
  display_handle?: string | null;
  club_type?: string | null;
  added_at?: string | null;
  categories?: string[];
  occurrences?: Wat2DoOccurrence[];
}

export interface Wat2DoOccurrence {
  dtstart_utc?: string | null;
  dtend_utc?: string | null;
}

export interface Wat2DoEventsResponse {
  results: Wat2DoEvent[];
  nextCursor?: string | null;
  hasMore?: boolean;
  totalCount?: number;
}

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
