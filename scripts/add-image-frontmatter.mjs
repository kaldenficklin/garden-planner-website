#!/usr/bin/env node
/**
 * One-off: add image / imageAlt / pinImage / pinTitle to the posts that were
 * written before the image pipeline existed. Idempotent — skips any post that
 * already has an `image:` line. New posts get these lines from
 * scripts/gen-post-image.mjs instead.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'src/content/blog');

const POSTS = {
  'how-to-get-rid-of-tomato-hornworms-naturally': {
    alt: 'A large green hornworm caterpillar on a tomato stem stripped bare of its leaves, with dark droppings on the leaf below.',
  },
  'how-to-find-your-frost-dates': {
    alt: 'Frost-covered kale and chard in a vegetable bed at sunrise.',
  },
  'vegetables-that-are-secretly-fruits': {
    alt: 'Tomatoes, a cucumber, zucchini, peppers and an eggplant on a wooden table, several sliced open to show their seeds.',
    pinTitle: 'The Vegetables That Are Secretly Fruits',
  },
  'how-to-get-rid-of-aphids-naturally': {
    alt: 'A dense cluster of small green aphids on a curled plant stem, with ants moving among them.',
  },
  'how-to-get-rid-of-squash-bugs-naturally': {
    alt: 'The underside of a squash leaf showing a cluster of bronze squash bug eggs in the V between two veins.',
  },
  'why-zucchini-flowers-but-no-fruit': {
    alt: 'An open yellow female zucchini flower with a small immature squash swelling behind the petals.',
    pinTitle: 'Why Your Zucchini Flowers But Never Makes Squash',
  },
  'black-walnut-tree-toxic-to-vegetable-gardens': {
    alt: 'A large black walnut tree beside a vegetable bed of wilting, yellowing tomato plants.',
    pinTitle: "The Tree That's Quietly Poisoning Your Garden",
  },
  'companion-planting-for-tomatoes': {
    alt: 'Staked tomato plants interplanted with basil, with orange marigolds bordering the front of the bed.',
    pinTitle: 'Companion Planting for Tomatoes',
  },
  'container-vegetable-gardening-what-actually-grows-well-in-pots': {
    alt: 'A sunny patio corner with pots of lettuce, a fruiting pepper plant, basil and a compact patio tomato.',
    pinTitle: 'What Actually Grows Well in Pots',
  },
  'how-often-to-water-a-vegetable-garden': {
    alt: 'Water from a watering can soaking into dark soil at the base of leafy vegetables mulched with straw.',
  },
  'succession-planting-guide': {
    alt: 'A raised bed half cleared of a spent crop, with a row of fresh seedlings transplanted into the other half.',
    pinTitle: 'Keep Your Garden Producing All Summer',
  },
  'when-to-start-tomato-seeds-indoors': {
    alt: 'A tray of young stocky tomato seedlings growing under a grow light indoors.',
    pinTitle: 'When to Start Tomato Seeds Indoors',
  },
};

const yaml = (s) => `"${s.replace(/"/g, '\\"')}"`;
let changed = 0;

for (const [slug, meta] of Object.entries(POSTS)) {
  const file = join(BLOG, `${slug}.md`);
  if (!existsSync(file)) {
    console.warn(`skip (no post):   ${slug}`);
    continue;
  }
  if (!existsSync(join(ROOT, 'public/assets/blog', `${slug}-hero.jpg`))) {
    console.warn(`skip (no image):  ${slug}`);
    continue;
  }
  const src = readFileSync(file, 'utf8');
  if (/^image:/m.test(src)) {
    console.log(`skip (has image): ${slug}`);
    continue;
  }

  const lines = [
    `image: ${yaml(`/assets/blog/${slug}-hero.jpg`)}`,
    `imageAlt: ${yaml(meta.alt)}`,
    `pinImage: ${yaml(`/assets/blog/${slug}-pin.jpg`)}`,
    ...(meta.pinTitle ? [`pinTitle: ${yaml(meta.pinTitle)}`] : []),
  ].join('\n');

  // Insert immediately above the `draft:` line inside the frontmatter block.
  const out = src.replace(/^draft:/m, `${lines}\ndraft:`);
  if (out === src) {
    console.warn(`skip (no draft:): ${slug}`);
    continue;
  }
  writeFileSync(file, out);
  console.log(`updated:          ${slug}`);
  changed++;
}

console.log(`\n${changed} post(s) updated.`);
