/**
 * Konfigurimi qendror i faqes.
 *
 * Çdo vlerë në kllapa katrore, p.sh. "[NUMRI I TELEFONIT]", është PLACEHOLDER.
 * Placeholder-at shfaqen me stil të dallueshëm në faqe, përjashtohen nga
 * meta të dhënat dhe nga structured data (JSON-LD), dhe raportohen nga
 * `npm run audit:placeholders`. Zëvendësojini vetëm me informacion të verifikuar.
 */

export type Gender = 'm' | 'f';

/**
 * Gjinia gramatikore e titullit "avokat/avokate".
 * Teksti i faqes përdor formën e duhur automatikisht (shih `lawyerWord`).
 * Konfirmuar nga kartëvizita: "Gentjan Gega – Avokat".
 */
export const LAWYER_GENDER: Gender = 'm';

const lawyerForms = {
  m: { indef: 'avokat', nom: 'avokati', acc: 'avokatin', gen: 'avokatit', Indef: 'Avokat' },
  f: { indef: 'avokate', nom: 'avokatja', acc: 'avokaten', gen: 'avokates', Indef: 'Avokate' },
} as const;

/** Format gramatikore të fjalës "avokat" sipas gjinisë së konfiguruar. */
export const lawyerWord = lawyerForms[LAWYER_GENDER];

export const site = {
  /** Emri i avokatit (nga kartëvizita). */
  lawyerName: 'Gentjan Gega',
  /** Emri i studios (nga logoja). */
  practiceName: 'Studio Ligjore Gega',
  /** Domeni zyrtar (nga kartëvizita). Përdoret si parazgjedhje për SITE_URL. */
  domain: 'gegaattorney.al',
  /** Numri i licencës; lëreni placeholder ose bosh ('') nëse nuk do të publikohet. */
  licenseNumber: '[NUMRI I LICENCËS, NËSE DUHET TË PUBLIKOHET]',
  /** Dhoma e Avokatisë ku është regjistruar avokati. */
  barChamber: '[DHOMA E AVOKATISË KU ËSHTË REGJISTRUAR AVOKATI]',
  /** NIPT/NUIS i veprimtarisë profesionale, nëse aplikohet dhe publikohet. */
  taxId: '[NIPT, NËSE APLIKOHET]',

  contact: {
    phoneDisplay: '+355 68 201 0636',
    /** Formati ndërkombëtar pa hapësira. Përdoret për lidhjen tel:. */
    phoneE164: '+355682010636',
    email: 'gentjangega.lawoffice@gmail.com',
    streetAddress: '[ADRESA E ZYRËS]',
    city: '[QYTETI]',
    postalCode: '[KODI POSTAR]',
    country: 'Shqipëri',
    /** Orari i zyrës siç do të shfaqet për vizitorët. */
    officeHours: '[ORARI I KONSULTAVE]',
    /** Lidhje e jashtme për udhëzime (Google Maps / OpenStreetMap). Bosh = nuk shfaqet. */
    directionsUrl: '',
  },

  /**
   * Logoja. Kur logoja të ngarkohet te `public/`, plotësoni `src` dhe
   * përmasat reale (width/height) që të ruhen proporcionet origjinale.
   */
  logo: {
    /** Logoja origjinale rrethore, me sfond transparent (shih brand/). */
    src: '/images/logo-256.webp',
    srcLarge: '/images/logo-560.webp',
    /** Versioni PNG për structured data. */
    png: '/images/logo-256.png',
    width: 256,
    height: 256,
  },

  /** Portreti profesional (opsional) – p.sh. '/images/portret.jpg'. */
  portrait: {
    src: '',
    width: 0,
    height: 0,
  },

  /**
   * Mënyrat e takimit që ofrohen. Hiqni ato që nuk ofrohen.
   * KONFIRMONI me avokatin.
   */
  consultationModes: [
    { value: 'zyre', label: 'Takim në zyrë' },
    { value: 'online', label: 'Takim online (video)' },
    { value: 'telefon', label: 'Bisedë telefonike' },
  ],

  /** Informacion për tarifën e konsultës (opsional). Bosh = nuk shfaqet. */
  consultationFeeNote: '[INFORMACION PËR TARIFËN E KONSULTËS, NËSE DO TË PUBLIKOHET]',

  /**
   * Kur avokati të ketë rishikuar dhe miratuar dokumentet ligjore
   * (privatësia, njoftimi ligjor, cookies), vendoseni në `true`.
   * Deri atëherë, në krye të këtyre faqeve shfaqet një shënim draft.
   */
  legalDocumentsApproved: false,

  /** Data e përditësimit të fundit të dokumenteve ligjore. */
  legalDocumentsUpdated: '[DATA E MIRATIMIT TË DOKUMENTEVE]',
} as const;

/** Kthen `true` nëse vlera është bosh ose ende placeholder. */
export function isPlaceholder(value: string | null | undefined): boolean {
  if (!value) return true;
  return /\[[^\]]+\]/.test(value);
}

/** Kthen vlerën vetëm nëse është e konfirmuar (jo placeholder), përndryshe `undefined`. */
export function confirmed(value: string | null | undefined): string | undefined {
  return isPlaceholder(value) ? undefined : (value as string);
}

/** Emri i shkurtër që përdoret në tituj (pa placeholder në <title>). */
export function brandName(): string {
  const name = confirmed(site.lawyerName);
  return name ? `Av. ${name}` : lawyerWord.Indef;
}
