#!/usr/bin/env node
/**
 * Generate the hero + Pinterest images for one blog post, as a colored-pencil
 * illustration rather than a photograph.
 *
 *   node scripts/gen-post-art.mjs \
 *     --slug how-to-plant-garlic-in-fall \
 *     --title "How to Plant Garlic in Fall" \
 *     --subject "a row of garlic cloves pressed pointed-end-up into dark soil in a timber raised bed, papery bulbs and a hand trowel lying beside the row, fallen leaves at the edge" \
 *     [--eyebrow "GARLIC SEASON"] [--highlight "GARLIC"] [--crop south] [--seed 12345]
 *
 * Writes public/assets/blog/<slug>-hero.jpg (1200x800, clean) and
 * <slug>-pin.jpg (1000x1500, title overlaid), then prints the frontmatter
 * lines to paste into the post. Drop-in replacement for gen-post-image.mjs —
 * same flags, same outputs, same overlay treatment.
 *
 * WHY ILLUSTRATION AND NOT A PHOTO
 * --------------------------------
 * Gardeners are the worst possible audience for synthetic garden photography.
 * They know what a tomato truss looks like in week nine, they count leaflets,
 * and a generated raised bed with impossible spacing reads as fake to them in
 * about a second. On a blog whose entire product is "trust me about your
 * garden," getting caught costs more than the images are worth.
 *
 * A drawing makes no claim to be a photograph, so it can't be caught out. It
 * also happens to be the better Pinterest asset: illustration reads at
 * thumbnail size where a shallow-depth-of-field macro turns to mush, and it
 * gives the blog a look nobody else in the category has.
 *
 * The rule this encodes: generated imagery is fine as long as it is visibly
 * drawn. If you need a real garden, photograph your own on a phone.
 *
 * ART DIRECTION IS AUDIENCE WORK
 * ------------------------------
 * The STYLE string below is pointed at the reader described in the "Who
 * Gardens Now" analysis — a woman roughly 38-60 growing food in an ordinary
 * suburban back garden or on a balcony, motivated by the grocery bill and
 * quietly worried about wasting a season. That is why the style asks for warm
 * paper, muted natural colour and everyday domestic objects, and why it
 * explicitly rules out the glossy estate-garden look: aspirational imagery
 * reads as "this is not for me" to the exact person who converts best.
 *
 * Do not edit STYLE casually. It is the only thing keeping every illustration
 * on the blog looking like it came from one sketchbook.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { generate, waitForApi, isUp, apiBase } from './lib/image-api.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

/** 2:3 vertical master. Both the 1200x800 hero and the 1000x1500 pin crop out of this. */
const WIDTH = 1024;
const HEIGHT = 1536;

/**
 * The house illustration style for post artwork.
 *
 * This is the editorial sibling of the icon style in gen-icon.mjs: same hand,
 * same pencils, but a full scene on warm paper rather than one object floating
 * on white. Keep the two in sympathy — an infographic and an article hero from
 * the same week should look related.
 */
export const STYLE =
  'Hand-drawn colored pencil illustration on warm off-white paper, in the style of a ' +
  'vintage botanical field guide plate or a seed catalogue engraving. Visible pencil ' +
  'grain and cross-hatching, confident slightly imperfect linework, soft muted natural ' +
  'palette of sage and olive greens, terracotta, ochre and soft brown, gentle warm light. ' +
  'An ordinary domestic garden: timber raised beds, terracotta and plastic pots, a plain ' +
  'kitchen garden. Modest and lived-in, not a manicured estate or a magazine garden. ' +
  'One clear subject reading strongly at small size, uncluttered composition, generous ' +
  'space above and below the subject. Vertical composition. ' +
  'Nobody in the drawing: no people, no hands, no fingers, no arms, no faces. ' +
  'No text, no lettering, no numbers, no signage, no watermark, no logos.';

/**
 * Steers away from the two directions this model drifts toward when asked for
 * an illustration: glossy digital/anime rendering, and photorealism creeping
 * back in. Both defeat the point of drawing it in the first place.
 */
