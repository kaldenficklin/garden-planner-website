# Instagram & Pinterest strategy

Companion to `STYLE.md`. That file governs how posts are written; this one
governs how they get distributed.

Accounts:

| Platform  | Handle               | Type                    |
| --------- | -------------------- | ----------------------- |
| Instagram | `gardenplannerguru`  | Personal — by choice    |
| Pinterest | `GardenPlannerGuru`  | Business                |
| Site      | thegardenplanner.app | Claimed on Pinterest ✅ |

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

### The Instagram account stays personal

That is a deliberate choice, and it closes two doors — both gated behind the
same Professional-account requirement:

- **Pinterest's IG auto-publish is unavailable.** Pinterest only links Business
  accounts. No loss on traffic, per the above; the cost is that the Pinterest
  account no longer gets free activity from Instagram posts, so its pins have to
  be created deliberately.
- **Instagram's publishing API is unavailable**, so nothing can post to the feed
  on a schedule. Every Instagram post is made by hand, on the phone.

The remaining friction is therefore purely mechanical — getting correctly-shaped
images onto the phone. That is what `scripts/make-instagram.mjs` is for.

---

## Done already

- `p:domain_verify` meta tag deployed and `thegardenplanner.app` claimed on
  Pinterest. This turns on Article Rich Pins — every pin linking to the blog now
  shows the headline, author, publish date and site name pulled from the
  `article:*` tags in `BaseLayout.astro`, and carries the account's attribution.
- Instagram bio written (147/150), link in bio, profile photo and display name
  all set.

---

## Getting a post onto Instagram

```
node scripts/make-instagram.mjs            # all posts
node scripts/make-instagram.mjs <slug>...  # just these
```

Writes to `social-exports/` (gitignored — these are not served by the site):

| File               | Size      | For                                       |
| ------------------ | --------- | ----------------------------------------- |
| `<slug>-feed.jpg`  | 1080×1350 | 4:5 feed post — the tallest shape the feed allows |
| `<slug>-story.jpg` | 1080×1920 | 9:16 story, bottom third left clear for the link sticker |
| `captions.txt`     | —         | hook, body, hashtags and URL per post     |

Then: open `social-exports/` in Finder, AirDrop the two images to the phone,
and post from the Instagram app. Paste the caption from `captions.txt`, put the
hashtag line in the **first comment** rather than the caption, and add a link
sticker to the story pointing at that post's URL.

Both shapes are re-cropped from the original master photo, not resized from the
published hero or pin — no upscaling and no second round of JPEG compression.
Masters live in `$TMPDIR/gpp-masters/` and are temporary; if the OS has cleared
them, regenerate with `gen-post-image.mjs` before exporting.

**The story is the part that matters.** Link stickers are available on personal
accounts regardless of follower count, and they are the only reliable way to
send someone from Instagram to a blog post. A feed post builds the audience; the
story is what converts it.

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
