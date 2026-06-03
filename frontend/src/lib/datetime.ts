// Centralised date/time formatting.
//
// The whole product reports in Dubai time (Asia/Dubai, UTC+4). Timestamps are
// stored as UTC instants in the backend; these helpers render and derive
// calendar values in the Dubai zone so the UI is consistent regardless of the
// viewer's machine timezone.

export const DUBAI_TZ = 'Asia/Dubai';

type DateInput = string | number | Date | null | undefined;

function toValidDate(value: DateInput): Date | null {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date + time in Dubai, e.g. "01/06/2026, 14:30:00". */
export function formatDateTime(value: DateInput, fallback = '—'): string {
  const d = toValidDate(value);
  return d ? d.toLocaleString(undefined, { timeZone: DUBAI_TZ }) : fallback;
}

/** Date only in Dubai, e.g. "01/06/2026". */
export function formatDate(value: DateInput, fallback = '—'): string {
  const d = toValidDate(value);
  return d ? d.toLocaleDateString(undefined, { timeZone: DUBAI_TZ }) : fallback;
}

/** Medium date style in Dubai, e.g. "1 Jun 2026". */
export function formatDateMedium(value: DateInput, fallback = '—'): string {
  const d = toValidDate(value);
  return d
    ? d.toLocaleDateString(undefined, { dateStyle: 'medium', timeZone: DUBAI_TZ })
    : fallback;
}

/** Current calendar day in Dubai as YYYY-MM-DD, for <input type="date"> defaults. */
export function todayInDubai(): string {
  // en-CA renders ISO-style YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DUBAI_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Current hour-of-day (0–23) in Dubai. */
export function hourInDubai(): number {
  const hh = new Intl.DateTimeFormat('en-GB', {
    timeZone: DUBAI_TZ,
    hour: '2-digit',
    hour12: false,
  }).format(new Date());
  return parseInt(hh, 10) % 24;
}
