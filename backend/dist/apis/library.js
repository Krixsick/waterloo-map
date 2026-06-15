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
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const cache_1 = require("../cache");
const UW_API_KEY = process.env.UW_API_KEY;
//main waterloo libraries
const library_map = {
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
const libraryRouter = (0, express_1.default)();
const uw = axios_1.default.create({
    baseURL: "https://openapi.data.uwaterloo.ca/v3",
    headers: {
        "x-api-key": UW_API_KEY,
    },
});
/**
 * Helper function to scrap data from the libcal waterloo website that displays hours
 */
const scrap_library_information = async () => {
    const waterloo_library_information = {};
    const dates = [];
    const $ = await cheerio.fromURL(library_website);
    //Gets the dates mon-fri
    $("#s-lc-w-w1-7660 thead th .s-lc-h-head-date").each((index, raw_html_element) => {
        dates.push($(raw_html_element).text().trim());
    });
    console.log(dates);
    //loops through each library
    for (const [id, name] of Object.entries(library_map)) {
        // finds the libraries time rows which is usually 8 (first index being the name)
        const row = $(`#s-lc-w-w1-7660 tr.s-lc-h-loc.s-lc-h-tr_${id}`);
        const times = [];
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
    try {
        const data = await (0, cache_1.withCache)("library:hours:v1", 60 * 30, () => scrap_library_information());
        // console.log(data);
        res.json(data);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to load library hours" });
    }
});
libraryRouter.get("/food", async (req, res) => {
    try {
        const data = await (0, cache_1.withCache)("library:food-services-locations:v1", 60 * 60, async () => {
            const response = await uw.get("/FoodServicesLocations");
            return response.data;
        });
        res.json(data);
    }
    catch (err) {
        console.error("UW API error:", err.response?.status, err.response?.data ?? err.message);
        res.status(500).json({ error: "UW API request failed" });
    }
});
exports.default = libraryRouter;
