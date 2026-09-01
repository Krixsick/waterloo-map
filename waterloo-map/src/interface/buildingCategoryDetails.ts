import {
  BookOpen,
  Building2,
  Dumbbell,
  Home,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { BuildingCategory } from "../data/buildings";

type CategoryDetails = {
  icon: LucideIcon;
  label: string;
  styles: string;
};

export const buildingCategoryDetails: Record<
  BuildingCategory,
  CategoryDetails
> = {
  academic: {
    icon: Building2,
    label: "Academic",
    styles: "bg-sky-100 text-sky-700",
  },
  library: {
    icon: BookOpen,
    label: "Library",
    styles: "bg-amber-100 text-amber-700",
  },
  gym: {
    icon: Dumbbell,
    label: "Gym",
    styles: "bg-indigo-100 text-indigo-700",
  },
  "student-life": {
    icon: Users,
    label: "Student life",
    styles: "bg-teal-100 text-teal-700",
  },
  residence: {
    icon: Home,
    label: "Residence",
    styles: "bg-emerald-100 text-emerald-700",
  },
};
