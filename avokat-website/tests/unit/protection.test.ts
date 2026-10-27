import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { issueToken, verifyToken, rateLimit, claim, settle, _resetProtection } from '../../src/lib/server/protection.ts';

beforeEach(() => _resetProtection());

test('tokeni i vlefshëm pranohet pas kohës minimale', () => {
  const t0 = Date.now();
  const token = issueToken(t0);
  assert.equal(verifyToken(token, t0 + 5_000), null);
});

test('dërgimi shumë i shpejtë refuzohet', () => {
  const t0 = Date.now();
  assert.equal(verifyToken(issueToken(t0), t0 + 500), 'too-fast');
});

test('tokeni i skaduar refuzohet', () => {
  const t0 = Date.now();
  assert.equal(verifyToken(issueToken(t0), t0 + 3 * 60 * 60 * 1000), 'expired');
});

test('tokeni i ndryshuar ose mungues refuzohet', () => {
  const t0 = Date.now();
  const [ts, nonce, mac] = issueToken(t0).split('.');
  assert.equal(verifyToken(`${Number(ts) - 60_000}.${nonce}.${mac}`, t0 + 5_000), 'invalid');
  assert.equal(verifyToken('', t0), 'missing');
  assert.equal(verifyToken('a.b', t0), 'invalid');
});

test('kufizimi i kërkesave', () => {
  const t0 = 1_000_000;
  for (let i = 0; i < 5; i++) assert.equal(rateLimit('k:1', 5, 60_000, t0 + i), true);
  assert.equal(rateLimit('k:1', 5, 60_000, t0 + 10), false);
  assert.equal(rateLimit('k:2', 5, 60_000, t0 + 10), true);
  assert.equal(rateLimit('k:1', 5, 60_000, t0 + 61_000), true);
});

test('idempotenca: e njëjta kërkesë nuk dërgohet dy herë', () => {
  assert.equal(claim('f:abc'), 'new');
  assert.equal(claim('f:abc'), 'in-flight');
  settle('f:abc', true);
  assert.equal(claim('f:abc'), 'duplicate');
  // Pas një dështimi, kërkesa mund të riprovohet.
  assert.equal(claim('f:def'), 'new');
  settle('f:def', false);
  assert.equal(claim('f:def'), 'new');
});
