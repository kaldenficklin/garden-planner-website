# Blog voice & style guide

Every post on this blog must read like a person wrote it. Search traffic arrives
from Google on problem queries ("why is my zucchini not fruiting"), and the site
has been featured on CBS/NBC/FOX — writing that pattern-matches to generated
filler costs both trust and rankings.

This guide has two parts: **the voice** (how posts should sound) and **the
tells** (patterns that must not appear). The tells are non-negotiable. The voice
can be adjusted, but only in one place — the "Active voice" line below.

---

## Part 1 — Voice

**Active voice: The Neighbor Over the Fence**

Three voices were drafted for this blog. The active one is in force for every
new post and every rewrite. The other two are kept here so the voice can be
switched deliberately rather than drifting.

### The Neighbor Over the Fence (ACTIVE)

Someone who has grown this for years and is leaning on the fence telling you
about it. Warm, first person, unhurried. Assumes you are standing in your garden
mildly frustrated, and is kind about that. Admits what they get wrong. Notices
things. Occasionally wanders off topic for a sentence, then comes back.

> I have never once spotted a hornworm before I spotted its droppings. Not once,
> and I look for them every summer. They are four inches long, they sit in full
> sun at eye level, and I walk straight past them.
>
> So I stopped looking for the caterpillar. Now I look at the soil under the
> plant, and at the leaves below the damage, for what it left behind.

How to actually write it:

- **Talk, don't present.** Use contractions. Start a sentence with "And" or
  "But" when that is how it would come out. A short fragment is fine. So is a
  parenthetical aside (they read as someone thinking out loud).
- **Be generous about the reader's frustration.** The person reading this
  searched "why is my zucchini not fruiting" at 7am and is annoyed. Meet them
  there. Never make them feel slow for not already knowing.
- **Admit uncertainty and failure.** "I have had mixed luck with this." "Nobody
  really knows why." "I still get this wrong most years." This is the single
  biggest thing separating the voice from generated text, which is never unsure
  about anything.
- **Prefer the concrete and sensory.** What it looks like at 6am. What it feels
  like under a thumbnail. What the wrong version smells like. Abstraction is
  what the old posts were made of.
- **Ration the "I".** Two or three first-person moments in a post is plenty. The
  post is about the reader's garden. First person is seasoning, not the meal.
- **Let the season show.** A late-August post should sound like late August:
  the heat, the glut, tired plants, the first cool night. Someone who was
  actually outside that week writes differently from someone summarizing a
  topic, and this is most of the difference. Never write about a season the
  reader isn't in.

**Anecdotes are invented on purpose, and that is fine.** This is a personal blog
voice, and illustrative personal history is how the voice works. Write the bad
seasons, the specific varieties, the year you got it badly wrong, the thing you
believed for a decade that turned out to be nonsense. Specifics are what make it
read as a person:

> "I lost an entire flat of seedlings to a frost that came nine days after the
> date said it wouldn't. I have never once trusted that number since."

Two things stay off limits no matter what.

**1. Never fabricate horticultural fact.** No invented statistics, studies,
percentages, research findings, or numbers a reader would act on. "I lost a flat
of seedlings to a frost one May" is color. "Studies show 40% of gardeners plant
too early" is a fabrication that changes what people do in their gardens. Every
piece of growing advice on this blog has to be correct.

**2. Never fabricate results from the app.** No invented yield totals, savings
figures, or testimonials attributed to using Garden Pro Planner. Personal color
is one thing; a manufactured product claim is a different category entirely.

One craft note that is not about ethics: keep anecdotes plausible and hard to
pin down. Avoid committing to a specific USDA zone, city, or calendar year that
a future post might contradict. "A few years back" and "one May" age better
across a growing archive than "in 2023, here in 6b." The archive has to stay
consistent with itself.

### The Blunt Practitioner (inactive)

Leads with the answer, takes positions, refuses to pad. Second person, short
sentences, dry. "Row covers are worth it, trap boards mostly are not."

> Stop looking for the caterpillar. You won't find it. A four-inch hornworm on a
> tomato stem is invisible until you've trained your eye, and by the time you
> spot one the plant is half bare.

Available if the blog ever wants a harder, more opinionated edge. Carries no
fabrication risk, since its authority comes from precision rather than history.

### The Field Guide (inactive)

