# thegardenplanner.app

Marketing website **and blog** for **Garden Pro Planner** ([App Store](https://apps.apple.com/app/id1539031278)).

Built with [Astro](https://astro.build). The secondary marketing pages live in
`public/` and pass through untouched; Astro builds the landing page and the
`/blog` section. Deployed on Netlify — every push to `main` auto-publishes to
<https://thegardenplanner.app>.

## Structure

| Path | Purpose |
| --- | --- |
| `src/pages/index.astro` | US landing page (`/`) — a thin wrapper over `Landing.astro` |
| `src/pages/uk.astro` | UK landing page (`/uk/`) — same, with the UK market |
| `src/components/Landing.astro` | The landing page itself, rendered once per market |
| `src/lib/markets.ts` | **Everything that differs between the US and UK pages** |
| `src/components/SavingsEstimator.astro` | The interactive "what could one bed save you?" block |
| `src/lib/rehype-app-cta.mjs` | Injects the mid-article CTA into every post |
| `src/pages/about.astro` | About / publisher page (`/about`) |
| `public/privacy.html` | Privacy policy (`/privacy`) |
| `public/support.html` | Support / FAQ (`/support`) |
| `public/terms.html` | Terms (`/terms`) |
| `public/assets/style.css` | Site styles — **mobile first**, `min-width` queries |
| `public/assets/blog.css` | Blog-specific styles — mobile first too |
| `public/assets/analytics.js` | GA4 + campaign attribution + download tracking |
| `public/assets/site.js` | Mobile download bar |
| `public/assets/screens/` | App screenshots — see "App screenshots" below |
| `src/content/blog/*.md` | **Blog posts — one Markdown file each** |
| `src/content.config.ts` | Blog frontmatter schema |
| `src/layouts/BaseLayout.astro` | Shared shell + SEO meta (every page but `/`) |
| `src/lib/posts.ts` | Post queries, page size, related-post ranking |
| `src/components/` | Post cards, post list, pager, related posts, post nav |
| `src/pages/blog/` | Blog index, `/blog/page/N/`, tag hubs, post template, RSS |
| `netlify.toml` | Build + publish config |

## Two landing pages, US and UK

`/` is the US page and `/uk/` the UK one. Both render `Landing.astro`; every
difference between them — spelling, hardiness language, "yard" vs "allotment",
`$`/lb vs `£`/kg, crop names, hero photograph, FAQ — is data on the `Market`
object in `src/lib/markets.ts`. **Change copy there, not in the component**, or
the two pages drift.

Why two URLs rather than one page that swaps words at runtime: Google indexes
what the crawler is served, so a runtime swap ranks US wording in the UK too.
The pages carry reciprocal `hreflang` (`en-US`, `en-GB`, and `x-default` on `/`)
via `landingAlternates()` — a one-sided set is ignored, so both pages must list
both. `/` is `x-default` because every other locale falls back to it.

The hero photographs are generated per market by
`scripts/gen-marketing-images.mjs` against the local image-api.

## The blog's app CTA

Every post gets **two** CTAs, and the important one is not at the bottom.

- **Mid-article**, injected by `src/lib/rehype-app-cta.mjs` immediately before
  the third `<h2>`. Almost nobody reaches the end of a post they arrived at
  from a search for "why is my zucchini not fruiting" — they read until their
  question is answered and leave — so the only CTA that can catch them is
  inside the answer. It is a rehype pass rather than markup in the page
  component because `<Content />` offers no seam to splice at; doing it at the
  HAST stage also puts it in the crawled HTML and costs no layout shift.
- **End of post**, in `src/pages/blog/[...slug].astro`, written for the reader
  who did finish.

Set **`ctaHook`** in a post's frontmatter: one sentence tying *that* post's
subject to the app. A generic "get the app" earns nothing mid-article. Posts
without one fall back to a generic timing-and-savings line.

Infographic entries are skipped — they are a caption around one image.

## Blog pagination

`/blog/` shows the newest `PER_PAGE` posts (6, set in `src/lib/posts.ts`); older
pages are `/blog/page/2/`, `/blog/page/3/`, and so on. Page 1 keeps the bare
`/blog/` URL so the section's main address never moves. Every page carries its
own canonical plus `rel="prev"` / `rel="next"`, and each post links to the posts
published either side of it.

Related posts ("You might also be interested in") are ranked by shared `tags`,
then by recency — so tagging a post accurately is what makes it show up in the
right places.

## Tag hubs

A tag gets its own page at `/blog/tag/<tag>/` once `MIN_TAG_POSTS` (2) posts
carry it. Below that it renders as a plain label rather than a link — a hub
holding one post is a near-duplicate of that post and nothing for Google to
rank, and linking to pages that don't exist is worse than not linking.

Nothing needs registering: tag a post and the hub appears (or is created) on the
next build. `TAG_COPY` in `src/lib/posts.ts` holds the heading and intro
sentence for the main tags; a tag with no entry falls back to title-casing its
own slug, which reads fine. Add an entry when a tag deserves better search
wording than its name — the intro is the page's meta description.

**Keep the vocabulary tight.** Tags are the internal-linking graph, so near
duplicates (`summer` / `summer-care`, `vegetables` / `vegetable-garden`) split
posts across hubs that should be one. Reuse an existing tag before coining one.

## SEO conventions

Worth knowing before changing anything in `<head>`:

- **`max-image-preview:large`** on every indexable page. It's what makes the
  site eligible for Google Discover's large cards, which for seasonal gardening
  content is a bigger traffic source than it looks. Post heroes are 1200×800,
  over the 1200px width Discover requires — don't shrink them.
- **`BreadcrumbList`** comes from `Breadcrumbs.astro`, which renders the trail
  and its schema together so the two can't drift apart. Use it on any new page
  type rather than hand-writing crumbs.
- **`Organization` / `WebSite`** are declared once on the landing page under a
  stable `@id`; posts reference that `@id` as their publisher, so Google
  resolves the site, the blog and the app to one entity.
- **`FAQPage` schema no longer earns a rich result** — Google retired FAQ rich
  results on 7 May 2026. The markup on the landing page is harmless and still
  well-formed for AI answer engines, but don't add it to new pages expecting a
  SERP feature.
- **Never add `aggregateRating`** using the App Store's ratings. Review markup
  about your own entity on your own site is self-serving and against Google's
  policy; it risks a manual action.
- **One sitemap**, generated by `@astrojs/sitemap` on every build. The pages in
  `public/` are invisible to it and are listed as `customPages` in
  `astro.config.mjs` — add to that list if you add a static page.

## Adding a blog post

A post is a single Markdown file in `src/content/blog/`. Scaffold one with:

```sh
npm run new-post -- "When to Start Tomato Seeds Indoors" "seed-starting,tomatoes"
```

A third argument sets `date:` explicitly (`... "seed-starting" 2027-02-11`),
which is how the weekly batch routine writes five posts on a Saturday and dates
each one for the weekday it will actually go live on.

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

Each post gets two images, both cropped out of one generated master:

| File | Size | Where it's used |
| --- | --- | --- |
| `<slug>-hero.jpg` | 1200×800 | Top of the post; `og:image` and `twitter:image` for link shares |
| `<slug>-pin.jpg` | 1000×1500 | Pinterest only — same artwork with the title overlaid in brand type |

Generate both with one command:

```sh
node scripts/gen-post-art.mjs \
  --slug how-to-plant-garlic-in-fall \
  --title "How to Plant Garlic in Fall" \
  --subject "a shallow trench in a timber raised bed with a row of fat garlic cloves set pointed-end-up, papery skins scattered, a worn trowel across the bed edge, fallen maple leaves" \
  --eyebrow "PLANT NOW" --highlight "GARLIC"
```

`--subject` describes only what is *in* the drawing. The house illustration
style lives in the `STYLE` constant in `scripts/gen-post-art.mjs` and is
appended automatically, so every hero on the blog looks like it came out of the
same sketchbook. Change that constant only if you intend to restyle the whole
blog.

**The artwork is a colored-pencil illustration, not a photograph**, and that is
a deliberate reversal of how this blog worked until September 2026.
[`STYLE.md`](STYLE.md)'s "Images" section has the full reasoning; the short
version is that gardeners spot fake garden photography and this is a trust
product, whereas a drawing never claims to be a photo. The old photographic
generator is still in the tree as `scripts/gen-post-image.mjs` for reference,
but nothing should call it.

Both scripts talk to the local image-api (the ComfyUI box on the LAN, source in
`~/Code/image-api`) via `scripts/lib/image-api.mjs`. No credits, no auth. Pass
`--wait` to block until the Windows machine comes up rather than failing — that
is what the unattended weekly routine does. Override the host with `IMAGE_API`.

The title is composited locally by `scripts/make-images.mjs` using the brand
fonts in `scripts/fonts/`, so the type is crisp and identical on every pin
rather than being hallucinated into the image. `--eyebrow` and `--highlight`
feed the pin's Tabloid Bold treatment; mirror whatever you pass into the
`pinEyebrow` / `pinHighlight` frontmatter fields.

**Look at both files before committing them.** An illustration gets botany
wrong in ways an exit code never reports — whole garlic bulbs lying on the soil
for a post about planting cloves, two trowels where the subject asked for one.
Regeneration is free; a wrong drawing on a gardening blog is a credibility
problem exactly like wrong text.

**If the hero crop cuts the point out of the artwork**, don't regenerate — the
hero is a wide slice of a tall image, and the default picks the busiest region,
which is wrong whenever the subject sits low in the frame. Add `--crop south`
(or `north` / `centre`) and record the same value as `heroCrop` in the post's
frontmatter so it survives a rebuild. The master is kept in
`$TMPDIR/gpp-masters/<slug>.png`, so a recrop costs nothing:

```sh
node scripts/make-images.mjs "$TMPDIR/gpp-masters/<slug>.png" <slug> "<pin title>" south
```

To re-composite every post after changing the pin design, the fonts, or the JPEG
quality — no regeneration at all:

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

## Infographic posts

A second post type, `type: "infographic"`, for the short reference-chart
format (a 6-mistake grid, a ranked "fastest to slowest" list) rather than a
written article. It lives in the same `blog` collection as regular posts —
same tags, same RSS feed, same `/blog` index — just rendered with a composed
chart image instead of a hero photo + prose. See `src/content.config.ts` for
the full field list (`infographicLayout`, `infographicItems`, etc.).

The chart image is generated in two steps:

1. **Icons, once, reused forever.** `scripts/gen-icon.mjs` generates one
   square colored-pencil illustration (Higgsfield, ~7 credits) into
   `public/assets/icons/<slug>.png`. Only make a new icon when nothing in
   the existing library fits — that's the whole point of the library.
2. **Composition, free, instant.** `scripts/gen-infographic.mjs` takes a JSON
   spec (layout, title, row data, icon slugs) and composites the entire
   1000×1500 image — background, header, numbered rows, icons, footer CTA —
   with `scripts/lib/infographic.mjs`. No Higgsfield call, no credits. Every
   word on the image is code-rendered text, never asked of the image model,
   so a stat or label can't come back garbled.

```sh
node scripts/gen-infographic.mjs \
  --slug 6-tomato-watering-mistakes \
  --spec ./spec.json
```

prints the frontmatter lines to paste into the post. The image serves as both
the on-page image and the Pinterest pin — infographic posts don't need a
separate `pinImage`.

Because a wrong number is baked into the image permanently instead of sitting
in editable prose, infographic posts should land as `draft: true` for a human
read-through before going live — see the daily marketing skill's rules for
this post type.

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

---

## Infographics

English/Spanish infographic pairs, published to `/infographics/` and
`/es/infographics/`.

**Cadence changed in September 2026.** This used to be a launchd job publishing
two a day at 7am, which put out fourteen a week and buried the articles. It is
now roughly two a *week*, produced inside the Saturday batch by the
`weekly-garden-content` scheduled task (`~/.claude/scheduled-tasks/`), and the
launchd agent has been unloaded. The script below is unchanged and is still the
right way to run one by hand.

```sh
node scripts/daily-infographics.mjs                  # 2 topics, commit and push
node scripts/daily-infographics.mjs --count 1        # just one
node scripts/daily-infographics.mjs --dry-run        # render + QA, write nothing
node scripts/daily-infographics.mjs --no-push        # commit locally only
```

One run picks the next unused topics from `scripts/data/topics.json`, generates
any icons they need that the shared library does not have, composites both
languages, runs the QA gate, writes the posts, rebuilds the site, and commits.
Netlify publishes from `main`.

### Running it

```sh
node scripts/daily-infographics.mjs --count 2
```

The launchd agent that used to fire this at 7am daily is retired — the plist is
kept at `~/Library/LaunchAgents/.app.thegardenplanner.infographics.plist.retired`
and `scripts/app.thegardenplanner.infographics.plist` is left in the tree, so
the schedule can be restored if the weekly batch ever proves too thin.

**It has to run on a machine at home.** The image API is on the LAN, so this
cannot be a cloud task. If the Windows PC hosting the API is off, the run waits
for it — polling every five minutes for up to twenty hours — rather than
failing.

### What the QA gate checks

Nothing is written unless everything passes; a missed day is invisible, a broken
pin is not.

- **Copy** (`scripts/lib/qa.mjs`): exactly 8 steps, at most 2 bullets each,
  bullet and description lengths, url-safe slugs, and the STYLE.md banned
  vocabulary.
- **Icons**: every slug the topic references resolves to a real file. Missing
  ones are generated first, and each generation is rejected and retried if it
  comes back blank or bleeding off the edge.
- **Layout**: `buildGuideInfographic` reports any text it had to clip to fit.
  The routine treats that as fatal rather than publishing a pin with an
  ellipsis in it.
- **Render**: 1000x1500, and a standard-deviation check that catches the flat
  near-uniform canvas you get when icons or the background fail to composite —
  the failure that does not throw and looks fine to a script.
- **Build**: the site is rebuilt before committing, which is the only thing that
  proves the frontmatter validates and every route still renders.

### Adding topics

Append to `scripts/data/topics.json`. Each entry needs both language blocks,
8 steps of at most 2 short bullets, and 8 icons — each either already in
`public/assets/icons/` or carrying a `subject` for the routine to draw it from
once and add to the library.

Every bullet is a horticultural claim that publishes unreviewed. STYLE.md's rule
that growing advice has to be correct applies here with no human in the loop, so
topics are hand-written rather than generated.
