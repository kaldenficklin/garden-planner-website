/**
 * Everything that hands an infographic to Pinterest.
 *
 * Three places need the exact same wording — the pin feed a scheduler reads,
 * the Save button on a detail page, and the Save button on each grid card — so
 * the description is built here once. A pin that says one thing in the feed and
 * another when a reader saves it splits the signal Pinterest ranks on.
 */

/** The frontmatter fields a pin is built from. */
export interface PinData {
  title: string;
  description: string;
  pinDescription?: string;
  pinKeywords?: string[];
  tags?: string[];
}

const hashtag = (s: string) =>
  '#' + s.trim().split(/[\s\-_]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');

/**
 * The exact text handed to Pinterest as the pin description.
 *
 * Pinterest ranks primarily on these words, so the readable sentence carries
 * the weight and the hashtags trail it as reinforcement, capped at five per
 * Pinterest's own guidance.
 */
export function pinDescriptionFor(data: PinData): string {
  const sentence = data.pinDescription ?? `${data.title}. ${data.description}`;
  const tags = (data.pinKeywords ?? data.tags ?? []).slice(0, 5).map(hashtag).join(' ');
  return tags ? `${sentence} ${tags}` : sentence;
}

/**
 * A Pin It link. `url` is the page the pin points back at, `media` the 1000x1500
 * chart itself — Pinterest saves the image but sends clicks to the page, so both
 * have to be absolute.
 */
export const pinCreateHref = (url: string, media: string, description: string) =>
  'https://www.pinterest.com/pin/create/button/' +
  `?url=${encodeURIComponent(url)}` +
  `&media=${encodeURIComponent(media)}` +
  `&description=${encodeURIComponent(description)}`;
