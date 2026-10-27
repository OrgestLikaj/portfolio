/**
 * Liston të gjitha placeholder-at (informacion që mungon) në build-in e faqes.
 *
 *   npm run build && npm run audit:placeholders            # raport
 *   npm run audit:placeholders -- --strict                  # dështon nëse ka placeholder (para publikimit)
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/client', import.meta.url));
const strict = process.argv.includes('--strict');

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(p);
    else if (entry.name.endsWith('.html')) yield p;
  }
}

const decode = (s) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&').replace(/&quot;/g, '"');

const all = new Map();
let files;
try {
  files = htmlFiles(dist);
  for await (const file of files) {
    const html = decode(await readFile(file, 'utf8'));
    const found = new Set([...html.matchAll(/\[[A-ZËÇ0-9][A-ZËÇ0-9 ,.:;/()–'’-]{3,}\]/g)].map((m) => m[0]));
    const page = '/' + relative(dist, file).replace(/index\.html$/, '').replace(/\\/g, '/');
    for (const ph of found) {
      if (!all.has(ph)) all.set(ph, new Set());
      all.get(ph).add(page);
    }
  }
} catch (err) {
  console.error('Nuk u gjet build-i. Ekzekutoni fillimisht: npm run build');
  process.exit(2);
}

if (all.size === 0) {
  console.log('Nuk u gjet asnjë placeholder. ✓');
  process.exit(0);
}

console.log(`U gjetën ${all.size} placeholder-a të ndryshëm:\n`);
for (const [ph, pages] of [...all].sort((a, b) => b[1].size - a[1].size)) {
  const list = [...pages].sort();
  console.log(`• ${ph}\n    ${list.length > 4 ? `${list.length} faqe` : list.join(', ')}`);
}
console.log('\nPlotësojini në src/config/site.ts ose në faqen përkatëse (shih docs/HANDOVER.md).');
if (strict) process.exit(1);
