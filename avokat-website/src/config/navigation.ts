import { lawyerWord } from './site.ts';
import { withBase } from '../lib/url.ts';

export const routes = {
  home: withBase('/'),
  about: withBase('/rreth-avokatit/'),
  services: withBase('/sherbimet/'),
  booking: withBase('/rezervo-konsulte/'),
  contact: withBase('/kontakti/'),
  privacy: withBase('/politika-e-privatesise/'),
  legal: withBase('/njoftimi-ligjor/'),
  cookies: withBase('/politika-e-cookies/'),
} as const;

export const serviceUrl = (slug: string) => `${routes.services}${slug}/`;

export const mainNav = [
  { href: routes.home, label: 'Kryefaqja' },
  { href: routes.about, label: `Rreth ${lawyerWord.gen}` },
  { href: routes.services, label: 'Shërbimet' },
  { href: routes.contact, label: 'Kontakti' },
] as const;

export const legalNav = [
  { href: routes.privacy, label: 'Politika e privatësisë' },
  { href: routes.legal, label: 'Njoftimi ligjor' },
  { href: routes.cookies, label: 'Politika e cookies' },
] as const;
