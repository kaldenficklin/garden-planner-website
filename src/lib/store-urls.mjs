/**
 * The store URLs, as plain JS so that both TypeScript modules and the Astro
 * config (which loads before the TS pipeline) can read the same values.
 *
 * `src/lib/stores.ts` re-exports these for everything in src/, and
 * `src/lib/rehype-app-cta.mjs` imports them directly — it runs inside the
 * markdown pipeline configured from astro.config.mjs.
 *
 * These were hardcoded in nine files before Android shipped and every one had
 * to be found by grep. One source, two entry points.
 */
export const APP_STORE = 'https://apps.apple.com/app/id1539031278';
export const PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.ficklinholdings.gardenplanner';