const NEGATIVE =
  'photograph, photorealistic, dslr, 3d render, cgi, digital painting, airbrushed, ' +
  'anime, manga, cartoon, chibi, vector art, flat illustration, clip art, ' +
  'person, people, hand, hands, fingers, arm, face, human figure, ' +
  'text, lettering, numbers, watermark, logo, signage, border, frame, ' +
  'oversaturated, neon, glossy, plastic';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}
const has = (name) => process.argv.includes(`--${name}`);

const slug = arg('slug');
const title = arg('title');
const subject = arg('subject');

if (!slug || !title || !subject) {
  console.error(
    'usage: gen-post-art.mjs --slug <slug> --title "<title>" --subject "<what is in the drawing>"\n' +
      '       [--eyebrow "TEXT"] [--highlight "WORD"] [--crop attention|centre|north|south] [--seed N] [--wait]'
  );
  process.exit(1);
}

// --- 1. make sure the box is up ---------------------------------------------
// --wait is what the unattended weekly routine passes: the Windows machine is
// not always on, and blocking until it appears beats failing the whole batch.
if (!(await isUp())) {
  if (has('wait')) {
    if (!(await waitForApi())) process.exit(1);
  } else {
    console.error(
      `image-api unreachable at ${apiBase()}.\n` +
        'Is ComfyUI + the image-api running on the Windows machine? ' +
        'Pass --wait to block until it comes up, or set IMAGE_API if the LAN address changed.'
    );
    process.exit(1);
  }
}

/**
 * Reject a generation before it reaches the blog.
 *
 * Unlike an icon, editorial art is meant to fill the frame, so there is no
 * bleed check here — only the blank-canvas check, which catches the failure
 * mode that no exception reports: a near-uniform image that looks fine to a
 * script and empty to a person.
 */
async function inspect(buf) {
  const { channels } = await sharp(buf).stats();
  const spread = Math.max(...channels.map((c) => c.stdev));
  return { spread, ok: spread >= 10 };
}

// --- 2. generate the master, retrying a blank canvas -------------------------
console.log(`[${slug}] drawing master at ${WIDTH}x${HEIGHT}…`);

let buf;
for (let attempt = 1; ; attempt++) {
  buf = await generate({
    prompt: `${subject}. ${STYLE}`,
    negativePrompt: NEGATIVE,
    quality: 'max',
    width: WIDTH,
    height: HEIGHT,
    realism: false,
    seed: arg('seed') ? Number(arg('seed')) + attempt - 1 : undefined,
  });
  const check = await inspect(buf);
  if (check.ok) break;
  if (attempt >= 3) {
    console.error(`[${slug}] three near-blank generations in a row (stdev ${check.spread.toFixed(1)}) — giving up`);
    process.exit(1);
  }
  console.log(`[${slug}] attempt ${attempt} came back near-blank (stdev ${check.spread.toFixed(1)}), retrying…`);
}

// --- 3. composite hero + pin -------------------------------------------------
const masterDir = join(tmpdir(), 'gpp-masters');
mkdirSync(masterDir, { recursive: true });
const master = join(masterDir, `${slug}.png`);
writeFileSync(master, buf);

console.log(`[${slug}] compositing hero + pin…`);
const makeImagesArgs = [
  join(HERE, 'make-images.mjs'),
  master,
  slug,
  title,
  arg('crop') ?? 'attention',
];
const eyebrow = arg('eyebrow');
const highlight = arg('highlight');
if (eyebrow) makeImagesArgs.push('--eyebrow', eyebrow);
if (highlight) makeImagesArgs.push('--highlight', highlight);
execFileSync('node', makeImagesArgs, { stdio: 'inherit', cwd: ROOT });

console.log(`
Master kept at ${master} — recrop without regenerating:
  node scripts/make-images.mjs "${master}" ${slug} "<pin title>" south

Add to the post frontmatter:

image: "/assets/blog/${slug}-hero.jpg"
imageAlt: "<one line describing the drawing>"
pinImage: "/assets/blog/${slug}-pin.jpg"
`);
