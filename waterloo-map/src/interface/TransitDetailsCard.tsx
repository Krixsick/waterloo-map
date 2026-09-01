import { BusFront, TrainFront, X } from "lucide-react";
import type { ReactNode } from "react";

import {
  useTransitDepartures,
  useTransitTripDetails,
} from "../api/transitApi";
import type {
  TransitDeparture,
  TransitMode,
  TransitSelection,
  TransitTripStop,
} from "../types/transit";

type TransitDetailsCardProps = {
  selection: TransitSelection | null;
  onClose: () => void;
};

function destination(headsign: string | null, routeId: string) {
  if (!headsign) return `Route ${routeId}`;
  return headsign.startsWith(`${routeId} `)
    ? headsign.slice(routeId.length + 1)
    : headsign;
}

function departureTime(value: string | null) {
  if (!value) return "--";
  const minutes = Math.ceil((new Date(value).getTime() - Date.now()) / 60_000);
  if (minutes <= 0) return "Due";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

function clockTime(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function directionLabel(trip: {
  directionId: number | null;
  nextStops: TransitTripStop[];
}) {
  const namedDirection = trip.nextStops
    .map((stop) =>
      stop.name.match(/\b(northbound|southbound|eastbound|westbound)\b/i),
    )
    .find(Boolean)?.[1];

  if (namedDirection) {
    return (
      namedDirection[0].toUpperCase() + namedDirection.slice(1).toLowerCase()
    );
  }
  if (trip.directionId === 0) return "Outbound";
  if (trip.directionId === 1) return "Inbound";
  return "Not provided";
}

function ModeIcon({ mode }: { mode: TransitMode }) {
  return mode === "ion" ? <TrainFront size={18} /> : <BusFront size={18} />;
}

function RouteBadge({ mode, routeId }: { mode: TransitMode; routeId: string }) {
  return (
    <span
      className={`font-title flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md px-2 text-xs font-bold text-white ${
        mode === "ion" ? "bg-pink-600" : "bg-blue-600"
      }`}
    >
      {routeId}
    </span>
  );
}

function Panel({
  title,
  subtitle,
  mode,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  mode: TransitMode;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <section className="absolute left-3 top-24 z-30 max-h-[calc(100vh-8rem)] w-[calc(100%-1.5rem)] max-w-sm overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl sm:left-5 sm:w-[calc(100%-2.5rem)]">
      <header className="flex items-start gap-3 border-b border-slate-200 p-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${
            mode === "ion" ? "bg-pink-600" : "bg-blue-600"
          }`}
        >
          <ModeIcon mode={mode} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-ui-title truncate text-slate-900">
            {title}
          </h2>
          <p className="text-ui-meta mt-0.5 text-slate-500">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          aria-label="Close transit details"
        >
          <X size={18} />
        </button>
      </header>

      {children}
    </section>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-4 p-4" aria-label="Loading transit information">
      {[1, 2, 3].map((row) => (
        <div key={row} className="flex animate-pulse items-center gap-3">
          <div className="h-8 w-10 rounded-md bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-slate-200" />
            <div className="h-2 w-1/3 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DepartureRow({ departure }: { departure: TransitDeparture }) {
  const time = departure.predictedAt ?? departure.scheduledAt;

  return (
    <li className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <RouteBadge mode={departure.mode} routeId={departure.routeId} />
      <div className="min-w-0 flex-1">
        <p className="text-ui-value truncate text-slate-800">
          {destination(departure.headsign, departure.routeId)}
        </p>
        <p className="text-ui-meta mt-0.5 text-slate-500">
          {departure.mode === "ion" ? "ION" : "Bus"} ·{" "}
          {departure.isRealtime ? "Predicted arrival" : "Scheduled arrival"}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-ui-value font-semibold text-slate-900">
          {departureTime(time)}
        </p>
        <p className="font-title text-[11px] text-slate-500">{clockTime(time)}</p>
      </div>
    </li>
  );
}

function StopDetails({
  selection,
  onClose,
}: {
  selection: Extract<TransitSelection, { type: "stop" }>;
  onClose: () => void;
}) {
  const { stop } = selection;
  const { data, isPending, isError } = useTransitDepartures(stop.stopId);
  const departures = data?.data ?? [];
  const routes = stop.routeIds.join(", ");

  return (
    <Panel
      title={stop.name}
      subtitle={`${stop.mode === "ion" ? "ION station" : "Bus stop"} - Routes ${routes}`}
      mode={stop.mode}
      onClose={onClose}
    >
      <div className="text-ui-label px-4 pt-4 text-slate-500">
        Upcoming departures
      </div>
      {isPending ? (
        <LoadingRows />
      ) : isError ? (
        <p className="font-title p-4 text-sm text-red-600">Departure information unavailable.</p>
      ) : departures.length ? (
        <ul className="px-4 pb-2">
          {departures.map((departure) => (
            <DepartureRow key={departure.id} departure={departure} />
          ))}
        </ul>
      ) : (
        <p className="font-title p-4 text-sm text-slate-500">No upcoming departures found.</p>
      )}
    </Panel>
  );
}

function TripStopRow({ stop }: { stop: TransitTripStop }) {
  const time = stop.predictedAt ?? stop.scheduledAt;

  return (
    <li className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300" />
      <div className="min-w-0 flex-1">
        <p className="text-ui-value truncate text-slate-800">{stop.name}</p>
        <p className="text-ui-meta mt-0.5 text-slate-500">
          {stop.isRealtime ? "Predicted arrival" : "Scheduled arrival"}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-ui-value font-semibold text-slate-900">
          {departureTime(time)}
        </p>
        <p className="text-[11px] text-slate-500">{clockTime(time)}</p>
      </div>
    </li>
  );
}

function VehicleDetails({
  selection,
  onClose,
}: {
  selection: Extract<TransitSelection, { type: "vehicle" }>;
  onClose: () => void;
}) {
  const { vehicle } = selection;
  const { data, isPending, isError } = useTransitTripDetails(vehicle);
  const trip = data?.data;
  const label = vehicle.mode === "ion" ? "ION" : "Bus";
  const status = vehicle.currentStatus?.replaceAll("-", " ") ?? "live vehicle";
  const vehicleDestination = trip
    ? destination(trip.headsign, trip.routeId)
    : null;

  return (
    <Panel
      title={`${label} ${vehicle.routeId ?? ""}`.trim()}
      subtitle={status[0].toUpperCase() + status.slice(1)}
      mode={vehicle.mode}
      onClose={onClose}
    >
      {isPending ? (
        <LoadingRows />
      ) : isError || !trip ? (
        <p className="font-title p-4 text-sm text-red-600">Trip information unavailable.</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-4 border-b border-slate-200 p-4">
            <div className="min-w-0">
              <dt className="text-ui-label text-slate-500">Destination</dt>
              <dd className="text-ui-value mt-1 truncate font-semibold text-slate-900">
                {vehicleDestination}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-ui-label text-slate-500">Direction</dt>
              <dd className="text-ui-value mt-1 font-semibold text-slate-900">
                {directionLabel(trip)}
              </dd>
            </div>
          </dl>

          <div className="text-ui-label px-4 pt-4 text-slate-500">
            Next three stops
          </div>
          {trip.nextStops.length ? (
            <ul className="px-4 pb-2">
              {trip.nextStops.map((stop) => (
                <TripStopRow
                  key={`${stop.stopId}:${stop.sequence}`}
                  stop={stop}
                />
              ))}
            </ul>
          ) : (
            <p className="font-title p-4 text-sm text-slate-500">
              No remaining stops found.
            </p>
          )}
        </>
      )}
    </Panel>
  );
}

export default function TransitDetailsCard({
  selection,
  onClose,
}: TransitDetailsCardProps) {
  if (!selection) return null;
  return selection.type === "stop" ? (
    <StopDetails selection={selection} onClose={onClose} />
  ) : (
    <VehicleDetails selection={selection} onClose={onClose} />
  );
}
