"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio = __importStar(require("cheerio"));
const express_1 = __importDefault(require("express"));
const campus_food_router = express_1.default.Router();
const waterloo_campus_food_list = {};
const waterloo_campus_food_url = {
    "Brubakers Food Court": "https://uwaterloo.ca/food-services-information/locations-and-hours/brubakers-food-court",
    "DC BYTES - Closed for M4 Construction": "https://uwaterloo.ca/food-services-information/locations-and-hours/dc-bytes-closed-m4-construction",
    "Starbucks - STC": "https://uwaterloo.ca/food-services-information/locations-and-hours/starbucks-stc",
    "The Market": "https://uwaterloo.ca/food-services-information/locations-and-hours/market",
    "Tim Hortons - DC": "https://uwaterloo.ca/food-services-information/locations-and-hours/tim-hortons-dc",
    "Tim Hortons SLC": "https://uwaterloo.ca/food-services-information/locations-and-hours/tim-hortons-slc",
    "Browsers Cafe": "https://uwaterloo.ca/food-services-information/locations-and-hours/browsers-cafe",
    "CEIT Cafe": "https://uwaterloo.ca/food-services-information/locations-and-hours/ceit-cafe",
    "Ev3rgreen Cafe": "https://uwaterloo.ca/food-services-information/locations-and-hours/ev3rgreen-cafe",
    "Jugo Juice-CIF": "https://uwaterloo.ca/food-services-information/locations-and-hours/jugo-juice-cif",
    "Jugo Juice-SLC": "https://uwaterloo.ca/food-services-information/locations-and-hours/jugo-juice-slc",
    "Liquid Assets Cafe": "https://uwaterloo.ca/food-services-information/locations-and-hours/liquid-assets-cafe",
    "ML’s Diner": "https://uwaterloo.ca/food-services-information/locations-and-hours/mls-diner",
    "Mudie’s - Village 1": "https://uwaterloo.ca/food-services-information/locations-and-hours/mudies-village-1",
    "REVelation - Ron Eydt Village": "https://uwaterloo.ca/food-services-information/locations-and-hours/revelation-ron-eydt-village",
    "Rolltation HLTH": "https://uwaterloo.ca/food-services-information/locations-and-hours/rolltation-hlth",
    "South Side Marketplace": "https://uwaterloo.ca/food-services-information/locations-and-hours/south-side-marketplace",
    "Starbucks - HLTH": "https://uwaterloo.ca/food-services-information/locations-and-hours/starbucks-hlth",
    "Tim Hortons - ML": "https://uwaterloo.ca/food-services-information/locations-and-hours/tim-hortons-ml",
    "Tim Hortons - EC5": "https://uwaterloo.ca/food-services-information/locations-and-hours/tim-hortons-ec5",
    "Tim Hortons-SCH": "https://uwaterloo.ca/food-services-information/locations-and-hours/tim-hortons-sch",
    "UW Food Services Administration": "https://uwaterloo.ca/food-services-information/locations-and-hours/uw-food-services-administration",
};
const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];
/*
Utility function to clean the day range from the waterloo campus food urls
*/
function expand_day_range(label) {
    // 1. Clean and split the string
    const parts = label.split(/\s*[-–]\s*/).map((s) => s.trim());
    const start_day = parts[0];
    const end_day = parts[1];
    if (parts.length === 1) {
        return DAYS.includes(start_day) ? [start_day] : [];
    }
    const start_index = DAYS.indexOf(start_day);
    let end_index = DAYS.indexOf(end_day);
    if (start_index === -1 || end_index === -1)
        return [];
    if (end_index < start_index) {
        end_index += 7;
    }
    const twoWeeks = [...DAYS, ...DAYS];
    return twoWeeks.slice(start_index, end_index + 1);
}
/*
scrap's like food inside the waterloo campus buildings so more cafs, tims
*/
const scrap_waterloo_campus_food = async (name, url) => {
    const campus_food_information = {};
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
    const hours = {};
    //we loop through and each row we take in and store it
    $(".oh-display").each((index, element) => {
        const row = $(element);
        const label = row.find(".oh-display-label").text().trim();
        const time = row
            .find(".oh-display-times")
            .text()
            .replace(/\s+/g, " ")
            .trim();
        if (!label || !time)
            return; // guard against empty rows
        const days = expand_day_range(label);
        for (const day of days)
            hours[day] = time;
    });
    const exceptions = [];
    const notice = $(".field-name-field-hours-notice .field-item").text().trim();
    if (notice)
        exceptions.push(notice);
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
        const scrape_promises = Object.entries(waterloo_campus_food_url).map(async ([name, url]) => {
            const data = await scrap_waterloo_campus_food(name, url);
            return [name, data]; // Return as a Tuple
        });
        const results = await Promise.all(scrape_promises);
        const response = Object.fromEntries(results);
        res.json(response);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to scrape campus food" });
    }
});
exports.default = campus_food_router;
