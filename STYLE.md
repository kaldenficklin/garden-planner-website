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
(figurative), additionally, bolster, garner, interplay, intricate, enhance,
enduring, profound, groundbreaking, renowned, nestled, "diverse array," "in the
heart of," "plays a vital role," "a testament to," "when it comes to," "it's
worth noting that," "in today's world."

Use sparingly and only with real meaning: "actually" (appeared 17 times across
the original posts, almost always as filler credibility), "simply," "just,"
"of course," "essentially."

### The AI tells specifically

Wikipedia maintains a good catalogue of these at
[Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing),
and it is worth reading once. Most of what it lists is already banned above —
the vocabulary, negative parallelism, trailing participles, "serves as" for
"is," excessive bold and em dashes. These are the ones it names that the rest of
this guide does not:

- **No significance inflation.** "Marking a pivotal moment," "a key turning
  point," "the evolving landscape of," "has become increasingly important."
  Almost nothing in a garden is a turning point. If a thing matters, say what it
  does, and the reader will work out that it matters.
- **No formula conclusion.** "Despite its benefits, X faces several
  challenges." "Challenges and future prospects." A closing paragraph that
  balances a positive against a vague negative and speculates about the future
  is the single most recognisable shape in generated prose.
- **No vague association.** "Associated with," "connected to," "in connection
  with," "widely regarded as." Say who, or say what causes what, or cut it.
- **Sentence-case headings, always.** Title Case On Every Heading is a tell in
  its own right, independent of the words in them.
- **No decorative structure.** No horizontal rules between sections, no emoji as
  bullets or headers, no bold-lead inline lists dressed up as prose.

The underlying test is the one at the bottom of this file and it beats every
checklist: read it out loud. Generated text is fluent and never unsure, never
specific about a Tuesday, and never admits it got something wrong. The voice in
Part 1 is the actual defence. The bans just stop the obvious cases.

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

Every post carries two images, both cropped out of a single generated master.
See the README for the commands; this section is about the look.

**The artwork is a colored-pencil illustration, not a photograph.** Warm
off-white paper, visible pencil grain and cross-hatching, muted sage and olive
greens with terracotta and ochre, one clear subject. It should read like a
plate out of a vintage botanical field guide or a seed catalogue, drawn by
someone who was looking at the actual plant.

This changed in September 2026, and the reason matters more than the taste.
Gardeners are the worst possible audience for synthetic garden photography.
They know what a tomato truss looks like in week nine, they count leaflets, and
a generated raised bed with impossible spacing reads as fake to them almost
immediately. On a blog whose entire product is *trust me about your garden*,
being caught publishing fake photos costs more than good-looking heroes are
worth. A drawing makes no claim to be a photograph, so there is nothing to
catch. It also survives a Pinterest thumbnail better than a shallow-depth
macro, and it gives the blog a look nobody else in the category has.

**If you want a real photograph, take one.** An honest mediocre phone photo of
your own garden beats a beautiful fake every time. Never generate photorealism
and publish it as though it were real.

**The garden in the drawing is an ordinary one.** Timber raised beds, terracotta
and plastic pots, a plain kitchen garden, a balcony that holds four containers.
Not a manicured estate, not a magazine garden. The reader is growing food in a
suburban back garden and worrying about the grocery bill; aspirational imagery
reads as *this is not for me* to exactly the person most likely to convert.

**It has to be botanically right.** The drawing is a factual claim, exactly like
the text. If the article is about squash bug eggs, it shows squash bug eggs in
the V of a leaf vein, not a generic beetle. Illustration makes this easier to
get wrong, not harder — the model will happily draw whole garlic bulbs sitting
on the soil for a post about planting single cloves, and it will sometimes draw
two of a tool it only needed one of. **Look at both files before you commit
them.** Reruns are free.

**No people, no hands.** Not because anatomy fails the way it does in photos,
but because the frame is stronger without them: the plant, the soil, the tool
lying in the bed. Keep hands and figures out of the subject line.

**No text in the generated artwork.** All type is composited afterward from the
brand fonts, so it stays crisp and identical across every pin. Never ask the
image model for a title, label, or caption.

**The pin title can differ from the SEO title.** Long titles work in search
results and fail on an image. When the post title runs past roughly 55
characters, write a shorter one for the pin and record it as `pinTitle`.

## Post shapes

Structure still has to vary from post to post — that rule is unchanged and it
is the one that keeps the archive from sounding like a template. What changed
in September 2026 is that the blog now draws its shapes from what actually
performs in this category, which is the Epic Gardening pattern: numbered,
scannable, calendar-driven, and answering a question the reader already has.

Rotate through these. Never run the same shape twice in one week.

- **The dated list.** "9 Things to Plant in October Before the Ground Closes."
  A numbered run of items, each with a heading, two or three paragraphs, and a
  reason it belongs on *this* month's list. The workhorse, and the best pin.
- **The myth check.** "Should You Bury Tomato Plants Sideways?" State the
  common advice, say plainly whether it holds, then spend the post on the
  conditions under which it does and doesn't. Answer in the first two
  paragraphs — never withhold it for suspense.
- **The diagnosis.** "Your Squash Leaves Turned White Overnight." Symptom
  first, the two or three things it could be, how to tell them apart, what to
  do today. These land the same afternoon someone walks outside and finds the
  damage, which is why they convert.
- **The ranked comparison.** "The Fastest Crops You Can Grow." A short table or
  ordered list with a real number attached to each row — days to maturity,
  spacing, yield per square foot.
- **The single argument.** One idea, followed all the way down, no list at all.
  Run one of these a week or the blog turns into listicles.

**How the numbered shapes coexist with "prefer prose."** The Formatting rule
above bans stacked bold-lead bullets, and it still does. A dated list is not
that: each item is an `##` or `###` heading with real paragraphs under it, the
way a person would talk through nine things one at a time. What stays banned is
the fake list — a paragraph chopped into `- **Bold term.** One sentence.` rows
to look scannable. If an item can't carry two paragraphs, it isn't an item.

**Numbers in a title have to be exact.** A post titled "9 Things" contains nine
things. Do not round, do not pad the list to hit a rounder number, and do not
promise a count the body doesn't deliver.

## Pre-publish check

Run these against the new post before committing. Any hit needs a fix or a
deliberate justification.

```sh
f=src/content/blog/YOUR-POST.md
grep -nEi "bottom line|in summary|takeaway|final thoughts|at the end of the day|delve|tapestry|testament|underscore|boasts|vibrant|robust|crucial|pivotal|meticulous|seamless|leverage|foster|showcase|elevate|unlock|myriad|plethora|game.chang|experts say|studies show|research suggests|when it comes to|worth noting" "$f"
grep -nEi "additionally|bolster|garner|interplay|intricate|enhance|enduring|profound|groundbreaking|renowned|nestled|diverse array|in the heart of|serves as|stands as|functions as|turning point|evolving landscape|increasingly important|faces several|future prospects|associated with|in connection with|widely regarded" "$f"
echo "em dashes: $(grep -o '—' "$f" | wc -l)  (max 2)"
echo "bold bullets: $(grep -c '^- \*\*' "$f")  (max ~6, one list)"
echo "'actually': $(grep -oi 'actually' "$f" | wc -l)  (aim 0-1)"
grep -nE "Here's (how|what|why|the)" "$f"
grep -n "’" "$f"
```

Then read the post out loud. If a sentence is one you would not say to a person
standing in their garden, rewrite it.
