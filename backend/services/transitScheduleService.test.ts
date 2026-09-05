import assert from "node:assert/strict";
import test from "node:test";
import AdmZip from "adm-zip";
import { parseNetwork } from "./transitScheduleService";

function fixture(includeShapes = true) {
  const archive = new AdmZip();
  const files: Record<string, string> = {
    "stops.txt": "stop_id,stop_name,stop_lat,stop_lon\nA,Campus,43.47,-80.54\nB,Station,43.48,-80.55\nC,Library,43.49,-80.56",
    "routes.txt": "route_id,route_short_name,route_long_name,route_type\ninternal30,30,Ring Road,3\nrail,301,ION,2",
    "calendar_dates.txt": "service_id,date,exception_type\nweekday,20260904,1\nweekend,20260905,1",
    "trips.txt": "route_id,service_id,trip_id,trip_headsign,direction_id,shape_id\ninternal30,weekday,t1,Station,0,out\ninternal30,weekday,t2,Station,0,out\ninternal30,weekday,t3,Campus,1,in\ninternal30,weekday,t4,Library,,missing\ninternal30,weekend,t5,Weekend,0,out\nrail,weekday,ion1,Station,0,out",
    "stop_times.txt": "trip_id,arrival_time,departure_time,stop_id,stop_sequence\nt1,12:00:00,12:00:00,B,2\nt1,11:55:00,11:55:00,A,1\nt2,13:00:00,13:00:00,A,1\nt2,13:05:00,13:05:00,B,2\nt3,14:00:00,14:00:00,B,1\nt3,14:05:00,14:05:00,A,2\nt4,15:00:00,15:00:00,A,1\nt4,15:05:00,15:05:00,C,2\nt5,12:00:00,12:00:00,A,1\nion1,12:00:00,12:00:00,A,1",
  };
  if (includeShapes) files["shapes.txt"] = "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence\nout,43.48,-80.55,2\nout,43.47,-80.54,1\nout,999,-80.5,3\nin,43.48,-80.55,1\nin,43.47,-80.54,2";
  Object.entries(files).forEach(([name, value]) => archive.addFile(name, Buffer.from(value)));
  return archive.toBuffer();
}

test("routes preserve destination branches, scheduled stop order and real shape geometry", () => {
  const network = parseNetwork(fixture(), "bus", "20260904");
  assert.equal(network.routes.length, 1, "ION must not be duplicated as a bus route");
  const route = network.routes[0];
  assert.equal(route.routeId, "30", "public route number is used instead of the internal ID");
  assert.equal(route.name, "Ring Road");
  assert.equal(route.patterns.length, 3, "repeated trips share a pattern; branches remain separate");
  const outbound = route.patterns.find((pattern) => pattern.headsign === "Station")!;
  assert.deepEqual(outbound.tripIds, ["t1", "t2"]);
  assert.deepEqual(outbound.stops.map((stop) => stop.stopId), ["A", "B"]);
  assert.deepEqual(outbound.coordinates, [[-80.54, 43.47], [-80.55, 43.48]]);
  const inbound = route.patterns.find((pattern) => pattern.headsign === "Campus")!;
  assert.deepEqual(inbound.stops.map((stop) => stop.stopId), ["B", "A"]);
  assert.equal(inbound.directionId, 1);
  const missing = route.patterns.find((pattern) => pattern.headsign === "Library")!;
  assert.equal(missing.directionId, null, "blank direction is not outbound");
  assert.deepEqual(missing.coordinates, [], "missing geometry must not become a straight line between stops");
  assert(!route.destinations.includes("Weekend"));
  assert(network.stops.every((stop) => stop.routeIds.join() === "30"));
});

test("missing optional shapes still provides routes, destinations and stops", () => {
  const route = parseNetwork(fixture(false), "bus", "20260904").routes[0];
  assert.equal(route.patterns.length, 3);
  assert(route.patterns.every((pattern) => pattern.coordinates.length === 0 && pattern.stops.length === 2));
});

test("a date with no published service does not fabricate routes", () => {
  assert.deepEqual(parseNetwork(fixture(), "bus", "20260906").routes, []);
});
