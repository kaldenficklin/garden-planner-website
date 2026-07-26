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
