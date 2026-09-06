#!/usr/bin/env node
/**
 * Landing-page photography for the US and UK markets.
 *
 * Separate from scripts/gen-post-image.mjs, which makes the 2:3 blog/Pinterest
 * masters. These are wide (3:2) hero plates that sit behind the landing-page
 * copy, so they are generated landscape rather than cropped out of a tall
 * master — a portrait master cropped to 3:2 loses the depth that makes a garden
 * shot read as a garden.
 *
 * Style is deliberately the same house style as the blog so the site reads as
 * one publication. The market differences are in the SUBJECT only: a US raised
 * bed backyard vs a UK allotment. That distinction is the point of the two
 * landing pages — see src/lib/markets.ts.
 *
 * The model returns a ~3 MB PNG. Nothing ships at that weight, so each shot is
 * encoded to two JPEGs before the PNG master is dropped: a 1600px desktop plate
 * and an 800px one for phones, wired up as a `srcset` in Landing.astro. JPEG
 * rather than WebP because these are the LCP image on the page and a `<picture>`
 * with two sources buys a few KB at the cost of a fallback path to get wrong.
 *
 *   node scripts/gen-marketing-images.mjs [name…]     (default: all)
 */
import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import sharp from 'sharp';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../public/assets/marketing');
const API = (process.env.IMAGE_API_URL ?? 'http://192.168.40.238:4000').replace(/\/$/, '');

const W = 1600;
const H = 1067;

const STYLE =
  'Documentary garden photography, natural diffused daylight, shallow depth of field, ' +
  'muted natural green and earth palette, 35mm lens look. Horizontal composition with ' +
  'open sky or soft background on one side for text to sit over. ' +
  'Nobody in the shot: no people, no hands, no fingers, no arms, no faces. ' +
  'No text, no lettering, no numbers, no signage, no watermark, no logos.';

const NEGATIVE =
  'person, people, hand, hands, fingers, arm, face, portrait, human figure, ' +
  'text, lettering, numbers, watermark, logo, signage, ' +
  'cgi, 3d render, illustration, painting, plastic, oversaturated';

const SHOTS = {
  'hero-us':
    'A tidy American backyard vegetable garden in early summer, two cedar raised beds ' +
    'full of tomato plants staked with cages, lettuce and basil in the foreground, ' +
    'mulched paths between the beds, a soft out-of-focus house and lawn behind, morning light',
  'hero-uk':
    'A British allotment plot in early summer, runner beans climbing a row of hazel canes, ' +
    'rows of lettuce and onions in dark crumbly soil, a weathered timber raised bed, ' +
    'a galvanised watering can resting at the edge of the path, soft overcast English light',
  'harvest':
    'A shallow wooden trug on a garden bench holding a just-picked mixed harvest, ' +
    'ripe tomatoes, courgettes, a bunch of carrots with the tops still on and a handful of beans, ' +
    'soil still on the carrots, garden softly blurred behind, late afternoon light',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, init) {
  const res = await fetch(`${API}${path}`, init);
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

const names = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const wanted = names.length ? names : Object.keys(SHOTS);

mkdirSync(OUT, { recursive: true });

const caps = await api('/api/capabilities').catch((err) => {
  console.error(`image-api unreachable at ${API}: ${err.message}`);
  process.exit(1);
});
const upscaleModel = caps.features?.upscale
  ? (caps.models?.upscaleModels ?? []).find((m) => /ultrasharp/i.test(m))
  : undefined;

for (const name of wanted) {
  const subject = SHOTS[name];
  if (!subject) {
    console.error(`unknown shot "${name}" — have: ${Object.keys(SHOTS).join(', ')}`);
    process.exit(1);
  }

  const body = {
    prompt: `${subject}. ${STYLE}`,
    negativePrompt: NEGATIVE,
    quality: 'max',
    width: W,
    height: H,
    realism: true,
    async: true,
  };
  if (upscaleModel) body.upscale = { model: upscaleModel };

  console.log(`[${name}] generating ${W}x${H}…`);
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
    if (job.status === 'error') throw new Error(`[${name}] ${job.error}`);
    if (Date.now() > deadline) throw new Error(`[${name}] timed out`);
  }

  const url = job.images?.[0]?.url ?? job.result?.images?.[0]?.url ?? job.url;
  if (!url) throw new Error(`[${name}] job finished with no image url: ${JSON.stringify(job).slice(0, 400)}`);
  const abs = url.startsWith('http') ? url : `${API}${url}`;
  const buf = Buffer.from(await (await fetch(abs)).arrayBuffer());
  const master = join(OUT, `${name}.png`);
  writeFileSync(master, buf);

  for (const [suffix, width] of [['', W], ['-sm', 800]]) {
    const out = join(OUT, `${name}${suffix}.jpg`);
    const info = await sharp(buf)
      .resize({ width })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(out);
    console.log(`[${name}] wrote ${out} (${Math.round(info.size / 1024)} KB, ${info.width}px)`);
  }

  // The master is only an intermediate; keeping it would put 3 MB of PNG per
  // shot into the deploy for nothing.
  unlinkSync(master);
}
console.log('done');
