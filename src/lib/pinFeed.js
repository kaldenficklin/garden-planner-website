/**
 * Builds the per-language infographic feed that a Pinterest scheduler consumes.
 *
 * This is the hand-off point to Pinterest. Tailwind, Publer and Buffer all
 * create a pin from a feed item using: the item image, the item description as
 * the pin description, and the item link as the destination URL. So each item
 * has to carry a real image and a description written for Pinterest search —
 * not the page's meta description, and not a tag dump.
 *
 * The image is included three ways on purpose, because the schedulers disagree
 * about where to look: an <enclosure>, a <media:content>, and an <img> as the
 * first element of the HTML content. Whichever one a given tool reads, it finds
 * the same 1000x1500 file.
 */
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

const COPY = {
  en: {
    title: 'Garden Pro Planner — Garden Infographics',
    description:
      'Save-and-keep reference charts for the vegetable garden: how to grow each crop, when to plant it, and the mistakes worth avoiding.',
  },
  es: {
    title: 'Garden Pro Planner — Infografías de Jardinería',
    description:
      'Fichas de consulta rápida para el huerto: cómo cultivar cada planta, cuándo sembrarla y los errores que conviene evitar.',
  },
};

const hashtag = (s) =>
  '#' + s.trim().split(/[\s\-_]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');

const escapeXml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The exact text handed to Pinterest as the pin description.
 *
 * Pinterest ranks primarily on these words, so the readable sentence carries
 * the weight and the hashtags trail it as reinforcement, capped at five per
 * Pinterest's own guidance.
 */
export function pinDescriptionFor(data) {
  const sentence = data.pinDescription ?? `${data.title}. ${data.description}`;
  const tags = (data.pinKeywords ?? data.tags ?? []).slice(0, 5).map(hashtag).join(' ');
  return tags ? `${sentence} ${tags}` : sentence;
}

export async function pinFeed(context, lang) {
  const site = context.site;
  const entries = (await getCollection('blog'))
    .filter((p) => !p.data.draft && p.data.type === 'infographic' && (p.data.lang ?? 'en') === lang)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: COPY[lang].title,
    description: COPY[lang].description,
    site,
    xmlns: { media: 'http://search.yahoo.com/mrss/' },
    items: entries.map((post) => {
      const slug = post.id.replace(/\.md$/, '').replace(/^es\//, '');
      const link = lang === 'es' ? `/es/infographics/${slug}/` : `/infographics/${slug}/`;
      const image = new URL(post.data.infographicImage ?? '/assets/app-icon.png', site).href;
      const mime = image.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const description = pinDescriptionFor(post.data);

      return {
        title: post.data.title,
        pubDate: post.data.date,
        link,
        description,
        categories: post.data.pinKeywords ?? post.data.tags,
        // Length is required by the RSS spec but no scheduler validates it,
        // and stat-ing every file at build time to fill it in accurately would
        // buy nothing.
        enclosure: { url: image, length: 0, type: mime },
        content: `<img src="${escapeXml(image)}" alt="${escapeXml(post.data.title)}" width="1000" height="1500" /><p>${escapeXml(description)}</p>`,
        customData: `<media:content url="${escapeXml(image)}" medium="image" type="${mime}" width="1000" height="1500" />`,
      };
    }),
  });
}
