import test from "node:test";
import assert from "node:assert/strict";
import { getMapLegend } from "../src/utils/mapLegend.ts";
import { transitRouteColor } from "../src/utils/transitRoutes.ts";

test("removing categories and switching layers removes their legend entries", () => {
  const campus = getMapLegend({ categories: ["academic", "residence"] });
  assert.equal(campus.find(row => row.id === "residence")?.symbol, "square");
  assert.deepEqual(getMapLegend({ categories: ["academic"] }).map(row => row.id), ["academic"]);
  assert.deepEqual(getMapLegend({ categories: [], parking: ["paid", "paid", "restricted"] }).map(row => row.id), ["parking-paid", "parking-restricted"]);
  assert.deepEqual(getMapLegend({ categories: [], parking: [] }), []);
});

test("transit mode and route selection keep symbols and route colours in sync", () => {
  const all = getMapLegend({ categories: [], transit: { modes: ["bus", "ion"], route: null } });
  assert.equal(all.length, 4);
  const selected = getMapLegend({ categories: [], transit: { modes: ["bus", "ion"], route: { id: "bus:30", mode: "bus", routeId: "30", name: "Ring Road", destinations: [] } } });
  assert.deepEqual(selected.map(row => row.id), ["stop-bus", "vehicle-bus", "selected-route"]);
  assert.ok(selected.every(row => row.color === transitRouteColor("bus", "30")));
  assert.equal(selected.find(row => row.id === "vehicle-bus")?.text, "30");
  assert.deepEqual(getMapLegend({ categories: [] }), []);
});

test("food symbols reflect grouped markers and filtered opening states", () => {
  const rows = getMapLegend({ categories: [], food: [
    { group: "slc", category: "cafe", open: false },
    { group: "slc", category: "restaurant", open: true },
    { group: "dc", category: "cafe", open: false },
  ] });
  assert.deepEqual(rows.map(row => row.label), ["Food spots · open", "Cafes · closed / unconfirmed"]);
  assert.deepEqual(getMapLegend({ categories: [], food: [{ group: "dc", category: "cafe", open: true }] }).map(row => row.label), ["Cafes · open"]);
});

test("event symbols disappear when there are no matching events", () => {
  assert.equal(getMapLegend({ categories: [], eventCount: 2 }).length, 2);
  assert.deepEqual(getMapLegend({ categories: [], eventCount: 1 }).map(row => row.id), ["event"]);
  assert.deepEqual(getMapLegend({ categories: [], eventCount: 0 }), []);
});
