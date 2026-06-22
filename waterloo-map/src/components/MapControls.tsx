import { LocateFixed, RotateCcw } from "lucide-react";

type MapControlsProps = {
  is3D: boolean;
  onReset: () => void;
  onToggleView: () => void;
  onFlyToMe: () => void;
};

function ControlButton({
  label,
  children,
  onClick,
  isActive = false,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`
        group relative flex h-12 w-12 items-center justify-center
        rounded-full border border-slate-200
        bg-white/95 text-slate-700 shadow-lg backdrop-blur
        transition-all duration-150 hover:scale-105 hover:bg-slate-50
        ${isActive ? "bg-green-50 text-green-700" : ""}
      `}
    >
      <span
        className="
          pointer-events-none absolute right-14 top-1/2
          -translate-y-1/2 whitespace-nowrap rounded-lg
          bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white
          opacity-0 shadow-md transition-opacity duration-150
          group-hover:opacity-100
        "
      >
        {label}
      </span>

      {children}
    </button>
  );
}

export default function MapControls({
  is3D,
  onReset,
  onToggleView,
  onFlyToMe,
}: MapControlsProps) {
  return (
    <div className="absolute bottom-24 right-4 z-20 flex flex-col gap-3">
      <ControlButton label="Reset view" onClick={onReset}>
        <RotateCcw size={19} />
      </ControlButton>

      <ControlButton
        label={is3D ? "Switch to 2D" : "Switch to 3D"}
        onClick={onToggleView}
        isActive={is3D}
      >
        <span className="text-sm font-bold">{is3D ? "3D" : "2D"}</span>
      </ControlButton>

      <ControlButton label="Fly to me" onClick={onFlyToMe}>
        <LocateFixed size={19} />
      </ControlButton>
    </div>
  );
}
