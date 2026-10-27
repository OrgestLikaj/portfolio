/**
 * Logjika e formularëve në shfletues: validim, gjendjet e ngarkimit,
 * suksesit dhe gabimit, si dhe parandalimi i dërgimeve të dyfishta.
 * Serveri e përsërit gjithmonë validimin.
 */
import { validateBooking, validateContact, dateIssueMessage, type Errors } from '../lib/validation.ts';
import { bookingWindow, checkDate, slotsFor } from '../lib/availability.ts';
import { withBase } from '../lib/url.ts';
import { site } from '../config/site.ts';

type Kind = 'contact' | 'booking';

const ENDPOINT: Record<Kind, string> = { contact: withBase('/api/kontakt/'), booking: withBase('/api/rezervim/') };

const PREVIEW_MSG = `Ky është një version paraprak i faqes: të dhënat janë të vlefshme, por kërkesa NUK u dërgua. Për kontakt: ${site.contact.phoneDisplay} ose ${site.contact.email}.`;

const NETWORK_ERROR =
  'Nuk u arrit lidhja me serverin. Kontrolloni lidhjen me internetin dhe provoni përsëri, ose më kontaktoni drejtpërdrejt.';

function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

async function fetchToken(): Promise<string | null> {
  try {
    const res = await fetch(withBase('/api/form-token/'), { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const body = (await res.json()) as { token?: string };
    return body.token ?? null;
  } catch {
    return null;
  }
}

function readForm(form: HTMLFormElement): Record<string, unknown> {
  const fd = new FormData(form);
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) if (typeof v === 'string') out[k] = v;
  out.privacy = (form.elements.namedItem('privacy') as HTMLInputElement | null)?.checked ?? false;
  return out;
}

export function initForm(form: HTMLFormElement, kind: Kind) {
  const wrap = form.closest<HTMLElement>('[data-form-wrap]')!;
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]')!;
  const success = wrap.querySelector<HTMLElement>('[data-success]')!;
  const successMsg = wrap.querySelector<HTMLElement>('[data-success-message]')!;
  const resetBtn = wrap.querySelector<HTMLButtonElement>('[data-reset]');
  const idleLabel = submitLabel.textContent ?? '';

  // Versioni paraprak statik (p.sh. GitHub Pages) nuk ka server: formulari validohet, por nuk dërgohet.
  const preview = form.dataset.preview === 'true';
  const getToken = () => (preview ? Promise.resolve(null) : fetchToken());

  let token: string | null = null;
  let tokenPromise: Promise<string | null> = getToken().then((t) => (token = t));
  let requestId = newRequestId();
  let busy = false;
  let attempted = false;

  const validate = (): Errors => {
    const input = readForm(form);
    return kind === 'contact' ? validateContact(input).errors : validateBooking(input).errors;
  };

  /* ---------- Shfaqja e gabimeve ---------- */

  function fieldControls(name: string): HTMLElement[] {
    return Array.from(form.querySelectorAll<HTMLElement>(`[name="${name}"]`));
  }

  function errorEl(name: string): HTMLElement | null {
    const control = fieldControls(name)[0];
    const container = control?.closest('.field');
    return container?.querySelector<HTMLElement>('.field__error') ?? null;
  }

  function showErrors(errors: Errors, onlyNames?: string[]) {
    const names = new Set<string>();
    form.querySelectorAll<HTMLElement>('[name]').forEach((el) => {
      const n = el.getAttribute('name');
      if (n && n !== 'website') names.add(n);
    });
    if (kind === 'booking') names.add('time');
    for (const name of names) {
      if (onlyNames && !onlyNames.includes(name)) continue;
      const msg = errors[name];
      const el = errorEl(name);
      for (const c of fieldControls(name)) {
        if (msg) c.setAttribute('aria-invalid', 'true');
        else c.removeAttribute('aria-invalid');
      }
      if (el) {
        el.textContent = msg ?? '';
        el.hidden = !msg;
      }
    }
  }

  function focusFirstError(errors: Errors) {
    const order = Array.from(form.querySelectorAll<HTMLElement>('[name]'))
      .map((el) => el.getAttribute('name')!)
      .filter((n, i, a) => a.indexOf(n) === i);
    if (kind === 'booking' && !order.includes('time')) order.push('time');
    const first = order.find((n) => errors[n]);
    if (!first) return;
    const target =
      first === 'time'
        ? form.querySelector<HTMLElement>('[data-slots] input') ?? form.querySelector<HTMLElement>('#b-date')
        : fieldControls(first)[0];
    target?.focus();
  }

  function setStatus(message: string, tone: 'error' | 'info' = 'error') {
    status.innerHTML = '';
    if (!message) return;
    const div = document.createElement('div');
    div.className = `form-alert form-alert--${tone}`;
    div.textContent = message;
    status.appendChild(div);
  }

  function setBusy(on: boolean) {
    busy = on;
    submit.disabled = on;
    submit.setAttribute('aria-busy', String(on));
    submitLabel.textContent = on ? 'Duke dërguar…' : idleLabel;
    form.setAttribute('aria-busy', String(on));
  }

  /* ---------- Validimi gjatë plotësimit ---------- */

  form.addEventListener('focusout', (e) => {
    const name = (e.target as HTMLElement).getAttribute?.('name');
    if (!name || !attempted) return;
    showErrors(validate(), name === 'email' || name === 'phone' ? ['email', 'phone'] : [name]);
  });
  form.addEventListener('change', (e) => {
    const name = (e.target as HTMLElement).getAttribute?.('name');
    if (!name || !attempted) return;
    showErrors(validate(), [name]);
  });

  form.querySelectorAll<HTMLTextAreaElement>('textarea[data-counter]').forEach((ta) => {
    const counter = document.getElementById(ta.dataset.counter!);
    const update = () => {
      if (counter) counter.textContent = `${ta.value.length} / ${ta.maxLength}`;
    };
    ta.addEventListener('input', update);
    update();
  });

  /* ---------- Rezervimi: data dhe oraret ---------- */

  if (kind === 'booking') {
    const dateInput = form.querySelector<HTMLInputElement>('input[name="date"]')!;
    const slotsBox = form.querySelector<HTMLElement>('[data-slots]')!;
    const slotsEmpty = form.querySelector<HTMLElement>('[data-slots-empty]')!;
    const { min, max } = bookingWindow();
    dateInput.min = min;
    dateInput.max = max;

    const renderSlots = () => {
      const date = dateInput.value;
      const previous = (form.querySelector<HTMLInputElement>('input[name="time"]:checked') ?? null)?.value;
      slotsBox.innerHTML = '';
      const dateErr = errorEl('date');
      if (!date) {
        slotsEmpty.textContent = 'Zgjidhni fillimisht një datë për të parë oraret e mundshme.';
        slotsEmpty.hidden = false;
        return;
      }
      const issue = checkDate(date);
      if (issue) {
        slotsEmpty.textContent = 'Nuk ka orare të mundshme për datën e zgjedhur.';
        slotsEmpty.hidden = false;
        if (dateErr) {
          dateErr.textContent = dateIssueMessage(issue);
          dateErr.hidden = false;
        }
        dateInput.setAttribute('aria-invalid', 'true');
        return;
      }
      if (dateErr) {
        dateErr.hidden = true;
        dateErr.textContent = '';
      }
      dateInput.removeAttribute('aria-invalid');
      const slots = slotsFor(date);
      slotsEmpty.hidden = true;
      for (const t of slots) {
        const label = document.createElement('label');
        label.className = 'choice';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'time';
        input.value = t;
        input.required = true;
        input.setAttribute('aria-describedby', 'b-time-err');
        if (t === previous) input.checked = true;
        const span = document.createElement('span');
        span.textContent = t;
        label.append(input, span);
        slotsBox.appendChild(label);
      }
    };
    dateInput.addEventListener('change', renderSlots);
    dateInput.addEventListener('input', renderSlots);
    renderSlots();

    // Para-zgjedhja e shërbimit nga faqet e shërbimeve (?sherbimi=...).
    const pre = new URLSearchParams(location.search).get('sherbimi');
    const select = form.querySelector<HTMLSelectElement>('select[name="service"]');
    if (pre && select && Array.from(select.options).some((o) => o.value === pre)) select.value = pre;
  }

  /* ---------- Dërgimi ---------- */

  async function send(payload: Record<string, unknown>, retry = true): Promise<void> {
    let res: Response;
    try {
      res = await fetch(ENDPOINT[kind], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      setStatus(NETWORK_ERROR);
      return;
    }

    let body: { ok?: boolean; code?: string; message?: string; errors?: Errors } = {};
    try {
      body = await res.json();
    } catch {
      /* përgjigje jo-JSON */
    }

    if (res.ok && body.ok) {
      successMsg.textContent = body.message ?? '';
      form.hidden = true;
      success.hidden = false;
      success.focus();
      return;
    }

    if (body.code === 'token-expired' && retry) {
      token = await fetchToken();
      if (token) return send({ ...payload, token }, false);
    }

    if (body.code === 'invalid' && body.errors) {
      showErrors(body.errors);
      focusFirstError(body.errors);
    }
    setStatus(body.message ?? NETWORK_ERROR);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return; // parandalon dërgimin e dyfishtë
    attempted = true;
    setStatus('');

    const errors = validate();
    showErrors(errors);
    if (Object.keys(errors).length > 0) {
      setStatus('Ju lutemi kontrolloni fushat e shënuara.');
      focusFirstError(errors);
      return;
    }

    if (preview) {
      setStatus(PREVIEW_MSG, 'info');
      return;
    }

    setBusy(true);
    try {
      if (!token) token = await tokenPromise;
      if (!token) token = await (tokenPromise = fetchToken());
      if (!token) {
        setStatus(NETWORK_ERROR);
        return;
      }
      await send({ ...readForm(form), token, requestId });
    } finally {
      setBusy(false);
    }
  });

  resetBtn?.addEventListener('click', () => {
    form.reset();
    attempted = false;
    requestId = newRequestId();
    token = null;
    tokenPromise = getToken().then((t) => (token = t));
    showErrors({});
    setStatus('');
    form.querySelectorAll<HTMLTextAreaElement>('textarea[data-counter]').forEach((ta) =>
      ta.dispatchEvent(new Event('input')),
    );
    form.querySelector<HTMLInputElement>('input[name="date"]')?.dispatchEvent(new Event('change'));
    success.hidden = true;
    form.hidden = false;
    form.querySelector<HTMLElement>('select, input:not([type="hidden"])')?.focus();
  });
}
