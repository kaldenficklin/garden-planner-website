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
    // Short badge label above the pin title, and a word/phrase from the title
    // to render in accent yellow. Both optional; see STYLE.md's Titles
    // section and scripts/lib/overlay.mjs.
    pinEyebrow: z.string().optional(),
    pinHighlight: z.string().optional(),
    // Set to true to keep a post out of the build while drafting.
    draft: z.boolean().default(false),

    // 'article' (default) is a normal written post. 'infographic' is a short
    // blurb built around one composed reference-chart image (see
    // scripts/lib/infographic.mjs) rather than a full article — a different
    // reading pattern, kept in the same collection so it shares tags, RSS,
    // and routing infrastructure. See src/lib/posts.ts for where the two are
    // filtered apart.
    type: z.enum(['article', 'infographic']).default('article'),

    // Language of this entry. Articles are English only; infographics ship as
    // an en/es pair. The two halves of a pair share a `translationKey`, which
    // is what wires up the hreflang alternates and the language switcher.
    lang: z.enum(['en', 'es']).default('en'),
    translationKey: z.string().optional(),

    // Pinterest description for this entry, written as a sentence a person
    // would search rather than a tag dump. Falls back to `description`. This
    // is what the pin feeds in src/pages/infographics/rss.xml.js carry, so it
    // is the text a scheduler hands to Pinterest verbatim.
    pinDescription: z.string().optional(),
    // Which board this pin belongs on, matching the board names in SOCIAL.md.
    pinBoard: z.string().optional(),

    // Which infographic template to composite:
    //  'mistakes' — numbered two-column "the mistake / the better habit" rows
    //  'ranked'   — numbered single-column ranked list with a stat per row
    //  'guide'    — numbered how-to grid, 8 steps in two columns + a pro tip
    infographicLayout: z.enum(['mistakes', 'ranked', 'guide']).optional(),
    // Small eyebrow line above the infographic's big title, e.g.
    // "CONSISTENCY MATTERS". Optional.
    infographicEyebrow: z.string().optional(),
    // The big title set on the infographic canvas itself. Can differ from
    // `title` (the SEO/page title) if the on-image version needs to be
    // shorter or punchier.
    infographicTitle: z.string().optional(),
    // The composed infographic image, self-contained (title + all rows baked
    // in), used as both the on-page image and the Pinterest pin — no
    // separate pinImage needed for this type. Written by scripts/gen-infographic.mjs.
    infographicImage: z.string().optional(),
    // Row data for the infographic. Same shape serves both layouts; each
    // layout only reads the fields it needs.
    // Row data for the 'guide' layout: exactly 8 steps, each with an icon slug
    // and up to two short bullets. The card geometry in
    // scripts/lib/infographic.mjs is sized for two bullets of roughly six
    // words; longer copy is clamped and reported as a QA warning rather than
    // silently overflowing.
    guideSteps: z
      .array(
        z.object({
          icon: z.string(), // icon slug, must exist in public/assets/icons/
          label: z.string(),
          bullets: z.array(z.string()).max(2),
        })
      )
      .optional(),
    // Optional highlighted strip above the footer on the 'guide' layout.
    guideProTip: z
      .object({ label: z.string(), text: z.string(), icon: z.string().optional() })
      .optional(),
    // The green footer bar's call to action. The site domain underneath it is
    // fixed in scripts/lib/infographic.mjs, not set per post.
    guideCta: z.string().optional(),

    infographicItems: z
      .array(
        z.object({
          icon: z.string(), // icon slug, must exist in public/assets/icons/
          number: z.number().optional(), // rank (ranked layout) or mistake # (mistakes layout)
          label: z.string(), // ranked: item name. mistakes: the mistake's headline.
          labelBody: z.string().optional(), // mistakes: short description of the mistake.
          fix: z.string().optional(), // mistakes layout: the better-habit headline.
          fixBody: z.string().optional(), // mistakes layout: short description of the fix.
          stat: z.string().optional(), // ranked layout: the number/stat, e.g. "23 days".
          tip: z.string().optional(), // ranked layout: one-line tip.
        })
      )
      .optional(),
  }),
});

export const collections = { blog };
