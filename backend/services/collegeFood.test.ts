import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parseCollegeFood } from "../apis/food/collegeFood";
const fixture = (id: string) => readFileSync(join(process.cwd(), "services", "fixtures", `${id}-food.html`), "utf8");
const fall = new Date("2026-09-04T16:00:00Z");
test("Renison separates weekday, weekend and statutory holiday meals", () => {
  const food = parseCollegeFood("renison", fixture("renison"), fall);
  assert.equal(food.buildingId, "renison");
  assert.match(food.hours!.Friday, /Dinner 4:45PM - 7:30PM/);
  assert.match(food.hours!.Saturday, /Brunch 10:30AM - 1:30PM/);
  assert.equal(parseCollegeFood("renison", fixture("renison"), new Date("2026-09-07T16:00:00Z")).hours!.Monday, food.hours!.Sunday);
});
test("United includes move-in overrides, closure, and both weekend brunch services", () => {
  const food = parseCollegeFood("united", fixture("united"), fall);
  assert.equal(food.buildingId, "united");
  assert.ok(food.exceptions!.includes("September 5 - 7: 7:30AM - 7:00PM"));
  assert.ok(food.exceptions!.includes("September 3: Closed"));
  assert.ok(food.exceptions!.includes("August 31 - September 4: Breakfast 8:00AM - 9:00AM · Lunch 12:00PM - 1:00PM · Dinner 5:00PM - 6:00PM"));
  assert.match(food.hours!.Saturday, /Hot Brunch 10:00AM - 2:30PM/);
  assert.match(parseCollegeFood("united", fixture("united"), new Date("2026-06-01T16:00:00Z")).hours!.Saturday, /Continental Brunch 10:00AM/);
});
test("Grebel chooses the term and labels the private Wednesday supper", () => {
  const food = parseCollegeFood("grebel", fixture("grebel"), fall);
  assert.equal(food.buildingId, "grebel");
  assert.match(food.hours!.Wednesday, /Supper \(Grebel community only\) 5:30PM - 6:30PM/);
  assert.match(food.hours!.Friday, /Supper 5:00PM - 6:30PM/);
  assert.match(parseCollegeFood("grebel", fixture("grebel"), new Date("2026-06-01T16:00:00Z")).hours!.Friday, /Supper 5:00PM - 6:00PM/);
});
test("Missing source content does not manufacture meal hours", () => {
  assert.throws(() => parseCollegeFood("grebel", "<p>Unavailable</p>", fall));
});
