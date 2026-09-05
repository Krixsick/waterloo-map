import type { WaterlooEvent } from "../types/events";
export type EventDateFilter = "today" | "tomorrow" | "week";
export const eventDay = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
export function upcomingEvents(events: WaterlooEvent[], now: Date) {
  return events.filter(event => {
    const end = event.endsAtUTC ?? event.startsAtUTC;
    return !end || new Date(end).getTime() >= now.getTime();
  }).sort((a,b) => (a.startsAtUTC ? Date.parse(a.startsAtUTC) : Infinity) - (b.startsAtUTC ? Date.parse(b.startsAtUTC) : Infinity));
}
export function filterEvents(events: WaterlooEvent[], filter: EventDateFilter, now: Date) {
  const today = eventDay(now);
  const calendar = new Date(`${today}T12:00:00Z`);
  const start = new Date(calendar);
  if (filter === "tomorrow") start.setUTCDate(start.getUTCDate() + 1);
  const end = new Date(start);
  if (filter === "week") end.setUTCDate(end.getUTCDate() + (7 - (end.getUTCDay() || 7)));
  const first = start.toISOString().slice(0,10), last = end.toISOString().slice(0,10);
  return upcomingEvents(events, now).filter(event => {
    if (!event.startsAtUTC) return false;
    const from = eventDay(new Date(event.startsAtUTC));
    const to = eventDay(new Date(event.endsAtUTC ?? event.startsAtUTC));
    return from <= last && to >= first;
  });
}
