#!/usr/bin/env node
/**
 * Generate one reusable colored-pencil icon for the infographic library.
 *
 *   node scripts/gen-icon.mjs --slug tomato-plant --subject "a single tomato plant in a pot, three ripe red tomatoes visible, a few yellow flowers"
 *
 * Writes public/assets/icons/<slug>.png — square, colored-pencil illustration
 * style, on a plain white background. White background is deliberate: the
 * infographic canvas (scripts/lib/infographic.mjs) is also plain white, so
 * icons composite with no visible edge or box, matching the reference look
 * (icons integrated directly into the page rather than boxed).
 *
 * Icons are generated ONCE and reused across every infographic post that
 * needs that subject — see public/assets/icons/README.md for the library
 * list. Regenerate a single icon only if it comes back botanically wrong.
 *
 * Runs on the local image-api (see scripts/lib/image-api.mjs) — no Higgsfield
 * credits are spent. The PC has to be on; pass --wait to block until it is,
 * which is what the unattended daily routine does.
 *
 * Every generation is checked before it is written: a blank canvas and a
 * subject that bleeds into the corners are both silent failures that only
 * show up once the icon is already composited into a published image.
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import sharp from 'sharp';
import { generate, waitForApi, isUp, apiBase } from './lib/image-api.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = join(ROOT, 'public/assets/icons');

/**
 * The icon house style. Do not change casually — every icon in the library
 * has to look like it was drawn by the same hand for the grid to read as one
 * system rather than a collage.
 */
export const STYLE =
  'Hand-drawn colored pencil illustration, the exact style of a botanical field guide sketch. ' +
  'Visible pencil texture and cross-hatching, soft natural colors, slightly imperfect confident linework. ' +
  'Single centered subject filling most of the frame, plenty of even white space around it. ' +
  'Plain solid white background, no shadow, no ground line, no border, no frame. ' +
  'No glow, no halo, no coloured wash or gradient behind the subject — the background ' +
  'must be uniform pure white right to the edges. ' +
  'Square composition. No text, no lettering, no numbers, no watermark.';

/**
 * Reject a generation before it reaches the library.
 *
 * - `blank` catches an all-white or near-uniform canvas, which the model
 *   occasionally returns and which composites as an invisible icon.
 * - `bleed` catches a subject running to the edges. The library's look depends
 *   on even white margin, and an edge-to-edge drawing reads as a photo tile
 *   dropped into the grid.
 */
export async function inspectIcon(buf) {
  const img = sharp(buf);
  const { width, height } = await img.metadata();
  const { channels } = await img.stats();
  const spread = Math.max(...channels.map((c) => c.stdev));

  // If trimming white leaves something nearly as big as the canvas, the
  // drawing is touching the edges.
  //
  // Note: there is deliberately NO check on how white the background inside
  // the trimmed box is. It was tried, on the theory that a glow behind the
  // subject would composite as a visible tile on the card. Zooming into a
  // rendered infographic showed no such tile — the multiply composite in
  // warmIconCache already lands the background exactly on the panel colour —
  // and the check rejected good icons whose subject legitimately reaches the
  // corners of its own bounding box, burning a minute of GPU time per retry.
  const trimmed = await sharp(buf).trim({ threshold: 12 }).toBuffer({ resolveWithObject: true });
  const coverW = trimmed.info.width / width;
  const coverH = trimmed.info.height / height;

  return {
    width,
    height,
    spread,
    coverW,
    coverH,
    blank: spread < 6,
    bleed: coverW > 0.97 || coverH > 0.97,
    ok: spread >= 6 && coverW <= 0.97 && coverH <= 0.97,
  };
}

/** Generate one icon, retrying while the result fails inspection. */
export async function makeIcon({ slug, subject, attempts = 3, log = console.log }) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    const buf = await generate({
      prompt: `${subject}. ${STYLE}`,
      quality: 'max',
      width: 1024,
      height: 1024,
      realism: false,
    });
    const check = await inspectIcon(buf);
    last = check;
    if (check.ok) {
      log(`[icon:${slug}] ok (spread ${check.spread.toFixed(1)}, coverage ${(check.coverW * 100).toFixed(0)}x${(check.coverH * 100).toFixed(0)}%)`);
      return buf;
    }
    log(`[icon:${slug}] attempt ${i} rejected: ${check.blank ? 'blank canvas' : 'subject bleeds to the edge'}`);
  }
  throw new Error(`icon "${slug}" failed inspection after ${attempts} attempts (${JSON.stringify(last)})`);
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

// Only run the CLI when invoked directly — the daily routine imports makeIcon.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const slug = arg('slug');
  const subject = arg('subject');
  const force = process.argv.includes('--force');

  if (!slug || !subject) {
    console.error('usage: gen-icon.mjs --slug <slug> --subject "<what the icon depicts>" [--wait] [--force]');
    process.exit(1);
  }

  const dest = join(OUT, `${slug}.png`);
  if (existsSync(dest) && !force) {
    console.log(`[icon:${slug}] already in the library — pass --force to regenerate`);
    process.exit(0);
  }

  if (process.argv.includes('--wait')) {
    if (!(await waitForApi())) process.exit(1);
  } else if (!(await isUp())) {
    console.error(`image-api at ${apiBase()} is not reachable. Turn the PC on, or pass --wait.`);
    process.exit(1);
  }

  console.log(`[icon:${slug}] generating…`);
  const buf = await makeIcon({ slug, subject });
  mkdirSync(OUT, { recursive: true });
  writeFileSync(dest, buf);
  console.log(`[icon:${slug}] wrote public/assets/icons/${slug}.png`);
}
