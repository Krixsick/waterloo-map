import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import * as cheerio from "cheerio";
import { findLocationContainer, getCleanLines, parseHours, parseExceptions } from "../apis/food/foodServicesUtils";
const $ = cheerio.load(readFileSync("services/fixtures/campus-food.html", "utf8"));
const lines = (name: string) => getCleanLines(findLocationContainer($, name)!.text());
test("vendor hours remain separate and special dates are retained", () => {
 assert.equal(parseHours(lines("Pizza Pizza Student")).Monday, "10:00 am - 7:30 pm");
 assert.equal(parseHours(lines("Pizza Pizza Student")).Friday, "10:00 am - 5:00 pm");
 assert.ok(parseExceptions(lines("Subway Student")).includes("Sep 1 - Sep 6: 11:00 am - 4:00 pm"));
 assert.equal(parseHours(lines("Warriors Fuel Columbia")).Monday,"7:00 am - 12:00 pm");
 assert.equal(parseHours(lines("Warriors Fuel Columbia")).Friday,"3:00 pm - 9:30 pm");
 assert.ok(Object.values(parseHours(lines("DC Bytes - Closed"))).every(value=>value==="Closed"));
});
