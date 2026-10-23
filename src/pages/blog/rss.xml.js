import rss from '@astrojs/rss';
import { publishedPosts } from '../../lib/posts';

export async function GET(context) {
  const posts = (await publishedPosts())
    // Infographics have their own per-language feeds (src/lib/pinFeed.js).
    // Two a day would swamp the article feed within a month.
    .filter((p) => p.data.type !== 'infographic');

  return rss({
    title: 'Garden Planner Pro Blog',
    description:
      'Practical gardening guides: when to plant, companion planting, pest control, seed starting, and harvest tips.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
  });
}
