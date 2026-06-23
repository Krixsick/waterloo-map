import axios from "axios";
import { useQuery } from "@tanstack/react-query";
const API_URL = import.meta.env.VITE_API_URL;

const fetchGymInfo = async () => {
  // no need for try and catch bec we want it to be an error for tanstack to catch for the {isError}

  const response = await axios.get(`${API_URL}/gym`);
  return response.data;
};

export function useGymInfo() {
  return useQuery({
    queryKey: ["gym"],
    queryFn: fetchGymInfo,
  });
}

// export async function fetchGymInfo() {
//   const response = await fetch(`${API_URL}/gym`);

//   if (!response.ok) {
//     throw new Error(`Failed to fetch gym info: ${response.status}`);
//   }

//   return response.json();
// }
