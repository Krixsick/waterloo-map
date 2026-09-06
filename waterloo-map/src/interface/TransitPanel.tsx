import { BusFront, X } from "lucide-react";
import type { ReactNode } from "react";

export default function TransitPanel({ tab, onExplore, onPlan, onClose, children }: { tab: "explore" | "plan"; onExplore: () => void; onPlan: () => void; onClose: () => void; children: ReactNode }) {
  return <section aria-label="Transit" className="absolute left-3 right-3 top-36 z-30 max-h-[calc(100svh-10rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-md sm:left-5 sm:right-auto sm:w-[25rem]">
    <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold text-[#13735a]"><BusFront size={20} />Transit</h2><button type="button" onClick={onClose} aria-label="Close transit" className="cursor-pointer rounded-full p-2 hover:bg-slate-100"><X size={18} /></button></div>
    <div className="mt-3 flex rounded-xl bg-emerald-50 p-1" aria-label="Transit view">
      {([['explore','Explore routes',onExplore],['plan','Plan a trip',onPlan]] as const).map(([value,label,action])=><button type="button" key={value} aria-pressed={tab===value} onClick={action} className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors ${tab===value ? 'bg-[#13735a] font-medium text-white' : 'text-[#13735a]'}`}>{label}</button>)}
    </div>
    {children}
  </section>;
}
