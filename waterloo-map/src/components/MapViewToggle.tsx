type MapViewToggleProps = {
    is3D: boolean;
    onToggle: () => void;
  };
  
  export default function MapViewToggle({
    is3D,
    onToggle,
  }: MapViewToggleProps) {
    return (
      <button
        onClick={onToggle}
        className="
          absolute bottom-24 right-4 z-20
          flex h-14 w-14 items-center justify-center
          rounded-full border border-slate-200
          bg-white/95 shadow-lg backdrop-blur
          text-sm font-semibold text-slate-700
          hover:bg-slate-50
        "
      >
        {is3D ? "3D" : "2D"}
      </button>
    );
  }
  