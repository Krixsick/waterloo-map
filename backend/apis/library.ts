import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import {
  type LibraryOccupancyLevel,
  type LibraryOccupancyLocation,
  type LibraryOccupancyResponse,
  type LibraryOccupancyZone,
  type TimeSlot,
} from "../types/library";
import { withCache } from "../cache";
import { loadCollegeLibraryHours } from "../services/collegeLibraryHours";

const UW_API_KEY = process.env.UW_API_KEY;
//main waterloo libraries
const library_map: Record<string, string> = {
  7514: "Dana Porter Library",
  7515: "Davis Centre Library",
  7542: "Musagetes Architecture Library",
  7543: "Witer Learning Resource Centre",
};

/**
 *
 * Name lid Parent
 *Library Help Desk (Dana Porter) 8283 Dana Porter
 Geospatial Centre 7548 Dana Porter
 Special Collections & Archives7549 Dana Porter
 Library Help Desk (Davis) 8284 DavisLibrary 
 Help Desk (Musagetes) 8406 Musagetes 
 Chat with us 7545 Ask us
 Email us 7546Ask us
 */
const library_website = "https://libcal.uwaterloo.ca/hours";
const library_occupancy_website = "https://waitz.io/waterloo";
const library_occupancy_api = "https://waitz.io/live/waterloo";
const libraryRouter = express();
export const libraryOccupancyRouter = express.Router();

type WaitzOccupancySpace = {
  id: number;
  name: string;
  percentage?: number | null;
  capacity?: number | null;
  people?: number | null;
  isOpen?: boolean;
  isAvailable?: boolean;
  subLocs?: WaitzOccupancySpace[] | false;
};

type WaitzOccupancyResponse = {
  data?: WaitzOccupancySpace[];
};

const canonicalLibraryNames: Record<string, string> = {
  "Davis Library": "Davis Centre Library",
};

const uw = axios.create({
  baseURL: "https://openapi.data.uwaterloo.ca/v3",
  headers: {
    "x-api-key": UW_API_KEY,
  },
});

/**
 * Helper function to scrap data from the libcal waterloo website that displays hours
 */
const scrap_library_information = async () => {
  const waterloo_library_information: Record<string, TimeSlot[]> = {};
  const dates: string[] = [];
  const $ = await cheerio.fromURL(library_website);
  //Gets the dates mon-fri
  $("#s-lc-w-w1-7660 thead th .s-lc-h-head-date").each(
    (index, raw_html_element) => {
      dates.push($(raw_html_element).text().trim());
    },
  );
  console.log(dates);
  //loops through each library
  for (const [id, name] of Object.entries(library_map)) {
    // finds the libraries time rows which is usually 8 (first index being the name)
    const row = $(`#s-lc-w-w1-7660 tr.s-lc-h-loc.s-lc-h-tr_${id}`);
    const times: string[] = [];
    row
      .find("td")
      .slice(1)
      .each((index, raw_html_element) => {
        times.push($(raw_html_element).text().trim());
      });
    console.log(times);
    waterloo_library_information[name] = dates.map((date, index) => ({
      date: date,
      time: times[index] || "Unknown",
    }));
  }

  return waterloo_library_information;
};

function percentageValue(value?: number | null): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(Math.min(Math.max(value, 0), 1) * 100);
}

function optionalNumber(value?: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function occupancyLevel(
  percentage: number | null,
  isOpen: boolean,
  isAvailable: boolean,
): LibraryOccupancyLevel {
  if (!isOpen) return "closed";
  if (!isAvailable || percentage === null) return "unavailable";
  if (percentage <= 45) return "not-busy";
  if (percentage <= 80) return "busy";
  return "very-busy";
}

function normalizeOccupancyZone(space: WaitzOccupancySpace): LibraryOccupancyZone {
  const percentage = percentageValue(space.percentage);
  const isOpen = space.isOpen !== false;
  const isAvailable = space.isAvailable !== false;

  return {
    id: space.id,
    name: space.name,
    percentage,
    capacity: optionalNumber(space.capacity),
    people: optionalNumber(space.people),
    level: occupancyLevel(percentage, isOpen, isAvailable),
    isOpen,
    isAvailable,
  };
}

function normalizeOccupancyLocation(
  space: WaitzOccupancySpace,
): LibraryOccupancyLocation {
  return {
    ...normalizeOccupancyZone(space),
    name: canonicalLibraryNames[space.name] ?? space.name,
    zones: Array.isArray(space.subLocs)
      ? space.subLocs.map(normalizeOccupancyZone)
      : [],
  };
}

async function loadLibraryOccupancy(): Promise<LibraryOccupancyResponse> {
  const response = await axios.get<WaitzOccupancyResponse>(
    library_occupancy_api,
    {
      timeout: 10_000,
      headers: {
        Accept: "application/json",
        "User-Agent": "waterloo-map/1.0",
      },
    },
  );

  const spaces = Array.isArray(response.data?.data) ? response.data.data : [];

  return {
    locations: spaces.map(normalizeOccupancyLocation),
    source: library_occupancy_website,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Route to display information about libraries hours
 */
libraryRouter.get("/", async (req, res) => {
  try {
    const [mainLibraries, collegeLibraries] = await Promise.allSettled([
      withCache("library:hours:v1", 60 * 30, scrap_library_information),
      loadCollegeLibraryHours(),
    ]);
    const data = {
      ...(mainLibraries.status === "fulfilled" ? mainLibraries.value : {}),
      ...(collegeLibraries.status === "fulfilled" ? collegeLibraries.value : {}),
    };
    if (!Object.keys(data).length) throw new Error("No library hours sources available");

    // console.log(data);
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to load library hours" });
  }
});

libraryRouter.get("/food", async (req, res) => {
  try {
    const data = await withCache(
      "library:food-services-locations:v1",
      60 * 60,
      async () => {
        const response = await uw.get("/FoodServicesLocations");
        return response.data;
      },
    );

    res.json(data);
  } catch (err: any) {
    console.error(
      "UW API error:",
      err.response?.status,
      err.response?.data ?? err.message,
    );
    res.status(500).json({ error: "UW API request failed" });
  }
});

libraryOccupancyRouter.get("/", async (_req, res) => {
  try {
    const data = await withCache(
      "library:occupancy:v1",
      60,
      loadLibraryOccupancy,
    );

    res.json(data);
  } catch (error) {
    console.error("Library occupancy request failed:", error);
    res.status(500).json({ error: "Failed to load library occupancy" });
  }
});

export default libraryRouter;
