import {
  Coffee,
  CupSoda,
  Sandwich,
  ShoppingBasket,
  Soup,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import type { FoodCategory } from "../api/foodApi";

type FoodCategoryDetails = {
  label: string;
  icon: LucideIcon;
};

export const FOOD_CATEGORY_DETAILS: Record<
  FoodCategory,
  FoodCategoryDetails
> = {
  restaurant: {
    label: "Restaurant",
    icon: UtensilsCrossed,
  },

  cafe: {
    label: "Cafe",
    icon: Coffee,
  },

  convenience: {
    label: "Convenience",
    icon: ShoppingBasket,
  },

  "dining-hall": {
    label: "Dining hall",
    icon: Soup,
  },

  "food-court": {
    label: "Food court",
    icon: Sandwich,
  },

  bar: {
    label: "Bar",
    icon: CupSoda,
  },
};