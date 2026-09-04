export type FoodCategory =
  | "restaurant"
  | "cafe"
  | "convenience"
  | "dining-hall"
  | "food-court"
  | "bar";

export type FoodLocation = {
  id: string;

  name: string;

  buildingId: string;

  category: FoodCategory;

  location?: string;

  description?:
    | string
    | string[];

  payment?: string[];

  hours?: Record<
    string,
    string
  >;

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
  };
};
