import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { type TimeSlot } from "../types/library";
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
const library_api = "https://libcal.uwaterloo.ca/hours";
const libraryRouter = express();

const scrap_library_information = async () => {
  const waterloo_library_information: Record<string, TimeSlot[]> = {};
  const dates: string[] = [];
  const $ = await cheerio.fromURL(library_api);
  //Gets the dates mon-fri
  $("#s-lc-w-w1-7660 thead th .s-lc-h-head-date").each(
    (index, raw_html_element) => {
      dates.push($(raw_html_element).text().trim());
    },
  );
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
    waterloo_library_information[name] = dates.map((date, index) => ({
      date: date,
      time: times[index] || "Unknown",
    }));
  }

  return waterloo_library_information;
};

libraryRouter.get("/", async (req, res) => {
  try {
    const data = await scrap_library_information();
    console.log(data);
    // console.log(data); prints out website
  } catch (error) {
    console.log(error);
  }
});

export default libraryRouter;
