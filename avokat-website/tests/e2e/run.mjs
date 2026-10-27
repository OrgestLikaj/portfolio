/**
 * Testet end-to-end me Playwright mbi build-in e prodhimit.
 *
 *   npm run build && npm run test:e2e
 *
 * Nis dy instanca të serverit:
 *  - me MAIL_TRANSPORT=log (mesazhet ruhen në një dosje të përkohshme, nuk dërgohen);
 *  - pa konfigurim emaili (për të verifikuar që formularët NUK pretendojnë sukses).
 */
import { spawn } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { loadPlaywright } from '../../scripts/playwright.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const PORT = 4510;
const PORT_NOMAIL = 4511;
const BASE = `http://localhost:${PORT}`;
const BASE_NOMAIL = `http://localhost:${PORT_NOMAIL}`;

const PAGES = [
  '/',
  '/rreth-avokatit/',
  '/sherbimet/',
  '/sherbimet/ceshtje-penale/',
  '/sherbimet/ceshtje-civile/',
  '/sherbimet/ceshtje-administrative/',
  '/sherbimet/ceshtje-tregtare-dhe-biznesi/',
  '/sherbimet/perfaqesim-gjyqesor/',
  '/sherbimet/konsulence-juridike/',
  '/rezervo-konsulte/',
  '/kontakti/',
  '/politika-e-privatesise/',
  '/njoftimi-ligjor/',
  '/politika-e-cookies/',
];

/* ---------- Ndihmës ---------- */

const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`  ✗ ${name}\n    ${String(err?.message ?? err).split('\n').join('\n    ')}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function startServer(port, env) {
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => (log += d));
  child.stderr.on('data', (d) => (log += d));
  child.getLog = () => log;
  return child;
}

async function waitFor(url) {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Serveri nuk u nis: ${url}`);
}

const outboxFiles = async (dir) => (await readdir(dir).catch(() => [])).filter((f) => f.endsWith('.json'));

/** Ditët e ardhshme të punës sipas konfigurimit (llogariten në shfletues nga kodi i faqes). */
function tiranaDate(offsetDays) {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Tirane' }).format(d);
}
function isWeekend(date) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

/* ---------- Testet ---------- */

const outbox = await mkdtemp(join(tmpdir(), 'avokat-outbox-'));
const secret = randomBytes(32).toString('hex');
const server = startServer(PORT, {
  FORM_SECRET: secret,
  MAIL_TRANSPORT: 'log',
  ALLOW_LOG_TRANSPORT: 'true',
  OUTBOX_DIR: outbox,
});
const serverNoMail = startServer(PORT_NOMAIL, { FORM_SECRET: secret, MAIL_TRANSPORT: '' });

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();

