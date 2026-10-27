/**
 * Shton prefiksin e `base` (p.sh. kur faqja shërbehet nga një nën-dosje,
 * si në versionin paraprak në GitHub Pages). Në prodhim base është "/".
 */
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

export function withBase(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  return `${BASE}${path}`;
}

/** Versioni paraprak statik: formularët nuk dërgojnë mesazhe. */
export const IS_PREVIEW = import.meta.env.PUBLIC_PREVIEW === 'true';
