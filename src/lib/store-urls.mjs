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

/**
 * Topic-matched store pages.
 *
 * Both stores can show a different product page depending on the link that
 * brought the visitor: Apple's Custom Product Pages are addressed by `?ppid=`,
 * Play's custom store listings by `&listing=`. A post about slugs eating the
 * lettuce sends its reader to the page that opens on the pest guide instead of
 * the one that opens on the planting calendar — the default listing leads with
 * timing, which is the right first screen for a "when to plant" reader and the
 * wrong one for a "what's eating my plants" reader.
 *
 * Posts opt in with `storePage` in their frontmatter (see content.config.ts).
 * An entry with empty ids resolves to the default listing, so a page can be
 * named here before it exists in either console and the links upgrade
 * themselves the day the ids are filled in. `timing` is deliberately the
 * default listing: it is already what that page sells.
 *
 * Fill `ppid` from `npm run cpp:sync` in the app repo (it prints one per page)
 * and `listing` from the URL name chosen when the custom listing is created in
 * Play Console. Play's rule for the name: lowercase letters, digits, `. - _ ~`.
 */
export const STORE_PAGES = {
  timing: { ppid: '', listing: '' },
  pests: { ppid: '', listing: '' },
  savings: { ppid: '', listing: '' },
  beds: { ppid: '', listing: '' },
};

/**
 * The store URL for a page, on a store. Unknown or unset pages, and pages with
 * no id yet, return the plain listing URL — never a broken parameter.
 *
 * `store` is 'ios' or 'android'. analytics.js decorates the result with the
 * campaign parameters at click-through time; it uses URLSearchParams.set, so
 * the ppid / listing added here survive that pass.
 */
export function storeUrl(store, page) {
  const entry = (page && STORE_PAGES[page]) || null;
  if (store === 'android') {
    if (!entry?.listing) return PLAY_STORE;
    const url = new URL(PLAY_STORE);
    url.searchParams.set('listing', entry.listing);
    return url.href;
  }
  if (!entry?.ppid) return APP_STORE;
  const url = new URL(APP_STORE);
  url.searchParams.set('ppid', entry.ppid);
  return url.href;
}
