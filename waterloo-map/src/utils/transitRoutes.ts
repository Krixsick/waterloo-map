import type { TransitMode } from "../types/transit";

// App colours stay stable across refreshes; route numbers always accompany them.
const routeColors: Record<string, string> = {
  "7": "#b91c1c", "8": "#0f766e", "9": "#7e22ce", "11": "#c2410c",
  "12": "#1d4ed8", "13": "#a16207", "19": "#be185d", "29": "#0e7490",
  "30": "#15803d", "31": "#6d28d9", "201": "#92400e", "202": "#0369a1",
};
const palette = ["#1d4ed8", "#0f766e", "#7e22ce", "#c2410c", "#be185d", "#047857", "#a16207"];

export function transitRouteColor(mode: TransitMode, routeId: string | null) {
  if (mode === "ion") return "#be185d";
  if (!routeId) return "#475569";
  if (routeColors[routeId]) return routeColors[routeId];
  const hash = [...routeId].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0);
  return palette[hash % palette.length];
}
