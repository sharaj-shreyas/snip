/** The user's local calendar date as `YYYY-MM-DD`. */
export function localDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Midnight at the start of the user's local day, as a Date. */
export function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Local `YYYY-MM-DD` for `days` days before today. */
export function localDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return localDateString(d);
}
