import {
  Coffee,
  IceCreamBowl,
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
  dessert: {label: "Desserts", icon: IceCreamBowl},
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
export const FOOD_CATEGORY_COLOURS: Record<FoodCategory, string> = {
  dessert: "bg-pink-50 text-pink-700",
  cafe: "bg-amber-50 text-amber-800",
  convenience: "bg-sky-50 text-sky-700",
  restaurant: "bg-emerald-50 text-emerald-700",
  "dining-hall": "bg-orange-50 text-orange-700",
  "food-court": "bg-teal-50 text-teal-700",
  bar: "bg-violet-50 text-violet-700",
};
