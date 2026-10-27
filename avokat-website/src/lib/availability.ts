/**
 * Logjika e disponueshmërisë – përdoret si në shfletues ashtu edhe në server,
 * që validimi të jetë i njëjtë në të dy anët.
 */
import {
  closedDates,
  MAX_HORIZON_DAYS,
  MIN_LEAD_DAYS,
  TIMEZONE,
  weeklySlots,
} from '../config/availability.ts';

export type DateIssue = 'invalid' | 'past' | 'too-soon' | 'too-far' | 'closed';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Data e sotme (VVVV-MM-DD) në zonën kohore të Tiranës. */
export function todayInTirana(now: Date = new Date()): string {
  // Formati 'en-CA' jep VVVV-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Kthen numrin e ditës (UTC) për një datë VVVV-MM-DD, ose null nëse data s'është e vlefshme. */
function dayNumber(date: string): number | null {
  const m = DATE_RE.exec(date);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(y, mo - 1, d);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) {
    return null;
  }
  return Math.round(ms / 86_400_000);
}

export function addDays(date: string, days: number): string {
  const n = dayNumber(date);
  if (n === null) throw new Error(`Datë e pavlefshme: ${date}`);
  return new Date((n + days) * 86_400_000).toISOString().slice(0, 10);
}

/** Dita e javës (0 = e diel) për një datë VVVV-MM-DD. */
export function weekday(date: string): number {
  const n = dayNumber(date);
  if (n === null) throw new Error(`Datë e pavlefshme: ${date}`);
  return new Date(n * 86_400_000).getUTCDay();
}

/** Diapazoni i datave që mund të zgjidhen. */
export function bookingWindow(now: Date = new Date()): { min: string; max: string } {
  const today = todayInTirana(now);
  return { min: addDays(today, MIN_LEAD_DAYS), max: addDays(today, MAX_HORIZON_DAYS) };
}

/** Kontrollon nëse një datë mund të kërkohet; kthen `null` kur data është në rregull. */
export function checkDate(date: string, now: Date = new Date()): DateIssue | null {
  const n = dayNumber(date);
  if (n === null) return 'invalid';
  const today = dayNumber(todayInTirana(now))!;
  if (n < today) return 'past';
  if (n < today + MIN_LEAD_DAYS) return 'too-soon';
  if (n > today + MAX_HORIZON_DAYS) return 'too-far';
  if (closedDates.includes(date)) return 'closed';
  if ((weeklySlots[weekday(date)] ?? []).length === 0) return 'closed';
  return null;
}

/** Oraret e mundshme për një datë (bosh nëse data nuk pranohet). */
export function slotsFor(date: string, now: Date = new Date()): readonly string[] {
  if (checkDate(date, now) !== null) return [];
  return weeklySlots[weekday(date)] ?? [];
}

const WEEKDAYS_SQ = ['e diel', 'e hënë', 'e martë', 'e mërkurë', 'e enjte', 'e premte', 'e shtunë'];
const MONTHS_SQ = [
  'janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor',
  'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor',
];

/** Formaton datën në shqip, p.sh. "e hënë, 2 nëntor 2026". */
export function formatDateSq(date: string): string {
  const m = DATE_RE.exec(date);
  if (!m || dayNumber(date) === null) return date;
  return `${WEEKDAYS_SQ[weekday(date)]}, ${Number(m[3])} ${MONTHS_SQ[Number(m[2]) - 1]} ${m[1]}`;
}
