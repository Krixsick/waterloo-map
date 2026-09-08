const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseTime(value: string) {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  if (hour < 1 || hour > 12 || minute > 59) return null;
  return (hour % 12) * 60 + minute + (match[3].toUpperCase() === "PM" ? 720 : 0);
}

function parseRange(hours: string | undefined) {
  const times = hours?.split(/\s*[–—-]\s*/);
  if (times?.length !== 2) return null;
  const start = parseTime(times[0]);
  const end = parseTime(times[1]);
  if (start === null || end === null || start === end) return null;
  return { start, end };
}

function openStatus(liveHours: string, remaining: number) {
  const hours = Math.floor(remaining / 60);
  const minutes = remaining % 60;
  const duration = hours ? `${hours}h${minutes ? ` ${minutes}m` : ""}` : `${minutes}m`;
  return { liveHours, isOpen: true, timeRemaining: `${duration} left` };
}

/** Hours belong to the day the gym opens, even when it closes after midnight. */
export function getGymHoursStatus(hours: Record<string, string>, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const day = parts.find(part => part.type === "weekday")!.value;
  const minutes = Number(parts.find(part => part.type === "hour")!.value) * 60
    + Number(parts.find(part => part.type === "minute")!.value);

  // Just after midnight, use yesterday's closing time, not tonight's schedule.
  const previousHours = hours[DAYS[(DAYS.indexOf(day) + 6) % 7]];
  const previousRange = parseRange(previousHours);
  if (previousRange && previousRange.end < previousRange.start && minutes < previousRange.end) {
    return openStatus(previousHours, previousRange.end - minutes);
  }

  const liveHours = hours[day];
  if (!liveHours) return null;
  if (liveHours.trim().toLowerCase() === "closed") {
    return { liveHours: "Closed", isOpen: false, timeRemaining: null };
  }

  const range = parseRange(liveHours);
  if (!range) return { liveHours, isOpen: null, timeRemaining: null };

  const close = range.end < range.start ? range.end + 1440 : range.end;
  if (minutes >= range.start && minutes < close) {
    return openStatus(liveHours, close - minutes);
  }
  return { liveHours, isOpen: false, timeRemaining: null };
}
