// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Domeni përfundimtar vendoset me variablin SITE_URL gjatë build-it
// (p.sh. SITE_URL=https://www.domeni-juaj.al npm run build).
const site = process.env.SITE_URL || 'https://gegaattorney.al';
// Nën-dosja kur faqja shërbehet jashtë rrënjës së domenit (p.sh. versioni paraprak në GitHub Pages).
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  output: 'static',
  adapter: node({ mode: 'standalone', bodySizeLimit: 32 * 1024 }),
  compressHTML: true,
  markdown: { syntaxHighlight: false },
  security: {
    checkOrigin: true,
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
      ],
    },
  },
  server: { port: 4321 },
});
