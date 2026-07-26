import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** How many posts appear on one page of /blog. */
export const PER_PAGE = 6;

/** Every published post, newest first. The one place drafts get filtered. */
export async function publishedPosts(): Promise<Post[]> {
  return (await getCollection('blog'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const totalPages = (count: number) => Math.max(1, Math.ceil(count / PER_PAGE));

/** Page 1 lives at /blog/; the rest at /blog/page/2/ and up. */
export const pageHref = (n: number) => (n <= 1 ? '/blog/' : `/blog/page/${n}/`);

/**
 * A tag needs this many posts before it gets its own page. A hub holding one
 * post is a near-duplicate of that post and nothing for Google to rank, so
 * thinner tags stay as plain labels until the blog grows into them.
 */
export const MIN_TAG_POSTS = 2;

/** Tags are already written kebab-case in frontmatter; this is belt and braces. */
export const tagSlug = (tag: string) =>
  tag.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Headings and titles for the tag hubs. A tag with no entry here falls back to
 * title-casing its slug, which reads fine ("container-gardening" → "Container
 * Gardening") — add an entry only when the tag needs better search wording than
 * its own name, or a real intro sentence.
 */
const TAG_COPY: Record<string, { label: string; intro: string }> = {
  'pest-control': {
    label: 'Pest Control',
    intro:
      'How to identify the pest doing the damage and get rid of it without reaching for anything harsh — hornworms, squash bugs, aphids and the rest.',
  },
  'companion-planting': {
    label: 'Companion Planting',
    intro:
      'What to plant next to what, which pairings actually earn their reputation, and the combinations worth keeping apart.',
  },
  beginners: {
    label: 'Beginner Gardening',
    intro:
      'Start-here guides for a first vegetable garden: what to grow, when to plant it, and how much water it really needs.',
  },
  tomatoes: {
    label: 'Growing Tomatoes',
    intro:
      'Seed starting, spacing, companions and pests — everything the most-grown crop in the vegetable garden asks of you.',
  },
  'organic-gardening': {
    label: 'Organic Gardening',
    intro: 'Working with the garden rather than spraying it: natural pest control and healthier soil.',
  },
  'plant-science': {
    label: 'Plant Science',
    intro: 'The botany behind what happens in the bed, and why some of it defies what the produce aisle taught you.',
  },
  vegetables: {
    label: 'Vegetables',
    intro: 'Crop-by-crop guides to what grows well, where, and when.',
  },
  squash: {
    label: 'Growing Squash',
    intro: 'Zucchini, summer squash and winter squash — pollination, pests, and why the fruit sometimes never sets.',
  },
  summer: {
    label: 'Summer Gardening',
    intro: 'Keeping a garden productive through the hottest stretch of the season.',
  },
};

const titleCase = (slug: string) =>
  slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export function tagCopy(tag: string) {
  return (
    TAG_COPY[tagSlug(tag)] ?? {
      label: titleCase(tagSlug(tag)),
      intro: `Guides and how-tos from the Garden Pro Planner blog on ${titleCase(tagSlug(tag)).toLowerCase()}.`,
    }
  );
}

/** Tags with enough posts to deserve a hub page, most-used first. */
export function tagsWithPages(posts: Post[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tagSlug(tag), (counts.get(tagSlug(tag)) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= MIN_TAG_POSTS)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export const postsWithTag = (posts: Post[], tag: string) =>
  posts.filter((p) => p.data.tags.some((t) => tagSlug(t) === tagSlug(tag)));

/**
 * Posts a reader of `post` is most likely to want next: the ones sharing the
 * most tags, then the most recent. Tags are the only signal the frontmatter
 * gives us, and pinKeywords are written for Pinterest search rather than for
 * grouping, so they are deliberately left out.
 *
 * Always returns `limit` posts as long as the blog has that many — a post with
 * no tag overlap at all still gets the newest ones rather than an empty rail.
 */
export function relatedPosts(post: Post, all: Post[], limit = 3): Post[] {
  const tags = new Set(post.data.tags);

  return all
    .filter((p) => p.id !== post.id)
    .map((p) => ({ p, shared: p.data.tags.filter((t) => tags.has(t)).length }))
    .sort((a, b) => b.shared - a.shared || b.p.data.date.valueOf() - a.p.data.date.valueOf())
    .slice(0, limit)
    .map((x) => x.p);
}

// timeZone: 'UTC' because frontmatter dates parse as UTC midnight — without it,
// a build machine west of Greenwich renders every post a day early.
export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
