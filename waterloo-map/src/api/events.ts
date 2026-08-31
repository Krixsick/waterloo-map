import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import type { WaterlooEventsResponse } from "../types/events";

const API_URL = import.meta.env.VITE_API_URL;

const fetchWaterlooEvents = async () => {
  const response = await axios.get<WaterlooEventsResponse>(`${API_URL}/events`);
  return response.data;
};

export function useWaterlooEvents(enabled = true) {
  return useQuery({
    queryKey: ["waterloo-events"],
    queryFn: fetchWaterlooEvents,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
