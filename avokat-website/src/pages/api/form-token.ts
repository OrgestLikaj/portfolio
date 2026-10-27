import type { APIRoute } from 'astro';
import { issueToken } from '../../lib/server/protection.ts';
import { json } from '../../lib/server/handle-form.ts';

export const prerender = false;

/** Lëshon një token të ri për formularët (kontroll kohe kundër robotëve). */
export const GET: APIRoute = () => json({ token: issueToken() });
