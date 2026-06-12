export type CampusFoodInfo = {
  name: string;
  location: string;
  features: string;
  payment: string[];
  hours: Record<string, string>;
  exceptions: string[];
  url: string;
};

const FOOD_API_URL = import.meta.env.VITE_API_URL;

export async function fetchCampusFood(): Promise<CampusFoodInfo[]> {
  const response = await fetch(`${FOOD_API_URL}/food/campus`);

  if (!response.ok) {
    throw new Error("Failed to fetch campus food");
  }

  const data: Record<string, CampusFoodInfo> = await response.json();

  return Object.values(data);
}
