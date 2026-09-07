#!/usr/bin/env node
/**
 * Generate a Facebook Page cover photo in the blog's colored-pencil style.
 *
 *   node scripts/gen-cover.mjs --wait --name beds \
 *     --subject "three timber raised beds in a small back garden in late summer"
 *
 * Writes to social-exports/covers/:
 *   <name>.png         1640x856, the file to upload
 *   <name>-safe.png    the same image with the two crops Facebook applies
 *                      drawn on top of it — judge it on this one
 *
 * THE TWO TRAPS
 * -------------
 * A Facebook cover is never shown as the file you uploaded.
 *
 * 1. On desktop the profile picture sits ON the cover, overlapping the lower
 *    left. Anything you put in roughly the left 320px of the bottom half is
 *    behind it.
 * 2. On mobile the cover is cropped in from both sides to about the middle
 *    1090px. Everything outside that is invisible to most of the audience,
 *    since most of the audience is on a phone.
 *
 * So the usable area is a band in the middle, offset right. The safe preview
 * draws both boundaries; if the subject survives inside them, the cover works
 * everywhere.
 *
 * WHY IT IS GENERATED WIDE-ISH AND THEN CROPPED
 * ---------------------------------------------
 * 1640x856 is 1.92:1, which is outside what this model composes well — ask it
 * directly and you get a smeared panorama or a subject repeated across the
 * frame. It is generated at 1344x768 (a ratio the model handles) and cropped
 * down, which costs some height and produces a far better drawing.
 */
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import sharp from 'sharp';
import { generate, waitForApi, isUp, apiBase } from './lib/image-api.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = join(ROOT, 'social-exports/covers');

const GEN_W = 1344;
const GEN_H = 768;
const OUT_W = 1640;
const OUT_H = 856;

/** The wide sibling of the post-art style. Same hand, landscape, more air. */
const STYLE =
  'Hand-drawn colored pencil illustration on warm off-white paper, in the style of a ' +
  'vintage botanical field guide plate or a seed catalogue engraving. Visible pencil grain ' +
  'and cross-hatching, confident slightly imperfect linework, soft muted natural palette of ' +
  'sage and olive greens, terracotta, ochre and soft brown, gentle warm light. ' +
  'An ordinary domestic garden: timber raised beds, terracotta and plastic pots, a plain ' +
  'kitchen garden. Modest and lived-in, not a manicured estate or a magazine garden. ' +
  'Wide horizontal panoramic composition with generous open sky or empty space across the top, ' +
  'the interest spread evenly along the width rather than crowded into one side. ' +
  'No text, no lettering, no numbers, no signage, no watermark, no logos, no border, no frame.';

const NO_PEOPLE = ' Nobody in the drawing: no people, no hands, no fingers, no faces.';

const WITH_PEOPLE =
  ' A single figure at a middle distance, small in the frame, seen from behind, wearing a ' +
  'broad-brimmed sun hat, face turned away and not visible, hands not close to the viewer.';

const NEGATIVE_BASE =
  'photograph, photorealistic, 3d render, cgi, digital painting, anime, cartoon, ' +
  'vector art, flat illustration, clip art, ' +
  'text, lettering, numbers, watermark, logo, signage, border, frame, ' +
  'oversaturated, neon, glossy, plastic, duplicated subject, repeated pattern, collage';

const NEG_NO_PEOPLE = ', person, people, hand, hands, fingers, face, human figure';
const NEG_WITH_PEOPLE =
  ', portrait, close-up face, facial features, looking at viewer, close-up hands, ' +
  'detailed fingers, deformed hands, extra fingers, extra limbs, crowd, group of people';

const arg = (n) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

const name = arg('name');
const subject = arg('subject');
if (!name || !subject) {
  console.error('usage: gen-cover.mjs --name <slug> --subject "<the scene>" [--seed N] [--people] [--wait]');
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

console.log(`[${name}] drawing at ${GEN_W}x${GEN_H}…${people ? ' (people allowed — check the anatomy)' : ''}`);
const buf = await generate({
  prompt: `${subject}. ${STYLE}${people ? WITH_PEOPLE : NO_PEOPLE}`,
  negativePrompt: NEGATIVE_BASE + (people ? NEG_WITH_PEOPLE : NEG_NO_PEOPLE),
  quality: 'max',
  width: GEN_W,
  height: GEN_H,
  realism: false,
  seed: arg('seed') ? Number(arg('seed')) : undefined,
});

mkdirSync(OUT, { recursive: true });

// 1.75:1 -> 1.92:1. Crop height from the centre, then scale up to the exact size.
const cover = await sharp(buf)
  .resize(OUT_W, OUT_H, { fit: 'cover', position: 'centre' })
  .png()
  .toFile(join(OUT, `${name}.png`));

// --- the safe-area preview -------------------------------------------------
const MOBILE_W = 1090;
const mx = Math.round((OUT_W - MOBILE_W) / 2);
const AV = 320;
const overlay = Buffer.from(`<svg width="${OUT_W}" height="${OUT_H}">
  <rect x="0" y="0" width="${mx}" height="${OUT_H}" fill="#A03F2A" opacity="0.42"/>
  <rect x="${OUT_W - mx}" y="0" width="${mx}" height="${OUT_H}" fill="#A03F2A" opacity="0.42"/>
  <rect x="${mx}" y="0" width="${MOBILE_W}" height="${OUT_H}" fill="none" stroke="#A03F2A" stroke-width="4" stroke-dasharray="16 10"/>
  <circle cx="${mx + 40 + AV / 2}" cy="${OUT_H - 40}" r="${AV / 2}" fill="#16180F" opacity="0.55"/>
  <circle cx="${mx + 40 + AV / 2}" cy="${OUT_H - 40}" r="${AV / 2}" fill="none" stroke="#16180F" stroke-width="4"/>
</svg>`);

await sharp(join(OUT, `${name}.png`))
  .composite([{ input: overlay, top: 0, left: 0 }])
  .png()
  .toFile(join(OUT, `${name}-safe.png`));

console.log(`[${name}] wrote ${name}.png (${OUT_W}x${OUT_H}) and ${name}-safe.png to social-exports/covers/`);
console.log('  Judge it on -safe.png: the shaded bands are cut off on mobile, the dark');
console.log('  circle is where the profile picture sits on desktop.');
