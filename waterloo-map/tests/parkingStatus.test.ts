import assert from "node:assert/strict";
import test from "node:test";
import { getParkingStatus } from "../src/utils/parkingStatus.ts";
import { parkingLots } from "../src/data/parkingLots.ts";

function status(id: string, time: string) {
  return getParkingStatus(parkingLots.find((lot) => lot.id === id)!, new Date(time)).status;
}

test("Lot X changes fee status at the exact Waterloo weekend boundaries", () => {
  assert.equal(status("X", "2026-09-04T16:29:59-04:00"), "paid");
  assert.equal(status("X", "2026-09-04T16:30:00-04:00"), "free");
  assert.equal(status("X", "2026-09-05T04:00:00-04:00"), "free");
  assert.equal(status("X", "2026-09-07T05:59:59-04:00"), "free");
  assert.equal(status("X", "2026-09-07T06:00:00-04:00"), "paid");
});

test("Waterloo time is used in winter and across the daylight-saving transition", () => {
  assert.equal(status("X", "2026-01-09T21:29:00Z"), "paid");
  assert.equal(status("X", "2026-01-09T21:30:00Z"), "free");
  assert.equal(status("X", "2026-11-02T10:59:00Z"), "free");
  assert.equal(status("X", "2026-11-02T11:00:00Z"), "paid");
});

test("free weekend rules never spill into other lots or override overnight restrictions", () => {
  assert.equal(status("C", "2026-09-05T12:00:00-04:00"), "paid");
  assert.equal(status("C", "2026-09-05T04:00:00-04:00"), "restricted");
  assert.equal(status("X", "2026-09-08T04:00:00-04:00"), "restricted");
  assert.equal(status("J", "2026-09-05T04:00:00-04:00"), "paid");
  assert.equal(status("K", "2026-09-05T12:00:00-04:00"), "restricted");
  assert.equal(status("A", "2026-09-05T12:00:00-04:00"), "closed");
});

test("visitor hours are separate from the advertised price", () => {
  assert.equal(status("R", "2026-09-04T16:29:00-04:00"), "restricted");
  assert.equal(status("R", "2026-09-04T16:30:00-04:00"), "paid");
  assert.equal(status("R", "2026-09-05T12:00:00-04:00"), "paid");
  assert.equal(status("H", "2026-09-04T17:59:00-04:00"), "restricted");
  assert.equal(status("H", "2026-09-04T18:00:00-04:00"), "paid");
});

test("lot IDs are unique, have traceable map records, and stay within the Waterloo campus area", () => {
  assert.equal(new Set(parkingLots.map((lot) => lot.id)).size, parkingLots.length);
  assert(parkingLots.every((lot) => lot.mapFeatureId > 0 && lot.coordinates[0] > -80.57 && lot.coordinates[0] < -80.52 && lot.coordinates[1] > 43.46 && lot.coordinates[1] < 43.49));
});
