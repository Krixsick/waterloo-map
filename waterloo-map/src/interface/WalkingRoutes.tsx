import JourneyPlaceField from "./JourneyPlaceField";
import { useTransitStops } from "../api/transitApi";
import { Footprints, BusFront } from "lucide-react";
import TransitPanel from "./TransitPanel";
import TransitJourney from "./TransitJourney";
import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { buildings } from "../data/buildings";

type Place = { name: string; coordinates: [number, number] };
const layers = ["campus-building-circles", "residence-building-squares", "child-residence-building-squares"];
const empty: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
export default function WalkingRoutes({ map, selectedId, enabled, onEnabled, onConsumeSelection, onExplore, preferredMode = "walk" }: { onExplore: () => void; preferredMode?: "walk" | "transit"; map: mapboxgl.Map; selectedId: string | null; enabled: boolean; onEnabled: (value: boolean) => void; onConsumeSelection: () => void }) {
  const [pickField, setPickField] = useState<"from" | "to" | null>(null);
  const stops = useTransitStops(enabled);
  const places = useMemo(() => [...buildings.features.map(b => ({name:`${b.properties.abbreviation} · ${b.properties.name}`,coordinates:b.geometry.coordinates as [number,number]})), ...(stops.data?.data ?? []).map(stop=>({name:`${stop.name} · Stop ${stop.stopId}`,coordinates:[stop.longitude,stop.latitude] as [number,number]}))], [stops.data]);
  const [mode, setMode] = useState<"walk" | "transit">("walk");
  const [origin, setOrigin] = useState<Place | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [mapDestination, setMapDestination] = useState<Place | null>(null);
  useEffect(() => { if (enabled) setMode(preferredMode); }, [enabled, preferredMode]);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const cache = useRef(new Map<string, { geometry: GeoJSON.LineString; duration: number; distance: number }>());
  useEffect(() => {
    if (!enabled || !selectedId) return;
    const building = buildings.features.find(b => b.properties.id === selectedId);
    if (building) {
      if (pickField === "from" || (!origin && pickField !== "to")) setOrigin({ name: building.properties.abbreviation, coordinates: building.geometry.coordinates as [number, number] });
      else { setDestinationId(selectedId); setMapDestination(null); }
      setPickField(null);
      onConsumeSelection();
    }
  }, [enabled, selectedId, origin, onConsumeSelection, pickField]);
  const target = useMemo(() => mapDestination ? { geometry: { coordinates: mapDestination.coordinates }, properties: { abbreviation: mapDestination.name } } : buildings.features.find(b => b.properties.id === (destinationId ?? hoverId)), [mapDestination, destinationId, hoverId]);
  useEffect(() => {
    if (!enabled) return;
    const click = (event: mapboxgl.MapMouseEvent) => {
      if (map.queryRenderedFeatures(event.point, {layers: layers.filter(id => map.getLayer(id))}).length) return;
      const place: Place = {name: origin ? "B" : "A", coordinates: [event.lngLat.lng,event.lngLat.lat]};
      if (pickField === "from" || (!origin && pickField !== "to")) setOrigin(place); else {setMapDestination(place);setDestinationId(null);}
      setPickField(null);
      onConsumeSelection();
    };
    map.on("click",click); return () => {map.off("click",click);};
  }, [map,enabled,origin,onConsumeSelection,pickField]);
  useEffect(() => {
    const pins: mapboxgl.Marker[] = [];
    if (enabled) {
      const add = (coordinates: [number,number], label: string) => {const el=document.createElement("div");el.textContent=label;el.className="rounded-full border-2 border-white bg-emerald-800 px-2 py-1 text-xs font-bold text-white shadow";pins.push(new mapboxgl.Marker({element:el}).setLngLat(coordinates).addTo(map));};
      if(origin) add(origin.coordinates,"A");
      if((destinationId || mapDestination) && target) add(target.geometry.coordinates as [number,number],"B");
    }
    return () => pins.forEach(pin=>pin.remove());
  },[map,enabled,origin,destinationId,mapDestination,target]);
  useEffect(() => {
    map.addSource("walking-route", {type:"geojson",data:empty});
    map.addLayer({id:"walking-route",type:"line",source:"walking-route",paint:{"line-color":"#13735a","line-width":4,"line-dasharray":[1,1.5]}});
    const move=(event:mapboxgl.MapLayerMouseEvent)=>setHoverId(event.features?.[0]?.properties?.id ?? null);
    const leave=()=>setHoverId(null);
    layers.forEach(id=>{map.on("mousemove",id,move);map.on("mouseleave",id,leave);});
    return ()=>{layers.forEach(id=>{map.off("mousemove",id,move);map.off("mouseleave",id,leave);});if(map.getLayer("walking-route"))map.removeLayer("walking-route");if(map.getSource("walking-route"))map.removeSource("walking-route");};
  },[map]);
  useEffect(()=>{
    const source=map.getSource("walking-route") as mapboxgl.GeoJSONSource | undefined;
    source?.setData(empty);setMessage("");
    if(!enabled || !origin || !target || mode!=="walk")return;
    const destination=target.geometry.coordinates;
    if(destination.every((v,i)=>v===origin.coordinates[i]))return;
    const controller=new AbortController();setMessage("Finding walking route…");
    const timer=setTimeout(async()=>{
      try {
        const key=`${origin.coordinates.join(",")};${destination.join(",")}`;
        let route=cache.current.get(key);
        if(!route){const response=await fetch(`https://api.mapbox.com/directions/v5/mapbox/walking/${key}?geometries=geojson&overview=full&access_token=${encodeURIComponent(mapboxgl.accessToken ?? "")}`,{signal:controller.signal});if(!response.ok)throw new Error("Walking route unavailable");route=(await response.json()).routes?.[0];if(!route)throw new Error("No walking route found");cache.current.set(key,route);}
        if(controller.signal.aborted)return;
        if(route.duration>=3600){setMessage("Over an hour away — choose a closer starting point.");return;}
        source?.setData({type:"Feature",properties:{},geometry:route.geometry});setMessage(`${Math.max(1,Math.round(route.duration/60))} min · ${Math.round(route.distance)} m`);
      } catch(error){if(!controller.signal.aborted)setMessage(error instanceof Error?error.message:"Walking route unavailable");}
    },350);
    return()=>{clearTimeout(timer);controller.abort();};
  },[map,origin,target,enabled,mode]);
  function locate(){setMessage("Finding your location…");navigator.geolocation?.getCurrentPosition(position=>{setOrigin({name:"Your location",coordinates:[position.coords.longitude,position.coords.latitude]});setMessage("");},()=>setMessage("Location unavailable. Select a point on the map."));}
  if (!enabled) return null;
  return <TransitPanel tab="plan" onExplore={onExplore} onPlan={() => {}} onClose={() => { onEnabled(false); setOrigin(null); setDestinationId(null); setMapDestination(null); }}>
    <div className="mt-3 space-y-2">
      <JourneyPlaceField label="From" value={origin?.name} places={places} onSelect={place=>{setOrigin(place);setPickField(null);}} onMap={()=>setPickField("from")} />
      <JourneyPlaceField label="To" value={mapDestination?.name ?? buildings.features.find(b=>b.properties.id===destinationId)?.properties.abbreviation} places={places} onSelect={place=>{setMapDestination(place);setDestinationId(null);setPickField(null);}} onMap={()=>setPickField("to")} />
      <button type="button" onClick={locate} className="cursor-pointer px-2 py-1 text-sm font-medium text-[#13735a]">Use my location</button>
      {pickField && <p role="status" className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-[#13735a]">Select your {pickField === "from" ? "start" : "destination"} on the map</p>}
    </div>
    <div className="mt-3 flex gap-2 rounded-full bg-slate-100 p-1">{(["walk", "transit"] as const).map(value => <button type="button" key={value} aria-pressed={mode===value} onClick={()=>setMode(value)} className={`flex flex-1 items-center justify-center gap-2 cursor-pointer rounded-full px-3 py-2 text-sm font-medium ${mode===value ? "bg-white text-[#13735a] shadow-sm" : "text-slate-500"}`}>{value === "walk" ? <><Footprints size={17} />Walk</> : <><BusFront size={17} />Transit</>}</button>)}</div>
    {mode === "transit" && origin && (destinationId || mapDestination) && target && <TransitJourney walkingMinutes={(() => { const route = cache.current.get(`${origin.coordinates.join(",")};${target.geometry.coordinates.join(",")}`); return route ? Math.ceil(route.duration / 60) : undefined; })()} origin={origin.coordinates} destination={target.geometry.coordinates as [number, number]} map={map} />}
    {mode === "transit" && !destinationId && !mapDestination && <p className="mt-2 text-sm text-slate-500">Select a destination</p>}
    <div role="status" aria-live="polite" className="mt-3 text-sm text-[#13735a]">{ /^\d+ min ·/.test(message) ? <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3"><span className="flex items-center gap-2"><Footprints size={20} /><strong className="text-2xl font-semibold">{message.split(" · ")[0]}</strong></span><span className="text-sm text-slate-600">{message.split(" · ")[1]}</span></div> : message}</div>
  </TransitPanel>;
}
