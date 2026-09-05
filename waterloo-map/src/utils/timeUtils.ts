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

export function getTimeRemaining(hours: string | null, now = new Date()): string | null {
  if (!hours) return null;
  const nowMinutes = getTorontoMinutesNow(now);
  const currentRange = parseFoodTimeRanges(hours).find(
    ({ startMinutes, endMinutes }) => nowMinutes >= startMinutes && nowMinutes < endMinutes,
  );
  if (!currentRange) return null;
  return `${formatDuration(currentRange.endMinutes - nowMinutes)} left`;
}

export type FoodOpenStatus = {
  isOpen: boolean;
  status: "Open" | "Closed";
  timeMessage: string | null;
};

type ParsedTimeRange = {
  label: string | undefined;
  startMinutes: number;
  endMinutes: number;
};

function parseTimeToMinutes(
  value: string,
): number | null {
  const match = value
    .trim()
    .match(
      /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i,
    );

  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(
    match[2] ?? "0",
  );
  const period =
    match[3].toUpperCase();

  if (
    period === "PM" &&
    hour !== 12
  ) {
    hour += 12;
  }

  if (
    period === "AM" &&
    hour === 12
  ) {
    hour = 0;
  }

  return hour * 60 + minute;
}

function formatDuration(
  minutes: number,
) {
  const hours =
    Math.floor(minutes / 60);

  const remainingMinutes =
    minutes % 60;

  if (
    hours > 0 &&
    remainingMinutes > 0
  ) {
    return `${hours}h ${remainingMinutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${remainingMinutes}m`;
}

function parseFoodTimeRanges(
  hours: string,
): ParsedTimeRange[] {
  if (
    hours.trim().toLowerCase() ===
    "closed"
  ) {
    return [];
  }

  return hours
    .split(" · ")
    .map((part) => {
      const match = part
        .trim()
        .match(
          /^(.*?)(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))$/i,
        );

      if (!match) {
        return null;
      }

      const label =
        match[1].trim() || undefined;

      const startMinutes =
        parseTimeToMinutes(
          match[2],
        );

      const endMinutes =
        parseTimeToMinutes(
          match[3],
        );

      if (
        startMinutes === null ||
        endMinutes === null
      ) {
        return null;
      }

      return {
        label,
        startMinutes,
        endMinutes,
      };
    })
    .filter(
      (
        range,
      ): range is ParsedTimeRange =>
        range !== null,
    );
}

function getTorontoMinutesNow(now = new Date()) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Toronto",
        hour: "numeric",
        minute: "numeric",
        hourCycle: "h23",
      },
    );

  const parts =
    formatter.formatToParts(
      now,
    );

  const hour = Number(
    parts.find(
      (part) =>
        part.type === "hour",
    )?.value,
  );

  const minute = Number(
    parts.find(
      (part) =>
        part.type === "minute",
    )?.value,
  );

  return hour * 60 + minute;
}

function formatMinutesAsTime(
  totalMinutes: number,
) {
  const hour24 =
    Math.floor(
      totalMinutes / 60,
    );

  const minute =
    totalMinutes % 60;

  const period =
    hour24 >= 12
      ? "PM"
      : "AM";

  const hour12 =
    hour24 % 12 || 12;

  return `${hour12}:${minute
    .toString()
    .padStart(2, "0")} ${period}`;
}

export function getFoodOpenStatus(
  hours: string | null,
): FoodOpenStatus {
  if (!hours) {
    return {
      isOpen: false,
      status: "Closed",
      timeMessage: null,
    };
  }

  if (
    hours.trim().toLowerCase() ===
    "closed"
  ) {
    return {
      isOpen: false,
      status: "Closed",
      timeMessage: null,
    };
  }

  if (/^(?:open )?24(?: hours|\/7)$/i.test(hours.trim())) {
    return { isOpen: true, status: "Open", timeMessage: null };
  }
  const opening = hours.match(/^Opening at (.+)$/i);
  const closing = hours.match(/^Closing at (.+)$/i);
  if (opening || closing) {
    const boundary = parseTimeToMinutes((opening ?? closing)![1]);
    if (boundary !== null) {
      const isOpen = opening ? getTorontoMinutesNow() >= boundary : getTorontoMinutesNow() < boundary;
      return { isOpen, status: isOpen ? "Open" : "Closed", timeMessage: opening && !isOpen ? `Opens at ${formatMinutesAsTime(boundary)}` : closing && isOpen ? `${formatDuration(boundary - getTorontoMinutesNow())} left` : null };
    }
  }
  const ranges =
    parseFoodTimeRanges(hours);

  if (!ranges.length) {
    return {
      isOpen: false,
      status: "Closed",
      timeMessage: null,
    };
  }

  const nowMinutes =
    getTorontoMinutesNow();

  const currentRange =
    ranges.find(
      ({ startMinutes, endMinutes }) =>
        nowMinutes >=
          startMinutes &&
        nowMinutes <
          endMinutes,
    );

  if (currentRange) {
    const remaining =
      currentRange.endMinutes -
      nowMinutes;

    return {
      isOpen: true,
      status: "Open",
      timeMessage:
        currentRange.label
          ? `${formatDuration(
              remaining,
            )} left in ${currentRange.label.toLowerCase()}`
          : `${formatDuration(
              remaining,
            )} left`,
    };
  }

  const nextRange =
    ranges.find(
      ({ startMinutes }) =>
        startMinutes >
        nowMinutes,
    );

  if (nextRange) {
    const untilOpen =
      nextRange.startMinutes -
      nowMinutes;

    return {
      isOpen: false,
      status: "Closed",
      timeMessage:
        nextRange.label
          ? `${nextRange.label} opens in ${formatDuration(
              untilOpen,
            )}`
          : `Opens at ${formatMinutesAsTime(
              nextRange.startMinutes,
            )}`,
    };
  }

  return {
    isOpen: false,
    status: "Closed",
    timeMessage: null,
  };
}