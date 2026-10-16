/**
 * Timezone-safe date helpers. All cycle math is done on ISO calendar dates
 * (yyyy-mm-dd) interpreted as UTC midnights, so results never depend on the
 * user's timezone or DST.
 */

const DAY_MS = 86_400_000;

/** Parse an ISO date (yyyy-mm-dd) as a UTC-midnight Date. */
export function parseDay(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Format a Date as an ISO calendar date (yyyy-mm-dd), in UTC. */
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's ISO calendar date (UTC). */
export function todayISO(now: Date = new Date()): string {
  return toISODate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

/** Add `n` days to an ISO date, returning an ISO date. */
export function addDays(iso: string, n: number): string {
  return toISODate(new Date(parseDay(iso).getTime() + n * DAY_MS));
}

/** Whole days from `fromIso` to `toIso` (b − a). */
export function diffDays(fromIso: string, toIso: string): number {
  return Math.round((parseDay(toIso).getTime() - parseDay(fromIso).getTime()) / DAY_MS);
}

/** Is `a` strictly before `b`? */
export function isBefore(a: string, b: string): boolean {
  return a < b;
}

/** Human label like "Tue, 12 Feb". */
export function formatDay(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...opts,
  }).format(parseDay(iso));
}

/** Human relative label: "Today", "Tomorrow", "In 5 days", "2 days ago". */
export function relativeDay(iso: string, today: string): string {
  const d = diffDays(today, iso);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  if (d > 1) return `In ${d} days`;
  return `${-d} days ago`;
}

/** First day (ISO) of the month containing `iso`. */
export function monthStart(iso: string): string {
  return `${iso.slice(0, 8)}01`;
}

/** Move an ISO date to a neighbouring month. delta=+1 next month, -1 previous. */
export function shiftMonth(iso: string, delta: number): string {
  const [y, m] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return toISODate(d);
}
