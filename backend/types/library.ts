export type TimeSlot = {
  date: string;
  time: string;
};

export type LibraryOccupancyLevel =
  | "not-busy"
  | "busy"
  | "very-busy"
  | "closed"
  | "unavailable";

export type LibraryOccupancyZone = {
  id: number;
  name: string;
  percentage: number | null;
  capacity: number | null;
  people: number | null;
  level: LibraryOccupancyLevel;
  isOpen: boolean;
  isAvailable: boolean;
};

export type LibraryOccupancyLocation = LibraryOccupancyZone & {
  zones: LibraryOccupancyZone[];
};

export type LibraryOccupancyResponse = {
  locations: LibraryOccupancyLocation[];
  source: string;
  fetchedAt: string;
};
