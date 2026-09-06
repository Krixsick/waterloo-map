import type { FoodInfo } from "../api/foodApi";
import { formatDisplayTime } from "../utils/timeFormat";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function FoodHours({ hours, exceptions }: Pick<FoodInfo, "hours" | "exceptions">) {
  const groups: { first: number; last: number; hours: string }[] = [];
  days.forEach((day, index) => {
    const value = hours?.[day];
    if (!value) return;
    const previous = groups.at(-1);
    if (previous && previous.last === index - 1 && previous.hours === value) previous.last = index;
    else groups.push({ first: index, last: index, hours: value });
  });
  if (!groups.length) return null;
  return <section className="mb-4" aria-label="Hours">
    <p className="text-ui-label text-slate-500">Hours</p>
    <dl className="mt-2 space-y-2">
      {groups.map(group => <div key={group.first} className="text-ui-meta grid grid-cols-[6rem_minmax(0,1fr)] gap-3">
        <dt className="text-slate-500">{days[group.first].slice(0, 3)}{group.last !== group.first && ` – ${days[group.last].slice(0, 3)}`}</dt>
        <dd className="text-right font-medium text-slate-700">{formatDisplayTime(group.hours)}</dd>
      </div>)}
    </dl>
    {exceptions?.map(note => <p key={note} className="text-ui-meta mt-2 leading-relaxed text-slate-500">{formatDisplayTime(note)}</p>)}
  </section>;
}
