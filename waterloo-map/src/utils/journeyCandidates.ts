import type { TransitStop } from "../types/transit";

// Keep every nearby stop on a shared route; the closest stops can all serve
// the wrong direction or a different route.
export function journeyCandidates(starts: TransitStop[], ends: TransitStop[]) {
  const sharesRoute = (a: TransitStop, b: TransitStop) => a.mode === b.mode && a.routeIds.some(route => b.routeIds.includes(route));
  return {
    from: starts.filter(start => ends.some(end => sharesRoute(start, end))),
    to: ends.filter(end => starts.some(start => sharesRoute(start, end))),
  };
}

export async function mapLimited<T, R>(items: T[], task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  await Promise.all(Array.from({ length: Math.min(4, items.length) }, async () => {
    while (index < items.length) { const current = index++; results[current] = await task(items[current]); }
  }));
  return results;
}
