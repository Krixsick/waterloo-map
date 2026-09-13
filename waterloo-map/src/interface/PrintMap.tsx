import { useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Printer, X, ExternalLink } from "lucide-react";
import { buildings } from "../data/buildings";
import { PRINT_SOURCE, printLocations } from "../data/printLocations";
const locations = Object.entries(printLocations).map(([id, rooms]) => {
 const building = buildings.features.find(b => b.properties.id === id);
 return {id, rooms, name: building?.properties.name ?? "School of Pharmacy", abbreviation: building?.properties.abbreviation ?? "PHR", coordinates: (building?.geometry.coordinates ?? [-80.499052778119,43.452784220433]) as [number,number]};
});
export default function PrintMap({map,onClose}:{map:mapboxgl.Map;onClose:()=>void}) {
 const [selected,setSelected]=useState<string|null>(null);
 const location=locations.find(p=>p.id===selected);
 useEffect(()=>{
  const popup=new mapboxgl.Popup({closeButton:false,offset:12,className:"print-hover"});
  const markers=locations.map(place=>{
   const button=document.createElement("button");button.type="button";button.dataset.foodMarker="true";
   button.className="flex h-5 w-5 items-center justify-center rounded-md border border-white bg-indigo-700 text-white shadow-sm cursor-pointer";
   button.setAttribute("aria-label",`Printing: ${place.name}`);
   button.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6Z"/></svg>';
   button.onmouseenter=()=>{map.getContainer().dataset.foodHover="true";map.getContainer().dispatchEvent(new Event("food-preview-open"));const content=document.createElement("div");content.className="text-ui-meta p-2";const title=document.createElement("p");title.className="text-ui-value text-indigo-800";title.textContent=`${place.abbreviation} · Printing`;const text=document.createElement("p");text.textContent=place.rooms.length===1?place.rooms[0]:`${place.rooms.length} print locations`;content.append(title,text);popup.setLngLat(place.coordinates).setDOMContent(content).addTo(map);};
   button.onmouseleave=()=>{delete map.getContainer().dataset.foodHover;popup.remove();};
   button.onclick=e=>{e.stopPropagation();delete map.getContainer().dataset.foodHover;popup.remove();setSelected(place.id);};
   return new mapboxgl.Marker({element:button}).setLngLat(place.coordinates).addTo(map);
  });
  return ()=>{markers.forEach(m=>m.remove());popup.remove();delete map.getContainer().dataset.foodHover;};
 },[map]);
 return <section aria-label="Print locations" className="absolute left-3 top-36 z-30 w-80 max-w-[calc(100%-1.5rem)] max-h-[calc(100%-10rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:left-5">
  <header className="flex items-center gap-2 text-indigo-700"><Printer size={22}/><h2 className="text-ui-title flex-1">Print</h2><button aria-label="Close print" onClick={onClose}><X size={20}/></button></header>
  <p className="text-ui-meta mt-2 text-slate-500">W Print self-serve · {locations.length} buildings</p>
  <div className="my-3 flex gap-3 text-ui-meta text-indigo-700"><a href="https://wprint.ca" target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-2">Upload a document <ExternalLink size={14}/></a></div>
  <p className="text-ui-meta text-slate-500">Sign in with WatIAM online; tap your WatCard at the printer to release your job. Access follows building hours.</p>
  {location ? <div className="mt-4"><button className="text-ui-meta text-indigo-700" onClick={()=>setSelected(null)}>← All locations</button><h3 className="text-ui-value mt-2">{location.name}</h3><ul className="mt-2 space-y-2">{location.rooms.map(room=><li key={room} className="text-ui-meta rounded-xl bg-indigo-50 p-3 text-indigo-900">{room}</li>)}</ul></div> : <div className="mt-4 space-y-1">{locations.map(place=><button key={place.id} className="flex w-full items-center gap-2 rounded-xl p-2 text-left hover:bg-indigo-50" onClick={()=>{setSelected(place.id);map.flyTo({center:place.coordinates,zoom:17});}}><Printer size={16} className="text-indigo-700"/><span className="text-ui-meta">{place.abbreviation} · {place.name}</span></button>)}</div>}
  <a href={PRINT_SOURCE} target="_blank" rel="noreferrer" className="text-ui-meta mt-4 block text-indigo-700 underline">Official locations & instructions</a>
 </section>;
}
