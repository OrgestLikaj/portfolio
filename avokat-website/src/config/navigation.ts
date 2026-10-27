import { lawyerWord } from './site.ts';

export const routes = {
  home: '/',
  about: '/rreth-avokatit/',
  services: '/sherbimet/',
  booking: '/rezervo-konsulte/',
  contact: '/kontakti/',
  privacy: '/politika-e-privatesise/',
  legal: '/njoftimi-ligjor/',
  cookies: '/politika-e-cookies/',
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
