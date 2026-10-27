import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, checkDate, slotsFor, todayInTirana, weekday, formatDateSq } from '../../src/lib/availability.ts';

// E martë, 27 tetor 2026, ora 12:00 në Tiranë (11:00 UTC).
const NOW = new Date('2026-10-27T11:00:00Z');

test('data e sotme llogaritet në zonën kohore të Tiranës', () => {
  assert.equal(todayInTirana(NOW), '2026-10-27');
  // 23:30 UTC më 27 tetor është tashmë 28 tetor në Tiranë (UTC+1 pas ndryshimit të orës).
  assert.equal(todayInTirana(new Date('2026-10-27T23:30:00Z')), '2026-10-28');
});

test('datat e pavlefshme refuzohen', () => {
  assert.equal(checkDate('2026-02-30', NOW), 'invalid');
  assert.equal(checkDate('27.10.2026', NOW), 'invalid');
  assert.equal(checkDate('', NOW), 'invalid');
});

test('datat e kaluara dhe dita e sotme refuzohen', () => {
  assert.equal(checkDate('2026-10-20', NOW), 'past');
  assert.equal(checkDate('2026-10-27', NOW), 'too-soon');
});

test('fundjavat dhe ditët pa pritje refuzohen', () => {
  assert.equal(weekday('2026-10-31'), 6);
  assert.equal(checkDate('2026-10-31', NOW), 'closed'); // e shtunë
  assert.equal(checkDate('2026-11-01', NOW), 'closed'); // e diel
  assert.equal(checkDate('2026-11-28', NOW), 'closed'); // ditë pa pritje e konfiguruar
});

test('datat përtej horizontit refuzohen', () => {
  assert.equal(checkDate(addDays('2026-10-27', 61), NOW), 'too-far');
});

test('ditët e punës kanë orare', () => {
  assert.equal(checkDate('2026-10-28', NOW), null);
  assert.ok(slotsFor('2026-10-28', NOW).includes('10:00'));
  assert.deepEqual(slotsFor('2026-10-31', NOW), []);
});

test('formatimi i datës në shqip', () => {
  assert.equal(formatDateSq('2026-11-02'), 'e hënë, 2 nëntor 2026');
});
