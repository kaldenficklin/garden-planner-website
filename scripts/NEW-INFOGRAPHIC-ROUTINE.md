# Prompt: build a daily infographic routine for another site

Paste the whole of this file to Claude Code, working in the repo of the site you
want the routine for. Replace the bracketed values in "Fill these in" first.

This describes the method used to build the routine in
`scripts/daily-infographics.mjs` in the Garden Pro Planner site. Point Claude at
that repo as a reference implementation if it is available; otherwise this file
is enough to rebuild it from scratch.

---

## Fill these in

- **Site domain:** `[example.com]`
- **Site framework:** `[Astro / Next / Hugo / plain HTML]`
- **Deploy:** `[Netlify / Vercel / GitHub Pages]` on push to `[main]`
- **Subject area:** `[what the infographics are about]`
- **Languages:** `[en only / en + es / …]`
- **How many per day:** `[2]`
- **Local image API:** `[http://<comfyui-host>:4000]` — a LAN ComfyUI HTTP API.
  `GET /api/capabilities` lists installed models; `POST /api/photo` takes
  `{prompt, quality, width, height, realism, returnBase64}`.

---

## What to build

A script that runs once a day, unattended, and publishes N infographics as
committed posts. Each run: pick unused topics, generate any missing artwork,
composite the images, run a quality gate, write the posts, rebuild the site,
commit and push.

Work through the steps below in order. Verify each one before moving on —
several of them look right and are not.

### 1. Read the repo first

Before designing anything, find out what already exists: content schema, image
pipeline, brand palette and fonts, existing style guides, deploy config, and
whether there is already an infographic or social-image system. Match what is
there rather than introducing a parallel one. If the repo has a brand, the new
work conforms to it — a second visual language is worse than a slightly awkward
fit with the first.

### 2. Composite text, never generate it

**The single most important rule.** Image models cannot render more than a few
words reliably. Ask one for an infographic and you get beautiful layout with
gibberish body text and duplicated numbers.

So split the job:

- The **model draws pictures only** — one subject per image, no text in the
  prompt, and explicitly `no text, no lettering, no numbers, no watermark`.
- **All type is composited in code** from real fonts, so it is always correct,
  always crisp, and translatable without regenerating art.

### 3. Pick the renderer to match the repo

Two approaches, both proven:

- **SVG + resvg** (`@resvg/resvg-js` + `sharp`). No browser dependency, exact
  text measurement via `getBBox`. Layout maths is manual. Best when the repo is
  already Node.
- **HTML/CSS + headless Chrome** (`--headless --screenshot
  --force-device-scale-factor=2`). Flexbox does the layout for you. Costs a
  Chrome dependency, and the screenshot can race image decoding — wait on the
  `load` event, not `img.decode()`, which stalls under `--virtual-time-budget`.

Either way the canvas is **1000x1500** (2:3, what Pinterest wants) rendered at
2x if using Chrome.

### 4. Make the layout report its own problems

Have the layout function return `{ svg, warnings }` rather than a bare string.
It knows when it had to shrink or ellipsize text to fit; nothing downstream
does. Treat a clipped bullet as fatal — a pin with an ellipsis in it is
permanent.

Size the card for a fixed copy budget (two bullets, roughly six words each) and
write that budget into the data file's comments. Longer copy is a content
problem, not a layout problem.

### 5. Build a reusable icon library

Generate each icon **once**, keyed by slug, and reuse it across topics. Store a
`subject` string per icon so a missing one can be regenerated.

Critical details, all learned the hard way:

- **A shared style string in every prompt.** Without it the set reads as a
  collage rather than one system. Do not vary it per icon.
- **Give every icon reference its own `subject`.** If topic B reuses an icon
  that only topic A defines, whichever runs first works and the other crashes.
- **Trim to content bounds before drawing.** Models centre the subject in 40–70%
  of the canvas, and the margin varies per generation, so untrimmed icons render
  at visibly different sizes card to card.
- **Composite onto the destination colour.** Measure the true background from a
  corner of the source, stretch it to pure white, then multiply onto the panel
  colour. White times the panel equals the panel, so the tile vanishes. Cache
  per background colour — the same icon on two panel colours is two images.
- **Inspect every generation**: reject a blank canvas (low standard deviation)
  and a subject bleeding off the edge (trim box ≈ full canvas), then retry.

### 6. Dedupe from the published content, not a state file

Give each topic a stable key and write it into the published post's frontmatter.
Derive "already used" by reading those files. A separate ledger drifts out of
sync the moment a post is deleted by hand.

Refuse to publish a duplicate. Warn when the pool drops below a few days of
runway. Publishing one instead of two is invisible; publishing the same thing
twice is not.

### 7. Write the QA gate before the routine

Nothing publishes unless every check passes. A missed day is invisible; a broken
post is not. Check, in order:

1. **Copy** — step count, bullets per step, word counts, url-safe slugs, and any
   banned vocabulary from the repo's style guide. Match on **word boundaries**
   and only against the language the list was written for.
2. **Assets** — every referenced icon resolves to a real file.
3. **Layout warnings** — from step 4. Fatal.
4. **Render** — exact dimensions, plus a standard-deviation check on the pixels.
   This is the one that matters: when icons or the background fail to composite
   you do not get an exception, you get a flat near-uniform canvas that looks
   fine to a script and blank to a person.
5. **Build** — rebuild the site before committing. It is the only thing that
   proves the frontmatter validates and the routes still render.

### 8. Wait for the image API instead of failing

The API is on the LAN and the machine hosting it is not always on. Poll every
five minutes for up to twenty hours rather than exiting. Turning the PC on in
the evening should still publish that day.

Because the API is LAN-only, **the routine cannot run in the cloud.** Schedule
it with launchd on macOS as a LaunchAgent, not a LaunchDaemon — it needs the
logged-in user's git credentials.

launchd starts jobs with almost no environment. Put the real logic in a shell
wrapper that finds node explicitly (nvm, then Homebrew, then /usr/local) and
logs to a file. A job that silently fails to find node every morning looks
exactly like a job that is running.

### 9. Structure the output so it does not swamp the site

At two a day, infographics outnumber ordinary posts within a month. Give them
their own section and keep them out of the main index, the tag pages and the
main feed.

For multiple languages: pair translations on a shared key rather than on slug,
so the translated URL can be genuinely translated. Emit bidirectional `hreflang`
including `x-default` — a one-sided set is ignored, which is the usual way an
i18n rollout quietly does nothing.

### 10. End the run with what a human still has to do

Print the URLs the run published and where each one goes. Do not assume the
distribution step is automated.

---

## Verify before you call it done

- Run a dry run that generates art and passes QA without writing anything.
- Render one topic whose icons do not exist yet, and **look at the output**. Do
  not infer from exit codes.
- Zoom into a composited icon at 3x and confirm it has no visible edge.
- Run the QA gate over the entire topic pool, not just the next one.
- Confirm the scheduled job works by triggering it manually.

## Things that will look right and are not

- A rendered image where every icon is a subtly different size.
- An icon with a faint rectangle behind it, visible only against a coloured panel.
- A layout that fits at English copy length and clips in the second language.
- A banned-word check matching substrings across languages.
- A screenshot taken before the images finished decoding.
- A scheduled job that cannot find node and fails silently every morning.
