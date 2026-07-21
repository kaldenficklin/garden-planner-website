# thegardenplanner.app

Marketing website **and blog** for **Garden Pro Planner** ([App Store](https://apps.apple.com/app/id1539031278)).

Built with [Astro](https://astro.build). The marketing pages live in `public/` and
pass through untouched; Astro builds the `/blog` section on top of them. Deployed
on Netlify — every push to `main` auto-publishes to <https://thegardenplanner.app>.

## Structure

| Path | Purpose |
| --- | --- |
| `public/index.html` | Landing page (static, passed through) |
| `public/privacy.html` | Privacy policy (`/privacy`) |
| `public/support.html` | Support / FAQ (`/support`) |
| `public/assets/style.css` | Site styles |
| `public/assets/blog.css` | Blog-specific styles |
| `src/content/blog/*.md` | **Blog posts — one Markdown file each** |
| `src/content.config.ts` | Blog frontmatter schema |
| `src/layouts/BaseLayout.astro` | Shared shell + SEO meta |
| `src/pages/blog/` | Blog index, post template, RSS feed |
| `netlify.toml` | Build + publish config |

## Adding a blog post

A post is a single Markdown file in `src/content/blog/`. Scaffold one with:

```sh
npm run new-post -- "When to Start Tomato Seeds Indoors" "seed-starting,tomatoes"
```

Then fill in the `description` and body, set `draft: false`, commit, and push.
Netlify rebuilds and the post appears on `/blog`, in the RSS feed, and in the
sitemap automatically. No HTML or template editing required.

### Frontmatter reference

```yaml
---
title: "Post title"            # required
description: "SEO/social snippet, ~155 chars"  # required
date: 2026-07-21               # required (YYYY-MM-DD)
updated: 2026-07-25            # optional
tags: ["seed-starting"]        # optional
image: "/assets/blog/foo.jpg"  # optional hero/social image
imageAlt: "alt text"           # optional
draft: false                   # true keeps it out of the build
---
```

## Local development

```sh
npm install
npm run dev       # live preview at http://localhost:4321
npm run build     # production build into dist/
npm run preview   # serve the built dist/
```

Screenshots are sourced from the app repo's `store-assets/screenshots/iphone-6.9/`.