Plainspoken and precise, closer to a good county extension bulletin. No
personality, no opinions, high information density.

> Tomato hornworms strip foliage quickly. A plant that looked healthy on Sunday
> can be bare-stemmed by Wednesday. Most gardeners find the damage before they
> find the caterpillar.

Accurate and safe, but it reads flat, and flat is close to what generated text
already sounds like. Available if the blog ever wants a reference-toned section.

---

## Part 2 — The tells (do not do these)

Derived from [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).

### Titles (exempt from the Inflation rule below)

Titles are the one place on this blog that should go loud. The body text
underneath still follows every rule in this guide, but the `title` and
`pinTitle` fields are written to get the click: curiosity gaps, stakes,
second-person urgency, "the mistake that's killing your tomatoes" energy.
Bring back what Part 2's "Inflation" section bans everywhere else — "the one
mistake," "why your X is dying," "stop doing this," "this is why X keeps
happening to you."

**One rule does not bend: the title cannot claim something the article
doesn't actually deliver.** A title can be loud about a true thing ("This
Common Watering Mistake Is Splitting Your Tomatoes") but can't invent a
severity, a number, or an outcome the post doesn't back up. This isn't a tone
rule, it's what keeps the click from bouncing and what keeps Google from
penalizing the post for a mismatch between title and content — a clickbait
title that doesn't pay off in the first two paragraphs is worse for traffic
than a plain one.

Compare: "Why Tomatoes Split After It Rains" (old, plain) vs. "This Common
Watering Mistake Is Splitting Your Tomatoes (And It's Not the Rain)" (loud,
still 100% accurate to the post). Aim for the second.

**The pin type treatment is "Tabloid Bold"** (picked 2026-07-28): Inter Black
all-caps on a warm red-black scrim. Two optional frontmatter fields feed it —
set them when they help, skip them when they don't:
- `pinEyebrow`: a short (2-4 word) yellow badge label above the title, e.g.
  `"WATERING MISTAKE"`. Usually the post's core problem, upper-cased.
- `pinHighlight`: one word or short phrase from the title to render in yellow
  instead of white, e.g. `"SPLITTING"`. Must match the title text verbatim
  (case-insensitive) — if it doesn't, or if it straddles a line break, it's
  silently ignored, so don't rely on it landing every time.

See `scripts/lib/overlay.mjs` for the implementation.

### Endings

- **Never** end a post with "The bottom line," "In summary," "The takeaway,"
  "Final thoughts," "At the end of the day," or "To sum up." All 12 original
  posts on this blog ended with "The bottom line." That single habit is the
  loudest tell on the site.
- End on something with content: the one thing to do tomorrow morning, the
  mistake that undoes the rest, the case where the advice does not apply. Vary
  it post to post. A post may simply stop when it is done.

### Punctuation and rhythm

- **Em dashes: two per post, maximum.** Use commas, periods, colons, or
  parentheses. The original posts averaged one every 82 words.
- Vary sentence length deliberately. Include short sentences. Four words is
  fine. If every sentence runs 15–25 words, rewrite.
- Straight apostrophes and quotes only, never curly.

### Sentence patterns

- **No negative parallelism.** Banned: "It's not X, it's Y," "not just X but
  also Y," "isn't A, it's B," "no X, no Y, just Z." One per post at absolute
  most, and only when the contrast is genuinely the point.
- **No rule-of-three padding.** Do not default to triads of adjectives or
  phrases ("wilt, yellow, and die"). Use two items, or four, or one.
- **No trailing participles that add nothing.** Cut "...making it easy to
  spot," "...ensuring healthy growth," "...helping to prevent disease,"
  "...allowing you to." Make it a real sentence or delete it.
- **Keep the plain verbs.** "is" and "has," not "serves as," "stands as,"
  "represents," "boasts," "features," "offers."

### Vocabulary

Do not use: delve, tapestry, testament, underscore, boasts, vibrant, robust,
crucial, pivotal, meticulous, seamless, leverage, foster, showcase, elevate,
unlock, myriad, plethora, embark, realm, navigate (figurative), landscape
(figurative), "plays a vital role," "a testament to," "when it comes to," "it's
worth noting that," "in today's world."

Use sparingly and only with real meaning: "actually" (appeared 17 times across
the original posts, almost always as filler credibility), "simply," "just,"
"of course," "essentially."

