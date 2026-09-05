import { MapPin, X } from "lucide-react";
import type { WaterlooEvent } from "../types/events";
import type { EventDateFilter } from "../utils/eventDiscovery";
import { formatDisplayTime } from "../utils/timeFormat";

export function EventSummary({event, onSelect}: {event: WaterlooEvent; onSelect: (event: WaterlooEvent) => void}) {
  const now = Date.now();
  const live = event.startsAtUTC && event.endsAtUTC && Date.parse(event.startsAtUTC) <= now && Date.parse(event.endsAtUTC) > now;
  return <button type="button" onClick={() => onSelect(event)} className="w-full cursor-pointer rounded-xl border border-violet-100 bg-white p-3 text-left transition-colors hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-violet-600">
    <div className="mb-1 flex flex-wrap gap-2 text-xs font-medium"><span className={live ? "text-emerald-700" : "text-[#7c3aed]"}>{live ? "Happening now" : "Upcoming"}</span>{event.cost && <span className="text-slate-500">{event.cost}</span>}</div>
    <p className="text-ui-value text-slate-900">{event.name}</p>
    <p className="mt-1 text-xs text-slate-600">{event.date ?? "Date to be announced"}{event.time && ` · ${formatDisplayTime(event.time)}`}</p>
    <p className="mt-1 flex items-start gap-1 text-xs text-slate-500"><MapPin size={13} className="mt-0.5 shrink-0" />{event.location || "Location to be announced"}</p>
    {event.registration && <p className="mt-2 inline-flex rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">Registration required</p>}
  </button>;
}

export default function EventsPanel({events, filter, venue, loading, error, onFilter, onClearVenue, onSelect, onClose, onRetry}: {
  events: WaterlooEvent[]; filter: EventDateFilter; search: string; venue: boolean; loading: boolean; error: boolean; partial: boolean;
  onFilter: (filter: EventDateFilter) => void; onSearch: (query: string) => void; onClearVenue: () => void; onSelect: (event: WaterlooEvent) => void; onClose: () => void; onRetry: () => void;
}) {
  return <section aria-label="Event map filters" className="pointer-events-none absolute inset-x-3 top-36 z-30 sm:left-5 sm:right-auto sm:max-w-[25rem]">
    <div className="pointer-events-auto flex w-fit max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
      {([['today','Today'],['week','This week'],['month','This month']] as const).map(([value,label]) => <button type="button" key={value} aria-pressed={filter===value} onClick={()=>onFilter(value)} className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-violet-600 ${filter===value?'bg-violet-50 font-medium text-[#7c3aed]':'text-slate-600 hover:bg-slate-50'}`}>{label}</button>)}
      <button type="button" aria-label="Close events" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={16}/></button>
    </div>
    {(loading || error || !events.length) && <div role="status" className="pointer-events-auto mt-2 w-fit rounded-xl border border-slate-100 bg-white/95 px-3 py-2 text-xs text-slate-600">{loading ? 'Loading events…' : error ? <>Events unavailable. <button onClick={onRetry} className="underline">Retry</button></> : 'No events for these dates.'}</div>}
    {venue && <div className="pointer-events-auto mt-3 max-h-[45svh] space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-lg"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-800">Events at this location</h2><button type="button" aria-label="Close location events" onClick={onClearVenue} className="rounded-full p-2 text-slate-500"><X size={16}/></button></div>{events.map(event=><EventSummary key={event.id} event={event} onSelect={onSelect}/>)}</div>}
  </section>;
}
