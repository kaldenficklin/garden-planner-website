# Instagram & Pinterest strategy

Companion to `STYLE.md`. That file governs how posts are written; this one
governs how they get distributed.

Accounts:

| Platform  | Handle              | Type                       |
| --------- | ------------------- | -------------------------- |
| Instagram | `gardenplannerguru` | Personal — needs switching  |
| Pinterest | `GardenPlannerGuru` | Business                    |
| Site      | thegardenplanner.app | Claimed on Pinterest ✅    |

---

## The thing that decides the whole strategy

Pinterest's "auto-publish your Instagram posts as Pins" feature does **not**
send traffic to this site. The Pins it creates link back to the Instagram post,
not to the blog URL. Pinterest's own documentation is explicit about it:
posts-turned-Pins carry the image, the caption, and *a link back to the
Instagram post*.

So treat the two platforms as doing two different jobs, and don't expect the
integration to do the first one:

- **Pinterest is the traffic engine.** It is a search engine that permits
  outbound links, and the pins that matter are the ones created *directly* on
  Pinterest with a blog URL attached. Every one of the 12 posts already ships a
  1000×1500 pin image built for this.
- **Instagram is the audience and install engine.** It is deliberately hostile
  to outbound links. Its realistic contribution is brand recall, saves, and App
  Store installs through the bio link — not clicks to blog posts.

The IG→Pinterest auto-publish is still worth turning on, because it keeps the
Pinterest account active for free and Instagram-sourced pins do get impressions.
Just don't count it as a traffic channel.

---

## Done already

- `p:domain_verify` meta tag deployed and `thegardenplanner.app` claimed on
  Pinterest. This turns on Article Rich Pins — every pin linking to the blog now
  shows the headline, author, publish date and site name pulled from the
  `article:*` tags in `BaseLayout.astro`, and carries the account's attribution.
- Instagram bio written (147/150).

## Remaining setup — phone only

Instagram's web app cannot do any of these. All four are on the phone.

1. **Switch to a Professional (Business) account.**
   Settings → Account type and tools → Switch to professional account →
   category *Gardening* or *Publisher*. Pinterest's auto-publish requires a
   Business account and Pinterest only lets the primary account holder link one.
2. **Set the link in bio** to `https://thegardenplanner.app/blog` — the blog,
   not the homepage. Someone arriving from a gardening post wants the guide;
   the blog's own layout sells the app on every page anyway.
3. **Add a profile photo.** Use `public/assets/app-icon.png`.
4. **Change the display name** from "Kalden Ficklin" to
   `Garden Pro Planner · Vegetable Gardening`. The name field is a *searchable*
   index on Instagram; the handle alone is not enough.

Then, back on Pinterest: Settings → Link to Pinterest → Instagram → Link, and
opt into importing the last 90 days.

---

## Instagram content system

Nothing needs to be written from scratch. All 12 posts already carry a hook, a
hero image and a pin image; the work is reformatting.

**Sizes.** Neither existing image fits Instagram. Feed posts want 1080×1350
(4:5), Reels and Stories want 1080×1920 (9:16). The hero images are 1200×800
landscape and the pin images 1000×1500 — both need re-cropping or re-rendering.

**The three formats worth making, in priority order:**

1. **Carousel (drives saves).** Slide 1 is the post's hook as a full-bleed
   statement. Slides 2–6 are the post's own subheads, one per slide. Final slide
   is the CTA. Saves are the strongest ranking signal Instagram has for
   evergreen niche content, and gardening advice gets saved heavily.
2. **Reel (drives reach).** 7–15 seconds, one problem and one fix. The pest and
   troubleshooting posts are the natural ones — hornworms, squash bugs, aphids,
   zucchini not fruiting. These are visual problems with visual answers.
3. **Story (drives the only real clicks).** Story link stickers are available to
   all accounts now regardless of follower count, and they are the single best
   click driver on the platform. Every time a post goes live, run a story with
   the hook and a link sticker.

**Caption shape.** First line is the hook, because that is all that shows before
"more." Then the answer in 2–4 short lines in the `STYLE.md` voice — the neighbor
over the fence, not a listicle. Then the CTA. Hashtags go in the first comment,
5–10 of them, mixing broad (`#vegetablegarden`) with specific
(`#tomatohornworm`); the specific ones are where a new account can actually rank.

**Posting rhythm.** 3–4 feed posts a week and stories on the days between beats
daily posting from a standing start. Consistency matters more than volume while
the account has no signal history.

### First four weeks, mapped to existing posts

Ordered by seasonal relevance from late July, then by how visual the problem is.

| Week | Carousel                      | Reel                        | Story angle              |
| ---- | ----------------------------- | --------------------------- | ------------------------ |
| 1    | Why zucchini won't fruit      | Hornworm frass trick        | Hand-pollination in 15s  |
| 2    | Squash bugs — the egg stage   | Aphids: start with the hose | "Check under your leaves"|
| 3    | Succession planting for fall  | Watering: the finger test   | What to sow in August    |
| 4    | Container gardening pot sizes | Vegetables that are fruits  | Black walnut warning     |

The "secretly fruits" post is the outlier and worth using deliberately — it is
the only one that is a *fact* rather than a *fix*, which makes it the most
shareable and the worst converter. Use it for reach, not for clicks.

---

## Pinterest system

This is where the traffic actually comes from, and it is underbuilt right now —
the account has a bio and a claimed domain but no boards and no pins.

1. **Create 6–8 boards** matching how gardeners search, not how the blog is
   organized: Vegetable Garden Layouts · Raised Bed Gardening · Companion
   Planting · Garden Pests & Organic Control · Seed Starting & Frost Dates ·
   Container & Small Space Gardening · Succession Planting. Give each a keyword
   description; board descriptions are indexed.
2. **Pin all 12 posts manually**, each with its blog URL, into the most relevant
   board. Use the `pinKeywords` already in each post's frontmatter — they were
   written for exactly this — as the pin description, phrased as a sentence
   rather than a tag dump.
3. **Space them out.** 1–3 fresh pins a day, not 12 in one afternoon. New
   accounts get throttled for bulk posting.
4. **Make multiple pin images per post over time.** Pinterest treats a new image
   pointing at the same URL as fresh content, and re-pinning the same image is
   what gets suppressed. This is the highest-leverage repeat action on the
   platform.
5. **`/blog/rss.xml` already exists** and carries all 12 posts with titles,
   descriptions and categories. If pin creation becomes a chore, that feed is
   what Buffer/Publer/Tailwind consume for scheduling.

---

## What to measure

Ignore follower count on both platforms — it is the metric least connected to
anything that matters here.

- **Pinterest:** outbound clicks (Pinterest Analytics → Outbound clicks), and
  saves per pin. Outbound clicks are the number that maps to site traffic.
- **Instagram:** saves and shares per post, and link taps on stories. Saves
  predict reach; link taps predict traffic.
- **Site:** referral traffic split by source, and App Store click-through from
  `data-cta` attributes already wired into the pages.

Give it 60–90 days before judging Pinterest. Pins have a long tail — a pin
posted in July can start driving traffic the following spring, because the
searches are seasonal and the content is evergreen.
