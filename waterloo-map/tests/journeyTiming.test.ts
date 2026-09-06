import assert from "node:assert/strict";
import test from "node:test";
import { journeyTiming, rankJourneys } from "../src/utils/journeyTiming";
const at = (time: string) => Date.parse(`2026-09-05T${time}:00-04:00`);
test("rejects a 4:55 bus when leaving at 4:44 requires a 16 minute access walk",()=>{
 assert.equal(journeyTiming(at('16:44'),at('16:55'),at('17:11'),16*60,0),null);
});
test("separates access and egress and includes boarding buffer",()=>{
 const result=journeyTiming(at('16:44'),at('16:55'),at('17:11'),8*60,8*60)!;
 assert.equal(result.accessMinutes,8);assert.equal(result.egressMinutes,8);assert.equal(result.waitMinutes,3);assert.equal(result.minutes,35);assert.equal(result.leaveBy,at('16:45'));
 assert.equal(journeyTiming(at('16:46'),at('16:55'),at('17:11'),8*60,0),null);
});
test("invalid times, reverse trips and negative walks are rejected",()=>{
 assert.equal(journeyTiming(0,NaN,100,1,1),null);
 assert.equal(journeyTiming(0,100,50,1,1),null);
 assert.equal(journeyTiming(0,1000000,2000000,-1,1),null);
});
test("absolute dates support trips across midnight",()=>{
 const result=journeyTiming(Date.parse('2026-09-05T23:45:00-04:00'),Date.parse('2026-09-05T23:58:00-04:00'),Date.parse('2026-09-06T00:15:00-04:00'),300,300)!;
 assert.equal(result.minutes,35);
});
test("worse alighting stops and later duplicate services are removed; less-walking alternatives survive",()=>{
 const base={mode:'bus',route:'202',tripId:'one',finalArrival:1000,walkSeconds:600,leaveBy:100};
 const worse={...base,finalArrival:2000,walkSeconds:900};
 const lessWalk={...base,finalArrival:1500,walkSeconds:300};
 const later={...base,tripId:'two',finalArrival:3000};
 assert.deepEqual(rankJourneys([worse,base,lessWalk,later],0),[base,lessWalk]);
 assert.deepEqual(rankJourneys([base],101),[]);
});
