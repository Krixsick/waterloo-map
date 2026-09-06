import type { FoodLocation } from "./types";

// Address-level coordinates geocoded with ArcGIS; shared addresses share a marker.
// Vendor/payment information checked September 6, 2026.
export const offCampusFood: Record<string, FoodLocation> = {
  "chef-on-call": {
    "id": "chef-on-call",
    "name": "Chef on Call",
    "location": "130 Columbia Street West, Unit 812, Waterloo",
    "category": "restaurant",
    "coordinates": [
      -80.537471985695,
      43.478583005945
    ],
    "description": "Comfort food with delivery.",
    "url": "https://www.chefoncalldelivery.com",
    "paymentNote": "Other payment options: check with vendor.",
    "payment": [
      "WATCard Flex dollars"
    ],
    "source": {
      "name": "University of Waterloo WATCard off-campus vendors",
      "url": "https://uwaterloo.ca/watcard/use-my-watcard/off-campus-vendors"
    },
    "hours": {
      "Monday": "12:00PM - 2:00AM",
      "Tuesday": "12:00PM - 2:00AM",
      "Wednesday": "12:00PM - 2:00AM",
      "Thursday": "12:00PM - 2:00AM",
      "Friday": "12:00PM - 4:00AM",
      "Saturday": "12:00PM - 4:00AM",
      "Sunday": "12:00PM - 2:00AM"
    },
    "hoursSource": {
      "url": "https://chefoncalldelivery.com/locations/",
      "name": "Vendor website",
      "checkedAt": "2026-09-06"
    }
  },
  "campus-pizza": {
    "id": "campus-pizza",
    "name": "Campus Pizza",
    "location": "160 University Avenue West, Waterloo",
    "category": "restaurant",
    "coordinates": [
      -80.538052013394,
      43.472285011538
    ],
    "description": "Pizza for takeout or delivery.",
    "url": "https://www.campuspizza.ca",
    "paymentNote": "Other payment options: check with vendor.",
    "payment": [
      "WATCard Flex dollars",
      "Cash"
    ],
    "source": {
      "name": "University of Waterloo WATCard off-campus vendors",
      "url": "https://uwaterloo.ca/watcard/use-my-watcard/off-campus-vendors"
    }
  },
  "farah-foods": {
    "id": "farah-foods",
    "name": "Farah Foods",
    "location": "170 University Avenue West, Waterloo",
    "category": "convenience",
    "coordinates": [
      -80.538868997497,
      43.472367992379
    ],
    "description": "Convenience store open 24/7.",
    "url": "https://www.farahfoods.ca",
    "paymentNote": "Online options shown; in-store may differ.",
    "payment": [
      "WATCard Flex dollars",
      "Visa (online)",
      "Mastercard (online)",
      "American Express (online)",
      "Apple Pay (online)",
      "Google Pay (online)"
    ],
    "source": {
      "name": "University of Waterloo WATCard off-campus vendors",
      "url": "https://uwaterloo.ca/watcard/use-my-watcard/off-campus-vendors"
    },
    "hours": {
      "Monday": "Open 24 hours",
      "Tuesday": "Open 24 hours",
      "Wednesday": "Open 24 hours",
      "Thursday": "Open 24 hours",
      "Friday": "Open 24 hours",
      "Saturday": "Open 24 hours",
      "Sunday": "Open 24 hours"
    },
    "hoursSource": {
      "url": "https://www.farahfoods.ca/pages/locations",
      "name": "Vendor website",
      "checkedAt": "2026-09-06"
    }
  },
  "score-pizza": {
    "id": "score-pizza",
    "name": "Score Pizza",
    "location": "80 King Street South, Waterloo",
    "category": "restaurant",
    "coordinates": [
      -80.521513009687,
      43.463508991275
    ],
    "description": "Pizza with dine-in, takeout and delivery.",
    "url": "https://scorepizza.ca",
    "paymentNote": "Other payment options: check with vendor.",
    "payment": [
      "WATCard Flex dollars"
    ],
    "source": {
      "name": "University of Waterloo WATCard off-campus vendors",
      "url": "https://uwaterloo.ca/watcard/use-my-watcard/off-campus-vendors"
    }
  },
  "ginos-pizza": {
    "id": "ginos-pizza",
    "name": "Gino’s Pizza",
    "location": "253 King Street North, Waterloo",
    "category": "restaurant",
    "coordinates": [
      -80.525488965458,
      43.476680020558
    ],
    "description": "Pizza for takeout or delivery.",
    "url": "https://ginospizza.ca",
    "paymentNote": "Other payment options: check with vendor.",
    "payment": [
      "WATCard Flex dollars"
    ],
    "source": {
      "name": "University of Waterloo WATCard off-campus vendors",
      "url": "https://uwaterloo.ca/watcard/use-my-watcard/off-campus-vendors"
    }
  },
  "williams-fresh-cafe": {
    "id": "williams-fresh-cafe",
    "name": "Williams Fresh Cafe",
    "location": "170 University Avenue West, Waterloo",
    "category": "cafe",
    "categories": [
      "cafe",
      "restaurant"
    ],
    "coordinates": [
      -80.538868997497,
      43.472367992379
    ],
    "description": "Cafe offering dine-in and takeout.",
    "url": "https://williamsfreshcafe.com",
    "paymentNote": "Other payment options: check with vendor.",
    "payment": [
      "WATCard Flex dollars"
    ],
    "source": {
      "name": "University of Waterloo WATCard off-campus vendors",
      "url": "https://uwaterloo.ca/watcard/use-my-watcard/off-campus-vendors"
    }
  },
  "sweet-lous-cookies": {
    "id": "sweet-lous-cookies",
    "name": "Sweet Lou’s Cookies",
    "location": "341 B Weber Street North, Waterloo",
    "category": "dessert",
    "coordinates": [
      -80.523646958416,
      43.481862006468
    ],
    "description": "Cookies for takeout and event catering.",
    "url": "https://sweetlouscookies.com",
    "paymentNote": "Other payment options: check with vendor.",
    "payment": [
      "WATCard Flex dollars"
    ],
    "source": {
      "name": "University of Waterloo WATCard off-campus vendors",
      "url": "https://uwaterloo.ca/watcard/use-my-watcard/off-campus-vendors"
    },
    "hours": {
      "Monday": "5:00PM - 1:00AM",
      "Tuesday": "5:00PM - 1:00AM",
      "Wednesday": "5:00PM - 1:00AM",
      "Thursday": "5:00PM - 1:00AM",
      "Friday": "12:00PM - 1:00AM",
      "Saturday": "12:00PM - 1:00AM",
      "Sunday": "12:00PM - 1:00AM"
    },
    "hoursSource": {
      "url": "https://sweetlouscookies.com/",
      "name": "Vendor website",
      "checkedAt": "2026-09-06"
    }
  },
  "izna-poke-plus": {
    "id": "izna-poke-plus",
    "name": "Izna Poke Plus",
    "location": "170 University Avenue West, Unit 6B, Waterloo",
    "category": "restaurant",
    "coordinates": [
      -80.538868997497,
      43.472367992379
    ],
    "description": "Poke with dine-in and takeout.",
    "url": "https://izna.ca",
    "paymentNote": "Other payment options: check with vendor.",
    "payment": [
      "WATCard Flex dollars"
    ],
    "source": {
      "name": "University of Waterloo WATCard off-campus vendors",
      "url": "https://uwaterloo.ca/watcard/use-my-watcard/off-campus-vendors"
    },
    "hours": {
      "Monday": "9:00AM - 10:00PM",
      "Tuesday": "9:00AM - 10:00PM",
      "Wednesday": "9:00AM - 10:00PM",
      "Thursday": "9:00AM - 10:00PM",
      "Friday": "9:00AM - 10:00PM",
      "Saturday": "9:00AM - 10:00PM",
      "Sunday": "9:00AM - 10:00PM"
    },
    "hoursSource": {
      "url": "https://izna.ca/",
      "name": "Vendor website",
      "checkedAt": "2026-09-06"
    }
  }
};
