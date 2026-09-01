import type { TimeSlot } from "../types/library";

function normalizeDateLabel(value: string) {
  return value.replace(/,/g, "").replace(/\s+/g, " ").trim();
}

export function getTodaysLibraryHours(slots?: TimeSlot[]): string | null {
  if (!slots?.length) return null;

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    month: "short",
    day: "2-digit",
  }).format(new Date());

  return (
    slots.find(
      ({ date }) => normalizeDateLabel(date) === normalizeDateLabel(today),
    )?.time ?? null
  );
}

export function getTimeRemaining(hours: string | null): string | null {
  if (!hours) return null;

  // Example input: "12pm – 11pm"
  const parts = hours.split("–");

  if (parts.length !== 2) return null;

  const closingString = parts[1].trim();
  const match = closingString.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);

  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  const period = match[3].toLowerCase();

  if (period === "pm" && hour !== 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;

  const now = new Date();
  const closingTime = new Date(now);
  closingTime.setHours(hour, minute, 0, 0);

  if (closingTime <= now) return null;

  const diffMs = closingTime.getTime() - now.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  const hoursLeft = Math.floor(totalMinutes / 60);
  const minutesLeft = totalMinutes % 60;

  if (hoursLeft > 0 && minutesLeft > 0) {
    return `${hoursLeft}h ${minutesLeft}m left`;
  }

  if (hoursLeft > 0) return `${hoursLeft}h left`;

  return `${minutesLeft}m left`;
}
