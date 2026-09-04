import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const API_URL =
  import.meta.env.VITE_API_URL?.replace(
    /\/+$/,
    "",
  );

export type FoodCategory =
  | "restaurant"
  | "cafe"
  | "convenience"
  | "dining-hall"
  | "food-court"
  | "bar";

export type FoodInfo = {
  id: string;
  name: string;
  buildingId: string;
  category: FoodCategory;
  logo?: string;

  location?: string;
  description?: string | string[];

  payment?: string[];

  hours?: Record<string, string>;
  exceptions?: string[];

  url?: string;

  source: {
    name: string;
    url: string;
  };

  menu?: {
    type?:
      | "daily"
      | "weekly"
      | "static";
    url?: string;
    urls?: string[];
  };
};

export type FoodApiResponse =
  Record<string, FoodInfo>;

async function fetchFood(): Promise<FoodApiResponse> {
  const response =
    await axios.get<FoodApiResponse>(
      `${API_URL}/food`,
    );

  return response.data;
}

export function useFood() {
  return useQuery({
    queryKey: ["food"],
    queryFn: fetchFood,
  });
}