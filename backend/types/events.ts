export interface Wat2DoEvent {
  id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  price?: number | null;
  food?: string | string[] | null;
  registration?: boolean | null;
  source_image_url?: string | null;
  school?: string | null;
  source_url?: string | null;
  category?: string | null;
  organization?: string | null;
  organization_type?: string | null;
  organization_logo_url?: string | null;
  ig_handle?: string | null;
  cancelled?: boolean;
  added_at?: string | null;
  occurrences?: Wat2DoOccurrence[];
}

export interface Wat2DoOccurrence {
  id?: string;
  event_id?: number;
  dtstart_utc?: string | null;
  dtend_utc?: string | null;
  duration?: number | null;
  tz?: string | null;
  created_at?: string | null;
}

export interface Wat2DoEventsResponse {
  items: Wat2DoEvent[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  latest_added_event?: {
    title: string;
    added_at: string;
  } | null;
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
