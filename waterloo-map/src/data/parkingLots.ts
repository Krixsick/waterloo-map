import type { ParkingLot } from "../types/parking";

export const PARKING_VERIFIED_ON = "2026-09-05";
export const PARKING_RATES_URL = "https://uwaterloo.ca/sustainable-transportation/lots-and-rates";
export const PARKING_FAQ_URL = "https://uwaterloo.ca/sustainable-transportation/questions-and-answers";
export const PARKING_MAP_URL = "https://uwaterloo.ca/map/";
// Coordinates are from the official campus map's ParkingView layer, not geocoded guesses.
// mapFeatureId records the corresponding ArcGIS OBJECTID. Rules override older map classifications.
export const PARKING_LOCATION_SOURCE = "https://services5.arcgis.com/z87D0RdgTttiUQbV/arcgis/rest/services/ParkingView/FeatureServer/0";
export const parkingLots: ParkingLot[] = [
  {
    "id": "A",
    "name": "Lot A",
    "coordinates": [
      -80.5371654,
      43.4696854
    ],
    "mapFeatureId": 82,
    "access": "closed",
    "rate": "Visitor parking unavailable",
    "hours": "Closed to visitors during construction",
    "notes": "Waterloo currently lists Lot A as unavailable during construction. Check the official page for reopening updates.",
    "payment": "Not applicable while closed"
  },
  {
    "id": "B",
    "name": "Lot B",
    "coordinates": [
      -80.5400165,
      43.4738489
    ],
    "mapFeatureId": 81,
    "access": "visitor",
    "rate": "$10 / day",
    "hours": "Marked visitor spaces at Engineering 6",
    "notes": "The daytime visitor rate applies only to marked visitor spaces at E6. The general lot opens to visitors after 4:30 p.m. on weekdays and on weekends. No parking 3–6 a.m.",
    "payment": "AMP Park app"
  },
  {
    "id": "C",
    "name": "Lot C",
    "coordinates": [
      -80.5384053,
      43.4671743
    ],
    "mapFeatureId": 83,
    "access": "visitor",
    "rate": "$10 / day",
    "hours": "Visitor parking; no parking 3–6 a.m.",
    "notes": "Use designated visitor spaces and follow posted signs.",
    "payment": "AMP Park app"
  },
  {
    "id": "D",
    "name": "Lot D",
    "coordinates": [
      -80.5435059,
      43.4699298
    ],
    "mapFeatureId": 15,
    "access": "evenings",
    "rate": "$4.29 / hour · $30 max",
    "hours": "Visitors: weekdays after 4:30 p.m. and weekends; no parking 3–6 a.m.",
    "notes": "An additional $8.28 is charged after 6 p.m. Check the entry display for the applicable total.",
    "payment": "Visa, MasterCard or debit at the gate"
  },
  {
    "id": "H",
    "name": "Lot H",
    "coordinates": [
      -80.5403382,
      43.4674839
    ],
    "mapFeatureId": 16,
    "access": "after-six",
    "rate": "$4.29 / hour · $20.01 max",
    "hours": "Visitor access after 6 p.m.; no parking 3–6 a.m.",
    "notes": "An additional $8.28 is charged after 6 p.m. Confirm access hours and the applicable total at the gate.",
    "payment": "Visa, MasterCard or debit at the gate"
  },
  {
    "id": "J",
    "name": "Lot J",
    "coordinates": [
      -80.5502233,
      43.4728638
    ],
    "mapFeatureId": 20,
    "access": "residence",
    "rate": "$10 / day",
    "hours": "24-hour parking for residence visitors",
    "notes": "For guests of residents. Purchase the residence visitor parking option in AMP.",
    "payment": "AMP Park app"
  },
  {
    "id": "K",
    "name": "Lot K",
    "coordinates": [
      -80.5518055,
      43.4723128
    ],
    "mapFeatureId": 4,
    "access": "permit",
    "rate": "Permit required",
    "hours": "Reserved faculty/staff parking",
    "notes": "This lot is not listed as general visitor parking. A permit for the correct lot is required.",
    "payment": "University parking permit"
  },
  {
    "id": "L",
    "name": "Lot L",
    "coordinates": [
      -80.5441665,
      43.4743059
    ],
    "mapFeatureId": 5,
    "access": "permit",
    "rate": "Permit required",
    "hours": "Reserved faculty/staff parking",
    "notes": "This lot is not listed as general visitor parking. A permit for the correct lot is required.",
    "payment": "University parking permit"
  },
  {
    "id": "M",
    "name": "Lot M",
    "coordinates": [
      -80.5468613,
      43.4732234
    ],
    "mapFeatureId": 14,
    "access": "visitor",
    "rate": "$11.45 / day",
    "hours": "Visitor parking; no parking 3–6 a.m.",
    "notes": "Use designated visitor spaces and follow posted signs.",
    "payment": "AMP Park app"
  },
  {
    "id": "N",
    "name": "Lot N",
    "coordinates": [
      -80.5443791,
      43.4748857
    ],
    "mapFeatureId": 84,
    "access": "visitor",
    "rate": "$10 / day",
    "hours": "Visitor parking; no parking 3–6 a.m.",
    "notes": "Use designated visitor spaces and follow posted signs.",
    "payment": "AMP Park app"
  },
  {
    "id": "O",
    "name": "Lot O",
    "coordinates": [
      -80.544247,
      43.4765638
    ],
    "mapFeatureId": 6,
    "access": "permit",
    "rate": "Permit required",
    "hours": "Reserved faculty/staff parking",
    "notes": "This lot is not listed as general visitor parking. A permit for the correct lot is required.",
    "payment": "University parking permit"
  },
  {
    "id": "Q",
    "name": "Lot Q",
    "coordinates": [
      -80.5406024,
      43.4744034
    ],
    "mapFeatureId": 80,
    "access": "visitor",
    "rate": "$10 / day",
    "hours": "Visitor parking; no parking 3–6 a.m.",
    "notes": "Use designated visitor spaces and follow posted signs.",
    "payment": "AMP Park app"
  },
  {
    "id": "R",
    "name": "Lot R",
    "coordinates": [
      -80.5470285,
      43.4739653
    ],
    "mapFeatureId": 8,
    "access": "evenings",
    "rate": "$4.29 / hour · $30 max",
    "hours": "Visitors: weekdays after 4:30 p.m. and weekends; no parking 3–6 a.m.",
    "notes": "Use designated visitor spaces and follow posted signs.",
    "payment": "Visa, MasterCard or debit at the gate"
  },
  {
    "id": "S",
    "name": "Lot S",
    "coordinates": [
      -80.5531898,
      43.4718147
    ],
    "mapFeatureId": 21,
    "access": "residence",
    "rate": "$10 / day",
    "hours": "24-hour parking for residence visitors",
    "notes": "For guests of residents. Purchase the residence visitor parking option in AMP.",
    "payment": "AMP Park app"
  },
  {
    "id": "T",
    "name": "Lot T",
    "coordinates": [
      -80.5422568,
      43.4651901
    ],
    "mapFeatureId": 10,
    "access": "residence",
    "rate": "$10 / day",
    "hours": "24-hour parking for residence visitors",
    "notes": "For guests of residents. Purchase the residence visitor parking option in AMP.",
    "payment": "AMP Park app"
  },
  {
    "id": "UWP",
    "name": "Lot UWP",
    "coordinates": [
      -80.5337304,
      43.4712696
    ],
    "mapFeatureId": 19,
    "access": "residence",
    "rate": "$10 / day",
    "hours": "24-hour parking for residence visitors",
    "notes": "For guests of residents. Purchase the residence visitor parking option in AMP.",
    "payment": "AMP Park app"
  },
  {
    "id": "V",
    "name": "Lot V",
    "coordinates": [
      -80.5545497,
      43.4713358
    ],
    "mapFeatureId": 22,
    "access": "residence",
    "rate": "$10 / day",
    "hours": "24-hour parking for residence visitors",
    "notes": "For guests of residents. Purchase the residence visitor parking option in AMP.",
    "payment": "AMP Park app"
  },
  {
    "id": "W",
    "name": "Lot W",
    "coordinates": [
      -80.5474108,
      43.474871
    ],
    "mapFeatureId": 85,
    "access": "visitor",
    "rate": "$10 / day",
    "hours": "Visitor parking; no parking 3–6 a.m.",
    "notes": "Use designated visitor spaces and follow posted signs.",
    "payment": "AMP Park app"
  },
  {
    "id": "X",
    "name": "Lot X",
    "coordinates": [
      -80.5456546,
      43.4772911
    ],
    "mapFeatureId": 86,
    "access": "visitor",
    "rate": "$10 / day",
    "hours": "Free Friday 4:30 p.m. to Monday 6 a.m.",
    "notes": "Outside the free weekend window, visitor parking is $10/day and parking is not permitted from 3–6 a.m.",
    "payment": "AMP Park app",
    "freeWeekends": true
  },
  {
    "id": "CLV",
    "name": "Lot CLV",
    "coordinates": [
      -80.5631209,
      43.4705946
    ],
    "mapFeatureId": 18,
    "access": "residence",
    "rate": "$10 / day",
    "hours": "24-hour parking for residence visitors",
    "notes": "For guests of residents. Purchase the residence visitor parking option in AMP.",
    "payment": "AMP Park app"
  },
  {
    "id": "OV",
    "name": "Optometry visitor lot (OV)",
    "coordinates": [
      -80.5439136,
      43.4761109
    ],
    "mapFeatureId": 17,
    "access": "visitor",
    "rate": "$10 / day",
    "hours": "Visitor parking; no parking 3–6 a.m.",
    "notes": "Use designated visitor spaces and follow posted signs.",
    "payment": "AMP Park app"
  }
];
