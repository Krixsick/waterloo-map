import { useState } from "react";
import { CalendarDays, ChevronDown, Coffee, IceCreamBowl, ListFilter, ShoppingBag, Utensils } from "lucide-react";
import { getMapLegend, type LegendEntry, type LegendOptions } from "../utils/mapLegend";

function MarkerSample({ entry }: { entry: LegendEntry }) {
  const { symbol, color, border = "#ffffff", text } = entry;
  if (symbol === "line" || symbol === "walk") return <svg width="30" height="26" aria-hidden="true"><path d="M2 19 L12 8 L28 8" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={symbol === "walk" ? "2 6" : undefined} /></svg>;
  if (symbol === "event") return <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full border bg-white" style={{ borderColor: color, color }}><CalendarDays size={14} /></span>;
  if (["food", "coffee", "dessert", "shop"].includes(symbol)) {
    const Icon = symbol === "coffee" ? Coffee : symbol === "dessert" ? IceCreamBowl : symbol === "shop" ? ShoppingBag : Utensils;
    return <span aria-hidden="true" className="flex size-5 items-center justify-center rounded-[4px] border" style={{ backgroundColor: color, borderColor: border, color: color === "#ffffff" ? "#64748b" : "#ffffff" }}><Icon size={13} /></span>;
  }
  if (["vehicle", "parking", "cluster", "endpoint"].includes(symbol)) return <span aria-hidden="true" className={`flex h-6 min-w-6 items-center justify-center border-2 border-white px-1 text-[10px] font-bold text-white shadow-sm ${symbol === "parking" ? "rounded-md" : "rounded-full"}`} style={{ backgroundColor: color }}>{text}</span>;
  return <svg width="30" height="26" aria-hidden="true">{symbol === "square" ? <rect x="8" y="6" width="14" height="14" fill={color} stroke={border} strokeWidth="2" /> : <circle cx="15" cy="13" r={symbol === "station" ? 8 : 6} fill={color} stroke={border} strokeWidth="2" />}</svg>;
}

export default function MapLegend({ options }: { options: LegendOptions }) {
  const [expanded, setExpanded] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  const entries = getMapLegend(options);
  return <aside aria-label="Map legend" className="relative z-40 flex shrink-0 flex-col-reverse rounded-[18px] border border-slate-200 bg-white/95 p-1 shadow-md backdrop-blur-sm sm:absolute sm:right-5 sm:top-20 sm:max-w-[calc(100%-1.5rem)] sm:flex-col sm:rounded-2xl sm:p-0 lg:top-3">
    <button type="button" aria-expanded={expanded} aria-controls="map-legend-table" onClick={() => setExpanded(value => !value)} className={`flex h-11 cursor-pointer items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:rounded-2xl sm:px-3 ${expanded ? "w-full" : ""}`}>
      <ListFilter size={16} className="text-[#135f49]" aria-hidden="true" />Legend
      <ChevronDown size={14} aria-hidden="true" className={`ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} />
    </button>
    <div id="map-legend-table" hidden={!expanded} className="absolute bottom-[calc(100%+0.5rem)] left-0 w-56 rounded-2xl border border-slate-200 bg-white shadow-md sm:static sm:max-w-full sm:rounded-none sm:border-0 sm:border-t sm:border-slate-100 sm:bg-transparent sm:shadow-none">
      <div className="max-h-[min(55svh,26rem)] overflow-y-auto px-3 pb-3">
        {entries.length ? <table className="w-full border-collapse text-left text-xs text-slate-600">
          <caption className="sr-only">Symbols for the enabled map layers</caption>
          <thead><tr className="text-[10px] uppercase tracking-wide text-slate-400"><th scope="col" className="py-2 pr-3 font-medium">Marker</th><th scope="col" className="py-2 font-medium">Meaning</th></tr></thead>
          <tbody>{entries.map(entry => <tr key={entry.id} className="border-t border-slate-100/80"><td className="w-12 py-1.5"><span className="flex w-8 justify-center"><MarkerSample entry={entry} /></span></td><td className="py-1.5 leading-4">{entry.label}</td></tr>)}</tbody>
        </table> : <p className="py-3 text-xs leading-5 text-slate-500">No markers enabled for these filters.</p>}
        {options.transit && !options.transit.route && <p className="border-t border-slate-100 pt-2 text-[11px] leading-4 text-slate-500">Vehicle colours identify routes. Select a route to see its path.</p>}
      </div>
    </div>
  </aside>;
}
