// Centralised date helpers.
//
// The product operates in Dubai time (Asia/Dubai, UTC+4). Instant timestamps
// (created_at, submitted_at, decided_at, …) are stored as UTC `timestamptz`
// values — an instant is timezone-independent and is rendered in Dubai by the
// frontend. These helpers exist for the cases where a *calendar* value is
// derived server-side (today's date, the current year) and must reflect the
// Dubai day rather than the UTC day.

export const DUBAI_TZ = 'Asia/Dubai';

/** Current calendar day in Dubai as YYYY-MM-DD (e.g. for DATE columns). */
export function dubaiToday(): string {
  // en-CA renders ISO-style YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DUBAI_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Current calendar year in Dubai. */
export function dubaiYear(): number {
  return Number(
    new Intl.DateTimeFormat('en-CA', { timeZone: DUBAI_TZ, year: 'numeric' }).format(new Date()),
  );
}

/** First calendar day of the current Dubai month as YYYY-MM-DD. */
export function dubaiMonthStart(): string {
  return `${dubaiToday().slice(0, 7)}-01`;
}

/**
 * Convert an inclusive range of Dubai *calendar days* (YYYY-MM-DD) into a
 * half-open UTC instant range [start, end). Use it to filter `timestamptz`
 * columns by Dubai day without leaking the server's local timezone.
 *
 * Dubai is a fixed UTC+4 offset (no DST), so the +04:00 literal is exact.
 * `end` is the start of the day *after* `toDay`, so the whole `toDay` is
 * included via a `< end` comparison.
 */
export function dubaiDayRangeUtc(
  fromDay: string,
  toDay: string,
): { start: Date; end: Date } {
  const start = new Date(`${fromDay}T00:00:00.000+04:00`);
  const toStart = new Date(`${toDay}T00:00:00.000+04:00`);
  const end = new Date(toStart.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}
