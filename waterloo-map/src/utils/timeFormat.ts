// Shared display format for clock times and opening-hour ranges.
export function formatDisplayTime(value: string): string {
  return value
    .replace(/\bclosed\b/gi, "Closed")
    .replace(/\b(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?(?!\w)/gi,
      (original, hour: string, minute: string | undefined, period: string) => {
        if (Number(hour) < 1 || Number(hour) > 12 || Number(minute ?? 0) > 59) return original;
        return `${Number(hour)}:${minute ?? "00"}${period.toUpperCase()}M`;
      })
    .replace(/\b([01]?\d|2[0-3]):([0-5]\d)(?!\d|[AP]M)/g,
      (_, hour: string, minute: string) => `${Number(hour) % 12 || 12}:${minute}${Number(hour) >= 12 ? "PM" : "AM"}`)
    .replace(/(\d:\d{2}[AP]M)\s*(?:[-–—]|to)\s*(?=\d{1,2}:\d{2}[AP]M)/gi, "$1 - ");
}

export function formatClockTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatDisplayTime(new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date));
}
