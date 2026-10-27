/**
 * Dërgimi i emaileve nga formularët.
 *
 * MAIL_TRANSPORT:
 *  - "smtp": dërgim real përmes SMTP (p.sh. kutia postare e domenit ose një
 *    shërbim transaksional). Kërkon SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
 *    MAIL_FROM dhe MAIL_TO.
 *  - "log": VETËM për zhvillim/testim. Mesazhi ruhet si skedar JSON në `.outbox/`
 *    dhe NUK dërgohet. Në prodhim lejohet vetëm me ALLOW_LOG_TRANSPORT=true.
 *  - i papërcaktuar: formularët kthejnë gabim 503 dhe nuk pretendojnë dërgim.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { env, isProduction } from './env.ts';

export interface OutgoingMail {
  subject: string;
  text: string;
  replyTo?: string;
}

export class MailNotConfiguredError extends Error {}

type Transport = 'smtp' | 'log';

function transport(): Transport | null {
  const t = env('MAIL_TRANSPORT');
  if (t === 'smtp') return 'smtp';
  if (t === 'log') {
    if (isProduction() && env('ALLOW_LOG_TRANSPORT') !== 'true') return null;
    return 'log';
  }
  return null;
}

/** Heq rreshtat e rinj nga vlerat që shkojnë në kokat e emailit. */
function headerSafe(v: string): string {
  return v.replace(/[\r\n]+/g, ' ').trim();
}

let smtpTransporter: import('nodemailer').Transporter | undefined;

async function getSmtp() {
  if (smtpTransporter) return smtpTransporter;
  const host = env('SMTP_HOST');
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASS');
  if (!host || !user || !pass) throw new MailNotConfiguredError('SMTP nuk është konfiguruar plotësisht.');
  const port = Number(env('SMTP_PORT') ?? 465);
  const nodemailer = (await import('nodemailer')).default;
  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure: (env('SMTP_SECURE') ?? (port === 465 ? 'true' : 'false')) === 'true',
    auth: { user, pass },
    // Mos lejo leximin e skedarëve/URL-ve nga përmbajtja e mesazhit.
    disableFileAccess: true,
    disableUrlAccess: true,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return smtpTransporter;
}

export function mailConfigured(): boolean {
  const t = transport();
  if (t === 'log') return true;
  if (t === 'smtp') {
    return Boolean(
      env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS') && env('MAIL_FROM') && env('MAIL_TO'),
    );
  }
  return false;
}

/**
 * Dërgon mesazhin. Hedh gabim nëse dërgimi nuk realizohet – thirrësi
 * duhet të raportojë sukses vetëm kur kjo funksion përfundon pa gabim.
 */
export async function sendMail(mail: OutgoingMail): Promise<void> {
  const t = transport();
  if (!t || !mailConfigured()) throw new MailNotConfiguredError('Dërgimi i emailit nuk është konfiguruar.');

  const subject = headerSafe(mail.subject).slice(0, 200);
  const replyTo = mail.replyTo ? headerSafe(mail.replyTo) : undefined;

  if (t === 'log') {
    const dir = env('OUTBOX_DIR') ?? join(process.cwd(), '.outbox');
    await mkdir(dir, { recursive: true });
    const file = join(dir, `${Date.now()}-${randomUUID()}.json`);
    await writeFile(file, JSON.stringify({ subject, replyTo, text: mail.text }, null, 2), 'utf8');
    console.warn(`[mail:log] Mesazhi u ruajt lokalisht (nuk u dërgua): ${file}`);
    return;
  }

  const smtp = await getSmtp();
  await smtp.sendMail({
    from: env('MAIL_FROM'),
    to: env('MAIL_TO'),
    subject,
    text: mail.text,
    replyTo,
  });
}