### Openings

- Do not end the intro with "Here's how," "Here's what," "Here's why," or
  "Here's the simple rule." This appeared 14 times across 12 posts.
- No "Let's dive in," "In this post we'll cover," "Read on to learn."
- Open on the reader's actual situation or the answer itself.

### Inflation

- No "changes everything," "the single most important thing," "you'll never look
  at X the same way," "game-changer," "the secret to," "revolutionize."
- Do not tell the reader that a topic matters. Show why by being useful.

### Attribution

- **No vague authorities.** Banned: "experts say," "studies show," "research
  suggests," "gardeners agree," "extension services note," "it is widely
  believed." Either name the specific source, or state the practice plainly on
  its own merits.
- **Never fabricate** statistics, studies, percentages, dates, or citations.
  Uncertain claims get stated as uncertain, or cut. Correct horticulture is more
  important than a confident sentence.

### Formatting

- **One bold-lead bullet list per post, maximum** (`- **Term.** Explanation`).
  The original posts used 77 of these. Prefer prose. If a list is genuinely the
  right form, plain bullets usually beat bolded ones.
- Do not bold inside body paragraphs for emphasis. Bold is for the rare term
  that a scanning reader must not miss.
- Headings in sentence case, phrased like something a person would say.
  Avoid "Benefits of X," "Common Mistakes," "Understanding X," "Key Takeaways."
- Tables are good when the data is genuinely tabular (crop, spacing, days to
  maturity). Do not build a table out of prose.

### Structure

- **Structure must vary from post to post.** Not every article gets: hook →
  definition → numbered method list → prevention → bottom line. Some posts are
  one long argument. Some are a table with commentary. Some answer the question
  in 200 words and spend the rest on the edge cases.
- Do not number a list of methods unless the order matters.

### The app CTA

- One mention per post. Two only if the second is a single clause.
- Vary placement — it does not have to be the final paragraph, and it should not
  always open with "Garden Pro Planner's...".
- Tie it to a real feature (frost-date calendar, 225+ plant library, pest
  guides, watering reminders, yield tracking, calendar sync, pet-safe filtering).
  Never invent features.
- It should read as a useful aside, not a sales close.

---

## Images

Every post carries two images, both derived from a single generated photo. See
the README for the commands; this section is about the look.

**The photo is documentary, not stock.** Natural diffused daylight, shallow
depth of field, muted greens and earth tones, one clear subject. It should look
like someone crouched down in an actual garden with a 50mm lens, not like a
brochure. No hands holding produce toward the camera, no smiling models, no
suspiciously glossy vegetables.

**It has to be botanically right.** The photo is a factual claim, exactly like
the text. If the article is about squash bug eggs, the image shows squash bug
eggs in the V of a leaf vein, not a generic beetle. Look at what came back
before you commit it, and regenerate with a more specific subject if it's
wrong. A gardening blog that shows the wrong pest loses the reader in one
glance.

**No text in the generated photo.** All type is composited afterward from the
brand fonts, so it stays crisp and identical across every pin. Never ask the
image model for a title, label, or caption.

**The pin title can differ from the SEO title.** Long titles work in search
results and fail on an image. When the post title runs past roughly 55
characters, write a shorter one for the pin and record it as `pinTitle`.

## Pre-publish check

Run these against the new post before committing. Any hit needs a fix or a
deliberate justification.

```sh
f=src/content/blog/YOUR-POST.md
grep -nEi "bottom line|in summary|takeaway|final thoughts|at the end of the day|delve|tapestry|testament|underscore|boasts|vibrant|robust|crucial|pivotal|meticulous|seamless|leverage|foster|showcase|elevate|unlock|myriad|plethora|game.chang|experts say|studies show|research suggests|when it comes to|worth noting" "$f"
echo "em dashes: $(grep -o '—' "$f" | wc -l)  (max 2)"
echo "bold bullets: $(grep -c '^- \*\*' "$f")  (max ~6, one list)"
echo "'actually': $(grep -oi 'actually' "$f" | wc -l)  (aim 0-1)"
grep -nE "Here's (how|what|why|the)" "$f"
grep -n "’" "$f"
```

Then read the post out loud. If a sentence is one you would not say to a person
standing in their garden, rewrite it.
