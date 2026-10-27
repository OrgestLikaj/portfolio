import type { APIRoute } from 'astro';
import { routes, serviceUrl } from '../config/navigation.ts';
import { services } from '../config/services.ts';

export const GET: APIRoute = ({ site }) => {
  const paths = [
    routes.home,
    routes.about,
    routes.services,
    ...services.map((s) => serviceUrl(s.slug)),
    routes.booking,
    routes.contact,
    routes.privacy,
    routes.legal,
    routes.cookies,
  ];
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site)}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
