import type { APIRoute } from 'astro';
import { handleForm } from '../../lib/server/handle-form.ts';
import { labelFor, validateContact } from '../../lib/validation.ts';
import { serviceOptions } from '../../config/services.ts';

export const prerender = false;

export const POST: APIRoute = (ctx) =>
  handleForm(ctx, {
    name: 'kontakt',
    validate: validateContact,
    compose: (d) => ({
      subject: `Mesazh i ri nga faqja: ${labelFor(serviceOptions, d.service)}`,
      replyTo: d.email,
      text: [
        'Mesazh i ri nga formulari i kontaktit në faqen e internetit.',
        '',
        `Emri dhe mbiemri: ${d.name}`,
        `Email: ${d.email}`,
        `Telefoni: ${d.phone || '—'}`,
        `Shërbimi: ${labelFor(serviceOptions, d.service)}`,
        '',
        'Mesazhi:',
        d.message,
        '',
        '—',
        'Vizitori ka konfirmuar se ka lexuar njoftimin e privatësisë.',
      ].join('\n'),
    }),
    successMessage: () =>
      'Faleminderit. Mesazhi juaj u dërgua me sukses. Do t’ju kontaktoj sa më shpejt të jetë e mundur.',
  });
