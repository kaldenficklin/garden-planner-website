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
 * Requires the `higgsfield` CLI, authenticated (`higgsfield auth login`).
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = join(ROOT, 'public/assets/icons');

/**
 * The icon house style. Do not change casually — every icon in the library
 * has to look like it was drawn by the same hand for the grid to read as one
 * system rather than a collage.
 */
const STYLE =
  'Hand-drawn colored pencil illustration, the exact style of a botanical field guide sketch. ' +
  'Visible pencil texture and cross-hatching, soft natural colors, slightly imperfect confident linework. ' +
  'Single centered subject filling most of the frame, plenty of even white space around it. ' +
  'Plain solid white background, no shadow, no ground line, no border, no frame. ' +
  'Square composition. No text, no lettering, no numbers, no watermark.';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const slug = arg('slug');
const subject = arg('subject');

if (!slug || !subject) {
  console.error('usage: gen-icon.mjs --slug <slug> --subject "<what the icon depicts>"');
  process.exit(1);
}

const prompt = `${subject}. ${STYLE}`;

console.log(`[icon:${slug}] generating…`);
const out = execFileSync(
  'higgsfield',
  [
    'generate', 'create', 'gpt_image_2',
    '--aspect_ratio', '1:1',
    '--resolution', '1k',
    '--quality', 'high',
    '--wait', '--wait-timeout', '10m',
    '--prompt', prompt,
  ],
  { encoding: 'utf8', maxBuffer: 1024 * 1024 }
);

const url = out.trim().split(/\s+/).filter((t) => t.startsWith('http')).pop();
if (!url) {
  console.error('no image URL in CLI output:\n' + out);
  process.exit(1);
}

console.log(`[icon:${slug}] downloading…`);
const res = await fetch(url);
if (!res.ok) {
  console.error(`download failed: ${res.status}`);
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, `${slug}.png`), Buffer.from(await res.arrayBuffer()));
console.log(`[icon:${slug}] wrote public/assets/icons/${slug}.png`);
