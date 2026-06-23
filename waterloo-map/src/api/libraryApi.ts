import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL;

const fetchLibraryHours = async () => {
  const response = await axios.get(`${API_URL}/library/hours`);
  return response.data;
};

export function useLibraryHours() {
  return useQuery({
    queryKey: ["library-hours"],
    queryFn: fetchLibraryHours,
  });
}
// export async function fetchLibraryHours() {
//   const response = await fetch(`${API_URL}/library/hours`);

//   if (!response.ok) {
//     throw new Error(`Failed to fetch library hours: ${response.status}`);
//   }

//   return response.json();
// }
