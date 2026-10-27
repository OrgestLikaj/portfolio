# Studio Ligjore Gega – faqja e internetit

Faqja zyrtare e Av. Gentjan Gega (gegaattorney.al). E ndërtuar me [Astro](https://astro.build) dhe TypeScript.
Faqet janë statike (të shpejta dhe të sigurta), ndërsa formularët e kontaktit dhe të rezervimit përpunohen
në server dhe dërgohen me email.

> **Para publikimit:** lexoni [`docs/HANDOVER.md`](docs/HANDOVER.md). Aty janë udhëzimet për hostimin,
> domenin, emailin, testet dhe lista e informacionit që duhet plotësuar ose miratuar nga avokati.

## Komandat

```bash
npm install                 # instalon varësitë (Node.js 22.12+)
npm run dev                 # zhvillim lokal: http://localhost:4321
npm run build               # build-i i prodhimit në dist/
npm start                   # nis serverin e prodhimit (pas build-it): http://localhost:8080
npm run check               # kontroll i tipeve (TypeScript/Astro)
npm run test:unit           # testet e logjikës (validimi, disponueshmëria, mbrojtja nga spami)
npm run test:e2e            # testet në shfletues (kërkon build-in dhe Playwright)
npm run audit:placeholders  # liston informacionin që mungon ende në faqe
```

Për të testuar formularët lokalisht pa dërguar email:

```bash
MAIL_TRANSPORT=log npm run dev   # mesazhet ruhen në .outbox/ në vend që të dërgohen
```

## Ku ndryshohet përmbajtja

| Çfarë | Ku |
| --- | --- |
| Emri, kontaktet, adresa, orari, logoja, portreti | `src/config/site.ts` |
| Shërbimet juridike (tekstet dhe shembujt) | `src/config/services.ts` |
| Oraret e takimeve, festat, ditët pa pritje | `src/config/availability.ts` |
| Ngjyrat dhe tipografia | `src/styles/global.css` (variablat në `:root`) |
| Faqet | `src/pages/` |
| Imazhet e markës (og-image, favicon) | `npm run images` |
