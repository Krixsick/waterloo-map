import { Info } from "lucide-react";

export function graduateHouseHours(now = new Date()) {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  if (date >= "2026-09-05" && date < "2026-09-08") return "Closed — reopens September 8";
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", weekday: "long" }).format(now);
  if (["Monday", "Tuesday"].includes(day)) return "9:00AM - 9:00PM";
  if (["Wednesday", "Thursday", "Friday"].includes(day)) return "9:00AM - 10:00PM";
  return "Weekend hours not listed";
}

export default function GraduateHouseInfo() {
  return <div className="flex gap-4 py-4">
    <Info className="mt-0.5 size-5 shrink-0 text-[#13735a]" />
    <div className="min-w-0 flex-1">
      <dt className="text-ui-label text-slate-500">Visiting Graduate House</dt>
      <dd className="text-ui-meta mt-2 space-y-3 leading-relaxed text-slate-600">
        <div><p className="font-medium text-slate-800">Regular building hours</p><p>Mon–Tue: 9:00AM - 9:00PM</p><p>Wed–Fri: 9:00AM - 10:00PM</p><p>Coffee starts at 9:00AM; doors close one hour after the kitchen.</p></div>
        <div><p className="font-medium text-slate-800">Kitchen</p><p>Mon–Tue: 11:00AM - 8:00PM</p><p>Wed–Fri: 11:00AM - 9:00PM</p><p>Halal chicken, vegan and vegetarian options available.</p></div>
        <p>Welcomes the Waterloo community. Includes an upper lounge, meeting rooms, and a rooftop patio.</p>
        <p>Accepts cash, cheque, debit, Visa, and Mastercard. WATCard cannot be used for payment; eligible graduate students can tap it before ordering to verify their discount. Original government ID is required for alcohol service.</p>
        <p>Group bookings for 10–50 people require one week’s notice. Group food orders require 24 hours’ cancellation notice. Outside food and drinks require prior approval; rental charges may apply.</p>
        <p>Bookings: <a className="underline" href="mailto:ghsuperv@uwaterloo.ca">ghsuperv@uwaterloo.ca</a> · 519-888-4567 ext. 33803</p>
        <a className="inline-block font-medium text-[#13735a] underline" href="https://www.gsauw.ca/gradhouse" target="_blank" rel="noreferrer">Menus, bookings & current notices</a>
      </dd>
    </div>
  </div>;
}
