/**
 * Ndihmës për SEO dhe structured data (JSON-LD).
 * Vetëm vlerat e konfirmuara (jo placeholder) publikohen në JSON-LD.
 */
import { site, confirmed, lawyerWord } from '../config/site.ts';
import { services } from '../config/services.ts';
import { routes, serviceUrl } from '../config/navigation.ts';
import { withBase } from './url.ts';

/** Indeksimi lejohet vetëm kur ALLOW_INDEXING=true gjatë build-it (p.sh. në prodhim pas miratimit). */
export const indexingAllowed = process.env.ALLOW_INDEXING === 'true';

export function absolute(path: string, base: URL | undefined): string {
  return new URL(path, base ?? `https://${site.domain}`).toString();
}

export interface Crumb {
  label: string;
  href: string;
}

export function breadcrumbLd(crumbs: Crumb[], base: URL | undefined) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: absolute(c.href, base),
    })),
  };
}

/**
 * LegalService + Person. Kthen `null` derisa emri i avokatit të jetë konfirmuar,
 * që të mos publikohen të dhëna të paverifikuara.
 */
export function practiceLd(base: URL | undefined) {
  const name = confirmed(site.lawyerName);
  if (!name) return null;

  const street = confirmed(site.contact.streetAddress);
  const city = confirmed(site.contact.city);
  const postal = confirmed(site.contact.postalCode);
  const phone = confirmed(site.contact.phoneE164);
  const email = confirmed(site.contact.email);
  const home = absolute(routes.home, base);

  const address =
    street && city
      ? {
          '@type': 'PostalAddress',
          streetAddress: street,
          addressLocality: city,
          ...(postal ? { postalCode: postal } : {}),
          addressCountry: 'AL',
        }
      : undefined;

  const person = {
    '@type': 'Person',
    '@id': `${home}#avokati`,
    name,
    jobTitle: lawyerWord.Indef,
    url: absolute(routes.about, base),
    ...(site.portrait.src ? { image: absolute(withBase(site.portrait.src), base) } : {}),
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    '@id': `${home}#praktika`,
    name: site.practiceName,
    alternateName: `Av. ${name}`,
    url: home,
    areaServed: { '@type': 'Country', name: 'Shqipëri' },
    availableLanguage: 'sq',
    founder: person,
    ...(site.logo.png ? { logo: absolute(withBase(site.logo.png), base), image: absolute(withBase(site.logo.png), base) } : {}),
    ...(phone ? { telephone: phone } : {}),
    ...(email ? { email } : {}),
    ...(address ? { address } : {}),
    knowsAbout: services.map((s) => s.title),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Shërbimet juridike',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, url: absolute(serviceUrl(s.slug), base) },
      })),
    },
  };
}
