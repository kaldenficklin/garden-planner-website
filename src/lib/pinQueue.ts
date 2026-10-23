/**
 * The pins the site hands to Pinterest without a human in the loop.
 *
 * Two consumers read this, and they must agree on every word:
 *
 *   - Pinterest's own RSS auto-publish, through one feed per board
 *     (src/pages/pinterest/[board].xml.js). Pinterest polls each feed and
 *     creates a pin on that board for every new item.
 *   - The `blogPublishDaily` Cloud Function in garden-pro-planner, through
 *     /pinterest/pins.json, once the Pinterest API app has Standard access.
 *
 * Only one of them should be switched on at a time, or every post is pinned
 * twice. While the RSS feeds are connected in Pinterest, the function's
 * PINTEREST_MODE stays "off".
 */
import type { Post } from './posts';
import { entrySlug, postHref } from './posts';
import { pinDescriptionFor, pinTitleFor } from './pinterest';

/**
 * The boards automation is allowed to pin to, and the feed slug for each.
 * Every name here already exists on the Pinterest account; a feed that names a
 * board Pinterest doesn't have can't be connected, so adding a board means
 * creating it on Pinterest first.
 */
export const PIN_BOARDS = {
  'vegetable-garden-layouts': 'Vegetable Garden Layouts',
  'raised-bed-gardening': 'Raised Bed Gardening',
  'companion-planting': 'Companion Planting',
  'garden-pests-organic-control': 'Garden Pests & Organic Control',
  'seed-starting-frost-dates': 'Seed Starting & Frost Dates',
  'container-small-space-gardening': 'Container & Small Space Gardening',
  'garden-infographics': 'Garden Infographics',
  'infografias-de-jardineria': 'Infografías de Jardinería',
  'consejos-para-el-huerto': 'Consejos para el Huerto',
} as const;

export type BoardSlug = keyof typeof PIN_BOARDS;

/**
 * Nothing dated before this is auto-pinned. Everything older was pinned by
 * hand from the weekly briefs, and connecting a feed that listed the back
 * catalogue would re-pin all of it — duplicate pins are what Pinterest
 * suppresses.
 */
export const AUTO_PIN_FROM = '2026-10-23';

/**
 * Which board an entry goes on.
 *
 * Everything Spanish goes on a Spanish board, because a Spanish pin on an
 * English board reads as spam to the algorithm and to that board's followers.
 * Infographics go by language and nothing else: Garden Infographics carries
 * most of the account's reach. English articles use `pinBoard`; one without
 * it falls back on what the post is about, so a missing field still lands
 * somewhere sensible.
 */
export function boardFor(post: Post): BoardSlug {
  if (post.data.type === 'infographic') {
    return post.data.lang === 'es' ? 'infografias-de-jardineria' : 'garden-infographics';
  }
  if (post.data.lang === 'es') return 'consejos-para-el-huerto';
  const named = Object.entries(PIN_BOARDS).find(([, name]) => name === post.data.pinBoard);
  if (named) return named[0] as BoardSlug;
  return post.data.storePage === 'pests' ? 'garden-pests-organic-control' : 'vegetable-garden-layouts';
}

/**
 * The tagged destination URL, in the same shape the weekly briefs used so the
 * funnel report can keep reading `utm_content` the way it always has.
 */
export function pinDestination(post: Post, site: URL): string {
  const url = new URL(postHref(post), site);
  url.searchParams.set('utm_source', 'pinterest');
  url.searchParams.set('utm_medium', 'social');
  url.searchParams.set('utm_campaign', entrySlug(post));
  if (post.data.type === 'infographic') {
    url.searchParams.set('utm_content', post.data.lang === 'es' ? 'infographic-es' : 'infographic');
  } else if (post.data.lang === 'es') {
    url.searchParams.set('utm_content', 'article-es');
  }
  return url.href;
}

export interface QueuedPin {
  /** Stable across builds: the function records this to never pin twice. */
  key: string;
  date: string;
  type: 'article' | 'infographic';
  lang: 'en' | 'es';
  board: string;
  boardSlug: BoardSlug;
  title: string;
  description: string;
  altText: string;
  link: string;
  /** The page itself, untagged, for checking it resolves before pinning. */
  pageUrl: string;
  image: string;
}

/** An entry as a pin, or null if it has no pin image to give Pinterest. */
export function toPin(post: Post, site: URL): QueuedPin | null {
  const imagePath =
    post.data.type === 'infographic' ? post.data.infographicImage : post.data.pinImage;
  if (!imagePath) return null;
  const boardSlug = boardFor(post);
  return {
    key: `${post.data.lang}/${post.data.type}/${entrySlug(post)}`,
    date: post.data.date.toISOString().slice(0, 10),
    type: post.data.type,
    lang: post.data.lang,
    board: PIN_BOARDS[boardSlug],
    boardSlug,
    title: pinTitleFor(post.data),
    description: pinDescriptionFor(post.data),
    altText: post.data.imageAlt ?? post.data.title,
    link: pinDestination(post, site),
    pageUrl: new URL(postHref(post), site).href,
    image: new URL(imagePath, site).href,
  };
}

/** Live entries eligible for automatic pinning, newest first. */
export const autoPins = (live: Post[], site: URL): QueuedPin[] =>
  live
    .filter((p) => p.data.date.toISOString().slice(0, 10) >= AUTO_PIN_FROM)
    .map((p) => toPin(p, site))
    .filter((p): p is QueuedPin => p !== null);
