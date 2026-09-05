import { useState } from "react";
import { MapPin, Search } from "lucide-react";
export type JourneyPlace = { name: string; coordinates: [number, number] };
export default function JourneyPlaceField({ label, value, places, onSelect, onMap }: { label: string; value?: string; places: JourneyPlace[]; onSelect: (place: JourneyPlace) => void; onMap: () => void }) {
  const [query,setQuery]=useState<string | null>(null);
  const matches=query !== null && query.trim() ? places.filter(place=>query.toLowerCase().split(/\s+/).every(word=>place.name.toLowerCase().includes(word))).slice(0,20) : [];
  return <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
    <label className="flex items-center gap-2 text-sm"><span className="w-9 shrink-0 font-medium text-[#13735a]">{label}</span><Search size={15} className="shrink-0 text-slate-400" /><input aria-label={`${label} location`} value={query ?? value ?? ""} onFocus={()=>setQuery("")} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key==='Escape')setQuery(null);if(event.key==='Enter'&&matches[0]){onSelect(matches[0]);setQuery(null);}}} placeholder="Search buildings or stops" className="min-w-0 flex-1 bg-transparent text-slate-900 outline-none" /></label>
    {matches.length>0 && <div className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-white">{matches.map((place,index)=><button type="button" key={index} onClick={()=>{onSelect(place);setQuery(null);}} className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-emerald-50">{place.name}</button>)}</div>}
    {query && !matches.length && <p className="mt-2 text-xs text-slate-500">No match. Choose your point on the map.</p>}
    <button type="button" onClick={()=>{setQuery(null);onMap();}} className="mt-2 flex cursor-pointer items-center gap-1 text-xs font-medium text-[#13735a]"><MapPin size={13} />Choose on map</button>
  </div>;
}
