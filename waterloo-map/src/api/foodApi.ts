import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const API_URL =
  import.meta.env.VITE_API_URL?.replace(
    /\/+$/,
    "",
  );

export type FoodCategory =
  | "dessert"
  | "restaurant"
  | "cafe"
  | "convenience"
  | "dining-hall"
  | "food-court"
  | "bar";

export type FoodInfo = {
  id: string;
  name: string;
  buildingId?: string;
  coordinates?: [number, number];
  category: FoodCategory;
  categories?: FoodCategory[];
  logo?: string;

  location?: string;
  description?: string | string[];

  payment?: string[];
  paymentNote?: string;

  hours?: Record<string, string>;
  exceptions?: string[];
  hoursSource?: {name: string; url: string; checkedAt: string};

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
    queryKey: ["food", "campus-locations-v2"],
    queryFn: fetchFood,
  });
}