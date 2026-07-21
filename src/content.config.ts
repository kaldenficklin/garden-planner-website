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
    // Optional social/hero image (path under /assets or absolute URL).
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    // Set to true to keep a post out of the build while drafting.
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
