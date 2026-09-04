import {
    ChevronDown,
    CreditCard,
    ExternalLink,
  } from "lucide-react";
  
import { useState } from "react";
import type { FoodInfo } from "../api/foodApi";
import { FOOD_CATEGORY_DETAILS } from "../data/foodCategoryDetails";

type FoodDetailsCardProps = {
    food: FoodInfo;
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

  function getSpecialFoodHoursForToday(
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
  
    for (
      const exception of
      food.exceptions ?? []
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
  
  export default function FoodDetailsCard({
    food,
  }: FoodDetailsCardProps) {
    const [isExpanded, setIsExpanded] =
      useState(false);
    
    const categoryDetails =
      FOOD_CATEGORY_DETAILS[food.category];
    
    const CategoryIcon =
      categoryDetails.icon;
  
    const descriptionText =
      getDescriptionText(
        food.description,
      );
  
      const hasExpandableContent =
      Boolean(descriptionText) ||
      Boolean(food.menu?.type) ||
      Boolean(food.menu?.url) ||
      (food.payment?.length ?? 0) > 0;
  
    const today = getToday();
  
    const specialHours =
      getSpecialFoodHoursForToday(food);
  
    const hours =
      specialHours ??
      food.hours?.[today] ??
      "Hours unavailable";
    const menuUrl = food.menu?.type === "daily" ? getTodayMenuUrl() : food.menu?.url;
  
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300">
        <button
          type="button"
          onClick={() => {
            if (hasExpandableContent) {
              setIsExpanded(
                (current) => !current,
              );
            }
          }}
          aria-expanded={
            hasExpandableContent
              ? isExpanded
              : undefined
          }
          className={`flex w-full items-start gap-3 p-3 text-left ${
            hasExpandableContent
              ? "cursor-pointer"
              : "cursor-default"
          }`}
        >
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-50 text-[#13735a]">
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
  
                {!isExpanded &&
                  descriptionText && (
                    <p className="text-ui-meta mt-1 line-clamp-2 text-slate-500">
                      {descriptionText}
                    </p>
                  )}
              </div>
  
              {hasExpandableContent && (
                <ChevronDown
                  className={`mt-0.5 size-4 shrink-0 text-slate-400 transition-transform ${
                    isExpanded
                      ? "rotate-180"
                      : ""
                  }`}
                />
              )}
            </div>
  
            <div className="mt-2">
              <p
                className={`text-ui-meta font-medium ${
                  specialHours
                    ? "text-amber-700"
                    : "text-slate-600"
                }`}
              >
                {hours}
              </p>
  
              {specialHours && (
                <p className="text-ui-meta mt-0.5 font-medium text-amber-600">
                  Special hours
                </p>
              )}
            </div>
          </div>
        </button>
  
        {hasExpandableContent &&
          isExpanded && (
            <div className="border-t border-slate-100 px-3 pb-3 pt-3">
              {descriptionText && (
                <div>
                  <p className="text-ui-label text-slate-500">
                    About
                  </p>
  
                  <p className="text-ui-meta mt-1 leading-relaxed text-slate-600">
                    {descriptionText}
                  </p>
                </div>
              )}
  
              {(food.payment?.length ??
                0) > 0 && (
                <div
                  className={
                    descriptionText
                      ? "mt-4"
                      : ""
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="size-4 text-slate-400" />
  
                    <p className="text-ui-label text-slate-500">
                      Payment
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
                </div>
              )}
  
  {menuUrl && (
  <a
    href={menuUrl}
    target="_blank"
    rel="noreferrer"
    className={`text-ui-action inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-[#13735a] transition-colors hover:bg-emerald-100 ${
      descriptionText ||
      (food.payment?.length ?? 0) > 0
        ? "mt-4"
        : ""
    }`}
  >
    {food.menu?.type === "daily"
      ? "View today's menu"
      : "View menu"}

    <ExternalLink className="size-3.5" />
  </a>
)}
            </div>
          )}
      </div>
    );
  }
