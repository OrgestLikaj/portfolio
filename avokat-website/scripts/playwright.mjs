import { createRequire } from 'node:module';

/**
 * Ngarkon Playwright nga projekti ose nga instalimi global.
 * Nëse mungon: npm i -D playwright && npx playwright install chromium
 */
export async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    return createRequire(import.meta.url)('playwright');
  }
}
