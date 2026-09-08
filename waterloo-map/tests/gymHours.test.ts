import assert from "node:assert/strict";
import test from "node:test";
import { getGymHoursStatus } from "../src/utils/gymHours.ts";

const tuesday = (time: string) => new Date(`2026-09-08T${time}:00-04:00`);

test("PAC and CIF stay open in the evening when closing at 12:30 AM", () => {
  for (const hours of ["6:00 AM - 12:30 AM", "3:00 PM - 12:30 AM"]) {
    assert.deepEqual(getGymHoursStatus({ Tuesday: hours }, tuesday("18:25")), {
      liveHours: hours, isOpen: true, timeRemaining: "6h 5m left",
    });
  }
});

test("opening is inclusive and gyms remain closed before opening", () => {
  const hours = { Tuesday: "3:00 PM - 12:30 AM" };
  assert.equal(getGymHoursStatus(hours, tuesday("14:59"))?.isOpen, false);
  assert.equal(getGymHoursStatus(hours, tuesday("15:00"))?.isOpen, true);
});

test("yesterday's overnight hours remain open through midnight until closing", () => {
  const hours = { Monday: "6:00 AM - 12:30 AM", Tuesday: "3:00 PM - 12:30 AM" };
  assert.equal(getGymHoursStatus(hours, tuesday("00:00"))?.timeRemaining, "30m left");
  assert.equal(getGymHoursStatus(hours, tuesday("00:29"))?.timeRemaining, "1m left");
  assert.equal(getGymHoursStatus(hours, tuesday("00:30"))?.isOpen, false);
  assert.equal(getGymHoursStatus(hours, tuesday("01:00"))?.isOpen, false);
});

test("a closed previous day must not borrow tonight's late closing time", () => {
  const hours = { Monday: "Closed", Tuesday: "3:00 PM - 12:30 AM" };
  assert.equal(getGymHoursStatus(hours, tuesday("00:15"))?.isOpen, false);
});

test("yesterday's closing time takes precedence even if today is closed", () => {
  const hours = { Monday: "6:00 AM - 12:30 AM", Tuesday: "Closed" };
  assert.equal(getGymHoursStatus(hours, tuesday("00:15"))?.isOpen, true);
  assert.equal(getGymHoursStatus(hours, tuesday("00:30"))?.isOpen, false);
});

test("Sunday overnight hours carry into Monday", () => {
  const hours = { Sunday: "9:00 AM - 12:30 AM", Monday: "Closed" };
  assert.equal(getGymHoursStatus(hours, new Date("2026-09-07T00:15:00-04:00"))?.timeRemaining, "15m left");
});

test("same-day hours close exactly at the closing time", () => {
  const hours = { Tuesday: "9:00 AM - 5:30 PM" };
  assert.equal(getGymHoursStatus(hours, tuesday("17:29"))?.isOpen, true);
  assert.equal(getGymHoursStatus(hours, tuesday("17:30"))?.isOpen, false);
});

test("uses Toronto's weekday and time rather than the host timezone", () => {
  const hours = { Tuesday: "6:00 AM - 12:30 AM", Wednesday: "Closed" };
  assert.equal(getGymHoursStatus(hours, new Date("2026-09-09T02:00:00Z"))?.timeRemaining, "2h 30m left");
  assert.equal(getGymHoursStatus({ Tuesday: "6:00 AM - 12:30 AM" }, new Date("2026-12-08T23:25:00Z"))?.timeRemaining, "6h 5m left");
});

test("supports dash variants and preserves unknown or missing hours", () => {
  for (const dash of ["-", "–", "—"]) {
    assert.equal(getGymHoursStatus({ Tuesday: `6:00 AM ${dash} 12:30 AM` }, tuesday("18:25"))?.isOpen, true);
  }
  for (const hours of ["Unknown", "Hours unavailable", "25:00 AM - 6:00 PM", "9:99 AM - 6:00 PM"]) {
    assert.equal(getGymHoursStatus({ Tuesday: hours }, tuesday("18:25"))?.isOpen, null);
  }
  assert.equal(getGymHoursStatus({}, tuesday("18:25")), null);
});
