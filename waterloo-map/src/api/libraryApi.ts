import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import type {
  LibraryOccupancyResponse,
  TimeSlot,
} from "../types/library";

const API_URL = import.meta.env.VITE_API_URL;

const fetchLibraryHours = async () => {
  const response = await axios.get<Record<string, TimeSlot[]>>(
    `${API_URL}/library/hours`,
  );
  return response.data;
};

const fetchLibraryOccupancy = async () => {
  const response = await axios.get<LibraryOccupancyResponse>(
    `${API_URL}/library/occupancy`,
  );
  return response.data;
};

export function useLibraryHours() {
  return useQuery({
    queryKey: ["library-hours"],
    queryFn: fetchLibraryHours,
  });
}

export function useLibraryOccupancy(enabled: boolean) {
  return useQuery({
    queryKey: ["library-occupancy"],
    queryFn: fetchLibraryOccupancy,
    enabled,
    staleTime: 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
  });
}
