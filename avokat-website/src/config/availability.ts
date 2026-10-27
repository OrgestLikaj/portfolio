/**
 * Konfigurimi i disponueshmërisë për kërkesat e takimit.
 *
 * KUJDES: Faqja NUK është e lidhur me një kalendar. Oraret më poshtë janë
 * oraret që vizitori mund të zgjedhë si preferencë; takimi konfirmohet
 * vetëm pasi avokati kontakton vizitorin.
 *
 * KONFIRMONI me avokatin oraret, ditët pa pritje dhe festat.
 */

export const TIMEZONE = 'Europe/Tirane';

/** Oraret e mundshme sipas ditës së javës (0 = e diel, 1 = e hënë, ... 6 = e shtunë). */
export const weeklySlots: Record<number, readonly string[]> = {
  0: [],
  1: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'],
  2: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'],
  3: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'],
  4: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'],
  5: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00'],
  6: [],
};

/** Sa ditë përpara duhet bërë kërkesa (1 = nga dita e nesërme). */
export const MIN_LEAD_DAYS = 1;

/** Sa ditë në të ardhmen pranohen kërkesa. */
export const MAX_HORIZON_DAYS = 60;

/**
 * Ditë pa pritje (formati VVVV-MM-DD): pushime, festa zyrtare, mungesa.
 * Festat me datë fikse më poshtë janë dhënë si ndihmë – VERIFIKONI listën
 * zyrtare të festave për çdo vit dhe shtoni festat me datë të ndryshueshme
 * (p.sh. Pashkët, Bajramet) si dhe ditët kur avokati nuk pret klientë.
 */
export const closedDates: readonly string[] = [
  '2026-11-28',
  '2026-11-29',
  '2026-12-08',
  '2026-12-25',
  '2027-01-01',
  '2027-01-02',
  '2027-03-14',
  '2027-03-22',
  '2027-05-01',
];
