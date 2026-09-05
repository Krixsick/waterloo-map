import { Coffee, UtensilsCrossed, ShoppingBasket, ChevronDown } from "lucide-react";
const categories = [{value:"all",label:"All food",icon:UtensilsCrossed},{value:"meals",label:"Meals",icon:UtensilsCrossed},{value:"cafe",label:"Coffee",icon:Coffee},{value:"convenience",label:"Convenience",icon:ShoppingBasket}];
export default function FoodFilters({openOnly,onOpenOnly,category,onCategory}:{openOnly:boolean;onOpenOnly:(value:boolean)=>void;category:string;onCategory:(value:string)=>void}) {
 const selected=categories.find(item=>item.value===category)!;const Icon=selected.icon;
 return <div className="flex flex-wrap items-center gap-3 p-1">
  <div className="flex rounded-full bg-slate-100 p-1">{[{value:true,label:'Open now'},{value:false,label:'All spots'}].map(item=><button type="button" key={item.label} aria-pressed={openOnly===item.value} onClick={()=>onOpenOnly(item.value)} className={`cursor-pointer rounded-full px-3 py-2 text-sm font-medium ${openOnly===item.value?'bg-white text-emerald-800 shadow-sm':'text-slate-500'}`}>{item.label}</button>)}</div>
  <details className="group relative"><summary aria-label="Food category" className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"><Icon size={16}/>{selected.label}<ChevronDown size={15} className="ml-2 group-open:rotate-180"/></summary>
   <div className="absolute right-0 top-full z-40 mt-2 min-w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">{categories.map(item=><button type="button" key={item.value} onClick={event=>{onCategory(item.value);event.currentTarget.closest('details')?.removeAttribute('open');}} className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${category===item.value?'bg-emerald-50 text-emerald-800':'text-slate-600 hover:bg-slate-50'}`}><item.icon size={17}/>{item.label}</button>)}</div>
  </details>
 </div>;
}
