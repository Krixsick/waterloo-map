import type { BuildingCategory } from "../data/buildings";
import type { TransitMode, TransitRoute } from "../types/transit";
import type { ParkingStatus } from "../types/parking";
import { parkingColors } from "./parkingStatus.ts";
import { transitRouteColor } from "./transitRoutes.ts";

export type LegendSymbol = "circle" | "station" | "square" | "vehicle" | "line" | "walk" | "parking" | "event" | "cluster" | "food" | "coffee" | "dessert" | "shop" | "endpoint";
export type LegendEntry = { id: string; label: string; symbol: LegendSymbol; color: string; border?: string; text?: string };
export type LegendOptions = {
  categories: BuildingCategory[];
  transit?: { modes: TransitMode[]; route: TransitRoute | null };
  eventCount?: number;
  food?: { group: string; category: string; open: boolean }[];
  parking?: ParkingStatus[];
  journey?: LegendEntry[];
};
const places: Record<BuildingCategory, Omit<LegendEntry, "id">> = {
  academic: { label: "Academic buildings", symbol: "circle", color: "#0284c7", border: "#7dd3fc" },
  library: { label: "Libraries", symbol: "circle", color: "#d97706", border: "#fcd34d" },
  gym: { label: "Gyms", symbol: "circle", color: "#4f46e5", border: "#a5b4fc" },
  "student-life": { label: "Student life", symbol: "circle", color: "#0d9488", border: "#5eead4" },
  residence: { label: "Residences", symbol: "square", color: "#22c55e", border: "#86efac" },
};
const parkingLabels: Record<ParkingStatus, string> = { free: "Free parking now", paid: "Paid parking", restricted: "Restricted parking", closed: "Closed parking" };

export function getMapLegend(options: LegendOptions): LegendEntry[] {
  const rows: LegendEntry[] = options.categories.map(category => ({ id: category, ...places[category] }));
  if (options.transit) {
    const { route, modes } = options.transit;
    const color = route ? transitRouteColor(route.mode, route.routeId) : "#64748b";
    modes.filter(mode => !route || route.mode === mode).forEach(mode => {
      rows.push({ id: `stop-${mode}`, label: mode === "ion" ? "ION stations" : "Bus stops", symbol: mode === "ion" ? "station" : "circle", color, border: "#ffffff" });
      rows.push({ id: `vehicle-${mode}`, label: mode === "ion" ? "ION · route number" : "Bus · route number", symbol: "vehicle", color: route ? color : transitRouteColor(mode, mode === "ion" ? "301" : "11"), text: route?.routeId ?? (mode === "ion" ? "301" : "11") });
    });
    if (route) rows.push({ id: "selected-route", label: `Route ${route.routeId} path`, symbol: "line", color });
  }
  if (options.eventCount) {
    rows.push({ id: "event", label: "Campus event", symbol: "event", color: "#7c3aed" });
    if (options.eventCount > 1) rows.push({ id: "event-cluster", label: "Number of events", symbol: "cluster", color: "#7c3aed", text: "2" });
  }
  const foodGroups = new Map<string, NonNullable<LegendOptions["food"]>>();
  options.food?.forEach(food => foodGroups.set(food.group, [...(foodGroups.get(food.group) ?? []), food]));
  const foodRows = new Map<string, LegendEntry>();
  foodGroups.forEach(vendors => {
    const category = vendors.length === 1 ? vendors[0].category : "restaurant";
    const open = vendors.some(vendor => vendor.open);
    const symbol = category === "cafe" ? "coffee" : category === "dessert" ? "dessert" : category === "convenience" ? "shop" : "food";
    const label = symbol === "coffee" ? "Cafes" : symbol === "dessert" ? "Desserts" : symbol === "shop" ? "Convenience" : "Food spots";
    const id = `${symbol}-${open}`;
    foodRows.set(id, { id, label: `${label} · ${open ? "open" : "closed / unconfirmed"}`, symbol, color: open ? "#047857" : "#ffffff", border: open ? "#047857" : "#94a3b8" });
  });
  rows.push(...foodRows.values());
  (["free", "paid", "restricted", "closed"] as const).forEach(status => {
    if (options.parking?.includes(status)) rows.push({ id: `parking-${status}`, label: parkingLabels[status], symbol: "parking", color: parkingColors[status], text: "P" });
  });
  rows.push(...(options.journey ?? []));
  return rows;
}
