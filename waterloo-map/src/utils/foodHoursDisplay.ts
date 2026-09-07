/** Keep undated guidance; hide dated exceptions only after their final calendar day. */
export function isCurrentFoodException(note: string, today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())) {
  const prefix = note.split(':')[0];
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const match = prefix.match(/^\s*([A-Za-z]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?(?:\s*[-–—]\s*(?:([A-Za-z]+)\s+)?(\d{1,2})(?:,?\s+(\d{4}))?)?\s*$/);
  if (!match) return true;
  const startMonth = months.indexOf(match[1].slice(0,3).toLowerCase());
  const month = months.indexOf((match[4] ?? match[1]).slice(0,3).toLowerCase());
  if (month < 0 || startMonth < 0) return true;
  const year = Number(match[6] ?? match[3] ?? today.slice(0,4)) + (!match[6] && month < startMonth ? 1 : 0);
  const end = `${year}-${String(month+1).padStart(2,'0')}-${String(match[5] ?? match[2]).padStart(2,'0')}`;
  return end >= today;
}
export const splitFoodMealHours = (hours: string) => hours.split(/\s*[·•]\s*|\n/).filter(Boolean);
