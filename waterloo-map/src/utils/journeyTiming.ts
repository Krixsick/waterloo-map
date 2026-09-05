export const BOARDING_BUFFER_SECONDS = 120;
export function journeyTiming(now: number, departure: number, arrival: number, accessSeconds: number, egressSeconds: number) {
  if (![now,departure,arrival,accessSeconds,egressSeconds].every(Number.isFinite) || accessSeconds < 0 || egressSeconds < 0 || arrival <= departure) return null;
  const leaveBy = departure - (accessSeconds + BOARDING_BUFFER_SECONDS) * 1000;
  if (now > leaveBy) return null;
  const finalArrival = arrival + egressSeconds * 1000;
  return { leaveBy, finalArrival, minutes: Math.ceil((finalArrival-now)/60000), accessMinutes: Math.ceil(accessSeconds/60), egressMinutes: Math.ceil(egressSeconds/60), waitMinutes: Math.floor((departure-now-accessSeconds*1000)/60000), rideMinutes: Math.ceil((arrival-departure)/60000) };
}
export type RankedJourney = { mode: string; route: string; tripId: string; finalArrival: number; walkSeconds: number; leaveBy: number };
export function rankJourneys<T extends RankedJourney>(options: T[], now: number): T[] {
  const feasible = options.filter(o => o.leaveBy >= now).sort((a,b)=>a.finalArrival-b.finalArrival || a.walkSeconds-b.walkSeconds);
  // Same-vehicle alternatives only survive when they offer less walking.
  const useful = feasible.filter((o,i)=>!feasible.some((other,j)=>j!==i && other.mode===o.mode && other.tripId===o.tripId && other.finalArrival<=o.finalArrival && other.walkSeconds<=o.walkSeconds && (other.finalArrival<o.finalArrival || other.walkSeconds<o.walkSeconds || j<i)));
  // Prefer distinct services; don't fill the list with later runs of the same route.
  return useful.filter((o,i)=>!useful.slice(0,i).some(other=>other.mode===o.mode && other.route===o.route && other.finalArrival<=o.finalArrival && other.walkSeconds<=o.walkSeconds)).slice(0,3);
}
