import type { FoodLocation } from "./types";

// Source-verified September 5, 2026.
const url = "https://uwaterloo.ca/science-society/science-cnd";
export const scienceFood: Record<string, FoodLocation> = {
  "science-cnd": {
    id: "science-cnd",
    name: "Science C&D",
    buildingId: "b1",
    category: "cafe", categories: ["cafe", "convenience"],
    location: "Biology 1 (B1), room 160; across from lecture hall B1 271",
    description: "Volunteer-run coffee and doughnut shop in Biology 1 (B1), room 160, across from B1 271. Affordable pastries, hot and cold drinks, and snacks; serves fair-trade coffee. Contact: sciencecnd@gmail.com · Instagram: @sciencecnd.",
    hours: {
      Monday: "8:00AM - 4:00PM",
      Tuesday: "8:00AM - 4:00PM",
      Wednesday: "8:00AM - 4:00PM",
      Thursday: "8:00AM - 4:00PM",
      Friday: "8:00AM - 4:00PM",
      Saturday: "Closed",
      Sunday: "Closed",
    },
    exceptions: ["Generally operates on weekdays from the first day of classes to the last."],
    payment: ["Cash", "Credit", "Debit"],
    url,
    source: { name: "Science Society", url },
  },
};
