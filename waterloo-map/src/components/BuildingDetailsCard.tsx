type SelectedBuilding = {
    id?: string;
    name?: string;
    abbreviation?: string;
    category?: string;
    liveHours?: string;
    timeRemaining?: string;
  };
  
  type BuildingDetailsCardProps = {
    building: SelectedBuilding | null;
    onClose: () => void;
  };
  
  export default function BuildingDetailsCard({
    building,
    onClose,
  }: BuildingDetailsCardProps) {
    if (!building) return null;
  
    return (
      <div className="absolute left-4 top-24 z-30 w-80 rounded-3xl border border-white/50 bg-white/80 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">
              {building.name}
            </div>
  
            <div className="mt-1 text-sm text-slate-500">
              {building.abbreviation}
            </div>
          </div>
  
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            aria-label="Close building details"
          >
            ✕
          </button>
        </div>
  
        <div className="mt-4 rounded-2xl bg-white/60 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Hours
          </div>
  
          <div className="mt-1 text-sm font-medium text-slate-700">
            {building.liveHours ?? "No live hours available"}
          </div>
  
          {building.timeRemaining && (
            <div className="mt-1 text-xs text-slate-500">
              {building.timeRemaining}
            </div>
          )}
        </div>
      </div>
    );
  }
  