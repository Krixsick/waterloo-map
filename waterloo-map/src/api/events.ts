import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL;

const fetchWaterlooEvents = async () => {
  const response = await axios.get(`${API_URL}/events`);
  return response.data;
};

export function getWaterlooEvents() {
  return useQuery({
    queryKey: ["waterloo-events"],
    queryFn: fetchWaterlooEvents,
  });
}
