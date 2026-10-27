import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBooking, validateContact, clean, isPhone } from '../../src/lib/validation.ts';

const NOW = new Date('2026-10-27T11:00:00Z');

const contact = {
  name: 'Arta Hoxha',
  email: 'arta@example.com',
  phone: '',
  service: 'ceshtje-civile',
  message: 'Kam një pyetje për një kontratë qiraje.',
  privacy: true,
};

test('formulari i kontaktit pranon të dhëna të vlefshme', () => {
  const { errors, data } = validateContact(contact);
  assert.deepEqual(errors, {});
  assert.equal(data.name, 'Arta Hoxha');
});

test('formulari i kontaktit kërkon fushat e detyrueshme', () => {
  const { errors } = validateContact({});
  assert.ok(errors.name && errors.email && errors.service && errors.message && errors.privacy);
});

test('email-i, telefoni dhe shërbimi kontrollohen', () => {
  const { errors } = validateContact({ ...contact, email: 'jo-email', phone: 'abc', service: 'x' });
  assert.ok(errors.email);
  assert.ok(errors.phone);
  assert.ok(errors.service);
});

test('mesazhi kufizohet në gjatësi', () => {
  assert.ok(validateContact({ ...contact, message: 'shkurt' }).errors.message);
  assert.ok(validateContact({ ...contact, message: 'a'.repeat(1501) }).errors.message);
});

test('karakteret e kontrollit hiqen', () => {
  assert.equal(clean('Emri\r\nBcc: x@y.z'), 'Emri Bcc: x@y.z');
  assert.equal(clean('rreshti 1\r\nrreshti 2', true), 'rreshti 1\nrreshti 2');
});

test('numrat e telefonit', () => {
  assert.ok(isPhone('+355 69 123 4567'));
  assert.ok(isPhone('069 123 4567'));
  assert.ok(!isPhone('12'));
  assert.ok(!isPhone('telefono'));
});

const booking = {
  service: 'konsulence-juridike',
  name: 'Arta Hoxha',
  email: '',
  phone: '+355 69 123 4567',
  date: '2026-10-28',
  time: '10:00',
  mode: 'zyre',
  note: '',
  privacy: 'true',
};

test('kërkesa për takim pranon të dhëna të vlefshme', () => {
  assert.deepEqual(validateBooking(booking, NOW).errors, {});
});

test('kërkohet të paktën email ose telefon', () => {
  const { errors } = validateBooking({ ...booking, phone: '' }, NOW);
  assert.ok(errors.email && errors.phone);
});

test('data dhe ora e padisponueshme refuzohen', () => {
  assert.ok(validateBooking({ ...booking, date: '2026-10-31' }, NOW).errors.date); // e shtunë
  assert.ok(validateBooking({ ...booking, date: '2026-10-20' }, NOW).errors.date); // e kaluar
  assert.ok(validateBooking({ ...booking, time: '13:00' }, NOW).errors.time); // jashtë orarit
  assert.ok(validateBooking({ ...booking, time: '' }, NOW).errors.time);
});

test('mënyra e takimit duhet të jetë nga opsionet', () => {
  assert.ok(validateBooking({ ...booking, mode: 'shtepi' }, NOW).errors.mode);
});
