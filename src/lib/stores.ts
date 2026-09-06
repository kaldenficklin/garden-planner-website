/**
 * Where the app lives. Both listings are the same app under different
 * identities — Apple keys off the bundle ID `gardenPlanner.app`, Play off the
 * package `com.ficklinholdings.gardenplanner` (NOT `com.gardenplanner`, which
 * another publisher holds permanently; see app.config.ts in the app repo).
 *
 * The values themselves live in ./store-urls.mjs so the rehype plugin that runs
 * inside the markdown pipeline can share them. Import from here in src/.
 */
export { APP_STORE, PLAY_STORE } from './store-urls.mjs';
import { APP_STORE, PLAY_STORE } from './store-urls.mjs';

/** Both listings, for schema.org `sameAs`. */
export const STORE_LINKS = [APP_STORE, PLAY_STORE];
