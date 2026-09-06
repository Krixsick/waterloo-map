import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parseCollegeLibraryHours } from "./collegeLibraryHours";

const fixture = (name: string) => readFileSync(join(process.cwd(), "services", "fixtures", `${name}-hours.html`), "utf8");
const hours = (name: string, date: string) => parseCollegeLibraryHours(fixture(name), new Date(date))[0].time;

test("SJU weekly hours, weekend closure, and holiday notice", () => {
  assert.equal(hours("sju", "2026-09-04T16:00:00Z"), "9:00am – 4:30pm");
  assert.equal(hours("sju", "2026-09-05T16:00:00Z"), "Closed");
  assert.equal(hours("sju", "2026-08-03T16:00:00Z"), "Closed");
});

test("LWL closure overrides weekly hours through September 7", () => {
  for (const day of ["2026-08-28", "2026-09-04", "2026-09-07"]) {
    assert.equal(hours("lwl", `${day}T16:00:00Z`), "Closed");
  }
  assert.equal(hours("lwl", "2026-09-08T16:00:00Z"), "9:15am – 8:00pm");
  assert.equal(hours("lwl", "2026-09-11T16:00:00Z"), "9:15am – 4:30pm");
  assert.equal(hours("lwl", "2026-09-12T16:00:00Z"), "12:00pm – 4:00pm");
});

test("MGL term transition, holiday ranges, and ambiguous source hours", () => {
  assert.equal(hours("mgl", "2026-09-04T16:00:00Z"), "9:00am – 4:00pm");
  assert.equal(hours("mgl", "2026-09-07T16:00:00Z"), "Closed");
  assert.equal(hours("mgl", "2026-09-08T16:00:00Z"), "Hours unavailable");
  assert.equal(hours("mgl", "2026-09-09T16:00:00Z"), "9:00am – 9:00pm");
  assert.equal(hours("mgl", "2026-10-12T16:00:00Z"), "Closed");
  assert.equal(hours("mgl", "2026-10-14T16:00:00Z"), "9:00am – 4:00pm");
});

test("Uses the Toronto date around UTC midnight", () => {
  assert.equal(hours("sju", "2026-09-05T01:00:00Z"), "9:00am – 4:30pm");
});

test("Missing tables fail instead of fabricating closed hours", () => {
  assert.throws(() => parseCollegeLibraryHours("<p>Temporarily unavailable</p>"));
});
