import { FOOD_CATEGORY_DETAILS, FOOD_CATEGORY_COLOURS } from "../data/foodCategoryDetails";
import { formatDisplayTime } from "../utils/timeFormat";
import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { FoodInfo } from "../api/foodApi";
import { buildings } from "../data/buildings";
import { getWeeklyFoodStatus } from "../utils/timeUtils";
import { getSpecialFoodHoursForToday } from "./FoodDetailsCard";

export function foodIsOpen(food: FoodInfo) {
  const day = new Intl.DateTimeFormat("en-CA", { weekday: "long", timeZone: "America/Toronto" }).format(new Date());
  return getWeeklyFoodStatus(food.hours, getSpecialFoodHoursForToday(food) ?? food.hours?.[day] ?? null).isOpen;
}
export const foodMapKey = (food: FoodInfo) => food.buildingId ?? `off-campus:${food.coordinates?.join(",") ?? food.id}`;

export function FoodMarkers({ map, foods, allFoods, onSelect, preview = false }: { preview?: boolean; map: mapboxgl.Map; foods: FoodInfo[]; allFoods: FoodInfo[]; onSelect: (id: string) => void }) {
  useEffect(() => {
    const groups = new Map<string, FoodInfo[]>();
    foods.forEach(food => groups.set(foodMapKey(food), [...(groups.get(foodMapKey(food)) ?? []), food]));
    const markers: mapboxgl.Marker[] = [];
    const popup = new mapboxgl.Popup({closeButton:false,closeOnClick:false,offset:12,className:"food-hover-popup"});
    groups.forEach((vendors, id) => {
      const total = allFoods.filter(food => foodMapKey(food) === id).length;
      const building = buildings.features.find(b => b.properties.id === id);
      const coordinates = vendors[0].coordinates ?? building?.geometry.coordinates as [number, number] | undefined;
      if (!coordinates) return;
      const open = preview || vendors.some(foodIsOpen);
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.foodMarker = "true";
      button.className = `relative flex h-4 w-4 cursor-pointer items-center justify-center rounded-[4px] border shadow-sm ${open ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-400 bg-white text-slate-500"}`;
      button.setAttribute("aria-label", `${building?.properties.name ?? vendors[0].location}: ${vendors.map(v => v.name).join(", ")}. ${open ? "Food open now" : "Closed or hours unconfirmed"}`);
      const showPreview = () => {
        map.getContainer().dataset.foodHover = "true";
        map.getContainer().dispatchEvent(new Event("food-preview-open"));
        const card=document.createElement("div");card.className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg";
        const title=document.createElement("p");title.className="text-ui-value text-slate-900";title.textContent=total===1?vendors[0].name:`${total} food spots here`;card.append(title);
        const place=document.createElement("p");place.className="text-ui-meta mt-1 text-slate-500";place.textContent=building?.properties.abbreviation ?? vendors[0].location ?? "Off campus";card.append(place);
        const day=new Intl.DateTimeFormat("en-CA",{weekday:"long",timeZone:"America/Toronto"}).format(new Date());
        const openVendors = vendors.filter(food => preview || foodIsOpen(food));
        openVendors.slice(0,3).forEach(food=>{
          const row=document.createElement("div");row.className=total > 1 ? "mt-3 border-t border-slate-100 pt-2" : "mt-2";
          const name=document.createElement("p");name.className="text-ui-value text-slate-900";name.textContent=food.name;
          const hours=document.createElement("p");hours.className="mt-1 text-ui-meta text-emerald-700";
          hours.textContent=formatDisplayTime(getSpecialFoodHoursForToday(food) ?? food.hours?.[day] ?? "Preview");
          if (total > 1) row.append(name);
          const badge=document.createElement("span");badge.className=`mt-1 inline-block rounded-md px-2 py-0.5 text-ui-meta ${FOOD_CATEGORY_COLOURS[food.category]}`;badge.textContent=FOOD_CATEGORY_DETAILS[food.category].label;row.append(badge);
          row.append(hours);card.append(row);
        });
        if (total > 1 || !openVendors.length) {
        const status=document.createElement("p");status.className="mt-2 text-xs font-medium text-emerald-700";
        status.textContent=openVendors.length ? `${openVendors.length} open now${openVendors.length>3 ? ` · +${openVendors.length-3} more` : ""}` : "No confirmed open spots right now";card.append(status);
        }
        const hint=document.createElement("p");hint.className="mt-2 text-xs font-medium text-emerald-700";hint.textContent=total>1?"View all food spots →":"View details →";card.append(hint);
        popup.setLngLat(coordinates).setDOMContent(card).addTo(map);
      };
      button.onmouseenter=showPreview;button.onfocus=showPreview;button.onmouseleave=()=>{delete map.getContainer().dataset.foodHover;popup.remove();};button.onblur=()=>{delete map.getContainer().dataset.foodHover;popup.remove();};
      const category = vendors.length === 1 ? vendors[0].category : "restaurant";
      const paths = category === "dessert" ? '<path d="M4 13h16a8 8 0 0 1-16 0Z M8 21h8 M7 12a4 4 0 0 1 5-6 4 4 0 0 1 5 6"/>' : category === "cafe" ? '<path d="M4 8h12v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z M16 8h2a3 3 0 0 1 0 6h-2 M7 3v2 M12 3v2"/>' : category === "convenience" ? '<path d="M5 7h14l1 14H4L5 7Z M9 7V5a3 3 0 0 1 6 0v2"/>' : '<path d="M4 3v6a3 3 0 0 0 6 0V3 M7 3v18 M20 21V3c-4 2-5 8 0 9"/>';
      button.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
      button.onclick = e => { e.stopPropagation(); delete map.getContainer().dataset.foodHover; popup.remove(); onSelect(id); };
      markers.push(new mapboxgl.Marker({ element: button }).setLngLat(coordinates).addTo(map));
    });
    return () => {delete map.getContainer().dataset.foodHover;popup.remove();markers.forEach(marker => marker.remove());};
  }, [map, foods, allFoods, onSelect, preview]);
  return <style>{`.food-hover-popup{pointer-events:none;font-family:var(--font-title)}.food-hover-popup .mapboxgl-popup-content{font-family:var(--font-title);padding:0;background:transparent;box-shadow:none;border-radius:16px}.food-hover-popup .mapboxgl-popup-tip{border-top-color:white}`}</style>;
}