try {
  await waitFor(`${BASE}/`);
  await waitFor(`${BASE_NOMAIL}/`);

  console.log('\nFaqet dhe SEO');
  const titles = new Map();
  const descriptions = new Map();
  const internalLinks = new Set();

  for (const path of PAGES) {
    await check(`faqja ${path} ngarkohet pa gabime`, async () => {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage();
      const problems = [];
      page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
      page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
      page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()}`));
      page.on('response', (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()}: ${r.url()}`));
      const res = await page.goto(BASE + path, { waitUntil: 'networkidle' });
      assert(res.status() === 200, `status ${res.status()}`);
      assert(problems.length === 0, problems.join('\n'));

      const meta = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.content ?? '',
        canonical: document.querySelector('link[rel="canonical"]')?.href ?? '',
        ogTitle: document.querySelector('meta[property="og:title"]')?.content ?? '',
        h1: document.querySelectorAll('h1').length,
        headings: [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => Number(h.tagName[1])),
        imgsNoAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
        links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
        emptyButtons: [...document.querySelectorAll('a, button')].filter(
          (el) => !el.textContent.trim() && !el.getAttribute('aria-label') && el.offsetParent !== null,
        ).length,
        unlabeled: [...document.querySelectorAll('input:not([type=hidden]), select, textarea')].filter(
          (el) => !el.closest('.hp') && !el.labels?.length && !el.getAttribute('aria-label'),
        ).length,
        ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
      }));
      assert(meta.lang === 'sq', `lang=${meta.lang}`);
      assert(meta.h1 === 1, `numri i h1: ${meta.h1}`);
      assert(meta.desc.length >= 50 && meta.desc.length <= 170, `gjatësia e përshkrimit: ${meta.desc.length}`);
      assert(meta.canonical.endsWith(path), `canonical: ${meta.canonical}`);
      assert(meta.ogTitle, 'og:title mungon');
      assert(meta.imgsNoAlt === 0, 'imazhe pa alt');
      assert(meta.emptyButtons === 0, 'lidhje/butona pa tekst');
      assert(meta.unlabeled === 0, 'fusha pa etiketë');
      for (let i = 1; i < meta.headings.length; i++) {
        assert(meta.headings[i] - meta.headings[i - 1] <= 1, `hierarkia e titujve kapërcen nivel: ${meta.headings.join(',')}`);
      }
      for (const json of meta.ld) JSON.parse(json);
      assert(!titles.has(meta.title), `titull i përsëritur: ${meta.title}`);
      assert(!descriptions.has(meta.desc), `përshkrim i përsëritur: ${meta.desc}`);
      titles.set(meta.title, path);
      descriptions.set(meta.desc, path);
      for (const l of meta.links) if (l.startsWith('/')) internalLinks.add(l.split('#')[0]);
      await ctx.close();
    });
  }

  await check('të gjitha lidhjet e brendshme funksionojnë', async () => {
    const broken = [];
    for (const href of internalLinks) {
      const r = await fetch(BASE + href, { redirect: 'manual' });
      if (r.status !== 200) broken.push(`${href} → ${r.status}`);
    }
    assert(broken.length === 0, broken.join('\n'));
  });

  await check('404 i personalizuar në shqip', async () => {
    const r = await fetch(`${BASE}/nuk-ekziston/`);
    const html = await r.text();
    assert(r.status === 404, `status ${r.status}`);
    assert(html.includes('Faqja nuk u gjet'), 'teksti i 404 mungon');
    assert(html.includes('noindex'), '404 duhet të ketë noindex');
  });

  await check('robots.txt dhe sitemap.xml', async () => {
    const robots = await (await fetch(`${BASE}/robots.txt`)).text();
    assert(robots.includes('User-agent'), 'robots.txt i pavlefshëm');
    const sm = await fetch(`${BASE}/sitemap.xml`);
    const xml = await sm.text();
    assert(sm.headers.get('content-type')?.includes('xml'), 'content-type i sitemap');
    for (const p of PAGES) assert(xml.includes(`${p}</loc>`), `sitemap pa ${p}`);
  });

  await check('kokat e sigurisë HTTP', async () => {
    const r = await fetch(`${BASE}/`);
    for (const h of ['x-content-type-options', 'x-frame-options', 'referrer-policy', 'strict-transport-security', 'content-security-policy']) {
      assert(r.headers.get(h), `mungon ${h}`);
    }
    const html = await r.text();
    assert(html.includes('http-equiv="content-security-policy"'), 'CSP në faqe mungon');
  });

  console.log('\nResponsive dhe aksesueshmëria');
  for (const [w, h] of [[360, 740], [390, 844], [768, 1024], [1024, 768], [1440, 900]]) {
    await check(`pa scroll horizontal në ${w}px`, async () => {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      const bad = [];
      for (const path of PAGES) {
        await page.goto(BASE + path, { waitUntil: 'load' });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (overflow > 0) bad.push(`${path} (+${overflow}px)`);
      }
      assert(bad.length === 0, bad.join(', '));
      await ctx.close();
    });
  }

  await check('menyja për celular hapet, mbyllet me Escape dhe kthen fokusin', async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const toggle = page.locator('[data-menu-toggle]');
    assert(await toggle.isVisible(), 'butoni i menysë nuk duket');
    assert(!(await page.locator('#mobile-menu').isVisible()), 'menyja duhet të jetë e mbyllur');
    await toggle.tap();
    assert((await toggle.getAttribute('aria-expanded')) === 'true', 'aria-expanded');
    assert(await page.locator('#mobile-menu a[href="/kontakti/"]').isVisible(), 'lidhjet e menysë');
    await page.keyboard.press('Escape');
    assert((await toggle.getAttribute('aria-expanded')) === 'false', 'Escape nuk e mbylli');
    assert(await page.evaluate(() => document.activeElement?.hasAttribute('data-menu-toggle')), 'fokusi nuk u kthye');
    await toggle.tap();
    await page.locator('#mobile-menu a[href="/kontakti/"]').tap();
    await page.waitForURL('**/kontakti/');
    await ctx.close();
  });

  await check('navigimi me tastierë: skip link dhe fokus i dukshëm', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    const first = await page.evaluate(() => ({
      cls: document.activeElement?.className,
      outline: getComputedStyle(document.activeElement).outlineStyle,
      top: document.activeElement.getBoundingClientRect().top,
    }));
    assert(first.cls.includes('skip-link'), `elementi i parë: ${first.cls}`);
    assert(first.top >= 0, 'skip link nuk shfaqet në fokus');
    await page.keyboard.press('Enter');
    assert(await page.evaluate(() => document.activeElement?.id === 'main'), 'fokusi nuk kaloi te përmbajtja');
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    assert(outline !== 'none', 'fokusi nuk është i dukshëm');
    await ctx.close();
  });

  console.log('\nFormulari i kontaktit');
  await check('validimi: fushat bosh shfaqin gabime dhe fokusi shkon te e para', async () => {
    const page = await browser.newPage();
    await page.goto(`${BASE}/kontakti/`, { waitUntil: 'networkidle' });
    await page.click('form[data-form="contact"] [data-submit]');
    assert(await page.locator('#c-name-err').isVisible(), 'gabimi i emrit');
    assert(await page.locator('#c-email-err').isVisible(), 'gabimi i emailit');
    assert(await page.locator('#c-privacy-err').isVisible(), 'gabimi i privatësisë');
    assert((await page.getAttribute('#c-name', 'aria-invalid')) === 'true', 'aria-invalid');
    assert(await page.evaluate(() => document.activeElement?.id === 'c-name'), 'fokusi');
    await page.fill('#c-email', 'jo-email');
    await page.locator('#c-email').blur();
    assert((await page.textContent('#c-email-err')).includes('të vlefshme'), 'mesazhi për email të pavlefshëm');
    await page.close();
  });

  await check('dërgim i suksesshëm (një email, pa dyfishim nga klikime të shumëfishta)', async () => {
    const before = (await outboxFiles(outbox)).length;
    const page = await browser.newPage();
    await page.goto(`${BASE}/kontakti/`, { waitUntil: 'networkidle' });
    await page.fill('#c-name', 'Arta Hoxha');
    await page.fill('#c-email', 'arta@example.com');
    await page.selectOption('#c-service', 'ceshtje-civile');
    await page.fill('#c-message', 'Kam një pyetje të përgjithshme për një kontratë qiraje.');
    await page.check('form[data-form="contact"] input[name="privacy"]');
    await page.waitForTimeout(3200);
    const btn = page.locator('form[data-form="contact"] [data-submit]');
    await Promise.all([btn.click(), btn.click({ force: true }).catch(() => {}), btn.click({ force: true }).catch(() => {})]);
    await page.locator('[data-success]').waitFor({ state: 'visible' });
    const msg = await page.textContent('[data-success-message]');
    assert(msg.includes('u dërgua me sukses'), `mesazhi: ${msg}`);
    assert(await page.evaluate(() => document.activeElement?.hasAttribute('data-success')), 'fokusi te konfirmimi');
    const after = await outboxFiles(outbox);
    assert(after.length === before + 1, `pritej 1 email i ri, u gjetën ${after.length - before}`);
    const mail = JSON.parse(await readFile(join(outbox, after.sort().at(-1)), 'utf8'));
    assert(mail.replyTo === 'arta@example.com', 'reply-to');
    assert(mail.text.includes('Arta Hoxha') && mail.text.includes('Çështje civile'), 'përmbajtja e emailit');
    // "Dërgo një mesazh tjetër" rikthen formularin bosh.
    await page.click('[data-reset]');
    assert(await page.locator('form[data-form="contact"]').isVisible(), 'formulari nuk u rikthye');
    assert((await page.inputValue('#c-name')) === '', 'formulari nuk u pastrua');
    await page.close();
  });

  await check('pa konfigurim emaili: shfaqet gabim, jo sukses', async () => {
    const page = await browser.newPage();
    await page.goto(`${BASE_NOMAIL}/kontakti/`, { waitUntil: 'networkidle' });
    await page.fill('#c-name', 'Arta Hoxha');
    await page.fill('#c-email', 'arta@example.com');
    await page.selectOption('#c-service', 'tjeter');
    await page.fill('#c-message', 'Mesazh testimi për gjendjen e gabimit.');
    await page.check('form[data-form="contact"] input[name="privacy"]');
    await page.waitForTimeout(3200);
    await page.click('form[data-form="contact"] [data-submit]');
    await page.locator('.form-alert--error').waitFor();
    assert(!(await page.locator('[data-success]').isVisible()), 'u shfaq sukses pa dërgim real');
    assert((await page.textContent('.form-alert--error')).includes('nuk është i disponueshëm'), 'mesazhi 503');
    assert(!(await page.locator('[data-submit]').isDisabled()), 'butoni mbeti i bllokuar');
    await page.close();
  });

  console.log('\nRezervimi');
  const weekdays = [];
  for (let i = 1; weekdays.length < 3 && i < 30; i++) {
    const d = tiranaDate(i);
    if (!isWeekend(d)) weekdays.push(d);
  }
  let saturday = '';
  for (let i = 2; i < 10; i++) if (new Date(`${tiranaDate(i)}T12:00:00Z`).getUTCDay() === 6) { saturday = tiranaDate(i); break; }

  await check('data e padisponueshme (e shtunë, e kaluar) nuk ofron orare', async () => {
    const page = await browser.newPage();
    await page.goto(`${BASE}/rezervo-konsulte/`, { waitUntil: 'networkidle' });
    await page.fill('#b-date', saturday);
    assert(await page.locator('#b-date-err').isVisible(), 'gabimi për të shtunën');
    assert((await page.locator('[data-slots] input').count()) === 0, 'u shfaqën orare për të shtunën');
    await page.fill('#b-date', tiranaDate(-3));
    assert((await page.textContent('#b-date-err')).includes('ka kaluar'), 'gabimi për datë të kaluar');
    await page.close();
  });

  await check('rezervim i suksesshëm me para-zgjedhje shërbimi nga URL', async () => {
    const before = (await outboxFiles(outbox)).length;
    const page = await browser.newPage();
    await page.goto(`${BASE}/rezervo-konsulte/?sherbimi=ceshtje-penale`, { waitUntil: 'networkidle' });
    assert((await page.inputValue('#b-service')) === 'ceshtje-penale', 'shërbimi nuk u para-zgjodh');
    await page.fill('#b-name', 'Besnik Krasniqi');
    await page.fill('#b-phone', '+355 69 123 4567');
    let date = '';
    for (const d of weekdays) {
      await page.fill('#b-date', d);
      if ((await page.locator('[data-slots] input').count()) > 0) { date = d; break; }
    }
    assert(date, 'nuk u gjet asnjë ditë me orare');
    await page.locator('[data-slots] label').first().click();
    await page.locator('label.choice:has(input[name="mode"][value="zyre"])').click();
    await page.fill('#b-note', 'Konsultë e përgjithshme.');
    await page.check('form[data-form="booking"] input[name="privacy"]');
    await page.waitForTimeout(3200);
    await page.click('form[data-form="booking"] [data-submit]');
    await page.locator('[data-success]').waitFor({ state: 'visible' });
    const msg = await page.textContent('[data-success-message]');
    assert(msg.includes('nuk është ende konfirmim'), `mesazhi duhet të sqarojë që s'është konfirmim: ${msg}`);
    const after = await outboxFiles(outbox);
    assert(after.length === before + 1, 'emaili i rezervimit');
    const mail = JSON.parse(await readFile(join(outbox, after.sort().at(-1)), 'utf8'));
    assert(mail.text.includes('nuk është konfirmuar') && mail.text.includes('Çështje penale'), 'përmbajtja');
    await page.close();
  });

  console.log('\nAPI (validimi në server)');
  const token = async (base = BASE) => (await (await fetch(`${base}/api/form-token/`)).json()).token;
  const post = (path, body, base = BASE) =>
    fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify(body),
    });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const validBooking = (t) => ({
    service: 'konsulence-juridike', name: 'Test Përdorues', email: 'test@example.com', phone: '',
    date: weekdays[0], time: '10:00', mode: 'online', note: '', privacy: true, website: '',
    token: t, requestId: crypto.randomUUID(),
  });

  await check('serveri refuzon orë jashtë orarit dhe datë të shtunë (422)', async () => {
    const t = await token();
    await sleep(3100);
    const r1 = await post('/api/rezervim/', { ...validBooking(t), time: '13:00' });
    assert(r1.status === 422, `status ${r1.status}`);
    assert((await r1.json()).errors.time, 'gabimi i orës');
    const r2 = await post('/api/rezervim/', { ...validBooking(t), date: saturday });
    assert(r2.status === 422 && (await r2.json()).errors.date, 'gabimi i datës');
  });

  await check('serveri refuzon honeypot, token që mungon dhe dërgim shumë të shpejtë', async () => {
    const t = await token();
    const fast = await post('/api/rezervim/', validBooking(t));
    assert(fast.status === 400 && (await fast.json()).code === 'too-fast', 'too-fast');
    await sleep(3100);
    const hp = await post('/api/rezervim/', { ...validBooking(t), website: 'http://spam' });
    assert(hp.status === 400, `honeypot ${hp.status}`);
    const nt = await post('/api/rezervim/', { ...validBooking(''), token: undefined });
    assert(nt.status === 400, `pa token ${nt.status}`);
    const bad = await fetch(`${BASE}/api/kontakt/`, { method: 'POST', headers: { 'Content-Type': 'text/plain', Origin: BASE }, body: 'x' });
    assert(bad.status >= 400, `content-type i gabuar ${bad.status}`);
  });

  await check('e njëjta kërkesë (requestId) nuk dërgohet dy herë', async () => {
    const before = (await outboxFiles(outbox)).length;
    const t = await token();
    await sleep(3100);
    const body = validBooking(t);
    const [a, b] = await Promise.all([post('/api/rezervim/', body), post('/api/rezervim/', body)]);
    const statuses = [a.status, b.status].sort();
    const c = await post('/api/rezervim/', body);
    const cj = await c.json();
    assert(cj.ok && cj.duplicate, 'përsëritja duhet të njihet si dublikatë');
    const after = (await outboxFiles(outbox)).length;
    assert(after === before + 1, `pritej 1 email, u dërguan ${after - before} (statuset ${statuses})`);
  });

  await check('kufizimi i kërkesave kthen 429', async () => {
    const t = await token();
    await sleep(3100);
    let limited = false;
    for (let i = 0; i < 8; i++) {
      const r = await post('/api/kontakt/', {
        name: 'Test Kufizimi', email: 'rate@example.com', phone: '', service: 'tjeter',
        message: 'Test i kufizimit të kërkesave.', privacy: true, website: '', token: t,
        requestId: crypto.randomUUID(),
      });
      if (r.status === 429) { limited = true; break; }
    }
    assert(limited, 'asnjë përgjigje 429');
  });
} finally {
  await browser.close();
  server.kill();
  serverNoMail.kill();
  await rm(outbox, { recursive: true, force: true });
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} kontrolle kaluan.`);
if (failed.length) {
  console.log('Dështuan:\n' + failed.map((f) => `  - ${f.name}`).join('\n'));
  console.log('\nLog-u i serverit:\n' + server.getLog());
  process.exit(1);
}
