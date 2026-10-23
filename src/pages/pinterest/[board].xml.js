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
import { PIN_BOARDS, autoPins } from '../../lib/pinQueue';

const escapeXml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function getStaticPaths() {
  return Object.keys(PIN_BOARDS).map((board) => ({ params: { board } }));
}

export async function GET(context) {
  const { board } = context.params;
  const pins = autoPins(await publishedPosts(), context.site).filter((p) => p.boardSlug === board);

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
