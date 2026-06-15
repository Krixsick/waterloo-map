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
const express_1 = __importDefault(require("express"));
const cheerio = __importStar(require("cheerio"));
const cache_1 = require("../cache");
const gymRouter = express_1.default.Router();
const gym_hours_website = {
    "CIF Fitness Centre": "https://warrior.uwaterloo.ca/Facility/GetFacility?facilityId=b2d98ff8-e37a-42da-bf72-06b259ff1a2c",
    "PAC - 1st Floor - Free Weights": "https://warrior.uwaterloo.ca/Facility/GetFacility?facilityId=7c59cbfb-ea06-46e0-8ec7-06739ccaec45",
    "PAC - 1st Floor - Functional": "https://warrior.uwaterloo.ca/Facility/GetFacility?facilityId=b03ac6cb-b6ec-4fd4-bd21-e9872a3a43f3",
    "PAC - 2nd Floor - Cardio": "https://warrior.uwaterloo.ca/Facility/GetFacility?facilityId=db0e08e1-faa7-4bc5-b639-088d7642a53e",
    "PAC - 2nd Floor - Weight Machines": "https://warrior.uwaterloo.ca/Facility/GetFacility?facilityId=b08d4801-c28c-4eba-8602-8e904ae0568c",
    "Warrior Zone": "https://warrior.uwaterloo.ca/Facility/GetFacility?facilityId=f30dc951-26b0-4909-b814-ce54d38c2fbb",
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
    const uw_gym_full_information = {};
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
    }
    catch (error) {
        console.log(error);
    }
};
const scrap_gym_busyness = async () => {
    const $ = await cheerio.fromURL(GYM_BUSYNESS_HOURS);
    const gym_occupy = {};
    //Each facility is a .col with a data-facilityid attribute.
    $(".col[data-facilityid]").each((index, element) => {
        const gym_card = $(element);
        if (!gym_card)
            return;
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
        if (!name || Number.isNaN(occupancy))
            return; // skip anything malformed
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
const scrap_one_gym_hours = async (url) => {
    const $ = await cheerio.fromURL(url);
    const body_text = $("body").text();
    const hours = {};
    for (const day of DAYS) {
        // Matches "Monday: 6:00 AM - 11:59 PM", "Monday Closed", etc.
        const regex = new RegExp(`${day}\\s*:?\\s*(Closed|\\d{1,2}:\\d{2}\\s*[AP]M\\s*[-–]\\s*\\d{1,2}:\\d{2}\\s*[AP]M)`, "i");
        const match = body_text.match(regex);
        hours[day] = match?.[1]?.replace(/\s+/g, " ").trim() ?? "Unknown";
        hours[day] = match?.[1] || "Unknown";
    }
    return hours;
};
const scrap_gym_hours = async () => {
    const results = await Promise.all(Object.entries(gym_hours_website).map(async ([name, url]) => {
        try {
            return [name, await scrap_one_gym_hours(url)];
        }
        catch (error) {
            console.log(error);
        }
    }));
    return Object.fromEntries(results.filter((e) => e !== null));
};
gymRouter.get("/", async (req, res) => {
    try {
        const data = await (0, cache_1.withCache)("gym:full-info:v1", 60 * 5, () => combine_gym_information());
        res.json(data);
    }
    catch (error) {
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
exports.default = gymRouter;
