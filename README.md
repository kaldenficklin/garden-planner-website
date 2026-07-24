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
| `public/assets/analytics.js` | GA4 + campaign attribution + download tracking |
| `public/assets/site.js` | Mobile download bar |
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

## Analytics & ad tracking

Google Analytics 4 runs on every page via `public/assets/analytics.js`.
Measurement ID **`G-D8MEPMRV8T`** ("Garden Planner" property, web stream
15277152559). Everything is configured at the top of that one file.

### The conversion

Every tap on an App Store link fires a GA4 event named **`app_store_click`**.
That is the number to watch — it counts people sent to the App Store, which is
as far as the web can see. (Apple does not report back who installed, so actual
installs live in App Store Connect, not GA.)

Each event carries:

| Parameter | Meaning |
| --- | --- |
| `cta_location` | Which button: `hero`, `sticky-bar`, `header`, `footer-band`, `post-footer`, … |
| `utm_source` … `utm_term` | Standard campaign tags |
| `campaign_id`, `adgroup_id`, `ad_id` | Reddit's IDs, for splitting results by ad |
| `rdt_cid` | Reddit click ID |

Campaign tags are saved to `sessionStorage` on arrival, so someone who lands on
an ad, reads a blog post, and *then* downloads is still credited to the ad.

**One-time setup in GA:** Admin → Events → mark `app_store_click` as a key
event, so it shows up as a conversion in reports. To break results down by
`cta_location` or `ad_id`, register them under Admin → Custom definitions.

### Reddit ad destination URL

Paste this as the ad's destination. The `{{…}}` parts are Reddit macros — it
fills them in per ad, so one URL covers every ad in the campaign:

```
https://thegardenplanner.app/?utm_source=reddit&utm_medium=cpc&utm_term=r_gardening&utm_campaign={{CAMPAIGN_NAME}}&utm_content={{AD_NAME}}&campaign_id={{CAMPAIGN_ID}}&adgroup_id={{ADGROUP_ID}}&ad_id={{AD_ID}}
```

Change `utm_term` per ad group if you branch out past r/gardening. Results show
up in GA under Reports → Acquisition → Traffic acquisition, with `reddit / cpc`
as the source/medium.

### Optional, both off by default

Two settings at the top of `analytics.js`:

- `REDDIT_ADVERTISER_ID` — turns on the Reddit pixel so Reddit can optimize
  delivery toward people who actually tap through. Found in Reddit Ads →
  Events Manager → Reddit Pixel.
- `APPLE_PROVIDER_TOKEN` — from App Store Connect → App Analytics → Campaigns.
  Set it and App Store product-page views get tagged with the same campaign, so
  Apple's install numbers line up with GA's click numbers.

## Local development

```sh
npm install
npm run dev       # live preview at http://localhost:4321
npm run build     # production build into dist/
npm run preview   # serve the built dist/
```

Screenshots are sourced from the app repo's `store-assets/screenshots/iphone-6.9/`.
