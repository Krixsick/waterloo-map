import type { FoodLocation } from "./types";

// Details checked against MathSoc's C&D page on September 5, 2026.
// Kept as a source-linked snapshot because the site blocks automated fetches.
const sourceURL = "https://mathsoc.uwaterloo.ca/services/cnd";

export const mathFood: Record<string, FoodLocation> = {
  "math-cnd": {
    id: "math-cnd",
    name: "Math C&D",
    buildingId: "mc",
    category: "convenience",
    location: "3rd floor, Mathematics & Computer Building (MC), 200 University Ave. W., Waterloo",
    description: "Student-priced coffee, doughnuts, soups, sandwiches, sushi, patties, and samosas on MC’s third floor.",
    hours: {
      Monday: "8:00AM - 7:00PM",
      Tuesday: "8:00AM - 7:00PM",
      Wednesday: "8:00AM - 7:00PM",
      Thursday: "8:00AM - 7:00PM",
      Friday: "8:00AM - 4:30PM",
      Saturday: "Closed",
      Sunday: "Closed",
    },
    exceptions: ["Closed during reading week and reduced hours during the final exam period."],
    url: sourceURL,
    source: { name: "MathSoc — Math C&D", url: sourceURL },
    menu: { type: "weekly", url: `${sourceURL}#daily-specials` },
  },
};
