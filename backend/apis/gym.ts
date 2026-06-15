import express from "express";
import * as cheerio from "cheerio";
import type { GymOccupy, GymFullInfo } from "../types/gym";
import { withCache } from "../cache";
const gymRouter = express.Router();

const gym_hours_website: Record<string, string> = {
  "CIF Fitness Centre":
    "https://warrior.uwaterloo.ca/Facility/GetFacility?facilityId=b2d98ff8-e37a-42da-bf72-06b259ff1a2c",
  "PAC - 1st Floor - Free Weights":
    "https://warrior.uwaterloo.ca/Facility/GetFacility?facilityId=7c59cbfb-ea06-46e0-8ec7-06739ccaec45",
  "PAC - 1st Floor - Functional":
    "https://warrior.uwaterloo.ca/Facility/GetFacility?facilityId=b03ac6cb-b6ec-4fd4-bd21-e9872a3a43f3",
  "PAC - 2nd Floor - Cardio":
    "https://warrior.uwaterloo.ca/Facility/GetFacility?facilityId=db0e08e1-faa7-4bc5-b639-088d7642a53e",
  "PAC - 2nd Floor - Weight Machines":
    "https://warrior.uwaterloo.ca/Facility/GetFacility?facilityId=b08d4801-c28c-4eba-8602-8e904ae0568c",
  "Warrior Zone":
    "https://warrior.uwaterloo.ca/Facility/GetFacility?facilityId=f30dc951-26b0-4909-b814-ce54d38c2fbb",
};
const GYM_BUSYNESS_HOURS = "https://warrior.uwaterloo.ca/FacilityOccupancy";
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const combine_gym_information = async () => {
  const uw_gym_full_information: Record<string, GymFullInfo> = {};
  try {
    const [busynessData, hoursData] = await Promise.all([
      scrap_gym_busyness(),
      scrap_gym_hours(),
    ]);
    const allNames = new Set([
      ...Object.keys(hoursData),
      ...Object.keys(busynessData),
    ]);

    for (const name of allNames) {
      uw_gym_full_information[name] = {
        hours: hoursData[name],
        busyness: busynessData[name],
      };
    }

    return uw_gym_full_information;
  } catch (error) {
    console.log(error);
  }
};

const scrap_gym_busyness = async () => {
  const $ = await cheerio.fromURL(GYM_BUSYNESS_HOURS);
  const gym_occupy: Record<string, GymOccupy> = {};
  //Each facility is a .col with a data-facilityid attribute.
  $(".col[data-facilityid]").each((index, element) => {
    const gym_card = $(element);
    if (!gym_card) return;

    const name = gym_card.find("h2 strong").first().text().trim() || undefined;

    //The first .occupancy-chart canvas holds the numbers as data-* attrs.
    const canvas = gym_card.find("canvas.occupancy-chart").first() || undefined;
    const occupancy = Number(canvas.attr("data-occupancy")) || undefined;
    const remaining = Number(canvas.attr("data-remaining")) || undefined;
    const ratio = Number(canvas.attr("data-ratio")) || 0;

    //"Max Occupancy: 100" lives in a <p class="max-occupancy"> with the number in <strong>.
    const maxText = gym_card
      .find(".max-occupancy strong")
      .first()
      .text()
      .trim();
    const maxOccupancy = Number(maxText);

    if (!name || Number.isNaN(occupancy)) return; // skip anything malformed

    gym_occupy[name] = {
      name,
      occupancy,
      remaining,
      maxOccupancy,
      ratio,
      percent: Math.round(ratio * 100),
    };
  });
  return gym_occupy;
};

const scrap_one_gym_hours = async (
  url: string,
): Promise<Record<string, string>> => {
  const $ = await cheerio.fromURL(url);
  const body_text = $("body").text();
  const hours: Record<string, string> = {};
  for (const day of DAYS) {
    // Matches "Monday: 6:00 AM - 11:59 PM", "Monday Closed", etc.
    const regex = new RegExp(
      `${day}\\s*:?\\s*(Closed|\\d{1,2}:\\d{2}\\s*[AP]M\\s*[-–]\\s*\\d{1,2}:\\d{2}\\s*[AP]M)`,
      "i",
    );
    const match = body_text.match(regex);
    hours[day] = match?.[1]?.replace(/\s+/g, " ").trim() ?? "Unknown";
    hours[day] = match?.[1] || "Unknown";
  }
  return hours;
};

const scrap_gym_hours = async (): Promise<
  Record<string, Record<string, string>>
> => {
  const results = await Promise.all(
    Object.entries(gym_hours_website).map(async ([name, url]) => {
      try {
        return [name, await scrap_one_gym_hours(url)] as const;
      } catch (error) {
        console.log(error);
      }
    }),
  );
  return Object.fromEntries(
    results.filter((e): e is NonNullable<typeof e> => e !== null),
  );
};

gymRouter.get("/", async (req, res) => {
  try {
    const data = await withCache("gym:full-info:v1", 60 * 5, () =>
      combine_gym_information(),
    );
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to load gym information" });
  }
});

// gymRouter.get("/hours", async (req, res) => {
//   try {
//     const data = await scrap_gym_hours();
//     res.json(data);
//   } catch (error) {
//     console.log(error);
//   }
// });

export default gymRouter;
