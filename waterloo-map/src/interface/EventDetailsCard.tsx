import { formatDisplayTime } from "../utils/timeFormat";
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  LocateFixed,
  MapPin,
  Navigation,
  Ticket,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import type { MappedWaterlooEvent } from "../types/events";

type EventDetailsCardProps = {
  event: MappedWaterlooEvent | null;
  onClose: () => void;
  onRecenter: () => void;
};

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-ui-action flex min-w-20 cursor-pointer flex-col items-center gap-1.5 rounded-md px-3 py-2 text-violet-700 transition-colors hover:bg-violet-50"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-violet-100">
        <Icon className="size-5" />
      </span>
      {label}
    </button>
  );
}

function plainText(value: string | null) {
  return value
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function EventDetailsCard({
  event,
  onClose,
  onRecenter,
}: EventDetailsCardProps) {
  if (!event) return null;

  const description = plainText(event.description);

  function openExternal(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section
      aria-label={`${event.name} event details`}
      className="absolute inset-x-3 top-20 z-30 max-h-[calc(100svh-5.75rem)] overflow-y-auto rounded-lg border border-violet-100 bg-white shadow-2xl sm:left-5 sm:right-auto sm:w-[25rem]"
    >
      <header className="border-b border-slate-200 p-5">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <CalendarDays className="size-6" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-ui-label text-violet-600">
              Campus event
            </p>
            <h2 className="text-ui-title mt-1 text-slate-950">
              {event.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close event details"
            title="Close"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="size-5" />
          </button>
        </div>

        {description && (
          <p className="text-ui-body mt-4 line-clamp-5 text-slate-600">
            {description}
          </p>
        )}
      </header>

      <div className="flex justify-center gap-3 border-b border-slate-200 px-3 py-3">
        {event.mapURL && (
          <ActionButton
            icon={Navigation}
            label="Directions"
            onClick={() => openExternal(event.mapURL!)}
          />
        )}
        <ActionButton icon={LocateFixed} label="Recenter" onClick={onRecenter} />
        <ActionButton
          icon={ExternalLink}
          label="Event page"
          onClick={() => openExternal(event.detailURL)}
        />
      </div>

      <dl className="divide-y divide-slate-100 px-5">
        <div className="flex gap-4 py-4">
          <CalendarDays className="mt-0.5 size-5 shrink-0 text-violet-600" />
          <div>
            <dt className="text-ui-label text-slate-500">Date</dt>
            <dd className="text-ui-value mt-1 text-slate-800">
              {event.date ?? "Date to be announced"}
            </dd>
          </div>
        </div>

        {event.time && (
          <div className="flex gap-4 py-4">
            <Clock3 className="mt-0.5 size-5 shrink-0 text-violet-600" />
            <div>
              <dt className="text-ui-label text-slate-500">Time</dt>
              <dd className="text-ui-value mt-1 text-slate-800">
                {formatDisplayTime(event.time)}
              </dd>
            </div>
          </div>
        )}

        <div className="flex gap-4 py-4">
          <MapPin className="mt-0.5 size-5 shrink-0 text-violet-600" />
          <div>
            <dt className="text-ui-label text-slate-500">Location</dt>
            <dd className="text-ui-value mt-1 text-slate-800">
              {event.location || "University of Waterloo"}
            </dd>
          </div>
        </div>

        {(event.cost || event.registration) && (
          <div className="flex gap-4 py-4">
            <Ticket className="mt-0.5 size-5 shrink-0 text-violet-600" />
            <div>
              <dt className="text-ui-label text-slate-500">Entry</dt>
              <dd className="text-ui-value mt-1 text-slate-800">
                {[event.cost, event.registration ? "Registration required" : null]
                  .filter(Boolean)
                  .join(" · ")}
              </dd>
            </div>
          </div>
        )}

        {event.organizer && (
          <div className="flex gap-4 py-4">
            <UserRound className="mt-0.5 size-5 shrink-0 text-violet-600" />
            <div>
              <dt className="text-ui-label text-slate-500">Organizer</dt>
              <dd className="text-ui-value mt-1 text-slate-800">
                {event.organizer}
              </dd>
            </div>
          </div>
        )}
      </dl>
    </section>
  );
}
