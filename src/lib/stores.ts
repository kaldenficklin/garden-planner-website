/**
 * Where the app lives. Both listings are the same app under different
 * identities — Apple keys off the bundle ID `gardenPlanner.app`, Play off the
 * package `com.ficklinholdings.gardenplanner` (NOT `com.gardenplanner`, which
 * another publisher holds permanently; see app.config.ts in the app repo).
 *
 * Import these rather than pasting the URLs: they were hardcoded in nine files
 * before Android shipped, and every one of them had to be found by grep.
 */
export const APP_STORE = 'https://apps.apple.com/app/id1539031278';
export const PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.ficklinholdings.gardenplanner';

/** Both listings, for schema.org `sameAs`. */
export const STORE_LINKS = [APP_STORE, PLAY_STORE];
