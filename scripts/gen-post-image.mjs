#!/usr/bin/env node
/**
 * Generate the hero + Pinterest images for one blog post.
 *
 *   node scripts/gen-post-image.mjs \
 *     --slug how-to-plant-garlic-in-fall \
 *     --title "How to Plant Garlic in Fall" \
 *     --subject "garlic cloves pressed into dark soil in a raised bed, papery bulbs and a trowel beside them, autumn light" \
 *     [--eyebrow "GARLIC SEASON"] [--highlight "GARLIC"] [--crop south] [--seed 12345]
 *
 * --eyebrow is a short (2-4 word) badge label shown above the pin title.
 * --highlight is a word/phrase from the title to render in the accent color.
 * Both are optional and passed straight through to make-images.mjs.
 *
 * Writes public/assets/blog/<slug>-hero.jpg and <slug>-pin.jpg, then prints the
 * frontmatter lines to paste into the post.
 *
 * --subject should describe only WHAT is in the shot. The house photographic
 * style is appended automatically so every post on the blog matches.
 *
 * Images come from the local image-api (~/Code/image-api) running on the
 * Windows/RTX box, via its photorealistic /api/photo endpoint at the "max"
 * quality tier (native 2K Krea 2 Turbo). Override the host with IMAGE_API_URL.
 * If a 4x-UltraSharp upscale model is installed on that machine it is applied
 * automatically; if not, the native 2K master is already larger than both
 * output crops need.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const API = (process.env.IMAGE_API_URL ?? 'http://192.168.40.238:4000').replace(/\/$/, '');

/** 2:3 vertical master. Both the 1200x800 hero and the 1000x1500 pin crop out of this. */
const WIDTH = 1536;
const HEIGHT = 2304;

/**
 * The house style. Do not change this casually — it is what keeps every hero
 * on the blog looking like it came from the same photographer.
 *
 * Written as a photo caption, not an art prompt: stacking quality adjectives
 * ("8k", "masterpiece", "photorealistic") pushes this model toward glossy CGI.
 * The API appends its own camera/lens realism wording on top of this.
 */
const STYLE =
  'Documentary garden photography, natural diffused daylight, shallow depth of field, ' +
  'muted natural green and earth palette, 50mm lens look. Vertical composition, the main ' +
  'subject centered in the frame with clear space above and below it. ' +
  'Nobody in the shot: no people, no hands, no fingers, no arms, no faces. ' +
  'No text, no lettering, no numbers, no signage, no watermark, no logos.';

/** Applied on tiers that honour a negative prompt. */
const NEGATIVE =
  'person, people, hand, hands, fingers, arm, face, portrait, human figure, ' +
  'text, lettering, numbers, watermark, logo, signage, ' +
  'cgi, 3d render, illustration, painting, plastic, oversaturated';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const slug = arg('slug');
const title = arg('title');
const subject = arg('subject');

if (!slug || !title || !subject) {
  console.error(
    'usage: gen-post-image.mjs --slug <slug> --title "<title>" --subject "<what is in the shot>"'
  );
  process.exit(1);
}

async function api(path, init) {
  const res = await fetch(`${API}${path}`, init);
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- 1. check the box is up, and see whether UltraSharp is available ---------
let caps;
try {
  caps = await api('/api/capabilities');
} catch (err) {
  console.error(
    `image-api unreachable at ${API}: ${err.message}\n` +
      'Is ComfyUI + the image-api running on the Windows machine? ' +
      'Set IMAGE_API_URL if its LAN address changed.'
  );
  process.exit(1);
}

const upscaleModel = caps.features?.upscale
  ? (caps.models?.upscaleModels ?? []).find((m) => /ultrasharp/i.test(m))
  : undefined;

if (upscaleModel) {
  console.log(`[${slug}] upscale available: ${upscaleModel}`);
} else {
  console.log(`[${slug}] no UltraSharp upscale model installed — using the native 2K master`);
}

// --- 2. generate the master --------------------------------------------------
const body = {
  prompt: `${subject}. ${STYLE}`,
  negativePrompt: NEGATIVE,
  quality: 'max',
  width: WIDTH,
  height: HEIGHT,
  realism: true,
  async: true,
};
if (arg('seed')) body.seed = Number(arg('seed'));
if (upscaleModel) body.upscale = { model: upscaleModel };

console.log(`[${slug}] generating master image at ${WIDTH}x${HEIGHT} (quality: max)…`);
const { jobId } = await api('/api/photo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

let job;
const deadline = Date.now() + 15 * 60 * 1000;
for (;;) {
  await sleep(4000);
  job = await api(`/api/jobs/${jobId}`);
  if (job.status === 'done') break;
  if (job.status === 'error') {
    console.error(`generation failed: ${job.error}`);
    process.exit(1);
  }
  if (Date.now() > deadline) {
    console.error(`timed out waiting for job ${jobId} (last status: ${job.status})`);
    process.exit(1);
  }
  if (job.progress?.max) process.stdout.write(`\r  ${job.progress.value}/${job.progress.max} steps`);
}
process.stdout.write('\n');

const url = job.images?.[0]?.url;
if (!url) {
  console.error(`job finished with no image:\n${JSON.stringify(job, null, 2)}`);
  process.exit(1);
}

// --- 3. download and composite ----------------------------------------------
const masterDir = join(tmpdir(), 'gpp-masters');
mkdirSync(masterDir, { recursive: true });
const master = join(masterDir, `${slug}.png`);

console.log(`[${slug}] downloading… (seed ${job.seed})`);
const res = await fetch(url);
if (!res.ok) {
  console.error(`download failed: ${res.status}`);
  process.exit(1);
}
writeFileSync(master, Buffer.from(await res.arrayBuffer()));

console.log(`[${slug}] compositing hero + pin…`);
const makeImagesArgs = [join(HERE, 'make-images.mjs'), master, slug, title, arg('crop') ?? 'attention'];
const eyebrow = arg('eyebrow');
const highlight = arg('highlight');
if (eyebrow) makeImagesArgs.push('--eyebrow', eyebrow);
if (highlight) makeImagesArgs.push('--highlight', highlight);
execFileSync('node', makeImagesArgs, {
  stdio: 'inherit',
  cwd: ROOT,
});

console.log(`
Add to the post frontmatter:

image: "/assets/blog/${slug}-hero.jpg"
imageAlt: "<one line describing the photo>"
pinImage: "/assets/blog/${slug}-pin.jpg"
`);
