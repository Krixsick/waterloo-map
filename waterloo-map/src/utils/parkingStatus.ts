import type { ParkingLot, ParkingStatus } from "../types/parking";

const waterlooClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export function getParkingStatus(lot: ParkingLot, now: Date): { status: ParkingStatus; label: string; price: string } {
  const parts = waterlooClock.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  const day = part("weekday");
  const minutes = Number(part("hour")) * 60 + Number(part("minute"));
  const weekend = day === "Sat" || day === "Sun";
  if (lot.access === "closed") return { status: "closed", label: "Closed to visitors", price: lot.rate };
  if (lot.access === "permit") return { status: "restricted", label: "Permit required", price: lot.rate };
  if (lot.freeWeekends && (weekend || (day === "Fri" && minutes >= 990) || (day === "Mon" && minutes < 360))) {
    return { status: "free", label: "Free now", price: "$0 · until Monday 6 a.m." };
  }
  if (lot.access !== "residence" && minutes >= 180 && minutes < 360) {
    return { status: "restricted", label: "No parking 3–6 a.m.", price: lot.rate };
  }
  if (lot.access === "evenings" && !weekend && minutes < 990) {
    return { status: "restricted", label: "Visitors after 4:30 p.m.", price: lot.rate };
  }
  if (lot.access === "after-six" && minutes < 1080) {
    return { status: "restricted", label: "Visitors after 6 p.m.", price: lot.rate };
  }
  return { status: "paid", label: lot.access === "residence" ? "Paid · residence visitors" : "Paid parking", price: lot.rate };
}

export const parkingColors: Record<ParkingStatus, string> = {
  free: "#15803d", paid: "#1d4ed8", restricted: "#64748b", closed: "#a16207",
};
