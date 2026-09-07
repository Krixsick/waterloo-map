import FoodHours from "./FoodHours";
import { formatDisplayTime } from "../utils/timeFormat";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    X,
  } from "lucide-react";
  
  import { useState } from "react";
  import { createPortal } from "react-dom";
  
  import type { FoodInfo } from "../api/foodApi";
  import { FOOD_CATEGORY_DETAILS, FOOD_CATEGORY_COLOURS } from "../data/foodCategoryDetails";
  import { getWeeklyFoodStatus } from "../utils/timeUtils";
  
  type FoodDetailsCardProps = {
    food: FoodInfo;
    defaultExpanded?: boolean;
  };
  
  const MONTHS: Record<string, number> = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };
  
  function getToday() {
    return new Intl.DateTimeFormat(
      "en-CA",
      {
        weekday: "long",
        timeZone: "America/Toronto",
      },
    ).format(new Date());
  }
  
  function getTodayMenuUrl() {
    const formatter =
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Toronto",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
  
    const parts = formatter.formatToParts(
      new Date(),
    );
  
    const year = parts.find(
      (part) => part.type === "year",
    )?.value;
  
    const month = parts.find(
      (part) => part.type === "month",
    )?.value;
  
    const day = parts.find(
      (part) => part.type === "day",
    )?.value;
  
    return `https://uwaterloo.ca/food-services/daily-menu?date=${year}-${month}-${day}`;
  }
  
  function getTorontoDateParts() {
    const formatter =
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Toronto",
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
  
    const parts = formatter.formatToParts(
      new Date(),
    );
  
    const year = Number(
      parts.find(
        (part) => part.type === "year",
      )?.value,
    );
  
    const month =
      Number(
        parts.find(
          (part) => part.type === "month",
        )?.value,
      ) - 1;
  
    const day = Number(
      parts.find(
        (part) => part.type === "day",
      )?.value,
    );
  
    return {
      year,
      month,
      day,
    };
  }
  
  function dateNumber(
    year: number,
    month: number,
    day: number,
  ) {
    return (
      year * 10000 +
      (month + 1) * 100 +
      day
    );
  }
  
  function parseMonthDay(
    value: string,
    fallbackMonth?: number,
  ) {
    const cleaned = value
      .trim()
      .replace(/,/g, "");
  
    const withMonth = cleaned.match(
      /^([A-Za-z]+)\s+(\d{1,2})$/,
    );
  
    if (withMonth) {
      const month =
        MONTHS[
          withMonth[1].toLowerCase()
        ];
  
      const day = Number(
        withMonth[2],
      );
  
      if (
        month === undefined ||
        Number.isNaN(day)
      ) {
        return null;
      }
  
      return {
        month,
        day,
      };
    }
  
    const dayOnly = cleaned.match(
      /^(\d{1,2})$/,
    );
  
    if (
      dayOnly &&
      fallbackMonth !== undefined
    ) {
      return {
        month: fallbackMonth,
        day: Number(dayOnly[1]),
      };
    }
  
    return null;
  }
  
  export function getSpecialFoodHoursForToday(
    food: FoodInfo,
  ) {
    const today =
      getTorontoDateParts();
  
    const todayNumber =
      dateNumber(
        today.year,
        today.month,
        today.day,
      );
  
    /*
     * Check from newest / most specific
     * exception backwards.
     *
     * This allows something like:
     *
     * Aug 20 - Sep 28: 11am - 3pm
     * Sep 7: Closed
     *
     * to correctly resolve Sep 7 as Closed.
     */
    for (
      const exception of [
        ...(food.exceptions ?? []),
      ].reverse()
    ) {
      const colonIndex =
        exception.indexOf(":");
  
      if (colonIndex === -1) {
        continue;
      }
  
      const datePart = exception
        .slice(0, colonIndex)
        .trim();
  
      const specialHours = exception
        .slice(colonIndex + 1)
        .trim();
  
      if (!specialHours) {
        continue;
      }
  
      const rangeParts =
        datePart.split(/\s+-\s+/);
  
      if (rangeParts.length === 2) {
        const start =
          parseMonthDay(
            rangeParts[0],
          );
  
        if (!start) {
          continue;
        }
  
        const end =
          parseMonthDay(
            rangeParts[1],
            start.month,
          );
  
        if (!end) {
          continue;
        }
  
        let startYear =
          today.year;
  
        let endYear =
          today.year;
  
        const startWithoutYear =
          dateNumber(
            0,
            start.month,
            start.day,
          );
  
        const endWithoutYear =
          dateNumber(
            0,
            end.month,
            end.day,
          );
  
        if (
          endWithoutYear <
          startWithoutYear
        ) {
          if (
            today.month <=
            end.month
          ) {
            startYear =
              today.year - 1;
          } else {
            endYear =
              today.year + 1;
          }
        }
  
        const startNumber =
          dateNumber(
            startYear,
            start.month,
            start.day,
          );
  
        const endNumber =
          dateNumber(
            endYear,
            end.month,
            end.day,
          );
  
        if (
          todayNumber >=
            startNumber &&
          todayNumber <=
            endNumber
        ) {
          return specialHours;
        }
  
        continue;
      }
  
      const singleDate =
        parseMonthDay(datePart);
  
      if (!singleDate) {
        continue;
      }
  
      if (
        singleDate.month ===
          today.month &&
        singleDate.day ===
          today.day
      ) {
        return specialHours;
      }
    }
  
    return null;
  }
  
  function getDescriptionText(
    description?: string | string[],
  ) {
    if (!description) {
      return "";
    }
  
    if (Array.isArray(description)) {
      return description
        .filter(Boolean)
        .join(" ")
        .trim();
    }
  
    return description.trim();
  }
  
  function parseMealHours(
    hours: string,
  ) {
    if (!hours.includes(" · ")) {
      return null;
    }
  
    return hours
      .split(" · ")
      .map((item) => {
        const match = item.match(
          /^(.*?)\s+(\d{1,2}:\d{2}(?:AM|PM)\s+-\s+\d{1,2}:\d{2}(?:AM|PM))$/,
        );
  
        if (!match) {
          return null;
        }
  
        return {
          label: match[1],
          time: match[2],
        };
      })
      .filter(
        (
          item,
        ): item is {
          label: string;
          time: string;
        } => item !== null,
      );
  }

  function MenuGallery({
    foodName,
    images,
    initialIndex,
    onClose,
  }: {
    foodName: string;
    images: string[];
    initialIndex: number;
    onClose: () => void;
  }) {
    const [currentIndex, setCurrentIndex] =
      useState(initialIndex);
  
    const currentImage =
      images[currentIndex];
  
    const hasMultipleImages =
      images.length > 1;
  
    function showPrevious() {
      setCurrentIndex((current) =>
        current === 0
          ? images.length - 1
          : current - 1,
      );
    }
  
    function showNext() {
      setCurrentIndex((current) =>
        current ===
        images.length - 1
          ? 0
          : current + 1,
      );
    }
  
    return createPortal(
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${foodName} menu`}
          className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-ui-title text-slate-950">
                {foodName} menu
              </h2>
  
              {hasMultipleImages && (
                <p className="text-ui-meta mt-0.5 text-slate-500">
                  {currentIndex + 1} of{" "}
                  {images.length}
                </p>
              )}
            </div>
  
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              title="Close"
              className="flex size-9 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="size-5" />
            </button>
          </div>
  
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-50 p-4 sm:p-6">
            {hasMultipleImages && (
              <button
                type="button"
                onClick={showPrevious}
                aria-label="Previous menu image"
                className="absolute left-3 z-10 flex size-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-sm transition hover:bg-white hover:text-slate-950 sm:left-5"
              >
                <ChevronLeft className="size-5" />
              </button>
            )}
  
            <img
              src={currentImage}
              alt={`${foodName} menu ${
                currentIndex + 1
              }`}
              className="max-h-[68vh] max-w-full rounded-lg object-contain shadow-sm"
            />
  
            {hasMultipleImages && (
              <button
                type="button"
                onClick={showNext}
                aria-label="Next menu image"
                className="absolute right-3 z-10 flex size-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-sm transition hover:bg-white hover:text-slate-950 sm:right-5"
              >
                <ChevronRight className="size-5" />
              </button>
            )}
          </div>
  
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
            {hasMultipleImages ? (
              <div className="flex gap-1.5">
                {images.map(
                  (_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() =>
                        setCurrentIndex(
                          index,
                        )
                      }
                      aria-label={`Show menu image ${
                        index + 1
                      }`}
                      className={`size-2 cursor-pointer rounded-full transition-colors ${
                        index ===
                        currentIndex
                          ? "bg-[#13735a]"
                          : "bg-slate-300 hover:bg-slate-400"
                      }`}
                    />
                  ),
                )}
              </div>
            ) : (
              <span />
            )}
  
            <a
              href={currentImage}
              target="_blank"
              rel="noreferrer"
              className="text-ui-action inline-flex items-center gap-1.5 text-[#13735a] hover:text-[#0f604b]"
            >
              Open image
  
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </div>,
      document.body,
    );
  }
  
  export default function FoodDetailsCard({
    food,
    defaultExpanded = false,
  }: FoodDetailsCardProps) {
    const [isExpanded, setIsExpanded] =
      useState(defaultExpanded);
  
    const [
      isMenuGalleryOpen,
      setIsMenuGalleryOpen,
    ] = useState(false);
  
    const categoryDetails =
      FOOD_CATEGORY_DETAILS[
        food.category
      ];
  
    const CategoryIcon =
      categoryDetails.icon;
  
    const descriptionText =
      getDescriptionText(
        food.description,
      );
  
    /*
     * Static menus may come back as:
     *
     * url  -> one image, e.g. Bomber
     * urls -> one or many scraped images
     *
     * Combine both formats and remove duplicates.
     */
    const staticMenuImages =
      food.menu?.type === "static"
        ? Array.from(
            new Set(
              [
                ...(food.menu
                  ?.urls ?? []),
                food.menu?.url,
              ].filter(
                (
                  value,
                ): value is string =>
                  Boolean(value),
              ),
            ),
          )
        : [];
  
    const hasDailyMenu =
      food.menu?.type === "daily";
    const hasWeeklyMenu = food.menu?.type === "weekly" && Boolean(food.menu.url);
  
    const hasStaticMenu =
      staticMenuImages.length > 0;
  
    const hasMenu =
      hasDailyMenu ||
      hasWeeklyMenu ||
      hasStaticMenu;
  
    const hasExpandableContent =
      Boolean(descriptionText) ||
      Object.keys(food.hours ?? {}).length > 0 ||
      hasMenu ||
      (food.payment?.length ??
        0) > 0;
  
    const today = getToday();
  
    const specialHours =
      getSpecialFoodHoursForToday(
        food,
      );
  
    const hours =
      specialHours ??
      food.hours?.[today] ??
      "Hours unavailable";

    const foodStatus =
      getWeeklyFoodStatus(
        food.hours,
        hours ===
          "Hours unavailable"
          ? null
          : hours,
      );

    const mealHours =
      parseMealHours(formatDisplayTime(hours));
  
      const dailyMenuUrl =
      (hasDailyMenu || hasWeeklyMenu)
        ? food.menu?.url ??
          getTodayMenuUrl()
        : null;
  
    return (
      <>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors hover:border-slate-300">
          <button
            type="button"
            onClick={() => {
                setIsExpanded(
                  (current) => !current,
                );
              }}
            aria-expanded={
              hasExpandableContent
                ? isExpanded
                : undefined
            }
            className={`flex w-full items-start gap-3 p-4 text-left ${
              hasExpandableContent
                ? "cursor-pointer"
                : "cursor-default"
            }`}
          >
            <div className={`flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl ${FOOD_CATEGORY_COLOURS[food.category]}`}>
              {food.logo ? (
                <img
                  src={food.logo}
                  alt={`${food.name} logo`}
                  className="h-full w-full object-contain p-1.5"
                />
              ) : (
                <CategoryIcon className="size-5" />
              )}
            </div>
  
            <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
  <div className="min-w-0 flex-1">
    <p className="text-ui-value text-slate-900">
      {food.name}
    </p>
    <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-ui-meta ${FOOD_CATEGORY_COLOURS[food.category]}`}>{categoryDetails.label}</span>
  </div>

  <div className="flex shrink-0 items-center gap-2">
    {hours !== "Hours unavailable" && (
      <span
        className={`text-ui-meta rounded-full px-2.5 py-1 font-medium ${
          foodStatus.isOpen
            ? "bg-emerald-50 text-emerald-700"
            : "bg-rose-50 text-rose-700"
        }`}
      >
        {foodStatus.status}
      </span>
    )}

<ChevronDown
  className={`mt-0.5 size-4 shrink-0 text-slate-400 transition-transform ${
    isExpanded
      ? "rotate-180"
      : ""
  }`}
/>
  </div>
</div>
  
              <div className="mt-2">
  {mealHours &&
  mealHours.length > 0 ? (
    <div className="space-y-1">
      {mealHours.map(
        ({ label, time }) => (
          <div
            key={`${label}-${time}`}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-ui-meta text-slate-500">
              {label}
            </span>

            <span className="text-ui-meta shrink-0 font-medium text-slate-700">
              {formatDisplayTime(time)}
            </span>
          </div>
        ),
      )}
    </div>
  ) : (
    <p
      className={`text-ui-meta font-medium ${
        specialHours
          ? "text-amber-700"
          : "text-slate-600"
      }`}
    >
      {hours.trim().toLowerCase() !== "closed" ? formatDisplayTime(hours) : null}
    </p>
  )}

  {specialHours && (
    <p className="text-ui-meta mt-1 font-medium text-amber-600">
      Special hours
    </p>
  )}

{foodStatus.timeMessage && (
  <p className={`text-ui-meta mt-2 inline-block rounded-lg px-2 py-1 font-medium ${foodStatus.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
    {formatDisplayTime(foodStatus.timeMessage)}
  </p>
)}
</div>
            </div>
          </button>
  
          {hasExpandableContent &&
            isExpanded && (
              <div className="border-t border-slate-100 px-4 pb-4 pt-4">
                <FoodHours hours={food.hours} exceptions={food.exceptions} />
                {food.hoursSource && <a className="mb-3 block text-ui-meta text-emerald-700 underline" href={food.hoursSource.url} target="_blank" rel="noreferrer">Hours source · {food.hoursSource.name}</a>}
                {descriptionText && (
                  <div>
                    <p className="text-ui-label text-slate-500">
                      About
                    </p>
  
                    <p className="text-ui-meta mt-1 leading-relaxed text-slate-600">
                      {
                        descriptionText
                      }
                    </p>
                  </div>
                )}
  
                {(food.payment
                  ?.length ??
                  0) > 0 && (
                  <div
                    className={
                      descriptionText
                        ? "mt-4"
                        : ""
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-ui-label text-slate-500">
                        {food.coordinates ? "Confirmed payment options" : "Payment"}
                      </p>
                    </div>
  
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {food.payment?.map(
                        (
                          paymentMethod,
                        ) => (
                          <span
                            key={
                              paymentMethod
                            }
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                          >
                            {
                              paymentMethod
                            }
                          </span>
                        ),
                      )}
                    </div>
                    {food.paymentNote && <p className="mt-2 text-ui-meta text-slate-500">{food.paymentNote}</p>}
                  </div>
                )}
  
                {dailyMenuUrl && (
                  <a
                    href={
                      dailyMenuUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className={`text-ui-action inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-[#13735a] transition-colors hover:bg-emerald-100 ${
                      descriptionText ||
                      (food.payment
                        ?.length ??
                        0) > 0
                        ? "mt-4"
                        : ""
                    }`}
                  >
                    {hasWeeklyMenu ? "View weekly menu" : "View today's menu"}
  
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
  
                {hasStaticMenu && (
                  <button
                    type="button"
                    onClick={() =>
                      setIsMenuGalleryOpen(
                        true,
                      )
                    }
                    className={`text-ui-action inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-[#13735a] transition-colors hover:bg-emerald-100 ${
                      descriptionText ||
                      (food.payment
                        ?.length ??
                        0) > 0
                        ? "mt-4"
                        : ""
                    }`}
                  >
                    View menu
  
                    <ExternalLink className="size-3.5" />
                  </button>
                )}
              </div>
            )}
        </div>
  
        {isMenuGalleryOpen &&
          hasStaticMenu && (
            <MenuGallery
              foodName={food.name}
              images={
                staticMenuImages
              }
              initialIndex={0}
              onClose={() =>
                setIsMenuGalleryOpen(
                  false,
                )
              }
            />
          )}
      </>
    );
  }