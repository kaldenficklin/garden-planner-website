#!/usr/bin/env node
/**
 * Generate a square profile picture for the social accounts, in the blog's
 * colored-pencil house style.
 *
 *   node scripts/gen-avatar.mjs --name rosette \
 *     --subject "a kale rosette seen from directly overhead, leaves spiralling out from the centre"
 *
 * Writes three files to social-exports/avatars/:
 *   <name>.png          1024x1024 master
 *   <name>-320.png      320x320, what Facebook and Pinterest actually store
 *   <name>-circle.png   320x320 cropped to a circle, plus a 40px strip
 *                       underneath showing it at feed size
 *
 * The circle file is the one to judge it on. Every platform that uses these
 * crops to a circle, and a composition that looks balanced as a square
 * routinely loses its subject's edges once it is masked.
 *
 * WHY THE STYLE IS NARROWER THAN THE BLOG'S
 * -----------------------------------------
 * Post artwork (gen-post-art.mjs) is a scene. An avatar is a mark, and it has
 * to survive being 40 pixels wide in a comment thread. That means one subject,
 * centred, big, with real tonal contrast against the paper and nothing in the
 * corners — the corners are cropped away and anything you put there is wasted
 * or, worse, clipped in a way that reads as a mistake.
 *
 * Round subjects earn their keep here. A rosette, a bulb, a seed head — things
 * that are already circular sit inside a circular mask without a fight.
 *
 * --people
 * --------
 * Off by default, and the default is the right one for anything on the blog:
 * this model draws hands and faces badly, and a mangled hand is worse than no
 * image. An avatar is the one place the trade can go the other way, because a
 * figure at 40px is a silhouette and the detail that fails is not resolvable
 * anyway.
 *
 * If you pass it, keep the figure MID-DISTANCE and TURNED AWAY, and put a hat
 * on them. Close-up hands and any face large enough to have features are where
 * this reliably goes wrong. The flag relaxes the constraint; it does not make
 * the model good at anatomy, so look at the output properly.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import sharp from 'sharp';
import { generate, waitForApi, isUp, apiBase } from './lib/image-api.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = join(ROOT, 'social-exports/avatars');

const SIZE = 1024;

/** Kept deliberately in sympathy with gen-post-art.mjs, but tighter. */
const STYLE =
  'Hand-drawn colored pencil illustration on warm off-white paper, in the style of a ' +
  'vintage botanical field guide plate. Visible pencil grain and cross-hatching, ' +
  'confident linework, muted natural palette of sage and olive green, terracotta and ochre. ' +
  'ONE single subject, centred, large, filling most of the frame, with clear even margin ' +
  'all around it and nothing at all in the corners. Strong tonal contrast against the pale ' +
  'paper so it reads clearly when very small. Square composition. ' +
  'No text, no lettering, no numbers, no watermark, no logos, no border, no frame.';

/** Appended unless --people. Keeps the default safe for anything on the blog. */
const NO_PEOPLE =
  ' Plain uncluttered background, no scene, no horizon, no other objects. ' +
  'Nobody in the drawing: no people, no hands, no fingers, no faces.';

/** Appended with --people, to steer toward the one composition that survives. */
const WITH_PEOPLE =
  ' A single figure seen from behind or in profile at a middle distance, small in the frame, ' +
  'wearing a broad-brimmed sun hat, face turned away and not visible, hands not close to the ' +
  'viewer. Simple uncluttered surroundings.';

const NEGATIVE_BASE =
  'photograph, photorealistic, 3d render, cgi, digital painting, anime, cartoon, ' +
  'vector art, flat illustration, clip art, logo, emblem, badge, ' +
  'multiple subjects, cluttered, ' +
  'text, lettering, numbers, watermark, border, frame, oversaturated, neon';

const NEGATIVE_NO_PEOPLE = ', busy background, scene, landscape, person, people, hand, hands, fingers, face';

/**
 * With --people we still fight the specific failures rather than people as
 * such: faces close enough to have features, and hands close enough to count.
 */
const NEGATIVE_WITH_PEOPLE =
  ', portrait, close-up face, facial features, looking at viewer, ' +
  'close-up hands, detailed fingers, deformed hands, extra fingers, extra limbs, crowd';

const arg = (n) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

const name = arg('name');
const subject = arg('subject');
if (!name || !subject) {
  console.error(
    'usage: gen-avatar.mjs --name <slug> --subject "<one centred subject>" [--seed N] [--people] [--wait]'
  );
  process.exit(1);
}

if (!(await isUp())) {
  if (process.argv.includes('--wait')) {
    if (!(await waitForApi())) process.exit(1);
  } else {
    console.error(`image-api unreachable at ${apiBase()}. Pass --wait to block until it is up.`);
    process.exit(1);
  }
}

const people = process.argv.includes('--people');
const style = STYLE + (people ? WITH_PEOPLE : NO_PEOPLE);
const negative = NEGATIVE_BASE + (people ? NEGATIVE_WITH_PEOPLE : NEGATIVE_NO_PEOPLE);

console.log(`[${name}] drawing…${people ? ' (people allowed — check the anatomy)' : ''}`);
const buf = await generate({
  prompt: `${subject}. ${style}`,
  negativePrompt: negative,
  quality: 'max',
  width: SIZE,
  height: SIZE,
  realism: false,
  seed: arg('seed') ? Number(arg('seed')) : undefined,
});

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, `${name}.png`), buf);
await sharp(buf).resize(320, 320).png().toFile(join(OUT, `${name}-320.png`));

// Circle mask + a 40px strip, so the thing can be judged the way it is seen.
const D = 320;
const mask = Buffer.from(
  `<svg width="${D}" height="${D}"><circle cx="${D / 2}" cy="${D / 2}" r="${D / 2}" fill="#fff"/></svg>`
);
const circle = await sharp(buf)
  .resize(D, D)
  .composite([{ input: mask, blend: 'dest-in' }])
  .png()
  .toBuffer();
const tiny = await sharp(circle).resize(40, 40).png().toBuffer();

await sharp({
  create: { width: D, height: D + 56, channels: 4, background: { r: 245, g: 244, b: 238, alpha: 1 } },
})
  .composite([
    { input: circle, top: 0, left: 0 },
    { input: tiny, top: D + 8, left: 8 },
    { input: tiny, top: D + 8, left: 56 },
  ])
  .png()
  .toFile(join(OUT, `${name}-circle.png`));

console.log(`[${name}] wrote ${name}.png, ${name}-320.png, ${name}-circle.png to social-exports/avatars/`);
