import TransitPanel from "./TransitPanel";
import { BusFront, LocateFixed, ChevronDown, X } from "lucide-react";
import { useState, type RefObject } from "react";
import type { TransitRoute, TransitRouteDetail, TransitRoutePattern, TransitStop } from "../types/transit";
import { transitRouteColor } from "../utils/transitRoutes";

const focusStyle = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#135f49]";

export function TransitRouteBar({
  enabled, routes, selectedRoute, loading, error, partial, onToggle, onSelect, onRetry, onPlanTrip,
}: {
  onPlanTrip: () => void;
  enabled: boolean;
  routes: TransitRoute[];
  selectedRoute: TransitRoute | null;
  loading: boolean;
  error: boolean;
  partial: boolean;
  showHint: boolean;
  onToggle: () => void;
  onSelect: (route: TransitRoute | null) => void;
  onRetry: () => void;
}) {
  if (!enabled) return (
    <button type="button" onClick={onToggle} className={`absolute left-3 top-20 z-20 flex h-11 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm sm:left-5 ${focusStyle}`}>
      <BusFront size={18} aria-hidden="true" /> Transit
    </button>
  );

  return (
    <TransitPanel tab="explore" onExplore={() => {}} onPlan={onPlanTrip} onClose={onToggle}>
        <div className="mt-3">
          <details className="group relative">
            <summary id="transit-route-picker" aria-label="Choose a transit route" className={`flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm hover:bg-emerald-50/50 ${focusStyle}`}>
              <span className="flex min-w-0 items-center gap-3">
                {selectedRoute ? <span style={{backgroundColor:transitRouteColor(selectedRoute.mode,selectedRoute.routeId)}} className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white">{selectedRoute.routeId}</span> : <span className="rounded-lg bg-white p-2 text-[#13735a]"><BusFront size={18} /></span>}
                <span className="min-w-0"><span className="block truncate font-medium text-slate-800">{selectedRoute ? selectedRoute.name : "All routes"}</span><span className="mt-0.5 block text-xs text-slate-500">{selectedRoute ? `${selectedRoute.mode === "ion" ? "ION light rail" : "Bus route"} · Change route` : loading ? "Loading routes…" : error ? "Route list unavailable" : `${routes.length} routes · Choose a route`}</span></span>
              </span>
              <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
            </summary>
            <div className="relative z-40 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
              <button type="button" onClick={event=>{onSelect(null);event.currentTarget.closest("details")?.removeAttribute("open");}} className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">All routes</button>
              {routes.map(route => <button type="button" key={route.id} onClick={event=>{onSelect(route);event.currentTarget.closest("details")?.removeAttribute("open");}} className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"><span style={{backgroundColor:transitRouteColor(route.mode,route.routeId)}} className="min-w-10 rounded-md px-2 py-1 text-center text-xs font-bold text-white">{route.routeId}</span><span>{route.name}</span></button>)}
            </div>
          </details>
        </div>
        {loading && <p role="status" className="mt-2 text-xs text-slate-500">Loading routes…</p>}
        {error && <button type="button" onClick={onRetry} className="mt-2 text-xs text-red-700 underline">Routes unavailable · Retry</button>}
        {partial && !error && <p className="mt-2 text-xs text-slate-500">Some routes are unavailable.</p>}
    </TransitPanel>
  );
}

export function TransitRouteCard({ route, detail, pattern, loading, error, vehicles, liveUnavailable, panelRef, onPattern, onFit, onClear, onStop, onRetry }: {
  route: TransitRoute;
  panelRef: RefObject<HTMLElement | null>;
  detail: TransitRouteDetail | null;
  pattern: TransitRoutePattern | null;
  loading: boolean;
  error: boolean;
  vehicles: number;
  liveUnavailable: boolean;
  onPattern: (id: string) => void;
  onFit: () => void;
  onClear: () => void;
  onStop: (stop: TransitStop) => void;
  onRetry: () => void;
}) {
  const [showStops, setShowStops] = useState(false);
  const color = transitRouteColor(route.mode, route.routeId);
  return (
    <section ref={panelRef} aria-label={`Route ${route.routeId} details`} className="absolute left-3 top-[23rem] z-20 max-h-[calc(100svh-24rem)] w-[calc(100%-1.5rem)] max-w-sm overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg sm:left-5 sm:w-96">
      <header className="flex items-start gap-3 p-4 pb-3">
        <span style={{ backgroundColor: color }} className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl px-2 text-base font-bold text-white">{route.routeId}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-5 text-slate-900">{route.name}</h2>
          <p className="mt-1 text-xs text-slate-500">{route.mode === "ion" ? "ION" : "GRT bus"} · Scheduled route</p>
        </div>
        <button type="button" onClick={onClear} aria-label="Back to all routes" className={`flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 ${focusStyle}`}><X size={17} /></button>
      </header>
      {loading ? <p role="status" className="px-4 pb-4 text-sm text-slate-500">Loading route path and stops…</p> : error || !detail || !pattern ? (
        <div role="status" className="px-4 pb-4 text-sm text-slate-600">Route details are unavailable. <button type="button" onClick={onRetry} className="cursor-pointer text-[#135f49] underline">Try again</button></div>
      ) : <>
        <div className="px-4 pb-3">
          <label htmlFor="transit-destination" className="mb-1.5 block text-xs font-medium text-slate-500">Destination / branch</label>
          <select id="transit-destination" value={pattern.id} onChange={(event) => onPattern(event.target.value)} className={`min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 ${focusStyle}`}>
            {detail.patterns.map((item, index) => <option key={item.id} value={item.id}>{item.headsign}{detail.patterns.filter((other) => other.headsign === item.headsign).length > 1 ? ` · ${item.stops.length} stops (branch ${index + 1})` : ""}</option>)}
          </select>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500" aria-live="polite">{liveUnavailable ? "Live positions unavailable" : `${vehicles} live ${vehicles === 1 ? "vehicle" : "vehicles"} on this route`}</span>
            <button type="button" onClick={onFit} className={`flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[#135f49] hover:bg-[#edf5f1] ${focusStyle}`}><LocateFixed size={15} /> Fit route</button>
          </div>
          {pattern.coordinates.length < 2 && <p role="status" className="mt-2 text-xs text-amber-700">Path unavailable in the feed. Showing stops only.</p>}
          <p className="mt-1 text-[11px] leading-4 text-slate-400">Scheduled path; temporary detours may differ. Vehicles shown in both directions.</p>
        </div>
        <div className="border-t border-slate-100">
          <button type="button" aria-expanded={showStops} aria-controls="transit-route-stops" onClick={() => setShowStops((value) => !value)} className={`flex min-h-11 w-full cursor-pointer items-center justify-between px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 ${focusStyle}`}>
            <span>{showStops ? "Hide" : "Show"} {pattern.stops.length} stops</span><span aria-hidden="true">{showStops ? "−" : "+"}</span>
          </button>
          {showStops && <ol id="transit-route-stops" className="px-4 pb-3">
            {pattern.stops.map((stop, index) => <li key={`${stop.id}:${index}`}>
              <button type="button" onClick={() => onStop(stop)} className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-1 py-2 text-left hover:bg-slate-50 ${focusStyle}`}>
                <span style={{ color, borderColor: color }} className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold">{index + 1}</span>
                <span className="text-sm text-slate-700">{stop.name}</span>
              </button>
            </li>)}
          </ol>}
        </div>
      </>}
    </section>
  );
}
