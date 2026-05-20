import * as cheerio from "cheerio";
import express from "express";

const residence_router = express.Router();
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
/*
scrap's like food inside the waterloo campus buildings so more cafs, tims 
*/
scrap_waterloo_campus_food = async () => {};

residence_router.get("/", (req, res) => {
  try {
    scrap_waterloo_campus_food();
  } catch (error) {
    console.log(error);
  }
});

export default residence_router;
