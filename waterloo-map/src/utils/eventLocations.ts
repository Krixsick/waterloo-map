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
  ren: ["renison"],
  cguc: ["conrad grebel"],
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

function matchBuilding(
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

function spreadEventsAtSharedVenues(events: MappedWaterlooEvent[]) {
  const venueGroups = new Map<string, MappedWaterlooEvent[]>();

  events.forEach((event) => {
    const { latitude, longitude } = event.coordinates;
    const key = `${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
    const group = venueGroups.get(key) ?? [];
    group.push(event);
    venueGroups.set(key, group);
  });

  return [...venueGroups.values()].flatMap((group) => {
    if (group.length === 1) return group;

    return [...group]
      .sort((left, right) => left.id - right.id)
      .map((event, index) => {
        const ring = Math.floor(index / 8);
        const position = index % 8;
        const itemsOnRing = Math.min(8, group.length - ring * 8);
        const angle = (position / itemsOnRing) * Math.PI * 2 - Math.PI / 2;
        const radiusMeters = 18 + ring * 12;
        const latitudeOffset = (Math.sin(angle) * radiusMeters) / 111_320;
        const longitudeOffset =
          (Math.cos(angle) * radiusMeters) /
          (111_320 * Math.cos((event.coordinates.latitude * Math.PI) / 180));

        return {
          ...event,
          coordinates: {
            latitude: event.coordinates.latitude + latitudeOffset,
            longitude: event.coordinates.longitude + longitudeOffset,
          },
        };
      });
  });
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
      return [event as MappedWaterlooEvent];
    }

    const building = matchBuilding(event, buildings);
    if (!building) return [];
    const [longitude, latitude] = building.geometry.coordinates;

    return [
      {
        ...event,
        coordinates: { latitude, longitude },
      },
    ];
  });

  return spreadEventsAtSharedVenues(mappedEvents);
}
