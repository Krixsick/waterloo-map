import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { ArrowLeft, ExternalLink, SquareParking, X } from "lucide-react";
import { parkingLots, PARKING_FAQ_URL, PARKING_MAP_URL, PARKING_RATES_URL, PARKING_VERIFIED_ON } from "../data/parkingLots";
import { getParkingStatus, parkingColors } from "../utils/parkingStatus";
import type { ParkingFilter } from "../types/parking";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#135f49]";
const filters: { value: ParkingFilter; label: string }[] = [
  { value: "all", label: "All" }, { value: "free", label: "Free now" },
  { value: "paid", label: "Paid" }, { value: "restricted", label: "Restricted" },
];

export default function ParkingMap({ map, onClose }: { map: mapboxgl.Map; onClose: () => void }) {
  const [now, setNow] = useState(() => new Date());
  const [filter, setFilter] = useState<ParkingFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const lots = useMemo(() => parkingLots.map((lot) => ({ ...lot, ...getParkingStatus(lot, now) })), [now]);
  const visibleLots = useMemo(() => lots.filter((lot) => filter === "all" || lot.status === filter || (filter === "restricted" && lot.status === "closed")), [lots, filter]);
  const selected = lots.find((lot) => lot.id === selectedId) ?? null;
  const selectLot = useCallback((id: string) => setSelectedId(id), []);

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  useEffect(() => {
    const markers = visibleLots.map((lot) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "parking-map-marker";
      button.style.backgroundColor = parkingColors[lot.status];
      button.setAttribute("aria-label", `${lot.name}: ${lot.label}. ${lot.price}`);
      button.setAttribute("aria-pressed", String(lot.id === selectedId));
      button.title = `${lot.name} · ${lot.label} · ${lot.price}`;
      const symbol = document.createElement("span");
      symbol.textContent = "P";
      symbol.className = "parking-map-marker-symbol";
      symbol.setAttribute("aria-hidden", "true");
      const name = document.createElement("span");
      name.textContent = lot.id;
      button.append(symbol, name);
      button.onclick = (event) => { event.stopPropagation(); selectLot(lot.id); };
      const marker = new mapboxgl.Marker({ element: button }).setLngLat(lot.coordinates).addTo(map);
      button.setAttribute("role", "button");
      return marker;
    });
    return () => markers.forEach((marker) => marker.remove());
  }, [map, visibleLots, selectedId, selectLot]);

  useEffect(() => {
    map.setMinZoom(11);
    const selectedLot = parkingLots.find((lot) => lot.id === selectedId);
    const container = map.getContainer();
    const wide = container.clientWidth >= 900;
    const cardBottom = (panelRef.current?.getBoundingClientRect().bottom ?? 340) - container.getBoundingClientRect().top;
    const padding = { top: wide ? 150 : Math.min(cardBottom + 20, container.clientHeight - 160), bottom: 85, left: wide ? 425 : 24, right: 80 };
    if (selectedLot) {
      map.easeTo({ center: selectedLot.coordinates, zoom: 16, pitch: 0, bearing: 0, padding, retainPadding: false, duration: 800 });
    } else {
      const bounds = new mapboxgl.LngLatBounds(parkingLots[0].coordinates, parkingLots[0].coordinates);
      parkingLots.forEach((lot) => bounds.extend(lot.coordinates));
      map.fitBounds(bounds, { padding, maxZoom: 15, pitch: 0, bearing: 0, retainPadding: false, duration: 800 });
    }
  }, [map, selectedId]);

  return (
    <section ref={panelRef} aria-label="Campus parking" className="absolute left-3 top-36 z-30 flex max-h-[calc(100svh-20rem)] w-[calc(100%-1.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg sm:left-5">
      <header className="flex shrink-0 items-start gap-3 px-4 pb-3 pt-4">
        <SquareParking size={22} className="mt-0.5 text-[#135f49]" aria-hidden="true" />
        <div className="min-w-0 flex-1"><h2 className="text-base font-semibold text-slate-900">Campus parking</h2><p className="mt-0.5 text-xs text-slate-500">{parkingLots.length} mapped lots · Waterloo local time</p></div>
        <button type="button" onClick={onClose} aria-label="Hide parking" className={`flex size-8 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 ${focus}`}><X size={18} /></button>
      </header>
      <div role="group" aria-label="Parking cost filters" className="flex shrink-0 gap-1 border-b border-slate-100 px-3 pb-3">
        {filters.map((item) => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => { setFilter(item.value); setSelectedId(null); }} className={`min-h-10 flex-1 cursor-pointer whitespace-nowrap rounded-xl px-2 text-xs font-semibold ${focus} ${filter === item.value ? "bg-[#135f49] text-white" : "text-slate-600 hover:bg-slate-100"}`}>{item.label}</button>)}
      </div>
      <div className="min-h-0 overflow-y-auto">
        {selected ? <div className="p-4">
          <button type="button" onClick={() => setSelectedId(null)} className={`mb-3 flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md text-xs text-slate-600 ${focus}`}><ArrowLeft size={14} /> Back to lots</button>
          <div className="flex items-start justify-between gap-2"><h3 className="text-base font-semibold text-slate-900">{selected.name}</h3><span style={{ color: parkingColors[selected.status], backgroundColor: `${parkingColors[selected.status]}12` }} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold">{selected.status === "free" ? "Free now" : selected.status === "paid" ? "Paid" : selected.status === "closed" ? "Closed" : "Restricted"}</span></div>
          <p className="mt-2 text-lg font-semibold text-slate-900">{selected.price}</p>
          <p className="mt-2 text-sm leading-5 text-slate-700">{selected.hours}</p>
          {selected.status === "restricted" && <p className="mt-2 text-xs font-semibold text-amber-700">{selected.label}</p>}
          <p className="mt-3 text-xs leading-5 text-slate-500">{selected.notes}</p>
          <dl className="mt-3 border-t border-slate-100 pt-3"><dt className="text-xs text-slate-500">Payment</dt><dd className="mt-1 text-sm text-slate-700">{selected.status === "free" ? "No parking fee during the free weekend window" : selected.payment}</dd></dl>
          <a href={selected.freeWeekends ? PARKING_FAQ_URL : PARKING_RATES_URL} target="_blank" rel="noreferrer" className={`mt-4 flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#edf5f1] px-3 text-sm font-medium text-[#135f49] ${focus}`}>Official parking rules <ExternalLink size={14} /></a>
        </div> : <div className="px-4 py-3">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
            <span><span className="text-green-700">●</span> Free now</span><span><span className="text-blue-700">●</span> Paid</span><span><span className="text-slate-500">●</span> Restricted / closed</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-600">{filter === "free" ? (visibleLots.length ? "Lot X is free until Monday at 6 a.m." : "No mapped lots are free right now. Lot X is free Friday 4:30 p.m. to Monday 6 a.m.") : "Select a P marker for prices and access rules."}</p>
          {visibleLots.length > 0 && <details key={filter} open={filter === "free"} className="mt-2">
            <summary className={`cursor-pointer rounded-md py-2 text-sm font-medium text-slate-700 ${focus}`}>Browse {visibleLots.length} {visibleLots.length === 1 ? "lot" : "lots"}</summary>
            <ul className="max-h-52 overflow-y-auto">
              {visibleLots.map((lot) => <li key={lot.id}><button type="button" onClick={() => selectLot(lot.id)} className={`flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50 ${focus}`}>
                <span style={{ backgroundColor: parkingColors[lot.status] }} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white">{lot.id}</span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-800">{lot.name}</span><span className="block text-xs text-slate-500">{lot.label}</span></span>
                <span className="max-w-28 text-right text-xs text-slate-600">{lot.price}</span>
              </button></li>)}
            </ul>
          </details>}
        </div>}
        <footer className="border-t border-slate-100 px-4 py-3 text-[11px] leading-4 text-slate-500">
          <p>Lot locations and fees, not live space availability. Check signs for reserved spaces and temporary changes.</p>
          <p className="mt-1">Verified {PARKING_VERIFIED_ON} · <a className="underline" href={PARKING_RATES_URL} target="_blank" rel="noreferrer">Rates</a> · <a className="underline" href={PARKING_FAQ_URL} target="_blank" rel="noreferrer">Free parking</a> · <a className="underline" href={PARKING_MAP_URL} target="_blank" rel="noreferrer">Campus map</a></p>
        </footer>
      </div>
    </section>
  );
}
