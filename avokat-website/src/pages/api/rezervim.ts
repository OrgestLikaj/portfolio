import type { APIRoute } from 'astro';
import { handleForm } from '../../lib/server/handle-form.ts';
import { labelFor, validateBooking } from '../../lib/validation.ts';
import { formatDateSq } from '../../lib/availability.ts';
import { serviceOptions } from '../../config/services.ts';
import { site } from '../../config/site.ts';

export const prerender = false;

export const POST: APIRoute = (ctx) =>
  handleForm(ctx, {
    name: 'rezervim',
    validate: (input) => validateBooking(input),
    compose: (d) => ({
      subject: `Kërkesë për konsultë: ${formatDateSq(d.date)}, ora ${d.time}`,
      replyTo: d.email || undefined,
      text: [
        'Kërkesë e re për konsultë nga faqja e internetit.',
        'KUJDES: Kjo është një kërkesë. Takimi nuk është konfirmuar ende – kontaktoni klientin për konfirmim.',
        '',
        `Shërbimi: ${labelFor(serviceOptions, d.service)}`,
        `Data e preferuar: ${formatDateSq(d.date)}`,
        `Ora e preferuar: ${d.time}`,
        `Mënyra e takimit: ${labelFor(site.consultationModes, d.mode)}`,
        '',
        `Emri dhe mbiemri: ${d.name}`,
        `Email: ${d.email || '—'}`,
        `Telefoni: ${d.phone || '—'}`,
        '',
        'Përshkrim i shkurtër:',
        d.note || '—',
        '',
        '—',
        'Vizitori ka konfirmuar se ka lexuar njoftimin e privatësisë.',
      ].join('\n'),
    }),
    successMessage: (d) =>
      `Kërkesa juaj për ${formatDateSq(d.date)}, ora ${d.time}, u dërgua me sukses. Ky nuk është ende konfirmim i takimit: do t’ju kontaktoj për ta konfirmuar ose për t’ju propozuar një orar tjetër.`,
  });
