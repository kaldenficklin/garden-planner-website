import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Every blog post is a single Markdown file in src/content/blog/.
// An AI agent (or a human) only needs to create one .md file with the
// frontmatter below — the site rebuilds and the post appears everywhere:
// the /blog index, the RSS feed, and the sitemap.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    // Hero image: the clean photo with no text on it. Shown at the top of the
    // post, and used as og:image / twitter:image when the URL is shared.
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    // Pinterest image: the same photo at 2:3 with the title overlaid in brand
    // type. Handed to Pinterest by the Pin button and by data-pin-media.
    // Both files come from scripts/gen-post-image.mjs.
    pinImage: z.string().optional(),
    // Shorter title for the pin overlay, for when the SEO title is too long to
    // sit well on an image. Falls back to `title`.
    pinTitle: z.string().optional(),
    // Which band of the tall master photo becomes the wide hero. Recorded here
    // so scripts/rebuild-images.mjs reproduces the same crop. Default picks the
    // busiest region, which is wrong when the subject sits low in the frame.
    heroCrop: z.enum(['attention', 'entropy', 'centre', 'north', 'south']).optional(),
    // Search terms appended to the Pinterest description as hashtags. Write them
    // as things people actually search on Pinterest ("fall vegetable garden"),
    // not as site taxonomy. Falls back to `tags`, which are usually weaker.
    // Keep to 3–5; Pinterest ranks on the description text far more than on
    // hashtags, so these are reinforcement, not the strategy.
    pinKeywords: z.array(z.string()).optional(),
    // Set to true to keep a post out of the build while drafting.
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
