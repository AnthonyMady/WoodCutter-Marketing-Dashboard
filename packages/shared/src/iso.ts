// ISO week + month helpers. Pure functions, deterministic on input date —
// no Date.now() so the same row always produces the same week label.

/** ISO 8601 week number per row (Mon=1..Sun=7). */
export function isoWeekOf(date: Date): number {
  // Copy to avoid mutating caller's Date; clamp to UTC noon.
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Thursday in current week determines the year of the ISO week.
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/** ISO week year (the year that owns this date's ISO week — handles year boundaries). */
export function isoWeekYearOf(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

/** "2026-W23" style key. */
export function isoWeekKey(date: Date): string {
  return `${isoWeekYearOf(date)}-W${String(isoWeekOf(date)).padStart(2, "0")}`;
}

/** "2026-05" style month key. */
export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * The previous *completed* calendar month relative to `now`.
 * If today is June 1, returns May (2026-05).
 * If today is June 15, also returns May (2026-05).
 *
 * The legacy dashboard called this `prevMonthKey()` and used it for the
 * "city tips previous month" and "city F&B previous month" charts. The dynamic
 * behaviour is load-bearing: the chart auto-advances on month rollover.
 */
export function prevMonthKey(now: Date): string {
  const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lastOfPrevMonth = new Date(firstOfThisMonth.getTime() - 86_400_000);
  return monthKey(lastOfPrevMonth);
}

/** Human-readable label for the previous completed month (e.g. "May 2026"). */
export function prevMonthLabel(now: Date): string {
  const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lastOfPrevMonth = new Date(firstOfThisMonth.getTime() - 86_400_000);
  return lastOfPrevMonth.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** YTD start = Jan 1 of `now`'s year (UTC). */
export function ytdStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
}
