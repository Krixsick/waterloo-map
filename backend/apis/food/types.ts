export type FoodCategory =
  | "dessert"
  | "restaurant"
  | "cafe"
  | "convenience"
  | "dining-hall"
  | "food-court"
  | "bar";

export type FoodLocation = {
  id: string;

  name: string;

  buildingId?: string;
  coordinates?: [number, number];

  category: FoodCategory;
  categories?: FoodCategory[];

  location?: string;

  description?:
    | string
    | string[];

  payment?: string[];
  paymentNote?: string;

  hours?: Record<
    string,
    string
  >;

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
