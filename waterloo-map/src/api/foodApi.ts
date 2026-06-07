export type CampusFoodInfo = {
    name: string;
    location: string;
    features: string;
    payment: string[];
    hours: Record<string, string>;
    exceptions: string[];
    url: string;
  };
  
  export async function fetchCampusFood(): Promise<CampusFoodInfo[]> {
    const response = await fetch("http://localhost:3001/food/campus");
  
    if (!response.ok) {
      throw new Error("Failed to fetch campus food");
    }
  
    const data: Record<string, CampusFoodInfo> = await response.json();
  
    return Object.values(data);
  }
  