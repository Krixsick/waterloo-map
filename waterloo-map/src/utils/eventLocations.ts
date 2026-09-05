import type { BuildingFeature, BuildingsGeoJSON } from "../data/buildings";
import type { MappedWaterlooEvent, WaterlooEvent } from "../types/events";

const BUILDING_ALIASES: Record<string, string[]> = {
  "dc-building": ["davis centre", "davis center"],
  "dc-library": ["davis library"],
  mc: ["math and computer", "mathematics and computer"],
  slc: ["great hall", "student life center", "the bomber", "bomber"],
  pac: ["physical activity complex"],
  cif: ["columbia ice fields"],
  qnc: ["quantum nano", "quantum-nano"],
  rch: ["coutts hall", "engineering lecture hall"],
  sju: ["st jeromes", "saint jeromes"],
  renison: ["renison"],
  grebel: ["conrad grebel"],
};

function normalizeLocation(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bcenter\b/g, "centre")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function includesPhrase(location: string, phrase: string) {
  return ` ${location} `.includes(` ${phrase} `);
}

export function matchBuilding(
  event: WaterlooEvent,
  buildings: BuildingsGeoJSON,
): BuildingFeature | null {
  const location = normalizeLocation(
    `${event.location} ${event.locationQuery}`,
  );
  if (!location) return null;

  const candidates = buildings.features
    .flatMap((building) => {
      const aliases = BUILDING_ALIASES[building.properties.id] ?? [];
      const phrases = [
        building.properties.name,
        building.properties.abbreviation,
        ...aliases,
      ];

      return phrases.map((phrase) => ({
        building,
        phrase: normalizeLocation(phrase),
      }));
    })
    .filter(({ phrase }) => phrase.length >= 2)
    .sort((left, right) => right.phrase.length - left.phrase.length);

  return (
    candidates.find(({ phrase }) => includesPhrase(location, phrase))
      ?.building ?? null
  );
}

function isValidCoordinate(value: number, minimum: number, maximum: number) {
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}

export function mapEventsToCampus(
  events: WaterlooEvent[],
  buildings: BuildingsGeoJSON,
) {
  const mappedEvents = events.flatMap<MappedWaterlooEvent>((event) => {
    if (
      event.coordinates &&
      isValidCoordinate(event.coordinates.latitude, -90, 90) &&
      isValidCoordinate(event.coordinates.longitude, -180, 180)
    ) {
      const building = matchBuilding(event, buildings);
      return [{ ...event, buildingId: building?.properties.id, coordinates: building ? { longitude: building.geometry.coordinates[0], latitude: building.geometry.coordinates[1] } : event.coordinates }];
    }

    const building = matchBuilding(event, buildings);
    if (!building) return [];
    const [longitude, latitude] = building.geometry.coordinates;

    return [
      {
        ...event,
        buildingId: building.properties.id,
        coordinates: { latitude, longitude },
      },
    ];
  });

  return mappedEvents;
}
