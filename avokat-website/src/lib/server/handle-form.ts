/**
 * Trajtimi i përbashkët i kërkesave POST nga formularët.
 * Mesazhet e gabimit për vizitorin janë të sigurta (pa detaje teknike);
 * detajet teknike shkruhen vetëm në log-un e serverit, pa të dhëna personale.
 */
import type { APIContext } from 'astro';
import { claim, rateLimit, settle, verifyToken } from './protection.ts';
import { MailNotConfiguredError, mailConfigured, sendMail, type OutgoingMail } from './mailer.ts';
import type { Errors } from '../validation.ts';

const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export const PUBLIC_MSG = {
  unavailable:
    'Formulari nuk është i disponueshëm për momentin. Ju lutemi më kontaktoni drejtpërdrejt me telefon ose email.',
  failed:
    'Ndodhi një gabim dhe kërkesa juaj nuk u dërgua. Ju lutemi provoni përsëri ose më kontaktoni drejtpërdrejt.',
  rateLimited:
    'Keni dërguar disa kërkesa brenda një kohe të shkurtër. Ju lutemi provoni përsëri pas disa minutash.',
  tooFast: 'Ju lutemi prisni disa sekonda dhe provoni përsëri.',
  rejected:
    'Kërkesa nuk mund të përpunohej. Ju lutemi rifreskoni faqen dhe provoni përsëri, ose më kontaktoni drejtpërdrejt.',
  invalid: 'Ju lutemi kontrolloni fushat e shënuara.',
  inFlight: 'Kërkesa juaj po përpunohet. Ju lutemi prisni.',
} as const;

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function clientKey(ctx: APIContext): string {
  try {
    return ctx.clientAddress || 'unknown';
  } catch {
    return 'unknown';
  }
}

interface FormSpec<T> {
  /** Emri i formularit, për kufizimin e kërkesave dhe log-un. */
  name: string;
  validate: (input: Record<string, unknown>) => { data: T; errors: Errors };
  /** Ndërton emailin për avokatin. */
  compose: (data: T) => OutgoingMail;
  successMessage: (data: T) => string;
}

export async function handleForm<T>(ctx: APIContext, spec: FormSpec<T>): Promise<Response> {
  const { request } = ctx;

  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    return json({ ok: false, code: 'bad-request', message: PUBLIC_MSG.rejected }, 415);
  }

  let input: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json({ ok: false, code: 'too-large', message: PUBLIC_MSG.rejected }, 413);
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    input = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false, code: 'bad-request', message: PUBLIC_MSG.rejected }, 400);
  }

  // Fushë-kurth (honeypot): e padukshme për njerëzit, shpesh plotësohet nga robotët.
  if (typeof input.website === 'string' && input.website.trim() !== '') {
    console.info(`[${spec.name}] U refuzua: honeypot.`);
    return json({ ok: false, code: 'rejected', message: PUBLIC_MSG.rejected }, 400);
  }

  const tokenIssue = verifyToken(input.token);
  if (tokenIssue === 'too-fast') {
    return json({ ok: false, code: 'too-fast', message: PUBLIC_MSG.tooFast }, 400);
  }
  if (tokenIssue === 'expired') {
    return json({ ok: false, code: 'token-expired', message: PUBLIC_MSG.rejected }, 400);
  }
  if (tokenIssue) {
    console.info(`[${spec.name}] U refuzua: token ${tokenIssue}.`);
    return json({ ok: false, code: 'rejected', message: PUBLIC_MSG.rejected }, 400);
  }

  const { data, errors } = spec.validate(input);
  if (Object.keys(errors).length > 0) {
    return json({ ok: false, code: 'invalid', message: PUBLIC_MSG.invalid, errors }, 422);
  }

  const requestId = typeof input.requestId === 'string' ? input.requestId.slice(0, 64) : '';
  if (!/^[A-Za-z0-9-]{16,64}$/.test(requestId)) {
    return json({ ok: false, code: 'rejected', message: PUBLIC_MSG.rejected }, 400);
  }
  const idemKey = `${spec.name}:${requestId}`;

  if (!mailConfigured()) {
    console.error(`[${spec.name}] Dërgimi i emailit nuk është konfiguruar (MAIL_TRANSPORT / SMTP_*).`);
    return json({ ok: false, code: 'unavailable', message: PUBLIC_MSG.unavailable }, 503);
  }

  const claimed = claim(idemKey);
  if (claimed === 'duplicate') {
    // E njëjta kërkesë është dërguar me sukses më parë – nuk dërgohet përsëri.
    return json({ ok: true, duplicate: true, message: spec.successMessage(data) });
  }
  if (claimed === 'in-flight') {
    return json({ ok: false, code: 'in-flight', message: PUBLIC_MSG.inFlight }, 409);
  }

  if (!rateLimit(`${spec.name}:${clientKey(ctx)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    settle(idemKey, false);
    return json({ ok: false, code: 'rate-limited', message: PUBLIC_MSG.rateLimited }, 429);
  }

  try {
    await sendMail(spec.compose(data));
    settle(idemKey, true);
    return json({ ok: true, message: spec.successMessage(data) });
  } catch (err) {
    settle(idemKey, false);
    if (err instanceof MailNotConfiguredError) {
      console.error(`[${spec.name}] ${err.message}`);
      return json({ ok: false, code: 'unavailable', message: PUBLIC_MSG.unavailable }, 503);
    }
    console.error(`[${spec.name}] Dërgimi dështoi:`, err instanceof Error ? err.message : err);
    return json({ ok: false, code: 'send-failed', message: PUBLIC_MSG.failed }, 502);
  }
}
