#!/usr/bin/env node
/**
 * Compose an infographic image from a JSON spec and write it to
 * public/assets/blog/<slug>-infographic.jpg.
 *
 *   node scripts/gen-infographic.mjs --slug 6-tomato-watering-mistakes --spec /path/to/spec.json
 *
 * Spec JSON shape:
 *   {
 *     "layout": "mistakes" | "ranked",
 *     "eyebrow": "CONSISTENCY MATTERS",
 *     "title": "6 Tomato Watering Mistakes",
 *     "ctaText": "Get the full watering guide in Garden Pro Planner",
 *     "items": [ ... see scripts/lib/infographic.mjs for the row shape ... ]
 *   }
 *
 * No Higgsfield credits are spent here — this only composites text and the
 * pre-generated icons from public/assets/icons/ (see scripts/gen-icon.mjs).
 * Every icon slug referenced in the spec must already exist in that folder.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import sharp from 'sharp';
import { buildMistakesInfographic, buildRankedInfographic, renderPng, warmIconCache } from './lib/infographic.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = join(ROOT, 'public/assets/blog');
const ICONS_DIR = join(ROOT, 'public/assets/icons');

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const slug = arg('slug');
const specPath = arg('spec');
if (!slug || !specPath) {
  console.error('usage: gen-infographic.mjs --slug <slug> --spec <path-to-spec.json>');
  process.exit(1);
}

const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const { layout, eyebrow, title, ctaText, items } = spec;

if (!['mistakes', 'ranked'].includes(layout)) {
  console.error(`spec.layout must be "mistakes" or "ranked", got "${layout}"`);
  process.exit(1);
}

// Fail fast and clearly if an icon is missing, rather than letting resvg
// silently drop a broken <image> tag.
const iconSlugs = new Set(items.map((it) => it.icon));
if (layout === 'mistakes') iconSlugs.add('checkmark');
const missing = [...iconSlugs].filter((s) => !existsSync(join(ICONS_DIR, `${s}.png`)));
if (missing.length) {
  console.error(`missing icon(s) in public/assets/icons/: ${missing.join(', ')}`);
  console.error('generate them first with scripts/gen-icon.mjs');
  process.exit(1);
}

await warmIconCache(iconSlugs);

const svg = layout === 'mistakes'
  ? buildMistakesInfographic({ eyebrow, title, items, ctaText })
  : buildRankedInfographic({ eyebrow, title, items, ctaText });

const png = renderPng(svg);

mkdirSync(OUT, { recursive: true });
const outPath = join(OUT, `${slug}-infographic.jpg`);
await sharp(png).jpeg({ quality: 88, mozjpeg: true }).toFile(outPath);

console.log(`wrote public/assets/blog/${slug}-infographic.jpg`);
console.log(`
Add to the post frontmatter:

type: "infographic"
infographicLayout: "${layout}"
infographicImage: "/assets/blog/${slug}-infographic.jpg"
`);
