export interface CampusFoodInfo {
  name: string;
  location: string | null;
  description: string;
  paymentMethods: string[];
  hours: Record<string, string>;
  exceptions: string[];
  url: string;
}

export type Day =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export type CampusFoodConfig = {
  buildingId: string;
  searchName: string;
};

export type CampusFoodResponse = CampusFoodInfo & {
  buildingId: string;
};

//   name: displayName,
// buildingId:
//   config.buildingId,
// location: "",
// description,
// payment: [],
// hours,
// exceptions,
// url: FOOD_SERVICES_URL,
