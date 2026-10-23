/**
 * One RSS feed per Pinterest board, for Pinterest's own auto-publish.
 *
 * Pinterest (Settings → Bulk create Pins → Auto-publish) connects each feed to
 * exactly one board and creates a pin from every new item, usually within a
 * day or two. That is why the feeds are split by board rather than one feed
 * for everything: the board is chosen at connection time, not per item.
 *
 * Items are the live entries from AUTO_PIN_FROM on, so a future-dated post
 * enters its feed on the morning the daily build publishes it. The image is
 * offered three ways for the same reason as src/lib/pinFeed.js.
 */
import rss from '@astrojs/rss';
import { publishedPosts } from '../../lib/posts';
import { PIN_BOARDS, autoPins, boardFor, toPin } from '../../lib/pinQueue';

/**
 * Pinterest refuses to connect a feed with no items, and these feeds only list
 * entries from AUTO_PIN_FROM on, so a board with nothing new yet can't be
 * connected. While this is on, an empty feed carries that board's most recent
 * live entry (else the latest in its language) so it can be connected. Turn it
 * back off as soon as the feeds are connected: Pinterest pins what a feed
 * holds, oldest first, so a seed left in place becomes a duplicate pin.
 */
const SEED_EMPTY_FEEDS = true;

const escapeXml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function getStaticPaths() {
  return Object.keys(PIN_BOARDS).map((board) => ({ params: { board } }));
}

export async function GET(context) {
  const { board } = context.params;
  const live = await publishedPosts();
  let pins = autoPins(live, context.site).filter((p) => p.boardSlug === board);
  if (SEED_EMPTY_FEEDS && pins.length === 0) {
    const lang = board === 'infografias-de-jardineria' || board === 'consejos-para-el-huerto' ? 'es' : 'en';
    const seed =
      live.find((p) => boardFor(p) === board && toPin(p, context.site)) ??
      live.find((p) => p.data.lang === lang && toPin(p, context.site));
    const pin = seed && toPin(seed, context.site);
    if (pin) pins = [pin];
  }

  return rss({
    title: `Garden Planner Pro — ${PIN_BOARDS[board]}`,
    description: `New pins for the ${PIN_BOARDS[board]} board from thegardenplanner.app.`,
    site: context.site,
    xmlns: { media: 'http://search.yahoo.com/mrss/' },
    items: pins.map((pin) => {
      const mime = pin.image.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return {
        title: pin.title,
        pubDate: new Date(`${pin.date}T11:00:00Z`),
        link: pin.link,
        description: pin.description,
        enclosure: { url: pin.image, length: 0, type: mime },
        content: `<img src="${escapeXml(pin.image)}" alt="${escapeXml(pin.altText)}" width="1000" height="1500" /><p>${escapeXml(pin.description)}</p>`,
        customData: `<media:content url="${escapeXml(pin.image)}" medium="image" type="${mime}" width="1000" height="1500" />`,
      };
    }),
  });
}
