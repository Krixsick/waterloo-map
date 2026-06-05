import * as cheerio from "cheerio";
import express from "express";
import type { CampusFoodInfo } from "../../types/food";
const campus_food_router = express.Router();
const waterloo_campus_food_list = {};

const waterloo_campus_food_url: Record<string, string> = {
  "Brubakers Food Court":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/brubakers-food-court",
  "DC BYTES - Closed for M4 Construction":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/dc-bytes-closed-m4-construction",
  "Starbucks - STC":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/starbucks-stc",
  "The Market":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/market",
  "Tim Hortons - DC":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/tim-hortons-dc",
  "Tim Hortons SLC":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/tim-hortons-slc",
  "Browsers Cafe":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/browsers-cafe",
  "CEIT Cafe":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/ceit-cafe",
  "Ev3rgreen Cafe":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/ev3rgreen-cafe",
  "Jugo Juice-CIF":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/jugo-juice-cif",
  "Jugo Juice-SLC":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/jugo-juice-slc",
  "Liquid Assets Cafe":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/liquid-assets-cafe",
  "ML’s Diner":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/mls-diner",
  "Mudie’s - Village 1":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/mudies-village-1",
  "REVelation - Ron Eydt Village":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/revelation-ron-eydt-village",
  "Rolltation HLTH":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/rolltation-hlth",
  "South Side Marketplace":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/south-side-marketplace",
  "Starbucks - HLTH":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/starbucks-hlth",
  "Tim Hortons - ML":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/tim-hortons-ml",
  "Tim Hortons - EC5":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/tim-hortons-ec5",
  "Tim Hortons-SCH":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/tim-hortons-sch",
  "UW Food Services Administration":
    "https://uwaterloo.ca/food-services-information/locations-and-hours/uw-food-services-administration",
};

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
type Day = (typeof DAYS)[number];

/* 
Utility function to clean the day range from the waterloo campus food urls
*/

function expand_day_range(label: string): Day[] {
  // 1. Clean and split the string
  const parts = label.split(/\s*[-–]\s*/).map((s) => s.trim() as Day);
  const start_day = parts[0];
  const end_day = parts[1];

  if (parts.length === 1) {
    return DAYS.includes(start_day) ? [start_day] : [];
  }
  const start_index = DAYS.indexOf(start_day);
  let end_index = DAYS.indexOf(end_day);

  if (start_index === -1 || end_index === -1) return [];
  if (end_index < start_index) {
    end_index += 7;
  }
  const twoWeeks = [...DAYS, ...DAYS];
  return twoWeeks.slice(start_index, end_index + 1);
}
/*
scrap's like food inside the waterloo campus buildings so more cafs, tims 
*/
const scrap_waterloo_campus_food = async (name: string, url: string) => {
  const campus_food_information: Record<string, CampusFoodInfo> = {};
  const $ = await cheerio.fromURL(url);
  $(".content_node");
  const payment = $(".payment")
    .first()
    .text()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const location = $(".outlet-description p").text().replace("Location:", "");
  const features = $(".outlet-description p")
    .filter((index, element) => $(element).text().includes("Includes:"))
    .text()
    .replace("Includes:", "");
  const hours: Record<string, string> = {};
  //we loop through and each row we take in and store it
  $(".oh-display").each((index, element) => {
    const row = $(element);
    const label = row.find(".oh-display-label").text().trim();
    const time = row
      .find(".oh-display-times")
      .text()
      .replace(/\s+/g, " ")
      .trim();
    if (!label || !time) return; // guard against empty rows

    const days = expand_day_range(label);
    for (const day of days) hours[day] = time;
  });

  const exceptions: string[] = [];
  const notice = $(".field-name-field-hours-notice .field-item").text().trim();
  if (notice) exceptions.push(notice);

  return {
    name,
    location,
    features,
    payment,
    hours,
    exceptions,
    url,
  };
};

campus_food_router.get("/", async (req, res) => {
  try {
    // 1. Create an array of pending promises
    const scrape_promises = Object.entries(waterloo_campus_food_url).map(
      async ([name, url]) => {
        const data = await scrap_waterloo_campus_food(name, url);
        return [name, data] as const; // Return as a Tuple
      },
    );
    const results = await Promise.all(scrape_promises);
    const response = Object.fromEntries(results);
    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to scrape campus food" });
  }
});

export default campus_food_router;
