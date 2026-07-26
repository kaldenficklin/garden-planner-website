# thegardenplanner.app

Marketing website **and blog** for **Garden Pro Planner** ([App Store](https://apps.apple.com/app/id1539031278)).

Built with [Astro](https://astro.build). The secondary marketing pages live in
`public/` and pass through untouched; Astro builds the landing page and the
`/blog` section. Deployed on Netlify — every push to `main` auto-publishes to
<https://thegardenplanner.app>.

## Structure

| Path | Purpose |
| --- | --- |
| `src/pages/index.astro` | Landing page — its own `<head>`, not `BaseLayout` |
| `public/privacy.html` | Privacy policy (`/privacy`) |
| `public/support.html` | Support / FAQ (`/support`) |
| `public/terms.html` | Terms (`/terms`) |
| `public/assets/style.css` | Site styles |
| `public/assets/blog.css` | Blog-specific styles |
| `public/assets/analytics.js` | GA4 + campaign attribution + download tracking |
| `public/assets/site.js` | Mobile download bar |
| `public/assets/screens/` | App screenshots — see "App screenshots" below |
| `src/content/blog/*.md` | **Blog posts — one Markdown file each** |
| `src/content.config.ts` | Blog frontmatter schema |
| `src/layouts/BaseLayout.astro` | Shared shell + SEO meta (every page but `/`) |
| `src/lib/posts.ts` | Post queries, page size, related-post ranking |
| `src/components/` | Post cards, post list, pager, related posts, post nav |
| `src/pages/blog/` | Blog index, `/blog/page/N/`, post template, RSS feed |
| `netlify.toml` | Build + publish config |

The landing page is an Astro page rather than static HTML only because its
"From the blog" section reads the post collection. Everything else about it is
still hand-written markup, and it deliberately keeps its own `<head>` — the app
and FAQ structured data on it belong to no other page.

## Blog pagination

`/blog/` shows the newest `PER_PAGE` posts (6, set in `src/lib/posts.ts`); older
pages are `/blog/page/2/`, `/blog/page/3/`, and so on. Page 1 keeps the bare
`/blog/` URL so the section's main address never moves. Every page carries its
own canonical plus `rel="prev"` / `rel="next"`, and each post links to the posts
published either side of it.

Related posts ("You might also be interested in") are ranked by shared `tags`,
then by recency — so tagging a post accurately is what makes it show up in the
right places.

## Adding a blog post

A post is a single Markdown file in `src/content/blog/`. Scaffold one with:

```sh
npm run new-post -- "When to Start Tomato Seeds Indoors" "seed-starting,tomatoes"
```

Then fill in the `description` and body, set `draft: false`, commit, and push.
Netlify rebuilds and the post appears on `/blog`, in the RSS feed, and in the
sitemap automatically. No HTML or template editing required.

**Voice and style are defined in [`STYLE.md`](STYLE.md)** — read it before
writing. It also lists the writing patterns that are banned on this blog.

### Frontmatter reference

```yaml
---
title: "Post title"            # required
description: "SEO/social snippet, ~155 chars"  # required
date: 2026-07-21               # required (YYYY-MM-DD)
updated: 2026-07-25            # optional
tags: ["seed-starting"]        # optional
image: "/assets/blog/foo-hero.jpg"   # hero photo, also used as og:image
imageAlt: "alt text"                 # describes the hero photo
pinImage: "/assets/blog/foo-pin.jpg" # 2:3 Pinterest image, title burned in
pinTitle: "Shorter Pin Title"        # optional, when `title` is too long
heroCrop: "south"                    # optional, see "Post images" below
pinKeywords: ["fall vegetable garden", "organic pest control"]  # 3–5, see below
draft: false                   # true keeps it out of the build
---
```

## Post images

Each post gets two images, both generated from one photo:

| File | Size | Where it's used |
| --- | --- | --- |
| `<slug>-hero.jpg` | 1200×800 | Top of the post; `og:image` and `twitter:image` for link shares |
| `<slug>-pin.jpg` | 1000×1500 | Pinterest only — same photo with the title overlaid in brand type |

Generate both with one command:

```sh
node scripts/gen-post-image.mjs \
  --slug how-to-plant-garlic-in-fall \
  --title "How to Plant Garlic in Fall" \
  --subject "hands pressing garlic cloves into dark soil in a raised bed, papery bulbs and a trowel beside them, autumn light"
```

`--subject` describes only what is *in* the shot. The house photographic style
lives in `scripts/gen-post-image.mjs` and is appended automatically, so every
hero on the blog looks like it came from the same photographer. Change that
`STYLE` constant only if you intend to restyle the whole blog.

The photo comes from the Higgsfield CLI (`higgsfield auth login` once, ~7
credits per post). The title is composited locally by `scripts/make-images.mjs`
using the brand fonts in `scripts/fonts/`, so the type is crisp and identical on
every pin rather than being hallucinated into the image.

**If the hero crop cuts the point out of the photo**, don't regenerate — the
hero is a wide slice of a tall image, and the default picks the busiest region,
which is wrong whenever the subject sits low in the frame (a tree over a dying
bed, pots on a patio). Add `--crop south` (or `north` / `centre`) and record the
same value as `heroCrop` in the post's frontmatter so it survives a rebuild.

To re-composite every post after changing the pin design, the fonts, or the JPEG
quality — no credits, no regeneration:

```sh
node scripts/rebuild-images.mjs
```

It reads each post's `pinTitle` and `heroCrop` from frontmatter and rebuilds from
the cached masters in `$TMPDIR/gpp-masters/`. Posts whose master has been cleaned
up are skipped with a warning.

### How Pinterest gets the right image

Three paths, all pointing at `<slug>-pin.jpg`:

1. The **"Save this pin"** button on each post passes it explicitly as `media=`.
2. `data-pin-media` on the hero `<img>` overrides what Pinterest's browser
   extension would otherwise grab.
3. An off-screen copy of the pin (`.pin-source`) so Pinterest's "save from URL"
   flow offers the branded image.

`og:image` stays the clean hero, because a 2:3 portrait looks wrong in a
Twitter, Slack, or iMessage unfurl.

### Pinterest discoverability

The pin description is built as `pinTitle. description #Hashtags`. Pinterest
ranks primarily on the readable sentence, so `description` is doing most of the
work; the hashtags derived from `pinKeywords` are reinforcement, capped at 5 and
placed last, which matches Pinterest's own guidance. Write `pinKeywords` as
phrases people type into Pinterest search, not as site taxonomy.

Posts also emit `article:published_time`, `article:modified_time`,
`article:author` and `article:tag`, which is what Pinterest reads for **Article
Rich Pins** (headline, author, date and site name shown on the pin).

Two things have to be done once, by hand, in a Pinterest business account:

1. **Claim `thegardenplanner.app`** (Settings → Claimed accounts). This turns on
   Rich Pins for the domain and attaches site attribution to every pin from it,
   including repins.
2. **Validate one post URL** in the Pinterest Rich Pin Validator to switch
   Article Rich Pins on.

### Sharing beyond Pinterest

The hero also carries a **Share** button that calls the Web Share API, so on
mobile it opens the OS share sheet (Messages, WhatsApp, Facebook, email —
whatever the reader has). On desktop, where Web Share is patchy, it copies the
link instead. That covers every other platform without a row of per-network
buttons that mostly go unclicked.

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

## App screenshots

`public/assets/screens/` is a copy of the app repo's plain iPhone 6.9" captures,
resized for the web. To refresh them after a UI change, recapture in the app repo
and re-sync:

```sh
cd ../garden-pro-planner && npm run screenshots:capture
```

```sh
node scripts/sync-screens.mjs
```

The sync script reads `../garden-pro-planner/store-assets/screenshots/iphone-6.9/`
(override with `APP_REPO=…`) and writes 660px-wide PNGs — 2x the widest size the
site ever displays them at. Use the *plain* captures, not the composed
`store-assets/marketing/` images: the site draws its own phone bezel in CSS.

Copy claims that quote the app (plant count, feature names) come from the App
Store listing in `../garden-pro-planner/store.config.json`. Check it when the
app ships a release.
