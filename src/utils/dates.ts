const WEEKDAYS = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];

/**
 * Local calendar date as YYYY-MM-DD. Deliberately not toISOString(), which is
 * UTC and would turn the day over at 01:00/02:00 in Serbia instead of midnight.
 */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Noon rather than midnight, so a daylight-saving shift can't slip the date. */
function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function shiftDateKey(key: string, days: number): string {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function weekdayShort(key: string): string {
  return WEEKDAYS[dateFromKey(key).getDay()];
}

export function dayOfMonth(key: string): number {
  return dateFromKey(key).getDate();
}

/** "Danas", "Juče", "Sutra", or e.g. "Pon 8.9." */
export function dayLabel(key: string, todayKey: string): string {
  if (key === todayKey) return 'Danas';
  if (key === shiftDateKey(todayKey, -1)) return 'Juče';
  if (key === shiftDateKey(todayKey, 1)) return 'Sutra';
  const date = dateFromKey(key);
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}.`;
}

/** Sentence ending such as "za danas", "za juče" or "za 8.9." */
export function forDay(key: string, todayKey: string): string {
  if (key === todayKey) return 'za danas';
  if (key === shiftDateKey(todayKey, -1)) return 'za juče';
  if (key === shiftDateKey(todayKey, 1)) return 'za sutra';
  const date = dateFromKey(key);
  return `za ${date.getDate()}.${date.getMonth() + 1}.`;
}
