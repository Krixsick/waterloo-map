import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL;

export type GymOccupancy = {
  name: string;
  occupancy?: number;
  remaining?: number;
  maxOccupancy: number;
  ratio: number;
  percent: number;
};

export type GymBusyness = {
  overall?: GymOccupancy;
  facilities: Record<string, GymOccupancy>;
};

export type GymInfo = {
  hours: Record<string, string>;
  busyness: GymBusyness;
};

export type GymApiResponse = {
  PAC: GymInfo;
  CIF: GymInfo;
};

const fetchGymInfo = async (): Promise<GymApiResponse> => {
  const response = await axios.get<GymApiResponse>(
    `${API_URL}/gym`,
  );

  return response.data;
};

export function useGymInfo() {
  return useQuery<GymApiResponse>({
    queryKey: ["gym"],
    queryFn: fetchGymInfo,
  });
}
