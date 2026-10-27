import type { APIRoute } from 'astro';
import { indexingAllowed } from '../lib/seo.ts';

export const GET: APIRoute = ({ site }) => {
  const body = indexingAllowed
    ? `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${new URL('/sitemap.xml', site)}\n`
    : // Para miratimit për publikim, faqja nuk indeksohet (ALLOW_INDEXING=true e aktivizon).
      `User-agent: *\nDisallow: /\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
