import type { Feature, FeatureCollection, Point } from "geojson";

export type BuildingCategory =
  | "academic"
  | "library"
  | "gym"
  | "student-life"
  | "residence";

export type BuildingProperties = {
  id: string;
  name: string;
  abbreviation: string;
  category: BuildingCategory;
  description: string;
  parentId?: string;
  liveHours?: string | null;
  timeRemaining?: string | null;
};

export type BuildingFeature = Feature<Point, BuildingProperties>;
export type BuildingsGeoJSON = FeatureCollection<Point, BuildingProperties>;

export const buildings: BuildingsGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "dc-building",
        name: "Davis Centre",
        abbreviation: "DC",
        category: "academic",
        description: "Academic building with classrooms, offices, computer labs, and connected library space.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.54226750234126, 43.472934061382944],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "dc-library",
        name: "Davis Centre Library",
        abbreviation: "DC Library",
        category: "library",
        description: "Library and study space inside the Davis Centre.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.54185, 43.47225],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "mc",
        name: "Mathematics and Computer Building",
        abbreviation: "MC",
        category: "academic",
        description: "Math and computer science building.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5439, 43.4721],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "m3",
        name: "Mathematics 3",
        abbreviation: "M3",
        category: "academic",
        description: "Mathematics faculty building.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.544101, 43.473237],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "e2",
        name: "Engineering 2",
        abbreviation: "E2",
        category: "academic",
        description: "Engineering classrooms and faculty offices.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.540371, 43.470992],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "e3",
        name: "Engineering 3",
        abbreviation: "E3",
        category: "academic",
        description: "Engineering classrooms, labs, and faculty offices.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5408536, 43.471676],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "e5",
        name: "Engineering 5",
        abbreviation: "E5",
        category: "academic",
        description: "Engineering classrooms, design spaces, and faculty offices.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.540224, 43.472999],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "e6",
        name: "Engineering 6",
        abbreviation: "E6",
        category: "academic",
        description: "Engineering teaching, research, and collaboration spaces.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.538511, 43.473278],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "e7",
        name: "Engineering 7",
        abbreviation: "E7",
        category: "academic",
        description: "Engineering building with study spaces.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.539556, 43.473158],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "cph",
        name: "Carl A. Pollock Hall",
        abbreviation: "CPH",
        category: "academic",
        description: "School of Accounting and Finance building.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.539069, 43.470773],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "c2",
        name: "Chemistry 2",
        abbreviation: "C2",
        category: "academic",
        description: "Chemistry teaching and research building.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.542913, 43.471933],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "b1",
        name: "Biology 1",
        abbreviation: "B1",
        category: "academic",
        description: "Biology teaching labs, classrooms, and offices.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.543102, 43.470884],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "b2",
        name: "Biology 2",
        abbreviation: "B2",
        category: "academic",
        description: "Biology teaching labs, research facilities, and faculty offices.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.543838, 43.470848],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "pas",
        name: "Psychology, Anthropology, Sociology",
        abbreviation: "PAS",
        category: "academic",
        description: "Home to Psychology, Anthropology, and Sociology departments.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.542248, 43.467140],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "phy",
        name: "Physics",
        abbreviation: "PHY",
        category: "academic",
        description: "Physics teaching, research labs, and faculty offices.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.541343, 43.470631],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "eit",
        name: "Engineering Information Technology",
        abbreviation: "EIT",
        category: "academic",
        description: "Engineering administrative offices and teaching spaces.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.542172, 43.471854],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "hh",
        name: "Hagey Hall",
        abbreviation: "HH",
        category: "academic",
        description: "Arts faculty building and classrooms.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.541480, 43.467927],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "ev1",
        name: "Environment 1",
        abbreviation: "EV1",
        category: "academic",
        description: "Environment faculty building with classrooms and offices.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.542538, 43.468402],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "ev2",
        name: "Environment 2",
        abbreviation: "EV2",
        category: "academic",
        description: "Environment faculty building with labs and offices.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.54333256, 43.46793654178],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "ev3",
        name: "Environment 3",
        abbreviation: "EV3",
        category: "academic",
        description: "Environment faculty building.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.543586, 43.468249],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "exp",
        name: "Health Expansion Building",
        abbreviation: "EXP",
        category: "academic",
        description: "Health expansion building.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.546250, 43.473612],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "rch",
        name: "J.R. Coutts Engineering Lecture Hall",
        abbreviation: "RCH",
        category: "academic",
        description: "Engineering lecture hall building.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.540788, 43.470316],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "dwe",
        name: "Douglas Wright Engineering Building",
        abbreviation: "DWE",
        category: "academic",
        description: "Engineering classrooms, labs, and faculty offices.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.539605, 43.470131],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "qnc",
        name: "Quantum-Nano Centre",
        abbreviation: "QNC",
        category: "academic",
        description: "Home to the Institute for Quantum Computing and nanotechnology research.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.544381, 43.471098],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "nh",
        name: "Needles Hall",
        abbreviation: "NH",
        category: "student-life",
        description: "Administrative building with student services and offices.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.543604, 43.469665],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "tc",
        name: "Tatham Centre",
        abbreviation: "TC",
        category: "student-life",
        description: "Co-operative education, career services, and student support.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.541224, 43.469148],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "stc",
        name: "Science Teaching Complex",
        abbreviation: "STC",
        category: "academic",
        description: "Science classrooms, labs, and teaching spaces.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.543495, 43.470633],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "al",
        name: "Arts Lecture Hall",
        abbreviation: "AL",
        category: "academic",
        description: "Large lecture halls for arts and general courses.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.541833, 43.468934],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "ml",
        name: "Modern Languages",
        abbreviation: "ML",
        category: "academic",
        description: "Languages, culture, and humanities building.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.542949, 43.468954],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "slc",
        name: "Student Life Centre",
        abbreviation: "SLC",
        category: "student-life",
        description: "Student hub with food services, study spaces, events, and services.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.545419, 43.471891],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "sch",
        name: "South Campus Hall",
        abbreviation: "SCH",
        category: "student-life",
        description: "Student services building including registrar, co-op, and advising.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.540312, 43.469257],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "dp",
        name: "Dana Porter Library",
        abbreviation: "DP",
        category: "library",
        description: "Main humanities and social sciences library with study spaces.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.542262, 43.469700],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "pac",
        name: "Physical Activities Complex",
        abbreviation: "PAC",
        category: "gym",
        description: "Main campus gym with fitness centre, courts, and pool.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.545961, 43.472192],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "cif",
        name: "Columbia Icefield",
        abbreviation: "CIF",
        category: "gym",
        description: "Athletics complex with gym, arenas, and fitness facilities.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.547812, 43.475300],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "cmh",
        name: "Claudette Millar Hall",
        abbreviation: "CMH",
        category: "residence",
        description: "Student residence.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5359, 43.47026],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "rev",
        name: "Ron Eydt Village",
        abbreviation: "REV",
        category: "residence",
        description: "Student residence.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5535, 43.4705],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "v1",
        name: "Village 1",
        abbreviation: "V1",
        category: "residence",
        description: "First-year student residence.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.550028, 43.471639],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "uwp",
        name: "UW Place",
        abbreviation: "UWP",
        category: "residence",
        description: "Suite-style student residence.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.535889, 43.471056],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "eby-hall",
        name: "Eby Hall",
        abbreviation: "EH",
        category: "residence",
        parentId: "uwp",
        description: "Residence building within University of Waterloo Place.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.53571620419638, 43.47083169493707],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "bh",
        name: "Beck Hall",
        abbreviation: "BH",
        category: "residence",
        parentId: "uwp",
        description:
          "Residence building within University of Waterloo Place.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.53463596001428, 43.4708368087237],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "wan",
        name: "Waterloo Court North",
        abbreviation: "WAN",
        category: "residence",
        parentId: "uwp",
        description:
          "Residence building within University of Waterloo Place.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.53521006141801, 43.470220523351415],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "was",
        name: "Waterloo Court South",
        abbreviation: "WAS",
        category: "residence",
        parentId: "uwp",
        description:
          "Residence building within University of Waterloo Place.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.53432164365351, 43.469997637779635],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "win",
        name: "Wilmot Court North",
        abbreviation: "WIN",
        category: "residence",
        parentId: "uwp",
        description:
          "Residence building within University of Waterloo Place.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5369773, 43.47132899581],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "wis",
        name: "Wilmot Court South",
        abbreviation: "WIS",
        category: "residence",
        parentId: "uwp",
        description:
          "Residence building within University of Waterloo Place.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.536215599, 43.471052588022],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "wen",
        name: "Wellesley Court North",
        abbreviation: "WEN",
        category: "residence",
        parentId: "uwp",
        description:
          "Residence building within University of Waterloo Place.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5361995, 43.4716482257],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "wes",
        name: "Wellesley Court South",
        abbreviation: "WES",
        category: "residence",
        parentId: "uwp",
        description:
          "Residence building within University of Waterloo Place.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.53542166, 43.471227776],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "won",
        name: "Woolwich Court North",
        abbreviation: "WON",
        category: "residence",
        parentId: "uwp",
        description:
          "Residence building within University of Waterloo Place.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5332939, 43.4710261405],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "wos",
        name: "Woolwich Court South",
        abbreviation: "WOS",
        category: "residence",
        parentId: "uwp",
        description:
          "Residence building within University of Waterloo Place.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5336909, 43.470356527],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "mkv",
        name: "Mackenzie King Village",
        abbreviation: "MKV",
        category: "residence",
        description: "Suite-style student residence.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.552638, 43.471627],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "clv",
        name: "Columbia Lake Village",
        abbreviation: "CLV",
        category: "residence",
        description: "Upper-year student residence apartments.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.562757, 43.471563],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "sju",
        name: "St. Jerome's University",
        abbreviation: "SJU",
        category: "residence",
        description: "University college with residence, dining hall, and academic programs.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.546505, 43.469679],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "ryan-hall", name: "Ryan Hall", abbreviation: "RYN",
        category: "residence", parentId: "sju",
        description: "Residence building at St. Jerome's University.",
      },
      // Google Maps place coordinates verified September 6, 2026.
      geometry: {type: "Point", coordinates: [-80.547017, 43.4695939]},
    },
    {
      type: "Feature",
      properties: {
        id: "siegfried-hall", name: "Siegfried Hall", abbreviation: "SGF",
        category: "residence", parentId: "sju",
        description: "Residence building at St. Jerome's University.",
      },
      // Google Maps place coordinates verified September 6, 2026.
      geometry: {type: "Point", coordinates: [-80.5467374, 43.46941]},
    },
    {
      type: "Feature",
      properties: {
        id: "jr-finn-hall", name: "J.R. Finn Hall", abbreviation: "JRF",
        category: "residence", parentId: "sju",
        description: "Residence building at St. Jerome's University.",
      },
      // Google Maps place coordinates verified September 6, 2026.
      geometry: {type: "Point", coordinates: [-80.5452159, 43.4692433]},
    },
    {
      type: "Feature",
      properties: {
        id: "st-jeromes-library",
        name: "St. Jerome's University Library",
        abbreviation: "SJU Library",
        category: "library",
        parentId: "sju",
        description: "Library and study space located in St. Jerome's University.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.54586956, 43.468942418],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "renison",
        name: "Renison University College",
        abbreviation: "REN",
        category: "residence",
        description: "University college with residence, academic programs, and student services.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.547673, 43.469549],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "lusi-wong-library",
        name: "Lusi Wong Library",
        abbreviation: "LWL",
        category: "library",
        parentId: "renison",
        description: "Library and study space located in Renison University College.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5473295, 43.46918143],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "united",
        name: "United College",
        abbreviation: "UTD",
        category: "residence",
        description: "University college with residence, dining hall, and GreenHouse programs.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.546454, 43.467290],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "grebel",
        name: "Conrad Grebel University College",
        abbreviation: "CGR",
        category: "residence",
        description: "University college with residence and music programs.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.545029, 43.466235],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "milton-good-library",
        name: "Milton Good Library",
        abbreviation: "MGL",
        category: "library",
        parentId: "grebel",
        description: "Library located on the third floor of the academic building of Conrad Grebel University College.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5456403, 43.466708272],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "opt",
        name: "School of Optometry and Vision Science",
        abbreviation: "OPT",
        category: "academic",
        description:
          "Home to the School of Optometry and Vision Science and the Waterloo Eye Institute.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5456, 43.47557]
      },
    },
    {
      type: "Feature",
      properties: {
        id: "bmh",
        name: "B.C. Matthews Hall",
        abbreviation: "BMH",
        category: "academic",
        description:
          "Academic building for the Faculty of Health with classrooms, research spaces, and faculty offices.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.545333, 43.473689],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "lhi",
        name: "Lyle S. Hallman Institute for Health Promotion",
        abbreviation: "LHI",
        category: "academic",
        description:
          "Faculty of Health building with teaching, research, and office spaces.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.54602, 43.473282],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "erc",
        name: "Energy Research Centre",
        abbreviation: "ERC",
        category: "academic",
        description:
          "Research facility supporting energy-related research and innovation.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5444, 43.473668],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "csb",
        name: "Central Services Building",
        abbreviation: "CSB",
        category: "student-life",
        description:
          "Campus services and operations building.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.543666, 43.473856],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "gsc",
        name: "General Services Complex",
        abbreviation: "GSC",
        category: "student-life",
        description:
          "Campus operations and facilities services complex.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.542807, 43.473596],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "ec1",
        name: "East Campus 1",
        abbreviation: "EC1",
        category: "academic",
        description:
          "East Campus building with university research, teaching, and office spaces.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5404009, 43.476338],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "ec2",
        name: "East Campus 2",
        abbreviation: "EC2",
        category: "academic",
        description:
          "East Campus building with university research and office spaces.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.541379, 43.474732],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "ec3",
        name: "East Campus 3",
        abbreviation: "EC3",
        category: "academic",
        description:
          "East Campus building with university research and office spaces.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5421005, 43.47588],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "ec4",
        name: "East Campus 4",
        abbreviation: "EC4",
        category: "academic",
        description:
          "East Campus building with university research and office spaces.",
      },
      geometry: {
        type: "Point",
        coordinates: [ -80.5397, 43.474963],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "ec5",
        name: "East Campus 5",
        abbreviation: "EC5",
        category: "academic",
        description:
          "East Campus building with university research and office spaces.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.540741, 43.475467],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "avr",
        name: "Autonomous Vehicle Research & Intelligence Laboratory",
        abbreviation: "AVR",
        category: "academic",
        description:
          "Research facility for autonomous vehicle and intelligent transportation technologies.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.539679, 43.47434],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "ech",
        name: "East Campus Hall",
        abbreviation: "ECH",
        category: "academic",
        description:
          "East Campus building with university teaching, research, and office spaces.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5387579, 43.4738566],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "gh",
        name: "Graduate House",
        abbreviation: "GH",
        category: "student-life",
        description:
          "Graduate student space for social activities, events, and community gathering.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.540887, 43.4698135],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "mhr",
        name: "Minota Hagey Residence",
        abbreviation: "MHR",
        category: "residence",
        description:
          "Student residence located on the University of Waterloo campus.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.542535, 43.465963],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "hs",
        name: "Health Services",
        abbreviation: "HS",
        category: "student-life",
        description:
          "Campus health services building providing medical and wellness services to students.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.5461599, 43.470707],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "fed",
        name: "Federation Hall",
        abbreviation: "FED",
        category: "student-life",
        description:
          "Campus event venue and gathering space used for student events, performances, and functions.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.548497, 43.473202],
      },
    },
    {
      type: "Feature",
      properties: {
        id: "cln",
        name: "Columbia Lake Village North",
        abbreviation: "CLN",
        category: "residence",
        description:
          "Student residence community located on the north side of Columbia Lake Village.",
      },
      geometry: {
        type: "Point",
        coordinates: [-80.56296, 43.472215],
      },
    },
  ],
};
