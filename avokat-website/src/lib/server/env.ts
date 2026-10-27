/** Lexon variablat e mjedisit në kohën e ekzekutimit (asnjëherë në kodin e shfletuesit). */
export function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== '' ? v.trim() : undefined;
}

/** `true` në build-in e prodhimit (Astro) ose kur NODE_ENV=production. */
export function isProduction(): boolean {
  const viteEnv = (import.meta as { env?: { PROD?: boolean } }).env;
  return viteEnv?.PROD ?? process.env.NODE_ENV === 'production';
}
