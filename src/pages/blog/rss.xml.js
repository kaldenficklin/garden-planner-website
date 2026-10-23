import rss from '@astrojs/rss';
import { publishedPosts, articles, postHref } from '../../lib/posts';

export async function GET(context) {
  // English articles only. Infographics have their own per-language feeds
  // (src/lib/pinFeed.js) — two a day would swamp this one within a month — and
  // each Spanish article is a translation of one already in here.
  const posts = articles(await publishedPosts());

  return rss({
    title: 'Garden Planner Pro Blog',
    description:
      'Practical gardening guides: when to plant, companion planting, pest control, seed starting, and harvest tips.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postHref(post),
      categories: post.data.tags,
    })),
  });
}
