import { LocateFixed, RotateCcw } from "lucide-react";

type MapControlsProps = {
  is3D: boolean;
  onReset: () => void;
  onToggleView: () => void;
  onFlyToMe: () => void;
};

//react.
function ControlButton({
  label,
  children,
  onClick,
  isActive = false,
  style,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={style}
      className={`
        group relative flex h-12 w-12 items-center justify-center
        rounded-full border border-slate-200
        bg-white/95 text-slate-700 shadow-lg backdrop-blur
        transition-all duration-150 hover:scale-105 hover:bg-slate-50
        cursor-pointer
        ${isActive ? "bg-green-50 text-green-700" : ""}
      `}
    >
      <span
        className="
          pointer-events-none absolute right-14 top-1/2
          -translate-y-1/2 whitespace-nowrap rounded-lg
          bg-white px-2.5 py-1.5 text-xs font-medium text-black
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
    // <div className="absolute bottom-24 right-4 z-20 flex flex-col gap-3">
    // <ControlButton label="Reset view" onClick={onReset}>
    //   <RotateCcw size={19} />
    // </ControlButton>

    // <ControlButton
    //   label={is3D ? "Switch to 2D" : "Switch to 3D"}
    //   onClick={onToggleView}
    //   isActive={is3D}
    // >
    //     <span className="text-sm font-bold">{is3D ? "3D" : "2D"}</span>
    //   </ControlButton>

    // <ControlButton label="Fly to me" onClick={onFlyToMe}>
    //   <LocateFixed size={19} />
    // </ControlButton>
    // </div>
    <div className="absolute bottom-16 right-8">
      <div className="fab fab-flower">
        {/* a focusable div with tabIndex is necessary to work on all browsers. role="button" is necessary for accessibility */}
        <div
          tabIndex={0}
          role="button"
          className="btn btn-lg btn-info btn-circle w-14 h-14 "
        >
          F
        </div>
        {/* Main Action button replaces the original button when FAB is open */}
        <button className="fab-main-action btn btn-circle btn-lg btn-success z-10 w-14 h-14">
          M
        </button>
        {/* buttons that show up when FAB is open */}
        {/* If you want to add more buttons, u can remove the style, otherwise if u 
        remove more then you want to change the style of the degrees, so we're modifying 
        the original degrees for the built-in components*/}
        <ControlButton
          label={is3D ? "Switch to 2D" : "Switch to 3D"}
          onClick={onToggleView}
          isActive={is3D}
          style={{ "--degree": "180deg" } as React.CSSProperties}
        >
          <span className="text-sm font-bold">{is3D ? "3D" : "2D"}</span>
        </ControlButton>
        <ControlButton
          label="Reset view"
          onClick={onReset}
          style={{ "--degree": "135deg" } as React.CSSProperties}
        >
          <RotateCcw size={19} />
        </ControlButton>
        <ControlButton
          label="Fly to me"
          onClick={onFlyToMe}
          style={{ "--degree": "90deg" } as React.CSSProperties}
        >
          <LocateFixed size={19} />
        </ControlButton>
      </div>
    </div>
  );
}
