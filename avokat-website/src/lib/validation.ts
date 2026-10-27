/**
 * Validimi i formularëve – i përbashkët për shfletuesin dhe serverin.
 * Serveri e përsërit gjithmonë validimin; validimi në shfletues shërben
 * vetëm për përvojën e përdoruesit.
 */
import { checkDate, formatDateSq, slotsFor, bookingWindow, type DateIssue } from './availability.ts';
import { serviceOptions } from '../config/services.ts';
import { site } from '../config/site.ts';

export const LIMITS = {
  nameMin: 2,
  nameMax: 100,
  emailMax: 160,
  messageMin: 10,
  messageMax: 1500,
  noteMax: 600,
} as const;

export const MSG = {
  required: 'Kjo fushë është e detyrueshme.',
  name: 'Ju lutemi shkruani emrin dhe mbiemrin.',
  nameLong: `Emri nuk mund të kalojë ${LIMITS.nameMax} karaktere.`,
  email: 'Ju lutemi shkruani një adresë emaili të vlefshme.',
  phone: 'Ju lutemi shkruani një numër telefoni të vlefshëm.',
  reach: 'Ju lutemi jepni të paktën një adresë emaili ose një numër telefoni.',
  service: 'Ju lutemi zgjidhni shërbimin.',
  messageShort: `Mesazhi duhet të ketë të paktën ${LIMITS.messageMin} karaktere.`,
  messageLong: `Mesazhi nuk mund të kalojë ${LIMITS.messageMax} karaktere.`,
  noteLong: `Përshkrimi nuk mund të kalojë ${LIMITS.noteMax} karaktere.`,
  privacy: 'Ju lutemi konfirmoni që keni lexuar njoftimin e privatësisë.',
  date: 'Ju lutemi zgjidhni një datë.',
  time: 'Ju lutemi zgjidhni një orë nga oraret e disponueshme.',
  mode: 'Ju lutemi zgjidhni mënyrën e takimit.',
} as const;

export function dateIssueMessage(issue: DateIssue): string {
  const { min, max } = bookingWindow();
  switch (issue) {
    case 'invalid':
      return 'Ju lutemi zgjidhni një datë të vlefshme.';
    case 'past':
      return 'Data e zgjedhur ka kaluar. Ju lutemi zgjidhni një datë tjetër.';
    case 'too-soon':
      return `Kërkesat online pranohen duke filluar nga ${formatDateSq(min)}. Për raste urgjente, ju lutemi telefononi.`;
    case 'too-far':
      return `Kërkesat pranohen deri më ${formatDateSq(max)}. Ju lutemi zgjidhni një datë më të afërt.`;
    case 'closed':
      return 'Në këtë ditë nuk ka orar konsultash. Ju lutemi zgjidhni një ditë tjetër.';
  }
}

export type Errors = Record<string, string>;

export interface ContactData {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  privacy: boolean;
}

export interface BookingData {
  service: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  mode: string;
  note: string;
  privacy: boolean;
}

/** Heq karakteret e kontrollit dhe hapësirat e tepërta; ruan rreshtat e rinj vetëm kur lejohen. */
export function clean(value: unknown, multiline = false): string {
  if (typeof value !== 'string') return '';
  let v = value.normalize('NFC');
  v = multiline
    ? v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
    : v.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ');
  return v.trim();
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

export function isEmail(v: string): boolean {
  return v.length <= LIMITS.emailMax && EMAIL_RE.test(v);
}

export function isPhone(v: string): boolean {
  if (!/^\+?[\d\s().\-/]{6,24}$/.test(v)) return false;
  const digits = v.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 15;
}

function checkName(name: string, errors: Errors) {
  if (!name) errors.name = MSG.required;
  else if (name.length < LIMITS.nameMin) errors.name = MSG.name;
  else if (name.length > LIMITS.nameMax) errors.name = MSG.nameLong;
}

const SERVICE_VALUES = new Set(serviceOptions.map((o) => o.value));
const MODE_VALUES = new Set<string>(site.consultationModes.map((m) => m.value));

export function validateContact(input: Record<string, unknown>): { data: ContactData; errors: Errors } {
  const data: ContactData = {
    name: clean(input.name),
    email: clean(input.email).toLowerCase(),
    phone: clean(input.phone),
    service: clean(input.service),
    message: clean(input.message, true),
    privacy: input.privacy === true || input.privacy === 'on' || input.privacy === 'true',
  };
  const errors: Errors = {};
  checkName(data.name, errors);
  if (!data.email) errors.email = MSG.required;
  else if (!isEmail(data.email)) errors.email = MSG.email;
  if (data.phone && !isPhone(data.phone)) errors.phone = MSG.phone;
  if (!SERVICE_VALUES.has(data.service)) errors.service = MSG.service;
  if (!data.message) errors.message = MSG.required;
  else if (data.message.length < LIMITS.messageMin) errors.message = MSG.messageShort;
  else if (data.message.length > LIMITS.messageMax) errors.message = MSG.messageLong;
  if (!data.privacy) errors.privacy = MSG.privacy;
  return { data, errors };
}

export function validateBooking(
  input: Record<string, unknown>,
  now: Date = new Date(),
): { data: BookingData; errors: Errors } {
  const data: BookingData = {
    service: clean(input.service),
    name: clean(input.name),
    email: clean(input.email).toLowerCase(),
    phone: clean(input.phone),
    date: clean(input.date),
    time: clean(input.time),
    mode: clean(input.mode),
    note: clean(input.note, true),
    privacy: input.privacy === true || input.privacy === 'on' || input.privacy === 'true',
  };
  const errors: Errors = {};
  if (!SERVICE_VALUES.has(data.service)) errors.service = MSG.service;
  checkName(data.name, errors);
  if (data.email && !isEmail(data.email)) errors.email = MSG.email;
  if (data.phone && !isPhone(data.phone)) errors.phone = MSG.phone;
  if (!data.email && !data.phone) {
    errors.email = MSG.reach;
    errors.phone = MSG.reach;
  }
  if (!data.date) {
    errors.date = MSG.date;
  } else {
    const issue = checkDate(data.date, now);
    if (issue) errors.date = dateIssueMessage(issue);
    else if (!slotsFor(data.date, now).includes(data.time)) errors.time = MSG.time;
  }
  if (!data.date || errors.date) {
    if (!data.time) errors.time = MSG.time;
  }
  if (MODE_VALUES.size > 0 && !MODE_VALUES.has(data.mode)) errors.mode = MSG.mode;
  if (data.note.length > LIMITS.noteMax) errors.note = MSG.noteLong;
  if (!data.privacy) errors.privacy = MSG.privacy;
  return { data, errors };
}

export function labelFor(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
