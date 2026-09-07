import { LocateFixed, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import type { MapControlsProps } from "../types/map";

function ControlButton({
  label,
  tooltip = label,
  children,
  onClick,
  isActive,
}: {
  label: string;
  tooltip?: string;
  children: ReactNode;
  onClick: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      className={`group relative flex size-11 cursor-pointer items-center justify-center
        rounded-xl transition-colors duration-150
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#135f49]
        motion-reduce:transition-none
        ${
          isActive
            ? "bg-[#edf5f1] text-[#135f49] hover:bg-[#e2efe8] active:bg-[#d5e8df]"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200"
        }`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[calc(100%+14px)] top-1/2
          -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-200
          bg-white px-3 py-2 font-title text-xs font-medium text-slate-700
          opacity-0 shadow-sm transition-opacity duration-150
          group-focus-visible:opacity-100 [@media(hover:hover)]:group-hover:opacity-100
          motion-reduce:transition-none"
      >
        {tooltip}
      </span>
      {children}
    </button>
  );
}

const controlSurface =
  "flex items-center rounded-[18px] border border-slate-200 bg-white/95 p-1 shadow-[0_2px_10px_rgba(15,23,42,0.12)] backdrop-blur-md sm:block";

export default function MapControls({
  is3D,
  onReset,
  onToggleView,
  onFlyToMe,
}: MapControlsProps) {
  return (
    <div
      role="group"
      aria-label="Map controls"
      className="z-20 flex shrink-0 gap-2 sm:absolute sm:bottom-[max(4rem,env(safe-area-inset-bottom))] sm:right-5 sm:flex-col"
    >
      <div className={controlSurface}>
        <ControlButton
          label="3D view"
          tooltip={is3D ? "Switch to 2D" : "Switch to 3D"}
          onClick={onToggleView}
          isActive={is3D}
        >
          <span aria-hidden="true" className="font-title text-sm font-semibold">
            3D
          </span>
        </ControlButton>
        <div aria-hidden="true" className="mx-1 h-6 w-px bg-slate-200 sm:mx-2 sm:my-1 sm:h-px sm:w-auto" />
        <ControlButton label="Reset map and filters" onClick={onReset}>
          <RotateCcw aria-hidden="true" size={20} strokeWidth={1.8} />
        </ControlButton>
      </div>
      <div className={controlSurface}>
        <ControlButton label="Show my location" onClick={onFlyToMe}>
          <LocateFixed aria-hidden="true" size={20} strokeWidth={1.8} />
        </ControlButton>
      </div>
    </div>
  );
}
