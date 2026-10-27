/**
 * Gjeneron imazhet e markës nga vula origjinale (brand/logo-seal.png):
 *  - public/og-image.png (1200×630) për ndarjen në rrjete sociale;
 *  - public/apple-touch-icon.png (180×180);
 *  - public/favicon-32.png, favicon-48.png, favicon-192.png (monogrami në qendër të vulës).
 *
 *   node --experimental-strip-types scripts/generate-images.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadPlaywright } from './playwright.mjs';
import { site, lawyerWord } from '../src/config/site.ts';

const root = new URL('..', import.meta.url);
const b64 = (p) => readFileSync(fileURLToPath(new URL(p, root))).toString('base64');
const cormorant = b64('node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2');
const inter = b64('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');
const seal = `data:image/png;base64,${b64('brand/logo-seal.png')}`;
const out = (p) => fileURLToPath(new URL(`public/${p}`, root));

const base = `
@font-face { font-family: C; src: url(data:font/woff2;base64,${cormorant}) format('woff2'); font-weight: 500; }
@font-face { font-family: I; src: url(data:font/woff2;base64,${inter}) format('woff2'); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }`;


const og = `<!doctype html><html><head><meta charset="utf-8"><style>${base}
body { width: 1200px; height: 630px; background: #0c1d38; color: #f6f2ea; font-family: I; position: relative; overflow: hidden; }
.lines { position: absolute; right: 0; top: 0; bottom: 0; width: 560px;
  background-image: repeating-linear-gradient(90deg, rgba(214,169,79,.14) 0 1px, transparent 1px 56px);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 50%); }
.seal { position: absolute; right: 96px; top: 115px; width: 400px; height: 400px; border-radius: 50%;
  box-shadow: 0 30px 80px rgba(0,0,0,.45); }
.wrap { position: absolute; left: 88px; top: 110px; width: 600px; }
.eyebrow { font-size: 17px; letter-spacing: .22em; text-transform: uppercase; color: #d6a94f; margin-bottom: 28px; }
h1 { font: 500 76px/1.04 C; letter-spacing: -.01em; }
.role { font: 500 34px/1.2 C; color: #d6a94f; font-style: italic; margin-top: 18px; }
.foot { position: absolute; left: 88px; bottom: 76px; font-size: 21px; color: rgba(246,242,234,.72); }
.foot b { font-weight: 500; color: #f6f2ea; }
</style></head><body><div class="lines"></div><img class="seal" src="${seal}">
<div class="wrap"><div class="eyebrow">${site.practiceName}</div>
<h1>Av. ${site.lawyerName}</h1><div class="role">Këshillim dhe përfaqësim ligjor</div></div>
<div class="foot"><b>${site.domain}</b> &nbsp;·&nbsp; ${lawyerWord.Indef} në Shqipëri</div></body></html>`;

const icon = (size, monogram) => `<!doctype html><html><head><style>${base}
body { width: ${size}px; height: ${size}px; background: #fff; overflow: hidden; position: relative; }
img { position: absolute; ${
  monogram
    ? `width: ${size / 0.48}px; left: ${(-0.27 * size) / 0.48}px; top: ${(-0.215 * size) / 0.48}px;`
    : `width: ${size * 0.94}px; left: ${size * 0.03}px; top: ${size * 0.03}px;`
} }
</style></head><body><img src="${seal}"></body></html>`;

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const shot = async (html, w, h, file) => {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: out(file) });
  };
  await shot(og, 1200, 630, 'og-image.png');
  await shot(icon(180, false), 180, 180, 'apple-touch-icon.png');
  for (const n of [32, 48, 192]) await shot(icon(n, true), n, n, `favicon-${n}.png`);
  console.log('U gjeneruan: og-image.png, apple-touch-icon.png, favicon-32/48/192.png');
} finally {
  await browser.close();
}
