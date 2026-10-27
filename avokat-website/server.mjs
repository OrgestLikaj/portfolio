/**
 * Serveri i prodhimit: shërben faqet statike dhe API-të e formularëve të
 * build-it të Astro, duke shtuar kokat e sigurisë HTTP.
 *
 *   npm run build && npm start
 *
 * Variablat: PORT (parazgjedhje 8080), HOST (parazgjedhje 0.0.0.0).
 */
import http from 'node:http';

process.env.ASTRO_NODE_AUTOSTART = 'disabled';
const { handler } = await import('./dist/server/entry.mjs');

const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  // CSP kryesore vendoset nga Astro në çdo faqe (me hash-e për skriptet);
  // direktivat që nuk lejohen në <meta> vendosen këtu.
  'Content-Security-Policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
};

const port = Number(process.env.PORT ?? 8080);
const host = process.env.HOST ?? '0.0.0.0';

const server = http.createServer((req, res) => {
  for (const [k, v] of Object.entries(securityHeaders)) res.setHeader(k, v);
  if (req.url?.startsWith('/_astro/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  handler(req, res);
});

server.headersTimeout = 15_000;
server.requestTimeout = 30_000;
server.listen(port, host, () => {
  console.log(`Serveri po punon në http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
