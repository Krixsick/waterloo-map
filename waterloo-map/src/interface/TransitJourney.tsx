import { Footprints, BusFront, TrainFront, Clock3, MapPin } from "lucide-react";
import { journeyTiming, rankJourneys, BOARDING_BUFFER_SECONDS } from "../utils/journeyTiming";
import { transitRouteColor } from "../utils/transitRoutes";
import { journeyCandidates, mapLimited } from "../utils/journeyCandidates";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { TransitStop, TransitDeparture, TransitTripDetail, TransitRouteDetail } from "../types/transit";

type Point = [number, number];
type Walk = { duration: number; geometry: GeoJSON.LineString };
type Option = { tripId: string; finalArrival: number; walkSeconds: number; leaveBy: number; accessMinutes: number; egressMinutes: number; stops: TransitStop[]; id: string; route: string; board: string; alight: string; departure: string; arrival: string; minutes: number; walkMinutes: number; waitMinutes: number; rideMinutes: number; walks: Walk[]; line: Point[]; mode: string };
const api = import.meta.env.VITE_API_URL;
const distance = (a: Point, b: Point) => Math.hypot((a[0] - b[0]) * Math.cos(a[1] * Math.PI / 180), a[1] - b[1]);
const clock = (value: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value)).replace(/\s/g, "").replace(/\./g, "").toUpperCase();
export default function TransitJourney({ origin, destination, map, walkingMinutes }: { walkingMinutes?: number; origin: Point; destination: Point; map: mapboxgl.Map }) {
  const walkCache = useRef(new Map<string, Walk>());
  const [tick, setTick] = useState(Date.now());

  const [options, setOptions] = useState<Option[]>([]);
  const [status, setStatus] = useState("Finding direct trips…");
  const [selected, setSelected] = useState<Option | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const responses = new Map<string, Promise<unknown>>();
    const fetchData = async <T,>(path: string): Promise<T> => { const response = await fetch(`${api}/transit/${path}`, {signal: controller.signal}); if (!response.ok) throw new Error("Transit planning is unavailable. Try again shortly."); return (await response.json()).data; };
    const get = <T,>(path: string): Promise<T> => { if (!responses.has(path)) responses.set(path, fetchData<T>(path)); return responses.get(path) as Promise<T>; };
    const walk = async (a: Point, b: Point): Promise<Walk> => { const key = `${a.join(",")};${b.join(",")}`; const cached = walkCache.current.get(key); if (cached) return cached; const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/walking/${a.join(",")};${b.join(",")}?geometries=geojson&overview=full&access_token=${encodeURIComponent(mapboxgl.accessToken ?? "")}`, {signal: controller.signal}); if (!response.ok) throw new Error("Walking connections unavailable."); const data = await response.json(); if (!data.routes?.[0]) throw new Error("No walking connection found."); walkCache.current.set(key, data.routes[0]); return data.routes[0]; };
    setOptions([]); setSelected(null); setStatus("Finding direct trips…");
    (async () => {
      const [starts, ends] = await Promise.all([get<TransitStop[]>(`stops?lat=${origin[1]}&lng=${origin[0]}&radius=1200`), get<TransitStop[]>(`stops?lat=${destination[1]}&lng=${destination[0]}&radius=1200`)]);
      const { from, to } = journeyCandidates(starts, ends);
      const connections = async (stops: TransitStop[], inbound: boolean) => {
        const results = await mapLimited(stops, async stop => {
          try { return { stop, walk: await walk(inbound ? origin : [stop.longitude, stop.latitude], inbound ? [stop.longitude, stop.latitude] : destination) }; }
          catch (error) { if (controller.signal.aborted) throw error; return null; }
        });
        if (stops.length && results.every(result => result === null)) throw new Error("Walking connections unavailable. Please try again.");
        return results.filter((result): result is {stop: TransitStop; walk: Walk} => result !== null && result.walk.duration <= 900);
      };
      const [access, egress] = await Promise.all([connections(from, true), connections(to, false)]);
      const now = Date.now();
      const found: Option[] = [];
      await mapLimited(access, async boarding => {
        if (boarding.walk.duration > 900) return;
        const departures = await get<TransitDeparture[]>(`planning-departures?stopId=${encodeURIComponent(boarding.stop.stopId)}&after=${Date.now() + (boarding.walk.duration + BOARDING_BUFFER_SECONDS) * 1000}`);
        await mapLimited(departures.filter(d => d.scheduledAt && Date.parse(d.scheduledAt) >= now + boarding.walk.duration * 1000 + BOARDING_BUFFER_SECONDS * 1000 && egress.some(end => end.stop.mode === d.mode && end.stop.routeIds.includes(d.routeId))), async departure => {
          const trip = await get<TransitTripDetail>(`planning-trip?mode=${departure.mode}&tripId=${encodeURIComponent(departure.tripId)}&currentStopId=${encodeURIComponent(boarding.stop.stopId)}`);
          const board = trip.nextStops.find(s => s.stopId === boarding.stop.stopId);
          // Scheduled times keep comparisons on the same service day; never mix realtime with schedule.
          if (!board?.scheduledAt) return;
          for (const ending of egress) {
            if (ending.stop.mode !== departure.mode || !ending.stop.routeIds.includes(departure.routeId)) continue;
            const arrival = trip.nextStops.find(s => s.stopId === ending.stop.stopId && s.sequence > board.sequence);
            if (!arrival?.scheduledAt || ending.walk.duration > 900) continue;
            const departAt = Date.parse(board.scheduledAt), arriveAt = Date.parse(arrival.scheduledAt);
            const timing = journeyTiming(Date.now(), departAt, arriveAt, boarding.walk.duration, ending.walk.duration);
            if (!timing) continue;
            const detail = await get<TransitRouteDetail>(`route?mode=${departure.mode}&routeId=${encodeURIComponent(departure.routeId)}`);
            const pattern = detail.patterns.find(p => p.tripIds.includes(departure.tripId));
            if (!pattern?.coordinates.length) continue;
            const nearestIndex = (point: Point) => pattern.coordinates.reduce((best,p,i,all) => distance(p,point)<distance(all[best],point)?i:best,0);
            const first = nearestIndex([boarding.stop.longitude,boarding.stop.latitude]);
            const last = nearestIndex([ending.stop.longitude,ending.stop.latitude]);
            if (last <= first) continue;
            const finalArrival = arriveAt + ending.walk.duration * 1000;
            found.push({...timing, tripId: departure.tripId, walkSeconds: boarding.walk.duration + ending.walk.duration, stops: trip.nextStops.filter(stop => stop.sequence >= board.sequence && stop.sequence <= arrival.sequence).flatMap(stop => { const location = pattern.stops.find(item => item.stopId === stop.stopId); return location ? [location] : []; }), id:`${departure.tripId}:${boarding.stop.stopId}:${ending.stop.stopId}`, route:departure.routeId, mode:departure.mode, board:boarding.stop.name, alight:ending.stop.name, departure:board.scheduledAt, arrival:new Date(finalArrival).toISOString(), minutes:timing.minutes, walkMinutes:Math.ceil((boarding.walk.duration+ending.walk.duration)/60), waitMinutes:timing.waitMinutes, rideMinutes:Math.ceil((arriveAt-departAt)/60000), walks:[boarding.walk,ending.walk], line:pattern.coordinates.slice(first,last+1)});
          }
        });
      });
      if (controller.signal.aborted) return;
      const best = rankJourneys(found, Date.now());
      setOptions(best); setSelected(best[0] ?? null); setStatus(best.length ? "Scheduled · leave now · 2-minute boarding buffer" : "No direct trip found with walks up to 15 minutes at each end. Transfers are not supported yet.");
    })().catch(error => { if (!controller.signal.aborted) setStatus(error.message); });
    return () => controller.abort();
  }, [origin, destination, tick]);
  useEffect(() => {
    if (!selected) return;
    const ids = ["journey-walk", "journey-ride"];
    map.addSource(ids[0], {type:"geojson", data:{type:"FeatureCollection",features:selected.walks.map(w=>({type:"Feature",properties:{},geometry:w.geometry}))}});
    map.addSource(ids[1], {type:"geojson", data:{type:"Feature",properties:{},geometry:{type:"LineString",coordinates:selected.line}}});
    ids.forEach((id,i)=>map.addLayer({id,source:id,type:"line",paint:{"line-color":i ? transitRouteColor(selected.mode === "ion" ? "ion" : "bus",selected.route) : "#13735a","line-width":4,...(!i?{"line-dasharray":[1,1.5]}:{})}}));
    const stopSource = "journey-stops";
    map.addSource(stopSource, {type:"geojson",data:{type:"FeatureCollection",features:selected.stops.map(stop=>({type:"Feature",properties:{name:stop.name},geometry:{type:"Point",coordinates:[stop.longitude,stop.latitude]}}))}});
    map.addLayer({id:stopSource,source:stopSource,type:"circle",paint:{"circle-radius":selected.mode === "ion" ? 8 : 5,"circle-color":transitRouteColor(selected.mode === "ion" ? "ion" : "bus",selected.route),"circle-stroke-color":"#ffffff","circle-stroke-width":2}});
    const popup = new mapboxgl.Popup({closeButton:false,closeOnClick:false,className:"journey-stop-popup",offset:12});
    const hover = (event: mapboxgl.MapLayerMouseEvent) => {
      const feature=event.features?.[0];
      if(feature?.geometry.type !== "Point")return;
      const card=document.createElement("div");card.className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg";
      const badge=document.createElement("span");badge.className="inline-block rounded-md px-2 py-1 text-xs font-bold text-white";badge.style.backgroundColor=transitRouteColor(selected.mode === "ion" ? "ion" : "bus",selected.route);badge.textContent=`${selected.mode === "ion" ? "ION" : "Bus"} ${selected.route}`;
      const name=document.createElement("p");name.className="mt-2 text-sm font-semibold text-slate-800";name.textContent=String(feature.properties?.name ?? "Stop");card.append(badge,name);
      popup.setLngLat(feature.geometry.coordinates as Point).setDOMContent(card).addTo(map);
    };
    const leave = () => {popup.remove();};
    map.on("mousemove",stopSource,hover);map.on("mouseleave",stopSource,leave);
    ids.push(stopSource);
    return () => {popup.remove();map.off("mousemove",stopSource,hover);map.off("mouseleave",stopSource,leave);ids.forEach(id=>{if(map.getLayer(id))map.removeLayer(id);if(map.getSource(id))map.removeSource(id);});};
  }, [selected,map]);
  return <div className="mt-3 space-y-3"><style>{`.journey-stop-popup .mapboxgl-popup-content{padding:0;background:transparent;box-shadow:none;border-radius:16px}.journey-stop-popup .mapboxgl-popup-tip{border-top-color:white}`}</style>
    <div className="flex items-center justify-between gap-2"><p role="status" className="text-xs text-slate-500">{status}</p><button type="button" onClick={()=>setTick(Date.now())} className="cursor-pointer text-xs font-medium text-[#13735a] underline">Refresh trips</button></div>
    {walkingMinutes !== undefined && options.length > 0 && walkingMinutes < options[0].minutes && <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[#13735a]"><Footprints size={23} /><div><p className="font-semibold">Walking is faster</p><p className="text-sm"><strong>{walkingMinutes} min</strong> · saves {options[0].minutes - walkingMinutes} min</p></div></div>}
    {options.filter(option => option.leaveBy >= Date.now()).map(option => {
      const color = transitRouteColor(option.mode === "ion" ? "ion" : "bus", option.route);
      const Icon = option.mode === "ion" ? TrainFront : BusFront;
      return <button key={option.id} onClick={()=>setSelected(option)} aria-pressed={selected?.id===option.id} style={{borderColor: selected?.id===option.id ? color : undefined}} className="w-full cursor-pointer rounded-xl border-2 border-slate-200 bg-white p-3 text-left transition-colors hover:bg-slate-50">
        <div className="flex items-center justify-between gap-3"><span style={{backgroundColor:color}} className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-semibold text-white"><Icon size={18} />{option.mode==='ion'?'ION':'Bus'} {option.route}</span><strong className="text-2xl font-semibold text-slate-900">{option.minutes} <span className="text-sm font-medium">min</span></strong></div>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-start gap-2 text-slate-700"><Footprints size={16} className="mt-0.5 shrink-0 text-emerald-700" /><span>Walk <strong>{option.accessMinutes} min</strong> to {option.board}</span></div>
          <div className="flex items-start gap-2 text-slate-700"><Icon size={16} style={{color}} className="mt-0.5 shrink-0" /><span><strong>{clock(option.departure)}</strong> · Ride {option.rideMinutes} min to {option.alight}</span></div>
          <div className="flex items-start gap-2 text-slate-700"><Footprints size={16} className="mt-0.5 shrink-0 text-emerald-700" /><span>Walk <strong>{option.egressMinutes} min</strong> to destination</span></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-2 text-xs text-slate-500"><span className="flex items-center gap-1"><Clock3 size={13} />Wait {option.waitMinutes} min</span><span>Leave by <strong className="text-slate-700">{clock(new Date(option.leaveBy).toISOString())}</strong></span><span className="flex items-center gap-1"><MapPin size={13} />Arrive <strong className="text-slate-700">{clock(option.arrival)}</strong></span></div>
      </button>;
    })}
  </div>;
}
