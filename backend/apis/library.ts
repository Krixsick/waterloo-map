import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { type TimeSlot } from "../types/library";

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
const libraryRouter = express();

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

/**
 * Route to display information about libraries hours
 */
libraryRouter.get("/", async (req, res) => {
  //should store in a cache to minimize calls
  try {
    const data = await scrap_library_information();

    // console.log(data);
    res.json(data);
  } catch (error) {
    console.log(error);
  }
});

libraryRouter.get("/food", async (req, res) => {
  try {
    const { data } = await uw.get("/FoodServicesLocations");
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

export default libraryRouter;
