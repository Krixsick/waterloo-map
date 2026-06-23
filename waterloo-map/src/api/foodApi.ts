import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { type CampusFoodInfo } from "../types/food";

const API_URL = import.meta.env.VITE_API_URL;

const fetchCampusFood = async (): Promise<Record<string, CampusFoodInfo>> => {
  const response = await axios.get(`${API_URL}/food/campus`);
  return response.data;
};

export function useCampusFood() {
  return useQuery({
    queryKey: ["campus-food"],
    queryFn: fetchCampusFood,
  });
}

// export async function fetchCampusFood() {
//   const response = await fetch(`${API_URL}/food/campus`);

//   if (!response.ok) {
//     throw new Error(`Failed to fetch food data: ${response.status}`);
//   }

//   return response.json();
// }
