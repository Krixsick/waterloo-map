import { formatDisplayTime } from "../utils/timeFormat";
import { FOOD_CATEGORY_DETAILS } from "../data/foodCategoryDetails";
import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { FoodInfo } from "../api/foodApi";
import { buildings } from "../data/buildings";
import { getFoodOpenStatus } from "../utils/timeUtils";
import { getSpecialFoodHoursForToday } from "./FoodDetailsCard";

export function foodIsOpen(food: FoodInfo) {
  const day = new Intl.DateTimeFormat("en-CA", { weekday: "long", timeZone: "America/Toronto" }).format(new Date());
  return getFoodOpenStatus(getSpecialFoodHoursForToday(food) ?? food.hours?.[day] ?? null).isOpen;
}
export function FoodMarkers({ map, foods, onSelect, preview = false }: { preview?: boolean; map: mapboxgl.Map; foods: FoodInfo[]; onSelect: (id: string) => void }) {
  useEffect(() => {
    const groups = new Map<string, FoodInfo[]>();
    foods.forEach(food => groups.set(food.buildingId, [...(groups.get(food.buildingId) ?? []), food]));
    const markers: mapboxgl.Marker[] = [];
    const popup = new mapboxgl.Popup({closeButton:false,closeOnClick:false,offset:12,className:"food-hover-popup"});
    groups.forEach((vendors, id) => {
      const building = buildings.features.find(b => b.properties.id === id);
      if (!building) return;
      const open = preview || vendors.some(foodIsOpen);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `relative flex h-4 w-4 cursor-pointer items-center justify-center rounded-[4px] border shadow-sm ${open ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-400 bg-white text-slate-500"}`;
      button.setAttribute("aria-label", `${building.properties.name}: ${vendors.map(v => v.name).join(", ")}. ${open ? "Food open now" : "Closed or hours unconfirmed"}`);
      const showPreview = () => {
        map.getContainer().dataset.foodHover = "true";
        map.getContainer().dispatchEvent(new Event("food-preview-open"));
        const card=document.createElement("div");card.className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg";
        const title=document.createElement("p");title.className="text-sm font-semibold text-slate-900";title.textContent=vendors.length===1?vendors[0].name:`${vendors.length} food spots here`;card.append(title);
        const day=new Intl.DateTimeFormat("en-CA",{weekday:"long",timeZone:"America/Toronto"}).format(new Date());
        vendors.slice(0,3).forEach(food=>{
          const row=document.createElement("p");row.className="mt-2 text-xs text-slate-600";
          const hours=getSpecialFoodHoursForToday(food) ?? food.hours?.[day] ?? "Hours unconfirmed";
          row.textContent=`${vendors.length>1?food.name:FOOD_CATEGORY_DETAILS[food.category].label} · ${formatDisplayTime(hours)}`;card.append(row);
        });
        const hint=document.createElement("p");hint.className="mt-2 text-xs font-medium text-emerald-700";hint.textContent=vendors.length>1?"Click to view all food spots":"Click for food details";card.append(hint);
        popup.setLngLat(building.geometry.coordinates as [number,number]).setDOMContent(card).addTo(map);
      };
      button.onmouseenter=showPreview;button.onfocus=showPreview;button.onmouseleave=()=>{delete map.getContainer().dataset.foodHover;popup.remove();};button.onblur=()=>{delete map.getContainer().dataset.foodHover;popup.remove();};
      const category = vendors.length === 1 ? vendors[0].category : "restaurant";
      const paths = category === "cafe" ? '<path d="M4 8h12v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z M16 8h2a3 3 0 0 1 0 6h-2 M7 3v2 M12 3v2"/>' : category === "convenience" ? '<path d="M5 7h14l1 14H4L5 7Z M9 7V5a3 3 0 0 1 6 0v2"/>' : '<path d="M4 3v6a3 3 0 0 0 6 0V3 M7 3v18 M20 21V3c-4 2-5 8 0 9"/>';
      button.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
      button.onclick = e => { e.stopPropagation(); delete map.getContainer().dataset.foodHover; popup.remove(); onSelect(id); };
      markers.push(new mapboxgl.Marker({ element: button }).setLngLat(building.geometry.coordinates as [number, number]).addTo(map));
    });
    return () => {delete map.getContainer().dataset.foodHover;popup.remove();markers.forEach(marker => marker.remove());};
  }, [map, foods, onSelect, preview]);
  return <style>{`.food-hover-popup .mapboxgl-popup-content{padding:0;background:transparent;box-shadow:none;border-radius:16px}.food-hover-popup .mapboxgl-popup-tip{border-top-color:white}`}</style>;
}
