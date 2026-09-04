import * as cheerio from "cheerio";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DAY_LOOKUP = new Map(
  DAYS.map((day) => [
    day.toLowerCase(),
    day,
  ]),
);

const MONTH_PATTERN =
  /^(Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)\b/i;

export function normalizeText(
  value: string,
) {
  return value
    .replace(/\s+/g, " ")
    .trim();
}

export function getCleanLines(
  text: string,
) {
  return text
    .split("\n")
    .map(normalizeText)
    .filter(Boolean);
}

export function findLocationContainer(
  $: cheerio.CheerioAPI,
  searchName: string,
) {
  const anchor = $("a")
    .filter((_, element) => {
      const text = normalizeText(
        $(element).text(),
      );

      return text
        .toLowerCase()
        .includes(
        searchName.toLowerCase(),
        );
    })
    .first();

  if (!anchor.length) {
    return null;
  }

  let container = anchor.parent();

  for (let i = 0; i < 8; i += 1) {
    const text = normalizeText(
      container.text(),
    );

    if (
      text.includes(
        "Hours of operation",
      )
    ) {
      return container;
    }

    container = container.parent();
  }

  return anchor.parent();
}

function expandDayRange(
  startDay: string,
  endDay: string,
) {
  const startIndex =
    DAYS.findIndex(
      (day) =>
        day.toLowerCase() ===
        startDay.toLowerCase(),
    );

  const endIndex =
    DAYS.findIndex(
      (day) =>
        day.toLowerCase() ===
        endDay.toLowerCase(),
    );

  if (
    startIndex === -1 ||
    endIndex === -1
  ) {
    return [];
  }

  if (startIndex <= endIndex) {
    return DAYS.slice(
      startIndex,
      endIndex + 1,
    );
  }

  return [
    ...DAYS.slice(startIndex),
    ...DAYS.slice(
      0,
      endIndex + 1,
    ),
  ];
}

function parseDayLabel(
  value: string,
): string[] {
  const cleaned = value
    .replace(/:$/, "")
    .trim();

  /*
   * Handles:
   *
   * Monday
   *
   * Monday - Friday
   *
   * Monday, Tuesday, Wednesday, Thursday
   */
  if (cleaned.includes(",")) {
    return cleaned
      .split(",")
      .map((part) =>
        part.trim(),
      )
      .map(
        (part) =>
          DAY_LOOKUP.get(
            part.toLowerCase(),
          ),
      )
      .filter(
        (
          day,
        ): day is string =>
          Boolean(day),
      );
  }

  const rangeMatch =
    cleaned.match(
      /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*-\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i,
    );

  if (rangeMatch) {
    return expandDayRange(
      rangeMatch[1],
      rangeMatch[2],
    );
  }

  const singleDay =
    DAY_LOOKUP.get(
      cleaned.toLowerCase(),
    );

  return singleDay
    ? [singleDay]
    : [];
}

function isDayLabel(
  line: string,
) {
  return (
    parseDayLabel(line).length > 0
  );
}

function isHoursValue(
  line: string,
) {
  return (
    /^Closed$/i.test(line) ||
    /\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)/i.test(
      line,
    )
  );
}

export function parseHours(
  lines: string[],
) {
  const hours: Record<
    string,
    string
  > = {};

  const hoursHeadingIndex =
    lines.findIndex(
      (line) =>
        /^Hours of operation$/i.test(
          line,
        ),
    );

  if (hoursHeadingIndex === -1) {
    return hours;
  }

  const exceptionsIndex =
    lines.findIndex(
      (line, index) =>
        index >
          hoursHeadingIndex &&
        /^Exceptions$/i.test(
          line,
        ),
    );

  const endIndex =
    exceptionsIndex === -1
      ? lines.length
      : exceptionsIndex;

  for (
    let i =
      hoursHeadingIndex + 1;
    i < endIndex;
    i += 1
  ) {
    const line = lines[i];

    const days =
      parseDayLabel(line);

    if (!days.length) {
      continue;
    }

    const nextLine =
      lines[i + 1];

    if (
      !nextLine ||
      !isHoursValue(nextLine)
    ) {
      continue;
    }

    for (const day of days) {
      hours[day] = nextLine;
    }

    i += 1;
  }

  return hours;
}

export function parseExceptions(
  lines: string[],
) {
  const exceptions: string[] = [];

  const exceptionsIndex =
    lines.findIndex((line) =>
      /^Exceptions$/i.test(line),
    );

  if (exceptionsIndex === -1) {
    return exceptions;
  }

  const descriptionIndex =
    lines.findIndex(
      (line, index) =>
        index >
          exceptionsIndex &&
        /^Description$/i.test(
          line,
        ),
    );

  const paymentIndex =
    lines.findIndex(
      (line, index) =>
        index >
          exceptionsIndex &&
        /^Payment$/i.test(line),
    );

  const possibleEndIndexes = [
    descriptionIndex,
    paymentIndex,
  ].filter(
    (index) => index !== -1,
  );

  const endIndex =
    possibleEndIndexes.length > 0
      ? Math.min(
          ...possibleEndIndexes,
        )
      : lines.length;

  for (
    let i =
      exceptionsIndex + 1;
    i < endIndex;
    i += 1
  ) {
    const line = lines[i];

    if (
      !MONTH_PATTERN.test(line)
    ) {
      continue;
    }

    /*
     * Sometimes the page gives:
     *
     * Sep 1 - Sep 7:
     * Closed
     *
     * rather than having it all
     * on one line.
     */
    const colonIndex =
      line.indexOf(":");

    if (colonIndex !== -1) {
      const datePart = line
        .slice(0, colonIndex)
        .trim();

      const inlineValue = line
        .slice(colonIndex + 1)
        .trim();

      if (inlineValue) {
        exceptions.push(
          `${datePart}: ${inlineValue}`,
        );

        continue;
      }

      const nextLine =
        lines[i + 1];

      if (
        nextLine &&
        isHoursValue(nextLine)
      ) {
        exceptions.push(
          `${datePart}: ${nextLine}`,
        );

        i += 1;
      }

      continue;
    }

    const nextLine =
      lines[i + 1];

    if (
      nextLine &&
      isHoursValue(nextLine)
    ) {
      exceptions.push(
        `${line}: ${nextLine}`,
      );

      i += 1;
    }
  }

  return exceptions;
}

export function parseDescription(
  lines: string[],
) {
  const descriptionIndex =
    lines.findIndex((line) =>
      /^Description$/i.test(line),
    );

  if (descriptionIndex === -1) {
    return [];
  }

  const stopPatterns = [
    /^Payment$/i,
    /^Accepted payment/i,
    /^Menu$/i,
    /^Website$/i,
  ];

  const description: string[] =
    [];

  for (
    let i =
      descriptionIndex + 1;
    i < lines.length;
    i += 1
  ) {
    const line = lines[i];

    if (
      stopPatterns.some(
        (pattern) =>
          pattern.test(line),
      )
    ) {
      break;
    }

    if (
      isDayLabel(line) ||
      MONTH_PATTERN.test(line) ||
      isHoursValue(line)
    ) {
      continue;
    }

    description.push(line);
  }

  return description;
}