/**
 * Mbrojtja e formularëve nga spami dhe dërgimet e dyfishta (vetëm në server).
 *
 * - Token me nënshkrim HMAC dhe kohë lëshimi: formulari nuk mund të dërgohet
 *   më shpejt se MIN_FILL_MS pas hapjes së faqes, as pas skadimit të tokenit.
 * - Kufizim i numrit të kërkesave për IP (në memorie, për një instancë serveri).
 * - Idempotencë: e njëjta kërkesë (requestId) nuk dërgohet dy herë.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env, isProduction } from './env.ts';

const MIN_FILL_MS = 3_000;
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

let devSecret: string | undefined;

function secret(): string {
  const s = env('FORM_SECRET');
  if (s && s.length >= 32) return s;
  if (isProduction()) {
    throw new Error('FORM_SECRET mungon ose është më i shkurtër se 32 karaktere.');
  }
  devSecret ??= randomBytes(32).toString('hex');
  return devSecret;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function issueToken(now = Date.now()): string {
  const payload = `${now}.${randomBytes(8).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

export type TokenIssue = 'missing' | 'invalid' | 'too-fast' | 'expired';

export function verifyToken(token: unknown, now = Date.now()): TokenIssue | null {
  if (typeof token !== 'string' || !token) return 'missing';
  const parts = token.split('.');
  if (parts.length !== 3) return 'invalid';
  const [ts, nonce, mac] = parts;
  const expected = Buffer.from(sign(`${ts}.${nonce}`));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return 'invalid';
  const issued = Number(ts);
  if (!Number.isFinite(issued)) return 'invalid';
  const age = now - issued;
  if (age < MIN_FILL_MS) return 'too-fast';
  if (age > TOKEN_TTL_MS) return 'expired';
  return null;
}

/* ---------- Kufizimi i kërkesave ---------- */

const hits = new Map<string, number[]>();

/**
 * Kthen `true` nëse kërkesa lejohet. Dritare rrëshqitëse: `limit` kërkesa
 * në `windowMs` për çdo çelës (p.sh. "kontakt:IP").
 */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5_000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return true;
}

/* ---------- Idempotenca ---------- */

const IDEMPOTENCY_TTL_MS = 30 * 60 * 1000;
const completed = new Map<string, number>();
const inFlight = new Set<string>();

function prune(now: number) {
  for (const [k, t] of completed) if (now - t > IDEMPOTENCY_TTL_MS) completed.delete(k);
}

export type ClaimResult = 'new' | 'duplicate' | 'in-flight';

/** Rezervon një çelës idempotence përpara dërgimit. */
export function claim(key: string, now = Date.now()): ClaimResult {
  prune(now);
  if (completed.has(key)) return 'duplicate';
  if (inFlight.has(key)) return 'in-flight';
  inFlight.add(key);
  return 'new';
}

/** Shënon çelësin si të përfunduar (sukses) ose e liron (dështim, që të mund të riprovohet). */
export function settle(key: string, success: boolean, now = Date.now()) {
  inFlight.delete(key);
  if (success) completed.set(key, now);
}

/** Vetëm për testet. */
export function _resetProtection() {
  hits.clear();
  completed.clear();
  inFlight.clear();
}
