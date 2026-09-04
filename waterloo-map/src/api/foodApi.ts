import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL;

export type FoodInfo = {
  name: string;
  location: string;
  description?: string | string[];
  payment?: string[];
  hours?: Record<string, string>;
  exceptions?: string[];
  url: string;

  logo?: string;

  menu?: {
    label?: string;
    url: string;
  };
};

export type CampusFoodInfo =
  FoodInfo & {
    buildingId: string;
  };

export type ResidenceFoodInfo =
  FoodInfo & {
    residenceId: string;
  };

export type CampusFoodApiResponse =
  Record<string, CampusFoodInfo>;

export type ResidenceFoodApiResponse =
  Record<string, ResidenceFoodInfo>;

async function fetchCampusFood(): Promise<CampusFoodApiResponse> {
  const response =
    await axios.get<CampusFoodApiResponse>(
      `${API_URL}/food/campus`,
    );

  console.log(
    "CAMPUS FOOD RESPONSE",
    response.data,
  );

  return response.data;
}

async function fetchResidenceFood(): Promise<ResidenceFoodApiResponse> {
  const response =
    await axios.get<ResidenceFoodApiResponse>(
      `${API_URL}/food/residence`,
    );

  console.log(
    "RESIDENCE FOOD RESPONSE",
    response.data,
  );

  return response.data;
}

export function useCampusFood() {
  return useQuery({
    queryKey: ["campus-food-v2"],
    queryFn: fetchCampusFood,
    retry: false,
    refetchOnMount: "always",
  });
}

export function useResidenceFood() {
  return useQuery({
    queryKey: ["residence-food-v2"],
    queryFn: fetchResidenceFood,
    retry: false,
    refetchOnMount: "always",
  });
}